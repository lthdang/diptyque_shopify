import prisma from "../db.server";

export interface CustomerListParams {
  shop: string;
  search?: string;
  status?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface CustomerListResult {
  customers: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getCustomers(
  params: CustomerListParams,
): Promise<CustomerListResult> {
  const {
    shop,
    search,
    status,
    sortField = "createdAt",
    sortOrder = "desc",
    page = 1,
    limit = 10,
    dateFrom,
    dateTo,
  } = params;

  const where: Record<string, unknown> = { shop };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  const allowedSortFields = ["createdAt", "updatedAt", "name", "email"];
  const orderByField = allowedSortFields.includes(sortField)
    ? sortField
    : "createdAt";

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { [orderByField]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getCustomerById(shop: string, id: string) {
  console.log("getCustomerById called with:", { shop, id });
  const customer = await prisma.customer.findFirst({
    where: { id, shop },
  });
  console.log("Fetched customer from DB:", customer);
  if (!customer) return null;
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    status: customer.status,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}
