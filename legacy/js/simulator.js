/**
 * FIFA 2026 Smart Stadium - Live Simulator
 * Handles fan flow curves, incident dispatching, and weather context
 */

class StadiumSimulator {
  constructor(options = {}) {
    this.interval = options.interval || 5000; // 5 second updates
    this.matchPhase = 'pre-match'; // pre-match, first-half, halftime, second-half, post-match
    this.kickoffTime = options.kickoffTime || new Date(Date.now() + 3600000); // Default: 1 hour from now
    this.matchDuration = 90 * 60 * 1000; // 90 minutes in ms
    this.halftimeDuration = 15 * 60 * 1000; // 15 minutes
    
    // State
    this.sectorData = new Map();
    this.incidents = new Map();
    this.weather = {
      temperature: 22,
      humidity: 65,
      windSpeed: 8,
      condition: 'sunny'
    };
    
    // Flow configuration
    this.flowConfig = {
      incomingRate: 50, // fans per tick during pre-match
      concessionSurge: 200, // fans seeking concessions during halftime
      restroomSurge: 150, // fans seeking restrooms during halftime
      egressRate: 300 // fans leaving post-match
    };
    
    this.listeners = new Set();
    this.isRunning = false;
    this.timerId = null;
    this.incidentTimerId = null;
    this.weatherTimerId = null;
    
    this.initializeSectors();
  }

  initializeSectors() {
    const sectors = [];
    for (let i = 101; i <= 112; i++) sectors.push(`sector-${i}`);
    for (let i = 201; i <= 212; i++) sectors.push(`sector-${i}`);
    
    sectors.forEach(id => {
      this.sectorData.set(id, {
        density: Math.floor(Math.random() * 30),
        occupied: 0,
        capacity: 5000,
        temperature: this.weather.temperature + (Math.random() * 5 - 2.5),
        waitTime: 0,
        incidents: 0
      });
    });
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Main simulation loop (5 second interval)
    this.timerId = setInterval(() => this.tick(), this.interval);
    
    // Incident dispatcher (randomized intervals)
    this.scheduleNextIncident();
    
    // Weather updates (every 30 seconds)
    this.weatherTimerId = setInterval(() => this.updateWeather(), 30000);
    
    this.broadcast({ type: 'simulation-started', timestamp: Date.now() });
  }

  stop() {
    this.isRunning = false;
    if (this.timerId) clearInterval(this.timerId);
    if (this.incidentTimerId) clearTimeout(this.incidentTimerId);
    if (this.weatherTimerId) clearInterval(this.weatherTimerId);
    this.broadcast({ type: 'simulation-stopped', timestamp: Date.now() });
  }

  tick() {
    this.updateMatchPhase();
    this.updateFanFlow();
    this.updateSectorConditions();
    this.broadcast({
      type: 'tick',
      phase: this.matchPhase,
      timestamp: Date.now(),
      sectorData: Object.fromEntries(this.sectorData),
      weather: { ...this.weather }
    });
  }

  updateMatchPhase() {
    const elapsed = Date.now() - this.kickoffTime.getTime();
    
    if (elapsed < 0) {
      this.matchPhase = 'pre-match';
    } else if (elapsed < 2700000) { // < 45 min
      this.matchPhase = 'first-half';
    } else if (elapsed < 3150000) { // < 45 + 15 (halftime)
      this.matchPhase = 'halftime';
    } else if (elapsed < 5850000) { // < 90 + 15
      this.matchPhase = 'second-half';
    } else if (elapsed < 6300000) { // < 90 + 15 + 15 (extra time buffer)
      this.matchPhase = 'extra-time';
    } else {
      this.matchPhase = 'post-match';
    }
  }

  updateFanFlow() {
    const sectors = Array.from(this.sectorData.keys());
    const currentPhase = this.matchPhase;
    
    switch(currentPhase) {
      case 'pre-match':
        this.simulatePreMatch(sectors);
        break;
      case 'first-half':
        this.simulateMatchInProgress(sectors);
        break;
      case 'halftime':
        this.simulateHalftime(sectors);
        break;
      case 'second-half':
        this.simulateMatchInProgress(sectors);
        break;
      case 'post-match':
        this.simulateEgress(sectors);
        break;
    }
  }

  simulatePreMatch(sectors) {
    // Peaking 45 minutes before kickoff
    const timeToKickoff = this.kickoffTime.getTime() - Date.now();
    const intensity = Math.max(0, Math.min(1, 1 - (timeToKickoff / 2700000)));
    
    sectors.forEach(id => {
      const data = this.sectorData.get(id);
      const incoming = Math.floor(this.flowConfig.incomingRate * intensity * (0.5 + Math.random()));
      data.occupied = Math.min(data.capacity, data.occupied + incoming);
      data.density = Math.floor((data.occupied / data.capacity) * 100);
    });
  }

  simulateMatchInProgress(sectors) {
    // Fans slowly trickling in
    sectors.forEach(id => {
      const data = this.sectorData.get(id);
      const incoming = Math.floor(Math.random() * 10);
      data.occupied = Math.min(data.capacity, data.occupied + incoming);
      data.density = Math.floor((data.occupied / data.capacity) * 100);
    });
  }

  simulateHalftime(sectors) {
    // Massive surges toward concessions and restrooms
    sectors.forEach(id => {
      const data = this.sectorData.get(id);
      // Fans leave seats but stay in concourse area
      if (Math.random() > 0.5) {
        const leaving = Math.floor(data.occupied * 0.15); // 15% leave for concessions
        data.occupied = Math.max(0, data.occupied - leaving);
      }
      data.density = Math.floor((data.occupied / data.capacity) * 100);
      data.waitTime = Math.floor(data.density * 0.5); // Wait times spike
    });
  }

  simulateEgress(sectors) {
    // Mass egress toward transit stations
    sectors.forEach(id => {
      const data = this.sectorData.get(id);
      const outgoing = Math.floor(this.flowConfig.egressRate * (0.3 + Math.random() * 0.7));
      data.occupied = Math.max(0, data.occupied - outgoing);
      data.density = Math.floor((data.occupied / data.capacity) * 100);
    });
  }

  updateSectorConditions() {
    this.sectorData.forEach((data, id) => {
      // Temperature variations based on sun exposure
      const sunFactor = this.weather.condition === 'sunny' ? 1.5 : 0.5;
      data.temperature = this.weather.temperature + (Math.random() * 3 - 1.5) * sunFactor;
      
      // Wait times naturally decrease as density decreases
      if (this.matchPhase !== 'halftime') {
        data.waitTime = Math.max(0, data.waitTime - 2);
      }
    });
  }

  scheduleNextIncident() {
    if (!this.isRunning) return;
    
    const delay = Math.random() * 30000 + 15000; // 15-45 seconds
    this.incidentTimerId = setTimeout(() => {
      this.dispatchIncident();
      this.scheduleNextIncident();
    }, delay);
  }

  dispatchIncident() {
    // Only dispatch background incidents if active role is staff or organizer
    const activeRole = window.StadiumApp?.state?.role || 'fan';
    if (activeRole !== 'staff' && activeRole !== 'organizer') {
      return;
    }

    const types = ['spill', 'medical', 'security', 'ticketing', 'weather'];
    const type = types[Math.floor(Math.random() * types.length)];
    const sectors = Array.from(this.sectorData.keys());
    const sector = sectors[Math.floor(Math.random() * sectors.length)];
    
    const incident = {
      id: `incident-${Date.now()}`,
      type,
      sector,
      severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
      timestamp: Date.now(),
      description: this.getIncidentDescription(type)
    };
    
    this.incidents.set(incident.id, incident);
    
    // Update sector incident count
    const sectorData = this.sectorData.get(sector);
    if (sectorData) sectorData.incidents++;
    
    this.broadcast({
      type: 'incident',
      incident
    });
  }

  getIncidentDescription(type) {
    const descriptions = {
      spill: 'Slip hazard reported in concourse area',
      medical: 'Medical emergency requiring first aid response',
      security: 'Security issue at gate entrance',
      ticketing: 'Ticketing system malfunction at gate',
      weather: 'Weather-related safety concern'
    };
    return descriptions[type] || 'Unknown incident';
  }

  updateWeather() {
    // Vary outdoor temperature and sun exposure
    const conditions = ['sunny', 'partly-cloudy', 'overcast', 'rain'];
    this.weather.condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    this.weather.temperature += (Math.random() * 2 - 1); // +/- 1 degree
    this.weather.temperature = Math.max(15, Math.min(35, this.weather.temperature));
    
    this.weather.humidity = Math.max(30, Math.min(90, this.weather.humidity + (Math.random() * 10 - 5)));
    this.weather.windSpeed = Math.max(0, this.weather.windSpeed + (Math.random() * 4 - 2));
    
    // Fans in sunny sectors seek shade
    if (this.weather.condition === 'sunny' && this.weather.temperature > 28) {
      this.moveFansToShade();
    }
    
    this.broadcast({
      type: 'weather-update',
      weather: { ...this.weather }
    });
  }

  moveFansToShade() {
    // Simulate fans moving from sunny outdoor sectors to shaded/indoor concourses
    this.sectorData.forEach((data, id) => {
      if (data.temperature > 30) {
        // 10-20% of fans seek shade
        const seekingShade = Math.floor(data.occupied * (0.1 + Math.random() * 0.1));
        data.occupied = Math.max(0, data.occupied - seekingShade);
        data.density = Math.floor((data.occupied / data.capacity) * 100);
      }
    });
  }

  // Observer pattern for real-time updates
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  broadcast(data) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (e) {
        console.error('Error in simulator listener:', e);
      }
    });
  }

  // Public API
  getSectorData(sectorId) {
    return this.sectorData.get(sectorId);
  }

  getAllSectorData() {
    return Object.fromEntries(this.sectorData);
  }

  getActiveIncidents() {
    return Array.from(this.incidents.values()).filter(i => !i.resolved);
  }

  resolveIncident(incidentId) {
    const incident = this.incidents.get(incidentId);
    if (incident) {
      incident.resolved = true;
      incident.resolvedAt = Date.now();
      this.broadcast({ type: 'incident-resolved', incident });
    }
  }

  setKickoffTime(date) {
    this.kickoffTime = date;
  }

  getMatchPhase() {
    return this.matchPhase;
  }
}

// Export for module usage or global access
window.StadiumSimulator = StadiumSimulator;