-- CreateEnum
CREATE TYPE "type" AS ENUM ('IN', 'OUT', 'TRANSFER');

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "min_stock" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movement" (
    "id" TEXT NOT NULL,
    "product_sku" TEXT NOT NULL,
    "source_store_id" TEXT,
    "target_store_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "type" "type" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_sku_key" ON "product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_store_id_product_sku_key" ON "inventory"("store_id", "product_sku");

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_sku_fkey" FOREIGN KEY ("product_sku") REFERENCES "product"("sku") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement" ADD CONSTRAINT "movement_product_sku_fkey" FOREIGN KEY ("product_sku") REFERENCES "product"("sku") ON DELETE RESTRICT ON UPDATE CASCADE;
