/**
 * publishProductWorker.ts
 *
 * Database-polling scheduler that processes scheduled product-publish jobs.
 * Replaces the previous BullMQ-based approach to eliminate Redis dependency
 * and guarantee job survival across server restarts.
 *
 * Run as a standalone process alongside the main Remix server:
 *
 *   npm run worker       — production
 *   npm run worker:dev   — development with hot-reload (tsx watch)
 *
 * How it works:
 *   1. On startup, immediately processes any overdue SCHEDULED jobs.
 *   2. Polls the database every POLL_INTERVAL_MS for due jobs.
 *   3. For each due job, marks it PROCESSING, calls Shopify API, then
 *      marks it PUBLISHED or FAILED.
 *   4. Jobs stuck in PROCESSING for > STALE_TIMEOUT_MS are reset to SCHEDULED
 *      (handles worker crashes mid-execution).
 */

import { PrismaClient } from "@prisma/client";
import { createServer } from "node:http";

// Render Web Services require an open port for health checks.
// This minimal server satisfies the port scanner without affecting worker logic.
const PORT = process.env.PORT || 10000;
createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("");
}).listen(Number(PORT), "0.0.0.0", () => {
  console.log(`[Scheduler] Health-check server listening on 0.0.0.0:${PORT}`);
});

const prisma = new PrismaClient();

// Poll every 60 seconds
const POLL_INTERVAL_MS = 60 * 1000;

// If a job has been PROCESSING for more than 5 minutes, consider it stale
const STALE_TIMEOUT_MS = 5 * 60 * 1000;

// Shopify Admin API version — override via SHOPIFY_API_VERSION env var
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2025-10";

// Maximum number of jobs to process per poll cycle
const BATCH_SIZE = 10;

// Log a heartbeat every N poll cycles (~10 min at 60s interval)
const HEARTBEAT_EVERY = 10;
let pollCount = 0;

/**
 * Atomically claims the next due SCHEDULED job by setting its status to PROCESSING
 * in a single SQL statement. This prevents race conditions when multiple workers
 * or overlapping poll cycles try to pick up the same job.
 *
 * Returns null when no more due jobs remain.
 */
async function claimNextJob() {
  // UPDATE ... WHERE + RETURNING is atomic in PostgreSQL.
  // Only one concurrent caller can claim a given row.
  // FOR UPDATE SKIP LOCKED prevents deadlocks under concurrent workers.
  try {
    const rows = await prisma.$queryRaw<
      {
        id: string;
        shop: string;
        productId: string;
        productTitle: string;
        accessToken: string;
      }[]
    >`
      UPDATE "ScheduledPublish"
      SET "status" = 'PROCESSING', "updatedAt" = NOW()
      WHERE id = (
        SELECT id FROM "ScheduledPublish"
        WHERE "status" = 'SCHEDULED' AND "scheduledAt" <= NOW()
        ORDER BY "scheduledAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, shop, "productId", "productTitle", "accessToken"
    `;

    if (rows.length > 0) {
      console.log(
        `[Scheduler] Claimed job ${rows[0].id} (product: ${rows[0].productId})`,
      );
    }

    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error(
      "[Scheduler] claimNextJob failed:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

/**
 * Resets jobs stuck in PROCESSING state (from a previous crash) back to SCHEDULED.
 */
async function resetStaleJobs() {
  const staleThreshold = new Date(Date.now() - STALE_TIMEOUT_MS);

  const { count } = await prisma.scheduledPublish.updateMany({
    where: {
      status: "PROCESSING",
      updatedAt: { lt: staleThreshold },
    },
    data: {
      status: "SCHEDULED",
    },
  });

  if (count > 0) {
    console.log(
      `[Scheduler] Reset ${count} stale PROCESSING job(s) back to SCHEDULED`,
    );
  }
}

/**
 * Calls the Shopify Admin GraphQL API to change a product's status to ACTIVE.
 */
async function publishProductOnShopify(
  shop: string,
  accessToken: string,
  productGid: string,
): Promise<void> {
  const response = await fetch(
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        query: `
          mutation publishProduct($id: ID!) {
            productUpdate(input: { id: $id, status: ACTIVE }) {
              product {
                id
                status
                publishedAt
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: { id: productGid },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Shopify GraphQL API returned ${response.status}: ${errorBody}`,
    );
  }

  const json = await response.json();

  const userErrors = json?.data?.productUpdate?.userErrors as
    | { field: string; message: string }[]
    | undefined;

  if (userErrors && userErrors.length > 0) {
    throw new Error(
      `Shopify productUpdate failed: ${userErrors.map((e: { message: string }) => e.message).join(", ")}`,
    );
  }

  const product = json?.data?.productUpdate?.product as
    | { id: string; status: string; publishedAt: string | null }
    | undefined;

  if (!product || product.status !== "ACTIVE") {
    throw new Error(
      `Product was not activated on Shopify (status: ${product?.status ?? "unknown"})`,
    );
  }
}

/**
 * Checks if a product is already ACTIVE on Shopify (e.g., manually published
 * or published by a previous attempt whose DB update failed).
 */
async function isProductAlreadyActive(
  shop: string,
  accessToken: string,
  productGid: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          query: `query checkProductStatus($id: ID!) { product(id: $id) { status } }`,
          variables: { id: productGid },
        }),
      },
    );

    if (!response.ok) return false;

    const json = await response.json();
    return json?.data?.product?.status === "ACTIVE";
  } catch {
    // If the check fails, proceed with the publish attempt
    return false;
  }
}

/**
 * Processes a single scheduled publish job with full error handling.
 */
async function executePublishJob(job: {
  id: string;
  shop: string;
  productId: string;
  productTitle: string;
  accessToken: string;
}) {
  console.log(
    `[Scheduler] Executing job ${job.id} — product ${job.productId} for shop ${job.shop}`,
  );

  // Job is already PROCESSING (claimed atomically by claimNextJob)
  try {
    // Pre-flight: if the product was already published (e.g., manual publish, or
    // previous attempt succeeded but DB update failed), skip the API call.
    const alreadyActive = await isProductAlreadyActive(
      job.shop,
      job.accessToken,
      job.productId,
    );

    if (alreadyActive) {
      console.log(
        `[Scheduler] Product ${job.productId} is already ACTIVE on Shopify — marking as PUBLISHED`,
      );
    } else {
      // Call the Shopify API to publish the product
      await publishProductOnShopify(job.shop, job.accessToken, job.productId);
    }

    // Mark as PUBLISHED
    await prisma.scheduledPublish.update({
      where: { id: job.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        errorMessage: null,
      },
    });

    console.log(
      `[Scheduler] ✅ Successfully published product ${job.productId} for shop ${job.shop}`,
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    console.error(`[Scheduler] ❌ Job ${job.id} failed: ${errorMessage}`);

    await prisma.scheduledPublish
      .update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          errorMessage,
        },
      })
      .catch((dbErr) =>
        console.error("[Scheduler] Failed to update job status:", dbErr),
      );
  }
}

/**
 * Single poll cycle: reset stale jobs, then process all due jobs.
 */
async function pollAndProcess() {
  try {
    pollCount++;

    // Periodic heartbeat so logs confirm the worker is alive
    if (pollCount % HEARTBEAT_EVERY === 0) {
      const pending = await prisma.scheduledPublish.count({
        where: { status: "SCHEDULED" },
      });
      console.log(
        `[Scheduler] ♥ Heartbeat — poll #${pollCount}, ${pending} pending job(s)`,
      );
    }

    // Reset any jobs stuck from a previous crash
    await resetStaleJobs();

    // Claim and process due jobs one at a time (atomic, no duplicates)
    let processed = 0;
    let job = await claimNextJob();

    while (job && processed < BATCH_SIZE) {
      processed++;
      await executePublishJob(job);
      job = await claimNextJob();
    }

    if (processed > 0) {
      console.log(`[Scheduler] Processed ${processed} job(s) this cycle`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Scheduler] Poll error: ${message}`);
  }
}

/**
 * Starts the polling scheduler.
 */
async function startScheduler() {
  console.log("[Scheduler] 🚀 Starting polling scheduler...");
  console.log(`[Scheduler] Poll interval: ${POLL_INTERVAL_MS / 1000}s`);
  console.log(`[Scheduler] Stale job timeout: ${STALE_TIMEOUT_MS / 1000}s`);
  console.log(`[Scheduler] Shopify API version: ${SHOPIFY_API_VERSION}`);

  // Immediately process any overdue jobs from past downtime
  console.log("[Scheduler] Running initial poll for overdue jobs...");
  await pollAndProcess();

  // Start the polling loop
  const intervalId = setInterval(pollAndProcess, POLL_INTERVAL_MS);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[Scheduler] Received ${signal} — shutting down gracefully...`);
    clearInterval(intervalId);
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// Catch unhandled rejections so the process doesn't die silently
process.on("unhandledRejection", (reason) => {
  console.error("[Scheduler] Unhandled rejection:", reason);
});

// --- Entry point ---
startScheduler().catch((err) => {
  console.error("[Scheduler] Fatal startup error:", err);
  process.exit(1);
});
