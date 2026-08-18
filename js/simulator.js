/* ═══════════════════════════════════════════════════════════════
   SIMULATOR — Live engine data simulation & circular gauge rendering
   Simulates realistic truck ECU data at 1Hz update rate
   ═══════════════════════════════════════════════════════════════ */

const Simulator = (() => {
  'use strict';

  // ─── Simulation state ───
  let active = false;
  let intervalId = null;
  let currentVehicle = null;
  let tickCount = 0;

  // ─── Current simulated values (drift slowly over time) ───
  let state = {
    rpm: 1800,
    temp: 85,
    voltage: 13.8,
    vibration: 0.3,
    oilPressure: 52,
    fuelRate: 18,
    engineLoad: 45,
    turboBoost: 1.2,
    intakeTemp: 32,
    exhaustTemp: 340,
    oilTemp: 95,
    defLevel: 72,
    speed: 68,
    gpsSignal: 92,
  };

  // ─── Gauge definitions ───
  const gauges = {
    rpm:        { id: 'gaugeRpm',        valId: 'gaugeRpmVal',        min: 0,    max: 3000, unit: 'RPM', warn: 2200, crit: 2600, decimals: 0, colorGood: '#6ee7b7', colorWarn: '#fbbf24', colorCrit: '#ef4444' },
    temp:       { id: 'gaugeTemp',       valId: 'gaugeTempVal',       min: 40,   max: 120,  unit: '°C',  warn: 95,   crit: 105,  decimals: 1, colorGood: '#6ee7b7', colorWarn: '#fbbf24', colorCrit: '#ef4444' },
    voltage:    { id: 'gaugeVoltage',    valId: 'gaugeVoltageVal',    min: 10,   max: 16,   unit: 'V',   warn: 12.0, crit: 11.5, decimals: 1, colorGood: '#6ee7b7', colorWarn: '#fbbf24', colorCrit: '#ef4444' },
    vibration:  { id: 'gaugeVibration',  valId: 'gaugeVibrationVal',  min: 0,    max: 2.0,  unit: 'g',   warn: 0.8,  crit: 1.2,  decimals: 2, colorGood: '#6ee7b7', colorWarn: '#fbbf24', colorCrit: '#ef4444' },
    oilPressure:{ id: 'gaugeOilPressure', valId: 'gaugeOilPressureVal', min: 20, max: 80,   unit: 'PSI', warn: 30,   crit: 25,   decimals: 0, colorGood: '#6ee7b7', colorWarn: '#fbbf24', colorCrit: '#ef4444' },
    fuelRate:   { id: 'gaugeFuelRate',   valId: 'gaugeFuelRateVal',   min: 0,    max: 40,   unit: 'L/h', warn: 30,   crit: 35,   decimals: 1, colorGood: '#6ee7b7', colorWarn: '#fbbf24', colorCrit: '#ef4444' },
    engineLoad: { id: 'gaugeEngineLoad', valId: 'gaugeEngineLoadVal', min: 0,    max: 100,  unit: '%',   warn: 80,   crit: 92,   decimals: 0, colorGood: '#6ee7b7', colorWarn: '#fbbf24', colorCrit: '#ef4444' },
    turboBoost: { id: 'gaugeTurboBoost', valId: 'gaugeTurboBoostVal', min: 0,    max: 3.0,  unit: 'bar', warn: 2.2,  crit: 2.6,  decimals: 2, colorGood: '#6ee7b7', colorWarn: '#fbbf24', colorCrit: '#ef4444' },
  };

  /* ═══════════════════════════════════════════════════════════
     CIRCULAR GAUGE RENDERER
     Draws an arc gauge on a canvas element
     ═══════════════════════════════════════════════════════════ */
  function drawGauge(canvasId, value, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 160;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = 62;
    const lineWidth = 8;

    // Arc angles (270° sweep, starting from bottom-left)
    const startAngle = (135 * Math.PI) / 180;
    const endAngle = (405 * Math.PI) / 180;
    const totalSweep = endAngle - startAngle;

    // Normalized value (0–1)
    const normalized = Math.max(0, Math.min(1, (value - config.min) / (config.max - config.min)));
    const valueAngle = startAngle + normalized * totalSweep;

    // Determine color based on thresholds
    let color = config.colorGood;
    if (config.crit !== undefined) {
      const isWarn = config.decimals > 0
        ? (value >= config.warn && value < config.crit)
        : (value >= config.warn && value < config.crit);
      const isCrit = value >= config.crit;

      // For voltage/oil: warn is BELOW threshold
      const inverted = (config.unit === 'V' || config.unit === 'PSI');
      if (inverted) {
        color = value <= config.crit ? config.colorCrit : value <= config.warn ? config.colorWarn : config.colorGood;
      } else {
        color = isCrit ? config.colorCrit : isWarn ? config.colorWarn : config.colorGood;
      }
    }

    ctx.clearRect(0, 0, size, size);

    // Background track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Tick marks
    const numTicks = 10;
    for (let i = 0; i <= numTicks; i++) {
      const angle = startAngle + (i / numTicks) * totalSweep;
      const isMain = i % 5 === 0;
      const innerR = radius - (isMain ? 16 : 12);
      const outerR = radius - 8;

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
      ctx.strokeStyle = isMain ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)';
      ctx.lineWidth = isMain ? 1.5 : 1;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Value arc with gradient
    if (normalized > 0.005) {
      const gradient = ctx.createLinearGradient(
        cx + Math.cos(startAngle) * radius,
        cy + Math.sin(startAngle) * radius,
        cx + Math.cos(valueAngle) * radius,
        cy + Math.sin(valueAngle) * radius
      );
      gradient.addColorStop(0, color + '40');
      gradient.addColorStop(1, color);

      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, valueAngle);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Glow effect
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, valueAngle);
      ctx.strokeStyle = color + '25';
      ctx.lineWidth = lineWidth + 8;
      ctx.lineCap = 'round';
      ctx.stroke();

      // End dot
      const dotX = cx + Math.cos(valueAngle) * radius;
      const dotY = cy + Math.sin(valueAngle) * radius;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0a0f';
      ctx.fill();
    }

    // Center value text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.font = `bold 28px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillText(config.decimals > 0 ? value.toFixed(config.decimals) : Math.round(value).toLocaleString(), cx, cy - 4);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(config.unit, cx, cy + 16);
  }

  /* ═══════════════════════════════════════════════════════════
     DATA SIMULATION ENGINE
     Generates realistic, slowly-drifting ECU values
     ═══════════════════════════════════════════════════════════ */
  function simulateStep() {
    tickCount++;

    // Simulate driving patterns: cruise, accelerate, decelerate
    const cyclePhase = Math.sin(tickCount * 0.02); // ~3 min full cycle
    const fastNoise = Math.sin(tickCount * 0.15) * 0.3;

    // RPM: base ~1800 with driving cycle modulation
    const rpmTarget = 1600 + cyclePhase * 400 + fastNoise * 50;
    state.rpm = lerp(state.rpm, rpmTarget, 0.08);

    // Coolant temp: rises slowly with load
    const tempTarget = 82 + cyclePhase * 8 + (state.rpm / 3000) * 10;
    state.temp = lerp(state.temp, tempTarget, 0.03);

    // Voltage: drops slightly under load
    const voltTarget = 14.2 - (state.rpm / 3000) * 1.5;
    state.voltage = lerp(state.voltage, voltTarget, 0.05);

    // Vibration: correlated with RPM + random spikes
    const vibBase = 0.15 + (state.rpm / 3000) * 0.4;
    const vibSpike = Math.random() < 0.05 ? Math.random() * 0.5 : 0;
    state.vibration = lerp(state.vibration, vibBase + vibSpike, 0.1);

    // Oil pressure: inversely related to RPM somewhat
    const oilTarget = 55 - cyclePhase * 8;
    state.oilPressure = lerp(state.oilPressure, oilTarget, 0.04);

    // Fuel rate: proportional to RPM and load
    const fuelTarget = 5 + (state.rpm / 3000) * 25;
    state.fuelRate = lerp(state.fuelRate, fuelTarget, 0.06);

    // Engine load: tracks with RPM cycle
    const loadTarget = 30 + cyclePhase * 35 + fastNoise * 5;
    state.engineLoad = lerp(state.engineLoad, loadTarget, 0.07);

    // Turbo boost: follows engine load
    const turboTarget = 0.5 + (state.engineLoad / 100) * 2.0;
    state.turboBoost = lerp(state.turboBoost, turboTarget, 0.05);

    // Intake air temp: ambient + turbo heat
    state.intakeTemp = lerp(state.intakeTemp, 28 + state.turboBoost * 8 + Math.random(), 0.02);

    // Exhaust temp: follows RPM and load
    const exhaustTarget = 250 + (state.engineLoad / 100) * 200 + Math.random() * 20;
    state.exhaustTemp = lerp(state.exhaustTemp, exhaustTarget, 0.03);

    // Oil temp: slowly follows coolant
    state.oilTemp = lerp(state.oilTemp, state.temp + 7 + Math.random(), 0.01);

    // DEF level: slowly decreases
    if (tickCount % 100 === 0) state.defLevel = Math.max(5, state.defLevel - 0.1);
    state.defLevel = Math.max(5, state.defLevel);

    // Speed: follows RPM roughly
    state.speed = lerp(state.speed, 20 + (state.rpm / 3000) * 80 + fastNoise * 5, 0.06);

    // GPS: fluctuates
    state.gpsSignal = Math.min(100, Math.max(60, state.gpsSignal + (Math.random() - 0.5) * 4));

    // Clamp all values
    Object.keys(state).forEach(k => {
      if (typeof state[k] === 'number') {
        state[k] = Math.max(0, state[k]);
      }
    });
  }

  /* ─── Linear interpolation ─── */
  function lerp(current, target, factor) {
    return current + (target - current) * factor;
  }

  /* ═══════════════════════════════════════════════════════════
     UPDATE UI — Render all gauges and status indicators
     ═══════════════════════════════════════════════════════════ */
  function updateUI() {
    // Draw each gauge
    Object.entries(gauges).forEach(([key, config]) => {
      const value = state[key];
      drawGauge(config.id, value, config);

      // Update value display below gauge
      const valEl = document.getElementById(config.valId);
      if (valEl) {
        valEl.textContent = config.decimals > 0 ? value.toFixed(config.decimals) : Math.round(value).toLocaleString();
      }

      // Update card color state
      const card = document.querySelector(`.gauge-card[data-param="${key}"]`);
      if (card) {
        card.classList.remove('good', 'warning', 'critical');
        if (config.unit === 'V' || config.unit === 'PSI') {
          // Inverted: lower is worse
          if (value <= config.crit) card.classList.add('critical');
          else if (value <= config.warn) card.classList.add('warning');
          else card.classList.add('good');
        } else {
          if (value >= config.crit) card.classList.add('critical');
          else if (value >= config.warn) card.classList.add('warning');
          else card.classList.add('good');
        }
      }
    });

    // Update status indicators
    setIndicator('siIntake', state.intakeTemp, '°C', 40, 55);
    setIndicator('siExhaust', state.exhaustTemp, '°C', 500, 650);
    setIndicator('siOilTemp', state.oilTemp, '°C', 110, 125);
    setIndicator('siDEF', state.defLevel, '%', 15, 5);
    setIndicator('siSpeed', state.speed, 'km/h', null, null, true);
    setIndicator('siGPS', state.gpsSignal, '', 70, 40);
  }

  function setIndicator(prefix, value, unit, warnThresh, critThresh, invertThresh) {
    const iconEl = document.getElementById(prefix);
    const valEl = document.getElementById(prefix + 'Val');
    if (!iconEl || !valEl) return;

    let emoji = '🟢';
    if (critThresh !== null) {
      if (invertThresh) {
        // For GPS: lower is worse
        emoji = value <= critThresh ? '🔴' : value <= warnThresh ? '🟡' : '🟢';
      } else {
        emoji = value >= critThresh ? '🔴' : value >= warnThresh ? '🟡' : '🟢';
      }
    }
    iconEl.textContent = emoji;

    if (prefix === 'siSpeed') {
      valEl.textContent = Math.round(value) + ' km/h';
    } else if (prefix === 'siDEF') {
      valEl.textContent = value.toFixed(1) + '%';
    } else if (prefix === 'siGPS') {
      valEl.textContent = value > 80 ? 'Strong' : value > 50 ? 'Weak' : 'Poor';
    } else {
      valEl.textContent = Math.round(value) + unit;
    }
  }

  /* ═══════════════════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════════════════ */

  function start(vehicleId) {
    if (active) stop();
    currentVehicle = vehicleId;

    // Initialize with vehicle's baseline data
    const vehicle = FleetData.getVehicleById(vehicleId);
    if (vehicle) {
      state.rpm = vehicle.rpm || 1800;
      state.temp = vehicle.temp || 85;
      state.voltage = vehicle.voltage || 13.8;
      state.vibration = vehicle.vibration || 0.3;
      state.speed = 50 + Math.random() * 40;
    }

    tickCount = 0;
    active = true;

    // Update at 1Hz
    intervalId = setInterval(() => {
      simulateStep();
      updateUI();
    }, 1000);

    // First render immediately
    updateUI();
  }

  function stop() {
    active = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    currentVehicle = null;
  }

  function getState() {
    return { ...state };
  }

  function isActive() {
    return active;
  }

  return {
    start,
    stop,
    getState,
    isActive,
    drawGauge,
  };
})();
