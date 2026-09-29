/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Network,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  Filter,
  ShieldAlert,
  Server,
  Globe,
  Bug,
  Building2,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { IntelligenceItem, UserRole } from '../../types/intel';

export type NodeType = 'THREAT_ACTOR' | 'IP' | 'DOMAIN' | 'CVE' | 'SECTOR' | 'INCIDENT';

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: NodeType;
  riskScore: number;
  origin?: string;
  details: string;
  connectedCount?: number;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  relationship: string;
  confidence: number;
}

interface KnowledgeGraphViewProps {
  currentRole: UserRole;
  intelItems?: IntelligenceItem[];
  onOpenIncident?: (id: string) => void;
}

const INITIAL_NODES: GraphNode[] = [
  // Threat Actors
  {
    id: 'actor-apt28',
    name: 'APT28 (Fancy Bear / STRONTIUM)',
    type: 'THREAT_ACTOR',
    riskScore: 98,
    origin: 'Eastern Europe / State-Sponsored',
    details: 'Advanced persistent threat actor focusing on European government and critical infrastructure ICS/SCADA systems.',
  },
  {
    id: 'actor-volt-typhoon',
    name: 'Volt Typhoon (Vanguard Panda)',
    type: 'THREAT_ACTOR',
    riskScore: 95,
    origin: 'Asia-Pacific / State-Sponsored',
    details: 'Espionage cluster utilizing living-off-the-land techniques to compromise telecom and maritime routing hubs.',
  },
  {
    id: 'actor-lazarus',
    name: 'Lazarus Group (Hidden Cobra)',
    type: 'THREAT_ACTOR',
    riskScore: 94,
    origin: 'East Asia',
    details: 'Financially motivated state-sponsored syndicate executing cryptocurrency exfiltration and neo-bank credential dumps.',
  },

  // Target Sectors
  {
    id: 'sector-energy',
    name: 'Critical Infrastructure / Energy',
    type: 'SECTOR',
    riskScore: 90,
    details: 'European electrical generation and high-voltage substation networks.',
  },
  {
    id: 'sector-telecom',
    name: 'Telecommunications & BGP',
    type: 'SECTOR',
    riskScore: 85,
    details: 'Trans-continental optical backhauls and Tier-1 autonomous system routing tables.',
  },
  {
    id: 'sector-fintech',
    name: 'Fintech & Neo-Banking',
    type: 'SECTOR',
    riskScore: 88,
    details: 'Digital banking ledgers, cloud payment gateways, and retail banking credentials.',
  },
  {
    id: 'sector-defense',
    name: 'Defense & Maritime Straits',
    type: 'SECTOR',
    riskScore: 92,
    details: 'Naval transit monitoring, AIS transponders, and diplomatic communications.',
  },

  // Known IPs
  {
    id: 'ip-194-26-29-112',
    name: '194.26.29.112',
    type: 'IP',
    riskScore: 96,
    origin: 'Netherlands / AS4134 Transit',
    details: 'Primary Command & Control probe relay scanning Modbus port 502 across EU power distributors.',
  },
  {
    id: 'ip-185-220-101-5',
    name: '185.220.101.5',
    type: 'IP',
    riskScore: 92,
    origin: 'Germany / Tor Exit Relay',
    details: 'High-frequency Tor exit node observed in credential credential spraying against fintech API gateways.',
  },
  {
    id: 'ip-198-51-100-12',
    name: '198.51.100.12',
    type: 'IP',
    riskScore: 88,
    origin: 'Regional Telecom Hub',
    details: 'Originator of fraudulent BGP route announcements hijacking AS-701 transit prefixes.',
  },
  {
    id: 'ip-103-145-13-44',
    name: '103.145.13.44',
    type: 'IP',
    riskScore: 82,
    origin: 'Southeast Asia Gateway',
    details: 'Botnet controller coordinating synthetic disinformation targeting Malacca Strait vessel tracking.',
  },

  // Domains
  {
    id: 'domain-telemetry-sync',
    name: 'telemetry-sync-cdn.net',
    type: 'DOMAIN',
    riskScore: 94,
    details: 'Covert C2 domain masquerading as benign telemetry sync for SCADA monitoring software.',
  },
  {
    id: 'domain-grid-auth',
    name: 'grid-auth-portal.com',
    type: 'DOMAIN',
    riskScore: 91,
    details: 'Spoofed OAuth login page harvesting operator credentials for power grid substation controls.',
  },
  {
    id: 'domain-darkonion',
    name: 'darkonion7xbbq3.onion',
    type: 'DOMAIN',
    riskScore: 96,
    details: 'Dark web marketplace hosting 120,000 exfiltrated banking customer records.',
  },
  {
    id: 'domain-bgp-transit',
    name: 'bgp-transit-relay.net',
    type: 'DOMAIN',
    riskScore: 86,
    details: 'Rogue autonomous system portal used for anomalous BGP routing injection.',
  },
  {
    id: 'domain-maritime-truth',
    name: 'maritime-truth-dispatch.org',
    type: 'DOMAIN',
    riskScore: 80,
    details: 'Disinformation publishing site disseminating falsified AIS navigation warnings.',
  },

  // CVEs
  {
    id: 'cve-2026-4418',
    name: 'CVE-2026-4418',
    type: 'CVE',
    riskScore: 99,
    details: 'Zero-day remote code execution in Modbus-TCP controller firmware (CVSS 9.8 Critical).',
  },
  {
    id: 'cve-2024-3094',
    name: 'CVE-2024-3094',
    type: 'CVE',
    riskScore: 100,
    details: 'Backdoor in upstream xz-utils library enabling unauthorized SSH authentication bypass.',
  },
];

const INITIAL_LINKS: GraphLink[] = [
  // APT28 mappings
  { source: 'actor-apt28', target: 'ip-194-26-29-112', relationship: 'OPERATES_C2', confidence: 96 },
  { source: 'actor-apt28', target: 'sector-energy', relationship: 'TARGETS', confidence: 98 },
  { source: 'ip-194-26-29-112', target: 'domain-telemetry-sync', relationship: 'RESOLVES_TO', confidence: 94 },
  { source: 'ip-194-26-29-112', target: 'domain-grid-auth', relationship: 'HOSTS_PHISH', confidence: 92 },
  { source: 'ip-194-26-29-112', target: 'cve-2026-4418', relationship: 'EXPLOITS', confidence: 98 },
  { source: 'cve-2026-4418', target: 'sector-energy', relationship: 'IMPACTS', confidence: 99 },

  // Lazarus mappings
  { source: 'actor-lazarus', target: 'sector-fintech', relationship: 'TARGETS', confidence: 95 },
  { source: 'actor-lazarus', target: 'ip-185-220-101-5', relationship: 'PROXIES_THROUGH', confidence: 90 },
  { source: 'ip-185-220-101-5', target: 'domain-darkonion', relationship: 'EXFILTRATES_TO', confidence: 92 },
  { source: 'domain-darkonion', target: 'sector-fintech', relationship: 'LEAKS_CREDENTIALS', confidence: 96 },

  // Volt Typhoon mappings
  { source: 'actor-volt-typhoon', target: 'sector-telecom', relationship: 'TARGETS', confidence: 94 },
  { source: 'actor-volt-typhoon', target: 'sector-defense', relationship: 'SURVEILS', confidence: 91 },
  { source: 'actor-volt-typhoon', target: 'ip-198-51-100-12', relationship: 'HIJACKS_ROUTE', confidence: 89 },
  { source: 'ip-198-51-100-12', target: 'domain-bgp-transit', relationship: 'REROUTES_TRAFFIC', confidence: 88 },
  { source: 'actor-volt-typhoon', target: 'ip-103-145-13-44', relationship: 'CONTROLS_BOTS', confidence: 82 },
  { source: 'ip-103-145-13-44', target: 'domain-maritime-truth', relationship: 'AMPLIFIES', confidence: 84 },
  { source: 'domain-maritime-truth', target: 'sector-defense', relationship: 'DISINFORMS', confidence: 86 },
];

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  currentRole,
  intelItems = [],
  onOpenIncident,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomGRef = useRef<SVGGElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<Record<NodeType, boolean>>({
    THREAT_ACTOR: true,
    IP: true,
    DOMAIN: true,
    CVE: true,
    SECTOR: true,
    INCIDENT: true,
  });
  const [minRiskScore, setMinRiskScore] = useState<number>(50);

  // Physics Simulation Settings
  const [chargeStrength, setChargeStrength] = useState<number>(-260);
  const [linkDistance, setLinkDistance] = useState<number>(100);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // Interactive Selection State
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Merge static known relationships with live ingested items from the backend
  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    INITIAL_NODES.forEach((n) => nodeMap.set(n.id, { ...n }));

    const rawLinks: GraphLink[] = [...INITIAL_LINKS];

    // Dynamically incorporate real backend intel items
    intelItems.forEach((item) => {
      const incidentId = `inc-${item.id.toLowerCase()}`;
      if (!nodeMap.has(incidentId)) {
        nodeMap.set(incidentId, {
          id: incidentId,
          name: `${item.id}: ${item.title.slice(0, 32)}...`,
          type: 'INCIDENT',
          riskScore: item.confidence,
          origin: item.region,
          details: item.summary,
        });
      }

      // Link to sector
      const sectorId = `sector-${item.sector.toLowerCase().replace('_', '-')}`;
      if (nodeMap.has(sectorId)) {
        rawLinks.push({
          source: incidentId,
          target: sectorId,
          relationship: 'IMPACTS_SECTOR',
          confidence: item.confidence,
        });
      }

      // Link to IPs
      item.iocs.ips?.forEach((ip) => {
        const ipId = `ip-${ip.replace(/\./g, '-')}`;
        if (!nodeMap.has(ipId)) {
          nodeMap.set(ipId, {
            id: ipId,
            name: ip,
            type: 'IP',
            riskScore: item.severity === 'CRITICAL' ? 96 : 85,
            origin: item.region,
            details: `Observed in incident ${item.id}`,
          });
        }
        rawLinks.push({
          source: incidentId,
          target: ipId,
          relationship: 'CONTAINS_IOC',
          confidence: item.confidence,
        });
      });

      // Link to Domains
      item.iocs.domains?.forEach((dom) => {
        const domId = `dom-${dom.replace(/[^a-zA-Z0-9]/g, '-')}`;
        if (!nodeMap.has(domId)) {
          nodeMap.set(domId, {
            id: domId,
            name: dom,
            type: 'DOMAIN',
            riskScore: item.severity === 'CRITICAL' ? 92 : 80,
            details: `Identified domain in ${item.title}`,
          });
        }
        rawLinks.push({
          source: incidentId,
          target: domId,
          relationship: 'RESOLVES_IOC',
          confidence: item.confidence,
        });
      });

      // Link to CVEs
      item.iocs.cves?.forEach((cve) => {
        const cveId = `cve-${cve.toLowerCase()}`;
        if (!nodeMap.has(cveId)) {
          nodeMap.set(cveId, {
            id: cveId,
            name: cve,
            type: 'CVE',
            riskScore: 98,
            details: `Vulnerability weaponized in incident ${item.id}`,
          });
        }
        rawLinks.push({
          source: incidentId,
          target: cveId,
          relationship: 'EXPLOITED_IN',
          confidence: item.confidence,
        });
      });
    });

    const activeNodes = Array.from(nodeMap.values()).filter((n) => {
      const matchType = selectedTypes[n.type];
      const matchScore = n.riskScore >= minRiskScore;
      const matchSearch =
        !searchQuery ||
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.details.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchScore && matchSearch;
    });

    const activeNodeIds = new Set(activeNodes.map((n) => n.id));

    const activeLinks = rawLinks.filter((l) => {
      const sId = typeof l.source === 'object' ? (l.source as GraphNode).id : (l.source as string);
      const tId = typeof l.target === 'object' ? (l.target as GraphNode).id : (l.target as string);
      return activeNodeIds.has(sId) && activeNodeIds.has(tId);
    });

    // Compute degree count
    const degreeMap = new Map<string, number>();
    activeLinks.forEach((l) => {
      const sId = typeof l.source === 'object' ? (l.source as GraphNode).id : (l.source as string);
      const tId = typeof l.target === 'object' ? (l.target as GraphNode).id : (l.target as string);
      degreeMap.set(sId, (degreeMap.get(sId) || 0) + 1);
      degreeMap.set(tId, (degreeMap.get(tId) || 0) + 1);
    });

    activeNodes.forEach((n) => {
      n.connectedCount = degreeMap.get(n.id) || 0;
    });

    return { nodes: activeNodes, links: activeLinks };
  }, [intelItems, selectedTypes, minRiskScore, searchQuery]);

  // Color & styling configuration for node types in white/light blue palette
  const getNodeColor = (type: NodeType) => {
    switch (type) {
      case 'THREAT_ACTOR':
        return '#0284c7'; // text-sky-600
      case 'IP':
        return '#0ea5e9'; // text-sky-500
      case 'DOMAIN':
        return '#38bdf8'; // text-sky-400
      case 'CVE':
        return '#0369a1'; // text-sky-700
      case 'SECTOR':
        return '#075985'; // text-sky-800
      case 'INCIDENT':
        return '#2563eb'; // blue-600
      default:
        return '#0284c7';
    }
  };

  const getNodeRadius = (node: GraphNode) => {
    switch (node.type) {
      case 'THREAT_ACTOR':
        return 22;
      case 'SECTOR':
        return 20;
      case 'CVE':
        return 17;
      case 'INCIDENT':
        return 16;
      case 'IP':
        return 14;
      case 'DOMAIN':
        return 13;
      default:
        return 14;
    }
  };

  // Connected nodes map for highlighting
  const connectedNodeIds = useMemo(() => {
    const target = hoveredNode || selectedNode;
    if (!target) return null;

    const set = new Set<string>();
    set.add(target.id);

    links.forEach((l) => {
      const sId = typeof l.source === 'object' ? (l.source as GraphNode).id : (l.source as string);
      const tId = typeof l.target === 'object' ? (l.target as GraphNode).id : (l.target as string);
      if (sId === target.id) set.add(tId);
      if (tId === target.id) set.add(sId);
    });

    return set;
  }, [hoveredNode, selectedNode, links]);

  // D3 Force Simulation Setup
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth || 900;
    const height = svgRef.current.clientHeight || 640;

    // Clear previous elements
    svg.selectAll('*').remove();

    // Definitions (Arrowheads and markers)
    const defs = svg.append('defs');

    defs
      .append('marker')
      .attr('id', 'arrow-default')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#93c5fd'); // sky-300

    defs
      .append('marker')
      .attr('id', 'arrow-highlight')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#0284c7'); // sky-600

    // Zoom container
    const g = svg.append('g').attr('class', 'zoom-layer');
    zoomGRef.current = g.node();

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Background click clears selection
    svg.on('click', (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target && target.tagName && target.tagName.toLowerCase() === 'svg') {
        setSelectedNode(null);
      }
    });

    // Clone data for D3 mutation
    const simulationNodes: GraphNode[] = nodes.map((d) => ({ ...d }));
    const simulationLinks: GraphLink[] = links.map((d) => ({ ...d }));

    // Create simulation
    const simulation = d3
      .forceSimulation<GraphNode>(simulationNodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(simulationLinks)
          .id((d) => d.id)
          .distance(linkDistance)
      )
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide<GraphNode>().radius((d) => getNodeRadius(d) + 12)
      );

    // Draw links
    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(simulationLinks)
      .enter()
      .append('line')
      .attr('stroke', '#bae6fd') // sky-200
      .attr('stroke-width', (d) => Math.max(1.5, (d.confidence / 100) * 3))
      .attr('stroke-opacity', 0.8)
      .attr('marker-end', 'url(#arrow-default)');

    // Link relationship text label
    const linkText = g
      .append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(simulationLinks)
      .enter()
      .append('text')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .attr('fill', '#0284c7')
      .attr('text-anchor', 'middle')
      .attr('dy', -3)
      .text((d) => d.relationship);

    // Node drag handlers
    const drag = (sim: d3.Simulation<GraphNode, undefined>) => {
      const dragstarted = (event: any, d: GraphNode) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      };

      const dragged = (event: any, d: GraphNode) => {
        d.fx = event.x;
        d.fy = event.y;
      };

      const dragended = (event: any, d: GraphNode) => {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      };

      return d3.drag<SVGGElement, GraphNode>().on('start', dragstarted).on('drag', dragged).on('end', dragended);
    };

    // Draw nodes
    const node = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(simulationNodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .call(drag(simulation as any));

    // Outer pulse ring for high risk
    node
      .filter((d) => d.riskScore >= 95)
      .append('circle')
      .attr('r', (d) => getNodeRadius(d) + 5)
      .attr('fill', 'none')
      .attr('stroke', '#7dd3fc') // sky-300
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 3')
      .attr('opacity', 0.8);

    // Main Node Circle
    node
      .append('circle')
      .attr('r', (d) => getNodeRadius(d))
      .attr('fill', '#ffffff')
      .attr('stroke', (d) => getNodeColor(d.type))
      .attr('stroke-width', 3)
      .attr('class', 'transition-all duration-200');

    // Inner icon / initials
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', (d) => (d.type === 'THREAT_ACTOR' ? '10px' : '9px'))
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .attr('fill', (d) => getNodeColor(d.type))
      .text((d) => {
        if (d.type === 'THREAT_ACTOR') return 'APT';
        if (d.type === 'IP') return 'IP';
        if (d.type === 'DOMAIN') return 'DOM';
        if (d.type === 'CVE') return 'CVE';
        if (d.type === 'SECTOR') return 'SEC';
        return 'INC';
      });

    // Node text labels
    if (showLabels) {
      node
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', (d) => getNodeRadius(d) + 14)
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', '600')
        .attr('fill', '#0369a1') // sky-700
        .text((d) => (d.name.length > 20 ? d.name.slice(0, 18) + '...' : d.name));
    }

    // Interactivity: Hover & Click
    node
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      });

    // Ticking function
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkText
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, chargeStrength, linkDistance, showLabels]);

  // Apply visual highlights based on connectedNodeIds
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    if (!connectedNodeIds) {
      // Normal state
      svg.selectAll('.nodes g').style('opacity', 1);
      svg.selectAll('.links line').attr('stroke', '#bae6fd').attr('stroke-width', 2).attr('marker-end', 'url(#arrow-default)');
      svg.selectAll('.link-labels text').style('opacity', 0.9);
      return;
    }

    // Dim unrelated nodes and highlight active subnetwork
    svg.selectAll('.nodes g').style('opacity', (d: any) => (connectedNodeIds.has(d.id) ? 1 : 0.15));

    svg
      .selectAll('.links line')
      .attr('stroke', (d: any) => {
        const sId = typeof d.source === 'object' ? d.source.id : d.source;
        const tId = typeof d.target === 'object' ? d.target.id : d.target;
        return connectedNodeIds.has(sId) && connectedNodeIds.has(tId) ? '#0284c7' : '#e0f2fe';
      })
      .attr('stroke-width', (d: any) => {
        const sId = typeof d.source === 'object' ? d.source.id : d.source;
        const tId = typeof d.target === 'object' ? d.target.id : d.target;
        return connectedNodeIds.has(sId) && connectedNodeIds.has(tId) ? 3.5 : 1;
      })
      .attr('marker-end', (d: any) => {
        const sId = typeof d.source === 'object' ? d.source.id : d.source;
        const tId = typeof d.target === 'object' ? d.target.id : d.target;
        return connectedNodeIds.has(sId) && connectedNodeIds.has(tId) ? 'url(#arrow-highlight)' : 'url(#arrow-default)';
      });

    svg.selectAll('.link-labels text').style('opacity', (d: any) => {
      const sId = typeof d.source === 'object' ? d.source.id : d.source;
      const tId = typeof d.target === 'object' ? d.target.id : d.target;
      return connectedNodeIds.has(sId) && connectedNodeIds.has(tId) ? 1 : 0.1;
    });
  }, [connectedNodeIds]);

  // Zoom controls
  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(500).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  // Find all direct relations for the selected node
  const directRelationships = useMemo(() => {
    if (!selectedNode) return [];
    return links
      .filter((l) => {
        const sId = typeof l.source === 'object' ? (l.source as GraphNode).id : (l.source as string);
        const tId = typeof l.target === 'object' ? (l.target as GraphNode).id : (l.target as string);
        return sId === selectedNode.id || tId === selectedNode.id;
      })
      .map((l) => {
        const sId = typeof l.source === 'object' ? (l.source as GraphNode).id : (l.source as string);
        const tId = typeof l.target === 'object' ? (l.target as GraphNode).id : (l.target as string);
        const isSource = sId === selectedNode.id;
        const otherId = isSource ? tId : sId;
        const otherNode = nodes.find((n) => n.id === otherId);
        return {
          otherNode,
          relationship: l.relationship,
          direction: isSource ? 'OUTGOING' : 'INCOMING',
          confidence: l.confidence,
        };
      });
  }, [selectedNode, links, nodes]);

  const toggleTypeFilter = (type: NodeType) => {
    setSelectedTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  return (
    <div className="space-y-6 bg-white text-sky-600">
      {/* Header Info */}
      <div className="bg-white border border-sky-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-sky-500" />
              <h1 className="text-base font-bold text-sky-700 font-mono tracking-tight">
                PENDARIEL INTERACTIVE KNOWLEDGE GRAPH
              </h1>
              <span className="text-xs text-sky-400 font-mono">
                // D3 FORCE-DIRECTED THREAT TOPOLOGY
              </span>
            </div>
            <p className="text-xs text-sky-500 mt-1">
              Visualizes associative threat clusters mapping relationships between state-sponsored actors, C2 IP relays, hijacked domains, CVE vulnerabilities, and victim infrastructure.
            </p>
          </div>

          {/* Quick Statistics Bar */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-lg text-sky-700 shadow-xs">
              <span className="font-bold text-sky-800">{nodes.length}</span> Active Entities
            </div>
            <div className="px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-lg text-sky-700 shadow-xs">
              <span className="font-bold text-sky-800">{links.length}</span> Inferred Links
            </div>
          </div>
        </div>

        {/* Filters and Controls Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-4 pt-4 border-t border-sky-100 text-xs font-mono">
          {/* Entity Type Toggle Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sky-700 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-sky-500" />
              <span>ENTITIES:</span>
            </span>
            {(
              [
                { type: 'THREAT_ACTOR', label: 'Threat Actors', color: 'border-sky-400 text-sky-700' },
                { type: 'IP', label: 'IPs', color: 'border-sky-400 text-sky-700' },
                { type: 'DOMAIN', label: 'Domains', color: 'border-sky-400 text-sky-700' },
                { type: 'CVE', label: 'CVEs', color: 'border-sky-400 text-sky-700' },
                { type: 'SECTOR', label: 'Sectors', color: 'border-sky-400 text-sky-700' },
                { type: 'INCIDENT', label: 'Incidents', color: 'border-sky-400 text-sky-700' },
              ] as const
            ).map((item) => (
              <button
                key={item.type}
                onClick={() => toggleTypeFilter(item.type)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer ${
                  selectedTypes[item.type]
                    ? 'bg-sky-500 text-white border-sky-600 font-bold shadow-xs'
                    : 'bg-white text-sky-400 border-sky-200 hover:bg-sky-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Search Entity Input */}
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-sky-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actors, IPs, domains, CVEs..."
              className="w-full bg-white border border-sky-200 rounded-lg py-1.5 pl-8 pr-3 text-xs text-sky-800 placeholder-sky-300 focus:outline-none focus:border-sky-400 font-mono shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Main Visualizer Container & Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* D3 SVG Canvas (8 or 9 Cols) */}
        <div className={`${selectedNode ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all duration-300 bg-white border border-sky-200 rounded-xl shadow-xs relative overflow-hidden flex flex-col`}>
          {/* Canvas Floating Controls */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-xs p-1.5 rounded-lg border border-sky-200 shadow-xs font-mono text-xs">
            <button
              onClick={() => handleZoom(1.3)}
              className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(0.7)}
              className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded transition-colors cursor-pointer"
              title="Reset Viewport"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <span className="text-sky-300">|</span>

            <label className="flex items-center gap-1.5 text-[11px] text-sky-700 cursor-pointer px-1">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="accent-sky-500"
              />
              <span>Labels</span>
            </label>
          </div>

          {/* Physics adjustment popover trigger */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-sky-200 shadow-xs font-mono text-[11px] text-sky-700">
            <span className="font-semibold">Distance:</span>
            <input
              type="range"
              min="50"
              max="200"
              value={linkDistance}
              onChange={(e) => setLinkDistance(Number(e.target.value))}
              className="w-20 accent-sky-500 cursor-pointer"
            />
            <span className="font-semibold ml-2">Repulsion:</span>
            <input
              type="range"
              min="-500"
              max="-100"
              value={chargeStrength}
              onChange={(e) => setChargeStrength(Number(e.target.value))}
              className="w-20 accent-sky-500 cursor-pointer"
            />
          </div>

          {/* D3 Graph SVG */}
          <div className="w-full h-[620px] bg-white cursor-grab active:cursor-grabbing">
            <svg ref={svgRef} className="w-full h-full" />
          </div>

          {/* Legend Footer */}
          <div className="p-3 border-t border-sky-100 bg-sky-50/40 flex flex-wrap items-center justify-between text-[11px] font-mono text-sky-600">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-white border-2 border-sky-600" />
                <span className="font-semibold text-sky-800">Threat Actor</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-white border-2 border-sky-500" />
                <span className="font-semibold text-sky-700">IP Node</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-white border-2 border-sky-400" />
                <span className="font-semibold text-sky-600">Domain</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-white border-2 border-sky-700" />
                <span className="font-semibold text-sky-800">CVE</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-white border-2 border-sky-800" />
                <span className="font-semibold text-sky-900">Target Sector</span>
              </span>
            </div>
            <div className="text-sky-400">
              Drag nodes to rearrange · Click to inspect correlation
            </div>
          </div>
        </div>

        {/* Entity Inspector Side Panel (4 Cols when open) */}
        {selectedNode && (
          <div className="lg:col-span-4 bg-white border border-sky-200 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between max-h-[680px] overflow-y-auto">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-sky-100">
                <div>
                  <div className="text-[10px] font-mono px-2 py-0.5 rounded border border-sky-200 text-sky-700 bg-sky-50 font-bold inline-block">
                    {selectedNode.type}
                  </div>
                  <h3 className="text-base font-bold text-sky-800 mt-1.5 break-words">
                    {selectedNode.name}
                  </h3>
                  {selectedNode.origin && (
                    <div className="text-xs font-mono text-sky-500 mt-0.5">
                      Origin: {selectedNode.origin}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-sky-400 hover:text-sky-600 font-mono text-lg cursor-pointer px-1"
                >
                  ✕
                </button>
              </div>

              {/* Threat Score & Connectivity Scorecard */}
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 bg-sky-50/50 rounded-lg border border-sky-100">
                  <span className="text-sky-400 block text-[10px] font-bold">THREAT SCORE</span>
                  <span className="text-xl font-bold text-sky-700">
                    {selectedNode.riskScore}
                    <span className="text-xs text-sky-400">/100</span>
                  </span>
                </div>
                <div className="p-3 bg-sky-50/50 rounded-lg border border-sky-100">
                  <span className="text-sky-400 block text-[10px] font-bold">GRAPH DEGREE</span>
                  <span className="text-xl font-bold text-sky-700">
                    {directRelationships.length}
                    <span className="text-xs text-sky-400"> links</span>
                  </span>
                </div>
              </div>

              {/* Intelligence Summary */}
              <div>
                <span className="text-xs font-mono font-bold text-sky-700 block mb-1">
                  TACTICAL INTELLIGENCE
                </span>
                <p className="text-xs text-sky-700 leading-relaxed bg-sky-50/40 p-3 rounded-lg border border-sky-100 font-mono">
                  {selectedNode.details}
                </p>
              </div>

              {/* Associated Direct Relationships */}
              <div>
                <span className="text-xs font-mono font-bold text-sky-700 block mb-2">
                  DIRECT TOPOLOGICAL LINKS ({directRelationships.length})
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {directRelationships.map((rel, idx) => (
                    <div
                      key={idx}
                      onClick={() => rel.otherNode && setSelectedNode(rel.otherNode)}
                      className="p-2.5 bg-sky-50/50 hover:bg-sky-100/70 border border-sky-100 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[10px] text-sky-500 mb-0.5">
                        <span className="font-bold text-sky-600">{rel.relationship}</span>
                        <span>{rel.confidence}% Confidence</span>
                      </div>
                      <div className="font-semibold text-sky-800 line-clamp-1">
                        {rel.otherNode?.name}
                      </div>
                      <div className="text-[10px] text-sky-400 mt-0.5">
                        Type: {rel.otherNode?.type}
                      </div>
                    </div>
                  ))}
                  {directRelationships.length === 0 && (
                    <div className="text-center py-6 text-sky-400 font-mono text-xs">
                      No direct relationships filtered.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-sky-100 flex justify-between items-center text-xs font-mono">
              <span className="text-sky-400 text-[10px]">CORRELATION: PROVEN</span>
              <button
                onClick={() => setSelectedNode(null)}
                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-lg text-xs font-mono transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
