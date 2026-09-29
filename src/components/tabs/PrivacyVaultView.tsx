/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  Trash2,
  FileCheck,
} from 'lucide-react';
import { UserRole } from '../../types/intel';
import { PrivacyEngine } from '../../services/privacyEngine';
import { ApiClient } from '../../services/apiClient';

interface PrivacyVaultViewProps {
  currentRole: UserRole;
  onAuditUpdated: () => void;
}

export const PrivacyVaultView: React.FC<PrivacyVaultViewProps> = ({
  currentRole,
  onAuditUpdated,
}) => {
  // Live PII Sanitizer Sandbox state
  const [inputText, setInputText] = useState<string>(
    'Incident report filed by john.doe@company.org regarding exfiltration on server IP 198.51.100.42. The compromised billing file contained card 4532-8921-7734-9912 and SSN 455-22-9012.'
  );
  const [sanitizeMode, setSanitizeMode] = useState<'MASK' | 'HASH' | 'REDACT'>('MASK');

  // GDPR Right-to-be-Forgotten state
  const [eraseTarget, setEraseTarget] = useState<string>('sarah.chen@energy-defense.eu');
  const [erasureCertificate, setErasureCertificate] = useState<{
    certificateId: string;
    target: string;
    purgedOccurrences: number;
    proofHash: string;
    timestamp: string;
  } | null>(null);
  const [isErasing, setIsErasing] = useState<boolean>(false);

  // Run client-side live scan preview
  const scanResult = PrivacyEngine.scanAndSanitize(inputText, sanitizeMode);

  // Real backend Article 17 Purge
  const handleExecuteArticle17Erasure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eraseTarget.trim()) return;

    setIsErasing(true);
    try {
      const res = await ApiClient.purgeGdpr(eraseTarget, currentRole.name);
      if (res.success) {
        setErasureCertificate({
          certificateId: res.certificateId,
          target: eraseTarget,
          purgedOccurrences: res.purgedOccurrences,
          proofHash: res.proofHash,
          timestamp: res.timestamp,
        });
        onAuditUpdated();
      }
    } catch (err) {
      console.error('GDPR purge error:', err);
    } finally {
      setIsErasing(false);
    }
  };

  return (
    <div className="space-y-6 bg-white text-sky-600">
      {/* Header Info */}
      <div className="bg-white border border-sky-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-sky-500" />
              <h1 className="text-base font-bold text-sky-700 font-mono tracking-tight">
                PENDARIEL DATA PRIVACY & GDPR COMPLIANCE VAULT
              </h1>
              <span className="text-xs text-sky-400 font-mono">
                // ZERO-TRUST SOVEREIGN SANITIZER
              </span>
            </div>
            <p className="text-xs text-sky-500 mt-1">
              Strict automated anonymization and real backend GDPR Article 17 &ldquo;Right to be Forgotten&rdquo; shredder.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200 text-xs font-mono shadow-xs">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              <span className="text-sky-700 font-semibold">COMPLIANCE HEALTH: 100%</span>
            </div>
          </div>
        </div>

        {/* Regulatory Shields Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-sky-100 text-xs font-mono">
          <div className="bg-sky-50/50 p-3 rounded-lg border border-sky-100">
            <span className="text-sky-400 block text-[10px] font-bold">GDPR ART. 5(1)(c)</span>
            <span className="font-bold text-sky-800">Data Minimization: Enforced</span>
          </div>
          <div className="bg-sky-50/50 p-3 rounded-lg border border-sky-100">
            <span className="text-sky-400 block text-[10px] font-bold">HIPAA §164.514</span>
            <span className="font-bold text-sky-800">Safe Harbor De-Identification</span>
          </div>
          <div className="bg-sky-50/50 p-3 rounded-lg border border-sky-100">
            <span className="text-sky-400 block text-[10px] font-bold">EU NIS2 DIRECTIVE</span>
            <span className="font-bold text-sky-800">Critical Infra Shield: Active</span>
          </div>
          <div className="bg-sky-50/50 p-3 rounded-lg border border-sky-100">
            <span className="text-sky-400 block text-[10px] font-bold">PII REDACTION PIPELINE</span>
            <span className="font-bold text-sky-600">Zero-Leakage Guarantee</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive PII Sanitizer Sandbox & Article 17 Eraser */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interactive PII Sanitizer Sandbox */}
        <div className="bg-white border border-sky-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sky-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-500" />
              <h2 className="text-xs font-bold text-sky-700 font-mono">
                INTERACTIVE PII SCANNER & SANITIZER SANDBOX
              </h2>
            </div>
            {/* Sanitize Mode Tabs */}
            <div className="flex items-center gap-1 bg-sky-50 p-1 rounded-lg border border-sky-200 text-[11px] font-mono">
              {(['MASK', 'HASH', 'REDACT'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSanitizeMode(mode)}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    sanitizeMode === mode
                      ? 'bg-sky-500 text-white font-bold'
                      : 'text-sky-600 hover:text-sky-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-sky-700 mb-1">
              RAW UNTRUSTED INGESTION INPUT
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={4}
              className="w-full bg-white border border-sky-200 rounded-lg p-3 text-xs text-sky-800 font-mono focus:outline-none focus:border-sky-400 shadow-xs"
            />
          </div>

          {/* Detected PII entities */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-sky-600 font-semibold mb-1.5">
              <span>DETECTED PII IDENTIFIERS</span>
              <span className="text-sky-600 font-bold">
                {scanResult.detectedPii.length} entities intercepted
              </span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {scanResult.detectedPii.map((match, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-sky-50/50 rounded-lg border border-sky-100 text-[11px] font-mono flex items-center justify-between"
                >
                  <span className="text-sky-700 font-semibold">[{match.type}]</span>
                  <span className="text-sky-400 line-through">
                    {currentRole.permissions.canViewRawPII ? match.raw : '••••••••••••'}
                  </span>
                  <span className="text-sky-400">→</span>
                  <span className="text-sky-600 font-bold">{match.masked}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sanitized Output Preview */}
          <div>
            <label className="block text-xs font-mono font-semibold text-sky-700 mb-1">
              SANITIZED BACKEND STORAGE TARGET (ZERO RAW PII)
            </label>
            <pre className="bg-sky-50/40 p-3 rounded-lg border border-sky-100 text-xs font-mono text-sky-700 whitespace-pre-wrap">
              {scanResult.sanitizedText}
            </pre>
          </div>
        </div>

        {/* Right: Real GDPR Article 17 Shredder */}
        <div className="space-y-6">
          <div className="bg-white border border-sky-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-sky-500" />
                <h2 className="text-xs font-bold text-sky-700 font-mono">
                  REAL GDPR ARTICLE 17 PURGE (RIGHT TO BE FORGOTTEN)
                </h2>
              </div>
              <span className="text-[10px] font-mono text-sky-400 font-semibold">
                AUDITOR / ADMIN PRIVILEGE
              </span>
            </div>

            <p className="text-xs text-sky-500">
              Permanently purges all historical occurrences of a subject identity directly from the real backend database.
            </p>

            <form onSubmit={handleExecuteArticle17Erasure} className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-semibold text-sky-700 mb-1">
                  TARGET IDENTITY TO PURGE
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={eraseTarget}
                    onChange={(e) => setEraseTarget(e.target.value)}
                    placeholder="e.g. subject.email@domain.com"
                    className="flex-1 bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs text-sky-800 font-mono focus:outline-none focus:border-sky-400 shadow-xs"
                    required
                  />
                  <button
                    type="submit"
                    disabled={!currentRole.permissions.canTriggerPurge || isErasing}
                    className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer shadow-xs ${
                      currentRole.permissions.canTriggerPurge
                        ? 'bg-sky-500 hover:bg-sky-600 text-white'
                        : 'bg-sky-100 text-sky-400 cursor-not-allowed'
                    }`}
                  >
                    {isErasing ? 'Purging Backend...' : 'Execute Purge'}
                  </button>
                </div>
              </div>
            </form>

            {/* Erasure Receipt Certificate */}
            {erasureCertificate && (
              <div className="p-3.5 bg-sky-50/70 rounded-lg border border-sky-300 font-mono text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-sky-700 font-bold">
                  <FileCheck className="w-4 h-4 text-sky-500" />
                  <span>IMMUTABLE ERASURE CERTIFICATE ISSUED</span>
                </div>
                <div className="text-[11px] text-sky-600 space-y-1">
                  <div>Certificate ID: {erasureCertificate.certificateId}</div>
                  <div>Timestamp: {erasureCertificate.timestamp}</div>
                  <div>Target Subject: {erasureCertificate.target}</div>
                  <div>Occurrences Purged: {erasureCertificate.purgedOccurrences}</div>
                  <div className="text-sky-500 break-all">
                    Proof Hash: {erasureCertificate.proofHash}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Retention Policies Table */}
          <div className="bg-white border border-sky-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="text-xs font-mono font-bold text-sky-700 pb-2 border-b border-sky-100">
              AUTOMATED DATA RETENTION LIFECYCLES
            </div>
            <div className="space-y-2 text-xs font-mono">
              {[
                { name: 'Kafka Ingestion Buffer', ttl: '24 Hours', action: 'Auto-Expunge', status: 'HEALTHY' },
                { name: 'OSINT Unverified Feed', ttl: '30 Days', action: 'Index Rotation', status: 'HEALTHY' },
                { name: 'Admiralty Grade A Threats', ttl: '180 Days', action: 'Archival Vault', status: 'HEALTHY' },
                { name: 'Cryptographic Audit Log', ttl: '365 Days', action: 'Immutable WORM', status: 'HEALTHY' },
              ].map((ret) => (
                <div
                  key={ret.name}
                  className="flex items-center justify-between p-2.5 bg-sky-50/40 rounded-lg border border-sky-100"
                >
                  <div>
                    <div className="font-semibold text-sky-800">{ret.name}</div>
                    <div className="text-[10px] text-sky-400">
                      TTL: {ret.ttl} · Action: {ret.action}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-sky-600">
                    {ret.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
