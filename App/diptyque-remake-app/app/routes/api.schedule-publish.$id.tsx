import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

/**
 * DELETE /api/schedule-publish/:id
 *
 * Cancels a pending schedule by marking the DB record as CANCELLED.
 * The polling worker will skip CANCELLED records.
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

  // --- Mark the DB record as CANCELLED ---
  // The polling worker will skip records with status !== 'SCHEDULED'
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
