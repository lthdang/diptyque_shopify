import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData, useRevalidator } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  EmptyState,
  IndexTable,
  InlineStack,
  Layout,
  Modal,
  Page,
  Pagination,
  Spinner,
  Tabs,
  Text,
  TextField,
  Thumbnail,
  Toast,
} from "@shopify/polaris";
import { formatInTimeZone } from "date-fns-tz";

// ─── Type definitions ──────────────────────────────────────────────────────────

interface ShopifyProduct {
  id: string;
  title: string;
  status: string; // "ACTIVE" | "DRAFT" | "ARCHIVED"
  publishedAt: string | null;
  featuredImage: { url: string; altText: string | null } | null;
  handle: string;
  price: string; // first variant price
}

interface ScheduledRecord {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  scheduledAt: string;
  publishedAt: string | null;
  status: string;
  errorMessage: string | null;
}

interface LoaderData {
  products: ShopifyProduct[];
  scheduledItems: ScheduledRecord[];
  shop: string;
  error?: string;
}

// ─── Loader: fetch ALL products + existing scheduled records ──────────────────

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  try {
    const productsResponse = await admin.graphql(`
    #graphql
    query getAllProducts {
      products(first: 250) {
        edges {
          node {
            id
            title
            status
            publishedAt
            handle
            featuredImage {
              url
              altText
            }
            variants(first: 1) {
              edges {
                node {
                  price
                }
              }
            }
          }
        }
      }
    }
  `);

    const productsJson = await productsResponse.json();
    const products: ShopifyProduct[] =
      productsJson.data?.products?.edges?.map(
        (e: {
          node: Omit<ShopifyProduct, "price"> & {
            variants: { edges: { node: { price: string } }[] };
          };
        }) => ({
          id: e.node.id,
          title: e.node.title,
          status: e.node.status,
          publishedAt: e.node.publishedAt ?? null,
          featuredImage: e.node.featuredImage ?? null,
          handle: e.node.handle,
          price: e.node.variants?.edges?.[0]?.node?.price ?? "0.00",
        }),
      ) ?? [];

    const scheduledItems = await prisma.scheduledPublish.findMany({
      where: {
        shop: session.shop,
        status: { in: ["SCHEDULED", "PUBLISHED", "FAILED"] },
      },
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        productId: true,
        productTitle: true,
        productImage: true,
        scheduledAt: true,
        publishedAt: true,
        status: true,
        errorMessage: true,
      },
    });

    return {
      products,
      scheduledItems: scheduledItems.map(
        (item: (typeof scheduledItems)[number]) => ({
          ...item,
          scheduledAt: item.scheduledAt.toISOString(),
          publishedAt:
            (
              item as unknown as { publishedAt: Date | null }
            ).publishedAt?.toISOString() ?? null,
        }),
      ),
      shop: session.shop,
    };
  } catch (err) {
    console.error("[scheduled-publish loader]", err);
    return {
      products: [],
      scheduledItems: [],
      shop: "",
      error: "Failed to load data — please refresh the page.",
    };
  }
};

// ─── Countdown hook ────────────────────────────────────────────────────────────

function useCountdown(targetIso: string | null, onExpire?: () => void): string {
  const [display, setDisplay] = useState("");
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!targetIso) return;
    expiredRef.current = false;

    const update = () => {
      const diff = new Date(targetIso).getTime() - Date.now();
      if (diff <= 0) {
        setDisplay("Publishing soon...");
        // Trigger a single loader revalidation ~5 s after expiry,
        // giving the worker time to process the job and update the DB.
        if (!expiredRef.current) {
          expiredRef.current = true;
          setTimeout(() => onExpire?.(), 5_000);
        }
        return;
      }
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);

      if (d > 0) setDisplay(`${d}d ${h}h ${m}m`);
      else if (h > 0) setDisplay(`${h}h ${m}m ${s}s`);
      else setDisplay(`${m}m ${s}s`);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [targetIso, onExpire]);

  return display;
}

// ─── Countdown cell ────────────────────────────────────────────────────────────

function CountdownCell({
  scheduledAt,
  status,
  onExpire,
}: {
  scheduledAt: string;
  status: string;
  onExpire?: () => void;
}) {
  const countdown = useCountdown(
    status === "SCHEDULED" ? scheduledAt : null,
    onExpire,
  );
  if (status !== "SCHEDULED")
    return (
      <Text as="span" tone="subdued">
        —
      </Text>
    );
  return (
    <Text as="span" tone="caution">
      {countdown || "..."}
    </Text>
  );
}

// ─── Product status badge ──────────────────────────────────────────────────────

function ProductStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE":
      return <Badge tone="success">Active</Badge>;
    case "DRAFT":
      return <Badge tone="warning">Draft</Badge>;
    case "ARCHIVED":
      return <Badge tone="critical">Archived</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

// ─── Queue status badge ────────────────────────────────────────────────────────

function QueueStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "SCHEDULED":
      return <Badge tone="warning">Pending</Badge>;
    case "PUBLISHED":
      return <Badge tone="success">Published</Badge>;
    case "FAILED":
      return <Badge tone="critical">Failed</Badge>;
    case "CANCELLED":
      return <Badge tone="info">Cancelled</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

// ─── Tab filter config ─────────────────────────────────────────────────────────

const STATUS_TABS = [
  { id: "all", content: "All" },
  { id: "active", content: "Active" },
  { id: "draft", content: "Draft" },
  { id: "unpublished", content: "Unpublished" },
] as const;

type TabId = (typeof STATUS_TABS)[number]["id"];

const COLUMN_TITLE = 0;
const COLUMN_STATUS = 1;
const COLUMN_PRICE = 2;
const PAGE_SIZE = 20;
const PLACEHOLDER_IMAGE =
  "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_small.png";

// ─── Main page component ───────────────────────────────────────────────────────

export default function ScheduledPublishPage() {
  const { products, scheduledItems, error } = useLoaderData<LoaderData>();
  const revalidator = useRevalidator();
  const shopify = useAppBridge();

  const scheduleFetcher = useFetcher<{
    success?: boolean;
    error?: string;
    scheduleId?: string;
  }>();
  const cancelFetcher = useFetcher<{ success?: boolean; error?: string }>();

  // Search / filter / sort / pagination
  const [searchValue, setSearchValue] = useState("");
  const [selectedTab, setSelectedTab] = useState<TabId>("all");
  const [sortColumnIndex, setSortColumnIndex] = useState<number>(COLUMN_TITLE);
  const [sortDirection, setSortDirection] = useState<
    "ascending" | "descending"
  >("ascending");
  const [currentPage, setCurrentPage] = useState(1);

  // Schedule modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(
    null,
  );
  const [scheduledDatetime, setScheduledDatetime] = useState("");

  // Toast
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState(false);

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState<ScheduledRecord | null>(
    null,
  );
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const prevScheduledRef = useRef<Set<string>>(new Set());

  const showToast = useCallback((message: string, isError = false) => {
    setToastMessage(message);
    setToastError(isError);
    setToastActive(true);
  }, []);

  // Detect newly PUBLISHED products
  useEffect(() => {
    const prev = prevScheduledRef.current;
    scheduledItems.forEach((item) => {
      if (item.status === "PUBLISHED" && prev.has(item.productId)) {
        showToast(`Product "${item.productTitle}" has been published!`);
        shopify.toast.show(`"${item.productTitle}" is now live!`, {
          duration: 5000,
        });
      }
    });
    prevScheduledRef.current = new Set(
      scheduledItems
        .filter((i) => i.status === "SCHEDULED")
        .map((i) => i.productId),
    );
  }, [scheduledItems, showToast, shopify]);

  // Auto-refresh every 30 s when pending schedules exist
  useEffect(() => {
    if (!scheduledItems.some((i) => i.status === "SCHEDULED")) return;
    const interval = setInterval(() => revalidator.revalidate(), 30_000);
    return () => clearInterval(interval);
  }, [scheduledItems, revalidator]);

  // Handle schedule POST response
  useEffect(() => {
    if (scheduleFetcher.state !== "idle" || !scheduleFetcher.data) return;
    if (scheduleFetcher.data.success) {
      showToast("Product scheduled successfully!");
      setModalOpen(false);
      setSelectedProduct(null);
      setScheduledDatetime("");
      revalidator.revalidate();
    } else if (scheduleFetcher.data.error) {
      showToast(scheduleFetcher.data.error, true);
    }
  }, [scheduleFetcher.state, scheduleFetcher.data, showToast, revalidator]);

  // Handle cancel DELETE response
  useEffect(() => {
    if (cancelFetcher.state !== "idle" || !cancelFetcher.data) return;
    if (cancelFetcher.data.success) {
      showToast("Schedule cancelled.");
      setCancelModalOpen(false);
      setCancelTarget(null);
      revalidator.revalidate();
    } else if (cancelFetcher.data.error) {
      showToast(cancelFetcher.data.error, true);
    }
  }, [cancelFetcher.state, cancelFetcher.data, showToast, revalidator]);

  const openScheduleModal = (product: ShopifyProduct) => {
    setSelectedProduct(product);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setScheduledDatetime(`${tomorrow.toISOString().slice(0, 10)}T09:00`);
    setModalOpen(true);
  };

  const handleScheduleSubmit = () => {
    if (!selectedProduct || !scheduledDatetime) return;
    const scheduledAt = new Date(scheduledDatetime).toISOString();
    scheduleFetcher.submit(
      {
        productId: selectedProduct.id,
        productTitle: selectedProduct.title,
        productImage: selectedProduct.featuredImage?.url ?? "",
        productHandle: selectedProduct.handle,
        scheduledAt,
      },
      {
        method: "POST",
        action: "/api/schedule-publish",
        encType: "application/json",
      },
    );
  };

  const handleCancelConfirm = () => {
    if (!cancelTarget) return;
    cancelFetcher.submit(
      {},
      {
        method: "DELETE",
        action: `/api/schedule-publish/${cancelTarget.id}`,
        encType: "application/json",
      },
    );
  };

  const scheduledProductIds = useMemo(
    () =>
      new Set(
        scheduledItems
          .filter((i) => i.status === "SCHEDULED")
          .map((i) => i.productId),
      ),
    [scheduledItems],
  );

  // Filter
  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedTab === "active")
      list = list.filter((p) => p.status === "ACTIVE");
    else if (selectedTab === "draft")
      list = list.filter((p) => p.status === "DRAFT");
    else if (selectedTab === "unpublished")
      list = list.filter((p) => p.status !== "ACTIVE");
    if (searchValue.trim()) {
      const lower = searchValue.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(lower));
    }
    return list;
  }, [products, selectedTab, searchValue]);

  // Sort
  const sortedProducts = useMemo(() => {
    const dir = sortDirection === "ascending" ? 1 : -1;
    return [...filteredProducts].sort((a, b) => {
      if (sortColumnIndex === COLUMN_TITLE)
        return a.title.localeCompare(b.title) * dir;
      if (sortColumnIndex === COLUMN_STATUS)
        return a.status.localeCompare(b.status) * dir;
      if (sortColumnIndex === COLUMN_PRICE)
        return (parseFloat(a.price) - parseFloat(b.price)) * dir;
      return 0;
    });
  }, [filteredProducts, sortColumnIndex, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = sortedProducts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  useEffect(() => setCurrentPage(1), [searchValue, selectedTab]);

  const minDatetime = useMemo(() => {
    const d = new Date(Date.now() + 2 * 60_000);
    // Format as local time — datetime-local inputs interpret min/max as local time,
    // NOT UTC. Using toISOString() (UTC) here would set the min 7 hours too early
    // for GMT+7 users, allowing them to select already-past UTC datetimes.
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
      `T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
  }, []);

  const isSubmitting = scheduleFetcher.state !== "idle";
  const isCancelling = cancelFetcher.state !== "idle";

  return (
    <Page
      title="Scheduled Publishing"
      subtitle="Schedule DRAFT products to automatically publish at a specific time"
    >
      <Layout>
        {/* Loader error banner */}
        {error && (
          <Layout.Section>
            <Banner tone="critical" title="Could not load page data">
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Product list */}
        <Layout.Section>
          <Card padding="0">
            <Box
              paddingInlineStart="400"
              paddingInlineEnd="400"
              paddingBlockStart="400"
            >
              <InlineStack align="space-between" blockAlign="center" gap="300">
                <Box width="100%" maxWidth="400px">
                  <TextField
                    label=""
                    labelHidden
                    placeholder="Search products by title..."
                    value={searchValue}
                    onChange={(v) => setSearchValue(v)}
                    autoComplete="off"
                    clearButton
                    onClearButtonClick={() => setSearchValue("")}
                  />
                </Box>
                {revalidator.state === "loading" && (
                  <Box width="20px" minWidth="20px" as="span">
                    <Spinner size="small" />
                  </Box>
                )}
              </InlineStack>
            </Box>

            <Tabs
              tabs={STATUS_TABS.map((t) => ({ ...t }))}
              selected={STATUS_TABS.findIndex((t) => t.id === selectedTab)}
              onSelect={(i) => setSelectedTab(STATUS_TABS[i].id)}
            />

            <IndexTable
              resourceName={{ singular: "product", plural: "products" }}
              itemCount={sortedProducts.length}
              headings={[
                { title: "Product" },
                { title: "Status" },
                { title: "Price" },
                { title: "Published date" },
                { title: "Action" },
              ]}
              selectable={false}
              sortable={[true, true, true, false, false]}
              sortColumnIndex={sortColumnIndex}
              sortDirection={sortDirection}
              onSort={(col, dir) => {
                setSortColumnIndex(col);
                setSortDirection(dir);
              }}
              emptyState={
                <EmptyState
                  heading="No products found"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>
                    {searchValue
                      ? `No products match "${searchValue}".`
                      : "No products in this category."}
                  </p>
                </EmptyState>
              }
            >
              {paginatedProducts.map((product, index) => {
                const isScheduled = scheduledProductIds.has(product.id);
                const canSchedule =
                  product.status === "DRAFT" || product.publishedAt === null;

                return (
                  <IndexTable.Row
                    id={product.id}
                    key={product.id}
                    position={index}
                  >
                    <IndexTable.Cell>
                      <InlineStack gap="300" blockAlign="center">
                        <Box width="40px" minWidth="40px">
                          <Thumbnail
                            source={
                              product.featuredImage?.url ?? PLACEHOLDER_IMAGE
                            }
                            alt={
                              product.featuredImage?.altText ?? product.title
                            }
                            size="small"
                          />
                        </Box>
                        <BlockStack gap="050">
                          <Text as="span" fontWeight="medium">
                            {product.title}
                          </Text>
                          {isScheduled && (
                            <Badge tone="attention">Scheduled</Badge>
                          )}
                        </BlockStack>
                      </InlineStack>
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                      <ProductStatusBadge status={product.status} />
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                      <Text as="span" numeric>
                        ${product.price}
                      </Text>
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                      {product.publishedAt ? (
                        <Text as="span" tone="subdued">
                          {formatInTimeZone(
                            new Date(product.publishedAt),
                            "Asia/Ho_Chi_Minh",
                            "dd/MM/yyyy",
                          )}
                        </Text>
                      ) : (
                        <Text as="span" tone="subdued">
                          Unpublished
                        </Text>
                      )}
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                      {canSchedule ? (
                        <Button
                          size="slim"
                          disabled={isScheduled}
                          onClick={() => openScheduleModal(product)}
                        >
                          {isScheduled ? "Scheduled" : "Schedule"}
                        </Button>
                      ) : (
                        <Text as="span" tone="subdued">
                          Already published
                        </Text>
                      )}
                    </IndexTable.Cell>
                  </IndexTable.Row>
                );
              })}
            </IndexTable>

            {totalPages > 1 && (
              <Box
                paddingBlock="300"
                borderBlockStartWidth="025"
                borderColor="border"
              >
                <InlineStack align="center">
                  <Pagination
                    label={`Page ${safePage} of ${totalPages}`}
                    hasPrevious={safePage > 1}
                    onPrevious={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    hasNext={safePage < totalPages}
                    onNext={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                  />
                </InlineStack>
              </Box>
            )}
          </Card>
        </Layout.Section>

        {/* Scheduled Queue */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Scheduled Queue
                </Text>
                {revalidator.state === "loading" && (
                  <Box width="20px" minWidth="20px" as="span">
                    <Spinner size="small" />
                  </Box>
                )}
              </InlineStack>

              {scheduledItems.length === 0 ? (
                <EmptyState
                  heading="No scheduled publishes"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>
                    Choose a DRAFT product above and schedule it to publish
                    automatically.
                  </p>
                </EmptyState>
              ) : (
                <IndexTable
                  resourceName={{
                    singular: "scheduled item",
                    plural: "scheduled items",
                  }}
                  itemCount={scheduledItems.length}
                  headings={[
                    { title: "Product" },
                    { title: "Scheduled time (GMT+7)" },
                    { title: "Status" },
                    { title: "Published at (GMT+7)" },
                    { title: "Countdown" },
                    { title: "Action" },
                  ]}
                  selectable={false}
                >
                  {scheduledItems.map((item, index) => (
                    <IndexTable.Row id={item.id} key={item.id} position={index}>
                      <IndexTable.Cell>
                        <InlineStack gap="200" blockAlign="center">
                          <Box width="40px" minWidth="40px">
                            <Thumbnail
                              source={item.productImage ?? PLACEHOLDER_IMAGE}
                              alt={item.productTitle}
                              size="small"
                            />
                          </Box>
                          <Text as="span" fontWeight="medium">
                            {item.productTitle}
                          </Text>
                        </InlineStack>
                      </IndexTable.Cell>

                      <IndexTable.Cell>
                        {formatInTimeZone(
                          new Date(item.scheduledAt),
                          "Asia/Ho_Chi_Minh",
                          "dd/MM/yyyy HH:mm",
                        )}
                      </IndexTable.Cell>

                      <IndexTable.Cell>
                        <QueueStatusBadge status={item.status} />
                      </IndexTable.Cell>

                      <IndexTable.Cell>
                        {item.publishedAt ? (
                          <Text as="span" tone="success">
                            {formatInTimeZone(
                              new Date(item.publishedAt),
                              "Asia/Ho_Chi_Minh",
                              "dd/MM/yyyy HH:mm",
                            )}
                          </Text>
                        ) : (
                          <Text as="span" tone="subdued">
                            —
                          </Text>
                        )}
                      </IndexTable.Cell>

                      <IndexTable.Cell>
                        <CountdownCell
                          scheduledAt={item.scheduledAt}
                          status={item.status}
                          onExpire={revalidator.revalidate}
                        />
                      </IndexTable.Cell>

                      <IndexTable.Cell>
                        {item.status === "SCHEDULED" ? (
                          <Button
                            tone="critical"
                            size="slim"
                            onClick={() => {
                              setCancelTarget(item);
                              setCancelModalOpen(true);
                            }}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <Text as="span" tone="subdued">
                            —
                          </Text>
                        )}
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  ))}
                </IndexTable>
              )}

              {scheduledItems.some((i) => i.status === "FAILED") && (
                <Banner tone="warning">
                  Some scheduled publishes failed. Check item details above.
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Notes sidebar */}
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">
                Notes
              </Text>
              <Text as="p" tone="subdued" variant="bodySm">
                • Page auto-refreshes every 30 s while a schedule is pending.
              </Text>
              <Text as="p" tone="subdued" variant="bodySm">
                • The worker process must be running to publish on time.
              </Text>
              <Text as="p" tone="subdued" variant="bodySm">
                • Times are displayed in GMT+7 (Vietnam).
              </Text>
              <Text as="p" tone="subdued" variant="bodySm">
                • Only DRAFT or unpublished products can be scheduled.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Schedule modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Schedule: ${selectedProduct?.title}`}
        primaryAction={{
          content: isSubmitting ? "Saving..." : "Confirm Schedule",
          onAction: handleScheduleSubmit,
          loading: isSubmitting,
          disabled: !scheduledDatetime || isSubmitting,
        }}
        secondaryActions={[
          { content: "Cancel", onAction: () => setModalOpen(false) },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            {selectedProduct?.featuredImage && (
              <InlineStack align="center">
                <Box width="80px" minWidth="80px">
                  <Thumbnail
                    source={selectedProduct.featuredImage.url}
                    alt={selectedProduct.title}
                    size="large"
                  />
                </Box>
              </InlineStack>
            )}

            <Text as="p" tone="subdued">
              Product: <strong>{selectedProduct?.title}</strong>
            </Text>

            <TextField
              label="Publish at (your local time)"
              type="datetime-local"
              value={scheduledDatetime}
              onChange={setScheduledDatetime}
              min={minDatetime}
              autoComplete="off"
            />

            {scheduledDatetime && (
              <Banner tone="info">
                <p>
                  Will publish at:{" "}
                  <strong>
                    {new Date(scheduledDatetime).toLocaleString()}
                  </strong>
                </p>
              </Banner>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Cancel confirmation modal */}
      <Modal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel scheduled publish"
        primaryAction={{
          content: isCancelling ? "Cancelling..." : "Yes, cancel it",
          onAction: handleCancelConfirm,
          loading: isCancelling,
          destructive: true,
        }}
        secondaryActions={[
          {
            content: "Keep it",
            onAction: () => setCancelModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            Are you sure you want to cancel the scheduled publish for{" "}
            <strong>"{cancelTarget?.productTitle}"</strong>? This cannot be
            undone.
          </Text>
        </Modal.Section>
      </Modal>

      {/* Toast */}
      {toastActive && (
        <Toast
          content={toastMessage}
          error={toastError}
          onDismiss={() => setToastActive(false)}
          duration={4000}
        />
      )}
    </Page>
  );
}
