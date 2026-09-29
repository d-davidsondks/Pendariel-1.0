/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  GitBranch,
  Play,
  CheckCircle2,
  Terminal,
  Cloud,
  DollarSign,
  Zap,
} from 'lucide-react';
import { PipelineStep, CloudCostItem, UserRole } from '../../types/intel';
import { INITIAL_PIPELINE_STEPS, FREE_TIER_COST_ITEMS } from '../../data/mockData';
import { ApiClient } from '../../services/apiClient';

interface CicdCloudViewProps {
  currentRole: UserRole;
  onDeployComplete: () => void;
}

export const CicdCloudView: React.FC<CicdCloudViewProps> = ({
  currentRole,
  onDeployComplete,
}) => {
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(INITIAL_PIPELINE_STEPS);
  const [costItems] = useState<CloudCostItem[]>(FREE_TIER_COST_ITEMS);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [selectedStep, setSelectedStep] = useState<PipelineStep>(INITIAL_PIPELINE_STEPS[0]);

  const handleTriggerDeploy = async () => {
    if (!currentRole.permissions.canTriggerDeployments) return;

    setIsDeploying(true);

    try {
      // Call real backend deployment runner
      await ApiClient.triggerDeploy();

      let current = 0;
      const interval = setInterval(() => {
        current++;
        if (current < pipelineSteps.length) {
          setPipelineSteps((prev) =>
            prev.map((s, idx) => {
              if (idx < current) return { ...s, status: 'SUCCESS' };
              if (idx === current) return { ...s, status: 'RUNNING' };
              return { ...s, status: 'PENDING' };
            })
          );
        } else {
          clearInterval(interval);
          setPipelineSteps((prev) => prev.map((s) => ({ ...s, status: 'SUCCESS' })));
          setIsDeploying(false);
          onDeployComplete();
        }
      }, 700);
    } catch (err) {
      console.error('Deploy error:', err);
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-6 bg-white text-sky-600">
      {/* Header Info */}
      <div className="bg-white border border-sky-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-sky-500" />
              <h1 className="text-base font-bold text-sky-700 font-mono tracking-tight">
                PENDARIEL CI/CD PIPELINE & FREE-TIER CLOUD ARCHITECTURE
              </h1>
              <span className="text-xs text-sky-400 font-mono">
                // FULL STACK AUTOMATED DEPLOYMENT WORKFLOW
              </span>
            </div>
            <p className="text-xs text-sky-500 mt-1">
              Automated linting, SAST security audits, and canary deployment running on free-tier cloud limits.
            </p>
          </div>

          <button
            onClick={handleTriggerDeploy}
            disabled={!currentRole.permissions.canTriggerDeployments || isDeploying}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer shadow-xs ${
              currentRole.permissions.canTriggerDeployments
                ? 'bg-sky-500 hover:bg-sky-600 text-white'
                : 'bg-sky-100 text-sky-400 cursor-not-allowed'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isDeploying ? 'animate-spin' : ''}`} />
            <span>{isDeploying ? 'Executing Real Deploy...' : 'Trigger Automated Deploy'}</span>
          </button>
        </div>
      </div>

      {/* CI/CD Pipeline Visual Stages */}
      <div className="bg-white border border-sky-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-sky-100">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-sky-700">
              WORKFLOW: deploy-prod-canary.yml (Pendariel v2.6.4)
            </span>
          </div>
          <span className="text-[11px] font-mono text-sky-500">
            Target: Google Cloud Run (europe-west3)
          </span>
        </div>

        {/* Step Nodes */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {pipelineSteps.map((step, idx) => {
            const isSelected = selectedStep.id === step.id;
            const isRunning = step.status === 'RUNNING';
            const isSuccess = step.status === 'SUCCESS';
            return (
              <div
                key={step.id}
                onClick={() => setSelectedStep(step)}
                className={`p-3 rounded-xl border transition-all cursor-pointer font-mono text-xs ${
                  isSelected
                    ? 'bg-sky-100/70 border-sky-400 shadow-xs'
                    : 'bg-sky-50/40 border-sky-100 hover:border-sky-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-sky-400 font-bold">STAGE {idx + 1}</span>
                  {isSuccess ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                  ) : isRunning ? (
                    <Zap className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-sky-200" />
                  )}
                </div>

                <div className="font-bold text-sky-800 line-clamp-1">{step.name}</div>
                <div className="text-[10px] text-sky-500 mt-1">
                  {step.durationSec}s · {step.status}
                </div>
              </div>
            );
          })}
        </div>

        {/* Step Terminal Log Output */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-sky-600 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-sky-500" />
              <span>STAGE LOGS: {selectedStep.name}</span>
            </span>
            <span className="text-[11px] text-sky-400">
              Duration: {selectedStep.durationSec}s
            </span>
          </div>

          <div className="bg-sky-50/50 p-3.5 rounded-lg border border-sky-100 font-mono text-xs text-sky-800 space-y-1 max-h-44 overflow-y-auto">
            {selectedStep.logs.map((log, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="text-sky-300 select-none">{idx + 1}</span>
                <span className="text-sky-700">{log}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Free-Tier Cloud Architecture & Cost Optimizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Architecture Topology (6 Cols) */}
        <div className="lg:col-span-6 bg-white border border-sky-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sky-100">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-sky-500" />
              <span className="font-mono text-xs font-bold text-sky-700">
                PENDARIEL CLOUD TOPOLOGY
              </span>
            </div>
            <span className="text-[10px] font-mono text-sky-600 font-bold">
              EST. COST: $0.00 / MONTH
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-sky-50/40 rounded-lg border border-sky-100 flex items-start justify-between">
              <div>
                <div className="font-bold text-sky-800">Ingestion: Upstash Serverless Kafka</div>
                <div className="text-[11px] text-sky-500 mt-0.5">
                  10,000 free commands/day, zero cold starts, SASL_SSL TLS 1.3 encryption.
                </div>
              </div>
              <span className="text-sky-600 text-[10px] font-bold">$0.00</span>
            </div>

            <div className="p-3 bg-sky-50/40 rounded-lg border border-sky-100 flex items-start justify-between">
              <div>
                <div className="font-bold text-sky-800">Storage & Index: OpenSearch / Elasticsearch Sandbox</div>
                <div className="text-[11px] text-sky-500 mt-0.5">
                  1GB storage shard allocation with full Lucene inverted index query capabilities.
                </div>
              </div>
              <span className="text-sky-600 text-[10px] font-bold">$0.00</span>
            </div>

            <div className="p-3 bg-sky-50/40 rounded-lg border border-sky-100 flex items-start justify-between">
              <div>
                <div className="font-bold text-sky-800">Compute: Google Cloud Run (Container)</div>
                <div className="text-[11px] text-sky-500 mt-0.5">
                  Scale-to-zero microservices. 2,000,000 free requests per month.
                </div>
              </div>
              <span className="text-sky-600 text-[10px] font-bold">$0.00</span>
            </div>

            <div className="p-3 bg-sky-50/40 rounded-lg border border-sky-100 flex items-start justify-between">
              <div>
                <div className="font-bold text-sky-800">Email Router: Cloudflare Email Routing + Resend</div>
                <div className="text-[11px] text-sky-500 mt-0.5">
                  Free custom domain dispatch to davidsondks@gmail.com.
                </div>
              </div>
              <span className="text-sky-600 text-[10px] font-bold">$0.00</span>
            </div>
          </div>
        </div>

        {/* Free Tier Quota Meters (6 Cols) */}
        <div className="lg:col-span-6 bg-white border border-sky-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sky-100">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-sky-500" />
              <span className="font-mono text-xs font-bold text-sky-700">
                FREE TIER USAGE VS CEILING
              </span>
            </div>
            <span className="text-[10px] font-mono text-sky-500 font-semibold">
              Zero Overages Enforced
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {costItems.map((item) => (
              <div key={item.service} className="space-y-1">
                <div className="flex justify-between text-sky-700">
                  <span className="font-semibold">{item.service}</span>
                  <span className="text-sky-500">{item.currentUsage} / {item.freeTierLimit}</span>
                </div>
                <div className="w-full bg-sky-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percentageUsed}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-sky-400">
                  <span>Quota Consumed: {item.percentageUsed}%</span>
                  <span className="text-sky-600 font-bold">{item.projectedCost}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
