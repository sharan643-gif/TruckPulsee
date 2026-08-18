/* ═══════════════════════════════════════════════════════════════
   APP — Main controller: splash screen, init, orchestration
   ═══════════════════════════════════════════════════════════════ */

const App = (() => {
  'use strict';

  /* ─── Splash screen ─── */
  function initSplash() {
    return new Promise((resolve) => {
      const splash = document.getElementById('splash');
      const app = document.getElementById('app');

      setTimeout(() => {
        splash.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        splash.style.opacity = '0';
        splash.style.transform = 'scale(1.05)';

        setTimeout(() => {
          splash.style.display = 'none';
          app.style.display = 'flex';
          app.style.opacity = '0';
          app.style.transition = 'opacity 0.4s ease';

          requestAnimationFrame(() => {
            app.style.opacity = '1';
          });

          resolve();
        }, 500);
      }, 1800);
    });
  }

  /* ─── Animate hero fleet vehicles ─── */
  function initHeroFleet() {
    const container = document.getElementById('heroFleet');
    if (!container) return;

    const fleetCards = [
      { id: 'T-01', health: 87, speed: '72 km/h', style: 'left: 10%; top: 20px;' },
      { id: 'T-03', health: 94, speed: '65 km/h', style: 'left: 55%; top: 60px;' },
      { id: 'T-05', health: 78, speed: '58 km/h', style: 'left: 30%; top: 110px;' },
    ];

    container.innerHTML = fleetCards.map((card) => {
      const healthColor = card.health >= 70 ? '#34d399' : card.health >= 50 ? '#fbbf24' : '#ef4444';
      return `
        <div class="hero-vehicle-card" style="${card.style}">
          <div class="vehicle-avatar ${FleetData.getHealthClass(card.health)}">${card.id}</div>
          <div>
            <div class="hvc-id">${card.id}</div>
            <div class="hvc-health" style="color:${healthColor};">Health: ${card.health}%</div>
            <div class="hvc-speed">${card.speed}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ─── Animate stat counters ─── */
  function animateStats() {
    const statFleet = document.getElementById('statFleet');
    const statAlerts = document.getElementById('statAlerts');
    if (statFleet) Animations.countTo(statFleet, 0, 47, 1200);
    if (statAlerts) Animations.countTo(statAlerts, 0, 12, 1200);
  }

  /* ─── Main initialization ─── */
  async function init() {
    await initSplash();

    Navigation.init();
    Alerts.renderAlertPreview();
    Alerts.renderAlertsList();
    setTimeout(() => Alerts.bindAlertActions(), 100);
    FuelAdvisor.renderRoutes();
    FuelAdvisor.renderTips();
    MechanicLocator.renderMechanicsList();
    AdminDashboard.renderFleetTable();

    initHeroFleet();
    setTimeout(animateStats, 300);

    setTimeout(() => {
      Charts.drawHealthTrend('healthTrendCanvas');
    }, 500);

    Charts.autoResize();
    MapModule.startMarkerSimulation();
    Animations.observeFadeIn('.stat-card, .alert-preview-item, .glass-card');

    console.log(
      '%c TruckPulse %c v2.2.0 ',
      'background: linear-gradient(135deg, #6ee7b7, #3b82f6); color: #0a0a0f; font-weight: bold; padding: 4px 8px; border-radius: 4px 0 0 4px;',
      'background: #1a1a25; color: #a1a1aa; padding: 4px 8px; border-radius: 0 4px 4px 0;'
    );
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
