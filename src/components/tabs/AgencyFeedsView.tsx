/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Radio,
  Globe2,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Tv,
  Newspaper,
  Layers,
  ArrowRight,
  Terminal,
  Activity,
  Filter,
  Check,
  UserX,
  FileText,
  Zap,
} from 'lucide-react';
import { UserRole, AgencyId, AgencyCapability, AgencyDispatchItem } from '../../types/intel';
import { AGENCY_CAPABILITIES, INITIAL_AGENCY_DISPATCHES } from '../../data/mockData';
import { ApiClient } from '../../services/apiClient';

interface AgencyFeedsViewProps {
  currentRole: UserRole;
  onIngestSuccess?: () => void;
}

export const AgencyFeedsView: React.FC<AgencyFeedsViewProps> = ({
  currentRole,
  onIngestSuccess,
}) => {
  const [agencies, setAgencies] = useState<AgencyCapability[]>(AGENCY_CAPABILITIES);
  const [selectedAgencyId, setSelectedAgencyId] = useState<AgencyId | 'ALL'>('ALL');
  const [dispatches, setDispatches] = useState<AgencyDispatchItem[]>(INITIAL_AGENCY_DISPATCHES);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [ingestingId, setIngestingId] = useState<string | null>(null);
  const [ingestedIds, setIngestedIds] = useState<Set<string>>(new Set());

  // FBI Wanted Sub-Explorer state
  const [fbiWantedItems, setFbiWantedItems] = useState<any[]>([]);
  const [isLoadingFbi, setIsLoadingFbi] = useState<boolean>(false);
  const [fbiSearchQuery, setFbiSearchQuery] = useState<string>('');

  // CISA Known Exploited Vulnerabilities (KEV) state
  const [cisaKevItems, setCisaKevItems] = useState<any[]>([]);
  const [cisaMeta, setCisaMeta] = useState<{ catalogVersion?: string; dateReleased?: string; totalInCatalog?: number }>({});
  const [isLoadingCisa, setIsLoadingCisa] = useState<boolean>(false);
  const [cisaSearchQuery, setCisaSearchQuery] = useState<string>('');

  // CNN & BBC Live Wire state
  const [mediaWireItems, setMediaWireItems] = useState<any[]>([]);
  const [isLoadingWire, setIsLoadingWire] = useState<boolean>(false);
  const [mediaFilter, setMediaFilter] = useState<'ALL' | 'CNN' | 'BBC'>('ALL');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [agencyList, dispatchList] = await Promise.all([
        ApiClient.fetchAgencies().catch(() => AGENCY_CAPABILITIES),
        ApiClient.fetchAgencyDispatches(selectedAgencyId, searchQuery).catch(
          () => INITIAL_AGENCY_DISPATCHES
        ),
      ]);
      setAgencies(agencyList);
      setDispatches(dispatchList);
    } catch (err) {
      console.error('Failed to load agency feeds:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFbiWanted = async (query?: string) => {
    setIsLoadingFbi(true);
    try {
      const res = await ApiClient.fetchFbiWanted(query || fbiSearchQuery);
      if (res && res.items) {
        setFbiWantedItems(res.items);
      }
    } catch (e) {
      console.error('Failed to load FBI wanted list:', e);
    } finally {
      setIsLoadingFbi(false);
    }
  };

  const loadCisaKev = async (query?: string) => {
    setIsLoadingCisa(true);
    try {
      const res = await ApiClient.fetchCisaKev(query || cisaSearchQuery, 20);
      if (res && res.vulnerabilities) {
        setCisaKevItems(res.vulnerabilities);
        setCisaMeta({
          catalogVersion: res.catalogVersion,
          dateReleased: res.dateReleased,
          totalInCatalog: res.totalInCatalog,
        });
      }
    } catch (e) {
      console.error('Failed to load CISA KEV catalog:', e);
    } finally {
      setIsLoadingCisa(false);
    }
  };

  const loadMediaWire = async () => {
    setIsLoadingWire(true);
    try {
      const res = await ApiClient.fetchMediaLiveWire(mediaFilter);
      if (res && res.items) {
        setMediaWireItems(res.items);
      }
    } catch (e) {
      console.error('Failed to load media live wire:', e);
    } finally {
      setIsLoadingWire(false);
    }
  };

  useEffect(() => {
    loadData();
    loadFbiWanted();
    loadCisaKev();
    loadMediaWire();
  }, [selectedAgencyId]);

  useEffect(() => {
    loadFbiWanted();
    loadMediaWire();
  }, []);

  const handlePollAgencyFeed = async (agencyId: AgencyId) => {
    setIsPolling(true);
    try {
      const res = await ApiClient.pollAgencyFeed(agencyId, currentRole.email);
      if (res && res.dispatch) {
        setDispatches((prev) => [res.dispatch, ...prev]);
        const updatedAgencies = await ApiClient.fetchAgencies();
        setAgencies(updatedAgencies);
      }
    } catch (err: any) {
      alert(`Feed polling error: ${err.message}`);
    } finally {
      setIsPolling(false);
    }
  };

  const handleIngestDispatch = async (dispatch: AgencyDispatchItem) => {
    setIngestingId(dispatch.id);
    try {
      await ApiClient.ingestAgencyDispatch(dispatch.id, currentRole.email);
      setIngestedIds((prev) => new Set([...prev, dispatch.id]));
      if (onIngestSuccess) onIngestSuccess();
    } catch (err: any) {
      alert(`Ingest error: ${err.message}`);
    } finally {
      setIngestingId(null);
    }
  };

  const filteredDispatches = dispatches.filter((d) => {
    const matchAgency = selectedAgencyId === 'ALL' || d.agencyId === selectedAgencyId;
    const matchQuery =
      !searchQuery ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.agencyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.iocs?.actors && d.iocs.actors.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (d.iocs?.cves && d.iocs.cves.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchAgency && matchQuery;
  });

  const selectedAgencyProfile =
    selectedAgencyId !== 'ALL'
      ? agencies.find((a) => a.id === selectedAgencyId)
      : null;

  return (
    <div className="space-y-6 bg-white text-sky-600 font-mono">
      {/* Header Banner */}
      <div className="bg-white border-2 border-sky-300 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-sky-500" />
              <h1 className="text-base font-bold text-sky-800 tracking-tight">
                AGENCY & MEDIA
              </h1>
              <span className="text-xs text-sky-400 font-mono">
                // STRATEGIC INTELLIGENCE FEEDS & COLLECTION
              </span>
            </div>
            <p className="text-xs text-sky-500 mt-1 max-w-4xl">
              Real-time ingestion pipelines and verified intelligence dispatch matrices connecting <strong className="text-sky-800">U.S. Military (USCYBERCOM)</strong>, <strong className="text-sky-800">CIA (Open Source Enterprise)</strong>, <strong className="text-sky-800">FBI (Cyber Division & IC3)</strong>, <strong className="text-sky-800">Mossad</strong>, <strong className="text-sky-800">NSA</strong>, <strong className="text-sky-800">MI6/GCHQ</strong>, <strong className="text-sky-800">Interpol</strong>, alongside global broadcast wires from <strong className="text-sky-800">CNN</strong>, <strong className="text-sky-800">BBC</strong>, <strong className="text-sky-800">Reuters</strong>, <strong className="text-sky-800">AP News</strong>, and <strong className="text-sky-800">Al Jazeera</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadData();
                loadFbiWanted();
                loadMediaWire();
              }}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-sky-700 font-mono text-xs transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Synchronize Feeds</span>
            </button>
          </div>
        </div>

        {/* Global Capability Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 pt-4 border-t border-sky-100 text-xs">
          <div className="p-2 bg-sky-50/50 rounded-xl border border-sky-100">
            <span className="text-[10px] text-sky-400 font-bold block">U.S. MILITARY</span>
            <span className="text-sky-800 font-bold text-xs">USCYBERCOM</span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">● MIL-STD</span>
          </div>
          <div className="p-2 bg-sky-50/50 rounded-xl border border-sky-100">
            <span className="text-[10px] text-sky-400 font-bold block">CIA</span>
            <span className="text-sky-800 font-bold text-xs">Open Source Ent.</span>
            <span className="text-[10px] text-sky-600 block mt-0.5">● FOIA & OSE</span>
          </div>
          <div className="p-2 bg-sky-50/50 rounded-xl border border-sky-100">
            <span className="text-[10px] text-sky-400 font-bold block">FBI</span>
            <span className="text-sky-800 font-bold text-xs">Cyber & IC3 Wire</span>
            <span className="text-[10px] text-blue-600 block mt-0.5">● WANTED API</span>
          </div>
          <div className="p-2 bg-sky-50/50 rounded-xl border border-sky-100">
            <span className="text-[10px] text-sky-400 font-bold block">MOSSAD</span>
            <span className="text-sky-800 font-bold text-xs">INSS Strategic</span>
            <span className="text-[10px] text-indigo-600 block mt-0.5">● SIGINT</span>
          </div>
          <div className="p-2 bg-sky-50/50 rounded-xl border border-sky-100">
            <span className="text-[10px] text-sky-400 font-bold block">NSA</span>
            <span className="text-sky-800 font-bold text-xs">CTOC / Defense</span>
            <span className="text-[10px] text-teal-600 block mt-0.5">● QUANTUM DEF</span>
          </div>
          <div className="p-2 bg-sky-50/50 rounded-xl border border-sky-100">
            <span className="text-[10px] text-sky-400 font-bold block">MI6 / GCHQ</span>
            <span className="text-sky-800 font-bold text-xs">Secret Intel</span>
            <span className="text-[10px] text-cyan-600 block mt-0.5">● FIVE EYES</span>
          </div>
          <div className="p-2 bg-sky-50/50 rounded-xl border border-sky-100">
            <span className="text-[10px] text-sky-400 font-bold block">INTERPOL</span>
            <span className="text-sky-800 font-bold text-xs">Cyber Crime</span>
            <span className="text-[10px] text-amber-600 block mt-0.5">● PURPLE NOTICE</span>
          </div>
          <div className="p-2 bg-sky-50/50 rounded-xl border border-sky-100">
            <span className="text-[10px] text-sky-400 font-bold block">CNN</span>
            <span className="text-sky-800 font-bold text-xs">Breaking Wire</span>
            <span className="text-[10px] text-rose-600 block mt-0.5">● RSS 2.0</span>
          </div>
          <div className="p-2 bg-sky-50/50 rounded-xl border border-sky-100">
            <span className="text-[10px] text-sky-400 font-bold block">BBC</span>
            <span className="text-sky-800 font-bold text-xs">World Service</span>
            <span className="text-[10px] text-purple-600 block mt-0.5">● BBCM CRISIS</span>
          </div>
          <div className="p-2 bg-sky-50/50 rounded-xl border border-sky-100">
            <span className="text-[10px] text-sky-400 font-bold block">REUTERS</span>
            <span className="text-sky-800 font-bold text-xs">Financial Wire</span>
            <span className="text-[10px] text-orange-600 block mt-0.5">● FX & MACRO</span>
          </div>
          <div className="p-2 bg-sky-50/50 rounded-xl border border-sky-100">
            <span className="text-[10px] text-sky-400 font-bold block">AP NEWS</span>
            <span className="text-sky-800 font-bold text-xs">Global Crisis</span>
            <span className="text-[10px] text-red-600 block mt-0.5">● WIRE DISPATCH</span>
          </div>
          <div className="p-2 bg-sky-50/50 rounded-xl border border-sky-100">
            <span className="text-[10px] text-sky-400 font-bold block">AL JAZEERA</span>
            <span className="text-sky-800 font-bold text-xs">Geopolitical</span>
            <span className="text-[10px] text-yellow-600 block mt-0.5">● GULF TELEMETRY</span>
          </div>
        </div>
      </div>

      {/* Agency Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedAgencyId('ALL')}
          className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer font-bold ${
            selectedAgencyId === 'ALL'
              ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
              : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'
          }`}
        >
          All Strategic Sources ({dispatches.length})
        </button>

        {agencies.map((agency) => {
          const isSelected = selectedAgencyId === agency.id;
          return (
            <button
              key={agency.id}
              onClick={() => setSelectedAgencyId(agency.id)}
              className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer font-bold whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                  : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'
              }`}
            >
              <span>{agency.shortName}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                isSelected ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'
              }`}>
                {agency.telemetryMetrics.activeDispatches}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Agency Mandate & Telemetry Profile Card */}
      {selectedAgencyProfile && (
        <div className="bg-white border-2 border-sky-300 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-sky-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${selectedAgencyProfile.badgeColor}`}>
                  {selectedAgencyProfile.classification}
                </span>
                <span className="text-xs text-sky-400">
                  Jurisdiction: {selectedAgencyProfile.jurisdiction}
                </span>
              </div>
              <h2 className="text-sm font-bold text-sky-800 mt-1">
                {selectedAgencyProfile.name}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePollAgencyFeed(selectedAgencyProfile.id)}
                disabled={isPolling}
                className="px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Zap className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} />
                <span>{isPolling ? 'Probing Feed...' : `Probe ${selectedAgencyProfile.shortName} Live`}</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-sky-700 leading-relaxed">
            <strong className="text-sky-800">Operational Mandate: </strong>
            {selectedAgencyProfile.mandate}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100">
              <span className="text-[10px] text-sky-400 font-bold block">ACTIVE FEED URL</span>
              <code className="text-[11px] text-sky-800 truncate block mt-0.5">
                {selectedAgencyProfile.activeFeedUrl}
              </code>
            </div>
            <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100">
              <span className="text-[10px] text-sky-400 font-bold block">FEED STATUS</span>
              <span className="text-xs font-bold text-sky-800 block mt-0.5">
                ● {selectedAgencyProfile.feedStatus} (TLS 1.3 Verified)
              </span>
            </div>
            <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100">
              <span className="text-[10px] text-sky-400 font-bold block">FEED LATENCY</span>
              <span className="text-xs font-bold text-sky-800 block mt-0.5">
                {selectedAgencyProfile.telemetryMetrics.feedLatencyMs} ms avg
              </span>
            </div>
            <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100">
              <span className="text-[10px] text-sky-400 font-bold block">AUTHENTICITY VERIFICATION</span>
              <span className="text-xs font-bold text-emerald-600 block mt-0.5">
                {selectedAgencyProfile.telemetryMetrics.verifiedPercent}% Cryptographically Signed
              </span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-bold text-sky-800 block mb-2">
              CORE CAPABILITY INTEGRATIONS:
            </span>
            <div className="flex flex-wrap gap-2">
              {selectedAgencyProfile.capabilities.map((cap, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-sky-500" />
                  <span>{cap}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SPECIAL SUB-PANEL: Real FBI Wanted API Explorer */}
      {(selectedAgencyId === 'ALL' || selectedAgencyId === 'FBI') && (
        <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sky-100">
            <div className="flex items-center gap-2">
              <UserX className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-sky-800">
                FBI CYBER MOST WANTED // LIVE API DIRECTORY (api.fbi.gov/wanted/v1/list)
              </h2>
            </div>
            <button
              onClick={() => loadFbiWanted()}
              disabled={isLoadingFbi}
              className="text-[11px] text-sky-600 hover:text-sky-800 underline cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingFbi ? 'animate-spin' : ''}`} />
              <span>Refresh FBI API</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {fbiWantedItems.map((fugitive, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-sky-50/40 border border-sky-200 rounded-xl space-y-2 hover:border-sky-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      FBI CYBER WANTED
                    </span>
                    <h3 className="text-xs font-bold text-sky-800 mt-1.5">
                      {fugitive.title}
                    </h3>
                  </div>
                  {fugitive.nationality && (
                    <span className="text-[10px] text-sky-500 font-semibold bg-white px-2 py-0.5 rounded border border-sky-200">
                      {fugitive.nationality}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-sky-600 line-clamp-2">
                  {fugitive.description}
                </p>

                {fugitive.rewardText && (
                  <div className="text-[10px] text-amber-700 bg-amber-50/80 p-1.5 rounded border border-amber-200 font-bold">
                    {fugitive.rewardText}
                  </div>
                )}

                {fugitive.aliases && fugitive.aliases.length > 0 && (
                  <div className="text-[10px] text-sky-500">
                    Aliases: <span className="text-sky-700">{fugitive.aliases.slice(0, 3).join(', ')}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-sky-100 flex items-center justify-between">
                  <a
                    href={fugitive.url || 'https://www.fbi.gov/wanted/cyber'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-sky-600 hover:text-sky-800 flex items-center gap-1 font-semibold"
                  >
                    <span>View FBI Dossier</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => {
                      const dispatchItem: AgencyDispatchItem = {
                        id: `DISPATCH-FBI-WANTED-${idx}`,
                        agencyId: 'FBI',
                        agencyName: 'FBI Cyber Division',
                        timestamp: new Date().toISOString(),
                        title: `FBI Wanted Fugitive: ${fugitive.title}`,
                        summary: fugitive.description || 'Wanted for computer intrusion and wire fraud.',
                        classification: 'PUBLIC // LAW ENFORCEMENT',
                        category: 'CYBER_ATTACK',
                        severity: 'HIGH',
                        iocs: {
                          actors: [fugitive.title, ...(fugitive.aliases || [])],
                        },
                        targetSectors: ['DEFENSE', 'FINANCIAL'],
                        sourceFeed: 'https://api.fbi.gov/wanted/v1/list',
                        confidence: 100,
                        verified: true,
                      };
                      handleIngestDispatch(dispatchItem);
                    }}
                    className="px-2 py-1 bg-white hover:bg-sky-50 border border-sky-200 rounded text-[10px] font-bold text-sky-700 cursor-pointer shadow-xs"
                  >
                    Ingest IOC
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SPECIAL SUB-PANEL: CNN & BBC Breaking Wire Feed */}
      {(selectedAgencyId === 'ALL' || selectedAgencyId === 'CNN' || selectedAgencyId === 'BBC') && (
        <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sky-100">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-rose-500" />
              <h2 className="text-xs font-bold text-sky-800">
                LIVE BROADCAST WIRE // CNN & BBC WORLD SERVICE TELEMETRY
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {(['ALL', 'CNN', 'BBC'] as const).map((out) => (
                <button
                  key={out}
                  onClick={() => setMediaFilter(out)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    mediaFilter === out
                      ? 'bg-sky-500 text-white'
                      : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
                  }`}
                >
                  {out}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mediaWireItems
              .filter((item) => mediaFilter === 'ALL' || item.outlet === mediaFilter)
              .map((wire, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-sky-50/40 border border-sky-200 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      wire.outlet === 'CNN'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {wire.outlet} INTERNATIONAL WIRE
                    </span>
                    <span className="text-[10px] text-sky-400">
                      {new Date(wire.pubDate).toLocaleTimeString()}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-sky-800">
                    {wire.title}
                  </h3>

                  <p className="text-[11px] text-sky-600">
                    {wire.summary}
                  </p>

                  <div className="pt-2 border-t border-sky-100 flex items-center justify-between">
                    <a
                      href={wire.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-sky-600 hover:text-sky-800 flex items-center gap-1 font-semibold"
                    >
                      <span>Read Original Wire</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      onClick={() => {
                        const dispatchItem: AgencyDispatchItem = {
                          id: `DISPATCH-MEDIA-${idx}`,
                          agencyId: wire.outlet as any,
                          agencyName: `${wire.outlet} News Wire`,
                          timestamp: wire.pubDate,
                          title: wire.title,
                          summary: wire.summary,
                          classification: 'OPEN SOURCE MEDIA',
                          category: wire.category || 'GEOPOLITICAL',
                          severity: 'HIGH',
                          sourceFeed: wire.url,
                          confidence: 90,
                          verified: true,
                        };
                        handleIngestDispatch(dispatchItem);
                      }}
                      className="px-2 py-1 bg-white hover:bg-sky-50 border border-sky-200 rounded text-[10px] font-bold text-sky-700 cursor-pointer shadow-xs"
                    >
                      Ingest to Pipeline
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Main Intelligence Dispatches Stream Table */}
      <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-sky-100 gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-500" />
            <h2 className="text-xs font-bold text-sky-800">
              TACTICAL AGENCY & MEDIA DISPATCHES ({filteredDispatches.length})
            </h2>
          </div>

          <div className="relative min-w-[280px]">
            <Search className="w-3.5 h-3.5 text-sky-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across all agency feeds..."
              className="w-full bg-white border border-sky-200 rounded-xl py-1.5 pl-8 pr-3 text-xs text-sky-800 placeholder-sky-300 focus:outline-none focus:border-sky-400 shadow-xs"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredDispatches.map((dispatch) => {
            const isIngested = ingestedIds.has(dispatch.id);
            const isIngesting = ingestingId === dispatch.id;

            return (
              <div
                key={dispatch.id}
                className="p-4 rounded-xl border border-sky-200 bg-white hover:border-sky-300 transition-colors shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold">
                      {dispatch.agencyName}
                    </span>
                    <span className="text-[10px] text-sky-500 font-bold px-2 py-0.5 rounded bg-sky-50 border border-sky-100">
                      {dispatch.classification}
                    </span>
                    <span className="text-[10px] text-sky-400">
                      {new Date(dispatch.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      dispatch.severity === 'CRITICAL'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : dispatch.severity === 'HIGH'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}>
                      {dispatch.severity}
                    </span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      {dispatch.confidence}% CONFIDENCE
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-sky-800 leading-snug">
                    {dispatch.title}
                  </h3>
                  <p className="text-xs text-sky-600 mt-1 leading-relaxed">
                    {dispatch.summary}
                  </p>
                </div>

                {/* IOC and Target Sector Metadata Chips */}
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  {dispatch.iocs?.actors && dispatch.iocs.actors.map((actor, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                      Threat Actor: {actor}
                    </span>
                  ))}
                  {dispatch.iocs?.cves && dispatch.iocs.cves.map((cve, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                      {cve}
                    </span>
                  ))}
                  {dispatch.iocs?.ips && dispatch.iocs.ips.map((ip, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-mono">
                      IOC IP: {ip}
                    </span>
                  ))}
                  {dispatch.targetSectors && dispatch.targetSectors.map((sector, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-white text-sky-600 border border-sky-200 font-semibold">
                      Sector: {sector}
                    </span>
                  ))}
                </div>

                {/* Footer Actions */}
                <div className="pt-2 border-t border-sky-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-sky-400 truncate max-w-md">
                    Source Feed: <code className="text-sky-600">{dispatch.sourceFeed}</code>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleIngestDispatch(dispatch)}
                      disabled={isIngested || isIngesting}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 ${
                        isIngested
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-sky-500 hover:bg-sky-600 text-white'
                      }`}
                    >
                      {isIngesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Ingesting...</span>
                        </>
                      ) : isIngested ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Ingested to Pipeline</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Ingest to Kafka & Elasticsearch</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
