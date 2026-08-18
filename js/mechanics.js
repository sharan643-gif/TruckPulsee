/* ═══════════════════════════════════════════════════════════════
   MECHANICS — Mechanic locator card rendering
   ═══════════════════════════════════════════════════════════════ */

const MechanicLocator = (() => {
  'use strict';

  /* ─── Render mechanic cards ─── */
  function renderMechanicsList() {
    const container = document.getElementById('mechanicsList');
    if (!container) return;

    container.innerHTML = FleetData.mechanics.map((mech) => `
      <div class="mechanic-card" data-mechanic-id="${mech.id}">
        <div class="mechanic-avatar">🔧</div>
        <div class="mechanic-info">
          <div class="mechanic-name">${mech.name}</div>
          <div class="mechanic-specialty">${mech.specialty}</div>
          <div class="mechanic-meta">
            <span class="mechanic-rating">⭐ ${mech.rating}</span>
            <span class="mechanic-distance">📍 ${mech.distance}</span>
            ${mech.verified ? '<span class="mechanic-verified">✓ Verified</span>' : ''}
          </div>
        </div>
        <div class="mechanic-actions">
          <a href="tel:${mech.phone}" class="mechanic-call-btn" title="Call">📞</a>
        </div>
      </div>
    `).join('');
  }

  return {
    renderMechanicsList,
  };
})();
