-- AlterTable
ALTER TABLE "MarketAnalysis" ADD COLUMN "risk_level" TEXT NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "MarketAnalysis" ADD COLUMN "risk_score" REAL NOT NULL DEFAULT 0;
ALTER TABLE "MarketAnalysis" ADD COLUMN "market_strength" REAL NOT NULL DEFAULT 0;
ALTER TABLE "MarketAnalysis" ADD COLUMN "target_price" REAL;
ALTER TABLE "MarketAnalysis" ADD COLUMN "stop_loss" REAL;
ALTER TABLE "MarketAnalysis" ADD COLUMN "technical_indicators" TEXT;
