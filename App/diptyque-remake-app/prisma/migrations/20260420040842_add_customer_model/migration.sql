-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_shop_idx" ON "Customer"("shop");

-- CreateIndex
CREATE INDEX "Customer_shop_email_idx" ON "Customer"("shop", "email");

-- CreateIndex
CREATE INDEX "Customer_shop_name_idx" ON "Customer"("shop", "name");
