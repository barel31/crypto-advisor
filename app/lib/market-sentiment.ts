import { calculateVolatility } from './technical-analysis';

interface MarketSentiment {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number;
  factors: string[];
  volatilityRegime: 'LOW' | 'MEDIUM' | 'HIGH';
  momentumScore: number;
}

interface VolumeProfile {
  buyingPressure: number;
  sellingPressure: number;
  volumeChange: number;
}

export function analyzeMarketSentiment(
  prices: number[],
  volumes: number[],
  rsi: number,
  macdHistogram: number,
  patterns: { pattern: string; strength: number; probability: number }[]
): MarketSentiment {
  const volumeProfile = analyzeVolumeProfile(prices, volumes);
  const volatility = calculateVolatility(prices);
  const momentum = calculateMomentumScore(prices, volumeProfile, rsi, macdHistogram);
  
  const factors: string[] = [];
  let sentimentScore = 0;
  
  // Volume analysis contribution
  if (volumeProfile.buyingPressure > volumeProfile.sellingPressure) {
    sentimentScore += 0.2;
    factors.push(`Strong buying pressure: ${volumeProfile.buyingPressure.toFixed(2)}`);
  } else if (volumeProfile.sellingPressure > volumeProfile.buyingPressure) {
    sentimentScore -= 0.2;
    factors.push(`Strong selling pressure: ${volumeProfile.sellingPressure.toFixed(2)}`);
  }

  // RSI contribution
  if (rsi < 30) {
    sentimentScore += 0.15;
    factors.push('Oversold conditions (RSI)');
  } else if (rsi > 70) {
    sentimentScore -= 0.15;
    factors.push('Overbought conditions (RSI)');
  }

  // MACD contribution
  if (macdHistogram > 0) {
    sentimentScore += 0.15;
    factors.push('Positive MACD momentum');
  } else {
    sentimentScore -= 0.15;
    factors.push('Negative MACD momentum');
  }

  // Pattern contribution
  for (const pattern of patterns) {
    const impact = pattern.strength * pattern.probability;
    if (pattern.pattern.includes('Bullish')) {
      sentimentScore += impact * 0.2;
      factors.push(`Bullish ${pattern.pattern} pattern detected`);
    } else if (pattern.pattern.includes('Bearish')) {
      sentimentScore -= impact * 0.2;
      factors.push(`Bearish ${pattern.pattern} pattern detected`);
    }
  }

  // Determine sentiment
  const sentiment = sentimentScore > 0.1 ? 'BULLISH' :
                   sentimentScore < -0.1 ? 'BEARISH' : 'NEUTRAL';

  // Determine volatility regime
  const volatilityRegime = volatility > 0.05 ? 'HIGH' :
                          volatility > 0.03 ? 'MEDIUM' : 'LOW';

  return {
    sentiment,
    strength: Math.abs(sentimentScore),
    factors,
    volatilityRegime,
    momentumScore: momentum
  };
}

function analyzeVolumeProfile(prices: number[], volumes: number[]): VolumeProfile {
  let buyingPressure = 0;
  let sellingPressure = 0;
  
  // Calculate buying and selling pressure
  for (let i = 1; i < prices.length; i++) {
    const priceChange = prices[i] - prices[i-1];
    const normalizedVolume = volumes[i] / Math.max(...volumes) // Normalize volume to 0-1
    
    if (priceChange > 0) {
      buyingPressure += normalizedVolume * Math.abs(priceChange);
    } else {
      sellingPressure += normalizedVolume * Math.abs(priceChange);
    }
  }
  
  // Calculate volume change (recent vs historical)
  const recentVolume = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const historicalVolume = volumes.slice(0, -5).reduce((a, b) => a + b, 0) / (volumes.length - 5);
  const volumeChange = (recentVolume - historicalVolume) / historicalVolume;
  
  return {
    buyingPressure,
    sellingPressure,
    volumeChange
  };
}

function calculateMomentumScore(
  prices: number[],
  volumeProfile: VolumeProfile,
  rsi: number,
  macdHistogram: number
): number {
  const priceChange = (prices[prices.length - 1] - prices[0]) / prices[0];
  const volumeContribution = volumeProfile.volumeChange > 0 ? 0.2 : -0.2;
  const rsiContribution = (rsi - 50) / 50; // Normalize RSI to -1 to 1
  const macdContribution = macdHistogram > 0 ? 0.3 : -0.3;
  
  return (
    (priceChange * 0.4) +
    (volumeContribution * 0.2) +
    (rsiContribution * 0.2) +
    (macdContribution * 0.2)
  );
}
