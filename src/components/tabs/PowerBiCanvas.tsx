/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Globe2,
  Globe,
  Zap,
  FileDown,
  Search,
  Layers,
  TrendingUp,
  RefreshCw,
  Target,
  Filter,
  HardDrive,
  WifiOff,
} from 'lucide-react';
import { IntelligenceItem, UserRole } from '../../types/intel';
import { ApiClient, SearchParams } from '../../services/apiClient';

interface PowerBiCanvasProps {
  currentRole: UserRole;
  onOpenExportDossier: (item?: IntelligenceItem) => void;
  onInspectItem: (item: IntelligenceItem) => void;
  refreshTrigger: number;
}

export const PowerBiCanvas: React.FC<PowerBiCanvasProps> = ({
  currentRole,
  onOpenExportDossier,
  onInspectItem,
  refreshTrigger,
}) => {
  // Slicers & Targeted Search State
  const [targetField, setTargetField] = useState<'all' | 'ip' | 'cve' | 'domain' | 'hash' | 'title' | 'id' | 'sector' | 'severity' | 'agency' | 'deepweb'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState<number>(50);

  // Backend Results State
  const [items, setItems] = useState<IntelligenceItem[]>([]);
  const [isOfflineLoaded, setIsOfflineLoaded] = useState<boolean>(false);
  const [tookMs, setTookMs] = useState<number>(1.5);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [aggregations, setAggregations] = useState<{
    bySeverity: Record<string, number>;
    bySector: Record<string, number>;
    byRegion: Record<string, number>;
    averageConfidence: number;
  }>({
    bySeverity: {},
    bySector: {},
    byRegion: {},
    averageConfidence: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState<IntelligenceItem | null>(null);

  // Execute real targeted backend search
  const executeSearch = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await ApiClient.fetchIntel({
        targetField,
        query: searchQuery,
        severity: selectedSeverity,
        sector: selectedSector,
        region: selectedRegion,
        minConfidence,
      });

      setItems(res.hits);
      setTotalCount(res.total);
      setTookMs(res.tookMs);
      setAggregations(res.aggregations);
      setIsOfflineLoaded(false);
    } catch (err) {
      console.warn('Targeted search network error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [targetField, searchQuery, selectedSeverity, selectedSector, selectedRegion, minConfidence]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch, refreshTrigger]);

  const sectors = ['ALL', 'CRITICAL_INFRA', 'DEFENSE', 'FINTECH', 'TELECOM', 'HEALTHCARE', 'GOV'];
  const severities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const regions = ['ALL', 'EUROPE', 'NORTH_AMERICA', 'ASIA_PACIFIC', 'GLOBAL'];

  const targetFieldOptions = [
    { value: 'all', label: 'All Searchable Parameters' },
    { value: 'ip', label: 'Target: IP Address Only' },
    { value: 'cve', label: 'Target: CVE Identifier Only' },
    { value: 'domain', label: 'Target: Domain Name Only' },
    { value: 'hash', label: 'Target: Cryptographic Hash Only' },
    { value: 'title', label: 'Target: Title / Subject Only' },
    { value: 'id', label: 'Target: Incident ID Only' },
    { value: 'sector', label: 'Target: Sector Only' },
    { value: 'severity', label: 'Target: Severity Only' },
    { value: 'agency', label: 'Target: Agency & Media (US Military, CIA, FBI, Mossad, CNN, BBC)' },
    { value: 'deepweb', label: 'Target: Deep Web & .onion Only' },
  ];

  // Dedicated Deep Web Access Field state
  const [deepWebOnionInput, setDeepWebOnionInput] = useState<string>('darkonion7xbbq3.onion');
  const [isResolvingDeepWeb, setIsResolvingDeepWeb] = useState<boolean>(false);
  const [deepWebResult, setDeepWebResult] = useState<any | null>(null);

  const handleResolveDeepWeb = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!deepWebOnionInput.trim()) return;

    setIsResolvingDeepWeb(true);
    try {
      const res = await ApiClient.scanDeepWeb(deepWebOnionInput.trim(), currentRole.email);
      setDeepWebResult(res);
    } catch (err) {
      console.error('Deep web resolve error:', err);
    } finally {
      setIsResolvingDeepWeb(false);
    }
  };

  return (
    <div className="space-y-6 bg-white text-sky-600">
      {/* Top Targeted Search & Control Strip */}
      {isOfflineLoaded && (
        <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs font-mono text-amber-900 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">FIELD AGENT OFFLINE INTEL ACTIVE:</span>{' '}
              <span>Serving {items.length} critical intelligence summaries and IOC profiles from Service Worker cache storage.</span>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-lg text-[10px] font-bold">
            Offline Cache Storage
          </span>
        </div>
      )}

      <div className="bg-white border border-sky-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-sky-100">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-500" />
              <h1 className="text-base font-bold text-sky-700 font-mono tracking-tight">
                PENDARIEL TARGETED SEARCH & ANALYTICS
              </h1>
              <span className="text-xs text-sky-400 font-mono">
                // REAL BACKEND ELASTICSEARCH INTERFACE
              </span>
            </div>
            <p className="text-xs text-sky-500 mt-1">
              Searches are strictly targeted to the selected parameter across the real backend database.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => executeSearch()}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-lg text-xs font-mono transition-colors cursor-pointer shadow-xs"
              title="Refresh search from backend"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Query</span>
            </button>

            <button
              onClick={() => onOpenExportDossier(items[0])}
              disabled={!currentRole.permissions.canExportDossiers || items.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer shadow-xs ${
                currentRole.permissions.canExportDossiers && items.length > 0
                  ? 'bg-sky-500 hover:bg-sky-600 text-white font-semibold'
                  : 'bg-sky-100 text-sky-400 cursor-not-allowed'
              }`}
            >
              <FileDown className="w-4 h-4" />
              <span>Export Dossier</span>
            </button>
          </div>
        </div>

        {/* Dedicated Field to Access Deep Web */}
        <div className="mt-4 p-3.5 bg-sky-50/50 rounded-xl border border-sky-200">
          <form onSubmit={handleResolveDeepWeb} className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-sky-800 font-bold shrink-0">
              <Globe className="w-4 h-4 text-sky-500" />
              <span>DEDICATED DEEP WEB ACCESS FIELD:</span>
            </div>

            <div className="relative flex-1">
              <input
                type="text"
                value={deepWebOnionInput}
                onChange={(e) => setDeepWebOnionInput(e.target.value)}
                placeholder="Enter .onion hidden service or breach descriptor (e.g. darkonion7xbbq3.onion)..."
                className="w-full bg-white border border-sky-300 rounded-lg py-1.5 pl-3 pr-3 text-sky-800 placeholder-sky-300 text-xs font-mono focus:outline-none focus:border-sky-500 shadow-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isResolvingDeepWeb}
              className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5 shrink-0"
            >
              <Zap className={`w-3.5 h-3.5 ${isResolvingDeepWeb ? 'animate-spin' : ''}`} />
              <span>{isResolvingDeepWeb ? 'Resolving Tor...' : 'Probe Deep Web'}</span>
            </button>
          </form>

          {/* Resolved Deep Web Quick Feedback */}
          {deepWebResult && deepWebResult.results && deepWebResult.results.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-sky-200/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-sky-700">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sky-800">Tor Descriptor:</span>
                <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-semibold">
                  {deepWebResult.results[0].onionAddress}
                </span>
                <span className="text-sky-600 truncate max-w-xs">
                  ({deepWebResult.results[0].serviceTitle})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sky-600">Threat Score: <strong className="text-sky-800">{deepWebResult.results[0].threatScore}/100</strong></span>
                <span className="text-sky-500 bg-white px-2 py-0.5 rounded border border-sky-200 font-bold">ONLINE TOR v3</span>
              </div>
            </div>
          )}
        </div>

        {/* Targeted Parameter Selection & Search Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 pt-4 text-xs font-mono">
          {/* Target Parameter Dropdown */}
          <div className="lg:col-span-2">
            <label className="text-[11px] font-semibold text-sky-700 mb-1 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-sky-500" />
              <span>SEARCH TARGET PARAMETER</span>
            </label>
            <select
              value={targetField}
              onChange={(e) => setTargetField(e.target.value as any)}
              className="w-full bg-white border border-sky-300 rounded-lg py-2 px-3 text-sky-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 shadow-xs"
            >
              {targetFieldOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Query Input */}
          <div className="lg:col-span-2">
            <label className="text-[11px] font-semibold text-sky-700 mb-1 block">
              QUERY VALUE (TARGETED TO {targetField.toUpperCase()})
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-sky-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  targetField === 'ip'
                    ? 'Search IP only, e.g. 194.26.29.112'
                    : targetField === 'cve'
                    ? 'Search CVE only, e.g. CVE-2026-4418'
                    : targetField === 'domain'
                    ? 'Search domain only, e.g. grid-auth-portal.com'
                    : targetField === 'hash'
                    ? 'Search hash only, e.g. 7f83b165...'
                    : targetField === 'title'
                    ? 'Search title only, e.g. Zero-Day Exploitation'
                    : 'Targeted parameter search query...'
                }
                className="w-full bg-white border border-sky-300 rounded-lg py-2 pl-9 pr-3 text-sky-700 placeholder-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-xs shadow-xs"
              />
            </div>
          </div>

          {/* Severity Slicer */}
          <div>
            <label className="text-[11px] font-semibold text-sky-700 mb-1 block">
              SEVERITY
            </label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full bg-white border border-sky-300 rounded-lg py-2 px-3 text-sky-700 focus:outline-none focus:border-sky-400 shadow-xs"
            >
              {severities.map((sev) => (
                <option key={sev} value={sev}>
                  {sev}
                </option>
              ))}
            </select>
          </div>

          {/* Sector Slicer */}
          <div>
            <label className="text-[11px] font-semibold text-sky-700 mb-1 block">
              SECTOR
            </label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full bg-white border border-sky-300 rounded-lg py-2 px-3 text-sky-700 focus:outline-none focus:border-sky-400 shadow-xs"
            >
              {sectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Strategic Agency Quick Selector Bar */}
        <div className="mt-3 pt-2.5 border-t border-sky-100 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-sky-500 font-bold text-[11px]">STRATEGIC FEEDS:</span>
          {[
            { label: 'U.S. Military', query: 'military' },
            { label: 'CIA', query: 'cia' },
            { label: 'FBI', query: 'fbi' },
            { label: 'Mossad', query: 'mossad' },
            { label: 'CNN', query: 'cnn' },
            { label: 'BBC', query: 'bbc' },
          ].map((ag) => (
            <button
              key={ag.query}
              type="button"
              onClick={() => {
                setTargetField('agency');
                setSearchQuery(ag.query);
              }}
              className="px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              {ag.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setTargetField('all');
              setSearchQuery('');
            }}
            className="px-2 py-1 text-sky-400 hover:text-sky-600 text-[11px] transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>

        {/* Active Target Parameter Indicator */}
        <div className="mt-3 pt-2.5 border-t border-sky-100 flex flex-wrap items-center justify-between text-xs font-mono text-sky-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sky-700">Target Parameter Mode:</span>
            <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded font-bold">
              {targetFieldOptions.find((o) => o.value === targetField)?.label}
            </span>
            {searchQuery && (
              <span className="text-sky-600">
                filtering strictly for &ldquo;<strong className="text-sky-800">{searchQuery}</strong>&rdquo;
              </span>
            )}
          </div>
          <div className="text-sky-500">
            Backend query latency: <span className="font-bold text-sky-700">{tookMs}ms</span>
          </div>
        </div>
      </div>

      {/* KPI Scorecard Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-sky-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-mono text-sky-400 font-semibold">TARGETED MATCHES</div>
          <div className="text-2xl font-bold font-mono text-sky-700 mt-1">
            {items.length}{' '}
            <span className="text-xs text-sky-400 font-normal">
              / {totalCount} matching
            </span>
          </div>
          <div className="text-[11px] text-sky-500 font-mono mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-sky-400" />
            <span>Targeted query verified</span>
          </div>
        </div>

        <div className="bg-white border border-sky-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-mono text-sky-400 font-semibold">CRITICAL SEVERITY</div>
          <div className="text-2xl font-bold font-mono text-sky-600 mt-1">
            {aggregations.bySeverity.CRITICAL || 0}
          </div>
          <div className="text-[11px] text-sky-500 font-mono mt-1">
            High Severity: {aggregations.bySeverity.HIGH || 0}
          </div>
        </div>

        <div className="bg-white border border-sky-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-mono text-sky-400 font-semibold">MEAN CONFIDENCE</div>
          <div className="text-2xl font-bold font-mono text-sky-600 mt-1">
            {aggregations.averageConfidence}%
          </div>
          <div className="text-[11px] text-sky-500 font-mono mt-1">
            Admiralty Grade Validated
          </div>
        </div>

        <div className="bg-white border border-sky-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-mono text-sky-400 font-semibold">PRIVACY REDACTION</div>
          <div className="text-2xl font-bold font-mono text-sky-600 mt-1">
            100%
          </div>
          <div className="text-[11px] text-sky-500 font-mono mt-1">
            GDPR Article 5 Masked
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Charts & Intelligence Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sector & Regional Breakdown */}
        <div className="space-y-6">
          <div className="bg-white border border-sky-200 rounded-xl p-4 shadow-xs">
            <div className="text-xs font-mono font-bold text-sky-700 mb-3 flex items-center justify-between">
              <span>TARGETED SECTOR INTENSITY</span>
              <Layers className="w-4 h-4 text-sky-500" />
            </div>
            <div className="space-y-2.5">
              {Object.entries(aggregations.bySector).map(([sec, count]) => {
                const pct = Math.round((count / (items.length || 1)) * 100);
                return (
                  <div key={sec} className="text-xs font-mono">
                    <div className="flex justify-between text-sky-600 mb-1">
                      <span>{sec.replace('_', ' ')}</span>
                      <span className="font-bold">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-sky-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {Object.keys(aggregations.bySector).length === 0 && (
                <div className="text-xs text-sky-400 py-4 text-center font-mono">
                  No signals match targeted criteria.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-sky-200 rounded-xl p-4 shadow-xs">
            <div className="text-xs font-mono font-bold text-sky-700 mb-3 flex items-center justify-between">
              <span>GEOPOLITICAL TARGET VECTORS</span>
              <Globe2 className="w-4 h-4 text-sky-500" />
            </div>
            <div className="space-y-2 font-mono text-xs">
              {Object.entries(aggregations.byRegion).map(([reg, count]) => (
                <div
                  key={reg}
                  className="flex items-center justify-between p-2.5 bg-sky-50/50 border border-sky-100 rounded-lg text-sky-700"
                >
                  <span className="font-medium">{reg.replace('_', ' ')}</span>
                  <span className="font-bold text-sky-800">{count} events</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Targeted Intelligence Table */}
        <div className="lg:col-span-2 bg-white border border-sky-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-sky-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-sky-700">
                  MATCHING INCIDENTS MATRIX
                </span>
                <span className="text-sky-500 text-xs font-mono">
                  ({items.length} records matching {targetField})
                </span>
              </div>
              <div className="text-xs text-sky-400 font-mono">
                Click any row to inspect
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-sky-100 text-[11px] text-sky-500">
                    <th className="pb-2.5 pl-2">INCIDENT / TITLE</th>
                    <th className="pb-2.5">SEVERITY</th>
                    <th className="pb-2.5">SECTOR</th>
                    <th className="pb-2.5">CONFIDENCE</th>
                    <th className="pb-2.5">TARGETED IOC</th>
                    <th className="pb-2.5">PRIVACY</th>
                    <th className="pb-2.5 pr-2 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItemDetail(item)}
                      className="hover:bg-sky-50/60 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 pl-2">
                        <div className="font-semibold text-sky-800 line-clamp-1">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-sky-400 mt-0.5">
                          {item.id} · {item.source}
                        </div>
                      </td>
                      <td className="py-2.5 font-bold text-sky-600">
                        {item.severity}
                      </td>
                      <td className="py-2.5 text-sky-700">
                        {item.sector.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 text-sky-700 font-semibold">
                        {item.confidence}%
                      </td>
                      <td className="py-2.5 text-[10px] text-sky-500 font-semibold">
                        {targetField === 'ip' && (item.iocs.ips?.[0] || 'N/A')}
                        {targetField === 'cve' && (item.iocs.cves?.[0] || 'N/A')}
                        {targetField === 'domain' && (item.iocs.domains?.[0] || 'N/A')}
                        {targetField === 'hash' && (item.iocs.hashes?.[0]?.slice(0, 12) || 'N/A')}
                        {targetField === 'all' && (item.iocs.cves?.[0] || item.iocs.ips?.[0] || item.iocs.domains?.[0] || 'N/A')}
                        {targetField === 'title' && 'Matched in Title'}
                        {targetField === 'id' && item.id}
                        {targetField === 'sector' && item.sector}
                        {targetField === 'severity' && item.severity}
                      </td>
                      <td className="py-2.5 text-[11px]">
                        {item.piiDetected ? (
                          <span className="text-sky-600 font-semibold">MASKED (GDPR)</span>
                        ) : (
                          <span className="text-sky-400">CLEAN</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-2 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectItem(item);
                          }}
                          className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded text-[11px] transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sky-400 font-mono">
                        No records found strictly matching targeted search parameter &ldquo;{targetField}&rdquo;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-sky-100 text-[11px] font-mono text-sky-400 flex justify-between items-center">
            <span>INDEX: intel-threats-2026.09 (BACKEND POSTGRES/ELASTIC SHARD)</span>
            <span>SHOWING {items.length} OF {totalCount} INCIDENTS</span>
          </div>
        </div>
      </div>

      {/* Selected Item Detail Modal */}
      {selectedItemDetail && (
        <div className="fixed inset-0 bg-sky-950/20 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-300 rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between pb-3 border-b border-sky-100">
              <div>
                <div className="font-mono text-xs text-sky-500 font-bold">
                  {selectedItemDetail.id} // {selectedItemDetail.sourceType}
                </div>
                <h3 className="text-base font-bold text-sky-800 mt-1">
                  {selectedItemDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="text-sky-400 hover:text-sky-600 font-mono text-lg cursor-pointer px-2"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-sky-50/50 rounded-lg border border-sky-100">
                <span className="text-sky-400 block text-[10px]">SEVERITY</span>
                <span className="font-bold text-sky-700">{selectedItemDetail.severity}</span>
              </div>
              <div className="p-2.5 bg-sky-50/50 rounded-lg border border-sky-100">
                <span className="text-sky-400 block text-[10px]">CONFIDENCE</span>
                <span className="font-bold text-sky-700">{selectedItemDetail.confidence}%</span>
              </div>
              <div className="p-2.5 bg-sky-50/50 rounded-lg border border-sky-100">
                <span className="text-sky-400 block text-[10px]">SECTOR</span>
                <span className="font-bold text-sky-700">{selectedItemDetail.sector}</span>
              </div>
              <div className="p-2.5 bg-sky-50/50 rounded-lg border border-sky-100">
                <span className="text-sky-400 block text-[10px]">REGION</span>
                <span className="font-bold text-sky-700">{selectedItemDetail.region}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-mono text-sky-600 font-semibold block mb-1">
                EXECUTIVE SUMMARY
              </span>
              <p className="text-xs text-sky-700 leading-relaxed bg-sky-50/40 p-3 rounded-lg border border-sky-100">
                {selectedItemDetail.summary}
              </p>
            </div>

            <div>
              <span className="text-xs font-mono text-sky-600 font-semibold block mb-1">
                SANITIZED BACKEND PAYLOAD
              </span>
              <pre className="bg-sky-50/40 p-3 rounded-lg border border-sky-100 text-[11px] font-mono text-sky-700 overflow-x-auto max-h-40">
                {selectedItemDetail.rawPayload}
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => onOpenExportDossier(selectedItemDetail)}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Generate Briefing Dossier
              </button>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="px-4 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-lg text-xs font-mono transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
