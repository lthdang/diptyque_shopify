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
 * Extracts the numeric ID from a Shopify GID.
 * Example: "gid://shopify/Product/1234567890" → "1234567890"
 */
function extractNumericId(gid: string): string {
  const parts = gid.split("/");
  return parts[parts.length - 1];
}

/**
 * Retrieves the shop’s offline access token from the Session table.
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
 * Calls the Shopify Admin REST API to publish a product.
 * REST is preferred here over GraphQL’s publishablePublish because it does not
 * require resolving a publicationId — setting published=true publishes to all
 * active sales channels by default.
 */
async function publishProductOnShopify(
  shop: string,
  accessToken: string,
  productGid: string,
): Promise<void> {
  const numericId = extractNumericId(productGid);

  const response = await fetch(
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/products/${numericId}.json`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        product: {
          id: Number(numericId),
          // Set published=true to make the product visible on all active sales channels
          published: true,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Shopify API returned ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  const publishedAt = result?.product?.published_at;

  if (!publishedAt) {
    throw new Error(
      "Product was not published successfully on Shopify (published_at is null)",
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
