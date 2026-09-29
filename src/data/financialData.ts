/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FinancialInstrument,
  RiskProfileType,
  InvestmentHorizon,
  MarketAnalysisRequest,
  MarketAnalysisResult,
  SuitabilityVerdict,
  IncreaseVerdict,
  PricePoint,
} from '../types/intel';

// Helper to generate realistic historical trend points with technical overlays
function generatePriceHistory(
  basePrice: number,
  trendBias: number, // positive for bullish, negative for bearish
  volatility: number,
  pointsCount: number = 30
): PricePoint[] {
  const points: PricePoint[] = [];
  let current = basePrice * (1 - (trendBias * pointsCount * 0.003));
  const prices: number[] = [];

  for (let i = 0; i < pointsCount; i++) {
    const dayOffset = pointsCount - 1 - i;
    const date = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];

    // Random walk with drift
    const change = (Math.random() - 0.47 + trendBias * 0.15) * (volatility * 0.02) * current;
    current = Math.max(current * 0.6, current + change);
    prices.push(current);

    // Compute SMA20 and SMA50
    const sma20 = prices.length >= 7 
      ? prices.slice(Math.max(0, prices.length - 20)).reduce((a, b) => a + b, 0) / Math.min(prices.length, 20)
      : undefined;

    const sma50 = prices.length >= 14
      ? prices.slice(Math.max(0, prices.length - 50)).reduce((a, b) => a + b, 0) / Math.min(prices.length, 50)
      : undefined;

    const volume = Math.floor(1000000 + Math.random() * 8500000);

    points.push({
      date: dateStr,
      price: parseFloat(current.toFixed(2)),
      sma20: sma20 ? parseFloat(sma20.toFixed(2)) : undefined,
      sma50: sma50 ? parseFloat(sma50.toFixed(2)) : undefined,
      volume,
    });
  }

  // Force last point to match basePrice
  if (points.length > 0) {
    points[points.length - 1].price = basePrice;
  }

  return points;
}

export const INITIAL_FINANCIAL_INSTRUMENTS: FinancialInstrument[] = [
  {
    id: 'inst-nvda',
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    assetClass: 'EQUITY',
    price: 138.25,
    currency: 'USD',
    change24h: 3.84,
    change7d: 8.65,
    volume24h: '$41.2B',
    marketCap: '$3.38T',
    beta: 1.68,
    sharpeRatio: 2.45,
    rsi: 64.2,
    emaCross: 'GOLDEN_CROSS',
    impliedVolatility: 38.5,
    increaseLikelihood: 84,
    increaseVerdict: 'STRONG_SURGE',
    targetUpsidePercent: 18.5,
    targetDownsideFloor: 124.0,
    targetPriceUpper: 163.8,
    suitabilityScore: 88,
    suitabilityVerdict: 'HIGHLY_SUITABLE',
    maxRecommendedAllocationPercent: 12.0,
    macroCatalysts: [
      'Blackwell B200 cluster enterprise hyperscaler order acceleration',
      'Sovereign AI data center procurement initiatives globally',
      'Record gross margins sustained above 75%'
    ],
    technicalSummary: 'Bullish breakout above ascending consolidation triangle. 20-day SMA firmly leading 50-day SMA. RSI at 64 indicates robust momentum without extreme overbought exhaustion.',
    fundamentalSummary: 'Dominant 88% market share in accelerated compute for generative AI and LLM inference. Record free cash flow growth enables continued aggressive R&D moat expansion.',
    suitabilityReason: 'Optimal for Tactical Growth and Aggressive Alpha profiles. High Sharpe ratio (2.45) offsets beta volatility (1.68). Strict 12% allocation limit recommended.',
    historicalPrices: generatePriceHistory(138.25, 0.65, 3.2),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'inst-spy',
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    assetClass: 'INDEX',
    price: 574.60,
    currency: 'USD',
    change24h: 0.62,
    change7d: 1.85,
    volume24h: '$28.4B',
    marketCap: '$585B',
    beta: 1.0,
    sharpeRatio: 1.82,
    rsi: 58.4,
    emaCross: 'GOLDEN_CROSS',
    impliedVolatility: 13.2,
    increaseLikelihood: 72,
    increaseVerdict: 'MODERATE_INCREASE',
    targetUpsidePercent: 6.8,
    targetDownsideFloor: 554.0,
    targetPriceUpper: 613.6,
    suitabilityScore: 94,
    suitabilityVerdict: 'HIGHLY_SUITABLE',
    maxRecommendedAllocationPercent: 35.0,
    macroCatalysts: [
      'Federal Reserve easing cycle transition with resilient US GDP',
      'Corporate earnings growth broadening across non-tech sectors',
      'Institutional pension asset re-weighting toward US benchmark'
    ],
    technicalSummary: 'Consistent higher-high structure along 20-day exponential trendline. Volatility (VIX) suppressed below 14. Support confirmed at 562.00.',
    fundamentalSummary: 'Broad market bellwether representing diversified corporate cash flows. Dividend yield cushion and historic recovery velocity in cyclical expansions.',
    suitabilityReason: 'Core foundation instrument suitable across ALL investor risk profiles from Conservative to Speculative. Exemplary liquidity and minimal tracking error.',
    historicalPrices: generatePriceHistory(574.60, 0.4, 1.2),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'inst-btc',
    symbol: 'BTC-USD',
    name: 'Bitcoin Digital Reserve',
    assetClass: 'CRYPTO',
    price: 64850.00,
    currency: 'USD',
    change24h: 4.15,
    change7d: 11.20,
    volume24h: '$34.8B',
    marketCap: '$1.28T',
    beta: 2.15,
    sharpeRatio: 1.95,
    rsi: 68.1,
    emaCross: 'GOLDEN_CROSS',
    impliedVolatility: 54.0,
    increaseLikelihood: 79,
    increaseVerdict: 'STRONG_SURGE',
    targetUpsidePercent: 26.0,
    targetDownsideFloor: 57200.0,
    targetPriceUpper: 81700.0,
    suitabilityScore: 68,
    suitabilityVerdict: 'CONDITIONALLY_SUITABLE',
    maxRecommendedAllocationPercent: 5.0,
    macroCatalysts: [
      'Net positive institutional spot ETF capital inflows for 7 consecutive weeks',
      'Global central bank monetary expansion cycle easing liquidity conditions',
      'Post-halving miner supply constraint entering historical acceleration phase'
    ],
    technicalSummary: 'Ascending channel breakout with expanding on-balance volume (OBV). Testing major resistance corridor between $65k-$68k. Dynamic floor anchored at $59,500.',
    fundamentalSummary: 'Hard cap 21M supply schedule. Asymmetric store-of-value adoption curve amongst institutional treasuries and sovereign wealth funds.',
    suitabilityReason: 'Highly suitable for Aggressive and Speculative mandates seeking high alpha. Unsuitable for Conservative capital preservation without strict 2-3% sizing caps.',
    historicalPrices: generatePriceHistory(64850.00, 0.7, 4.5),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'inst-cibr',
    symbol: 'CIBR',
    name: 'First Trust NASDAQ Cybersecurity ETF',
    assetClass: 'EQUITY',
    price: 61.40,
    currency: 'USD',
    change24h: 1.45,
    change7d: 4.10,
    volume24h: '$180M',
    marketCap: '$6.2B',
    beta: 1.12,
    sharpeRatio: 2.10,
    rsi: 61.0,
    emaCross: 'GOLDEN_CROSS',
    impliedVolatility: 21.5,
    increaseLikelihood: 76,
    increaseVerdict: 'STRONG_SURGE',
    targetUpsidePercent: 14.5,
    targetDownsideFloor: 56.8,
    targetPriceUpper: 70.3,
    suitabilityScore: 89,
    suitabilityVerdict: 'HIGHLY_SUITABLE',
    maxRecommendedAllocationPercent: 15.0,
    macroCatalysts: [
      'Mandatory SEC cyber incident reporting regulations driving enterprise compliance budgets',
      'State-sponsored zero-day exploit proliferation elevating zero-trust architecture spend',
      'Recurring software ARR cash flows resilient to macro consumer downturns'
    ],
    technicalSummary: 'Steady accumulation trend along 50-day SMA. Low beta divergence with high relative strength versus broad tech index.',
    fundamentalSummary: 'Inelastic corporate demand: cybersecurity remains a mission-critical utility that enterprise CIOs cannot cut during budget constraints.',
    suitabilityReason: 'Superb risk-reward alignment for Moderate and Aggressive portfolios. Defensive growth characteristics protect against macro volatility.',
    historicalPrices: generatePriceHistory(61.40, 0.45, 1.8),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'inst-ita',
    symbol: 'ITA',
    name: 'iShares U.S. Aerospace & Defense ETF',
    assetClass: 'EQUITY',
    price: 146.80,
    currency: 'USD',
    change24h: 1.15,
    change7d: 3.40,
    volume24h: '$310M',
    marketCap: '$6.8B',
    beta: 0.82,
    sharpeRatio: 2.28,
    rsi: 59.2,
    emaCross: 'GOLDEN_CROSS',
    impliedVolatility: 16.4,
    increaseLikelihood: 81,
    increaseVerdict: 'STRONG_SURGE',
    targetUpsidePercent: 12.8,
    targetDownsideFloor: 138.0,
    targetPriceUpper: 165.5,
    suitabilityScore: 92,
    suitabilityVerdict: 'HIGHLY_SUITABLE',
    maxRecommendedAllocationPercent: 18.0,
    macroCatalysts: [
      'NATO member states committing 2.5%+ GDP defense baseline quotas',
      'Multi-year defense equipment backlog with guaranteed sovereign procurement contracts',
      'Geopolitical tensions in Eastern Europe and Indo-Pacific sustaining replenishment orders'
    ],
    technicalSummary: 'Multi-month ascending base breakout. Low downside volatility (Beta 0.82) offers institutional-grade ballast during market selloffs.',
    fundamentalSummary: 'Government-backed multi-decade contract pipelines with inflation pass-through clauses ensure predictable long-term dividend and earnings trajectory.',
    suitabilityReason: 'Exemplary suitability for Conservative and Moderate investors seeking defense-sector hedging and steady capital appreciation.',
    historicalPrices: generatePriceHistory(146.80, 0.55, 1.4),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'inst-xau',
    symbol: 'XAU/USD',
    name: 'Spot Gold Bullion',
    assetClass: 'COMMODITY',
    price: 2658.40,
    currency: 'USD',
    change24h: 0.85,
    change7d: 2.95,
    volume24h: '$16.2B',
    marketCap: '$17.4T',
    beta: 0.15,
    sharpeRatio: 2.05,
    rsi: 65.4,
    emaCross: 'GOLDEN_CROSS',
    impliedVolatility: 14.8,
    increaseLikelihood: 77,
    increaseVerdict: 'STRONG_SURGE',
    targetUpsidePercent: 9.5,
    targetDownsideFloor: 2520.0,
    targetPriceUpper: 2910.0,
    suitabilityScore: 95,
    suitabilityVerdict: 'HIGHLY_SUITABLE',
    maxRecommendedAllocationPercent: 20.0,
    macroCatalysts: [
      'Sovereign central bank de-dollarization and reserve diversification buying',
      'Global physical bullion deficit and ETF inventory replenishment',
      'Real interest rate compression as central banks embark on synchronized rate cuts'
    ],
    technicalSummary: 'Unbroken multi-quarter upward trendchannel. Consolidating cleanly above previous all-time highs. Key support level established at $2,580/oz.',
    fundamentalSummary: 'Zero counterparty risk monetary anchor. 5,000-year track record as an inflation hedge and ultimate geopolitical flight-to-safety asset.',
    suitabilityReason: 'Essential portfolio ballast. Uncorrelated with equity drawdowns; recommended 10-20% weight across all profile types.',
    historicalPrices: generatePriceHistory(2658.40, 0.5, 1.3),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'inst-brent',
    symbol: 'BRENT',
    name: 'Crude Oil Brent Benchmark',
    assetClass: 'COMMODITY',
    price: 74.20,
    currency: 'USD',
    change24h: -1.40,
    change7d: -3.80,
    volume24h: '$12.5B',
    beta: 0.95,
    sharpeRatio: 0.92,
    rsi: 42.1,
    emaCross: 'NEUTRAL_ALIGN',
    impliedVolatility: 28.2,
    increaseLikelihood: 48,
    increaseVerdict: 'RANGEBOUND',
    targetUpsidePercent: 8.2,
    targetDownsideFloor: 68.5,
    targetPriceUpper: 80.3,
    suitabilityScore: 55,
    suitabilityVerdict: 'MARGINAL_FIT',
    maxRecommendedAllocationPercent: 6.0,
    macroCatalysts: [
      'OPEC+ production quota discipline countered by non-OPEC Americas output',
      'China macroeconomic stimulus versus soft industrial fuel demand signals',
      'Middle East transit corridor risk premiums flaring intermittently'
    ],
    technicalSummary: 'Choppy rangebound consolidation between $70 and $79 support/resistance bands. Moving averages intertwined without directional tilt.',
    fundamentalSummary: 'Balanced physical market with elevated spare capacity. Dependent on geopolitical shock events for substantial upside expansion.',
    suitabilityReason: 'Marginal suitability due to cyclicality and negative roll yields. Recommended only for tactical hedging or energy specialists.',
    historicalPrices: generatePriceHistory(74.20, -0.1, 2.8),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'inst-eurusd',
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar Forex',
    assetClass: 'FOREX',
    price: 1.1165,
    currency: 'USD',
    change24h: 0.18,
    change7d: 0.45,
    volume24h: '$110B',
    beta: 0.35,
    sharpeRatio: 1.15,
    rsi: 54.8,
    emaCross: 'NEUTRAL_ALIGN',
    impliedVolatility: 6.2,
    increaseLikelihood: 58,
    increaseVerdict: 'MODERATE_INCREASE',
    targetUpsidePercent: 2.8,
    targetDownsideFloor: 1.095,
    targetPriceUpper: 1.148,
    suitabilityScore: 78,
    suitabilityVerdict: 'CONDITIONALLY_SUITABLE',
    maxRecommendedAllocationPercent: 15.0,
    macroCatalysts: [
      'ECB / Federal Reserve interest rate differential narrowing',
      'Global trade balance stability and European export resilience',
      'Diminishing dollar dominance premium in bilateral settlement'
    ],
    technicalSummary: 'Moderate upward channel oscillating around 1.1150. Low volatility regime with tight daily pip ranges.',
    fundamentalSummary: 'World most liquid currency pair. High macro sensitivity to central bank forward guidance releases.',
    suitabilityReason: 'Suitable for FX treasury operations, corporate hedging, and cash flow risk management. Low standalone upside without leverage.',
    historicalPrices: generatePriceHistory(1.1165, 0.15, 0.4),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'inst-us10y',
    symbol: 'US10Y',
    name: 'United States 10-Year Benchmark Treasury',
    assetClass: 'FIXED_INCOME',
    price: 3.78, // Yield %
    currency: 'YIELD_%',
    change24h: -0.05,
    change7d: -0.18,
    volume24h: '$95B',
    beta: -0.25,
    sharpeRatio: 1.60,
    rsi: 46.2,
    emaCross: 'DEATH_CROSS',
    impliedVolatility: 9.4,
    increaseLikelihood: 35, // Yield decrease expected (bond price increase)
    increaseVerdict: 'CORRECTION_RISK', // Yield correction / bond price surge
    targetUpsidePercent: -12.0, // Yield target 3.32%
    targetDownsideFloor: 4.10, // Yield ceiling (price floor)
    targetPriceUpper: 3.35, // Yield floor (price rally)
    suitabilityScore: 92,
    suitabilityVerdict: 'HIGHLY_SUITABLE',
    maxRecommendedAllocationPercent: 25.0,
    macroCatalysts: [
      'Federal Reserve dot plot signaling continued policy rate reductions',
      'Inflation CPI print continuing glidepath toward 2.0% target',
      'Flight-to-quality sovereign demand during risk-off geopolitical episodes'
    ],
    technicalSummary: 'Yield breaking below multi-month support at 3.80%, indicating upward price rally in underlying treasury bonds.',
    fundamentalSummary: 'The sovereign risk-free rate benchmark. Crucial denominator for global asset pricing models and portfolio risk management.',
    suitabilityReason: 'Prime choice for Conservative and Moderate investors seeking guaranteed coupon yields and capital preservation.',
    historicalPrices: generatePriceHistory(3.78, -0.3, 0.8),
    lastUpdated: new Date().toISOString(),
  },
];

// Quantitative Engine: Determine Increase Likelihood (0 - 100%)
export function calculateIncreaseLikelihood(params: {
  price?: number;
  change24h?: number;
  rsi?: number;
  movingAverageStatus?: string;
  volumeSurgeRatio?: number;
  newsSentiment?: number;
  volatility?: number;
}): {
  likelihood: number;
  verdict: IncreaseVerdict;
  projectedReturnPercent: { conservative: number; base: number; bullExpansion: number };
  factorScores: { technical: number; momentum: number; liquidity: number; macro: number };
} {
  const change = params.change24h ?? 1.5;
  const rsi = params.rsi ?? 55;
  const maStatus = params.movingAverageStatus ?? 'GOLDEN_CROSS';
  const volSurge = params.volumeSurgeRatio ?? 1.4;
  const sentiment = params.newsSentiment ?? 0.35; // -1 to 1
  const vol = params.volatility ?? 22.0;

  // 1. Technical Score (0-100) based on trend and moving average status
  let techScore = 50;
  if (maStatus === 'GOLDEN_CROSS') techScore = 85;
  else if (maStatus === 'ABOVE_200_SMA') techScore = 72;
  else if (maStatus === 'BELOW_200_SMA') techScore = 32;
  else if (maStatus === 'DEATH_CROSS') techScore = 18;

  // 2. Momentum Score (0-100) based on RSI and short-term price momentum
  // Ideal bullish momentum: RSI between 52 and 68
  let momScore = 50;
  if (rsi >= 50 && rsi <= 68) momScore = 82;
  else if (rsi > 68 && rsi <= 78) momScore = 68; // Strong but slightly overbought
  else if (rsi > 78) momScore = 40; // Overbought exhaustion risk
  else if (rsi < 30) momScore = 65; // Oversold bounce candidate
  else momScore = 45; // Weak or neutral

  if (change > 0) momScore = Math.min(100, momScore + Math.min(15, change * 2.5));
  else momScore = Math.max(0, momScore - Math.abs(change) * 2.0);

  // 3. Liquidity & Volume Score (0-100)
  let liqScore = 50;
  if (volSurge >= 2.0) liqScore = 90;
  else if (volSurge >= 1.4) liqScore = 75;
  else if (volSurge >= 1.0) liqScore = 60;
  else liqScore = 35; // Low volume breakout is unreliable

  // 4. Macro & News Sentiment Score (0-100)
  // sentiment is between -1.0 and 1.0
  const macroScore = Math.min(100, Math.max(0, Math.round(50 + sentiment * 45)));

  // Weighted Aggregate Increase Likelihood:
  // Technical (30%) + Momentum (25%) + Liquidity (25%) + Macro (20%)
  const aggregateScore = Math.round(
    techScore * 0.30 +
    momScore * 0.25 +
    liqScore * 0.25 +
    macroScore * 0.20
  );

  const likelihood = Math.min(96, Math.max(8, aggregateScore));

  let verdict: IncreaseVerdict = 'RANGEBOUND';
  if (likelihood >= 75) verdict = 'STRONG_SURGE';
  else if (likelihood >= 60) verdict = 'MODERATE_INCREASE';
  else if (likelihood >= 45) verdict = 'RANGEBOUND';
  else if (likelihood >= 30) verdict = 'CORRECTION_RISK';
  else verdict = 'BEARISH_DOWNWARD';

  // Projected Return Ranges based on Volatility and Score
  const baseScale = (likelihood - 50) / 50; // -1.0 to 1.0
  const expectedReturn = baseScale * (vol * 0.65);

  const conservative = parseFloat(Math.max(-vol, expectedReturn * 0.45).toFixed(1));
  const base = parseFloat(Math.max(-vol * 1.2, expectedReturn).toFixed(1));
  const bullExpansion = parseFloat(Math.max(2.0, expectedReturn * 1.75 + (vol * 0.25)).toFixed(1));

  return {
    likelihood,
    verdict,
    projectedReturnPercent: { conservative, base, bullExpansion },
    factorScores: {
      technical: Math.round(techScore),
      momentum: Math.round(momScore),
      liquidity: Math.round(liqScore),
      macro: Math.round(macroScore),
    },
  };
}

// Quantitative Engine: Determine Suitability for an Investor / Portfolio Profile (0 - 100%)
export function calculateSuitability(
  instrument: {
    assetClass?: string;
    volatility?: number;
    beta?: number;
    sharpeRatio?: number;
    increaseLikelihood?: number;
  },
  riskProfile: RiskProfileType = 'MODERATE',
  horizon: InvestmentHorizon = 'TACTICAL_MONTHS',
  capitalSize: number = 100000
): {
  suitabilityScore: number;
  suitabilityVerdict: SuitabilityVerdict;
  maxRecommendedWeight: number;
  breakdown: {
    volatilityAlignment: string;
    drawdownRisk: string;
    horizonMatch: string;
    liquidityFactor: string;
  };
  reason: string;
} {
  const vol = instrument.volatility ?? 20.0;
  const beta = instrument.beta ?? 1.0;
  const sharpe = instrument.sharpeRatio ?? 1.5;
  const increaseProb = instrument.increaseLikelihood ?? 65;

  let baseSuitability = 70;
  let maxWeight = 15;
  let volAlign = 'Moderate Volatility Alignment';
  let drawdownRisk = 'Acceptable Drawdown Range';
  let horizonMatch = 'Matches Horizon Window';
  let liquidityFactor = 'Standard Institutional Liquidity';

  // 1. Profile Risk Mappings
  switch (riskProfile) {
    case 'CONSERVATIVE':
      // Prefers: Volatility < 15%, Beta < 0.9, Sharpe > 1.8
      if (vol <= 15 && beta <= 1.0) {
        baseSuitability = 92;
        maxWeight = 25;
        volAlign = 'Optimal: Low volatility matches capital preservation mandate';
        drawdownRisk = 'Minimal historical drawdown footprint (<6%)';
      } else if (vol <= 25) {
        baseSuitability = 62;
        maxWeight = 8;
        volAlign = 'Marginal: Volatility exceeds conservative threshold; requires strict cap';
        drawdownRisk = 'Moderate drawdown risk (10-15%)';
      } else {
        baseSuitability = 32;
        maxWeight = 2;
        volAlign = 'Unsuitable: High asset volatility violates preservation mandate';
        drawdownRisk = 'Severe drawdown risk exceeds profile limits';
      }
      break;

    case 'MODERATE':
      // Prefers: Volatility 10-30%, Beta 0.8 - 1.3, Sharpe > 1.4
      if (vol <= 30 && beta <= 1.3) {
        baseSuitability = 88;
        maxWeight = 20;
        volAlign = 'Strong Alignment: Well-balanced risk-adjusted return profile';
        drawdownRisk = 'Expected max drawdown (8-14%) within tolerance';
      } else if (vol <= 45) {
        baseSuitability = 68;
        maxWeight = 10;
        volAlign = 'Acceptable: Growth asset with elevated volatility';
        drawdownRisk = 'Drawdown requires defensive stop-loss placement';
      } else {
        baseSuitability = 42;
        maxWeight = 4;
        volAlign = 'Marginal Fit: High speculative characteristics';
        drawdownRisk = 'Volatile tail-risk exposure';
      }
      break;

    case 'AGGRESSIVE':
      // Prefers: High alpha, Volatility 20-55%, Beta 1.1 - 2.0
      if (increaseProb >= 70) {
        baseSuitability = 94;
        maxWeight = 20;
        volAlign = 'Ideal: Strong upward conviction justifies volatility allowance';
        drawdownRisk = 'Drawdown tolerated for target asymmetric upside';
      } else if (increaseProb >= 50) {
        baseSuitability = 78;
        maxWeight = 14;
        volAlign = 'Favorable: Good momentum and beta leverage';
        drawdownRisk = 'Managed via portfolio diversification';
      } else {
        baseSuitability = 52;
        maxWeight = 6;
        volAlign = 'Sub-optimal: Insufficient momentum to justify downside risk';
        drawdownRisk = 'Unfavorable risk-to-reward ratio';
      }
      break;

    case 'SPECULATIVE':
      // High tolerance for volatility, seeks 2x+ upside
      if (vol >= 30 || increaseProb >= 75) {
        baseSuitability = 92;
        maxWeight = 15;
        volAlign = 'Exceptional Match: High volatility fuels asymmetric payoff';
        drawdownRisk = 'Extreme drawdown accepted as operational norm';
      } else {
        baseSuitability = 65;
        maxWeight = 10;
        volAlign = 'Moderate Fit: Lower volatility than typical speculative asset';
        drawdownRisk = 'Stable profile';
      }
      break;
  }

  // 2. Horizon Modifier
  if (horizon === 'INTRADAY' && vol < 12) {
    baseSuitability -= 12;
    horizonMatch = 'Low intraday range limits day trading viability';
  } else if (horizon === 'STRATEGIC_YEARS' && vol > 50) {
    baseSuitability -= 15;
    horizonMatch = 'Extreme multi-month volatility increases path-dependency risk';
  } else {
    horizonMatch = `Horizon perfectly matched to ${horizon.replace('_', ' ')}`;
  }

  // 3. Sharpe Adjustment
  if (sharpe >= 2.0) baseSuitability += 8;
  else if (sharpe < 1.0) baseSuitability -= 10;

  const suitabilityScore = Math.min(98, Math.max(10, baseSuitability));

  let suitabilityVerdict: SuitabilityVerdict = 'HIGHLY_SUITABLE';
  if (suitabilityScore >= 80) suitabilityVerdict = 'HIGHLY_SUITABLE';
  else if (suitabilityScore >= 62) suitabilityVerdict = 'CONDITIONALLY_SUITABLE';
  else if (suitabilityScore >= 42) suitabilityVerdict = 'MARGINAL_FIT';
  else suitabilityVerdict = 'UNSUITABLE_HIGH_RISK';

  let reason = '';
  if (suitabilityVerdict === 'HIGHLY_SUITABLE') {
    reason = `Matches ${riskProfile} risk parameters with robust Sharpe ratio (${sharpe.toFixed(2)}) and optimal horizon alignment.`;
  } else if (suitabilityVerdict === 'CONDITIONALLY_SUITABLE') {
    reason = `Suitable for ${riskProfile} allocations provided position size is capped at max ${maxWeight}% with disciplined risk invalidation.`;
  } else if (suitabilityVerdict === 'MARGINAL_FIT') {
    reason = `Marginal fit: Asset volatility (${vol.toFixed(1)}%) diverges from target mandate; recommend strict stop-loss.`;
  } else {
    reason = `UNSUITABLE: High asset risk and drawdown potential exceed the safety parameters of a ${riskProfile} profile.`;
  }

  return {
    suitabilityScore,
    suitabilityVerdict,
    maxRecommendedWeight: maxWeight,
    breakdown: {
      volatilityAlignment: volAlign,
      drawdownRisk,
      horizonMatch,
      liquidityFactor,
    },
    reason,
  };
}

// Master Analysis Execution for any custom instrument or market input
export function analyzeFinancialInstrument(req: MarketAnalysisRequest): MarketAnalysisResult {
  const symbol = (req.symbol || 'CUSTOM').toUpperCase();
  const name = req.name || `${symbol} Market Instrument`;
  const assetClass = req.assetClass || 'EQUITY';
  const currentPrice = req.price || 100.0;
  const change24h = req.change24h ?? 2.1;
  const volatility = req.volatility ?? 24.0;
  const rsi = req.rsi ?? 58.0;
  const movingAverageStatus = req.movingAverageStatus || 'GOLDEN_CROSS';
  const volumeSurgeRatio = req.volumeSurgeRatio ?? 1.5;
  const newsSentiment = req.newsSentiment ?? 0.4;
  const riskProfile = req.riskProfile || 'MODERATE';
  const horizon = req.investmentHorizon || 'TACTICAL_MONTHS';
  const capitalSize = req.capitalSize || 100000;

  // 1. Calculate Increase Likelihood
  const increaseCalc = calculateIncreaseLikelihood({
    price: currentPrice,
    change24h,
    rsi,
    movingAverageStatus,
    volumeSurgeRatio,
    newsSentiment,
    volatility,
  });

  // 2. Calculate Suitability
  const suitabilityCalc = calculateSuitability(
    {
      assetClass,
      volatility,
      beta: assetClass === 'CRYPTO' ? 2.2 : assetClass === 'EQUITY' ? 1.2 : 0.6,
      sharpeRatio: increaseCalc.likelihood >= 70 ? 2.1 : 1.3,
      increaseLikelihood: increaseCalc.likelihood,
    },
    riskProfile,
    horizon,
    capitalSize
  );

  // 3. Projected Price Targets
  const floorPercent = Math.max(3.5, volatility * 0.45);
  const floorStopLoss = parseFloat((currentPrice * (1 - floorPercent / 100)).toFixed(2));
  const baseTarget = parseFloat((currentPrice * (1 + increaseCalc.projectedReturnPercent.base / 100)).toFixed(2));
  const bullExpansionTarget = parseFloat((currentPrice * (1 + increaseCalc.projectedReturnPercent.bullExpansion / 100)).toFixed(2));

  // Risk Reward Ratio
  const risk = Math.max(0.1, currentPrice - floorStopLoss);
  const reward = Math.max(0.1, baseTarget - currentPrice);
  const riskRewardRatio = parseFloat((reward / risk).toFixed(2));

  // Action Recommendation
  let actionRecommendation = 'HOLD / OBSERVE';
  if (increaseCalc.likelihood >= 78 && suitabilityCalc.suitabilityScore >= 70) {
    actionRecommendation = 'STRONG ACCUMULATE // TACTICAL BUY';
  } else if (increaseCalc.likelihood >= 60 && suitabilityCalc.suitabilityScore >= 60) {
    actionRecommendation = 'TACTICAL BUY ON PULLBACK';
  } else if (suitabilityCalc.suitabilityVerdict === 'UNSUITABLE_HIGH_RISK') {
    actionRecommendation = 'UNSUITABLE RISK PROFILE MISMATCH // AVOID';
  } else if (increaseCalc.likelihood <= 40) {
    actionRecommendation = 'REDUCE EXPOSURE // HEDGE DOWNSIDE';
  } else {
    actionRecommendation = 'RANGEBOUND // SCALE SLOWLY';
  }

  const downsideRisks = [
    `Invalidation floor at $${floorStopLoss} (-${floorPercent.toFixed(1)}%) breaches key technical support.`,
    `Implied volatility at ${volatility.toFixed(1)}% can produce unexpected gap-down liquidity slippage.`,
    `Macro correlation risk: sensitivity to broader sector or central bank interest rate shocks.`,
  ];

  const summary = `Quantitative model calculates a ${increaseCalc.likelihood}% probability of upward price expansion over the ${horizon.toLowerCase().replace('_', ' ')} timeframe for ${symbol} (${name}). Expected base projection is +${increaseCalc.projectedReturnPercent.base}% ($${baseTarget}) with an asymmetric upside expansion potential of +${increaseCalc.projectedReturnPercent.bullExpansion}% ($${bullExpansionTarget}). For a ${riskProfile} investor profile, this instrument achieves a ${suitabilityCalc.suitabilityScore}% suitability rating (${suitabilityCalc.suitabilityVerdict.replace('_', ' ')}), with a maximum recommended capital weighting of ${suitabilityCalc.maxRecommendedWeight}%.`;

  return {
    symbol,
    name,
    assetClass,
    currentPrice,
    increaseLikelihood: increaseCalc.likelihood,
    increaseVerdict: increaseCalc.verdict,
    projectedReturnPercent: increaseCalc.projectedReturnPercent,
    projectedPriceTargets: {
      floorStopLoss,
      baseTarget,
      bullExpansionTarget,
    },
    riskRewardRatio,
    suitabilityScore: suitabilityCalc.suitabilityScore,
    suitabilityVerdict: suitabilityCalc.suitabilityVerdict,
    maxRecommendedWeight: suitabilityCalc.maxRecommendedWeight,
    suitabilityBreakdown: suitabilityCalc.breakdown,
    factorAttribution: {
      technicalScore: increaseCalc.factorScores.technical,
      momentumScore: increaseCalc.factorScores.momentum,
      liquidityScore: increaseCalc.factorScores.liquidity,
      macroSentimentScore: increaseCalc.factorScores.macro,
    },
    actionRecommendation,
    detailedAnalysisSummary: summary,
    downsideRisks,
    timestamp: new Date().toISOString(),
  };
}

// Macro Scenarios for What-If Stress Testing
export interface MacroScenario {
  id: string;
  title: string;
  description: string;
  impactSummary: string;
  multipliers: {
    EQUITY: { likelihood: number; vol: number };
    CRYPTO: { likelihood: number; vol: number };
    COMMODITY: { likelihood: number; vol: number };
    FOREX: { likelihood: number; vol: number };
    FIXED_INCOME: { likelihood: number; vol: number };
    INDEX: { likelihood: number; vol: number };
  };
}

export const MACRO_SCENARIOS: MacroScenario[] = [
  {
    id: 'fed-cut-50bps',
    title: 'Federal Reserve Easing (-50 bps)',
    description: 'Central bank aggressively lowers policy rate by 50 basis points to stimulate economic liquidity.',
    impactSummary: 'Massive liquidity surge favors Tech Equities and Crypto; weakens USD; bond yields drop (bond prices rally).',
    multipliers: {
      EQUITY: { likelihood: 1.15, vol: 0.9 },
      CRYPTO: { likelihood: 1.25, vol: 1.15 },
      COMMODITY: { likelihood: 1.10, vol: 1.05 },
      FOREX: { likelihood: 0.92, vol: 1.1 },
      FIXED_INCOME: { likelihood: 1.20, vol: 0.85 },
      INDEX: { likelihood: 1.12, vol: 0.88 },
    },
  },
  {
    id: 'geopolitical-flare',
    title: 'Geopolitical Conflict Flare-Up',
    description: 'Escalation of regional conflict impacting key maritime choke points and sovereign supply chains.',
    impactSummary: 'Defense contractors, Gold, and Crude Oil spike sharply; equity risk premiums compress; flight to safety.',
    multipliers: {
      EQUITY: { likelihood: 0.85, vol: 1.35 },
      CRYPTO: { likelihood: 0.88, vol: 1.40 },
      COMMODITY: { likelihood: 1.30, vol: 1.45 },
      FOREX: { likelihood: 1.05, vol: 1.25 },
      FIXED_INCOME: { likelihood: 1.15, vol: 1.1 },
      INDEX: { likelihood: 0.86, vol: 1.30 },
    },
  },
  {
    id: 'ai-capex-boom',
    title: 'Hyperscaler AI CapEx Expansion (+25%)',
    description: 'Top cloud titans announce accelerated $60B+ multi-quarter infrastructure procurement for AI clusters.',
    impactSummary: 'Semiconductor manufacturers, AI power grids, and cybersecurity providers surge; broader market follows.',
    multipliers: {
      EQUITY: { likelihood: 1.22, vol: 1.1 },
      CRYPTO: { likelihood: 1.10, vol: 1.05 },
      COMMODITY: { likelihood: 1.08, vol: 1.0 },
      FOREX: { likelihood: 1.0, vol: 0.95 },
      FIXED_INCOME: { likelihood: 0.95, vol: 1.0 },
      INDEX: { likelihood: 1.15, vol: 0.92 },
    },
  },
  {
    id: 'liquidity-tighten',
    title: 'Global Liquidity Contraction Shock',
    description: 'Sudden spike in short-term reverse repo rates and foreign currency reserve dumping.',
    impactSummary: 'Risk assets sell off; cash and short-term treasuries outperform; speculative high-beta assets contract.',
    multipliers: {
      EQUITY: { likelihood: 0.72, vol: 1.5 },
      CRYPTO: { likelihood: 0.60, vol: 1.7 },
      COMMODITY: { likelihood: 0.80, vol: 1.3 },
      FOREX: { likelihood: 0.95, vol: 1.2 },
      FIXED_INCOME: { likelihood: 1.18, vol: 0.9 },
      INDEX: { likelihood: 0.75, vol: 1.4 },
    },
  },
];
