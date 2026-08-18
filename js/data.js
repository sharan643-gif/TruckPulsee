/* ═══════════════════════════════════════════════════════════════
   DATA — Mock fleet data for TruckPulse simulation
   All data structures mirror what would come from Supabase
   ═══════════════════════════════════════════════════════════════ */

const FleetData = (() => {
  'use strict';

  // ─── Vehicle fleet ───
  const vehicles = [
    { id: 'T-01', name: 'Tata Prima 4040', plate: 'MH-12-AB-1234', lat: 19.0760, lng: 72.8777, health: 87, status: 'active', rpm: 1842, temp: 88, voltage: 13.8, vibration: 0.3, driver: 'Rajesh M.' },
    { id: 'T-02', name: 'Ashok Leyland 3718', plate: 'MH-02-CD-5678', lat: 19.0825, lng: 72.8812, health: 62, status: 'active', rpm: 2100, temp: 96, voltage: 12.9, vibration: 0.7, driver: 'Suresh P.' },
    { id: 'T-03', name: 'Eicher Pro 6037', plate: 'KA-01-EF-9012', lat: 19.0690, lng: 72.8700, health: 94, status: 'active', rpm: 1650, temp: 82, voltage: 14.1, vibration: 0.1, driver: 'Anil K.' },
    { id: 'T-04', name: 'Tata Ultra 1918', plate: 'DL-03-GH-3456', lat: 19.0900, lng: 72.8650, health: 45, status: 'active', rpm: 2300, temp: 104, voltage: 11.8, vibration: 1.2, driver: 'Vikram S.' },
    { id: 'T-05', name: 'Mahindra Blazo 25', plate: 'GJ-05-IJ-7890', lat: 19.0630, lng: 72.8850, health: 78, status: 'active', rpm: 1920, temp: 85, voltage: 13.5, vibration: 0.4, driver: 'Deepak R.' },
    { id: 'T-06', name: 'BharatBenz 2823R', plate: 'TN-07-KL-1234', lat: 19.0850, lng: 72.8700, health: 91, status: 'active', rpm: 1700, temp: 80, voltage: 14.0, vibration: 0.2, driver: 'Manoj T.' },
    { id: 'T-07', name: 'Tata LPT 1613', plate: 'RJ-14-MN-5678', lat: 19.0720, lng: 72.8900, health: 35, status: 'active', rpm: 2450, temp: 108, voltage: 11.2, vibration: 1.5, driver: 'Ravi G.' },
    { id: 'T-08', name: 'Ashok Leyland Viking', plate: 'UP-32-OP-9012', lat: 19.0950, lng: 72.8820, health: 82, status: 'idle', rpm: 0, temp: 78, voltage: 13.2, vibration: 0, driver: 'Sunil V.' },
    { id: 'T-09', name: 'Eicher Pro 1110', plate: 'MP-09-QR-3456', lat: 19.0600, lng: 72.8750, health: 73, status: 'active', rpm: 2050, temp: 91, voltage: 13.0, vibration: 0.5, driver: 'Kamal N.' },
    { id: 'T-10', name: 'Tata Signa 4825', plate: 'AP-28-ST-7890', lat: 19.0880, lng: 72.8880, health: 88, status: 'active', rpm: 1780, temp: 84, voltage: 13.9, vibration: 0.3, driver: 'Prakash J.' },
  ];

  // ─── Active alerts ───
  const alerts = [
    {
      id: 'A-001', vehicleId: 'T-04', type: 'critical', time: '2 min ago',
      title: 'Engine Overheat Risk',
      message: 'h3 bhai, gaadi T-04 ka coolant temperature 104°C tak pahunch gaya hai. Abhi ruk ke check karo, engine seize ho sakta hai!',
      action: 'Schedule Repair'
    },
    {
      id: 'A-002', vehicleId: 'T-07', type: 'critical', time: '8 min ago',
      title: 'Vibration Signature Anomaly',
      message: 'T-07 mein rear axle se bahut zyada vibration aa rahi hai (1.5g). Bearing kharab lag raha hai. Turant inspection zaroori hai bhai.',
      action: 'Find Mechanic'
    },
    {
      id: 'A-003', vehicleId: 'T-02', type: 'warning', time: '15 min ago',
      title: 'Battery Voltage Dropping',
      message: 'T-02 ka voltage 12.9V pe aaya hai. Alternator weak ho raha hai, 48 hours mein change karna padega warna breakdown ho sakta hai.',
      action: 'Schedule Check'
    },
    {
      id: 'A-004', vehicleId: 'T-09', type: 'warning', time: '22 min ago',
      title: 'RPM Drift Detected',
      message: 'T-09 ki RPM mein 8% drift aaya hai last 2 hours mein. Fuel filter chok ho sakta hai, filter change kar lo.',
      action: 'View Details'
    },
    {
      id: 'A-005', vehicleId: 'T-01', type: 'info', time: '30 min ago',
      title: 'Service Reminder',
      message: 'T-01 ki next scheduled service 3 din mein hai. Oil change + air filter replacement due hai. Workshop se baat kar lo.',
      action: 'Book Service'
    },
    {
      id: 'A-006', vehicleId: 'T-05', type: 'warning', time: '45 min ago',
      title: 'Coolant Trend Rising',
      message: 'T-05 ka coolant slowly badh raha hai - radiator mein koi block ho sakta hai. Route ke beech mein nearest mechanic dekh lo.',
      action: 'Find Mechanic'
    },
    {
      id: 'A-007', vehicleId: 'T-03', type: 'info', time: '1 hr ago',
      title: 'Fuel Efficiency Improved',
      message: 'Badhai ho bhai! T-03 ki fuel efficiency 14% badhi hai is month. Driver Anil ka driving pattern bahut accha hai. Keep it up!',
      action: null
    },
    {
      id: 'A-008', vehicleId: 'T-06', type: 'info', time: '2 hr ago',
      title: 'Trip Completed',
      message: 'T-06 ne Mumbai-Pune route successfully complete kiya. Total 340 km, average 18.5 km/L. Koi issue nahi aaya.',
      action: null
    },
  ];

  // ─── Route suggestions ───
  const routes = [
    { id: 'R-01', name: 'Mumbai → Pune (NH48)', savings: '₹3,200/trip', desc: 'Via Expressway avoids 3 toll plazas, saves 45 min and 12L diesel', icon: '🛣️' },
    { id: 'R-02', name: 'Pune → Nashik (NH60)', savings: '₹2,100/trip', desc: 'Alternate route via Ahmednagar has smoother gradients, reduces brake wear', icon: '🔄' },
    { id: 'R-03', name: 'Nagpur → Hyderabad (NH44)', savings: '₹4,500/trip', desc: 'Night driving window 10PM-4AM suggested for 8% better fuel economy', icon: '🌙' },
  ];

  // ─── Fuel tips ───
  const fuelTips = [
    { emoji: '🛞', text: '<strong>Tyre pressure check karo weekly.</strong> Under-inflation 3% fuel waste karta hai. Auto-inflation system lagwao for ₹8,000.' },
    { emoji: '⏱️', text: '<strong>Gear shifting 1,400-1,600 RPM pe karo.</strong> Har driver ko 2-hour training do on eco-driving. Average 11% savings milta hai.' },
    { emoji: '📦', text: '<strong>Overloading mat karo.</strong> 10% extra load = 5% extra fuel. Weighbridge data se match karo每次 trip ka.' },
    { emoji: '🔧', text: '<strong>Air filter har 10,000 km pe change karo.</strong> Clogged filter se 6% zyada fuel lagta hai. ₹200 ka part hai, ₹2,000 ka waste hota hai.' },
  ];

  // ─── Verified mechanics ───
  const mechanics = [
    { id: 'M-01', name: 'Sharma Auto Works', specialty: 'Engine & Transmission', lat: 19.0780, lng: 72.8790, rating: 4.8, distance: '2.3 km', verified: true, phone: '+91 98765 43210' },
    { id: 'M-02', name: 'Prakash Diesel Center', specialty: 'Fuel System & Injector', lat: 19.0730, lng: 72.8830, rating: 4.6, distance: '3.1 km', verified: true, phone: '+91 98765 43211' },
    { id: 'M-03', name: 'Bharat Truck Repairs', specialty: 'Electrical & Battery', lat: 19.0810, lng: 72.8710, rating: 4.4, distance: '4.5 km', verified: true, phone: '+91 98765 43212' },
    { id: 'M-04', name: 'Highway Help Garage', specialty: 'All Commercial Vehicles', lat: 19.0660, lng: 72.8860, rating: 4.2, distance: '5.8 km', verified: false, phone: '+91 98765 43213' },
    { id: 'M-05', name: 'Sai Trucking Services', specialty: 'Suspension & Brakes', lat: 19.0870, lng: 72.8680, rating: 4.7, distance: '6.2 km', verified: true, phone: '+91 98765 43214' },
  ];

  // ─── Helper functions ───
  function getVehicleById(id) {
    return vehicles.find(v => v.id === id);
  }

  function getAlertsForVehicle(vehicleId) {
    return alerts.filter(a => a.vehicleId === vehicleId);
  }

  function getHealthClass(health) {
    if (health >= 70) return 'good';
    if (health >= 50) return 'warning';
    return 'critical';
  }

  function getHealthLabel(health) {
    if (health >= 80) return 'Good';
    if (health >= 60) return 'Fair';
    if (health >= 40) return 'Warning';
    return 'Critical';
  }

  function generateTimeSeriesData(points, min, max, trend) {
    const data = [];
    let value = min + (max - min) * 0.5;
    for (let i = 0; i < points; i++) {
      const noise = (Math.random() - 0.5) * (max - min) * 0.15;
      const trendVal = trend ? trend * (i / points) : 0;
      value = Math.max(min, Math.min(max, value + noise + trendVal));
      data.push(value);
    }
    return data;
  }

  return {
    vehicles,
    alerts,
    routes,
    fuelTips,
    mechanics,
    getVehicleById,
    getAlertsForVehicle,
    getHealthClass,
    getHealthLabel,
    generateTimeSeriesData
  };
})();
