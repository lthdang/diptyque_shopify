/**
 * publishProductWorker.ts
 *
 * BullMQ worker that processes delayed product-publish jobs.
 * Run this as a standalone process alongside the main Remix server:
 *
 *   npm run worker       — production
 *   npm run worker:dev   — development with hot-reload (tsx watch)
 */

import { Worker, type Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import {
  PUBLISH_QUEUE_NAME,
  getRedisConnection,
  type PublishJobData,
} from "./queue.server.js";

const prisma = new PrismaClient();

// Shopify Admin API version — override via SHOPIFY_API_VERSION env var if needed
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2025-10";

/**
 * Retrieves the shop's offline access token from the Session table.
 * The worker runs outside the Remix request lifecycle, so it must
 * fetch the token directly from the database rather than from the session store.
 */
async function getAccessToken(shop: string): Promise<string> {
  const session = await prisma.session.findFirst({
    where: {
      shop,
      isOnline: false, // Offline tokens are required for background jobs
      OR: [{ expires: null }, { expires: { gt: new Date() } }],
    },
    orderBy: { expires: "desc" },
    select: { accessToken: true },
  });

  if (!session?.accessToken) {
    throw new Error(`No offline access token found for shop: ${shop}`);
  }

  return session.accessToken;
}

/**
 * Calls the Shopify Admin GraphQL API to change a product's status to ACTIVE.
 * Uses the `productUpdate` mutation which correctly sets status: ACTIVE,
 * making the product visible across all active sales channels.
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
      `Shopify productUpdate failed: ${userErrors.map((e) => e.message).join(", ")}`,
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

// --- Register the worker to listen on the publish queue ---
const worker = new Worker<PublishJobData>(
  PUBLISH_QUEUE_NAME,
  async (job: Job<PublishJobData>) => {
    const { scheduleId, productId, shop } = job.data;

    console.log(
      `[Worker] Processing job ${job.id} — product ${productId} for shop ${shop}`,
    );

    // Step 1: Retrieve the shop’s offline access token from the DB
    const accessToken = await getAccessToken(shop);

    // Step 2: Call the Shopify API to publish the product
    await publishProductOnShopify(shop, accessToken, productId);

    // Step 3: Update the ScheduledPublish record to PUBLISHED
    await prisma.scheduledPublish.update({
      where: { id: scheduleId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        errorMessage: null,
        updatedAt: new Date(),
      },
    });

    console.log(
      `[Worker] ✅ Successfully published product ${productId} for shop ${shop}`,
    );
  },
  {
    connection: getRedisConnection(),
    // Process up to 5 jobs in parallel
    concurrency: 5,
  },
);

// --- Event handlers for job lifecycle ---
worker.on("failed", async (job, error) => {
  console.error(
    `[Worker] ❌ Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${error.message}`,
  );

  // Only mark as FAILED in the DB after all retry attempts are exhausted
  if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
    await prisma.scheduledPublish
      .update({
        where: { id: job.data.scheduleId },
        data: {
          status: "FAILED",
          errorMessage: error.message,
          updatedAt: new Date(),
        },
      })
      .catch(console.error);
  }
});

worker.on("completed", (job) => {
  console.log(`[Worker] ✅ Job ${job.id} completed`);
});

worker.on("error", (error) => {
  console.error("[Worker] Worker error:", error);
});

// --- Graceful shutdown handlers ---
process.on("SIGTERM", async () => {
  console.log("[Worker] Received SIGTERM — shutting down gracefully...");
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[Worker] Received SIGINT — shutting down gracefully...");
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

console.log(
  "[Worker] 🚀 Worker is running, listening on queue:",
  PUBLISH_QUEUE_NAME,
);

/**
 * Startup reconciliation — runs once 5 s after boot.
 *
 * Handles two scenarios:
 *  A) Worker was offline when the job fired → job is stuck in delayed/waiting,
 *     or BullMQ re-enqueued it and we missed the DB update.
 *  B) Product was manually published in Shopify Admin while the system was down
 *     → Shopify status = ACTIVE but our DB status = SCHEDULED.
 *
 * For every overdue SCHEDULED record, we query Shopify:
 *  - If already ACTIVE → mark DB as PUBLISHED (no re-publish needed).
 *  - If still DRAFT    → immediately re-enqueue the job with delay=0.
 */
async function reconcileOnStartup(): Promise<void> {
  console.log("[Worker] 🔍 Running startup reconciliation...");

  const overdue = await prisma.scheduledPublish.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lt: new Date() },
    },
  });

  if (overdue.length === 0) {
    console.log("[Worker] ✅ No overdue SCHEDULED records found.");
    return;
  }

  console.log(
    `[Worker] Found ${overdue.length} overdue record(s) — checking Shopify status...`,
  );

  const queue = (await import("./queue.server.js")).getPublishQueue();

  for (const record of overdue) {
    try {
      const accessToken = await getAccessToken(record.shop).catch(() => null);
      if (!accessToken) {
        console.warn(
          `[Worker] No access token for ${record.shop} — skipping reconcile for ${record.id}`,
        );
        continue;
      }

      // Check actual product status on Shopify
      const res = await fetch(
        `https://${record.shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({
            query: `query checkProduct($id: ID!) { product(id: $id) { status } }`,
            variables: { id: record.productId },
          }),
        },
      );

      const json = await res.json();
      const shopifyStatus: string | undefined = json?.data?.product?.status;

      if (shopifyStatus === "ACTIVE") {
        // Product is already live — just sync the DB, no re-publish
        await prisma.scheduledPublish.update({
          where: { id: record.id },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
            errorMessage: null,
            updatedAt: new Date(),
          },
        });
        console.log(
          `[Worker] ✅ Reconciled ${record.id} → PUBLISHED (product already ACTIVE on Shopify)`,
        );
      } else {
        // Product still DRAFT — re-enqueue immediately for processing
        await queue
          .add(
            `reconcile:${record.shop}:${record.productId}`,
            {
              scheduleId: record.id,
              productId: record.productId,
              shop: record.shop,
            },
            { delay: 0, jobId: `reconcile-${record.id}` },
          )
          .catch((err: Error) =>
            console.error(
              `[Worker] Failed to re-enqueue ${record.id}:`,
              err.message,
            ),
          );
        console.log(
          `[Worker] 🔁 Re-enqueued ${record.id} (product status: ${shopifyStatus ?? "unknown"})`,
        );
      }
    } catch (err) {
      console.error(
        `[Worker] Reconcile error for ${record.id}:`,
        (err as Error).message,
      );
    }
  }

  console.log("[Worker] 🔍 Reconciliation complete.");
}

// Delay 5 s to let Redis connection settle before querying
setTimeout(reconcileOnStartup, 5_000);
