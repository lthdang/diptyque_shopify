import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { authenticate } from "../shopify.server";
import {
  getCustomers,
  getCustomerById,
  type CustomerListResult,
} from "../services/customer.server";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  IndexTable,
  InlineStack,
  Layout,
  Page,
  Pagination,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";

type CustomerDetail = NonNullable<Awaited<ReturnType<typeof getCustomerById>>>;
type CustomersLoaderData =
  | { view: "detail"; customer: CustomerDetail }
  | ({ view: "list" } & CustomerListResult);

export const loader = async ({
  request,
}: LoaderFunctionArgs): Promise<CustomersLoaderData> => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);

  const view = url.searchParams.get("view");
  const customerId = url.searchParams.get("id");

  if (view === "detail" && customerId) {
    const customer = await getCustomerById(session.shop, customerId);
    if (!customer) throw new Response("Not found", { status: 404 });
    return { view: "detail", customer };
  }

  const search = url.searchParams.get("search") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const legacySort = url.searchParams.get("sort");
  const [legacySortField, legacySortOrder] = (legacySort || "").split("_");
  const sortField =
    url.searchParams.get("sortField") || legacySortField || "createdAt";
  const sortOrderParam =
    url.searchParams.get("sortOrder") || legacySortOrder || "desc";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = 10;

  const result = await getCustomers({
    shop: session.shop,
    search,
    status,
    sortField,
    sortOrder: sortOrderParam === "asc" ? "asc" : "desc",
    page,
    limit,
  });
  return { view: "list", ...result };
};

export default function CustomersPage() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  if (data.view === "detail") {
    const { customer } = data;

    const formatDate = (iso: string) =>
      new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      });

    return (
      <Page
        title={customer.name}
        backAction={{
          content: "Customers",
          onAction: () => navigate("/app/customers"),
        }}
      >
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Customer Information
                </Text>
                <DetailRow label="ID" value={customer.id} />
                <DetailRow label="Name" value={customer.name} />
                <DetailRow label="Email" value={customer.email} />
                <DetailRow
                  label="Phone"
                  value={customer.phone || "Not provided"}
                />
                <DetailRow
                  label="Status"
                  value={
                    <Badge
                      tone={
                        customer.status === "active" ? "success" : undefined
                      }
                    >
                      {customer.status}
                    </Badge>
                  }
                />
                <DetailRow
                  label="Created At"
                  value={formatDate(customer.createdAt)}
                />
                <DetailRow
                  label="Updated At"
                  value={formatDate(customer.updatedAt)}
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const { customers, page, totalPages } = data;
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || "",
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "",
  );
  const [sortFieldValue, setSortFieldValue] = useState(
    searchParams.get("sortField") || "createdAt",
  );
  const [sortOrderValue, setSortOrderValue] = useState(
    searchParams.get("sortOrder") || "desc",
  );

  useEffect(() => {
    const legacySort = searchParams.get("sort") || "";
    const [legacySortField, legacySortOrder] = legacySort.split("_");

    setSearchInput(searchParams.get("search") || "");
    setStatusFilter(searchParams.get("status") || "");
    setSortFieldValue(
      searchParams.get("sortField") || legacySortField || "createdAt",
    );
    setSortOrderValue(
      searchParams.get("sortOrder") || legacySortOrder || "desc",
    );
  }, [searchParams]);

  const updateListParams = (params: {
    page?: number;
    search?: string;
    status?: string;
    sortField?: string;
    sortOrder?: string;
  }) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);

      if (typeof params.page === "number") {
        next.set("page", String(params.page));
      }
      if (params.search !== undefined) {
        if (params.search) next.set("search", params.search);
        else next.delete("search");
      }
      if (params.status !== undefined) {
        if (params.status) next.set("status", params.status);
        else next.delete("status");
      }
      if (params.sortField !== undefined) {
        if (params.sortField) next.set("sortField", params.sortField);
        else next.delete("sortField");
      }
      if (params.sortOrder !== undefined) {
        if (params.sortOrder) next.set("sortOrder", params.sortOrder);
        else next.delete("sortOrder");
      }

      // Remove legacy combined sort param after migrating to sortField/sortOrder.
      next.delete("sort");

      return next;
    });
  };

  const applyFilters = () => {
    updateListParams({
      page: 1,
      search: searchInput.trim(),
      status: statusFilter,
      sortField: sortFieldValue,
      sortOrder: sortOrderValue,
    });
  };

  const clearFilters = () => {
    setSearchInput("");
    setStatusFilter("");
    setSortFieldValue("createdAt");
    setSortOrderValue("desc");
    updateListParams({
      page: 1,
      search: "",
      status: "",
      sortField: "createdAt",
      sortOrder: "desc",
    });
  };

  const statusOptions = [
    { label: "All statuses", value: "" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  const sortFieldOptions = [
    { label: "Created date", value: "createdAt" },
    { label: "Updated date", value: "updatedAt" },
    { label: "Name", value: "name" },
    { label: "Email", value: "email" },
  ];

  const sortOrderOptions = [
    { label: "Descending", value: "desc" },
    { label: "Ascending", value: "asc" },
  ];

  return (
    <Page title="Customers" fullWidth>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="300" align="space-between" blockAlign="end">
                <Box minWidth="280px">
                  <TextField
                    label="Search"
                    labelHidden
                    placeholder="Search by name, email, phone"
                    value={searchInput}
                    onChange={setSearchInput}
                    autoComplete="off"
                  />
                </Box>
                <Box minWidth="180px">
                  <Select
                    label="Status"
                    labelHidden
                    options={statusOptions}
                    value={statusFilter}
                    onChange={setStatusFilter}
                  />
                </Box>
                <Box minWidth="180px">
                  <Select
                    label="Sort field"
                    labelHidden
                    options={sortFieldOptions}
                    value={sortFieldValue}
                    onChange={setSortFieldValue}
                  />
                </Box>
                <Box minWidth="180px">
                  <Select
                    label="Sort order"
                    labelHidden
                    options={sortOrderOptions}
                    value={sortOrderValue}
                    onChange={setSortOrderValue}
                  />
                </Box>
                <InlineStack gap="200">
                  <Button onClick={clearFilters}>Clear</Button>
                  <Button variant="primary" onClick={applyFilters}>
                    Apply
                  </Button>
                </InlineStack>
              </InlineStack>

              <IndexTable
                resourceName={{ singular: "customer", plural: "customers" }}
                itemCount={customers.length}
                headings={[
                  { title: "ID" },
                  { title: "Name" },
                  { title: "Email" },
                  { title: "Status" },
                  { title: "Actions" },
                ]}
                selectable={false}
              >
                {customers.map((customer, index) => (
                  <IndexTable.Row
                    id={customer.id}
                    key={customer.id}
                    position={index}
                  >
                    <IndexTable.Cell>
                      <Text variant="bodyMd" fontWeight="bold" as="span">
                        {customer.id.slice(0, 8)}...
                      </Text>
                    </IndexTable.Cell>
                    <IndexTable.Cell>{customer.name}</IndexTable.Cell>
                    <IndexTable.Cell>{customer.email}</IndexTable.Cell>
                    <IndexTable.Cell>
                      <Badge
                        tone={
                          customer.status === "active" ? "success" : undefined
                        }
                      >
                        {customer.status}
                      </Badge>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="slim"
                          onClick={() => {
                            // Query param — App Bridge không intercept
                            navigate(
                              `/app/customers?view=detail&id=${customer.id}`,
                            );
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </IndexTable.Cell>
                  </IndexTable.Row>
                ))}
              </IndexTable>

              {totalPages > 1 && (
                <InlineStack align="center">
                  <Pagination
                    hasPrevious={page > 1}
                    hasNext={page < totalPages}
                    onPrevious={() => updateListParams({ page: page - 1 })}
                    onNext={() => updateListParams({ page: page + 1 })}
                  />
                </InlineStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <InlineStack gap="400" align="start">
      <Box minWidth="120px">
        <Text as="span" variant="bodyMd" fontWeight="semibold">
          {label}
        </Text>
      </Box>
      <Text as="span" variant="bodyMd">
        {value}
      </Text>
    </InlineStack>
  );
}
