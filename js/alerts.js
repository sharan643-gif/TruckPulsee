/* ═══════════════════════════════════════════════════════════════
   ALERTS — WhatsApp-style vernacular alert rendering
   ═══════════════════════════════════════════════════════════════ */

const Alerts = (() => {
  'use strict';

  /* ─── Render alert preview cards on Home page ─── */
  function renderAlertPreview() {
    const container = document.getElementById('alertPreviewList');
    if (!container) return;

    const previewAlerts = FleetData.alerts.slice(0, 3);
    container.innerHTML = previewAlerts.map((alert) => {
      const vehicle = FleetData.getVehicleById(alert.vehicleId);
      const iconEmoji = alert.type === 'critical' ? '🔴' : alert.type === 'warning' ? '🟡' : '🔵';

      return `
        <div class="alert-preview-item" data-alert-id="${alert.id}">
          <div class="alert-icon ${alert.type}">${iconEmoji}</div>
          <div class="alert-text">
            <div class="alert-text-title">${alert.title}</div>
            <div class="alert-text-sub">${vehicle ? vehicle.id + ' · ' + vehicle.name : alert.vehicleId}</div>
          </div>
          <span class="alert-time">${alert.time}</span>
        </div>
      `;
    }).join('');
  }

  /* ─── Render full alert list on Alerts page ─── */
  function renderAlertsList(filter = 'all') {
    const container = document.getElementById('alertsList');
    if (!container) return;

    const filteredAlerts = filter === 'all'
      ? FleetData.alerts
      : FleetData.alerts.filter(a => a.type === filter);

    container.innerHTML = filteredAlerts.map((alert) => {
      const vehicle = FleetData.getVehicleById(alert.vehicleId);
      const iconEmoji = alert.type === 'critical' ? '🔴' : alert.type === 'warning' ? '🟡' : '🔵';

      return `
        <div class="alert-card ${alert.type} unread" data-alert-id="${alert.id}">
          <div class="alert-card-header">
            <div class="alert-card-vehicle">
              <span style="font-size: 16px;">${iconEmoji}</span>
              <span class="vehicle-id">${vehicle ? vehicle.id + ' · ' + vehicle.name : alert.vehicleId}</span>
            </div>
            <span class="alert-card-time">${alert.time}</span>
          </div>
          <div class="alert-card-body">
            <strong>${alert.title}</strong><br>
            ${alert.message}
          </div>
          ${alert.action ? `
            <div class="alert-card-footer">
              <button class="alert-card-action">${alert.action}</button>
              <button class="alert-card-action">Dismiss</button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Stagger animation
    container.classList.add('stagger-children');
    setTimeout(() => container.classList.remove('stagger-children'), 800);
  }

  /* ─── Filter alerts by type ─── */
  function filterAlerts(type) {
    renderAlertsList(type);
    // Re-bind action buttons after re-render
    setTimeout(() => bindAlertActions(), 50);
  }

  /* ─── Bind "Find Mechanic" action buttons on alert cards ─── */
  function bindAlertActions() {
    document.querySelectorAll('.alert-card-action').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.alert-card');
        if (!card) return;

        const alertId = card.dataset.alertId;
        const alert = FleetData.alerts.find((a) => a.id === alertId);
        if (!alert) return;

        if (btn.textContent === 'Find Mechanic' || btn.textContent === 'Schedule Repair') {
          // Navigate to fleet map and focus on the mechanic for this vehicle
          Navigation.navigateTo('fleet');
          setTimeout(() => {
            MapModule.focusMechanicForVehicle(alert.vehicleId);
          }, 500);
        }
      });
    });
  }

  return {
    renderAlertPreview,
    renderAlertsList,
    filterAlerts,
    bindAlertActions,
  };
})();
