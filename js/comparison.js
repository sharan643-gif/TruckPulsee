/* ═══════════════════════════════════════════════════════════════
   COMPARISON — Side-by-side vehicle comparison engine
   Runs two independent simulators and renders delta indicators
   ═══════════════════════════════════════════════════════════════ */

const Comparison = (() => {
  'use strict';

  let active = false;
  let intervalId = null;
  let tickCount = 0;

  // ─── Vehicle A and B state ───
  let stateA = null;
  let stateB = null;
  let vehicleA = null;
  let vehicleB = null;

  // ─── Gauge definitions (reused from Simulator) ───
  const gaugeDefs = {
    rpm:        { min: 0,    max: 3000, unit: 'RPM', decimals: 0, invert: false },
    temp:       { min: 40,   max: 120,  unit: '°C',  decimals: 1, invert: false },
    voltage:    { min: 10,   max: 16,   unit: 'V',   decimals: 1, invert: true },
    vibration:  { min: 0,    max: 2.0,  unit: 'g',   decimals: 2, invert: false },
    oilPressure:{ min: 20,   max: 80,   unit: 'PSI', decimals: 0, invert: true },
    fuelRate:   { min: 0,    max: 40,   unit: 'L/h', decimals: 1, invert: false },
    engineLoad: { min: 0,    max: 100,  unit: '%',   decimals: 0, invert: false },
    turboBoost: { min: 0,    max: 3.0,  unit: 'bar', decimals: 2, invert: false },
  };

  const gaugeLabels = {
    rpm: 'RPM', temp: 'Coolant', voltage: 'Voltage', vibration: 'Vibration',
    oilPressure: 'Oil PSI', fuelRate: 'Fuel Rate', engineLoad: 'Load', turboBoost: 'Turbo',
  };

  /* ─── Create simulation state for a vehicle ─── */
  function createState(vehicle) {
    return {
      rpm: vehicle?.rpm || 1800,
      temp: vehicle?.temp || 85,
      voltage: vehicle?.voltage || 13.8,
      vibration: vehicle?.vibration || 0.3,
      oilPressure: 52,
      fuelRate: 18,
      engineLoad: 45,
      turboBoost: 1.2,
    };
  }

  /* ─── Simulate one step for a state ─── */
  function simulateStep(state, seed) {
    const t = tickCount + seed;
    const cyclePhase = Math.sin(t * 0.02);
    const fastNoise = Math.sin(t * 0.15) * 0.3;

    state.rpm = lerp(state.rpm, 1600 + cyclePhase * 400 + fastNoise * 50, 0.08);
    state.temp = lerp(state.temp, 82 + cyclePhase * 8 + (state.rpm / 3000) * 10, 0.03);
    state.voltage = lerp(state.voltage, 14.2 - (state.rpm / 3000) * 1.5, 0.05);
    state.vibration = lerp(state.vibration, 0.15 + (state.rpm / 3000) * 0.4 + (Math.random() < 0.05 ? 0.4 : 0), 0.1);
    state.oilPressure = lerp(state.oilPressure, 55 - cyclePhase * 8, 0.04);
    state.fuelRate = lerp(state.fuelRate, 5 + (state.rpm / 3000) * 25, 0.06);
    state.engineLoad = lerp(state.engineLoad, 30 + cyclePhase * 35 + fastNoise * 5, 0.07);
    state.turboBoost = lerp(state.turboBoost, 0.5 + (state.engineLoad / 100) * 2.0, 0.05);

    Object.keys(state).forEach(k => { state[k] = Math.max(0, state[k]); });
    return state;
  }

  function lerp(c, t, f) { return c + (t - c) * f; }

  /* ─── Render a gauge for comparison (smaller, uses prefix for canvas IDs) ─── */
  function drawCompareGauge(canvasId, value, def) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 130;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = 50;
    const lineWidth = 6;

    const startAngle = (135 * Math.PI) / 180;
    const endAngle = (405 * Math.PI) / 180;
    const totalSweep = endAngle - startAngle;
    const normalized = Math.max(0, Math.min(1, (value - def.min) / (def.max - def.min)));
    const valueAngle = startAngle + normalized * totalSweep;

    // Color based on position in range
    const pct = normalized;
    let color = pct < 0.6 ? '#6ee7b7' : pct < 0.8 ? '#fbbf24' : '#ef4444';
    if (def.invert) color = pct > 0.4 ? '#ef4444' : pct > 0.2 ? '#fbbf24' : '#6ee7b7';

    ctx.clearRect(0, 0, size, size);

    // Background track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Value arc
    if (normalized > 0.005) {
      const grad = ctx.createLinearGradient(
        cx + Math.cos(startAngle) * radius, cy + Math.sin(startAngle) * radius,
        cx + Math.cos(valueAngle) * radius, cy + Math.sin(valueAngle) * radius
      );
      grad.addColorStop(0, color + '30');
      grad.addColorStop(1, color);

      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, valueAngle);
      ctx.strokeStyle = grad;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Glow
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, valueAngle);
      ctx.strokeStyle = color + '18';
      ctx.lineWidth = lineWidth + 6;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Center text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.font = `bold 22px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillText(def.decimals > 0 ? value.toFixed(def.decimals) : Math.round(value).toLocaleString(), cx, cy - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(def.unit, cx, cy + 14);
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER — Build comparison gauge rows
     ═══════════════════════════════════════════════════════════ */
  function renderGauges() {
    const container = document.getElementById('compareGaugeGrid');
    if (!container) return;

    const keys = Object.keys(gaugeDefs);

    container.innerHTML = keys.map((key) => {
      const def = gaugeDefs[key];
      const label = gaugeLabels[key];
      return `
        <div class="compare-gauge-row">
          <div class="compare-gauge-side a">
            <canvas class="gauge-canvas" id="cmp-a-${key}"></canvas>
            <div class="gauge-info">
              <span class="gauge-value" id="cmp-a-${key}-val">—</span>
              <span class="gauge-label">${label}</span>
            </div>
          </div>
          <div class="compare-delta">
            <span class="compare-delta-val neutral" id="cmp-delta-${key}">—</span>
            <span class="compare-delta-label">Δ</span>
          </div>
          <div class="compare-gauge-side b">
            <canvas class="gauge-canvas" id="cmp-b-${key}"></canvas>
            <div class="gauge-info">
              <span class="gauge-value" id="cmp-b-${key}-val">—</span>
              <span class="gauge-label">${label}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ─── Update vehicle info bars ─── */
  function updateVehicleBars() {
    const barA = document.getElementById('compareBarA');
    const barB = document.getElementById('compareBarB');
    if (!barA || !barB) return;

    if (vehicleA) {
      barA.querySelector('.compare-vb-name').textContent = vehicleA.name;
      barA.querySelector('.compare-vb-plate').textContent = vehicleA.plate;
      const hA = barA.querySelector('.compare-vb-health');
      hA.textContent = vehicleA.health + '%';
      hA.style.color = vehicleA.health >= 70 ? '#34d399' : vehicleA.health >= 50 ? '#fbbf24' : '#ef4444';
      barA.querySelector('.vehicle-avatar').textContent = vehicleA.id;
      barA.querySelector('.vehicle-avatar').className = 'vehicle-avatar ' + FleetData.getHealthClass(vehicleA.health);
    }

    if (vehicleB) {
      barB.querySelector('.compare-vb-name').textContent = vehicleB.name;
      barB.querySelector('.compare-vb-plate').textContent = vehicleB.plate;
      const hB = barB.querySelector('.compare-vb-health');
      hB.textContent = vehicleB.health + '%';
      hB.style.color = vehicleB.health >= 70 ? '#34d399' : vehicleB.health >= 50 ? '#fbbf24' : '#ef4444';
      barB.querySelector('.vehicle-avatar').textContent = vehicleB.id;
      barB.querySelector('.vehicle-avatar').className = 'vehicle-avatar ' + FleetData.getHealthClass(vehicleB.health);
    }
  }

  /* ─── Render selectors ─── */
  function renderSelectors() {
    const selA = document.getElementById('compareSelectA');
    const selB = document.getElementById('compareSelectB');
    if (!selA || !selB) return;

    const options = FleetData.vehicles.map(v => `<option value="${v.id}">${v.id} — ${v.name}</option>`).join('');
    selA.innerHTML = options;
    selB.innerHTML = options;

    // Default: T-01 vs T-04 (healthy vs critical)
    selA.value = 'T-01';
    selB.value = 'T-04';

    selA.addEventListener('change', () => {
      vehicleA = FleetData.getVehicleById(selA.value);
      stateA = createState(vehicleA);
      updateVehicleBars();
      updateSummaryTable();
    });

    selB.addEventListener('change', () => {
      vehicleB = FleetData.getVehicleById(selB.value);
      stateB = createState(vehicleB);
      updateVehicleBars();
      updateSummaryTable();
    });

    // Initial state
    vehicleA = FleetData.getVehicleById('T-01');
    vehicleB = FleetData.getVehicleById('T-04');
    stateA = createState(vehicleA);
    stateB = createState(vehicleB);
  }

  /* ─── Swap button ─── */
  function initSwap() {
    document.getElementById('compareSwapBtn')?.addEventListener('click', () => {
      const selA = document.getElementById('compareSelectA');
      const selB = document.getElementById('compareSelectB');
      const tmp = selA.value;
      selA.value = selB.value;
      selB.value = tmp;
      selA.dispatchEvent(new Event('change'));
      selB.dispatchEvent(new Event('change'));
    });
  }

  /* ═══════════════════════════════════════════════════════════
     UPDATE LOOP
     ═══════════════════════════════════════════════════════════ */
  function updateUI() {
    if (!stateA || !stateB) return;

    const keys = Object.keys(gaugeDefs);

    keys.forEach((key) => {
      const def = gaugeDefs[key];

      // Draw gauges
      drawCompareGauge(`cmp-a-${key}`, stateA[key], def);
      drawCompareGauge(`cmp-b-${key}`, stateB[key], def);

      // Value labels
      const vA = def.decimals > 0 ? stateA[key].toFixed(def.decimals) : Math.round(stateA[key]).toLocaleString();
      const vB = def.decimals > 0 ? stateB[key].toFixed(def.decimals) : Math.round(stateB[key]).toLocaleString();

      const elA = document.getElementById(`cmp-a-${key}-val`);
      const elB = document.getElementById(`cmp-b-${key}-val`);
      if (elA) elA.textContent = vA;
      if (elB) elB.textContent = vB;

      // Delta
      const delta = stateA[key] - stateB[key];
      const deltaEl = document.getElementById(`cmp-delta-${key}`);
      if (deltaEl) {
        const absDelta = Math.abs(delta).toFixed(def.decimals);
        const sign = delta > 0.01 ? '+' : delta < -0.01 ? '' : '±';
        deltaEl.textContent = sign + absDelta;
        deltaEl.className = 'compare-delta-val ' + (
          Math.abs(delta) < (def.max - def.min) * 0.05 ? 'neutral' :
          (delta > 0 && !def.invert) || (delta < 0 && def.invert) ? 'positive' : 'negative'
        );
      }
    });
  }

  /* ─── Summary table ─── */
  function updateSummaryTable() {
    const tbody = document.getElementById('compareSummaryBody');
    if (!tbody || !stateA || !stateB) return;

    const keys = Object.keys(gaugeDefs);
    tbody.innerHTML = keys.map((key) => {
      const def = gaugeDefs[key];
      const vA = def.decimals > 0 ? stateA[key].toFixed(def.decimals) : Math.round(stateA[key]);
      const vB = def.decimals > 0 ? stateB[key].toFixed(def.decimals) : Math.round(stateB[key]);
      const delta = stateA[key] - stateB[key];
      const sign = delta > 0.01 ? '+' : delta < -0.01 ? '' : '±';
      const deltaStr = sign + Math.abs(delta).toFixed(def.decimals) + ' ' + def.unit;

      return `
        <tr>
          <td>${gaugeLabels[key]}</td>
          <td class="val-a">${vA} ${def.unit}</td>
          <td class="delta-cell">${deltaStr}</td>
          <td class="val-b">${vB} ${def.unit}</td>
        </tr>
      `;
    }).join('');
  }

  /* ═══════════════════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════════════════ */
  function start() {
    if (active) stop();
    tickCount = 0;
    active = true;

    renderSelectors();
    renderGauges();
    initSwap();
    updateVehicleBars();

    // Update at 1Hz
    intervalId = setInterval(() => {
      tickCount++;
      simulateStep(stateA, 0);
      simulateStep(stateB, 50); // offset seed so they differ
      updateUI();
      if (tickCount % 3 === 0) updateSummaryTable(); // update table less frequently
    }, 1000);

    // First render
    updateUI();
    updateSummaryTable();
  }

  function stop() {
    active = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  return { start, stop };
})();
