/* ═══════════════════════════════════════════════════════════════
   FUEL — Fuel advisor: route suggestions and efficiency tips
   ═══════════════════════════════════════════════════════════════ */

const FuelAdvisor = (() => {
  'use strict';

  /* ─── Render route suggestion cards ─── */
  function renderRoutes() {
    const container = document.getElementById('routeList');
    if (!container) return;

    container.innerHTML = FleetData.routes.map((route) => `
      <div class="route-card glass-card" data-route-id="${route.id}">
        <div class="route-icon">${route.icon}</div>
        <div class="route-info">
          <div class="route-name">${route.name}</div>
          <div class="route-desc">${route.desc}</div>
        </div>
        <span class="route-saving">${route.savings}</span>
      </div>
    `).join('');
  }

  /* ─── Render fuel efficiency tips ─── */
  function renderTips() {
    const container = document.getElementById('tipsList');
    if (!container) return;

    container.innerHTML = FleetData.fuelTips.map((tip) => `
      <div class="tip-card glass-card">
        <span class="tip-emoji">${tip.emoji}</span>
        <p class="tip-text">${tip.text}</p>
      </div>
    `).join('');
  }

  return {
    renderRoutes,
    renderTips,
  };
})();
