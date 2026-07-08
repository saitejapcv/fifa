(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const create = (tag, className = '') => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  };

  let activeFilter = 'all';
  let timerId = null;

  const severityClass = (severity) => {
    const normalized = String(severity || '').toLowerCase();
    if (normalized === 'red') return 'red';
    if (normalized === 'amber') return 'amber';
    return 'green';
  };

  const badgeClass = (severity) => {
    const normalized = String(severity || '').toLowerCase();
    if (normalized === 'red') return 'badge-danger';
    if (normalized === 'amber') return 'badge-warning';
    return 'badge-success';
  };

  const formatRemaining = (incident, triage) => {
    const elapsedMs = Date.now() - Number(incident.createdAt || Date.now());
    const remainingSeconds = Math.max(0, triage.slaMinutes * 60 - Math.floor(elapsedMs / 1000));
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = String(remainingSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const shouldShow = (incident, triage) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'open') return incident.status !== 'resolved';
    return triage.severity.toLowerCase() === activeFilter;
  };

  const createIncidentCard = (incident) => {
    const triage = window.StadiumAI.triageIncident(incident);
    const card = create('article', 'incident-card');
    const severity = create('div', `incident-severity ${severityClass(triage.severity)}`);
    const body = create('div', 'incident-body');
    const row = create('div', 'card-header');
    const title = create('div', 'incident-type');
    const badge = create('span', `badge ${badgeClass(triage.severity)}`);
    const location = create('div', 'incident-location');
    const action = create('p');
    const meta = create('div', 'incident-meta');
    const timer = create('span', 'incident-timer');
    const teams = create('span');
    const resolve = create('button', 'btn btn-success btn-sm');

    title.textContent = `${triage.type} - ${incident.id}`;
    badge.textContent = triage.severity;
    location.textContent = triage.location;
    action.textContent = triage.action;
    timer.dataset.incidentTimer = incident.id;
    timer.textContent = `SLA ${formatRemaining(incident, triage)}`;
    teams.textContent = triage.requiredTeams.join(', ');
    resolve.type = 'button';
    resolve.textContent = incident.status === 'resolved' ? 'Resolved' : 'Resolve';
    resolve.disabled = incident.status === 'resolved';
    resolve.addEventListener('click', () => resolveIncident(incident.id));

    row.append(title, badge);
    meta.append(timer, teams, resolve);
    body.append(row, location, action, meta);
    card.append(severity, body);
    return card;
  };

  const getFilteredIncidents = () => {
    const incidents = window.StadiumApp?.state?.incidents || [];
    return incidents
      .map((incident) => ({ incident, triage: window.StadiumAI.triageIncident(incident) }))
      .filter(({ incident, triage }) => shouldShow(incident, triage))
      .sort((a, b) => {
        const order = { Red: 3, Amber: 2, Green: 1 };
        return order[b.triage.severity] - order[a.triage.severity] || Number(b.incident.createdAt) - Number(a.incident.createdAt);
      })
      .map(({ incident }) => incident);
  };

  const renderIncidents = () => {
    const grid = $('#incident-grid');
    if (!grid || !window.StadiumApp) return;
    const incidents = getFilteredIncidents();
    if (!incidents.length) {
      const empty = create('div', 'card');
      empty.textContent = 'No incidents match the current filter.';
      grid.replaceChildren(empty);
      return;
    }
    grid.replaceChildren(...incidents.map(createIncidentCard));
  };

  const updateTimers = () => {
    const incidents = window.StadiumApp?.state?.incidents || [];
    $$('[data-incident-timer]').forEach((node) => {
      const incident = incidents.find((item) => item.id === node.dataset.incidentTimer);
      if (!incident) return;
      const triage = window.StadiumAI.triageIncident(incident);
      node.textContent = incident.status === 'resolved'
        ? 'Resolved'
        : `SLA ${formatRemaining(incident, triage)}`;
    });
  };

  const resolveIncident = (incidentId) => {
    const incident = window.StadiumApp.state.incidents.find((item) => item.id === incidentId);
    if (!incident) return;
    incident.status = 'resolved';
    window.StadiumApp.toast('Incident resolved', `${incident.id} has been removed from active SLA risk.`, 'success');
    window.StadiumApp.renderAll();
    renderIncidents();
  };

  const createSimulatedIncident = () => {
    const state = window.StadiumApp.state;
    const templates = [
      { type: 'Medical', location: 'North Concourse', crowdDensity: 4.9 },
      { type: 'Spill', location: 'Water Refill East', crowdDensity: 3.1 },
      { type: 'Security', location: 'Gate A queue', crowdDensity: 5.4 }
    ];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const incident = {
      id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
      ...template,
      minutesToKickoff: Math.max(0, 75 - state.matchMinute),
      status: 'open',
      createdAt: Date.now()
    };
    state.incidents.unshift(incident);
    const triage = window.StadiumAI.triageIncident(incident);
    window.StadiumApp.toast('Incident simulated', `${incident.type} at ${incident.location}: ${triage.severity}.`, triage.severity === 'Red' ? 'danger' : 'warning');
    window.StadiumApp.renderAll();
    renderIncidents();
  };

  const bindEvents = () => {
    $$('.filter-chip').forEach((button) => {
      button.addEventListener('click', () => {
        activeFilter = button.dataset.filter;
        $$('.filter-chip').forEach((chip) => chip.classList.toggle('active', chip === button));
        renderIncidents();
      });
    });
    $('#create-incident')?.addEventListener('click', createSimulatedIncident);
    window.addEventListener('stadium:state-updated', renderIncidents);
  };

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    renderIncidents();
    timerId = setInterval(updateTimers, 1000);
  });

  window.IncidentController = {
    renderIncidents,
    createSimulatedIncident,
    resolveIncident,
    stopTimers() {
      if (timerId) clearInterval(timerId);
    }
  };
})();
