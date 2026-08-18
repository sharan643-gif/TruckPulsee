/* ═══════════════════════════════════════════════════════════════
   SUPABASE — Backend integration stubs
   Replace SUPABASE_URL and SUPABASE_KEY with real values.
   ═══════════════════════════════════════════════════════════════ */

const SupabaseClient = (() => {
  'use strict';

  // ─── Configuration ───
  const CONFIG = {
    // Replace these with your Supabase project credentials
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key-here',

    // Table names (match your Supabase schema)
    tables: {
      vehicles: 'vehicles',
      alerts: 'alerts',
      users: 'users',
      subscriptions: 'subscriptions',
      mechanics: 'mechanics',
      products: 'products',
    },
  };

  /* ─── Generic Supabase REST query ───
     Uses the PostgREST API that Supabase exposes. */
  async function query(table, { select = '*', filters = {}, order = null, limit = null } = {}) {
    try {
      let url = `${CONFIG.url}/rest/v1/${table}?select=${select}`;

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        url += `&${key}=eq.${encodeURIComponent(value)}`;
      });

      // Add ordering
      if (order) {
        url += `&order=${order.column}${order.ascending ? '.asc' : '.desc'}`;
      }

      // Add limit
      if (limit) {
        url += `&limit=${limit}`;
      }

      const response = await fetch(url, {
        headers: {
          'apikey': CONFIG.anonKey,
          'Authorization': `Bearer ${CONFIG.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
      });

      if (!response.ok) {
        throw new Error(`Supabase query failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('[Supabase] Query error (using mock data):', error.message);
      return null; // Caller should fall back to mock data
    }
  }

  /* ─── Insert a record ─── */
  async function insert(table, data) {
    try {
      const response = await fetch(`${CONFIG.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'apikey': CONFIG.anonKey,
          'Authorization': `Bearer ${CONFIG.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(`Insert failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('[Supabase] Insert error:', error.message);
      return null;
    }
  }

  /* ─── Update a record ─── */
  async function update(table, id, data) {
    try {
      const response = await fetch(`${CONFIG.url}/rest/v1/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': CONFIG.anonKey,
          'Authorization': `Bearer ${CONFIG.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(`Update failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('[Supabase] Update error:', error.message);
      return null;
    }
  }

  /* ─── Subscribe to real-time changes ─── */
  function subscribe(table, callback) {
    // Supabase Realtime requires WebSocket connection
    // This is a stub — integrate with @supabase/supabase-js for real-time
    console.log(`[Supabase] Realtime subscription on "${table}" (stub — connect your Supabase client for live updates)`);
  }

  /* ─── High-level API methods ─── */

  async function getVehicles() {
    const data = await query(CONFIG.tables.vehicles, { order: { column: 'id', ascending: true } });
    return data || FleetData.vehicles; // Fallback to mock data
  }

  async function getAlerts(filter) {
    const filters = filter && filter !== 'all' ? { type: filter } : {};
    const data = await query(CONFIG.tables.alerts, {
      filters,
      order: { column: 'created_at', ascending: false },
      limit: 50,
    });
    return data || FleetData.alerts;
  }

  async function getSubscriptions() {
    const data = await query(CONFIG.tables.subscriptions, {
      order: { column: 'created_at', ascending: false },
    });
    return data || []; // No mock fallback needed
  }

  async function createProduct(product) {
    return await insert(CONFIG.tables.products, product);
  }

  async function updateVehicleHealth(vehicleId, health) {
    return await update(CONFIG.tables.vehicles, vehicleId, { health });
  }

  return {
    CONFIG,
    query,
    insert,
    update,
    subscribe,
    getVehicles,
    getAlerts,
    getSubscriptions,
    createProduct,
    updateVehicleHealth,
  };
})();
