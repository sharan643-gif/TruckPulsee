/* ═══════════════════════════════════════════════════════════════
   ADMIN — Admin dashboard fleet table rendering
   ═══════════════════════════════════════════════════════════════ */

const AdminDashboard = (() => {
  'use strict';

  /* ─── Render fleet management table ─── */
  function renderFleetTable() {
    const container = document.getElementById('adminFleetTable');
    if (!container) return;

    container.innerHTML = FleetData.vehicles.map((vehicle) => {
      const healthClass = FleetData.getHealthClass(vehicle.health);
      const healthStyle = healthClass === 'good' ? 'good' : healthClass === 'warning' ? 'warning' : 'bad';
      const statusClass = vehicle.status === 'active' ? 'active' : vehicle.status === 'idle' ? 'idle' : 'offline';

      return `
        <div class="table-row">
          <div>
            <strong>${vehicle.id}</strong><br>
            <small style="color: var(--color-text-3);">${vehicle.plate}</small>
          </div>
          <div class="table-health ${healthStyle}">${vehicle.health}</div>
          <div class="table-status ${statusClass}">${vehicle.status}</div>
          <button class="table-action" data-vehicle-id="${vehicle.id}">View</button>
        </div>
      `;
    }).join('');

    // Add click handlers for view buttons
    container.querySelectorAll('.table-action').forEach((btn) => {
      btn.addEventListener('click', () => {
        Navigation.showVehicleDetail(btn.dataset.vehicleId);
      });
    });
  }

  return {
    renderFleetTable,
  };
})();
