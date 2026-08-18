/* ═══════════════════════════════════════════════════════════════
   NAVIGATION — Page routing, desktop sidebar, simulator lifecycle
   ═══════════════════════════════════════════════════════════════ */

const Navigation = (() => {
  'use strict';

  let currentPage = 'home';
  const pageStack = [];

  /* ─── Initialize all navigation ─── */
  function init() {
    initBottomNav();
    initSidebarNav();
    initButtons();
    initFleetSidebar();
    updateHighlight(false);
  }

  /* ─── Bottom nav (mobile) ─── */
  function initBottomNav() {
    const nav = document.getElementById('bottomNav');
    if (!nav) return;

    nav.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('click', () => navigateTo(item.dataset.page));
    });
  }

  /* ─── Sidebar nav (desktop) ─── */
  function initSidebarNav() {
    const sidebarNav = document.getElementById('sidebarNav');
    if (!sidebarNav) return;

    sidebarNav.querySelectorAll('.sidebar-item').forEach((item) => {
      item.addEventListener('click', () => navigateTo(item.dataset.page));
    });
  }

  /* ─── All button handlers ─── */
  function initButtons() {
    // Hero CTA
    document.getElementById('heroCTA')?.addEventListener('click', () => navigateTo('fleet'));
    document.getElementById('viewAllAlerts')?.addEventListener('click', () => navigateTo('alerts'));

    // Vehicle sheet detail
    document.getElementById('sheetDetailBtn')?.addEventListener('click', () => {
      const sheet = document.getElementById('vehicleSheet');
      const vehicleId = sheet?.dataset.vehicleId;
      if (vehicleId) {
        MapModule.hideVehicleSheet();
        showVehicleDetail(vehicleId);
      }
    });

    // Vehicle sheet close
    const sheet = document.getElementById('vehicleSheet');
    sheet?.querySelector('.sheet-handle')?.addEventListener('click', () => MapModule.hideVehicleSheet());

    // Filter panel
    const filterBtn = document.getElementById('mapFilterBtn');
    const filterPanel = document.getElementById('filterPanel');
    const filterClose = document.getElementById('filterClose');

    filterBtn?.addEventListener('click', () => {
      filterPanel.style.display = 'block';
      requestAnimationFrame(() => filterPanel.classList.add('visible'));
    });

    filterClose?.addEventListener('click', () => {
      filterPanel.classList.remove('visible');
      setTimeout(() => { filterPanel.style.display = 'none'; }, 400);
    });

    // Filter chips
    document.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });

    // Alert filter tabs
    document.querySelectorAll('.filter-tab[data-alert-filter]').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab[data-alert-filter]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        Alerts.filterAlerts(tab.dataset.alertFilter);
      });
    });

    // Mark all read
    document.getElementById('markAllRead')?.addEventListener('click', () => {
      document.querySelectorAll('.alert-card.unread').forEach(c => c.classList.remove('unread'));
    });

    // Back buttons
    document.getElementById('detailBack')?.addEventListener('click', goBack);
    document.getElementById('adminBack')?.addEventListener('click', goBack);
    document.getElementById('mechanicsBack')?.addEventListener('click', goBack);
    document.getElementById('compareBack')?.addEventListener('click', goBack);

    // Settings navigation
    document.getElementById('btnAdminDashboard')?.addEventListener('click', () => {
      pageStack.push(currentPage);
      showPage('admin');
    });
    document.getElementById('btnMechanics')?.addEventListener('click', () => {
      pageStack.push(currentPage);
      showPage('mechanics');
    });

    // Admin tabs
    document.querySelectorAll('.admin-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabName = tab.dataset.adminTab;
        document.getElementById('adminFleet').style.display = tabName === 'fleet' ? 'block' : 'none';
        document.getElementById('adminProducts').style.display = tabName === 'products' ? 'block' : 'none';
        document.getElementById('adminSubscriptions').style.display = tabName === 'subscriptions' ? 'block' : 'none';
      });
    });

    // Toggle switches
    document.querySelectorAll('.toggle').forEach((t) => {
      t.addEventListener('click', () => t.classList.toggle('active'));
    });

    // Map center button
    document.getElementById('mapCenterBtn')?.addEventListener('click', () => {
      if (MapModule.fleetMap) {
        const bounds = L.latLngBounds(FleetData.vehicles.map(v => [v.lat, v.lng]));
        MapModule.fleetMap.fitBounds(bounds.pad(0.3), { animate: true });
      }
    });

    // Find Mechanic button in vehicle sheet
    document.getElementById('sheetFindMechanic')?.addEventListener('click', () => {
      const btn = document.getElementById('sheetFindMechanic');
      const vehicleId = btn?.dataset.vehicleId;
      if (vehicleId) {
        MapModule.hideVehicleSheet();
        MapModule.focusMechanicForVehicle(vehicleId);
      }
    });

    // Compare button
    document.getElementById('btnCompare')?.addEventListener('click', () => {
      Navigation.showCompare();
    });

    // Vehicle search
    document.getElementById('vehicleSearch')?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      document.querySelectorAll('.fleet-vehicle-item').forEach(item => {
        const name = item.dataset.vehicleName || '';
        const plate = item.dataset.vehiclePlate || '';
        const id = item.dataset.vehicleId || '';
        const match = name.includes(query) || plate.toLowerCase().includes(query) || id.toLowerCase().includes(query);
        item.style.display = match ? 'flex' : 'none';
      });
    });
  }

  /* ─── Fleet sidebar list (desktop) ─── */
  function initFleetSidebar() {
    const container = document.getElementById('fleetList');
    if (!container) return;

    container.innerHTML = FleetData.vehicles.map((v) => {
      const healthClass = FleetData.getHealthClass(v.health);
      const healthColor = v.health >= 70 ? '#34d399' : v.health >= 50 ? '#fbbf24' : '#ef4444';
      return `
        <div class="fleet-vehicle-item" data-vehicle-id="${v.id}" data-vehicle-name="${v.name.toLowerCase()}" data-vehicle-plate="${v.plate.toLowerCase()}">
          <div class="vehicle-avatar ${healthClass}">${v.id}</div>
          <div class="fleet-vehicle-info">
            <div class="fleet-vehicle-name">${v.name}</div>
            <div class="fleet-vehicle-plate">${v.plate} · ${v.driver}</div>
          </div>
          <span class="fleet-vehicle-health" style="color:${healthColor}">${v.health}%</span>
        </div>
      `;
    }).join('');

    // Click handlers
    container.querySelectorAll('.fleet-vehicle-item').forEach((item) => {
      item.addEventListener('click', () => {
        // Highlight active
        container.querySelectorAll('.fleet-vehicle-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const vehicleId = item.dataset.vehicleId;
        showVehicleDetail(vehicleId);

        // Also pan map to vehicle
        const vehicle = FleetData.getVehicleById(vehicleId);
        if (vehicle && MapModule.fleetMap) {
          MapModule.fleetMap.setView([vehicle.lat, vehicle.lng], 15, { animate: true });
        }
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════
     NAVIGATION
     ═══════════════════════════════════════════════════════════ */
  function navigateTo(page) {
    if (page === currentPage) return;
    pageStack.push(currentPage);
    showPage(page);
  }

  function showPage(page) {
    // Stop modules when leaving their pages
    if (currentPage === 'detail') {
      Simulator.stop();
    }
    if (currentPage === 'compare') {
      Comparison.stop();
    }

    // Hide all pages
    document.querySelectorAll('.page').forEach((p) => {
      p.classList.remove('active');
      p.style.display = 'none';
    });

    // Show target
    const target = document.getElementById('page-' + page);
    if (target) {
      target.style.display = 'block';
      void target.offsetWidth; // reflow
      target.classList.add('active', 'page-enter');
      setTimeout(() => target.classList.remove('page-enter'), 500);
    }

    currentPage = page;

    // Update all nav systems
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.page === page);
    });
    document.querySelectorAll('.sidebar-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    updateHighlight(true);

    // Bottom nav visibility
    const bottomNav = document.getElementById('bottomNav');
    const subPages = ['detail', 'admin', 'mechanics', 'compare'];
    if (bottomNav) {
      bottomNav.style.display = subPages.includes(page) ? 'none' : 'flex';
    }

    // Map lazy init
    if (page === 'fleet') {
      MapModule.initFleetMap();
      MapModule.refreshMaps();
    } else if (page === 'fuel') {
      MapModule.initFuelMap();
      MapModule.refreshMaps();
    } else if (page === 'mechanics') {
      MapModule.initMechanicsMap();
      MapModule.refreshMaps();
    }

    // Charts on detail page
    if (page === 'detail') {
      setTimeout(() => {
        Charts.drawLineChart('rpmChart', FleetData.generateTimeSeriesData(24, 1500, 2200, 100), {
          color: '#3b82f6',
          labels: Array.from({ length: 24 }, (_, i) => i + 'h'),
        });
        Charts.drawLineChart('tempChart', FleetData.generateTimeSeriesData(24, 75, 105, 20), {
          color: '#ef4444',
          labels: Array.from({ length: 24 }, (_, i) => i + 'h'),
        });
        Charts.drawVibrationChart('vibrationChart');
      }, 200);
    }

    // Start comparison module
    if (page === 'compare') {
      setTimeout(() => Comparison.start(), 200);
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /* ═══════════════════════════════════════════════════════════
     VEHICLE DETAIL — Starts the live simulator
     ═══════════════════════════════════════════════════════════ */
  function showVehicleDetail(vehicleId) {
    const vehicle = FleetData.getVehicleById(vehicleId);
    if (!vehicle) return;

    pageStack.push(currentPage);

    // Populate header
    document.getElementById('detailTitle').textContent = vehicle.name;
    document.getElementById('detailPlate').textContent = vehicle.plate;

    const healthBadge = document.getElementById('detailHealthBadge');
    const healthClass = FleetData.getHealthClass(vehicle.health);
    healthBadge.className = 'health-badge large' + (healthClass === 'good' ? '' : ' ' + healthClass);
    healthBadge.querySelector('.health-score').textContent = vehicle.health;
    healthBadge.querySelector('.health-label').textContent = FleetData.getHealthLabel(vehicle.health);

    // Update param bars
    document.getElementById('paramRpm').style.width = Math.min(100, (vehicle.rpm / 2500) * 100) + '%';
    document.getElementById('paramCoolant').style.width = Math.min(100, (vehicle.temp / 110) * 100) + '%';
    document.getElementById('paramVoltage').style.width = Math.min(100, (vehicle.voltage / 15) * 100) + '%';
    document.getElementById('paramVibration').style.width = Math.min(100, (vehicle.vibration / 2) * 100) + '%';

    showPage('detail');

    // Start the live simulator
    setTimeout(() => {
      Simulator.start(vehicleId);
    }, 300);
  }

  function goBack() {
    // Stop modules if leaving their pages
    if (currentPage === 'detail') {
      Simulator.stop();
    }
    if (currentPage === 'compare') {
      Comparison.stop();
    }
    const prevPage = pageStack.pop() || 'home';
    showPage(prevPage);
  }

  /* ═══════════════════════════════════════════════════════════
     HIGHLIGHT PILL ANIMATION
     ═══════════════════════════════════════════════════════════ */
  function updateHighlight(animate) {
    const nav = document.getElementById('bottomNav');
    const highlight = document.getElementById('navHighlight');
    const activeItem = nav?.querySelector('.nav-item.active');
    if (!nav || !highlight || !activeItem) return;

    const navRect = nav.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    highlight.style.width = (itemRect.width + 4) + 'px';
    highlight.style.transform = `translateX(${itemRect.left - navRect.left - 2}px)`;
    highlight.style.transition = animate
      ? 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
      : 'none';
  }

  function showCompare() {
    pageStack.push(currentPage);
    showPage('compare');
  }

  return {
    init,
    navigateTo,
    showPage,
    showVehicleDetail,
    showCompare,
    goBack,
    get currentPage() { return currentPage; },
  };
})();
