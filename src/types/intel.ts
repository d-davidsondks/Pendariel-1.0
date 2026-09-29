/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RoleType = 'SUPER_ADMIN' | 'THREAT_ANALYST' | 'PRIVACY_AUDITOR' | 'FIELD_OPERATOR';

export interface UserRole {
  id: RoleType;
  title: string;
  name: string;
  email: string;
  clearance: string;
  permissions: {
    canViewRawPII: boolean;
    canTriggerPurge: boolean;
    canConfigureAlerts: boolean;
    canTriggerDeployments: boolean;
    canExportDossiers: boolean;
    canManageApiKeys: boolean;
    canExecuteKafkaInject: boolean;
  };
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  title: string;
  clearance: string;
  roleId: RoleType;
  permissions: {
    canViewRawPII: boolean;
    canTriggerPurge: boolean;
    canConfigureAlerts: boolean;
    canTriggerDeployments: boolean;
    canExportDossiers: boolean;
    canManageApiKeys: boolean;
    canExecuteKafkaInject: boolean;
  };
  assignedBy: string;
  assignedAt: string;
  tempPassword?: string;
  mustChangePasswordOnFirstSignIn: boolean;
  passwordChangedAt?: string;
  defaultPassword?: string;
  status: 'ACTIVE' | 'PENDING_FIRST_LOGIN' | 'REVOKED';
  accessRevokedAt?: string;
  accessRevokedBy?: string;
}

export type ThreatSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
export type ThreatCategory = 'CYBER_ATTACK' | 'GEOPOLITICAL' | 'FINANCIAL_FRAUD' | 'DATA_LEAK' | 'INFRASTRUCTURE' | 'SUPPLY_CHAIN';

export interface IntelligenceItem {
  id: string;
  timestamp: string;
  title: string;
  summary: string;
  rawPayload: string;
  source: string;
  sourceType: 'OSINT' | 'SIGINT' | 'DARKWEB' | 'TELEMETRY' | 'API_FEED';
  sourceReliability: 'A' | 'B' | 'C' | 'D'; // Admiralty Code
  category: ThreatCategory;
  severity: ThreatSeverity;
  confidence: number; // 0 - 100
  sector: 'DEFENSE' | 'CRITICAL_INFRA' | 'FINTECH' | 'TELECOM' | 'HEALTHCARE' | 'GOV';
  region: 'NORTH_AMERICA' | 'EUROPE' | 'ASIA_PACIFIC' | 'MIDDLE_EAST' | 'LATIN_AMERICA' | 'GLOBAL';
  iocs: {
    ips?: string[];
    domains?: string[];
    hashes?: string[];
    cves?: string[];
  };
  piiDetected: boolean;
  piiDetails?: {
    type: 'EMAIL' | 'IP' | 'CREDIT_CARD' | 'NAME' | 'PHONE';
    raw: string;
    masked: string;
  }[];
  privacyStatus: 'MASKED' | 'PSEUDONYMIZED' | 'ENCRYPTED' | 'CLEAN';
  kafkaTopic: string;
  elasticIndex: string;
  status: 'INGESTED' | 'PROCESSING' | 'ANALYZED' | 'ALERT_TRIGGERED' | 'ARCHIVED';
}

export interface KafkaTopicStats {
  topic: string;
  partitions: number;
  messageRate: number; // msgs/sec
  totalMessages: number;
  lag: number;
  retentionHours: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface ElasticsearchClusterInfo {
  clusterName: string;
  status: 'GREEN' | 'YELLOW' | 'RED';
  nodesCount: number;
  activeShards: number;
  totalDocs: number;
  storageUsedMB: number;
  jvmHeapPercent: number;
  indices: {
    name: string;
    docsCount: number;
    sizeMB: number;
    shards: number;
    replicas: number;
    health: 'GREEN' | 'YELLOW';
  }[];
}

export interface FreeApiEntry {
  id: string;
  name: string;
  category: 'AI & LLM' | 'Threat & Security' | 'Search & OSINT' | 'Finance & Crypto' | 'Weather & Geo' | 'Data & Utilities';
  provider: string;
  sourceUrl: string;
  endpoint: string;
  method: 'GET' | 'POST';
  freeTierAllowance: string;
  authType: 'API_KEY' | 'BEARER_TOKEN' | 'NO_AUTH_REQUIRED';
  requiresKey: boolean;
  description: string;
  documentationSnippet: string;
  sampleParams: Record<string, string>;
  sampleResponse: Record<string, any>;
  liveTestSupported: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  condition: {
    severity?: ThreatSeverity[];
    category?: ThreatCategory[];
    confidenceMin?: number;
    keywords?: string[];
    piiThreshold?: boolean;
  };
  actions: {
    notifyWebmail: boolean;
    dispatchWebhook: boolean;
    escalateToPager: boolean;
    triggerAutoPurge: boolean;
  };
  lastTriggered?: string;
  triggerCount: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: RoleType;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  severity: 'INFO' | 'WARNING' | 'ALERT' | 'CRITICAL';
  tamperProofHash: string;
  previousHash: string;
}

export interface WebmailMessage {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
  folder: 'INBOX' | 'ALERTS' | 'BRIEFS' | 'SUPPORT' | 'SENT';
  unread: boolean;
  starred: boolean;
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP SECRET';
  attachedIntelId?: string;
}

export interface PipelineStep {
  id: string;
  name: string;
  stage: 'LINT' | 'TEST' | 'SECURITY' | 'CONTAINER' | 'DEPLOY' | 'VERIFY';
  status: 'SUCCESS' | 'RUNNING' | 'FAILED' | 'PENDING';
  durationSec: number;
  logs: string[];
}

export interface CloudCostItem {
  service: string;
  category: 'Streaming' | 'Search' | 'Compute' | 'Storage' | 'Email';
  provider: string;
  freeTierLimit: string;
  currentUsage: string;
  percentageUsed: number;
  projectedCost: string;
  isFreeTierActive: boolean;
}

export type AgencyId =
  | 'US_MILITARY'
  | 'CIA'
  | 'FBI'
  | 'MOSSAD'
  | 'NSA'
  | 'MI6'
  | 'INTERPOL'
  | 'CNN'
  | 'BBC'
  | 'REUTERS'
  | 'AP_NEWS'
  | 'AL_JAZEERA';

export interface AgencyCapability {
  id: AgencyId;
  name: string;
  shortName: string;
  jurisdiction: string;
  classification: string;
  badgeColor: string;
  mandate: string;
  activeFeedUrl: string;
  capabilities: string[];
  lastSync: string;
  feedStatus: 'ONLINE' | 'INTERCEPTING' | 'SYNCED' | 'STANDBY';
  telemetryMetrics: {
    activeDispatches: number;
    threatAlertsCount: number;
    feedLatencyMs: number;
    verifiedPercent: number;
  };
}

export interface AgencyDispatchItem {
  id: string;
  agencyId: AgencyId;
  agencyName: string;
  timestamp: string;
  title: string;
  summary: string;
  classification: string;
  category: string;
  severity: ThreatSeverity;
  iocs?: {
    ips?: string[];
    domains?: string[];
    cves?: string[];
    actors?: string[];
  };
  targetSectors?: string[];
  url?: string;
  sourceFeed: string;
  confidence: number;
  verified: boolean;
}

export interface GlobalSearchResultItem {
  id: string;
  category: 'INTEL' | 'WEBMAIL' | 'DEEPWEB' | 'AGENCY' | 'FINANCIAL';
  title: string;
  snippet: string;
  badge: string;
  timestamp?: string;
  url?: string;
  targetTab: 'stream' | 'webmail' | 'deepweb' | 'agencies' | 'powerbi' | 'financial';
  metadata?: Record<string, any>;
}

// Financial and Market Analysis Types
export type AssetClass = 'EQUITY' | 'CRYPTO' | 'COMMODITY' | 'FOREX' | 'FIXED_INCOME' | 'INDEX';

export type IncreaseVerdict = 
  | 'STRONG_SURGE' 
  | 'MODERATE_INCREASE' 
  | 'RANGEBOUND' 
  | 'CORRECTION_RISK' 
  | 'BEARISH_DOWNWARD';

export type SuitabilityVerdict = 
  | 'HIGHLY_SUITABLE' 
  | 'CONDITIONALLY_SUITABLE' 
  | 'MARGINAL_FIT' 
  | 'UNSUITABLE_HIGH_RISK';

export type RiskProfileType = 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' | 'SPECULATIVE';

export type InvestmentHorizon = 'INTRADAY' | 'SWING_WEEKS' | 'TACTICAL_MONTHS' | 'STRATEGIC_YEARS';

export interface PricePoint {
  date: string;
  price: number;
  sma20?: number;
  sma50?: number;
  volume: number;
}

export interface FinancialInstrument {
  id: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  price: number;
  currency: string;
  change24h: number;
  change7d: number;
  volume24h: string;
  marketCap?: string;
  beta: number;
  sharpeRatio: number;
  rsi: number;
  emaCross: 'GOLDEN_CROSS' | 'DEATH_CROSS' | 'NEUTRAL_ALIGN';
  impliedVolatility: number; // percentage e.g. 24.5
  increaseLikelihood: number; // 0 - 100%
  increaseVerdict: IncreaseVerdict;
  targetUpsidePercent: number; // e.g. +14.2%
  targetDownsideFloor: number; // stop-loss/support price
  targetPriceUpper: number; // target projection
  suitabilityScore: number; // 0 - 100%
  suitabilityVerdict: SuitabilityVerdict;
  maxRecommendedAllocationPercent: number; // e.g. 7.5%
  macroCatalysts: string[];
  technicalSummary: string;
  fundamentalSummary: string;
  suitabilityReason: string;
  historicalPrices: PricePoint[];
  lastUpdated: string;
}

export interface MarketAnalysisRequest {
  symbol?: string;
  name?: string;
  assetClass?: AssetClass;
  price?: number;
  change24h?: number;
  volatility?: number;
  rsi?: number;
  movingAverageStatus?: 'ABOVE_200_SMA' | 'BELOW_200_SMA' | 'GOLDEN_CROSS' | 'DEATH_CROSS';
  volumeSurgeRatio?: number;
  newsSentiment?: number; // -1.0 to 1.0
  valuationOrPE?: string;
  marketNarrative?: string;
  riskProfile?: RiskProfileType;
  investmentHorizon?: InvestmentHorizon;
  capitalSize?: number;
}

export interface MarketAnalysisResult {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  currentPrice: number;
  increaseLikelihood: number; // 0 - 100%
  increaseVerdict: IncreaseVerdict;
  projectedReturnPercent: {
    conservative: number;
    base: number;
    bullExpansion: number;
  };
  projectedPriceTargets: {
    floorStopLoss: number;
    baseTarget: number;
    bullExpansionTarget: number;
  };
  riskRewardRatio: number;
  suitabilityScore: number; // 0 - 100%
  suitabilityVerdict: SuitabilityVerdict;
  maxRecommendedWeight: number; // percentage
  suitabilityBreakdown: {
    volatilityAlignment: string;
    drawdownRisk: string;
    horizonMatch: string;
    liquidityFactor: string;
  };
  factorAttribution: {
    technicalScore: number; // 0 - 100
    momentumScore: number; // 0 - 100
    liquidityScore: number; // 0 - 100
    macroSentimentScore: number; // 0 - 100
  };
  actionRecommendation: string;
  detailedAnalysisSummary: string;
  downsideRisks: string[];
  timestamp: string;
}
