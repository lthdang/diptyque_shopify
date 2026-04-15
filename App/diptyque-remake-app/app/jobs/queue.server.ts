import { Queue } from "bullmq";
import IORedis from "ioredis";

// --- Job payload type shared between the API route (producer) and the worker (consumer) ---
export interface PublishJobData {
  /** ScheduledPublish record ID in the DB — used to update status after execution */
  scheduleId: string;
  /** Shopify GID of the product, e.g. gid://shopify/Product/1234567890 */
  productId: string;
  /** Shop domain, e.g. my-shop.myshopify.com */
  shop: string;
}

// Queue name used consistently between producer and worker
export const PUBLISH_QUEUE_NAME = "product-publish";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// --- Redis connection singleton — reused across queue and worker to avoid extra connections ---
let redisConnection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!redisConnection) {
    redisConnection = new IORedis(REDIS_URL, {
      // Required by BullMQ
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      // Enable TLS when connecting to a rediss:// URL (e.g. Render's internal Redis)
      tls: REDIS_URL.startsWith("rediss://") ? {} : undefined,
    });

    redisConnection.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
    });
  }
  return redisConnection;
}

// --- Queue singleton — prevents multiple Queue instances pointing at the same queue ---
let publishQueueInstance: Queue<PublishJobData> | null = null;

export function getPublishQueue(): Queue<PublishJobData> {
  if (!publishQueueInstance) {
    publishQueueInstance = new Queue<PublishJobData>(PUBLISH_QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        // Keep the last 100 completed jobs for debugging purposes
        removeOnComplete: { count: 100 },
        // Keep the last 200 failed jobs for post-mortem inspection
        removeOnFail: { count: 200 },
        // Retry failed jobs up to 3 times before marking as FAILED
        attempts: 3,
        backoff: {
          type: "exponential",
          // Initial delay of 5 s; grows exponentially (5 s → 25 s → 125 s)
          delay: 5000,
        },
      },
    });
  }
  return publishQueueInstance;
}
