(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const create = (tag, className = '') => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  };

  const venues = {
    metlife: { name: 'MetLife Stadium', city: 'East Rutherford', match: 'Final operations drill', capacity: 82500 },
    sofi: { name: 'SoFi Stadium', city: 'Inglewood', match: 'Group-stage evening match', capacity: 70000 },
    azteca: { name: 'Estadio Azteca', city: 'Mexico City', match: 'Opening match readiness', capacity: 83000 },
    att: { name: 'AT&T Stadium', city: 'Arlington', match: 'Knockout match readiness', capacity: 94000 },
    bmo: { name: 'BMO Field', city: 'Toronto', match: 'Canada group match', capacity: 45000 }
  };

  const initialState = {
    role: 'fan',
    venueId: 'metlife',
    matchMinute: 0,
    matchState: 'T-75 pre-match',
    selectedView: 'dashboard-view',
    sectors: [
      { id: 'north', name: 'North Concourse', density: 3.2, trend: 0.3, x: 170, y: 36, w: 180, h: 58 },
      { id: 'east', name: 'East Plaza', density: 4.8, trend: 0.7, x: 372, y: 100, w: 92, h: 150 },
      { id: 'south', name: 'South Stands', density: 5.7, trend: 0.4, x: 170, y: 266, w: 180, h: 58 },
      { id: 'west', name: 'West Gate Hall', density: 2.6, trend: -0.1, x: 56, y: 100, w: 92, h: 150 },
      { id: 'field', name: 'Lower Bowl', density: 3.9, trend: 0.2, x: 188, y: 128, w: 144, h: 84 }
    ],
    gates: [
      { id: 'A', name: 'Gate A', waitMinutes: 16, throughputPerMin: 74, targetThroughputPerMin: 110, x: 260, y: 46 },
      { id: 'B', name: 'Gate B', waitMinutes: 7, throughputPerMin: 118, targetThroughputPerMin: 115, x: 442, y: 180 },
      { id: 'C', name: 'Gate C', waitMinutes: 11, throughputPerMin: 91, targetThroughputPerMin: 110, x: 260, y: 314 },
      { id: 'D', name: 'Gate D', waitMinutes: 4, throughputPerMin: 120, targetThroughputPerMin: 105, x: 78, y: 180 }
    ],
    queues: [
      { id: 'q1', name: 'Restroom 112', type: 'Restroom', waitMinutes: 9, arrivalRate: 18, serviceRate: 15, trend: 1 },
      { id: 'q2', name: 'Restroom 219', type: 'Restroom', waitMinutes: 4, arrivalRate: 12, serviceRate: 15, trend: 0 },
      { id: 'q3', name: 'Tacos Stand 105', type: 'Food', waitMinutes: 13, arrivalRate: 21, serviceRate: 16, trend: 1 },
      { id: 'q4', name: 'Water Refill East', type: 'Water', waitMinutes: 3, arrivalRate: 20, serviceRate: 28, trend: -1 },
      { id: 'q5', name: 'Merch 240', type: 'Retail', waitMinutes: 8, arrivalRate: 10, serviceRate: 8, trend: 0 }
    ],
    incidents: [
      { id: 'INC-1001', type: 'Medical', location: 'South Stands', crowdDensity: 5.7, minutesToKickoff: 35, status: 'open', createdAt: Date.now() - 240000 },
      { id: 'INC-1002', type: 'Spill', location: 'Gate B ramp', crowdDensity: 3.4, minutesToKickoff: 35, status: 'open', createdAt: Date.now() - 420000 },
      { id: 'INC-1003', type: 'Security', location: 'East Plaza', crowdDensity: 4.8, minutesToKickoff: 35, status: 'open', createdAt: Date.now() - 120000 }
    ],
    transit: [
      { id: 'rail', mode: 'Rail', name: 'Meadowlands event rail', eta: 12, load: 'Amber', note: 'Next three trains routed through Secaucus.' },
      { id: 'shuttle', mode: 'Shuttle', name: 'Accessible shuttle loop', eta: 6, load: 'Green', note: 'Two low-floor shuttles staged at Lot E.' },
      { id: 'rideshare', mode: 'Ride-share', name: 'Remote pickup zone', eta: 18, load: 'Amber', note: 'Post-match walk time currently 14 min.' }
    ],
    sustainability: {
      fans: 67100,
      transportKgCO2e: 128600,
      renewableEnergyPct: 64,
      gridLoadPct: 71,
      waterSavedLiters: 182000,
      wasteDiversionPct: 68
    },
    blockedExits: ['south'],
    myTicket: {
      section: '104',
      assignedGate: 'A',
      ticketNo: 'T-10488',
      batch: 3
    },
    liveMatches: {
      metlife: { teams: 'USA vs. Germany', score: '2-1', time: '18:30 kickoff' },
      sofi: { teams: 'Mexico vs. Brazil', score: '0-0', time: '20:00 kickoff' },
      azteca: { teams: 'Canada vs. Argentina', score: '1-3', time: 'Final' },
      att: { teams: 'England vs. France', score: '1-1', time: '75\'' },
      bmo: { teams: 'Japan vs. Spain', score: '0-2', time: 'Halftime' }
    },
    previousMatches: {
      metlife: [['USA vs. Italy', '3-2'], ['Germany vs. Mexico', '1-1']],
      sofi: [['Brazil vs. Colombia', '2-0'], ['Argentina vs. Ecuador', '3-1']],
      azteca: [['Mexico vs. France', '2-1']],
      att: [['England vs. Portugal', '0-1']],
      bmo: [['Canada vs. Morocco', '1-0']]
    }
  };

  const state = structuredClone(initialState);

  const emit = (eventName, detail = {}) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  };

  const announce = (message) => {
    const live = $('#aria-live-region');
    if (live) live.textContent = message;
  };

  const toast = (title, body = '', type = 'info') => {
    const container = $('#toast-container');
    if (!container) return;
    const node = create('div', `toast toast-${type}`);
    const icon = create('span', 'toast-icon');
    const content = create('div', 'toast-content');
    const titleNode = create('div', 'toast-title');
    const bodyNode = create('div', 'toast-body');
    const close = create('button', 'toast-close');

    icon.textContent = type === 'danger' ? '!' : type === 'success' ? 'OK' : 'i';
    titleNode.textContent = title;
    bodyNode.textContent = body;
    close.type = 'button';
    close.setAttribute('aria-label', 'Dismiss notification');
    close.textContent = 'x';
    close.addEventListener('click', () => node.remove());

    content.append(titleNode, bodyNode);
    node.append(icon, content, close);
    container.append(node);
    setTimeout(() => node.remove(), 6000);
    announce(`${title}. ${body}`);
  };

  const getVenue = () => venues[state.venueId] || venues.metlife;

  const getContext = () => ({
    ...state,
    venueName: getVenue().name,
    venue: getVenue()
  });

  const setView = (viewId) => {
    if (!viewId || !$(`#${viewId}`)) return;
    state.selectedView = viewId;
    $$('.view').forEach((view) => view.classList.toggle('active', view.id === viewId));
    $$('.nav-item, .mobile-nav-item').forEach((button) => {
      const active = button.dataset.view === viewId;
      button.classList.toggle('active', active);
      if (button.classList.contains('nav-item')) button.setAttribute('aria-current', active ? 'page' : 'false');
    });
    $('#main-content')?.focus({ preventScroll: true });
    renderAll();
  };

  const severityClass = (severity) => {
    const value = String(severity || '').toLowerCase();
    if (value === 'red') return 'danger';
    if (value === 'amber') return 'warning';
    if (value === 'green') return 'success';
    return 'info';
  };

  const statusForDensity = (density) => {
    if (density > 6) return 'density-critical';
    if (density > 4) return 'density-crowded';
    if (density > 3) return 'density-moderate';
    return 'density-safe';
  };

  const formatPercent = (value) => `${Math.round(value)}%`;

  const makeSparkline = (values) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'sparkline-svg');
    svg.setAttribute('viewBox', '0 0 60 20');
    svg.setAttribute('aria-hidden', 'true');
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const points = values.map((value, index) => {
      const x = (index / (values.length - 1 || 1)) * 58 + 1;
      const y = 18 - ((value - min) / range) * 16;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('class', 'sparkline-line');
    polyline.setAttribute('points', points);
    svg.append(polyline);
    return svg;
  };

  const createKpiCard = ({ label, value, trend, status, icon, series }) => {
    const card = create('article', `kpi-card status-${status}`);
    const header = create('div', 'kpi-card-header');
    const labelNode = create('div', 'kpi-card-label');
    const iconNode = create('div', 'kpi-card-icon');
    const valueNode = create('div', 'kpi-card-value rolling-number');
    const trendNode = create('div', `kpi-card-trend ${trend.direction}`);

    labelNode.textContent = label;
    iconNode.textContent = icon;
    valueNode.textContent = value;
    trendNode.textContent = trend.text;
    header.append(labelNode, iconNode);
    card.append(header, valueNode, trendNode);
    if (series?.length) card.append(makeSparkline(series));
    return card;
  };

  const getRoleKpis = () => {
    const density = window.StadiumAI.analyzeCrowdDensity(state.sectors);
    const gates = window.StadiumAI.optimizeGateFlow(state.gates);
    const openIncidents = state.incidents.filter((incident) => incident.status !== 'resolved');
    const maxQueue = Math.max(...state.queues.map((queue) => queue.waitMinutes));
    const common = {
      fan: [
        { label: 'Best gate wait', value: `${Math.min(...state.gates.map((gate) => gate.waitMinutes))}m`, trend: { direction: 'down', text: 'Improving' }, status: 'success', icon: 'G', series: [9, 8, 6, 5, 4] },
        { label: 'Shortest service', value: `${Math.min(...state.queues.map((queue) => queue.waitMinutes))}m`, trend: { direction: 'neutral', text: 'Nearby water point' }, status: 'info', icon: 'Q', series: [4, 4, 3, 3, 3] },
        { label: 'Route status', value: density.status, trend: { direction: density.status === 'Green' ? 'up' : 'neutral', text: density.rebalancing }, status: severityClass(density.status), icon: 'M', series: [2, 3, 4, 5, 4] },
        { label: 'Transit ETA', value: `${Math.min(...state.transit.map((item) => item.eta))}m`, trend: { direction: 'neutral', text: 'Accessible shuttle' }, status: 'info', icon: 'T', series: [12, 10, 8, 7, 6] }
      ],
      staff: [
        { label: 'Open incidents', value: String(openIncidents.length), trend: { direction: openIncidents.length ? 'neutral' : 'up', text: 'SLA timers active' }, status: openIncidents.length > 2 ? 'danger' : 'warning', icon: '!', series: [1, 2, 3, openIncidents.length] },
        { label: 'Peak density', value: `${Math.max(...state.sectors.map((sector) => sector.density)).toFixed(1)}`, trend: { direction: 'up', text: 'persons/m2' }, status: severityClass(density.status), icon: 'D', series: state.sectors.map((sector) => sector.density) },
        { label: 'Gate commands', value: String(gates.commands.length), trend: { direction: 'neutral', text: gates.summary }, status: gates.commands.length ? 'warning' : 'success', icon: 'G', series: state.gates.map((gate) => gate.waitMinutes) },
        { label: 'Max queue', value: `${maxQueue}m`, trend: { direction: maxQueue > 12 ? 'up' : 'neutral', text: 'Service pressure' }, status: maxQueue > 12 ? 'danger' : 'warning', icon: 'Q', series: state.queues.map((queue) => queue.waitMinutes) }
      ],
      organizer: [
        { label: 'Attendance', value: '67.1K', trend: { direction: 'up', text: '81% projected capacity' }, status: 'info', icon: 'D', series: [43, 51, 58, 62, 67] },
        { label: 'Ops posture', value: density.status, trend: { direction: 'neutral', text: density.predictedPeak }, status: severityClass(density.status), icon: 'AI', series: state.sectors.map((sector) => sector.density) },
        { label: 'SLA risk', value: String(openIncidents.filter((incident) => window.StadiumAI.triageIncident(incident).severity !== 'Green').length), trend: { direction: 'neutral', text: 'Amber/red incidents' }, status: 'warning', icon: '!' },
        { label: 'Eco score', value: String(window.StadiumAI.calculateSustainabilityScore(state.sustainability).score), trend: { direction: 'up', text: 'Transit nudge active' }, status: 'success', icon: 'S', series: [70, 72, 75, 78, 80] }
      ]
    };
    return common[state.role] || common.fan;
  };

  const renderDashboard = () => {
    const fanSection = $('#fan-dashboard-enhancements');
    if (fanSection) {
      fanSection.style.display = state.role === 'fan' ? 'grid' : 'none';
    }

    const kpis = $('#dashboard-kpis');
    if (!kpis) return;
    kpis.replaceChildren(...getRoleKpis().map(createKpiCard));

    if (state.role === 'fan') {
      renderSmartTicket();
      renderMatchHub();
    }

    const density = window.StadiumAI.analyzeCrowdDensity(state.sectors);
    const gates = window.StadiumAI.optimizeGateFlow(state.gates);
    const staff = window.StadiumAI.recommendStaffDeployment(state.sectors, state.incidents);
    const feed = $('#decision-feed');
    if (feed) {
      const decisions = [
        { title: 'Crowd density', body: `${density.status}: ${density.recommendations[0]}`, badge: density.status },
        { title: 'Gate flow', body: gates.summary, badge: gates.status },
        { title: 'Staff deployment', body: staff.summary, badge: staff.recommendations[0]?.priority || 'Green' }
      ];
      feed.replaceChildren(...decisions.map((item) => {
        const card = create('div', 'ai-insight-card');
        const icon = create('div', 'ai-insight-icon');
        const content = create('div', 'ai-insight-content');
        const label = create('div', 'ai-insight-label');
        const text = create('div', 'ai-insight-text');
        const confidence = create('div', 'ai-insight-confidence');
        icon.textContent = 'AI';
        label.textContent = item.title;
        text.textContent = item.body;
        confidence.textContent = `Severity: ${item.badge}`;
        content.append(label, text, confidence);
        card.append(icon, content);
        return card;
      }));
    }

    const snapshot = $('#venue-snapshot');
    if (snapshot) {
      const venue = getVenue();
      snapshot.replaceChildren(
        makeInfoRow('Venue', `${venue.name}, ${venue.city}`),
        makeInfoRow('Match state', state.matchState),
        makeInfoRow('Capacity', venue.capacity.toLocaleString()),
        makeInfoRow('Role', state.role),
        makeInfoRow('Highest density', density.predictedPeak)
      );
    }
  };

  const renderSmartTicket = () => {
    const ticketCard = $('#fan-ticket-card');
    if (!ticketCard) return;

    const ticket = state.myTicket;
    const assignedGate = ticket.assignedGate;
    const assignedGateObj = state.gates.find(g => g.id === assignedGate);

    // Check if the assigned gate is blocked by any unresolved incident
    const isGateBlocked = state.incidents.some(i => i.status !== 'resolved' && i.location.toLowerCase().includes(`gate ${assignedGate.toLowerCase()}`));

    let gateStatusHTML = '';
    
    if (isGateBlocked) {
      // Find lowest wait non-blocked alternative gate
      const nonBlockedGates = state.gates.filter(g => !state.incidents.some(i => i.status !== 'resolved' && i.location.toLowerCase().includes(g.name.toLowerCase())));
      const optimalGateObj = [...nonBlockedGates].sort((a, b) => a.waitMinutes - b.waitMinutes)[0] || state.gates.find(g => g.id !== assignedGate) || assignedGateObj;

      gateStatusHTML = `
        <div style="display: flex; gap: var(--space-3); align-items: flex-start; color: var(--danger); background: rgba(255, 56, 96, 0.08); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid rgba(255, 56, 96, 0.2);">
          <span style="font-size: var(--text-xl); line-height: 1;">⚠️</span>
          <div>
            <div style="font-weight: var(--weight-semibold); margin-bottom: 2px;">AI TRAFFIC ROUTING ALERT</div>
            <div style="font-size: var(--text-sm); line-height: 1.4;">
              Your assigned gate (<strong>Gate ${assignedGate}</strong>) is currently blocked due to an active operational delay. 
              <br><strong style="color: var(--success);">AI Action:</strong> Your batch has been rerouted to <strong>Gate ${optimalGateObj.id}</strong> (wait time: ${optimalGateObj.waitMinutes}m). Proceed there immediately.
            </div>
          </div>
        </div>
      `;
    } else {
      // Gate is clear. Check if wait time is high and optimal gate is better
      const optimalGateObj = [...state.gates].sort((a, b) => a.waitMinutes - b.waitMinutes)[0];
      const waitGap = assignedGateObj ? assignedGateObj.waitMinutes - optimalGateObj.waitMinutes : 0;
      
      if (waitGap > 5 && optimalGateObj.id !== assignedGate) {
        // Recommend redirect
        gateStatusHTML = `
          <div style="display: flex; gap: var(--space-3); align-items: flex-start; color: var(--warning); background: rgba(255, 179, 0, 0.08); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid rgba(255, 179, 0, 0.2);">
            <span style="font-size: var(--text-xl); line-height: 1;">⚡</span>
            <div>
              <div style="font-weight: var(--weight-semibold); margin-bottom: 2px;">AI Travel Optimization</div>
              <div style="font-size: var(--text-sm); line-height: 1.4;">
                Traffic is high at <strong>Gate ${assignedGate}</strong> (wait: ${assignedGateObj ? assignedGateObj.waitMinutes : 0}m). 
                AI recommends entering through <strong>Gate ${optimalGateObj.id}</strong> (wait: ${optimalGateObj.waitMinutes}m) to save <strong>${waitGap} minutes</strong>.
              </div>
            </div>
          </div>
        `;
      } else {
        // Safe route
        gateStatusHTML = `
          <div style="display: flex; gap: var(--space-3); align-items: flex-start; color: var(--success); background: rgba(0, 255, 135, 0.08); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid rgba(0, 255, 135, 0.2);">
            <span style="font-size: var(--text-xl); line-height: 1;">✅</span>
            <div>
              <div style="font-weight: var(--weight-semibold); margin-bottom: 2px;">Route Clear</div>
              <div style="font-size: var(--text-sm); line-height: 1.4;">
                Proceed to your assigned entrance <strong>Gate ${assignedGate}</strong>. Wait time is normal (${assignedGateObj ? assignedGateObj.waitMinutes : 0} minutes).
              </div>
            </div>
          </div>
        `;
      }
    }

    // Staggered batch arrival status
    const minutesToKickoff = Math.max(0, 75 - state.matchMinute);
    let batchStatusText = '';
    let batchStatusColor = 'var(--text-muted)';
    
    if (minutesToKickoff > 60) {
      batchStatusText = 'Upcoming slot (T-75 to T-60). Please prepare to travel.';
      batchStatusColor = 'var(--info)';
    } else if (minutesToKickoff > 30) {
      batchStatusText = 'YOUR ENTRY SLOT IS ACTIVE. Please proceed to the gate.';
      batchStatusColor = 'var(--success)';
    } else {
      batchStatusText = 'Slot has passed. Proceed immediately to avoid general crowd peaks.';
      batchStatusColor = 'var(--danger)';
    }

    ticketCard.innerHTML = `
      <div class="card-header" style="margin-bottom: var(--space-3);">
        <h2 class="card-title">My Smart Ticket & Gate Guide</h2>
        <span class="badge badge-info" style="font-family: var(--font-mono);">${ticket.ticketNo}</span>
      </div>
      <div class="grid-2" style="gap: var(--space-4); margin-bottom: var(--space-3);">
        <div>
          <div class="label" style="font-size: var(--text-xs); margin-bottom: 2px; color: var(--text-muted);">Assigned Seat</div>
          <div style="font-size: var(--text-lg); font-weight: var(--weight-bold); color: var(--gold);">Section ${ticket.section}</div>
        </div>
        <div>
          <div class="label" style="font-size: var(--text-xs); margin-bottom: 2px; color: var(--text-muted);">Staggered Arrival Slot</div>
          <div style="font-size: var(--text-lg); font-weight: var(--weight-bold); color: ${batchStatusColor};">Batch ${ticket.batch} (T-60 to T-30)</div>
        </div>
      </div>
      <div style="font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-4); font-style: italic;">
        🕒 Current Status: ${batchStatusText}
      </div>
      <div class="nav-divider" style="margin: var(--space-3) 0;"></div>
      <div id="fan-routing-status">
        ${gateStatusHTML}
      </div>
    `;
  };

  const renderMatchHub = async () => {
    const matchHub = $('#fan-match-hub');
    if (!matchHub) return;

    let live = state.liveMatches[state.venueId] || { teams: 'No Match scheduled', score: '0-0', time: 'T-00' };
    let history = state.previousMatches[state.venueId] || [];

    if (window.FootballClient?.hasApiKey()) {
      try {
        const matches = await window.FootballClient.getMatches();
        const activeMatch = matches.find(m => m.status === 'LIVE' || m.status === 'IN_PLAY' || m.status === 'LIVE_MATCH') || matches[0];
        if (activeMatch) {
          live = {
            teams: `${activeMatch.homeTeam.name} vs. ${activeMatch.awayTeam.name}`,
            score: `${activeMatch.score.fullTime.home} - ${activeMatch.score.fullTime.away}`,
            time: activeMatch.status === 'LIVE' ? 'LIVE' : 'Scheduled'
          };
        }
        
        const schedule = await window.FootballClient.getSchedule();
        if (schedule && schedule.length > 0) {
          history = schedule.slice(0, 3).map(m => [
            `${m.homeTeam.name} vs. ${m.awayTeam.name}`,
            m.status === 'FINISHED' ? `${m.score.fullTime.home}-${m.score.fullTime.away}` : new Date(m.utcDate).toLocaleDateString()
          ]);
        }
      } catch (err) {
        console.warn('Failed to load real-time matches from Football API:', err);
      }
    }

    const venue = getVenue();

    let historyHTML = '';
    if (history.length > 0) {
      historyHTML = history.map(match => `
        <li style="display: flex; justify-content: space-between; font-size: var(--text-sm); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-1); margin-bottom: var(--space-1);">
          <span style="color: var(--text-secondary);">${match[0]}</span>
          <strong style="color: var(--gold); font-family: var(--font-mono);">${match[1]}</strong>
        </li>
      `).join('');
    } else {
      historyHTML = `<li style="font-size: var(--text-sm); color: var(--text-muted);">No history at this stadium.</li>`;
    }

    matchHub.innerHTML = `
      <div class="card-header" style="margin-bottom: var(--space-3);">
        <h2 class="card-title">Match Hub</h2>
        <span class="badge badge-success">Live Score</span>
      </div>
      <div style="text-align: center; padding: var(--space-2) 0; margin-bottom: var(--space-2);">
        <div style="font-size: var(--text-xs); text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 4px;">At ${venue.name}</div>
        <div style="font-size: var(--text-lg); font-weight: var(--weight-bold); margin: var(--space-1) 0;">${live.teams}</div>
        <div style="font-family: var(--font-mono); font-size: var(--text-3xl); font-weight: var(--weight-bold); color: var(--gold); letter-spacing: 2px; margin: 4px 0;">${live.score}</div>
        <div style="font-size: var(--text-sm); color: var(--text-secondary); font-family: var(--font-mono);">${live.time}</div>
      </div>
      <div class="nav-divider" style="margin: var(--space-3) 0;"></div>
      <div>
        <div class="label" style="font-size: var(--text-xs); margin-bottom: var(--space-2); color: var(--text-muted);">Previous Scores at this Stadium</div>
        <ul style="display: flex; flex-direction: column; gap: var(--space-1); padding: 0;">
          ${historyHTML}
        </ul>
        <button id="view-squad-btn" class="btn btn-ghost btn-sm" style="width: 100%; margin-top: var(--space-3); border: 1px dashed var(--border-medium);" type="button">👥 View Team Roster & Players</button>
      </div>
    `;

    // Bind squad modal viewer
    matchHub.querySelector('#view-squad-btn')?.addEventListener('click', async () => {
      const teamId = state.venueId === 'metlife' ? 757 : 759; // Default USA or Germany IDs
      toast('Loading squad...', 'Fetching real-time team roster.', 'info');
      try {
        const squadData = await window.FootballClient.getTeamSquad(teamId);
        openRosterModal(squadData);
      } catch (err) {
        toast('Squad load failed', err.message, 'danger');
      }
    });
  };

  const openRosterModal = (squadData) => {
    let modal = $('#roster-modal');
    if (!modal) {
      modal = create('div', 'emergency-overlay');
      modal.id = 'roster-modal';
      modal.style.background = 'rgba(11, 15, 25, 0.95)';
      document.body.appendChild(modal);
    }
    
    const playersHTML = (squadData.squad || []).map(player => `
      <div style="display: flex; justify-content: space-between; padding: var(--space-2) 0; border-bottom: 1px dashed var(--border-subtle);">
        <div>
          <strong style="color: var(--text-primary);">${player.name}</strong>
          <div style="font-size: var(--text-xs); color: var(--text-muted);">${player.position || 'Player'}</div>
        </div>
        <span style="font-size: var(--text-xs); color: var(--gold);">${player.nationality}</span>
      </div>
    `).join('');
    
    modal.innerHTML = `
      <button id="roster-modal-close" class="emergency-dismiss" type="button" style="border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: var(--space-1) var(--space-2); background: transparent; color: var(--text-secondary); cursor: pointer;">Close</button>
      <h2 class="emergency-title" style="color: var(--gold); margin-bottom: var(--space-4); text-align: center;">👥 ${squadData.name} Roster</h2>
      <div style="max-height: 400px; overflow-y: auto; text-align: left; padding: 0 var(--space-2); margin-top: var(--space-4);">
        ${playersHTML}
      </div>
    `;
    
    modal.classList.add('active');
    modal.querySelector('#roster-modal-close').addEventListener('click', () => modal.classList.remove('active'));
  };

  const makeInfoRow = (label, value) => {
    const row = create('div', 'map-tooltip-row');
    const labelNode = create('span', 'map-tooltip-label');
    const valueNode = create('span', 'map-tooltip-value');
    labelNode.textContent = label;
    valueNode.textContent = value;
    row.append(labelNode, valueNode);
    return row;
  };

  const renderMap = () => {
    const sectorLayer = $('#map-sector-layer');
    const gateLayer = $('#map-gate-layer');
    const incidentLayer = $('#map-incident-layer');
    if (!sectorLayer || !gateLayer || !incidentLayer) return;

    sectorLayer.replaceChildren(...state.sectors.map((sector) => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', sector.x);
      rect.setAttribute('y', sector.y);
      rect.setAttribute('width', sector.w);
      rect.setAttribute('height', sector.h);
      rect.setAttribute('rx', '10');
      rect.setAttribute('class', `map-sector ${statusForDensity(sector.density)}`);
      rect.setAttribute('tabindex', '0');
      rect.setAttribute('role', 'button');
      rect.setAttribute('aria-label', `${sector.name}, ${sector.density} persons per square meter`);
      rect.addEventListener('click', () => toast(sector.name, `${sector.density} persons/m2. Trend ${sector.trend >= 0 ? '+' : ''}${sector.trend}.`, severityClass(window.StadiumAI.analyzeCrowdDensity([sector]).status)));
      return rect;
    }));

    gateLayer.replaceChildren(...state.gates.flatMap((gate) => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'gate-marker');
      group.setAttribute('tabindex', '0');
      group.setAttribute('role', 'button');
      group.setAttribute('aria-label', `${gate.name}, ${gate.waitMinutes} minute wait`);
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      circle.setAttribute('cx', gate.x);
      circle.setAttribute('cy', gate.y);
      circle.setAttribute('r', '16');
      circle.setAttribute('fill', gate.waitMinutes > 12 ? 'var(--danger)' : gate.waitMinutes > 8 ? 'var(--warning)' : 'var(--success)');
      text.setAttribute('x', gate.x);
      text.setAttribute('y', gate.y);
      text.setAttribute('class', 'gate-marker-label');
      text.textContent = gate.id;
      group.append(circle, text);
      group.addEventListener('click', () => toast(gate.name, `${gate.waitMinutes} min wait, ${gate.throughputPerMin}/min throughput.`, 'info'));
      return [group];
    }));

    incidentLayer.replaceChildren(...state.incidents.filter((incident) => incident.status !== 'resolved').map((incident, index) => {
      const pin = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const triage = window.StadiumAI.triageIncident(incident);
      const positions = [{ x: 285, y: 296 }, { x: 420, y: 138 }, { x: 390, y: 214 }];
      const pos = positions[index % positions.length];
      pin.setAttribute('class', 'incident-pin');
      dot.setAttribute('class', 'incident-pin-dot');
      dot.setAttribute('cx', pos.x);
      dot.setAttribute('cy', pos.y);
      dot.setAttribute('r', '6');
      dot.setAttribute('fill', triage.severity === 'Red' ? 'var(--danger)' : triage.severity === 'Amber' ? 'var(--warning)' : 'var(--success)');
      pin.append(dot);
      return pin;
    }));
  };

  const renderMapInsights = () => {
    const container = $('#map-insights');
    if (!container) return;
    const analysis = window.StadiumAI.analyzeCrowdDensity(state.sectors);
    container.replaceChildren(...analysis.sectors.map((sector) => {
      const card = create('div', `incident-card`);
      const severity = create('div', `incident-severity ${sector.severity.toLowerCase()}`);
      const body = create('div', 'incident-body');
      const type = create('div', 'incident-type');
      const location = create('div', 'incident-location');
      const meta = create('div', 'incident-meta');
      type.textContent = sector.name;
      location.textContent = `${sector.density} persons/m2, predicted ${sector.predictedDensity}`;
      meta.textContent = sector.recommendation;
      body.append(type, location, meta);
      card.append(severity, body);
      return card;
    }));
  };

  const renderGates = () => {
    const grid = $('#gate-grid');
    if (!grid) return;
    const plan = window.StadiumAI.optimizeGateFlow(state.gates);
    grid.replaceChildren(...plan.gates.map((gate) => {
      const card = create('article', `kpi-card status-${gate.waitMinutes > 12 ? 'danger' : gate.waitMinutes > 8 ? 'warning' : 'success'}`);
      card.append(
        makeInfoRow(gate.name, `${gate.waitMinutes} min`),
        makeInfoRow('Throughput', `${gate.throughputPerMin}/min`),
        makeInfoRow('Utilization', formatPercent(gate.utilization))
      );
      const command = plan.commands.find((item) => item.sourceGate === gate.name);
      if (command) {
        const action = create('p');
        action.textContent = command.command;
        card.append(action);
      }
      return card;
    }));
  };

  const renderQueues = () => {
    const grid = $('#queue-grid');
    if (!grid) return;
    grid.replaceChildren(...state.queues.map((queue) => {
      const prediction = window.StadiumAI.predictQueueWait(queue, state.queues);
      const card = create('article', 'queue-card');
      const type = create('div', 'queue-card-type');
      const wait = create('div', `queue-wait-time ${prediction.predictedWait >= 13 ? 'high' : prediction.predictedWait >= 8 ? 'medium' : 'low'}`);
      const label = create('div');
      const bar = create('div', 'queue-bar');
      const fill = create('div', 'queue-bar-fill');
      type.textContent = `${queue.type} - ${queue.name}`;
      wait.textContent = `${prediction.predictedWait} min`;
      label.textContent = prediction.recommendation;
      fill.style.width = `${clampPercent(prediction.predictedWait * 4)}%`;
      fill.style.background = prediction.severity === 'Red' ? 'var(--danger)' : prediction.severity === 'Amber' ? 'var(--warning)' : 'var(--success)';
      bar.append(fill);
      card.append(type, wait, label, bar);
      return card;
    }));
  };

  const clampPercent = (value) => Math.min(Math.max(value, 0), 100);

  const renderTransit = () => {
    const grid = $('#transit-grid');
    if (!grid) return;
    grid.replaceChildren(...state.transit.map((item) => {
      const card = create('article', 'transit-card');
      const title = create('h2', 'card-title');
      const eta = create('div', 'transit-eta');
      const note = create('p');
      title.textContent = `${item.mode}: ${item.name}`;
      eta.textContent = `${item.eta} min ETA`;
      note.textContent = `${item.load} load. ${item.note}`;
      card.append(title, eta, note);
      return card;
    }));
  };

  const renderSustainability = () => {
    const result = window.StadiumAI.calculateSustainabilityScore(state.sustainability);
    const score = $('#sustainability-score');
    const breakdown = $('#sustainability-breakdown');
    if (score) score.textContent = result.score;
    if (breakdown) {
      breakdown.replaceChildren(
        makeMetricCard('Carbon intensity', `${result.carbonIntensity} kg CO2e/fan`, 'info'),
        makeMetricCard('Energy efficiency', `${result.energyEfficiency}%`, 'success'),
        makeMetricCard('Water savings', `${result.waterSavings} L/fan`, 'success'),
        makeMetricCard('Waste diversion', `${result.wasteDiversion}%`, 'warning'),
        makeMetricCard('AI recommendation', result.recommendation, 'info')
      );
    }
  };

  const makeMetricCard = (label, value, status) => {
    const card = create('div', `kpi-card status-${status}`);
    const labelNode = create('div', 'kpi-card-label');
    const valueNode = create('div', 'kpi-card-trend neutral');
    labelNode.textContent = label;
    valueNode.textContent = value;
    card.append(labelNode, valueNode);
    return card;
  };

  const renderStaffDeployment = () => {
    const grid = $('#staff-deployment-grid');
    if (!grid) return;
    const plan = window.StadiumAI.recommendStaffDeployment(state.sectors, state.incidents);
    grid.replaceChildren(...plan.recommendations.map((item) => {
      const card = create('article', `incident-card`);
      const severity = create('div', `incident-severity ${item.priority.toLowerCase()}`);
      const body = create('div', 'incident-body');
      const type = create('div', 'incident-type');
      const location = create('div', 'incident-location');
      const meta = create('div', 'incident-meta');
      type.textContent = `${item.staffNeeded} staff to ${item.location}`;
      location.textContent = item.reason;
      meta.textContent = item.action;
      body.append(type, location, meta);
      card.append(severity, body);
      return card;
    }));
  };

  const renderAccessibleRoute = () => {
    const card = $('#accessible-route-card');
    if (!card) return;
    const route = window.StadiumAI.planEvacuationRoute({ start: { x: 260, y: 180 } }, state.blockedExits);
    const title = create('h2', 'card-title');
    title.textContent = 'Accessible route plan';
    card.replaceChildren(title, ...route.instructions.map((instruction, index) => makeInfoRow(`Step ${index + 1}`, instruction)));
  };

  const renderHeader = () => {
    const venueSelector = $('#venue-selector');
    const roleBanner = $('#role-banner');
    const badge = $('#notification-badge');
    if (venueSelector) venueSelector.value = state.venueId;
    if (roleBanner) roleBanner.textContent = `${state.role[0].toUpperCase()}${state.role.slice(1)} Mode`;
    if (badge) badge.hidden = state.incidents.every((incident) => incident.status === 'resolved');
    const apiStatus = $('#api-key-status');
    if (apiStatus) {
      apiStatus.replaceChildren();
      const dot = create('span', `status-dot ${window.GeminiClient?.hasApiKey() ? 'success' : 'warning'}`);
      const text = create('span');
      text.textContent = window.GeminiClient?.hasApiKey() ? 'Gemini API key saved locally.' : 'Local fallback engine active.';
      apiStatus.append(dot, text);
    }
    
    const footballStatus = $('#football-key-status');
    if (footballStatus) {
      footballStatus.replaceChildren();
      const dot = create('span', `status-dot ${window.FootballClient?.hasApiKey() ? 'success' : 'warning'}`);
      const text = create('span');
      text.textContent = window.FootballClient?.hasApiKey() ? 'Live Football API active.' : 'Mock data active.';
      footballStatus.append(dot, text);
    }
  };

  const updateNavigationVisibility = () => {
    const role = state.role;
    const permissions = {
      fan: ['dashboard-view', 'map-view', 'queues-view', 'transit-view', 'accessibility-view', 'settings-view'],
      staff: ['dashboard-view', 'map-view', 'incidents-view', 'gates-view', 'queues-view', 'volunteers-view', 'settings-view'],
      organizer: ['dashboard-view', 'map-view', 'incidents-view', 'gates-view', 'sustainability-view', 'volunteers-view', 'settings-view']
    };

    const allowed = permissions[role] || permissions.fan;

    // Sidebar items
    $$('.nav-item').forEach((item) => {
      const view = item.dataset.view;
      const show = allowed.includes(view);
      item.style.display = show ? 'flex' : 'none';
    });

    // Mobile nav items
    $$('.mobile-nav-item').forEach((item) => {
      const view = item.dataset.view;
      const show = allowed.includes(view);
      item.style.display = show ? 'flex' : 'none';
    });

    // If active view is now blocked, redirect to dashboard-view
    if (!allowed.includes(state.selectedView)) {
      setView('dashboard-view');
    }
  };

  const renderAll = () => {
    updateNavigationVisibility();
    renderHeader();
    renderDashboard();
    renderMap();
    renderMapInsights();
    renderGates();
    renderQueues();
    renderTransit();
    renderSustainability();
    renderStaffDeployment();
    renderAccessibleRoute();
    emit('stadium:state-updated', getContext());
  };

  const updateClock = () => {
    state.matchMinute += 1;
    const minutesToKickoff = Math.max(0, 75 - state.matchMinute);
    state.matchState = minutesToKickoff ? `T-${minutesToKickoff} pre-match` : `Match ${state.matchMinute - 75}'`;
    const clock = $('#match-clock');
    if (clock) clock.textContent = state.matchState;
  };

  const mutateSimulation = (mode) => {
    if (mode === 'surge') {
      state.sectors = state.sectors.map((sector) => sector.id === 'east' || sector.id === 'south'
        ? { ...sector, density: Number((sector.density + 0.8).toFixed(1)), trend: sector.trend + 0.2 }
        : sector);
      toast('Crowd surge simulated', 'East and south sectors are now under higher density.', 'warning');
    } else if (mode === 'gate') {
      state.gates = state.gates.map((gate) => gate.id === 'A'
        ? { ...gate, waitMinutes: gate.waitMinutes + 5, throughputPerMin: Math.max(40, gate.throughputPerMin - 25) }
        : gate);
      toast('Gate delay simulated', 'Gate A throughput dropped and optimizer data changed.', 'warning');
    } else if (mode === 'clear') {
      Object.assign(state, structuredClone(initialState), { role: state.role, venueId: state.venueId });
      toast('Simulation reset', 'Crowd, gate, queue, and incident data returned to baseline.', 'success');
    }
    renderAll();
  };

  const bindEvents = () => {
    $$('.nav-item, .mobile-nav-item').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
    $$('[data-view-target]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.viewTarget)));
    $('#sidebar-toggle')?.addEventListener('click', () => $('#app-shell')?.classList.toggle('sidebar-collapsed'));
    $('#venue-selector')?.addEventListener('change', (event) => {
      state.venueId = event.target.value;
      toast('Venue changed', `Operational context set to ${getVenue().name}.`, 'info');
      renderAll();
    });
    $$('.role-btn').forEach((button) => button.addEventListener('click', () => {
      state.role = button.dataset.role;
      $$('.role-btn').forEach((roleButton) => {
        const active = roleButton.dataset.role === state.role;
        roleButton.classList.toggle('active', active);
        roleButton.setAttribute('aria-pressed', String(active));
      });
      toast('Role switched', `${state.role} dashboard controls are active.`, 'info');
      renderAll();
    }));

    $('#refresh-dashboard')?.addEventListener('click', () => {
      state.sectors = state.sectors.map((sector) => ({ ...sector, density: Number(Math.max(1.8, sector.density + (Math.random() - 0.45) * 0.5).toFixed(1)) }));
      state.queues = state.queues.map((queue) => ({ ...queue, waitMinutes: Math.max(1, Math.round(queue.waitMinutes + (Math.random() - 0.4) * 3)) }));
      toast('Simulation refreshed', 'Live operations data has been recalculated.', 'success');
      renderAll();
    });

    $('#reroute-crowd')?.addEventListener('click', () => {
      const route = window.StadiumAI.planEvacuationRoute({ start: { x: 260, y: 180 } }, state.blockedExits);
      const line = $('#evacuation-route-line');
      if (line) line.setAttribute('points', route.coordinates.map((point) => `${point.x},${point.y}`).join(' '));
      toast('Reroute plan ready', `Use ${route.exit.name}; confidence ${(route.confidence * 100).toFixed(0)}%.`, 'warning');
      $('#emergency-overlay')?.classList.add('active');
      $('#emergency-routes')?.replaceChildren(...route.instructions.slice(1, 3).map((instruction) => {
        const card = create('div', 'emergency-route-card');
        card.textContent = instruction;
        return card;
      }));
    });
    $('#emergency-dismiss')?.addEventListener('click', () => $('#emergency-overlay')?.classList.remove('active'));
    $('#optimize-gates')?.addEventListener('click', () => {
      const plan = window.StadiumAI.optimizeGateFlow(state.gates);
      toast('Gate optimization', plan.summary, plan.status === 'Green' ? 'success' : 'warning');
      renderGates();
    });
    $('#predict-queues')?.addEventListener('click', () => {
      toast('Queue forecast updated', 'Concession and restroom predictions refreshed.', 'info');
      renderQueues();
    });
    $('#send-transit-alert')?.addEventListener('click', () => toast('Transit alert sent', 'Fans were directed to lower-load shuttle and rail options.', 'info'));
    $('#recalculate-sustainability')?.addEventListener('click', () => {
      state.sustainability.wasteDiversionPct = Math.min(95, state.sustainability.wasteDiversionPct + 2);
      toast('Sustainability updated', 'Waste-diversion score improved by simulation input.', 'success');
      renderSustainability();
    });
    $('#plan-accessible-route')?.addEventListener('click', () => {
      setView('map-view');
      $('#reroute-crowd')?.click();
    });
    $('#recommend-staff')?.addEventListener('click', () => {
      toast('Deployment recommendation ready', window.StadiumAI.recommendStaffDeployment(state.sectors, state.incidents).summary, 'warning');
      renderStaffDeployment();
    });
    $('#high-contrast-toggle')?.addEventListener('change', (event) => document.body.classList.toggle('high-contrast', event.target.checked));
    $('#large-text-toggle')?.addEventListener('change', (event) => document.body.classList.toggle('large-text', event.target.checked));
    $('#save-api-key')?.addEventListener('click', () => {
      try {
        window.GeminiClient.saveApiKey($('#gemini-api-key')?.value || '');
        $('#gemini-api-key').value = '';
        toast('API key saved', 'Gemini responses will be attempted before local fallback.', 'success');
      } catch (error) {
        toast('API key rejected', error.message, 'danger');
      }
      renderHeader();
    });
    $('#clear-api-key')?.addEventListener('click', () => {
      window.GeminiClient.clearApiKey();
      $('#gemini-api-key').value = '';
      toast('API key cleared', 'Local fallback engine is active.', 'info');
      renderHeader();
    });
    $('#save-football-key')?.addEventListener('click', () => {
      try {
        window.FootballClient.saveApiKey($('#football-api-key')?.value || '');
        $('#football-api-key').value = '';
        toast('Football token saved', 'Matches and statistics will load live from Football-Data.org.', 'success');
      } catch (error) {
        toast('Token rejected', error.message, 'danger');
      }
      renderHeader();
    });
    $('#clear-football-key')?.addEventListener('click', () => {
      window.FootballClient.clearApiKey();
      $('#football-api-key').value = '';
      toast('Football token cleared', 'Mock data mode is active.', 'info');
      renderHeader();
    });
    $('#simulate-crowd-surge')?.addEventListener('click', () => (window.mutateSimulation || mutateSimulation)('surge'));
    $('#simulate-gate-delay')?.addEventListener('click', () => (window.mutateSimulation || mutateSimulation)('gate'));
    $('#simulate-clear-state')?.addEventListener('click', () => (window.mutateSimulation || mutateSimulation)('clear'));
    $('#notification-button')?.addEventListener('click', () => setView('incidents-view'));
  };

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    renderAll();
    updateClock();
    setInterval(updateClock, 60000);
  });

  window.StadiumApp = {
    state,
    initialState,
    venues,
    getContext,
    renderAll,
    setView,
    toast,
    announce
  };
})();
