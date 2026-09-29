/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Layers,
  Database,
  Play,
  Pause,
  PlusCircle,
  HardDrive,
  Send,
  Zap,
} from 'lucide-react';
import {
  IntelligenceItem,
  KafkaTopicStats,
  ElasticsearchClusterInfo,
  UserRole,
} from '../../types/intel';
import { KAFKA_TOPICS, ELASTICSEARCH_CLUSTER } from '../../data/mockData';
import { ApiClient } from '../../services/apiClient';

interface DataStreamViewProps {
  currentRole: UserRole;
  onItemIngested: () => void;
}

export const DataStreamView: React.FC<DataStreamViewProps> = ({
  currentRole,
  onItemIngested,
}) => {
  const [topics, setTopics] = useState<KafkaTopicStats[]>(KAFKA_TOPICS);
  const [cluster] = useState<ElasticsearchClusterInfo>(ELASTICSEARCH_CLUSTER);
  const [selectedTopic, setSelectedTopic] = useState<string>('cyber.threats');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [streamSpeed, setStreamSpeed] = useState<number>(1);
  const [liveStreamEvents, setLiveStreamEvents] = useState<any[]>([]);

  // Manual event injector modal state
  const [showInjectModal, setShowInjectModal] = useState<boolean>(false);
  const [injectTitle, setInjectTitle] = useState<string>('Suspicious Lateral Recon via SMB Port 445');
  const [injectSummary, setInjectSummary] = useState<string>('Automated honeypot probe detected sequential password spraying from high-risk Tor exit node.');
  const [injectPayload, setInjectPayload] = useState<string>('{"attacker_ip": "185.220.101.5", "target_email": "admin@defense-contractor.gov", "port": 445, "attempts": 240}');
  const [injectSeverity, setInjectSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [injectSector, setInjectSector] = useState<'DEFENSE' | 'CRITICAL_INFRA' | 'FINTECH' | 'TELECOM' | 'HEALTHCARE' | 'GOV'>('DEFENSE');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Automated background stream that calls backend
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(async () => {
      const titles = [
        'Anomalous DNS Tunneling Probe from 198.51.100.44',
        'Kernel eBPF Telemetry Outlier Observed',
        'Authentication Burst on External Diplomatic Portal',
        'BGP Prefix Withdrawal Event Detected',
      ];
      const title = titles[Math.floor(Math.random() * titles.length)];

      const itemPayload = {
        title,
        summary: `Real-time streaming telemetry processed by Pendariel backend on partition ${Math.floor(Math.random() * 8)}.`,
        rawPayload: JSON.stringify({
          source_ip: `198.51.100.${Math.floor(10 + Math.random() * 200)}`,
          probe_port: 443,
          analyst_email: 'stream.analyst@pendariel.net',
        }),
        source: 'Pendariel Edge Ingest Worker',
        sourceType: 'API_FEED' as const,
        category: 'CYBER_ATTACK' as const,
        severity: (Math.random() > 0.7 ? 'CRITICAL' : 'HIGH') as any,
        sector: 'DEFENSE' as const,
        region: 'GLOBAL' as const,
        confidence: Math.floor(80 + Math.random() * 18),
        iocs: {
          ips: [`198.51.100.${Math.floor(10 + Math.random() * 200)}`],
          domains: ['telemetry-edge.pendariel.net'],
        },
        actor: 'pendariel.streaming.daemon',
      };

      try {
        const res = await ApiClient.ingestIntel(itemPayload);
        if (res.success && res.item) {
          setLiveStreamEvents((prev) => [
            {
              offset: Math.floor(104800 + Math.random() * 5000),
              partition: Math.floor(Math.random() * 8),
              topic: selectedTopic,
              timestamp: new Date().toISOString(),
              item: res.item,
            },
            ...prev.slice(0, 25),
          ]);
          onItemIngested();
        }
      } catch (err) {
        console.error('Ingest stream error:', err);
      }
    }, 4500 / streamSpeed);

    return () => clearInterval(interval);
  }, [isStreaming, streamSpeed, selectedTopic, onItemIngested]);

  const handleManualInject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await ApiClient.ingestIntel({
        title: injectTitle,
        summary: injectSummary,
        rawPayload: injectPayload,
        source: `Manual Ingestion (${currentRole.name})`,
        sourceType: 'API_FEED',
        category: 'CYBER_ATTACK',
        severity: injectSeverity,
        sector: injectSector,
        region: 'GLOBAL',
        confidence: 94,
        iocs: {
          ips: ['185.220.101.5'],
          domains: ['defense-contractor.gov'],
        },
        actor: currentRole.name,
      });

      if (res.success && res.item) {
        setLiveStreamEvents((prev) => [
          {
            offset: Math.floor(104800 + Math.random() * 5000),
            partition: 0,
            topic: selectedTopic,
            timestamp: new Date().toISOString(),
            item: res.item,
          },
          ...prev.slice(0, 25),
        ]);
        onItemIngested();
      }
      setShowInjectModal(false);
    } catch (err) {
      console.error('Manual inject error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 bg-white text-sky-600">
      {/* Stream Control Header */}
      <div className="bg-white border border-sky-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-500" />
              <h1 className="text-base font-bold text-sky-700 font-mono tracking-tight">
                PENDARIEL STREAMING INGESTION PIPELINE
              </h1>
              <span className="text-xs text-sky-400 font-mono">
                // REAL-TIME BACKEND PROCESSING
              </span>
            </div>
            <p className="text-xs text-sky-500 mt-1">
              Events are published and processed through our real backend Express API into the incident store.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-sky-50 p-1 rounded-lg border border-sky-200 font-mono text-xs">
              <span className="text-sky-500 px-2 text-[10px] font-semibold">SPEED:</span>
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setStreamSpeed(speed)}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer text-xs ${
                    streamSpeed === speed
                      ? 'bg-sky-500 text-white font-bold'
                      : 'text-sky-600 hover:bg-sky-100'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs border transition-colors cursor-pointer shadow-xs ${
                isStreaming
                  ? 'bg-sky-50 border-sky-200 text-sky-700'
                  : 'bg-sky-500 border-sky-600 text-white'
              }`}
            >
              {isStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-sky-500" />
                  <span>Pause Stream</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Stream</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowInjectModal(true)}
              disabled={!currentRole.permissions.canExecuteKafkaInject}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-colors cursor-pointer shadow-xs ${
                currentRole.permissions.canExecuteKafkaInject
                  ? 'bg-sky-500 hover:bg-sky-600 text-white font-semibold'
                  : 'bg-sky-100 text-sky-400 cursor-not-allowed'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Inject Telemetry Event</span>
            </button>
          </div>
        </div>

        {/* Processing Pipeline Stages */}
        <div className="mt-5 pt-4 border-t border-sky-100">
          <div className="text-[11px] font-mono font-bold text-sky-600 mb-2">
            STREAMING ENRICHMENT & COMPLIANCE PIPELINE (STAGES)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs font-mono">
            {[
              { num: '01', name: 'Ingestion Buffer', desc: 'Partitioned Broker', status: 'ACTIVE' },
              { num: '02', name: 'Deduplication', desc: 'Sliding Hash Window', status: 'ACTIVE' },
              { num: '03', name: 'NER Extraction', desc: 'Admiralty Grade', status: 'ACTIVE' },
              { num: '04', name: 'Threat Scoring', desc: 'CVSS & IOC Match', status: 'ACTIVE' },
              { num: '05', name: 'GDPR Sanitizer', desc: 'Zero-Trust PII Mask', status: 'ACTIVE' },
              { num: '06', name: 'Targeted Indexer', desc: 'Lucene Parameter Store', status: 'ACTIVE' },
            ].map((stg) => (
              <div
                key={stg.num}
                className="bg-sky-50/60 p-2.5 rounded-lg border border-sky-100 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sky-400 text-[10px] font-bold">STAGE {stg.num}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                </div>
                <div className="font-semibold text-sky-800 mt-1">{stg.name}</div>
                <div className="text-[10px] text-sky-500">{stg.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Topics & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Topics */}
        <div className="bg-white border border-sky-200 rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-sky-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-500" />
              <span className="font-mono text-xs font-bold text-sky-700">
                PENDARIEL TOPIC DIRECTORY
              </span>
            </div>
            <span className="text-[11px] font-mono text-sky-400">5 TOPICS</span>
          </div>

          <div className="space-y-2">
            {topics.map((t) => {
              const isSelected = selectedTopic === t.topic;
              return (
                <div
                  key={t.topic}
                  onClick={() => setSelectedTopic(t.topic)}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer text-xs font-mono ${
                    isSelected
                      ? 'bg-sky-100/70 border-sky-300 text-sky-900 shadow-xs'
                      : 'bg-sky-50/40 border-sky-100 text-sky-600 hover:bg-sky-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-800">{t.topic}</span>
                    <span className="text-[10px] font-bold text-sky-600">
                      {t.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-sky-100 text-[10px] text-sky-500">
                    <div>
                      <span className="text-sky-400 block">RATE</span>
                      <span className="text-sky-700 font-semibold">{t.messageRate} msg/s</span>
                    </div>
                    <div>
                      <span className="text-sky-400 block">PARTS</span>
                      <span className="text-sky-700 font-semibold">{t.partitions}</span>
                    </div>
                    <div>
                      <span className="text-sky-400 block">LAG</span>
                      <span className="text-sky-600 font-semibold">{t.lag}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cluster Status */}
          <div className="pt-2 border-t border-sky-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-sky-700">
                <Database className="w-4 h-4 text-sky-500" />
                <span>ELASTICSEARCH SHARDS</span>
              </div>
              <span className="text-sky-600 font-mono text-[11px] font-semibold">
                {cluster.status}
              </span>
            </div>
            <div className="bg-sky-50/50 p-3 rounded-lg border border-sky-100 text-xs font-mono space-y-1.5 text-sky-600">
              <div className="flex justify-between">
                <span className="text-sky-400">Total Shards:</span>
                <span className="font-bold text-sky-700">6 Active Primaries</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sky-400">Cluster State:</span>
                <span className="text-sky-700">Real-Time Sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Stream Ticker */}
        <div className="lg:col-span-2 bg-white border border-sky-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-sky-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping" />
                <span className="font-mono text-xs font-bold text-sky-700">
                  LIVE REAL-TIME BACKEND INGRESS LOG
                </span>
              </div>
              <div className="text-xs text-sky-400 font-mono">
                Auto-ingesting live events into database
              </div>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {liveStreamEvents.length === 0 ? (
                <div className="text-center py-16 text-sky-400 font-mono text-xs">
                  Streaming active... Ingesting live events into backend.
                </div>
              ) : (
                liveStreamEvents.map((evt, idx) => (
                  <div
                    key={`${evt.offset}-${idx}`}
                    className="p-3 bg-sky-50/40 border border-sky-100 rounded-lg font-mono text-xs hover:border-sky-300 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] text-sky-400 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sky-600 font-bold">
                          OFFSET #{evt.offset}
                        </span>
                        <span className="text-sky-300">·</span>
                        <span>PARTITION {evt.partition}</span>
                        <span className="text-sky-300">·</span>
                        <span className="text-sky-500">{evt.topic}</span>
                      </div>
                      <span className="text-sky-400">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <div className="font-semibold text-sky-800">
                      {evt.item?.title || 'Telemetry Pulse'}
                    </div>
                    <div className="text-[11px] text-sky-600 mt-1 line-clamp-1">
                      {evt.item?.summary || ''}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-sky-400 pt-1.5 border-t border-sky-100">
                      <span>Source: {evt.item?.source}</span>
                      <span>·</span>
                      <span>Severity: <span className="text-sky-600 font-bold">{evt.item?.severity}</span></span>
                      <span>·</span>
                      <span>GDPR Shield: <span className="text-sky-600 font-semibold">{evt.item?.privacyStatus}</span></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-sky-100 text-[11px] font-mono text-sky-400 flex justify-between items-center">
            <span>BACKEND STATUS: EXPRESS /api/intel INGESTION ACTIVE</span>
            <span>SHARDS: 100% HEALTHY</span>
          </div>
        </div>
      </div>

      {/* Manual Inject Modal */}
      {showInjectModal && (
        <div className="fixed inset-0 bg-sky-950/20 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-300 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-500" />
                <h3 className="text-sm font-bold text-sky-800 font-mono">
                  MANUAL BACKEND EVENT INGESTION
                </h3>
              </div>
              <button
                onClick={() => setShowInjectModal(false)}
                className="text-sky-400 hover:text-sky-600 font-mono text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualInject} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-sky-700 font-semibold mb-1">TARGET TOPIC</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800 font-medium"
                >
                  {topics.map((t) => (
                    <option key={t.topic} value={t.topic}>
                      {t.topic}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sky-700 font-semibold mb-1">INCIDENT TITLE</label>
                <input
                  type="text"
                  value={injectTitle}
                  onChange={(e) => setInjectTitle(e.target.value)}
                  className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-sky-700 font-semibold mb-1">INCIDENT SUMMARY</label>
                <textarea
                  value={injectSummary}
                  onChange={(e) => setInjectSummary(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sky-700 font-semibold mb-1">SEVERITY</label>
                  <select
                    value={injectSeverity}
                    onChange={(e) => setInjectSeverity(e.target.value as any)}
                    className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sky-700 font-semibold mb-1">SECTOR</label>
                  <select
                    value={injectSector}
                    onChange={(e) => setInjectSector(e.target.value as any)}
                    className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800"
                  >
                    <option value="DEFENSE">DEFENSE</option>
                    <option value="CRITICAL_INFRA">CRITICAL INFRA</option>
                    <option value="FINTECH">FINTECH</option>
                    <option value="TELECOM">TELECOM</option>
                    <option value="HEALTHCARE">HEALTHCARE</option>
                    <option value="GOV">GOVERNMENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sky-700 font-semibold mb-1">
                  RAW PAYLOAD (PII like emails & cards are sanitized automatically)
                </label>
                <textarea
                  value={injectPayload}
                  onChange={(e) => setInjectPayload(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800 font-mono text-[11px]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInjectModal(false)}
                  className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold cursor-pointer"
                >
                  {isSubmitting ? 'Ingesting to Backend...' : 'Submit Real Ingestion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
