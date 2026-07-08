/**
 * FIFA 2026 Smart Stadium - Application Bootstrapper & Coordinator
 * Integrates the Simulator, Map, Dashboard State, and Event handlers.
 */

(() => {
  'use strict';

  class AppCoordinator {
    constructor() {
      this.simulator = null;
      this.map = null;
    }

    init() {
      console.log('AppCoordinator: Bootstrapping modules...');

      // 1. Initialize Simulator
      this.simulator = new StadiumSimulator({ interval: 5000 });

      // 2. Initialize Interactive SVG Map
      this.map = new StadiumMap('stadium-map-container');

      // 3. Connect Simulator Events
      this.simulator.subscribe((event) => this.handleSimulatorEvent(event));

      // 4. Start Simulator
      this.simulator.start();

      // 5. Setup extra simulation overrides on window object
      window.mutateSimulation = (mode) => this.handleMutationOverride(mode);

      console.log('AppCoordinator: Bootstrapped successfully.');
    }

    handleSimulatorEvent(event) {
      if (!window.StadiumApp) return;

      const state = window.StadiumApp.state;

      switch (event.type) {
        case 'tick':
          this.handleTick(event.sectorData, state);
          break;

        case 'incident':
          this.handleIncident(event.incident, state);
          break;

        case 'weather-update':
          this.handleWeather(event.weather, state);
          break;
      }
    }

    handleTick(sectorMapData, state) {
      // 1. Map simulator sector IDs to dashboard state sectors
      // Simulator IDs are 'sector-101' to 'sector-212'.
      // Dashboard has 5 macro-sectors: north, east, south, west, field.
      // We aggregate simulator sub-sectors into these macro-sectors for the KPIs.
      
      const aggregation = {
        north: { count: 0, sum: 0 },
        east: { count: 0, sum: 0 },
        south: { count: 0, sum: 0 },
        west: { count: 0, sum: 0 },
        field: { count: 0, sum: 0 }
      };

      Object.entries(sectorMapData).forEach(([id, data]) => {
        const num = parseInt(id.replace('sector-', '')) || 0;
        
        // Map sectors to macro regions
        let region = 'field';
        if (num >= 101 && num <= 103) region = 'north';
        else if (num >= 104 && num <= 106) region = 'east';
        else if (num >= 107 && num <= 109) region = 'south';
        else if (num >= 110 && num <= 112) region = 'west';
        else if (num >= 201 && num <= 203) region = 'north';
        else if (num >= 204 && num <= 206) region = 'east';
        else if (num >= 207 && num <= 209) region = 'south';
        else if (num >= 210 && num <= 212) region = 'west';

        aggregation[region].count++;
        aggregation[region].sum += data.density;

        // 2. Update interactive map instance sector data
        if (this.map) {
          this.map.setSectorDensity(id, data.density, data.occupied || 1200, data.capacity || 5000);
        }
      });

      // Update dashboard macro-sectors
      state.sectors = state.sectors.map((sector) => {
        const agg = aggregation[sector.id];
        if (agg && agg.count > 0) {
          const avgDensity = Number((agg.sum / agg.count).toFixed(1));
          return { ...sector, density: avgDensity };
        }
        return sector;
      });

      // Update match clock/minutes
      state.matchMinute = Math.min(120, state.matchMinute + 1);
      const minutesToKickoff = Math.max(0, 75 - state.matchMinute);
      state.matchState = minutesToKickoff ? `T-${minutesToKickoff} pre-match` : `Match ${state.matchMinute - 75}'`;
      
      const clock = document.getElementById('match-clock');
      if (clock) clock.textContent = state.matchState;

      // Refresh map element and rerender dashboard
      if (this.map) this.map.refresh();
      window.StadiumApp.renderAll();
    }

    handleIncident(incident, state) {
      // 1. Triage new incident via AI engine
      const triaged = window.StadiumAI.triageIncident(incident);
      
      const newIncident = {
        id: incident.id,
        type: incident.type,
        location: incident.location,
        crowdDensity: incident.crowdDensity || 4.2,
        minutesToKickoff: 75 - state.matchMinute,
        status: 'open',
        createdAt: Date.now()
      };

      // 2. Add to dashboard state
      state.incidents.unshift(newIncident);

      // 3. Add to map UI
      if (this.map) {
        // Map incident coordinate generation (center points of sectors)
        const x = 150 + Math.random() * 500;
        const y = 100 + Math.random() * 400;
        this.map.addIncident(incident.id, x, y, incident.type, triaged.severity);
      }

      // 4. Trigger alert toast
      window.StadiumApp.toast(
        `🚨 AI Incident Alert: ${incident.type}`,
        `Location: ${incident.location}. Action: ${triaged.action}`,
        triaged.severity === 'Red' ? 'danger' : triaged.severity === 'Amber' ? 'warning' : 'info'
      );

      window.StadiumApp.renderAll();
    }

    handleWeather(weather, state) {
      state.sustainability.gridLoadPct = Math.max(30, Math.min(95, state.sustainability.gridLoadPct + (weather.condition === 'sunny' ? 3 : -2)));
      window.StadiumApp.renderAll();
    }

    handleMutationOverride(mode) {
      if (!window.StadiumApp) return;
      const state = window.StadiumApp.state;

      if (mode === 'surge') {
        // Trigger surge in simulator and state
        state.sectors = state.sectors.map((sector) => 
          sector.id === 'east' || sector.id === 'south'
            ? { ...sector, density: Number((sector.density + 0.8).toFixed(1)), trend: sector.trend + 0.2 }
            : sector
        );
        
        // Also update sub-sectors on the SVG map directly
        if (this.map) {
          for (let i = 104; i <= 109; i++) {
            this.map.setSectorDensity(`sector-${i}`, 85, 4200, 5000);
          }
          for (let i = 204; i <= 209; i++) {
            this.map.setSectorDensity(`sector-${i}`, 88, 4400, 5000);
          }
          this.map.refresh();
        }

        window.StadiumApp.toast('Crowd surge simulated', 'East and south sectors are now under higher density.', 'warning');
      } else if (mode === 'gate') {
        state.gates = state.gates.map((gate) => gate.id === 'A'
          ? { ...gate, waitMinutes: gate.waitMinutes + 5, throughputPerMin: Math.max(40, gate.throughputPerMin - 25) }
          : gate
        );
        window.StadiumApp.toast('Gate delay simulated', 'Gate A throughput dropped and optimizer data changed.', 'warning');
      } else if (mode === 'clear') {
        Object.assign(state, structuredClone(window.StadiumApp.initialState), { role: state.role, venueId: state.venueId });
        if (this.map) {
          this.map.incidents.clear();
          this.map.refresh();
        }
        window.StadiumApp.toast('Simulation reset', 'Crowd, gate, queue, and incident data returned to baseline.', 'success');
      }

      window.StadiumApp.renderAll();
    }
  }

  // Instantiate Coordinator on load
  document.addEventListener('DOMContentLoaded', () => {
    window.appCoordinator = new AppCoordinator();
    // Wait a tiny fraction of a second to let dashboard.js bind its DOMContentLoaded events first
    setTimeout(() => window.appCoordinator.init(), 50);
  });
})();
