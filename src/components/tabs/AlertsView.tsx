/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Send,
  Webhook,
  Mail,
} from 'lucide-react';
import { AlertRule, UserRole, ThreatSeverity, ThreatCategory } from '../../types/intel';
import { ApiClient } from '../../services/apiClient';

interface AlertsViewProps {
  currentRole: UserRole;
  onAlertTriggered: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  currentRole,
  onAlertTriggered,
}) => {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New rule state
  const [ruleName, setRuleName] = useState<string>('');
  const [ruleDesc, setRuleDesc] = useState<string>('');
  const [ruleSeverity, setRuleSeverity] = useState<ThreatSeverity>('CRITICAL');
  const [ruleCategory, setRuleCategory] = useState<ThreatCategory>('CYBER_ATTACK');
  const [ruleMinConfidence, setRuleMinConfidence] = useState<number>(85);
  const [notifyWebmail, setNotifyWebmail] = useState<boolean>(true);
  const [dispatchWebhook, setDispatchWebhook] = useState<boolean>(true);

  // Incidents state
  const [incidents, setIncidents] = useState([
    {
      id: 'INC-901',
      ruleId: 'RULE-001',
      title: 'CRITICAL: SCADA Zero-Day Probe on European Energy Grid',
      timestamp: '2026-09-26T15:52:10Z',
      status: 'TRIGGERED',
      severity: 'CRITICAL',
      dispatchedTo: 'davidsondks@gmail.com & Webhook',
    },
    {
      id: 'INC-902',
      ruleId: 'RULE-002',
      title: 'Dark Web Breach Dump: 120,000 Financial Records',
      timestamp: '2026-09-26T15:35:44Z',
      status: 'ACKNOWLEDGED',
      severity: 'CRITICAL',
      dispatchedTo: 'davidsondks@gmail.com',
    },
  ]);

  const loadRules = async () => {
    try {
      const data = await ApiClient.fetchAlertRules();
      setRules(data);
    } catch (err) {
      console.error('Failed to load rules:', err);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggleRule = async (id: string) => {
    try {
      await ApiClient.toggleAlertRule(id);
      loadRules();
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    try {
      await ApiClient.createAlertRule({
        name: ruleName.trim(),
        description: ruleDesc.trim(),
        enabled: true,
        condition: {
          severity: [ruleSeverity],
          category: [ruleCategory],
          confidenceMin: ruleMinConfidence,
        },
        actions: {
          notifyWebmail,
          dispatchWebhook,
          escalateToPager: false,
          triggerAutoPurge: false,
        },
      });

      setShowCreateModal(false);
      setRuleName('');
      setRuleDesc('');
      loadRules();
    } catch (err) {
      console.error('Failed to create rule:', err);
    }
  };

  const handleTestDispatch = async (rule: AlertRule) => {
    try {
      await ApiClient.sendWebmail({
        sender: 'automated-sentinel@pendariel.net',
        recipient: currentRole.email,
        subject: `🚨 LIVE ALERT DISPATCH [${rule.id}]: ${rule.name}`,
        body: `Pendariel Automated Alert Evaluation:
Rule "${rule.name}" triggered an automated test notification directly on the backend database.
Condition: Severity ${rule.condition.severity?.join(', ')} | Min Confidence: ${rule.condition.confidenceMin}%

Dispatched to user: ${currentRole.name} (${currentRole.email})`,
        classification: 'SECRET',
      });
      onAlertTriggered();
    } catch (err) {
      console.error('Test dispatch error:', err);
    }
  };

  const handleUpdateIncidentStatus = (id: string, newStatus: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: newStatus } : inc))
    );
  };

  return (
    <div className="space-y-6 bg-white text-sky-600">
      {/* Header Info */}
      <div className="bg-white border border-sky-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-sky-500" />
              <h1 className="text-base font-bold text-sky-700 font-mono tracking-tight">
                PENDARIEL AUTOMATED ALERTING ENGINE
              </h1>
              <span className="text-xs text-sky-400 font-mono">
                // REAL-TIME EVENT-DRIVEN DISPATCH
              </span>
            </div>
            <p className="text-xs text-sky-500 mt-1">
              Trigger rules evaluated on the backend for each incoming intelligence telemetry event.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!currentRole.permissions.canConfigureAlerts}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer shadow-xs ${
              currentRole.permissions.canConfigureAlerts
                ? 'bg-sky-500 hover:bg-sky-600 text-white'
                : 'bg-sky-100 text-sky-400 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>New Alert Rule</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Active Rules & Incidents Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Alert Rules (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-sky-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sky-100">
            <span className="text-xs font-bold text-sky-700 font-mono">
              BACKEND AUTOMATION RULES ({rules.length})
            </span>
            <span className="text-[11px] font-mono text-sky-400">
              Evaluated on each event
            </span>
          </div>

          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-3.5 bg-sky-50/40 border border-sky-100 rounded-xl space-y-2 font-mono text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sky-500 font-bold">{rule.id}</span>
                      <span className="text-sky-800 font-bold">{rule.name}</span>
                    </div>
                    <p className="text-[11px] text-sky-600 font-sans mt-0.5">
                      {rule.description}
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    disabled={!currentRole.permissions.canConfigureAlerts}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      rule.enabled
                        ? 'bg-sky-500 text-white'
                        : 'bg-sky-100 text-sky-400'
                    }`}
                  >
                    {rule.enabled ? 'ACTIVE' : 'DISABLED'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 text-[10px] text-sky-500 pt-1 border-t border-sky-100">
                  <span className="font-semibold text-sky-700">Conditions:</span>
                  {rule.condition?.severity && (
                    <span className="text-sky-600 font-semibold">
                      Severity: {rule.condition.severity.join(', ')}
                    </span>
                  )}
                  {rule.condition?.confidenceMin && (
                    <span className="text-sky-600 font-semibold">
                      Confidence &ge; {rule.condition.confidenceMin}%
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-sky-500 pt-1">
                  <div className="flex items-center gap-3">
                    {rule.actions?.notifyWebmail && (
                      <span className="flex items-center gap-1 text-sky-600 font-medium">
                        <Mail className="w-3 h-3 text-sky-400" />
                        <span>Webmail (davidsondks@gmail.com)</span>
                      </span>
                    )}
                    {rule.actions?.dispatchWebhook && (
                      <span className="flex items-center gap-1 text-sky-600 font-medium">
                        <Webhook className="w-3 h-3 text-sky-400" />
                        <span>Webhook</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleTestDispatch(rule)}
                    className="flex items-center gap-1 text-sky-600 hover:text-sky-800 transition-colors cursor-pointer text-[10px] font-semibold"
                  >
                    <Send className="w-3 h-3 text-sky-400" />
                    <span>Test Dispatch</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Incidents Queue (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-sky-200 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-sky-100 mb-3">
              <span className="text-xs font-bold text-sky-700 font-mono">
                DISPATCHED INCIDENTS QUEUE
              </span>
              <span className="text-[11px] font-mono text-sky-500 font-semibold">
                {incidents.filter((i) => i.status === 'TRIGGERED').length} Active
              </span>
            </div>

            <div className="space-y-2.5">
              {incidents.map((inc) => {
                const isTriggered = inc.status === 'TRIGGERED';
                const isAck = inc.status === 'ACKNOWLEDGED';
                return (
                  <div
                    key={inc.id}
                    className={`p-3 rounded-lg border font-mono text-xs space-y-2 ${
                      isTriggered
                        ? 'bg-sky-50 border-sky-300'
                        : isAck
                        ? 'bg-sky-50/50 border-sky-200'
                        : 'bg-white border-sky-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-sky-700 font-bold">{inc.id}</span>
                      <span className="text-[10px] font-bold text-sky-600">
                        {inc.status}
                      </span>
                    </div>

                    <div className="font-semibold text-sky-800">
                      {inc.title}
                    </div>

                    <div className="text-[10px] text-sky-400">
                      Dispatched to: {inc.dispatchedTo}
                    </div>

                    <div className="flex justify-end gap-2 pt-1 border-t border-sky-100">
                      {isTriggered && (
                        <button
                          onClick={() => handleUpdateIncidentStatus(inc.id, 'ACKNOWLEDGED')}
                          className="px-2 py-0.5 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded text-[10px] cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      )}
                      {(isTriggered || isAck) && (
                        <button
                          onClick={() => handleUpdateIncidentStatus(inc.id, 'RESOLVED')}
                          className="px-2 py-0.5 bg-sky-500 hover:bg-sky-600 text-white rounded text-[10px] cursor-pointer"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-sky-100 text-[11px] font-mono text-sky-400 flex justify-between">
            <span>WEBMAIL ROUTE: ACTIVE</span>
            <span>BACKEND DISPATCH: REAL-TIME</span>
          </div>
        </div>
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-sky-950/20 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-300 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <h3 className="text-sm font-bold text-sky-800 font-mono">
                CREATE BACKEND ALERT RULE
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-sky-400 hover:text-sky-600 font-mono text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-sky-700 font-semibold mb-1">RULE NAME</label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. Critical SCADA Controller Vulnerability"
                  className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800"
                  required
                />
              </div>

              <div>
                <label className="block text-sky-700 font-semibold mb-1">DESCRIPTION</label>
                <textarea
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sky-700 font-semibold mb-1">SEVERITY</label>
                  <select
                    value={ruleSeverity}
                    onChange={(e) => setRuleSeverity(e.target.value as any)}
                    className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sky-700 font-semibold mb-1">MIN CONFIDENCE</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={ruleMinConfidence}
                    onChange={(e) => setRuleMinConfidence(Number(e.target.value))}
                    className="w-full bg-white border border-sky-200 rounded-lg p-2 text-sky-800"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-sky-100 space-y-2">
                <span className="block text-sky-700 font-semibold">DISPATCH CHANNELS:</span>
                <label className="flex items-center gap-2 cursor-pointer text-sky-600">
                  <input
                    type="checkbox"
                    checked={notifyWebmail}
                    onChange={(e) => setNotifyWebmail(e.target.checked)}
                    className="accent-sky-500"
                  />
                  <span>Dispatch Webmail (davidsondks@gmail.com)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sky-600">
                  <input
                    type="checkbox"
                    checked={dispatchWebhook}
                    onChange={(e) => setDispatchWebhook(e.target.checked)}
                    className="accent-sky-500"
                  />
                  <span>Post JSON Payload to Webhook</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold cursor-pointer"
                >
                  Save Alert Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
