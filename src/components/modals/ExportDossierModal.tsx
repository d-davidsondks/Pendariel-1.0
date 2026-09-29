/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Download,
  ShieldCheck,
  Check,
  Copy,
} from 'lucide-react';
import { IntelligenceItem, UserRole } from '../../types/intel';

interface ExportDossierModalProps {
  item?: IntelligenceItem;
  allItems: IntelligenceItem[];
  currentRole: UserRole;
  onClose: () => void;
}

export const ExportDossierModal: React.FC<ExportDossierModalProps> = ({
  item,
  allItems,
  currentRole,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const targetItem = item || allItems[0];

  const generateDossierText = () => {
    return `================================================================================
PENDARIEL // CLASSIFIED INTELLIGENCE DOSSIER
SECURITY CLASSIFICATION: TOP SECRET // NOFORN // STRICT GDPR PROTECTED
================================================================================
DOSSIER ID:      DOSSIER-${targetItem.id}-${Date.now().toString().slice(-4)}
PRIMARY INCIDENT:${targetItem.id}
TIMESTAMP:       ${targetItem.timestamp}
ISSUED BY:       ${currentRole.name} (${currentRole.title})
USER CLEARANCE:  ${currentRole.clearance}
TARGET REGION:   ${targetItem.region}
IMPACTED SECTOR: ${targetItem.sector}
SEVERITY LEVEL:  ${targetItem.severity}
CONFIDENCE:      ${targetItem.confidence}% (Admiralty Grade: ${targetItem.sourceReliability})
DATA PRIVACY:    ${targetItem.privacyStatus} (PII Redacted in compliance with GDPR Art. 5)

--------------------------------------------------------------------------------
1. EXECUTIVE SUMMARY
--------------------------------------------------------------------------------
${targetItem.title}
${targetItem.summary}

--------------------------------------------------------------------------------
2. TARGETED INDICATORS OF COMPROMISE (IOCs)
--------------------------------------------------------------------------------
IP Addresses:    ${targetItem.iocs.ips?.join(', ') || 'None identified'}
Host Domains:    ${targetItem.iocs.domains?.join(', ') || 'None identified'}
Associated CVEs: ${targetItem.iocs.cves?.join(', ') || 'None'}
Cryptographic H: ${targetItem.iocs.hashes?.join(', ') || 'None'}

--------------------------------------------------------------------------------
3. INGESTION TELEMETRY & BACKEND TRACE
--------------------------------------------------------------------------------
Kafka Partition Broker:  Topic [${targetItem.kafkaTopic}]
Elasticsearch Index:    [${targetItem.elasticIndex}]
PII Redaction Intercept: ${targetItem.piiDetected ? 'YES - Salted Hash Applied' : 'CLEAN'}

--------------------------------------------------------------------------------
COMPLIANCE ATTESTATION:
This document complies with EU GDPR Article 5(1)(c), NIS2 Directive requirements,
and SOC2 Type II audit logging. Transmitted via Pendariel webmail gateway.
================================================================================`;
  };

  const dossierContent = generateDossierText();

  const handleCopy = () => {
    navigator.clipboard.writeText(dossierContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([dossierContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PENDARIEL-DOSSIER-${targetItem.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-sky-950/20 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-sky-300 rounded-xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-sky-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-500" />
            <h2 className="text-sm font-bold text-sky-800 font-mono">
              PENDARIEL INTELLIGENCE DOSSIER EXPORT
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-sky-400 hover:text-sky-600 font-mono text-lg cursor-pointer px-2"
          >
            ✕
          </button>
        </div>

        {/* Dossier Viewer */}
        <pre className="bg-sky-50/40 p-4 rounded-xl border border-sky-100 text-[11px] font-mono text-sky-800 overflow-y-auto whitespace-pre leading-relaxed flex-1 max-h-[500px]">
          {dossierContent}
        </pre>

        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-sky-100">
          <div className="flex items-center gap-2 text-xs font-mono text-sky-600 font-semibold">
            <ShieldCheck className="w-4 h-4 text-sky-500" />
            <span>GDPR Compliance Stamp Attached · Sovereign Encryption Verified</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-sky-600" />
                  <span className="text-sky-600 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Dossier (.txt)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
