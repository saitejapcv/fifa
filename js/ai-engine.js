(() => {
  'use strict';

  const clamp = (value, min, max) => Math.min(Math.max(Number(value) || 0, min), max);
  const round = (value, places = 1) => Number.parseFloat((Number(value) || 0).toFixed(places));
  const safeText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

  const severityFromDensity = (density) => {
    if (density > 6) return 'Red';
    if (density > 4) return 'Amber';
    return 'Green';
  };

  const confidenceFromSpread = (spread, base = 0.82) => clamp(base + spread / 100, 0.6, 0.98);

  const getIncidentWeight = (type) => {
    const normalized = safeText(type).toLowerCase();
    if (normalized.includes('medical')) return 3;
    if (normalized.includes('security')) return 3;
    if (normalized.includes('fire')) return 4;
    if (normalized.includes('spill')) return 1;
    if (normalized.includes('lost')) return 1;
    return 2;
  };

  const findLowestWaitAlternative = (queue, allQueues = []) => {
    const sameType = allQueues
      .filter((candidate) => candidate.type === queue.type && candidate.id !== queue.id)
      .sort((a, b) => a.waitMinutes - b.waitMinutes);
    return sameType[0] || null;
  };

  const createResponse = (summary, cards = [], actions = []) => ({
    source: 'local-ai-engine',
    summary,
    cards,
    actions,
    generatedAt: new Date().toISOString()
  });

  const StadiumAI = {
    analyzeCrowdDensity(sectors = []) {
      const analyzed = sectors.map((sector) => {
        const density = round(sector.density);
        const trend = Number(sector.trend ?? 0);
        const predictedDensity = round(clamp(density + trend * 0.8, 0, 9));
        const severity = severityFromDensity(density);
        const predictedSeverity = severityFromDensity(predictedDensity);
        const recommendation = severity === 'Red'
          ? `Stop inflow to ${sector.name} and divert fans to adjacent low-density sectors.`
          : severity === 'Amber'
            ? `Meter arrivals into ${sector.name} and open relief routes before density exceeds 6 persons/m2.`
            : `Keep ${sector.name} under observation; no diversion required.`;

        return {
          id: sector.id,
          name: sector.name,
          density,
          trend,
          predictedDensity,
          severity,
          predictedSeverity,
          recommendation,
          confidence: round(confidenceFromSpread(Math.abs(trend) * 10), 2)
        };
      });

      const alerts = analyzed.filter((sector) => sector.severity !== 'Green');
      const highest = analyzed.reduce((max, sector) => sector.density > max.density ? sector : max, analyzed[0] || {});
      const lowCapacity = analyzed
        .filter((sector) => sector.density < 3)
        .map((sector) => sector.name)
        .slice(0, 3);

      return {
        status: alerts.some((sector) => sector.severity === 'Red') ? 'Red' : alerts.length ? 'Amber' : 'Green',
        alerts,
        sectors: analyzed,
        predictedPeak: highest.name ? `${highest.name} at ${round((highest.predictedDensity || highest.density), 1)} persons/m2` : 'No sector data',
        recommendations: alerts.length
          ? alerts.map((sector) => sector.recommendation)
          : [`Use ${lowCapacity.join(', ') || 'low-density sectors'} for future arrivals.`],
        rebalancing: lowCapacity.length
          ? `Move overflow toward ${lowCapacity.join(', ')}.`
          : 'No low-density relief sector is currently available.'
      };
    },

    optimizeGateFlow(gates = []) {
      const sortedByWait = [...gates].sort((a, b) => b.waitMinutes - a.waitMinutes);
      const overloaded = sortedByWait.filter((gate) => gate.waitMinutes >= 10 || gate.throughputPerMin < gate.targetThroughputPerMin * 0.8);
      const relief = [...gates]
        .filter((gate) => gate.waitMinutes <= 7 && gate.throughputPerMin >= gate.targetThroughputPerMin * 0.9)
        .sort((a, b) => a.waitMinutes - b.waitMinutes);

      const commands = overloaded.map((gate, index) => {
        const target = relief[index % Math.max(relief.length, 1)] || gates.find((candidate) => candidate.id !== gate.id) || gate;
        const waitGap = Math.max(0, gate.waitMinutes - target.waitMinutes);
        const redirectPercent = clamp(Math.round(waitGap * 4 + 10), 15, 40);
        return {
          sourceGate: gate.name,
          targetGate: target.name,
          command: `Redirect ${redirectPercent}% of ${gate.name} traffic to ${target.name}.`,
          reason: `${gate.name} wait is ${gate.waitMinutes} min; ${target.name} wait is ${target.waitMinutes} min.`,
          confidence: round(confidenceFromSpread(waitGap * 2), 2)
        };
      });

      return {
        status: commands.length ? 'Amber' : 'Green',
        commands,
        gates: gates.map((gate) => ({
          ...gate,
          utilization: round((gate.throughputPerMin / Math.max(gate.targetThroughputPerMin, 1)) * 100)
        })),
        summary: commands.length ? commands[0].command : 'All gates are within target flow thresholds.'
      };
    },

    triageIncident(incident = {}) {
      const density = Number(incident.crowdDensity ?? incident.density ?? 0);
      const minutesToKickoff = Number(incident.minutesToKickoff ?? 90);
      const weight = getIncidentWeight(incident.type);
      let score = weight;

      if (density > 6) score += 3;
      else if (density > 4) score += 2;

      if (minutesToKickoff <= 20) score += 2;
      else if (minutesToKickoff <= 45) score += 1;

      if (incident.blockingExit || incident.securitySensitive) score += 2;

      const severity = score >= 7 ? 'Red' : score >= 4 ? 'Amber' : 'Green';
      const action = severity === 'Red'
        ? 'Dispatch security/medical lead immediately, pause inflow to the zone, and notify command center.'
        : severity === 'Amber'
          ? 'Assign nearby supervisor, send response team, and monitor density every 60 seconds.'
          : 'Dispatch nearest volunteer and keep incident visible in the command queue.';

      return {
        id: incident.id || `INC-${Date.now()}`,
        type: safeText(incident.type || 'Operational issue'),
        location: safeText(incident.location || 'Unknown location'),
        severity,
        score,
        action,
        slaMinutes: severity === 'Red' ? 2 : severity === 'Amber' ? 6 : 12,
        requiredTeams: severity === 'Red' ? ['Security', 'Medical', 'Zone supervisor'] : severity === 'Amber' ? ['Zone supervisor', 'Guest services'] : ['Volunteer'],
        confidence: round(clamp(0.68 + score / 20, 0.68, 0.97), 2)
      };
    },

    predictQueueWait(queue = {}, allQueues = []) {
      const currentWait = Number(queue.waitMinutes ?? 0);
      const arrivalPressure = Number(queue.arrivalRate ?? 0) - Number(queue.serviceRate ?? 0);
      const predictedWait = round(clamp(currentWait + arrivalPressure * 1.8 + Number(queue.trend ?? 0), 0, 45));
      const alternative = findLowestWaitAlternative(queue, allQueues);
      const severity = predictedWait >= 13 ? 'Red' : predictedWait >= 8 ? 'Amber' : 'Green';

      return {
        id: queue.id,
        name: queue.name,
        type: queue.type,
        currentWait,
        predictedWait,
        severity,
        recommendation: alternative && alternative.waitMinutes + 3 < predictedWait
          ? `Route fans to ${alternative.name}; expected wait is ${alternative.waitMinutes} min.`
          : `Keep ${queue.name} active; wait is within its peer range.`,
        alternative,
        confidence: round(clamp(0.7 + Math.abs(arrivalPressure) / 30, 0.7, 0.94), 2)
      };
    },

    recommendStaffDeployment(densityMap = [], incidents = []) {
      const densityNeeds = densityMap
        .filter((sector) => sector.density > 4)
        .map((sector) => ({
          location: sector.name,
          priority: sector.density > 6 ? 'Red' : 'Amber',
          staffNeeded: sector.density > 6 ? 8 : 4,
          reason: `${sector.density} persons/m2 density`,
          action: sector.density > 6 ? 'Move stewards to inflow points and hold arrivals.' : 'Add wayfinding volunteers and open relief route.'
        }));

      const incidentNeeds = incidents
        .filter((incident) => incident.status !== 'resolved')
        .map((incident) => {
          const triage = this.triageIncident(incident);
          return {
            location: triage.location,
            priority: triage.severity,
            staffNeeded: triage.severity === 'Red' ? 6 : triage.severity === 'Amber' ? 3 : 1,
            reason: `${triage.type} incident`,
            action: triage.action
          };
        });

      const recommendations = [...incidentNeeds, ...densityNeeds].sort((a, b) => {
        const order = { Red: 3, Amber: 2, Green: 1 };
        return order[b.priority] - order[a.priority] || b.staffNeeded - a.staffNeeded;
      });

      return {
        totalStaffRecommended: recommendations.reduce((sum, item) => sum + item.staffNeeded, 0),
        recommendations,
        summary: recommendations[0]
          ? `Prioritize ${recommendations[0].location}: ${recommendations[0].action}`
          : 'Current staff deployment can remain unchanged.'
      };
    },

    calculateSustainabilityScore(metrics = {}) {
      const fans = Math.max(Number(metrics.fans ?? 1), 1);
      const carbonIntensity = round(Number(metrics.transportKgCO2e ?? 0) / fans, 2);
      const energyEfficiency = round(clamp((Number(metrics.renewableEnergyPct ?? 0) * 0.7) + (100 - Number(metrics.gridLoadPct ?? 0)) * 0.3, 0, 100));
      const waterSavings = round(clamp(Number(metrics.waterSavedLiters ?? 0) / fans, 0, 10), 2);
      const wasteDiversion = clamp(Number(metrics.wasteDiversionPct ?? 0), 0, 100);
      const score = round(clamp((100 - carbonIntensity * 12) * 0.35 + energyEfficiency * 0.25 + wasteDiversion * 0.25 + waterSavings * 10 * 0.15, 0, 100));

      return {
        score,
        carbonIntensity,
        energyEfficiency,
        waterSavings,
        wasteDiversion: round(wasteDiversion),
        recommendation: score >= 80
          ? 'Maintain current transit and waste-diversion tactics.'
          : 'Increase transit nudges, open water refill points, and route staff to recycling hot spots.'
      };
    },

    planEvacuationRoute(crowdState = {}, blockedExits = []) {
      const exits = crowdState.exits || [
        { id: 'north', name: 'North Exit', x: 260, y: 28, congestion: 2.8 },
        { id: 'east', name: 'East Exit', x: 492, y: 180, congestion: 3.1 },
        { id: 'south', name: 'South Exit', x: 260, y: 332, congestion: 3.9 },
        { id: 'west', name: 'West Exit', x: 28, y: 180, congestion: 2.4 }
      ];
      const blocked = new Set(blockedExits);
      const safeExits = exits.filter((exit) => !blocked.has(exit.id)).sort((a, b) => a.congestion - b.congestion);
      const selected = safeExits[0] || exits[0];
      const start = crowdState.start || { x: 260, y: 180 };
      const mid = { x: Math.round((start.x + selected.x) / 2), y: start.y };
      const coordinates = [start, mid, { x: selected.x, y: selected.y }];

      return {
        exit: selected,
        blockedExits: [...blocked],
        coordinates,
        instructions: [
          'Hold new arrivals at the nearest gate.',
          `Direct fans toward ${selected.name}.`,
          'Keep emergency lane clear for medical and security teams.',
          'Send multilingual app and PA guidance every 60 seconds until density normalizes.'
        ],
        confidence: round(clamp(0.78 + (4 - selected.congestion) / 10, 0.72, 0.95), 2)
      };
    },

    matchFallbackResponse(query = '', context = {}) {
      const normalized = safeText(query).toLowerCase();
      const venue = context.venueName || 'the selected venue';
      const role = context.role || 'fan';
      const sectors = context.sectors || [];
      const queues = context.queues || [];
      const gates = context.gates || [];
      const incidents = context.incidents || [];

      if (/seat|section|route|wayfind|navigate|map/.test(normalized)) {
        return createResponse(`Best route at ${venue}: enter through the lowest-delay gate, follow the highlighted concourse, and avoid red-density sectors.`, [
          {
            title: 'Navigation steps',
            rows: [
              ['1', 'Confirm your ticket section and nearest gate.'],
              ['2', `Avoid ${sectors.filter((sector) => sector.density > 4).map((sector) => sector.name).join(', ') || 'no current congestion zones'}.`],
              ['3', 'Follow accessible elevators if step-free mode is enabled.']
            ]
          }
        ], ['Open Stadium Map', 'Plan accessible route']);
      }

      if (/restroom|bathroom|toilet|concession|food|drink|water|queue/.test(normalized)) {
        const ranked = [...queues].sort((a, b) => a.waitMinutes - b.waitMinutes).slice(0, 3);
        return createResponse('Lowest-wait services right now are shown below.', [
          {
            title: 'Service options',
            rows: ranked.map((queue) => [queue.name, `${queue.waitMinutes} min`, queue.type])
          }
        ], ['Predict waits', 'Nearest restroom']);
      }

      if (/incident|spill|medical|security|report|help/.test(normalized)) {
        const topIncident = incidents.find((incident) => incident.status !== 'resolved');
        return createResponse(topIncident
          ? `Active incident near ${topIncident.location}. Command recommendation: ${this.triageIncident(topIncident).action}`
          : 'No unresolved incident is currently blocking your route. Use the report incident action if conditions changed.', [
            {
              title: 'Incident response',
              rows: [
                ['Role', role],
                ['Venue', venue],
                ['Next step', topIncident ? 'Follow staff routing and avoid the affected block.' : 'Share location, category, and urgency.']
              ]
            }
          ], ['Report incident', 'Open Incidents']);
      }

      if (/gate|entry|line|ticket/.test(normalized)) {
        const plan = this.optimizeGateFlow(gates);
        return createResponse(plan.summary, [
          {
            title: 'Gate optimizer',
            rows: plan.commands.length
              ? plan.commands.map((command) => [command.sourceGate, command.targetGate, command.command])
              : [['Status', 'All gates', 'Within target thresholds']]
          }
        ], ['Optimize gates', 'Show tickets help']);
      }

      if (/transit|train|bus|ride|parking|airport/.test(normalized)) {
        return createResponse(`Transit guidance for ${venue}: use official shuttles and check post-match dispersal alerts before leaving your seat.`, [
          {
            title: 'Transit checklist',
            rows: [
              ['Before kickoff', 'Arrive early and use assigned gate.'],
              ['After match', 'Wait for dispersal alert if station platforms are amber/red.'],
              ['Accessibility', 'Use staffed elevators and shuttle boarding zones.']
            ]
          }
        ], ['Open Transit', 'Send transit alert']);
      }

      return createResponse(`I can help with ${venue} routing, gates, queues, incidents, accessibility, transit, and sustainability.`, [
        {
          title: 'Try asking',
          rows: [
            ['Navigation', 'Find my seat from Gate C'],
            ['Services', 'Nearest restroom with short wait'],
            ['Operations', 'Classify the active medical incident']
          ]
        }
      ], ['Find seat', 'Nearest restroom', 'Report incident']);
    }
  };

  window.StadiumAI = StadiumAI;
})();
