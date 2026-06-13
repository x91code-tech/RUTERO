-- CreateIndex
CREATE UNIQUE INDEX "Client_companyId_document_key" ON "Client"("companyId", "document");

-- CreateIndex
CREATE UNIQUE INDEX "Route_companyId_name_key" ON "Route"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_companyId_clientId_sellerId_concept_date_key" ON "Sale"("companyId", "clientId", "sellerId", "concept", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_companyId_clientId_sellerId_date_amount_key" ON "Collection"("companyId", "clientId", "sellerId", "date", "amount");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_companyId_sellerId_type_date_amount_key" ON "Expense"("companyId", "sellerId", "type", "date", "amount");

-- CreateIndex
CREATE UNIQUE INDEX "Product_companyId_name_key" ON "Product"("companyId", "name");
