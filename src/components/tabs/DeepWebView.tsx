/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  ShieldAlert,
  Lock,
  Terminal,
  ExternalLink,
  Zap,
  ArrowRight,
  Server,
  FileCheck,
  Send,
  Eye,
  Key,
} from 'lucide-react';
import { UserRole } from '../../types/intel';
import { ApiClient } from '../../services/apiClient';

interface DeepWebViewProps {
  currentRole: UserRole;
  onIngestThreat?: (payload: any) => void;
  onDispatchAlert?: (title: string, details: string) => void;
}

export const DeepWebView: React.FC<DeepWebViewProps> = ({
  currentRole,
  onIngestThreat,
  onDispatchAlert,
}) => {
  const [deepWebQuery, setDeepWebQuery] = useState<string>('darkonion7xbbq3.onion');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [circuitHealth, setCircuitHealth] = useState<string>('HEALTHY_ENCRYPTED');
  const [activeServices, setActiveServices] = useState<any[]>([]);

  // Load known deep web registry from backend
  const loadRegistry = async () => {
    try {
      const data = await ApiClient.fetchDeepWebRegistry();
      if (data && data.services) {
        setActiveServices(data.services);
        setScanResult({
          matchesCount: data.services.length,
          results: data.services,
          torProxyCircuit: 'ESTABLISHED_TLS_1.3',
        });
      }
    } catch (err) {
      console.error('Failed to load deep web registry:', err);
    }
  };

  useEffect(() => {
    loadRegistry();
  }, []);

  const handleScan = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToScan = customQuery !== undefined ? customQuery : deepWebQuery;
    if (!queryToScan || !queryToScan.trim()) return;

    setIsScanning(true);
    try {
      const res = await ApiClient.scanDeepWeb(queryToScan.trim(), currentRole.email);
      setScanResult(res);
    } catch (err) {
      console.error('Deep web scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleIngestToPipeline = async (service: any) => {
    try {
      await ApiClient.ingestIntel({
        title: `Deep Web Intercept: ${service.serviceTitle}`,
        summary: `Targeted Tor hidden service telemetry identified on ${service.onionAddress}. Associated with ${service.associatedActors?.join(', ')}.`,
        rawPayload: JSON.stringify({
          onion_address: service.onionAddress,
          tor_circuit: service.torCircuit,
          pgp_fingerprint: service.pgpFingerprint,
          payloads: service.discoveredPayloads,
        }),
        source: 'Pendariel Tor Deep Web Collector',
        sourceType: 'DARKWEB',
        category: service.category || 'DATA_LEAK',
        severity: service.threatScore >= 95 ? 'CRITICAL' : 'HIGH',
        confidence: service.threatScore || 92,
        sector: service.targetedSector || 'FINTECH',
        region: 'GLOBAL',
        iocs: {
          domains: [service.onionAddress],
          ips: ['185.220.101.5'],
        },
        actor: currentRole.name,
      });

      if (onIngestThreat) {
        onIngestThreat(service);
      }
      alert(`Deep web indicator ${service.onionAddress} ingested into main intelligence pipeline!`);
    } catch (err) {
      console.error('Ingest error:', err);
    }
  };

  return (
    <div className="space-y-6 bg-white text-sky-600">
      {/* Header Info */}
      <div className="bg-white border border-sky-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-sky-500" />
              <h1 className="text-base font-bold text-sky-700 font-mono tracking-tight">
                PENDARIEL DEEP WEB & TOR ONION THREAT ACCESS
              </h1>
              <span className="text-xs text-sky-400 font-mono">
                // SECURE ONION v3 PROTOCOL GATEWAY
              </span>
            </div>
            <p className="text-xs text-sky-500 mt-1">
              Dedicated field and secure routing proxy to access, index, and correlate deep web onion hidden services, darknet breach drops, and ransomware extortion portals.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-lg text-sky-700 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
              <span className="font-semibold">TOR CIRCUIT: 3-HOP ENCRYPTED</span>
            </div>
          </div>
        </div>

        {/* Dedicated Deep Web Access & Search Field */}
        <div className="mt-5 pt-4 border-t border-sky-100">
          <form onSubmit={handleScan} className="space-y-3 font-mono text-xs">
            <label className="block text-sky-700 font-bold text-xs">
              DEDICATED DEEP WEB ONION / KEYWORD ACCESS FIELD
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-sky-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={deepWebQuery}
                  onChange={(e) => setDeepWebQuery(e.target.value)}
                  placeholder="Enter .onion address, breach forum keyword, or darknet actor (e.g. darkonion7xbbq3.onion, LockBit, credentials)..."
                  className="w-full bg-white border-2 border-sky-300 rounded-xl py-2.5 pl-10 pr-3 text-sky-800 placeholder-sky-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 shadow-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isScanning}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold font-mono text-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2 shrink-0"
              >
                {isScanning ? (
                  <>
                    <Zap className="w-4 h-4 animate-spin" />
                    <span>Resolving via Tor...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Access Deep Web</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Deep Web Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-mono">
            <span className="text-sky-400">Quick Targets:</span>
            {[
              { label: 'BlackBazaar Leak Forum', q: 'darkonion7xbbq3.onion' },
              { label: 'LockBit SCADA Extortion', q: 'ransomlock782bc441.onion' },
              { label: 'Diplomatic Cable Drop', q: 'pasteonion6vdiplomatic.onion' },
              { label: 'Hospital Records Auction', q: 'healthbreach99rx7.onion' },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => {
                  setDeepWebQuery(chip.q);
                  handleScan(undefined, chip.q);
                }}
                className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-lg transition-colors cursor-pointer"
              >
                {chip.label} ({chip.q.slice(0, 10)}...)
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tor Circuit Route Visualization */}
      <div className="bg-white border border-sky-200 rounded-xl p-5 shadow-xs font-mono text-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-sky-100">
          <span className="font-bold text-sky-700 flex items-center gap-1.5">
            <Server className="w-4 h-4 text-sky-500" />
            <span>ACTIVE SECURE TOR PROXY CIRCUIT TOPOLOGY</span>
          </span>
          <span className="text-[11px] text-sky-500 font-semibold">TLS 1.3 / E2E ENCRYPTED</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 space-y-1">
            <div className="text-[10px] text-sky-400 font-bold">CLIENT INGRESS</div>
            <div className="font-bold text-sky-800">Pendariel Engine</div>
            <div className="text-[10px] text-sky-500">127.0.0.1:3000</div>
          </div>

          <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 space-y-1">
            <div className="text-[10px] text-sky-400 font-bold">ENTRY GUARD RELAY</div>
            <div className="font-bold text-sky-800">Tor Node DE-04</div>
            <div className="text-[10px] text-sky-500">185.220.101.5</div>
          </div>

          <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 space-y-1">
            <div className="text-[10px] text-sky-400 font-bold">MIDDLE RELAY</div>
            <div className="font-bold text-sky-800">Transit Node NL-12</div>
            <div className="text-[10px] text-sky-500">194.26.29.112</div>
          </div>

          <div className="p-3 bg-sky-100/70 rounded-xl border border-sky-300 space-y-1">
            <div className="text-[10px] text-sky-600 font-bold">ONION v3 DESCRIPTOR</div>
            <div className="font-bold text-sky-800">Hidden Service</div>
            <div className="text-[10px] text-sky-600 font-semibold">Port 80/443 (Onion)</div>
          </div>
        </div>
      </div>

      {/* Deep Web Results & Identified Indicators */}
      <div className="space-y-4">
        <div className="flex items-center justify-between font-mono text-xs">
          <span className="font-bold text-sky-700">
            RESOLVED DEEP WEB INTELLIGENCE TARGETS ({scanResult?.results?.length || 0})
          </span>
          <span className="text-sky-500">
            Audit Logged: <strong className="text-sky-700">DEEP_WEB_ACCESS_QUERY</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scanResult?.results?.map((service: any, idx: number) => (
            <div
              key={service.onionAddress || idx}
              className="bg-white border border-sky-200 rounded-xl p-5 shadow-xs font-mono text-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded border border-sky-200 text-sky-700 bg-sky-50 font-bold text-[10px]">
                      {service.category}
                    </span>
                    <h3 className="font-bold text-sm text-sky-800 mt-1">
                      {service.serviceTitle}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    {service.status}
                  </span>
                </div>

                <div className="mt-2 text-sky-700 font-semibold break-all bg-sky-50/50 p-2 rounded-lg border border-sky-100 flex items-center justify-between">
                  <span className="text-sky-800">{service.onionAddress}</span>
                  <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                </div>

                {service.pgpFingerprint && (
                  <div className="mt-2 text-[10px] text-sky-500">
                    <span className="font-semibold text-sky-700">PGP Key:</span> {service.pgpFingerprint}
                  </div>
                )}

                {service.associatedActors && service.associatedActors.length > 0 && (
                  <div className="mt-2 text-[11px] text-sky-600">
                    <span className="font-semibold text-sky-800">Threat Actors:</span>{' '}
                    {service.associatedActors.join(', ')}
                  </div>
                )}

                {service.discoveredPayloads && (
                  <div className="mt-2 pt-2 border-t border-sky-100 space-y-1">
                    <span className="text-[10px] font-bold text-sky-700 block">
                      EXFILTRATED ARTIFACTS & BREACH PAYLOADS:
                    </span>
                    {service.discoveredPayloads.map((payload: string, pIdx: number) => (
                      <div
                        key={pIdx}
                        className="text-[11px] text-sky-600 bg-sky-50/40 px-2 py-1 rounded border border-sky-100"
                      >
                        • {payload}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-sky-100 text-[11px]">
                <span className="text-sky-500">
                  Threat Score: <strong className="text-sky-800">{service.threatScore}/100</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleIngestToPipeline(service)}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-semibold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Ingest IOC</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {(!scanResult?.results || scanResult.results.length === 0) && (
            <div className="col-span-2 text-center py-16 bg-white border border-sky-200 rounded-xl text-sky-400 font-mono text-xs">
              No hidden services resolved for current query. Enter a valid .onion address or keyword to probe the deep web.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
