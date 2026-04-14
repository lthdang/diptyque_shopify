import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { getPublishQueue } from "../jobs/queue.server";

/**
 * DELETE /api/schedule-publish/:id
 *
 * Cancels a pending schedule: removes the BullMQ job from the queue
 * so the worker will not publish the product, then marks the DB record CANCELLED.
 *
 * Params:
 *   id — ScheduledPublish record ID in the database
 */
export const action = async ({ request, params }: ActionFunctionArgs) => {
  // Authenticate the request and get the active shop session
  const { session } = await authenticate.admin(request);

  if (request.method !== "DELETE") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const { id } = params;

  if (!id) {
    return Response.json({ error: "Missing schedule ID" }, { status: 400 });
  }

  // --- Fetch the record and verify it belongs to the authenticated shop ---
  const record = await prisma.scheduledPublish.findFirst({
    where: {
      id,
      // Scope to the requesting shop to prevent cross-shop data access
      shop: session.shop,
    },
  });

  if (!record) {
    return Response.json(
      {
        error: "Schedule not found or you do not have permission to cancel it",
      },
      { status: 404 },
    );
  }

  if (record.status !== "SCHEDULED") {
    return Response.json(
      { error: `Cannot cancel a schedule with status "${record.status}"` },
      { status: 400 },
    );
  }

  // --- Remove the BullMQ job so the worker never executes it ---
  if (record.bullJobId) {
    try {
      const queue = getPublishQueue();
      const job = await queue.getJob(record.bullJobId);

      if (job) {
        // Removes the job whether it is waiting, delayed, or paused
        await job.remove();
        console.log(`[API] Removed job ${record.bullJobId} from queue`);
      }
    } catch (err) {
      // Log but continue — the job may have already expired or been removed
      console.warn(
        `[API] Could not remove job ${record.bullJobId} from queue:`,
        err,
      );
    }
  }

  // --- Mark the DB record as CANCELLED ---
  await prisma.scheduledPublish.update({
    where: { id: record.id },
    data: {
      status: "CANCELLED",
      updatedAt: new Date(),
    },
  });

  return Response.json(
    {
      success: true,
      message: `Đã huỷ lịch đăng sản phẩm "${record.productTitle}"`,
    },
    { status: 200 },
  );
};
