import { useEffect, useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import {
  Banner,
  BlockStack,
  Card,
  Grid,
  Layout,
  Page,
  SkeletonBodyText,
  Text,
} from "@shopify/polaris";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO, startOfMonth, startOfWeek, subDays } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DailyCount {
  /** Display label e.g. "Apr 01" */
  date: string;
  published: number;
}

interface LoaderData {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  scheduledCount: number;
  publishedThisWeek: number;
  publishedThisMonth: number;
  /** Daily publish counts for the last 30 days — drives the bar chart */
  chartData: DailyCount[];
  error?: string;
}

// ─── Loader ──────────────────────────────────────────────────────────────────

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const now = new Date();
  // Use Monday as the start of the week for the "this week" KPI
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const thirtyDaysAgo = subDays(now, 30);

  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const monthStartStr = format(monthStart, "yyyy-MM-dd");
  const thirtyDaysAgoStr = format(thirtyDaysAgo, "yyyy-MM-dd");

  try {
    // Fire all Shopify queries + DB query in parallel to minimise latency
    const [totalRes, draftRes, weekRes, recentRes, scheduledCount] =
      await Promise.all([
        admin.graphql(`#graphql
          query getTotalCount { productsCount { count } }
        `),
        admin.graphql(`#graphql
          query getDraftCount {
            productsCount(query: "status:draft") { count }
          }
        `),
        // Products made active since the start of this week
        admin.graphql(
          `#graphql
          query getPublishedThisWeek($q: String!) {
            productsCount(query: $q) { count }
          }`,
          { variables: { q: `published_at:>=${weekStartStr} status:active` } },
        ),
        // Published products in the last 30 days (for chart + this-month KPI)
        admin.graphql(
          `#graphql
          query getRecentPublished($q: String!) {
            products(first: 250, query: $q) {
              edges { node { id publishedAt } }
            }
          }`,
          {
            variables: {
              q: `published_at:>=${thirtyDaysAgoStr} status:active`,
            },
          },
        ),
        // Pending scheduled jobs from the local DB
        prisma.scheduledPublish.count({
          where: { shop: session.shop, status: "SCHEDULED" },
        }),
      ]);

    const [totalJson, draftJson, weekJson, recentJson] = await Promise.all([
      totalRes.json(),
      draftRes.json(),
      weekRes.json(),
      recentRes.json(),
    ]);

    const totalProducts = totalJson.data?.productsCount?.count ?? 0;
    const draftProducts = draftJson.data?.productsCount?.count ?? 0;
    const activeProducts = totalProducts - draftProducts;
    const publishedThisWeek = weekJson.data?.productsCount?.count ?? 0;

    // Build a date → count map initialised to 0 for every day in the window
    const dateMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      dateMap.set(format(subDays(now, i), "yyyy-MM-dd"), 0);
    }

    const edges: Array<{ node: { publishedAt: string | null } }> =
      recentJson.data?.products?.edges ?? [];

    let publishedThisMonth = 0;
    for (const { node } of edges) {
      if (!node.publishedAt) continue;
      const day = node.publishedAt.split("T")[0];
      if (dateMap.has(day)) {
        dateMap.set(day, (dateMap.get(day) ?? 0) + 1);
      }
      if (day >= monthStartStr) publishedThisMonth++;
    }

    const chartData: DailyCount[] = Array.from(dateMap.entries()).map(
      ([isoDate, count]) => ({
        date: format(parseISO(isoDate), "MMM dd"),
        published: count,
      }),
    );

    return {
      totalProducts,
      activeProducts,
      draftProducts,
      scheduledCount,
      publishedThisWeek,
      publishedThisMonth,
      chartData,
    };
  } catch (err) {
    console.error("[Dashboard loader]", err);
    return {
      totalProducts: 0,
      activeProducts: 0,
      draftProducts: 0,
      scheduledCount: 0,
      publishedThisWeek: 0,
      publishedThisMonth: 0,
      chartData: [],
      error: "Failed to load dashboard data — please refresh the page.",
    };
  }
};

// ─── Recharts bar chart (client-only — avoids SSR window errors) ─────────────

function PublishChart({ data }: { data: DailyCount[] }) {
  // Only mount the chart in the browser to prevent recharts from
  // trying to access window/document during server-side rendering
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div style={{ padding: "12px 0" }}>
        <SkeletonBodyText lines={8} />
      </div>
    );
  }

  const hasActivity = data.some((d) => d.published > 0);
  if (!hasActivity) {
    return (
      <Text as="p" tone="subdued" alignment="center">
        No products published in the last 30 days.
      </Text>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        barSize={14}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          // Render every 5th label to prevent crowding on small screens
          tickFormatter={(val: string, idx: number) =>
            idx % 5 === 0 ? val : ""
          }
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          formatter={(value) => [value ?? 0, "Published"]}
        />
        <Bar dataKey="published" fill="#5c6ac4" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── KPI summary card ─────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle?: string;
}) {
  return (
    <Card>
      <BlockStack gap="100">
        <Text as="p" variant="bodySm" tone="subdued">
          {title}
        </Text>
        <Text as="p" variant="heading2xl" fontWeight="bold">
          {value.toLocaleString()}
        </Text>
        {subtitle && (
          <Text as="p" variant="bodySm" tone="subdued">
            {subtitle}
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const data = useLoaderData<LoaderData>();

  return (
    <Page
      title="Store Overview"
      subtitle="Analytics and growth metrics for your Shopify store"
    >
        <Layout>
          {/* Error banner — shown only when the loader throws */}
          {data.error && (
            <Layout.Section>
              <Banner tone="critical" title="Could not load dashboard">
                <p>{data.error}</p>
              </Banner>
            </Layout.Section>
          )}

          {/* ── KPI cards ─────────────────────────────────────────────── */}
          <Layout.Section>
            <Grid columns={{ xs: 2, sm: 2, md: 3, lg: 3, xl: 3 }}>
              <Grid.Cell>
                <KpiCard
                  title="Total Products"
                  value={data.totalProducts}
                  subtitle={`${data.activeProducts} active · ${data.draftProducts} draft`}
                />
              </Grid.Cell>
              <Grid.Cell>
                <KpiCard
                  title="Scheduled Publishes"
                  value={data.scheduledCount}
                  subtitle="Pending in queue"
                />
              </Grid.Cell>
              <Grid.Cell>
                <KpiCard
                  title="Published This Week"
                  value={data.publishedThisWeek}
                />
              </Grid.Cell>
              <Grid.Cell>
                <KpiCard
                  title="Published This Month"
                  value={data.publishedThisMonth}
                />
              </Grid.Cell>
              <Grid.Cell>
                <KpiCard title="Active Products" value={data.activeProducts} />
              </Grid.Cell>
              <Grid.Cell>
                <KpiCard title="Draft Products" value={data.draftProducts} />
              </Grid.Cell>
            </Grid>
          </Layout.Section>

          {/* ── Publish activity chart ─────────────────────────────────── */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">
                    Publish Activity — Last 30 Days
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Products published per day
                  </Text>
                </BlockStack>
                <PublishChart data={data.chartData} />
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
  );
}

// Required so Shopify can attach its response headers to embedded app pages
export const headers: HeadersFunction = (headersArgs) =>
  boundary.headers(headersArgs);
