/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  BarChart3,
  Sliders,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Layers,
  Crosshair,
  FileText,
  Activity,
  Maximize2,
  Download,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  FinancialInstrument,
  RiskProfileType,
  InvestmentHorizon,
  AssetClass,
  MarketAnalysisRequest,
  MarketAnalysisResult,
  UserRole,
} from '../../types/intel';
import {
  INITIAL_FINANCIAL_INSTRUMENTS,
  analyzeFinancialInstrument,
  calculateSuitability,
  MACRO_SCENARIOS,
  MacroScenario,
} from '../../data/financialData';
import { ApiClient } from '../../services/apiClient';

interface FinancialAnalysisViewProps {
  currentRole: UserRole;
  onNavigateToTab?: (tab: string) => void;
}

export const FinancialAnalysisView: React.FC<FinancialAnalysisViewProps> = ({
  currentRole,
}) => {
  // Master State
  const [instruments, setInstruments] = useState<FinancialInstrument[]>(INITIAL_FINANCIAL_INSTRUMENTS);
  const [selectedInstrument, setSelectedInstrument] = useState<FinancialInstrument>(INITIAL_FINANCIAL_INSTRUMENTS[0]);
  const [activeAssetFilter, setActiveAssetFilter] = useState<string>('ALL');
  const [activeSuitabilityFilter, setActiveSuitabilityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Investor Profile Parameters
  const [riskProfile, setRiskProfile] = useState<RiskProfileType>('MODERATE');
  const [investmentHorizon, setInvestmentHorizon] = useState<InvestmentHorizon>('TACTICAL_MONTHS');
  const [capitalAllocation, setCapitalAllocation] = useState<number>(100000);

  // Active Macro Stress Test Scenario
  const [activeMacroScenario, setActiveMacroScenario] = useState<MacroScenario | null>(null);

  // Custom Instrument Analysis Form State
  const [customForm, setCustomForm] = useState<MarketAnalysisRequest>({
    symbol: 'SOXX',
    name: 'iShares Semiconductor ETF',
    assetClass: 'EQUITY',
    price: 224.50,
    change24h: 3.2,
    volatility: 26.5,
    rsi: 62.0,
    movingAverageStatus: 'GOLDEN_CROSS',
    volumeSurgeRatio: 1.6,
    newsSentiment: 0.65,
    marketNarrative: 'Foundry utilization reaching 94% on enterprise AI accelerator delivery orders.',
  });

  // Latest Quantitative Analysis Result
  const [analysisResult, setAnalysisResult] = useState<MarketAnalysisResult | null>(() => {
    return analyzeFinancialInstrument({
      symbol: 'SOXX',
      name: 'iShares Semiconductor ETF',
      assetClass: 'EQUITY',
      price: 224.50,
      change24h: 3.2,
      volatility: 26.5,
      rsi: 62.0,
      movingAverageStatus: 'GOLDEN_CROSS',
      volumeSurgeRatio: 1.6,
      newsSentiment: 0.65,
      riskProfile: 'MODERATE',
      investmentHorizon: 'TACTICAL_MONTHS',
      capitalSize: 100000,
    });
  });

  // Chart UI state
  const [showSMA20, setShowSMA20] = useState<boolean>(true);
  const [showSMA50, setShowSMA50] = useState<boolean>(true);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Recalculate suitability when riskProfile or capital changes
  useEffect(() => {
    setInstruments((prev) =>
      prev.map((item) => {
        const suitability = calculateSuitability(
          {
            assetClass: item.assetClass,
            volatility: item.impliedVolatility,
            beta: item.beta,
            sharpeRatio: item.sharpeRatio,
            increaseLikelihood: item.increaseLikelihood,
          },
          riskProfile,
          investmentHorizon,
          capitalAllocation
        );
        return {
          ...item,
          suitabilityScore: suitability.suitabilityScore,
          suitabilityVerdict: suitability.suitabilityVerdict,
          maxRecommendedAllocationPercent: suitability.maxRecommendedWeight,
          suitabilityReason: suitability.reason,
        };
      })
    );

    // Update custom analysis result as well
    if (analysisResult) {
      const updated = analyzeFinancialInstrument({
        ...customForm,
        riskProfile,
        investmentHorizon,
        capitalSize: capitalAllocation,
      });
      setAnalysisResult(updated);
    }
  }, [riskProfile, investmentHorizon, capitalAllocation]);

  // Execute Analysis on Custom Inputs
  const handleRunAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      const params = {
        ...customForm,
        riskProfile,
        investmentHorizon,
        capitalSize: capitalAllocation,
      };

      // Call API or local fallback
      const apiRes = await ApiClient.analyzeMarketInstrument(params).catch(() => null);
      if (apiRes && apiRes.analysis) {
        setAnalysisResult(apiRes.analysis);
      } else {
        const localRes = analyzeFinancialInstrument(params);
        setAnalysisResult(localRes);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      const localRes = analyzeFinancialInstrument({
        ...customForm,
        riskProfile,
        investmentHorizon,
        capitalSize: capitalAllocation,
      });
      setAnalysisResult(localRes);
    } finally {
      setIsLoading(false);
    }
  };

  // Add analyzed instrument to screener list
  const handleAddAnalyzedToScreener = () => {
    if (!analysisResult) return;
    const existingIndex = instruments.findIndex((i) => i.symbol === analysisResult.symbol);
    const newInst: FinancialInstrument = {
      id: `inst-${analysisResult.symbol.toLowerCase()}-${Date.now()}`,
      symbol: analysisResult.symbol,
      name: analysisResult.name,
      assetClass: analysisResult.assetClass,
      price: analysisResult.currentPrice,
      currency: 'USD',
      change24h: customForm.change24h ?? 1.5,
      change7d: (customForm.change24h ?? 1.5) * 2.2,
      volume24h: '$1.4B',
      beta: analysisResult.assetClass === 'CRYPTO' ? 2.1 : 1.2,
      sharpeRatio: analysisResult.increaseLikelihood > 70 ? 2.2 : 1.4,
      rsi: customForm.rsi ?? 58,
      emaCross: customForm.movingAverageStatus === 'GOLDEN_CROSS' ? 'GOLDEN_CROSS' : 'NEUTRAL_ALIGN',
      impliedVolatility: customForm.volatility ?? 24.0,
      increaseLikelihood: analysisResult.increaseLikelihood,
      increaseVerdict: analysisResult.increaseVerdict,
      targetUpsidePercent: analysisResult.projectedReturnPercent.base,
      targetDownsideFloor: analysisResult.projectedPriceTargets.floorStopLoss,
      targetPriceUpper: analysisResult.projectedPriceTargets.baseTarget,
      suitabilityScore: analysisResult.suitabilityScore,
      suitabilityVerdict: analysisResult.suitabilityVerdict,
      maxRecommendedAllocationPercent: analysisResult.maxRecommendedWeight,
      macroCatalysts: [
        customForm.marketNarrative || 'Custom evaluated technical breakout and momentum vector.',
      ],
      technicalSummary: `Evaluation confirms ${analysisResult.increaseLikelihood}% upside probability with ${analysisResult.factorAttribution.momentumScore}/100 momentum strength.`,
      fundamentalSummary: `Target upside calculated at +${analysisResult.projectedReturnPercent.base}% ($${analysisResult.projectedPriceTargets.baseTarget}).`,
      suitabilityReason: analysisResult.actionRecommendation,
      historicalPrices: [
        { date: 'Day -4', price: analysisResult.currentPrice * 0.94, volume: 1200000 },
        { date: 'Day -3', price: analysisResult.currentPrice * 0.96, volume: 1500000 },
        { date: 'Day -2', price: analysisResult.currentPrice * 0.97, volume: 2100000 },
        { date: 'Day -1', price: analysisResult.currentPrice * 0.99, volume: 2800000 },
        { date: 'Today', price: analysisResult.currentPrice, volume: 3400000 },
      ],
      lastUpdated: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      const updated = [...instruments];
      updated[existingIndex] = newInst;
      setInstruments(updated);
      setSelectedInstrument(newInst);
    } else {
      setInstruments([newInst, ...instruments]);
      setSelectedInstrument(newInst);
    }
  };

  // Trigger Macro Scenario Stress Testing
  const handleApplyMacroScenario = async (scenario: MacroScenario) => {
    setActiveMacroScenario(scenario);
    setIsLoading(true);
    try {
      const res = await ApiClient.simulateMacroScenario(scenario.id, riskProfile).catch(() => null);
      if (res && res.updatedInstruments) {
        setInstruments(res.updatedInstruments);
        const currentSelected = res.updatedInstruments.find((i: any) => i.id === selectedInstrument.id);
        if (currentSelected) setSelectedInstrument(currentSelected);
      } else {
        // Local calculation fallback
        const updated = instruments.map((item) => {
          const multiplier = scenario.multipliers[item.assetClass] || { likelihood: 1.0, vol: 1.0 };
          const newLikelihood = Math.min(96, Math.max(10, Math.round(item.increaseLikelihood * multiplier.likelihood)));
          const newVol = parseFloat((item.impliedVolatility * multiplier.vol).toFixed(1));

          let newVerdict = item.increaseVerdict;
          if (newLikelihood >= 75) newVerdict = 'STRONG_SURGE';
          else if (newLikelihood >= 60) newVerdict = 'MODERATE_INCREASE';
          else if (newLikelihood >= 45) newVerdict = 'RANGEBOUND';
          else if (newLikelihood >= 30) newVerdict = 'CORRECTION_RISK';
          else newVerdict = 'BEARISH_DOWNWARD';

          const suitability = calculateSuitability(
            {
              assetClass: item.assetClass,
              volatility: newVol,
              beta: item.beta,
              sharpeRatio: item.sharpeRatio,
              increaseLikelihood: newLikelihood,
            },
            riskProfile,
            investmentHorizon,
            capitalAllocation
          );

          return {
            ...item,
            impliedVolatility: newVol,
            increaseLikelihood: newLikelihood,
            increaseVerdict: newVerdict,
            suitabilityScore: suitability.suitabilityScore,
            suitabilityVerdict: suitability.suitabilityVerdict,
            maxRecommendedAllocationPercent: suitability.maxRecommendedWeight,
            suitabilityReason: suitability.reason,
          };
        });
        setInstruments(updated);
        const curr = updated.find((i) => i.id === selectedInstrument.id);
        if (curr) setSelectedInstrument(curr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to Baseline Macro
  const handleResetMacro = () => {
    setActiveMacroScenario(null);
    setInstruments(INITIAL_FINANCIAL_INSTRUMENTS);
    const original = INITIAL_FINANCIAL_INSTRUMENTS.find((i) => i.id === selectedInstrument.id);
    if (original) setSelectedInstrument(original);
  };

  // Preset Ingestion for Rapid Evaluation
  const handleLoadPreset = (preset: {
    symbol: string;
    name: string;
    assetClass: AssetClass;
    price: number;
    change24h: number;
    volatility: number;
    rsi: number;
    maStatus: 'ABOVE_200_SMA' | 'BELOW_200_SMA' | 'GOLDEN_CROSS' | 'DEATH_CROSS';
    surgeRatio: number;
    sentiment: number;
    narrative: string;
  }) => {
    const updated = {
      symbol: preset.symbol,
      name: preset.name,
      assetClass: preset.assetClass,
      price: preset.price,
      change24h: preset.change24h,
      volatility: preset.volatility,
      rsi: preset.rsi,
      movingAverageStatus: preset.maStatus,
      volumeSurgeRatio: preset.surgeRatio,
      newsSentiment: preset.sentiment,
      marketNarrative: preset.narrative,
    };
    setCustomForm(updated);

    const res = analyzeFinancialInstrument({
      ...updated,
      riskProfile,
      investmentHorizon,
      capitalSize: capitalAllocation,
    });
    setAnalysisResult(res);
  };

  // Filtered Screener Instruments
  const filteredInstruments = useMemo(() => {
    return instruments.filter((item) => {
      if (activeAssetFilter !== 'ALL' && item.assetClass !== activeAssetFilter) {
        return false;
      }
      if (activeSuitabilityFilter === 'HIGH' && item.suitabilityScore < 80) {
        return false;
      }
      if (activeSuitabilityFilter === 'SURGE' && item.increaseLikelihood < 70) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSymbol = item.symbol.toLowerCase().includes(q);
        const matchName = item.name.toLowerCase().includes(q);
        const matchClass = item.assetClass.toLowerCase().includes(q);
        const matchCatalyst = item.macroCatalysts.some((c) => c.toLowerCase().includes(q));
        if (!matchSymbol && !matchName && !matchClass && !matchCatalyst) return false;
      }
      return true;
    });
  }, [instruments, activeAssetFilter, activeSuitabilityFilter, searchQuery]);

  // Aggregate Market Basket Metrics
  const marketMetrics = useMemo(() => {
    const avgIncrease = Math.round(
      instruments.reduce((acc, i) => acc + i.increaseLikelihood, 0) / instruments.length
    );
    const avgSuitability = Math.round(
      instruments.reduce((acc, i) => acc + i.suitabilityScore, 0) / instruments.length
    );
    const highSuitabilityCount = instruments.filter((i) => i.suitabilityScore >= 80).length;
    const strongSurgeCount = instruments.filter((i) => i.increaseLikelihood >= 75).length;
    return { avgIncrease, avgSuitability, highSuitabilityCount, strongSurgeCount };
  }, [instruments]);

  // Chart Rendering Math for Selected Instrument
  const chartData = useMemo(() => {
    const prices = selectedInstrument.historicalPrices || [];
    if (prices.length === 0) {
      return {
        pricePath: '',
        sma20Path: '',
        sma50Path: '',
        min: 0,
        max: 1,
        coords: [] as { x: number; y: number; pt: any }[],
        width: 640,
        height: 220,
      };
    }

    const rawPrices = prices.map((p) => p.price);
    const minPrice = Math.min(...rawPrices) * 0.98;
    const maxPrice = Math.max(...rawPrices) * 1.02;
    const range = maxPrice - minPrice || 1;

    const width = 640;
    const height = 220;
    const padding = 20;

    const coords = prices.map((pt, index) => {
      const x = padding + (index / (prices.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((pt.price - minPrice) / range) * (height - 2 * padding);
      return { x, y, pt };
    });

    const pricePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');

    // SMA 20 Path
    const sma20Coords = prices
      .map((pt, index) => {
        if (!pt.sma20) return null;
        const x = padding + (index / (prices.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((pt.sma20 - minPrice) / range) * (height - 2 * padding);
        return { x, y };
      })
      .filter(Boolean) as { x: number; y: number }[];

    const sma20Path = sma20Coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');

    // SMA 50 Path
    const sma50Coords = prices
      .map((pt, index) => {
        if (!pt.sma50) return null;
        const x = padding + (index / (prices.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((pt.sma50 - minPrice) / range) * (height - 2 * padding);
        return { x, y };
      })
      .filter(Boolean) as { x: number; y: number }[];

    const sma50Path = sma50Coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');

    return {
      pricePath,
      sma20Path,
      sma50Path,
      min: minPrice,
      max: maxPrice,
      coords,
      width,
      height,
    };
  }, [selectedInstrument]);

  // Export Financial Dossier Handler
  const handleExportDossier = () => {
    const report = {
      title: 'PENDARIEL FINANCIAL & MARKET SUITABILITY INTELLIGENCE DOSSIER',
      classification: 'CONFIDENTIAL // TACTICAL ASSET ALLOCATION',
      timestamp: new Date().toISOString(),
      investorProfile: {
        mandate: riskProfile,
        horizon: investmentHorizon,
        capitalSizeUSD: capitalAllocation,
      },
      macroRegime: activeMacroScenario ? activeMacroScenario.title : 'Baseline Global Liquidity',
      aggregateMetrics: marketMetrics,
      evaluatedInstruments: instruments.map((i) => ({
        symbol: i.symbol,
        name: i.name,
        assetClass: i.assetClass,
        priceUSD: i.price,
        increaseLikelihoodPercent: i.increaseLikelihood,
        increaseVerdict: i.increaseVerdict,
        suitabilityScorePercent: i.suitabilityScore,
        suitabilityVerdict: i.suitabilityVerdict,
        recommendedAllocationPercent: i.maxRecommendedAllocationPercent,
        recommendedCapitalUSD: (capitalAllocation * (i.maxRecommendedAllocationPercent / 100)).toFixed(2),
        downsideFloorUSD: i.targetDownsideFloor,
        targetProjectionUSD: i.targetPriceUpper,
        macroCatalysts: i.macroCatalysts,
      })),
      customAnalysisResult: analysisResult,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pendariel_Financial_Analysis_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-mono text-sky-800 animate-fadeIn">
      {/* 1. Master Header & Operational Parameter Bar */}
      <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-sky-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
                <BarChart3 className="w-5 h-5 text-sky-600" />
              </span>
              <div>
                <h1 className="text-lg font-bold text-sky-950 tracking-tight">
                  Financial & Market Intelligence Engine
                </h1>
                <p className="text-xs text-sky-500 font-sans">
                  Quantitative surge probability, technical momentum forecasting, and risk-profile suitability determination.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {activeMacroScenario && (
              <button
                type="button"
                onClick={handleResetMacro}
                className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Macro Shock</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportDossier}
              className="px-3.5 py-1.5 rounded-xl border border-sky-300 bg-sky-50 text-sky-700 text-xs font-bold hover:bg-sky-100 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Export complete market intelligence dossier as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Market Dossier</span>
            </button>
          </div>
        </div>

        {/* Investor Mandate & Risk Profile Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 text-xs">
          {/* Investor Profile */}
          <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3">
            <label className="text-[11px] font-bold text-sky-500 uppercase tracking-wider block mb-1">
              Investor Risk Profile
            </label>
            <select
              value={riskProfile}
              onChange={(e) => setRiskProfile(e.target.value as RiskProfileType)}
              className="w-full bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 font-bold text-sky-900 focus:outline-hidden focus:border-sky-500 cursor-pointer"
            >
              <option value="CONSERVATIVE">Conservative (Preservation / &lt;6% DD)</option>
              <option value="MODERATE">Moderate (Balanced / &lt;14% DD)</option>
              <option value="AGGRESSIVE">Aggressive (High Alpha / &lt;25% DD)</option>
              <option value="SPECULATIVE">Speculative (Asymmetric / Momentum)</option>
            </select>
          </div>

          {/* Investment Horizon */}
          <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3">
            <label className="text-[11px] font-bold text-sky-500 uppercase tracking-wider block mb-1">
              Investment Horizon
            </label>
            <select
              value={investmentHorizon}
              onChange={(e) => setInvestmentHorizon(e.target.value as InvestmentHorizon)}
              className="w-full bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 font-bold text-sky-900 focus:outline-hidden focus:border-sky-500 cursor-pointer"
            >
              <option value="INTRADAY">Intraday / Scalp (&lt; 24h)</option>
              <option value="SWING_WEEKS">Swing (1 - 4 Weeks)</option>
              <option value="TACTICAL_MONTHS">Tactical (1 - 6 Months)</option>
              <option value="STRATEGIC_YEARS">Strategic Core (&gt; 1 Year)</option>
            </select>
          </div>

          {/* Capital Allocation Size */}
          <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3">
            <label className="text-[11px] font-bold text-sky-500 uppercase tracking-wider block mb-1">
              Deployable Capital Pool
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1.5 text-sky-400 font-bold">$</span>
              <input
                type="number"
                min="5000"
                step="5000"
                value={capitalAllocation}
                onChange={(e) => setCapitalAllocation(Math.max(1000, Number(e.target.value)))}
                className="w-full pl-6 pr-2.5 py-1.5 bg-white border border-sky-200 rounded-lg font-bold text-sky-900 focus:outline-hidden focus:border-sky-500"
              />
            </div>
          </div>

          {/* Active Macro Environment */}
          <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3 flex flex-col justify-between">
            <label className="text-[11px] font-bold text-sky-500 uppercase tracking-wider block mb-1">
              Active Macro Regime
            </label>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-900 truncate">
                {activeMacroScenario ? activeMacroScenario.title : 'Baseline Liquidity'}
              </span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </div>
          </div>
        </div>

        {/* Aggregate Market KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-sky-100">
          <div className="p-2.5 bg-sky-50/40 rounded-xl border border-sky-100">
            <span className="text-[10px] text-sky-400 uppercase font-bold block">Basket Surge Likelihood</span>
            <span className="text-lg font-extrabold text-sky-900">{marketMetrics.avgIncrease}%</span>
            <span className="text-[10px] text-emerald-600 block font-sans">Bullish Bias (+1.8σ)</span>
          </div>

          <div className="p-2.5 bg-sky-50/40 rounded-xl border border-sky-100">
            <span className="text-[10px] text-sky-400 uppercase font-bold block">Avg Profile Suitability</span>
            <span className="text-lg font-extrabold text-sky-900">{marketMetrics.avgSuitability}%</span>
            <span className="text-[10px] text-sky-600 block font-sans">Aligned to {riskProfile}</span>
          </div>

          <div className="p-2.5 bg-sky-50/40 rounded-xl border border-sky-100">
            <span className="text-[10px] text-sky-400 uppercase font-bold block">High Conviction Surges</span>
            <span className="text-lg font-extrabold text-emerald-700">{marketMetrics.strongSurgeCount} Assets</span>
            <span className="text-[10px] text-emerald-600 block font-sans">&gt;75% Upward Probability</span>
          </div>

          <div className="p-2.5 bg-sky-50/40 rounded-xl border border-sky-100">
            <span className="text-[10px] text-sky-400 uppercase font-bold block">Mandate Compliant</span>
            <span className="text-lg font-extrabold text-sky-900">{marketMetrics.highSuitabilityCount} of {instruments.length}</span>
            <span className="text-[10px] text-sky-500 block font-sans">Within Drawdown Thresholds</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Custom Instrument & Market Analyzer (User Ingestion) */}
      <div className="bg-white border-2 border-sky-300 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
              <Zap className="w-4 h-4 text-sky-600" />
            </span>
            <h2 className="text-sm font-bold text-sky-950 uppercase tracking-wider">
              Tactical Market Ingestion & Quantitative Evaluator
            </h2>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[11px] text-sky-400 font-bold uppercase">Presets:</span>
            <button
              type="button"
              onClick={() =>
                handleLoadPreset({
                  symbol: 'NVDA',
                  name: 'NVIDIA AI Compute',
                  assetClass: 'EQUITY',
                  price: 138.25,
                  change24h: 3.8,
                  volatility: 38.5,
                  rsi: 64.0,
                  maStatus: 'GOLDEN_CROSS',
                  surgeRatio: 1.8,
                  sentiment: 0.85,
                  narrative: 'Hyperscaler cluster capex acceleration and sovereign AI compute buildouts.',
                })
              }
              className="px-2 py-0.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-bold cursor-pointer transition-colors"
            >
              NVDA (AI Chips)
            </button>
            <button
              type="button"
              onClick={() =>
                handleLoadPreset({
                  symbol: 'BTC-USD',
                  name: 'Bitcoin Digital Reserve',
                  assetClass: 'CRYPTO',
                  price: 64850,
                  change24h: 4.2,
                  volatility: 54.0,
                  rsi: 68.0,
                  maStatus: 'GOLDEN_CROSS',
                  surgeRatio: 2.1,
                  sentiment: 0.75,
                  narrative: 'Institutional spot ETF weekly inflows positive with post-halving supply pinch.',
                })
              }
              className="px-2 py-0.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-bold cursor-pointer transition-colors"
            >
              BTC (Digital Asset)
            </button>
            <button
              type="button"
              onClick={() =>
                handleLoadPreset({
                  symbol: 'ITA',
                  name: 'Aerospace & Defense',
                  assetClass: 'EQUITY',
                  price: 146.80,
                  change24h: 1.2,
                  volatility: 16.4,
                  rsi: 59.0,
                  maStatus: 'GOLDEN_CROSS',
                  surgeRatio: 1.3,
                  sentiment: 0.7,
                  narrative: 'NATO 2.5% GDP defense spending baseline commitments expanding multi-year backlogs.',
                })
              }
              className="px-2 py-0.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-bold cursor-pointer transition-colors"
            >
              ITA (Defense)
            </button>
            <button
              type="button"
              onClick={() =>
                handleLoadPreset({
                  symbol: 'XAU/USD',
                  name: 'Spot Gold Bullion',
                  assetClass: 'COMMODITY',
                  price: 2658.40,
                  change24h: 0.9,
                  volatility: 14.8,
                  rsi: 65.0,
                  maStatus: 'GOLDEN_CROSS',
                  surgeRatio: 1.4,
                  sentiment: 0.8,
                  narrative: 'Central bank de-dollarization and reserve diversification bullion accumulation.',
                })
              }
              className="px-2 py-0.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-bold cursor-pointer transition-colors"
            >
              Gold (Reserve)
            </button>
          </div>
        </div>

        {/* Input Form & Real-Time Quantitative Dossier */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
          {/* Left Form: Ingest Market Parameters */}
          <form onSubmit={handleRunAnalysis} className="lg:col-span-5 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-sky-500 uppercase block mb-1">
                  Ticker / Symbol
                </label>
                <input
                  type="text"
                  required
                  value={customForm.symbol || ''}
                  onChange={(e) => setCustomForm({ ...customForm, symbol: e.target.value.toUpperCase() })}
                  className="w-full px-2.5 py-1.5 bg-sky-50/50 border border-sky-200 rounded-lg font-bold text-sky-900 uppercase focus:bg-white focus:outline-hidden focus:border-sky-500"
                  placeholder="e.g. QQQ"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-sky-500 uppercase block mb-1">
                  Asset Class
                </label>
                <select
                  value={customForm.assetClass}
                  onChange={(e) => setCustomForm({ ...customForm, assetClass: e.target.value as AssetClass })}
                  className="w-full px-2.5 py-1.5 bg-sky-50/50 border border-sky-200 rounded-lg font-bold text-sky-900 focus:bg-white focus:outline-hidden focus:border-sky-500 cursor-pointer"
                >
                  <option value="EQUITY">Equity / ETF</option>
                  <option value="CRYPTO">Crypto / Digital</option>
                  <option value="COMMODITY">Commodity / Energy</option>
                  <option value="FOREX">Forex / Currency</option>
                  <option value="FIXED_INCOME">Fixed Income / Rates</option>
                  <option value="INDEX">Market Index</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-sky-500 uppercase block mb-1">
                  Current Price ($)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={customForm.price || ''}
                  onChange={(e) => setCustomForm({ ...customForm, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 bg-sky-50/50 border border-sky-200 rounded-lg font-bold text-sky-900 focus:bg-white focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-sky-500 uppercase block mb-1">
                  24h Change (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={customForm.change24h || ''}
                  onChange={(e) => setCustomForm({ ...customForm, change24h: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 bg-sky-50/50 border border-sky-200 rounded-lg font-bold text-sky-900 focus:bg-white focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-sky-500 uppercase block mb-1">
                  Implied Vol (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={customForm.volatility || ''}
                  onChange={(e) => setCustomForm({ ...customForm, volatility: parseFloat(e.target.value) || 10 })}
                  className="w-full px-2.5 py-1.5 bg-sky-50/50 border border-sky-200 rounded-lg font-bold text-sky-900 focus:bg-white focus:outline-hidden focus:border-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-sky-500 uppercase block mb-1">
                  RSI (14-Day)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={customForm.rsi || ''}
                  onChange={(e) => setCustomForm({ ...customForm, rsi: parseFloat(e.target.value) || 50 })}
                  className="w-full px-2.5 py-1.5 bg-sky-50/50 border border-sky-200 rounded-lg font-bold text-sky-900 focus:bg-white focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-sky-500 uppercase block mb-1">
                  Trend Structure
                </label>
                <select
                  value={customForm.movingAverageStatus}
                  onChange={(e) => setCustomForm({ ...customForm, movingAverageStatus: e.target.value as any })}
                  className="w-full px-2 py-1.5 bg-sky-50/50 border border-sky-200 rounded-lg font-bold text-sky-900 focus:bg-white focus:outline-hidden focus:border-sky-500 cursor-pointer"
                >
                  <option value="GOLDEN_CROSS">Golden Cross (Bull)</option>
                  <option value="ABOVE_200_SMA">Above 200 SMA</option>
                  <option value="BELOW_200_SMA">Below 200 SMA</option>
                  <option value="DEATH_CROSS">Death Cross (Bear)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-sky-500 uppercase block mb-1">
                  Volume Surge
                </label>
                <select
                  value={customForm.volumeSurgeRatio}
                  onChange={(e) => setCustomForm({ ...customForm, volumeSurgeRatio: parseFloat(e.target.value) })}
                  className="w-full px-2 py-1.5 bg-sky-50/50 border border-sky-200 rounded-lg font-bold text-sky-900 focus:bg-white focus:outline-hidden focus:border-sky-500 cursor-pointer"
                >
                  <option value="2.5">2.5x Institutional Surge</option>
                  <option value="1.8">1.8x Above Average</option>
                  <option value="1.3">1.3x Moderate Inflow</option>
                  <option value="0.8">0.8x Low Volume</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-sky-500 uppercase block mb-1">
                Market Narrative / Macro Catalyst
              </label>
              <textarea
                rows={2}
                value={customForm.marketNarrative || ''}
                onChange={(e) => setCustomForm({ ...customForm, marketNarrative: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-sky-50/50 border border-sky-200 rounded-lg text-sky-900 focus:bg-white focus:outline-hidden focus:border-sky-500 font-sans text-xs"
                placeholder="Key catalyst driving flows, regulatory changes, central bank policy..."
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Activity className="w-4 h-4" />
                <span>{isLoading ? 'Computing Vectors...' : 'Run Quantitative Analysis'}</span>
              </button>

              <button
                type="button"
                onClick={handleAddAnalyzedToScreener}
                className="py-2 px-3 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Add this analyzed instrument to the live screener list"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Add to Screener</span>
              </button>
            </div>
          </form>

          {/* Right Panel: High-Impact Analysis Scorecard & Verdict */}
          {analysisResult && (
            <div className="lg:col-span-7 bg-sky-50/50 border border-sky-200 rounded-xl p-4 flex flex-col justify-between space-y-4">
              {/* Top Score Ribbon */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-200/80 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-sky-950">
                      {analysisResult.symbol}
                    </span>
                    <span className="text-xs text-sky-500 font-sans">
                      {analysisResult.name}
                    </span>
                  </div>
                  <div className="text-xs text-sky-600 mt-0.5">
                    Current: <span className="font-bold text-sky-900">${analysisResult.currentPrice.toFixed(2)}</span>
                    <span className="mx-2 text-sky-300">·</span>
                    Risk/Reward: <span className="font-bold text-emerald-700">{analysisResult.riskRewardRatio} : 1</span>
                  </div>
                </div>

                {/* Tactical Action Banner */}
                <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  analysisResult.increaseLikelihood >= 75
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                    : analysisResult.increaseLikelihood >= 60
                    ? 'bg-sky-100 border-sky-300 text-sky-900'
                    : 'bg-amber-100 border-amber-300 text-amber-900'
                }`}>
                  {analysisResult.actionRecommendation}
                </div>
              </div>

              {/* Increase Likelihood vs Suitability Dual Meters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Increase Likelihood Meter */}
                <div className="bg-white border border-sky-200 rounded-xl p-3 shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-sky-500 uppercase">
                      Surge / Increase Probability
                    </span>
                    <span className="text-base font-extrabold text-sky-950">
                      {analysisResult.increaseLikelihood}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-sky-100 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all duration-500 ${
                        analysisResult.increaseLikelihood >= 75
                          ? 'bg-emerald-500'
                          : analysisResult.increaseLikelihood >= 60
                          ? 'bg-sky-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${analysisResult.increaseLikelihood}%` }}
                    />
                  </div>

                  <div className="text-[11px] font-bold text-sky-700 flex items-center justify-between">
                    <span>Verdict: {analysisResult.increaseVerdict.replace('_', ' ')}</span>
                    <span className="text-emerald-700 font-extrabold">
                      +{analysisResult.projectedReturnPercent.base}% Base
                    </span>
                  </div>
                </div>

                {/* Suitability Match Meter */}
                <div className="bg-white border border-sky-200 rounded-xl p-3 shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-sky-500 uppercase">
                      Mandate Suitability ({riskProfile})
                    </span>
                    <span className="text-base font-extrabold text-sky-950">
                      {analysisResult.suitabilityScore}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-sky-100 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all duration-500 ${
                        analysisResult.suitabilityScore >= 80
                          ? 'bg-emerald-500'
                          : analysisResult.suitabilityScore >= 60
                          ? 'bg-sky-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${analysisResult.suitabilityScore}%` }}
                    />
                  </div>

                  <div className="text-[11px] font-bold text-sky-700 flex items-center justify-between">
                    <span>{analysisResult.suitabilityVerdict.replace('_', ' ')}</span>
                    <span className="text-sky-900 font-extrabold">
                      Max {analysisResult.maxRecommendedWeight}% Pool
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Corridor Projections */}
              <div className="bg-white border border-sky-200 rounded-xl p-3">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-2">
                  Quantitative Price Target Corridor
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                    <span className="text-[10px] text-rose-600 block font-bold">Invalidation Stop</span>
                    <span className="text-xs font-extrabold text-rose-900">
                      ${analysisResult.projectedPriceTargets.floorStopLoss}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-sky-50 border border-sky-200">
                    <span className="text-[10px] text-sky-600 block font-bold">Base Projection</span>
                    <span className="text-xs font-extrabold text-sky-900">
                      ${analysisResult.projectedPriceTargets.baseTarget}
                    </span>
                    <span className="text-[10px] text-emerald-600 block">
                      +{analysisResult.projectedReturnPercent.base}%
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] text-emerald-600 block font-bold">Bull Expansion</span>
                    <span className="text-xs font-extrabold text-emerald-900">
                      ${analysisResult.projectedPriceTargets.bullExpansionTarget}
                    </span>
                    <span className="text-[10px] text-emerald-600 block">
                      +{analysisResult.projectedReturnPercent.bullExpansion}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Quantitative Summary Text */}
              <div className="text-xs text-sky-900 font-sans bg-white p-3 rounded-xl border border-sky-200 leading-relaxed">
                <div className="font-bold font-mono text-[11px] text-sky-500 uppercase mb-1">
                  Intelligence Assessment Brief
                </div>
                {analysisResult.detailedAnalysisSummary}
              </div>

              {/* Sizing Recommendation in Dollars */}
              <div className="flex items-center justify-between text-xs bg-sky-100/70 px-3 py-2 rounded-xl text-sky-900 font-mono">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-sky-600" />
                  <span>Max Suggested Position for ${capitalAllocation.toLocaleString()}:</span>
                </div>
                <span className="font-extrabold text-sky-950">
                  ${((capitalAllocation * analysisResult.maxRecommendedWeight) / 100).toLocaleString()} ({analysisResult.maxRecommendedWeight}%)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Real-Time Interactive Market Screener & Charting Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Market Screener Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-sky-200 rounded-2xl p-4 shadow-xs space-y-3">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 pb-3">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-sky-600" />
              <h2 className="text-xs font-bold text-sky-950 uppercase tracking-wider">
                Multi-Asset Screener & Relative Strength
              </h2>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-sky-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol / catalyst..."
                className="w-full pl-8 pr-2 py-1 bg-sky-50 border border-sky-200 rounded-lg text-xs font-sans text-sky-900 focus:outline-hidden focus:border-sky-500"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['ALL', 'EQUITY', 'CRYPTO', 'COMMODITY', 'FOREX', 'FIXED_INCOME', 'INDEX'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveAssetFilter(cat)}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  activeAssetFilter === cat
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-100'
                }`}
              >
                {cat}
              </button>
            ))}

            <span className="text-sky-300">|</span>

            <button
              type="button"
              onClick={() => setActiveSuitabilityFilter(activeSuitabilityFilter === 'HIGH' ? 'ALL' : 'HIGH')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap cursor-pointer transition-colors ${
                activeSuitabilityFilter === 'HIGH'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              High Suitability (&gt;80%)
            </button>

            <button
              type="button"
              onClick={() => setActiveSuitabilityFilter(activeSuitabilityFilter === 'SURGE' ? 'ALL' : 'SURGE')}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap cursor-pointer transition-colors ${
                activeSuitabilityFilter === 'SURGE'
                  ? 'bg-sky-700 text-white'
                  : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
              }`}
            >
              Strong Surge (&gt;70%)
            </button>
          </div>

          {/* Screener Items Table */}
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto border border-sky-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-sky-50 text-sky-500 font-bold uppercase text-[10px] sticky top-0 z-10 border-b border-sky-200">
                <tr>
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-2">Price & 24h</th>
                  <th className="py-2.5 px-2 text-center">RSI</th>
                  <th className="py-2.5 px-2">Surge Likelihood</th>
                  <th className="py-2.5 px-2">Suitability ({riskProfile})</th>
                  <th className="py-2.5 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100">
                {filteredInstruments.map((item) => {
                  const isSelected = selectedInstrument.id === item.id;
                  const isBull = item.change24h >= 0;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedInstrument(item)}
                      className={`hover:bg-sky-50/70 transition-colors cursor-pointer ${
                        isSelected ? 'bg-sky-100/60 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-extrabold text-sky-950 flex items-center gap-1.5">
                          <span>{item.symbol}</span>
                          <span className="text-[10px] font-normal text-sky-400">
                            {item.assetClass}
                          </span>
                        </div>
                        <div className="text-[11px] text-sky-500 font-sans truncate max-w-[140px]">
                          {item.name}
                        </div>
                      </td>

                      <td className="py-2.5 px-2">
                        <div className="font-bold text-sky-900">
                          {item.currency === 'USD' ? '$' : ''}{item.price.toLocaleString()}
                        </div>
                        <div className={`text-[11px] font-bold flex items-center gap-0.5 ${
                          isBull ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isBull ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          <span>{isBull ? '+' : ''}{item.change24h}%</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                          item.rsi > 70
                            ? 'bg-rose-100 text-rose-800'
                            : item.rsi < 35
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}>
                          {item.rsi.toFixed(0)}
                        </span>
                      </td>

                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-extrabold ${
                            item.increaseLikelihood >= 75
                              ? 'text-emerald-700'
                              : item.increaseLikelihood >= 60
                              ? 'text-sky-700'
                              : 'text-amber-700'
                          }`}>
                            {item.increaseLikelihood}%
                          </span>
                        </div>
                        <div className="w-20 h-1.5 bg-sky-100 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full ${
                              item.increaseLikelihood >= 75
                                ? 'bg-emerald-500'
                                : item.increaseLikelihood >= 60
                                ? 'bg-sky-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${item.increaseLikelihood}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-extrabold ${
                            item.suitabilityScore >= 80
                              ? 'text-emerald-700'
                              : item.suitabilityScore >= 60
                              ? 'text-sky-700'
                              : 'text-rose-700'
                          }`}>
                            {item.suitabilityScore}%
                          </span>
                          <span className="text-[10px] text-sky-500">
                            (max {item.maxRecommendedAllocationPercent}%)
                          </span>
                        </div>
                        <div className="text-[10px] text-sky-500 font-sans truncate max-w-[130px]">
                          {item.suitabilityVerdict.replace('_', ' ')}
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInstrument(item);
                            // Pre-fill custom form with this instrument
                            setCustomForm({
                              symbol: item.symbol,
                              name: item.name,
                              assetClass: item.assetClass,
                              price: item.price,
                              change24h: item.change24h,
                              volatility: item.impliedVolatility,
                              rsi: item.rsi,
                              movingAverageStatus: item.emaCross === 'GOLDEN_CROSS' ? 'GOLDEN_CROSS' : 'ABOVE_200_SMA',
                              volumeSurgeRatio: 1.5,
                              newsSentiment: 0.6,
                              marketNarrative: item.macroCatalysts[0] || 'Relative strength breakout.',
                            });
                          }}
                          className="px-2 py-1 bg-white hover:bg-sky-50 border border-sky-200 rounded text-[11px] font-bold text-sky-700 cursor-pointer shadow-2xs"
                        >
                          Chart
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Interactive Technical Chart & Deep Dossier (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-sky-200 rounded-2xl p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-sky-950">
                  {selectedInstrument.symbol}
                </span>
                <span className="text-xs text-sky-500">
                  {selectedInstrument.name}
                </span>
              </div>
              <div className="text-xs text-sky-600 mt-0.5">
                Target Bull Upside: <span className="font-bold text-emerald-700">+{selectedInstrument.targetUpsidePercent}%</span> (${selectedInstrument.targetPriceUpper})
              </div>
            </div>

            {/* Toggle Indicators */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setShowSMA20(!showSMA20)}
                className={`px-2 py-0.5 rounded cursor-pointer font-bold ${
                  showSMA20 ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' : 'bg-sky-50 text-sky-400'
                }`}
              >
                SMA 20
              </button>
              <button
                type="button"
                onClick={() => setShowSMA50(!showSMA50)}
                className={`px-2 py-0.5 rounded cursor-pointer font-bold ${
                  showSMA50 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-sky-50 text-sky-400'
                }`}
              >
                SMA 50
              </button>
            </div>
          </div>

          {/* SVG Price Chart */}
          <div className="relative bg-sky-50/40 border border-sky-200 rounded-xl p-2 overflow-hidden">
            <svg
              viewBox={`0 0 ${chartData.width} ${chartData.height}`}
              className="w-full h-48 overflow-visible select-none"
            >
              {/* Horizontal Gridlines */}
              <line x1="20" y1="40" x2="620" y2="40" stroke="#bae6fd" strokeDasharray="3 3" strokeWidth="0.8" />
              <line x1="20" y1="110" x2="620" y2="110" stroke="#bae6fd" strokeDasharray="3 3" strokeWidth="0.8" />
              <line x1="20" y1="180" x2="620" y2="180" stroke="#bae6fd" strokeDasharray="3 3" strokeWidth="0.8" />

              {/* Price Path */}
              {chartData.pricePath && (
                <path
                  d={chartData.pricePath}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* SMA 20 Overlay (Cyan) */}
              {showSMA20 && chartData.sma20Path && (
                <path
                  d={chartData.sma20Path}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              )}

              {/* SMA 50 Overlay (Amber) */}
              {showSMA50 && chartData.sma50Path && (
                <path
                  d={chartData.sma50Path}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              )}

              {/* Interactive Points on Hover */}
              {chartData.coords.map((c, i) => (
                <circle
                  key={i}
                  cx={c.x}
                  cy={c.y}
                  r={hoveredPointIndex === i ? 5 : 2}
                  fill={hoveredPointIndex === i ? '#0369a1' : '#0284c7'}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredPointIndex(i)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                />
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPointIndex !== null && chartData.coords[hoveredPointIndex] && (
              <div className="absolute top-3 left-4 bg-sky-900/90 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none">
                <div>Date: {chartData.coords[hoveredPointIndex].pt.date}</div>
                <div className="font-bold text-sky-200">
                  Price: ${chartData.coords[hoveredPointIndex].pt.price.toFixed(2)}
                </div>
                {chartData.coords[hoveredPointIndex].pt.sma20 && (
                  <div className="text-cyan-300">
                    SMA20: ${chartData.coords[hoveredPointIndex].pt.sma20?.toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Technical Vector Attribution */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-100">
              <span className="text-[10px] text-sky-400 font-bold uppercase block">Beta to Benchmark</span>
              <span className="font-extrabold text-sky-900">{selectedInstrument.beta}x</span>
            </div>
            <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-100">
              <span className="text-[10px] text-sky-400 font-bold uppercase block">Sharpe Ratio</span>
              <span className="font-extrabold text-sky-900">{selectedInstrument.sharpeRatio.toFixed(2)}</span>
            </div>
          </div>

          {/* Macro Catalysts List */}
          <div className="space-y-1.5 text-xs">
            <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">
              Sovereign & Market Catalysts
            </span>
            <div className="space-y-1">
              {selectedInstrument.macroCatalysts.map((cat, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-sky-800 font-sans bg-sky-50/50 p-2 rounded-lg border border-sky-100">
                  <span className="text-sky-400 font-mono font-bold">›</span>
                  <span>{cat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suitability Determination Reason */}
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs">
            <div className="font-bold text-sky-900 flex items-center justify-between mb-1">
              <span>Suitability Reason:</span>
              <span className="text-emerald-700 font-extrabold">
                {selectedInstrument.suitabilityVerdict.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sky-700 font-sans leading-relaxed">
              {selectedInstrument.suitabilityReason}
            </p>
          </div>
        </div>
      </div>

      {/* 4. "What-If" Macro Stress-Testing & Shock Simulator */}
      <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-600" />
            <div>
              <h2 className="text-sm font-bold text-sky-950 uppercase tracking-wider">
                "What-If" Macro Stress Testing & Shock Simulator
              </h2>
              <p className="text-xs text-sky-500 font-sans">
                Simulate global liquidity shifts, geopolitical escalations, and monetary easing to stress-test your portfolio's increase probability and suitability.
              </p>
            </div>
          </div>

          {activeMacroScenario && (
            <span className="px-3 py-1 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold animate-pulse">
              Simulating: {activeMacroScenario.title}
            </span>
          )}
        </div>

        {/* 4 Clickable Scenarios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {MACRO_SCENARIOS.map((scen) => {
            const isActive = activeMacroScenario?.id === scen.id;

            return (
              <div
                key={scen.id}
                onClick={() => handleApplyMacroScenario(scen)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  isActive
                    ? 'bg-sky-50 border-2 border-sky-500 shadow-md ring-2 ring-sky-200'
                    : 'bg-white hover:bg-sky-50/70 border-sky-200 hover:border-sky-300 shadow-xs'
                }`}
              >
                <div>
                  <div className="font-extrabold text-sky-950 text-xs flex items-center justify-between">
                    <span>{scen.title}</span>
                    {isActive && <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />}
                  </div>
                  <p className="text-sky-600 font-sans text-[11px] mt-1 leading-normal">
                    {scen.description}
                  </p>
                </div>

                <div className="text-[10px] font-bold text-sky-800 bg-sky-100/60 p-1.5 rounded-lg border border-sky-200/60 font-mono">
                  {scen.impactSummary}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
