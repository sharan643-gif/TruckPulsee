/* ═══════════════════════════════════════════════════════════════
   MAP — Leaflet map initialization and custom markers
   ═══════════════════════════════════════════════════════════════ */

const MapModule = (() => {
  'use strict';

  let fleetMap = null;
  let fuelMap = null;
  let mechanicsMap = null;
  let vehicleMarkers = {};
  let mechanicMarkers = {};
  let routeLines = [];
  let fleetMechanicPins = {};   // mechanic markers on fleet map
  let fleetConnectionLines = []; // lines from damaged trucks to mechanics

  /* ─── Dark map tile layer ─── */
  // CartoDB Dark Matter for dark theme
  const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const tileAttribution = '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://osm.org/copyright">OSM</a>';

  /* ─── Custom HTML marker icon ─── */
  function createVehicleIcon(vehicle) {
    const healthClass = FleetData.getHealthClass(vehicle.health);
    const showPulse = healthClass !== 'good';

    const html = `
      <div class="vehicle-marker ${healthClass}">
        <div class="vehicle-marker-glow"></div>
        <div class="vehicle-marker-pulse"></div>
        <div class="vehicle-marker-inner ${healthClass}">
          ${vehicle.id}
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: '', // disable Leaflet default icon class
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -24],
    });
  }

  function createMechanicIcon(mechanic) {
    const html = `
      <div class="mechanic-pin">
        <div class="mechanic-pin-head">
          <span class="mechanic-pin-icon">🔧</span>
        </div>
        <div class="mechanic-tooltip">
          <div class="mechanic-tooltip-name">${mechanic.name}</div>
          <div class="mechanic-tooltip-spec">${mechanic.specialty}</div>
          <div class="mechanic-tooltip-rating">⭐ ${mechanic.rating} · ${mechanic.distance}</div>
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: '',
      iconSize: [36, 44],
      iconAnchor: [18, 44],
      popupAnchor: [0, -44],
    });
  }

  /* ─── Initialize Fleet Map ─── */
  function initFleetMap() {
    if (fleetMap) return;

    const container = document.getElementById('fleetMap');
    if (!container) return;

    // Center on Mumbai (where mock data is)
    const center = [19.0760, 72.8777];

    fleetMap = L.map('fleetMap', {
      center,
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
    });

    // Add dark tiles
    L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(fleetMap);

    // Add zoom control (top-left for mobile)
    L.control.zoom({ position: 'bottomleft' }).addTo(fleetMap);

    // Add vehicle markers
    FleetData.vehicles.forEach((vehicle) => {
      const marker = L.marker([vehicle.lat, vehicle.lng], {
        icon: createVehicleIcon(vehicle),
      }).addTo(fleetMap);

      // Popup content
      marker.bindPopup(`
        <div style="min-width:150px;">
          <strong>${vehicle.id} · ${vehicle.name}</strong><br>
          <span style="color:${vehicle.health >= 70 ? '#34d399' : vehicle.health >= 50 ? '#fbbf24' : '#ef4444'}">
            Health: ${vehicle.health}%
          </span><br>
          <small>${vehicle.plate} · ${vehicle.driver}</small>
        </div>
      `);

      marker.on('click', () => {
        showVehicleSheet(vehicle);
      });

      vehicleMarkers[vehicle.id] = marker;
    });

    // Fit bounds to show all vehicles
    const bounds = L.latLngBounds(FleetData.vehicles.map(v => [v.lat, v.lng]));
    fleetMap.fitBounds(bounds.pad(0.3));

    // Place mechanic pins near damaged trucks
    placeMechanicPinsForDamaged();
  }

  /* ─── Initialize Fuel Map ─── */
  function initFuelMap() {
    if (fuelMap) return;

    const container = document.getElementById('fuelMap');
    if (!container) return;

    const center = [19.0760, 72.8777];
    fuelMap = L.map('fuelMap', {
      center,
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(tileUrl, {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(fuelMap);

    // Draw sample route lines
    const route1 = [
      [19.0760, 72.8777],
      [19.0800, 72.8850],
      [19.0900, 72.8950],
      [19.1000, 72.9100],
      [19.1100, 72.9300],
    ];

    const route2 = [
      [19.0760, 72.8777],
      [19.0700, 72.8700],
      [19.0600, 72.8600],
      [19.0500, 72.8500],
    ];

    L.polyline(route1, {
      color: '#34d399',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 8',
      lineCap: 'round',
    }).addTo(fuelMap);

    L.polyline(route2, {
      color: '#3b82f6',
      weight: 3,
      opacity: 0.5,
      dashArray: '8, 8',
      lineCap: 'round',
    }).addTo(fuelMap);
  }

  /* ─── Initialize Mechanics Map ─── */
  function initMechanicsMap() {
    if (mechanicsMap) return;

    const container = document.getElementById('mechanicsMap');
    if (!container) return;

    const center = [19.0760, 72.8777];
    mechanicsMap = L.map('mechanicsMap', {
      center,
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(tileUrl, {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(mechanicsMap);

    // Add mechanic pins
    FleetData.mechanics.forEach((mech) => {
      const marker = L.marker([mech.lat, mech.lng], {
        icon: createMechanicIcon(mech),
      }).addTo(mechanicsMap);

      marker.bindPopup(`
        <div style="min-width:170px;">
          <strong>${mech.name}</strong><br>
          <small>${mech.specialty}</small><br>
          <span style="color:#fbbf24">⭐ ${mech.rating}</span> · ${mech.distance}<br>
          ${mech.verified ? '<span style="color:#34d399">✓ Verified</span>' : ''}<br>
          <a href="tel:${mech.phone}" style="color:#60a5fa">${mech.phone}</a>
        </div>
      `);

      mechanicMarkers[mech.id] = marker;
    });

    const bounds = L.latLngBounds(FleetData.mechanics.map(m => [m.lat, m.lng]));
    mechanicsMap.fitBounds(bounds.pad(0.3));
  }

  /* ─── Create small mechanic icon for fleet map ─── */
  function createFleetMechanicIcon(mechanic) {
    const html = `
      <div class="fleet-mechanic-pin">
        <div class="fleet-mechanic-pin-head">
          <span>🔧</span>
        </div>
        <div class="fleet-mechanic-tooltip">
          <div class="fleet-mechanic-tooltip-name">${mechanic.name}</div>
          <div class="fleet-mechanic-tooltip-spec">${mechanic.specialty}</div>
          <div class="fleet-mechanic-tooltip-rating">⭐ ${mechanic.rating} · ${mechanic.distance}</div>
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: '',
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40],
    });
  }

  /* ─── Find nearest mechanic to a vehicle ─── */
  function findNearestMechanic(vehicle) {
    let nearest = null;
    let minDist = Infinity;

    FleetData.mechanics.forEach((mech) => {
      const dlat = mech.lat - vehicle.lat;
      const dlng = mech.lng - vehicle.lng;
      const dist = Math.sqrt(dlat * dlat + dlng * dlng);
      if (dist < minDist) {
        minDist = dist;
        nearest = mech;
      }
    });

    return nearest;
  }

  /* ─── Place mechanic pins for damaged trucks on fleet map ─── */
  function placeMechanicPinsForDamaged() {
    if (!fleetMap) return;

    // Clear old pins and lines
    Object.values(fleetMechanicPins).forEach((m) => fleetMap.removeLayer(m));
    fleetConnectionLines.forEach((l) => fleetMap.removeLayer(l));
    fleetMechanicPins = {};
    fleetConnectionLines = [];

    const damagedVehicles = FleetData.vehicles.filter((v) => v.health < 50);

    damagedVehicles.forEach((vehicle) => {
      const mechanic = findNearestMechanic(vehicle);
      if (!mechanic) return;

      // Add mechanic pin on fleet map
      const marker = L.marker([mechanic.lat, mechanic.lng], {
        icon: createFleetMechanicIcon(mechanic),
      }).addTo(fleetMap);

      marker.bindPopup(`
        <div style="min-width:170px;">
          <strong>🔧 ${mechanic.name}</strong><br>
          <small>${mechanic.specialty}</small><br>
          <span style="color:#fbbf24">⭐ ${mechanic.rating}</span> · ${mechanic.distance}<br>
          ${mechanic.verified ? '<span style="color:#34d399">✓ Verified</span>' : ''}<br>
          <a href="tel:${mechanic.phone}" style="color:#60a5fa">${mechanic.phone}</a>
        </div>
      `);

      fleetMechanicPins[vehicle.id] = marker;

      // Draw connection line from vehicle to mechanic
      const line = L.polyline(
        [[vehicle.lat, vehicle.lng], [mechanic.lat, mechanic.lng]],
        {
          color: '#ef4444',
          weight: 2,
          opacity: 0.6,
          dashArray: '8, 6',
          lineCap: 'round',
        }
      ).addTo(fleetMap);

      fleetConnectionLines.push(line);
    });
  }

  /* ─── Show vehicle info sheet ─── */
  function showVehicleSheet(vehicle) {
    const sheet = document.getElementById('vehicleSheet');
    if (!sheet) return;

    document.getElementById('sheetAvatar').textContent = vehicle.id;
    document.getElementById('sheetName').textContent = vehicle.name;
    document.getElementById('sheetPlate').textContent = vehicle.plate;
    document.getElementById('sheetRpm').textContent = vehicle.rpm.toLocaleString();
    document.getElementById('sheetTemp').textContent = vehicle.temp + '°C';
    document.getElementById('sheetVolt').textContent = vehicle.voltage + 'V';
    document.getElementById('sheetVib').textContent = vehicle.vibration + 'g';

    // Health badge
    const healthBadge = document.getElementById('sheetHealth');
    const healthClass = FleetData.getHealthClass(vehicle.health);
    healthBadge.className = 'health-badge' + (healthClass === 'good' ? '' : ' ' + healthClass);
    healthBadge.querySelector('.health-score').textContent = vehicle.health;
    healthBadge.querySelector('.health-label').textContent = FleetData.getHealthLabel(vehicle.health);

    // Show sheet with spring animation
    sheet.style.display = 'block';
    requestAnimationFrame(() => {
      sheet.classList.add('visible');
    });

    // Store current vehicle for detail view
    sheet.dataset.vehicleId = vehicle.id;

    // Show/hide Find Mechanic button based on vehicle health
    const findMechBtn = document.getElementById('sheetFindMechanic');
    if (findMechBtn) {
      findMechBtn.style.display = vehicle.health < 50 ? 'flex' : 'none';
      findMechBtn.dataset.vehicleId = vehicle.id;
    }
  }

  /* ─── Hide vehicle info sheet ─── */
  function hideVehicleSheet() {
    const sheet = document.getElementById('vehicleSheet');
    if (!sheet) return;
    sheet.classList.remove('visible');
    setTimeout(() => {
      sheet.style.display = 'none';
    }, 500);
  }

  /* ─── Simulate dynamic marker updates ─── */
  function startMarkerSimulation() {
    setInterval(() => {
      if (!fleetMap) return;

      FleetData.vehicles.forEach((vehicle) => {
        // Slight random movement to simulate live tracking
        const latDrift = (Math.random() - 0.5) * 0.0003;
        const lngDrift = (Math.random() - 0.5) * 0.0003;
        vehicle.lat += latDrift;
        vehicle.lng += lngDrift;

        const marker = vehicleMarkers[vehicle.id];
        if (marker) {
          marker.setLatLng([vehicle.lat, vehicle.lng]);
        }
      });

      // Refresh mechanic pins and connection lines after trucks move
      placeMechanicPinsForDamaged();
    }, 5000);
  }

  /* ─── Zoom map to show damaged truck + nearest mechanic ─── */
  function focusMechanicForVehicle(vehicleId) {
    if (!fleetMap) return;

    const vehicle = FleetData.getVehicleById(vehicleId);
    if (!vehicle) return;

    const mechanic = findNearestMechanic(vehicle);
    if (!mechanic) return;

    // Fit bounds to show both points
    const bounds = L.latLngBounds(
      [vehicle.lat, vehicle.lng],
      [mechanic.lat, mechanic.lng]
    );
    fleetMap.fitBounds(bounds.pad(0.5), { animate: true, duration: 1.0 });

    // Re-place mechanic pins to ensure they're visible
    placeMechanicPinsForDamaged();

    // Open popup on the mechanic pin
    const pin = fleetMechanicPins[vehicleId];
    if (pin) {
      setTimeout(() => pin.openPopup(), 800);
    }
  }

  /* ─── Invalidate map sizes (after page switch) ─── */
  function refreshMaps() {
    if (fleetMap) {
      setTimeout(() => fleetMap.invalidateSize(), 100);
    }
    if (fuelMap) {
      setTimeout(() => fuelMap.invalidateSize(), 100);
    }
    if (mechanicsMap) {
      setTimeout(() => mechanicsMap.invalidateSize(), 100);
    }
  }

  return {
    initFleetMap,
    initFuelMap,
    initMechanicsMap,
    showVehicleSheet,
    hideVehicleSheet,
    startMarkerSimulation,
    refreshMaps,
    focusMechanicForVehicle,
    get fleetMap() { return fleetMap; },
  };
})();
