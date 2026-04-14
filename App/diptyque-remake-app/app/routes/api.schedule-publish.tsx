import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { getPublishQueue } from "../jobs/queue.server";

/**
 * POST /api/schedule-publish
 *
 * Accepts a product scheduling request, persists it to the database,
 * and enqueues a delayed BullMQ job that will publish the product at the exact time.
 *
 * Request body (JSON):
 * {
 *   productId:     string  — Shopify GID (gid://shopify/Product/xxx)
 *   productTitle:  string  — Product title (stored for display in the UI)
 *   productImage?: string  — Featured image URL
 *   productHandle?: string — Product handle
 *   scheduledAt:   string  — ISO 8601 datetime (UTC)
 * }
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  // Authenticate the request and get the active shop session
  const { session, admin } = await authenticate.admin(request);

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: {
    productId: string;
    productTitle: string;
    productImage?: string;
    productHandle?: string;
    scheduledAt: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { productId, productTitle, productImage, productHandle, scheduledAt } =
    body;

  // --- Validate required fields ---
  if (!productId || !productTitle || !scheduledAt) {
    return Response.json(
      {
        error: "Missing required fields: productId, productTitle, scheduledAt",
      },
      { status: 400 },
    );
  }

  const scheduledDate = new Date(scheduledAt);

  // Reject scheduling in the past
  if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return Response.json(
      { error: "scheduledAt must be a valid datetime in the future" },
      { status: 400 },
    );
  }

  // --- Guard: reject scheduling for ACTIVE products (verified server-side) ---
  const productStatusResponse = await admin.graphql(
    `#graphql
    query getProductStatus($id: ID!) {
      product(id: $id) {
        status
      }
    }`,
    { variables: { id: productId } },
  );
  const productStatusJson = await productStatusResponse.json();
  const productStatus = productStatusJson.data?.product?.status;
  if (productStatus === "ACTIVE") {
    return Response.json(
      { error: "This product is already active and does not need scheduling." },
      { status: 422 },
    );
  }

  // --- Guard: prevent duplicate SCHEDULED entries for the same product ---
  const existing = await prisma.scheduledPublish.findFirst({
    where: {
      shop: session.shop,
      productId,
      status: "SCHEDULED",
    },
  });

  if (existing) {
    return Response.json(
      {
        error: "This product already has a pending schedule. Cancel it first.",
      },
      { status: 409 },
    );
  }

  // --- Persist the schedule record to the database ---
  const record = await prisma.scheduledPublish.create({
    data: {
      shop: session.shop,
      productId,
      productTitle,
      productImage: productImage ?? null,
      productHandle: productHandle ?? null,
      scheduledAt: scheduledDate,
      status: "SCHEDULED",
    },
  });

  // --- Enqueue a delayed BullMQ job; BullMQ will fire it at exactly scheduledAt ---
  const delayMs = scheduledDate.getTime() - Date.now();
  const queue = getPublishQueue();

  const job = await queue.add(
    // Human-readable job name for Bull Board monitoring
    `publish:${session.shop}:${productId}`,
    {
      scheduleId: record.id,
      productId,
      shop: session.shop,
    },
    {
      delay: Math.max(delayMs, 0),
      jobId: `schedule-${record.id}`, // Stable ID so we can remove it by ID on cancellation
    },
  );

  // Store the BullMQ job ID so the cancel endpoint can remove it later
  await prisma.scheduledPublish.update({
    where: { id: record.id },
    data: { bullJobId: job.id },
  });

  return Response.json(
    {
      success: true,
      scheduleId: record.id,
      bullJobId: job.id,
      message: `Đã lên lịch đăng sản phẩm "${productTitle}" vào lúc ${scheduledDate.toISOString()}`,
    },
    { status: 201 },
  );
};
