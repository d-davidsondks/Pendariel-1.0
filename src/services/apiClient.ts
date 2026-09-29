/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IntelligenceItem, AlertRule, AuditLogEntry, WebmailMessage } from '../types/intel';

export interface SearchParams {
  targetField?: 'all' | 'ip' | 'cve' | 'domain' | 'hash' | 'title' | 'id' | 'sector' | 'severity' | 'agency' | 'deepweb';
  query?: string;
  severity?: string;
  sector?: string;
  region?: string;
  minConfidence?: number;
}

export class ApiClient {
  public static async fetchHealth() {
    const res = await fetch('/api/health');
    return res.json();
  }

  public static async fetchIntel(params: SearchParams = {}): Promise<{
    hits: IntelligenceItem[];
    total: number;
    tookMs: number;
    targetParameterApplied: string;
    aggregations: {
      bySeverity: Record<string, number>;
      bySector: Record<string, number>;
      byRegion: Record<string, number>;
      averageConfidence: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params.targetField) searchParams.append('targetField', params.targetField);
    if (params.query) searchParams.append('query', params.query);
    if (params.severity) searchParams.append('severity', params.severity);
    if (params.sector) searchParams.append('sector', params.sector);
    if (params.region) searchParams.append('region', params.region);
    if (params.minConfidence !== undefined) {
      searchParams.append('minConfidence', String(params.minConfidence));
    }

    const res = await fetch(`/api/intel?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch intelligence items');
    return res.json();
  }

  public static async ingestIntel(payload: Partial<IntelligenceItem> & { actor?: string }) {
    const res = await fetch('/api/intel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to ingest telemetry item');
    return res.json();
  }

  public static async proxyExternalApi(req: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    params?: Record<string, any>;
    body?: any;
  }) {
    const res = await fetch('/api/proxy-api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return res.json();
  }

  public static async fetchAlertRules(): Promise<AlertRule[]> {
    const res = await fetch('/api/alerts/rules');
    if (!res.ok) throw new Error('Failed to fetch alert rules');
    return res.json();
  }

  public static async createAlertRule(rule: Partial<AlertRule>) {
    const res = await fetch('/api/alerts/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });
    return res.json();
  }

  public static async toggleAlertRule(id: string) {
    const res = await fetch('/api/alerts/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    return res.json();
  }

  public static async purgeGdpr(target: string, actor: string) {
    const res = await fetch('/api/privacy/purge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, actor }),
    });
    return res.json();
  }

  public static async fetchWebmail(): Promise<WebmailMessage[]> {
    const res = await fetch('/api/webmail');
    if (!res.ok) throw new Error('Failed to fetch webmail messages');
    return res.json();
  }

  public static async sendWebmail(msg: Partial<WebmailMessage>) {
    const res = await fetch('/api/webmail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
    if (!res.ok) throw new Error('Failed to dispatch webmail');
    return res.json();
  }

  public static async fetchAudit(): Promise<AuditLogEntry[]> {
    const res = await fetch('/api/audit');
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  }

  public static async verifyAuditChain() {
    const res = await fetch('/api/audit/verify', { method: 'POST' });
    return res.json();
  }

  public static async triggerDeploy() {
    const res = await fetch('/api/cicd/deploy', { method: 'POST' });
    return res.json();
  }

  // User & Role Assignment Management
  public static async fetchUsers() {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch user accounts');
    return res.json();
  }

  public static async createUser(user: any) {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
  }

  public static async inviteUser(data: {
    email: string;
    roleId: string;
    name?: string;
    title?: string;
    clearance?: string;
    assignor?: string;
  }) {
    const res = await fetch('/api/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to invite user');
    }
    return res.json();
  }

  public static async changePassword(userId: string, newPassword: string) {
    const res = await fetch(`/api/users/${userId}/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to change password');
    }
    return res.json();
  }

  public static async resetTempPassword(userId: string, assignor?: string) {
    const res = await fetch(`/api/users/${userId}/reset-temp-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignor }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to regenerate temp password');
    }
    return res.json();
  }

  public static async assignUserRole(id: string, update: {
    roleId?: string;
    permissions?: Record<string, boolean>;
    title?: string;
    clearance?: string;
    assignor?: string;
  }) {
    const res = await fetch(`/api/users/${id}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    if (!res.ok) throw new Error('Failed to assign user role');
    return res.json();
  }

  public static async deleteUser(id: string, assignor?: string) {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignor }),
    });
    if (!res.ok) throw new Error('Failed to deactivate user');
    return res.json();
  }

  // Deep Web & Tor Onion Access
  public static async scanDeepWeb(query: string, actor?: string) {
    const res = await fetch('/api/deepweb/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, actor }),
    });
    if (!res.ok) throw new Error('Failed to scan deep web indicator');
    return res.json();
  }

  public static async fetchDeepWebRegistry() {
    const res = await fetch('/api/deepweb/registry');
    if (!res.ok) throw new Error('Failed to fetch deep web registry');
    return res.json();
  }

  // Strategic Agency & Media Feeds API (US Military, CIA, FBI, Mossad, CNN, BBC)
  public static async fetchAgencies() {
    const res = await fetch('/api/agencies');
    if (!res.ok) throw new Error('Failed to fetch agency capabilities');
    return res.json();
  }

  public static async fetchAgencyDispatches(agencyId?: string, query?: string) {
    const params = new URLSearchParams();
    if (agencyId && agencyId !== 'ALL') params.append('agencyId', agencyId);
    if (query) params.append('q', query);
    const res = await fetch(`/api/agencies/dispatches?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch agency dispatches');
    return res.json();
  }

  public static async ingestAgencyDispatch(dispatchId: string, actor?: string) {
    const res = await fetch('/api/agencies/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dispatchId, actor }),
    });
    if (!res.ok) throw new Error('Failed to ingest agency dispatch');
    return res.json();
  }

  public static async pollAgencyFeed(agencyId: string, actor?: string) {
    const res = await fetch(`/api/agencies/${agencyId}/poll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor }),
    });
    if (!res.ok) throw new Error('Failed to probe agency feed');
    return res.json();
  }

  public static async fetchFbiWanted(query?: string) {
    const params = query ? `?query=${encodeURIComponent(query)}` : '';
    const res = await fetch(`/api/fbi/wanted${params}`);
    if (!res.ok) throw new Error('Failed to fetch FBI Wanted registry');
    return res.json();
  }

  public static async fetchCisaKev(query?: string, limit: number = 25) {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (limit) params.append('limit', String(limit));
    const res = await fetch(`/api/cisa/kev?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch CISA KEV catalog');
    return res.json();
  }

  public static async probeLiveTarget(target: string, type?: string) {
    const res = await fetch('/api/intel/probe-target', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, type }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to probe live target');
    }
    return res.json();
  }

  public static async fetchMediaLiveWire(outlet?: string) {
    const params = outlet ? `?outlet=${outlet}` : '';
    const res = await fetch(`/api/media/live-wire${params}`);
    if (!res.ok) throw new Error('Failed to fetch media live wire');
    return res.json();
  }

  // Cross-component Global Search API
  public static async globalSearch(query: string) {
    if (!query || !query.trim()) return { total: 0, results: [], categorized: {} };
    const res = await fetch(`/api/search/global?q=${encodeURIComponent(query.trim())}`);
    if (!res.ok) throw new Error('Global search failed');
    return res.json();
  }

  // Access Revocation & Restoration
  public static async revokeUserAccess(userId: string, assignor: string = 'davidsondks@gmail.com') {
    const res = await fetch(`/api/users/${userId}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignor }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to revoke user access');
    }
    return res.json();
  }

  public static async restoreUserAccess(userId: string, assignor: string = 'davidsondks@gmail.com') {
    const res = await fetch(`/api/users/${userId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignor }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to restore user access');
    }
    return res.json();
  }

  // Network Gateway Information (172.10.100.0)
  public static async getNetworkGateway() {
    const res = await fetch('/api/network/gateway');
    if (!res.ok) throw new Error('Failed to fetch network gateway status');
    return res.json();
  }

  // User Authentication
  public static async login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Authentication failed');
    }
    return res.json();
  }

  public static async checkSession(email?: string) {
    const url = email ? `/api/auth/session?email=${encodeURIComponent(email)}` : '/api/auth/session';
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Session verification failed');
    }
    return res.json();
  }

  // Financial and Market Analysis APIs
  public static async fetchFinancialInstruments(params: {
    assetClass?: string;
    riskProfile?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.assetClass) query.append('assetClass', params.assetClass);
    if (params.riskProfile) query.append('riskProfile', params.riskProfile);

    const res = await fetch(`/api/financial/instruments?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch financial instruments');
    return res.json();
  }

  public static async analyzeMarketInstrument(params: any) {
    const res = await fetch('/api/financial/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to analyze market instrument');
    }
    return res.json();
  }

  public static async simulateMacroScenario(scenarioId: string, riskProfile?: string) {
    const res = await fetch('/api/financial/simulate-macro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId, riskProfile }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to simulate macro scenario');
    }
    return res.json();
  }
}
