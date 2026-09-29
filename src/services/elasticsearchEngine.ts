/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IntelligenceItem } from '../types/intel';

export interface SearchFilterParams {
  query?: string;
  category?: string;
  severity?: string;
  sector?: string;
  region?: string;
  sourceType?: string;
  minConfidence?: number;
}

export interface SearchAggregations {
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  bySector: Record<string, number>;
  byRegion: Record<string, number>;
  totalHits: number;
  averageConfidence: number;
}

export class ElasticsearchEngine {
  public static executeQuery(
    items: IntelligenceItem[],
    params: SearchFilterParams
  ): {
    hits: IntelligenceItem[];
    aggregations: SearchAggregations;
    tookMs: number;
  } {
    const startTime = performance.now();
    let filtered = [...items];

    // Text search (supports field:value like severity:CRITICAL or plain terms)
    if (params.query && params.query.trim()) {
      const q = params.query.trim().toLowerCase();

      if (q.includes(':')) {
        const parts = q.split(':');
        const field = parts[0].trim();
        const val = parts[1].trim();

        filtered = filtered.filter((item) => {
          if (field === 'severity') return item.severity.toLowerCase() === val;
          if (field === 'category') return item.category.toLowerCase().includes(val);
          if (field === 'sector') return item.sector.toLowerCase().includes(val);
          if (field === 'region') return item.region.toLowerCase().includes(val);
          if (field === 'id') return item.id.toLowerCase().includes(val);
          return false;
        });
      } else {
        filtered = filtered.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.summary.toLowerCase().includes(q) ||
            item.source.toLowerCase().includes(q) ||
            item.rawPayload.toLowerCase().includes(q) ||
            item.iocs.ips?.some((ip) => ip.toLowerCase().includes(q)) ||
            item.iocs.domains?.some((d) => d.toLowerCase().includes(q)) ||
            item.iocs.cves?.some((cve) => cve.toLowerCase().includes(q))
        );
      }
    }

    if (params.category && params.category !== 'ALL') {
      filtered = filtered.filter((item) => item.category === params.category);
    }

    if (params.severity && params.severity !== 'ALL') {
      filtered = filtered.filter((item) => item.severity === params.severity);
    }

    if (params.sector && params.sector !== 'ALL') {
      filtered = filtered.filter((item) => item.sector === params.sector);
    }

    if (params.region && params.region !== 'ALL') {
      filtered = filtered.filter((item) => item.region === params.region);
    }

    if (params.sourceType && params.sourceType !== 'ALL') {
      filtered = filtered.filter((item) => item.sourceType === params.sourceType);
    }

    if (params.minConfidence !== undefined) {
      filtered = filtered.filter((item) => item.confidence >= params.minConfidence!);
    }

    // Build aggregations
    const bySeverity: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      INFORMATIONAL: 0,
    };
    const byCategory: Record<string, number> = {};
    const bySector: Record<string, number> = {};
    const byRegion: Record<string, number> = {};
    let confidenceSum = 0;

    filtered.forEach((item) => {
      bySeverity[item.severity] = (bySeverity[item.severity] || 0) + 1;
      byCategory[item.category] = (byCategory[item.category] || 0) + 1;
      bySector[item.sector] = (bySector[item.sector] || 0) + 1;
      byRegion[item.region] = (byRegion[item.region] || 0) + 1;
      confidenceSum += item.confidence;
    });

    const tookMs = Math.round((performance.now() - startTime) * 10) / 10 + 2; // simulated realistic cluster index query time (2-5ms)

    return {
      hits: filtered,
      aggregations: {
        bySeverity,
        byCategory,
        bySector,
        byRegion,
        totalHits: filtered.length,
        averageConfidence: filtered.length > 0 ? Math.round(confidenceSum / filtered.length) : 0,
      },
      tookMs,
    };
  }
}
