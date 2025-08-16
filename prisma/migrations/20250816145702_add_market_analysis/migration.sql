-- CreateTable
CREATE TABLE "MarketAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "trend" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "analysis" TEXT NOT NULL,
    "validUntil" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "MarketAnalysis_symbol_idx" ON "MarketAnalysis"("symbol");
