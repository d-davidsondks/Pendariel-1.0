/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IntelligenceItem } from '../types/intel';
import { PrivacyEngine } from './privacyEngine';

export interface KafkaMessageEvent {
  offset: number;
  partition: number;
  topic: string;
  key: string;
  timestamp: string;
  value: IntelligenceItem;
}

export type KafkaListener = (event: KafkaMessageEvent) => void;

class KafkaSimulatorService {
  private listeners: KafkaListener[] = [];
  private currentOffset = 104820;

  public subscribe(listener: KafkaListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public publish(
    topic: string,
    key: string,
    rawPayload: {
      title: string;
      summary: string;
      rawJson: string;
      source: string;
      category: any;
      severity: any;
      sector: any;
      region: any;
      confidence: number;
    }
  ): KafkaMessageEvent {
    this.currentOffset++;
    const partition = Math.floor(Math.random() * 8);

    // Sanitize payload using PrivacyEngine
    const piiCheck = PrivacyEngine.scanAndSanitize(rawPayload.rawJson);

    const item: IntelligenceItem = {
      id: `INTEL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      title: rawPayload.title,
      summary: rawPayload.summary,
      rawPayload: piiCheck.sanitizedText,
      source: rawPayload.source,
      sourceType: 'API_FEED',
      sourceReliability: 'B',
      category: rawPayload.category,
      severity: rawPayload.severity,
      confidence: rawPayload.confidence,
      sector: rawPayload.sector,
      region: rawPayload.region,
      iocs: {
        ips: ['198.51.100.' + Math.floor(10 + Math.random() * 200)],
        domains: ['threat-telemetry-' + Math.floor(Math.random() * 100) + '.org'],
      },
      piiDetected: piiCheck.hasPii,
      piiDetails: piiCheck.detectedPii.map((d) => ({
        type: d.type as any,
        raw: d.raw,
        masked: d.masked,
      })),
      privacyStatus: piiCheck.hasPii ? 'MASKED' : 'CLEAN',
      kafkaTopic: topic,
      elasticIndex: `intel-${topic.replace('.', '-')}-2026.09`,
      status: 'INGESTED',
    };

    const event: KafkaMessageEvent = {
      offset: this.currentOffset,
      partition,
      topic,
      key,
      timestamp: new Date().toISOString(),
      value: item,
    };

    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Kafka listener error:', err);
      }
    });

    return event;
  }
}

export const kafkaSimulator = new KafkaSimulatorService();
