/**
 * FIFA 2026 Smart Stadium - Interactive Stadium Map
 * Handles heatmap rendering, incident pins, AI predictions, tooltips, and controls
 */

class StadiumMap {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.svg = null;
    this.tooltip = null;
    this.currentZoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.overlays = {
      heatmap: true,
      incidents: true,
      predictions: true
    };
    this.sectorData = new Map();
    this.incidents = new Map();
    this.predictions = new Map();
    
    this.init();
  }

  init() {
    this.loadSVG().then(() => {
      this.setupTooltip();
      this.setupControls();
      this.setupInteractivity();
      this.updateHeatmap();
    });
  }

  async loadSVG() {
    try {
      const response = await fetch('assets/stadium-map.svg');
      const svgText = await response.text();
      const legend = this.container.querySelector('.map-legend');
      const wrapper = document.createElement('div');
      wrapper.innerHTML = svgText;
      const svg = wrapper.querySelector('svg');
      if (svg) {
        svg.classList.add('map-svg');
        svg.style.width = '100%';
        svg.style.height = 'auto';
        svg.style.display = 'block';
        if (legend) {
          this.container.insertBefore(svg, legend);
        } else {
          this.container.appendChild(svg);
        }
        this.svg = svg;
      }
    } catch (err) {
      console.warn('Stadium SVG load failed, using inline fallback:', err);
      this.svg = this.container.querySelector('svg');
    }
  }

  setupTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'map-tooltip';
    this.container.style.position = 'relative';
    this.container.appendChild(this.tooltip);
  }

  setupControls() {
    const controls = document.createElement('div');
    controls.className = 'map-controls';
    controls.innerHTML = `
      <button class="btn-icon" data-action="zoom-in" title="Zoom In">+</button>
      <button class="btn-icon" data-action="zoom-out" title="Zoom Out">-</button>
      <button class="btn-icon" data-action="reset" title="Reset View">R</button>
      <button class="btn-icon" data-action="toggle-heatmap" title="Toggle Heatmap">H</button>
      <button class="btn-icon" data-action="toggle-incidents" title="Toggle Incidents">I</button>
      <button class="btn-icon" data-action="toggle-predictions" title="Toggle Predictions">P</button>
    `;
    this.container.appendChild(controls);

    controls.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (!action) return;
      
      switch(action) {
        case 'zoom-in': this.zoomIn(); break;
        case 'zoom-out': this.zoomOut(); break;
        case 'reset': this.resetView(); break;
        case 'toggle-heatmap': this.toggleOverlay('heatmap'); break;
        case 'toggle-incidents': this.toggleOverlay('incidents'); break;
        case 'toggle-predictions': this.toggleOverlay('predictions'); break;
      }
    });
  }

  setupInteractivity() {
    // Sector hover and click
    this.svg.addEventListener('mouseover', (e) => {
      if (e.target.classList.contains('sector')) {
        this.showTooltip(e, e.target.id);
      }
    });

    this.svg.addEventListener('mousemove', (e) => {
      if (e.target.classList.contains('sector')) {
        this.updateTooltipPosition(e);
      }
    });

    this.svg.addEventListener('mouseout', (e) => {
      if (e.target.classList.contains('sector')) {
        this.hideTooltip();
      }
    });

    this.svg.addEventListener('click', (e) => {
      if (e.target.classList.contains('sector')) {
        this.selectSector(e.target.id);
      }
    });

    // Pan functionality
    this.svg.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.svg.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.panX += dx;
      this.panY += dy;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.applyTransform();
    });

    document.addEventListener('mouseup', () => {
      this.isDragging = false;
      if (this.svg) this.svg.style.cursor = 'grab';
    });

    // Wheel zoom
    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.currentZoom = Math.max(0.5, Math.min(3, this.currentZoom * delta));
      this.applyTransform();
    });
  }

  showTooltip(e, sectorId) {
    const data = this.sectorData.get(sectorId);
    if (!data) return;

    this.tooltip.innerHTML = `
      <div class="map-tooltip-title">${sectorId.replace('sector-', 'Sector ')}</div>
      <div class="map-tooltip-row">
        <span class="map-tooltip-label">Density:</span>
        <span class="map-tooltip-value">${data.density}%</span>
      </div>
      <div class="map-tooltip-row">
        <span class="map-tooltip-label">Status:</span>
        <span class="map-tooltip-value">${data.status}</span>
      </div>
      <div class="map-tooltip-row">
        <span class="map-tooltip-label">Capacity:</span>
        <span class="map-tooltip-value">${data.occupied}/${data.capacity}</span>
      </div>
    `;
    this.tooltip.classList.add('visible');
    this.updateTooltipPosition(e);
  }

  updateTooltipPosition(e) {
    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left + 10;
    const y = e.clientY - rect.top - 10;
    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  hideTooltip() {
    this.tooltip.classList.remove('visible');
  }

  selectSector(sectorId) {
    const sector = this.svg.querySelector(`#${sectorId}`);
    if (sector) {
      this.svg.querySelectorAll('.sector').forEach(s => s.classList.remove('selected'));
      sector.classList.add('selected');
    }
    
    // Dispatch custom event for parent components
    const event = new CustomEvent('sector-selected', {
      detail: { sectorId, data: this.sectorData.get(sectorId) }
    });
    this.container.dispatchEvent(event);
  }

  zoomIn() {
    this.currentZoom = Math.min(3, this.currentZoom * 1.2);
    this.applyTransform();
  }

  zoomOut() {
    this.currentZoom = Math.max(0.5, this.currentZoom / 1.2);
    this.applyTransform();
  }

  resetView() {
    this.currentZoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.applyTransform();
  }

  applyTransform() {
    if (!this.svg) return;
    this.svg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.currentZoom})`;
    this.svg.style.transformOrigin = 'center center';
  }

  toggleOverlay(type) {
    this.overlays[type] = !this.overlays[type];
    switch(type) {
      case 'heatmap': this.updateHeatmap(); break;
      case 'incidents': this.updateIncidents(); break;
      case 'predictions': this.updatePredictions(); break;
    }
  }

  updateSectorData(sectorId, data) {
    this.sectorData.set(sectorId, data);
    this.updateHeatmap();
  }

  updateHeatmap() {
    if (!this.overlays.heatmap) {
      this.svg.querySelectorAll('.sector').forEach(s => {
        s.classList.remove('density-safe', 'density-moderate', 'density-crowded', 'density-critical');
      });
      return;
    }

    this.sectorData.forEach((data, sectorId) => {
      const sector = this.svg.querySelector(`#${sectorId}`);
      if (!sector) return;

      sector.classList.remove('density-safe', 'density-moderate', 'density-crowded', 'density-critical');
      
      const density = data.density || 0;
      if (density >= 90) {
        sector.classList.add('density-critical');
      } else if (density >= 70) {
        sector.classList.add('density-crowded');
      } else if (density >= 40) {
        sector.classList.add('density-moderate');
      } else {
        sector.classList.add('density-safe');
      }
    });
  }

  addIncident(id, x, y, type, severity) {
    this.incidents.set(id, { x, y, type, severity });
    this.updateIncidents();
  }

  removeIncident(id) {
    this.incidents.delete(id);
    this.updateIncidents();
  }

  updateIncidents() {
    const layer = this.svg.querySelector('#incident-layer');
    if (!layer) return;

    layer.innerHTML = '';
    if (!this.overlays.incidents) return;

    this.incidents.forEach((incident, id) => {
      const circle = document.createNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', incident.x);
      circle.setAttribute('cy', incident.y);
      circle.setAttribute('r', '8');
      circle.setAttribute('class', 'incident-pin-dot');
      circle.setAttribute('fill', this.getIncidentColor(incident.severity));
      layer.appendChild(circle);
    });
  }

  getIncidentColor(severity) {
    switch(severity) {
      case 'critical': return '#FF3860';
      case 'high': return '#FFB300';
      case 'medium': return '#00F0FF';
      default: return '#00FF87';
    }
  }

  addPrediction(id, path, type) {
    this.predictions.set(id, { path, type });
    this.updatePredictions();
  }

  updatePredictions() {
    const layer = this.svg.querySelector('#prediction-layer');
    if (!layer) return;

    layer.innerHTML = '';
    if (!this.overlays.predictions) return;

    this.predictions.forEach((prediction, id) => {
      const path = document.createNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', prediction.path);
      path.setAttribute('class', 'prediction-bottleneck');
      layer.appendChild(path);
    });
  }

  // Public API for external updates
  setSectorDensity(sectorId, density, occupied, capacity) {
    const status = density >= 90 ? 'critical' : density >= 70 ? 'crowded' : density >= 40 ? 'moderate' : 'safe';
    this.updateSectorData(sectorId, { density, occupied, capacity, status });
  }

  refresh() {
    this.updateHeatmap();
    this.updateIncidents();
    this.updatePredictions();
  }
}

// Export for module usage or global access
window.StadiumMap = StadiumMap;