-- CreateIndex
CREATE INDEX "inventory_store_id_idx" ON "inventory"("store_id");

-- CreateIndex
CREATE INDEX "inventory_quantity_idx" ON "inventory"("quantity");

-- CreateIndex
CREATE INDEX "inventory_min_stock_idx" ON "inventory"("min_stock");

-- CreateIndex
CREATE INDEX "product_category_idx" ON "product"("category");

-- CreateIndex
CREATE INDEX "product_name_idx" ON "product"("name");

-- CreateIndex
CREATE INDEX "product_price_idx" ON "product"("price");
