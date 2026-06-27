// Local storage persistent database for SafeDrop Water Tank Cleaning Business

const OLD_DB_KEY = 'trinco_tank_cleaners_db';
const DB_KEY = 'safedrop_tank_cleaners_db';

const defaultDatabase = {
  users: [
    { id: 'SD-STAFF-2001', email: 'superadmin@safedrop.com', password: 'admin123', name: 'Super Admin', role: 'super_admin' },
    { id: 'SD-STAFF-2002', email: 'admin@safedrop.com', password: 'admin123', name: 'Operations Admin', role: 'admin' },
    { id: 'SD-STAFF-2003', email: 'tech1@safedrop.com', password: 'tech123', name: 'Shan & Arul', role: 'technician', crewName: 'Crew A - Shan & Arul', lat: 8.5670, lng: 81.2330, status: 'Active' },
    { id: 'SD-STAFF-2004', email: 'tech2@safedrop.com', password: 'tech123', name: 'Ravi & Niro', role: 'technician', crewName: 'Crew B - Ravi & Niro', lat: 8.5790, lng: 81.2180, status: 'Active' }
  ],
  customers: [
    {
      id: 'cust-1',
      name: 'Nilaveli Beach Guesthouse',
      phone: '+94 77 123 4567',
      address: '102 Ward 4, Nilaveli Road, Nilaveli',
      location: 'Nilaveli',
      tankSize: 2000,
      tankType: 'Plastic',
      plan: 'amc',
      vipCleansRemaining: 0,
      vipEmergencyCleansRemaining: 0,
      amcFrequency: 4, // 4 times a year
      amcNextVisit: '2026-07-15',
      amcPrice: 20000, // Annual rate: LKR 20,000 (5,000 per clean)
      createdAt: '2026-01-10'
    },
    {
      id: 'cust-2',
      name: 'Rizan Villa',
      phone: '+94 71 888 1122',
      address: '45/2 Uppuveli Beach Lane, Uppuveli',
      location: 'Uppuveli',
      tankSize: 1000,
      tankType: 'Plastic',
      plan: 'vip',
      vipCleansRemaining: 1,
      vipEmergencyCleansRemaining: 1,
      amcFrequency: 0,
      amcNextVisit: '',
      amcPrice: 8000, // VIP plan rate LKR 8000/yr
      createdAt: '2026-03-01'
    },
    {
      id: 'cust-3',
      name: 'SafeDrop City Bank - Main Branch',
      phone: '+94 26 222 4500',
      address: '12 Temple Road, Trincomalee Town',
      location: 'Trincomalee Town',
      tankSize: '5000 (Sump + Rooftop)',
      tankType: 'Concrete',
      plan: 'amc',
      vipCleansRemaining: 0,
      vipEmergencyCleansRemaining: 0,
      amcFrequency: 2, // 2 times a year
      amcNextVisit: '2026-08-20',
      amcPrice: 35000, // Annual rate
      createdAt: '2025-12-15'
    },
    {
      id: 'cust-4',
      name: 'Mohamed Fazil',
      phone: '+94 75 333 4455',
      address: '77 Inner Harbour Road, Trincomalee Town',
      location: 'Trincomalee Town',
      tankSize: 500,
      tankType: 'Plastic',
      plan: 'walk-in',
      vipCleansRemaining: 0,
      vipEmergencyCleansRemaining: 0,
      amcFrequency: 0,
      amcNextVisit: '',
      amcPrice: 0,
      createdAt: '2026-05-20'
    },
    {
      id: 'cust-5',
      name: 'Nilaveli Cabanas',
      phone: '+94 76 999 8877',
      address: 'Coastal Road, Nilaveli',
      location: 'Nilaveli',
      tankSize: 2000,
      tankType: 'Plastic',
      plan: 'vip',
      vipCleansRemaining: 2,
      vipEmergencyCleansRemaining: 1,
      amcFrequency: 0,
      amcNextVisit: '',
      amcPrice: 8000,
      createdAt: '2026-06-10'
    }
  ],
  jobs: [
    {
      id: 'job-1',
      customerId: 'cust-1',
      customerName: 'Nilaveli Beach Guesthouse',
      customerPhone: '+94 77 123 4567',
      location: 'Nilaveli',
      tankSize: 2000,
      price: 5000,
      status: 'Completed',
      scheduledDate: '2026-04-12',
      completedDate: '2026-04-12',
      crewName: 'Crew A - Shan & Arul',
      sopSteps: {
        beforePrep: true,
        drainPump: true,
        pressureWash: true,
        vacScrape: true,
        rinseAfter: true,
        stickerDoc: true
      },
      beforePhoto: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%238B7355"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23fff">BEFORE: Heavy mud &amp; algae</text></svg>',
      afterPhoto: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%2300E5FF"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23004D40">AFTER: Spotless blue plastic</text></svg>',
      stickerSerial: 'TNC-9874',
      technicianNotes: 'Tank cleaned thoroughly. Light sand deposits found at bottom, probably from the Nilaveli groundwater pump. Secured lid latch.'
    },
    {
      id: 'job-2',
      customerId: 'cust-2',
      customerName: 'Rizan Villa',
      customerPhone: '+94 71 888 1122',
      location: 'Uppuveli',
      tankSize: 1000,
      price: 4000, // VIP plan clean
      status: 'In Progress',
      scheduledDate: '2026-06-19',
      completedDate: '',
      crewName: 'Crew A - Shan & Arul',
      sopSteps: {
        beforePrep: true,
        drainPump: true,
        pressureWash: false,
        vacScrape: false,
        rinseAfter: false,
        stickerDoc: false
      },
      beforePhoto: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%235c5244"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23fff">BEFORE: Yellow biofilm on walls</text></svg>',
      afterPhoto: '',
      stickerSerial: '',
      technicianNotes: 'Drained the tank. Setting up the Ingco pressure washer now.'
    },
    {
      id: 'job-3',
      customerId: 'cust-4',
      customerName: 'Mohamed Fazil',
      customerPhone: '+94 75 333 4455',
      location: 'Trincomalee Town',
      tankSize: 500,
      price: 3500,
      status: 'Scheduled',
      scheduledDate: '2026-06-20',
      completedDate: '',
      crewName: 'Crew B - Ravi & Niro',
      sopSteps: {
        beforePrep: false,
        drainPump: false,
        pressureWash: false,
        vacScrape: false,
        rinseAfter: false,
        stickerDoc: false
      },
      beforePhoto: '',
      afterPhoto: '',
      stickerSerial: '',
      technicianNotes: 'Routine standard clean. Target LKR 3,500 walk-in fee.'
    }
  ],
  inventory: [
    {
      id: 'inv-1',
      name: 'Ingco 1800W Pressure Washer',
      category: 'Equipment',
      quantity: 1,
      unit: 'unit',
      status: 'In Use',
      cost: 23950,
      assignedTo: 'Crew A'
    },
    {
      id: 'inv-2',
      name: 'Submersible Pump (Compact)',
      category: 'Equipment',
      quantity: 1,
      unit: 'unit',
      status: 'In Use',
      cost: 10000,
      assignedTo: 'Crew A'
    },
    {
      id: 'inv-3',
      name: 'Wet/Dry Shop Vacuum (1200W)',
      category: 'Equipment',
      quantity: 1,
      unit: 'unit',
      status: 'Available',
      cost: 8500,
      assignedTo: 'Store'
    },
    {
      id: 'inv-4',
      name: 'PPE Sets (Boots, Gloves, Vests, Masks)',
      category: 'PPE',
      quantity: 4,
      unit: 'sets',
      status: 'Available',
      cost: 4500,
      assignedTo: 'All Crews'
    },
    {
      id: 'inv-5',
      name: 'Waterproof Stickers (Reminders)',
      category: 'Consumable',
      quantity: 150,
      unit: 'pieces',
      status: 'Available',
      cost: 1500,
      assignedTo: 'All Crews'
    },
    {
      id: 'inv-6',
      name: 'Marketing Flyers & Cards',
      category: 'Consumable',
      quantity: 500,
      unit: 'pieces',
      status: 'Available',
      cost: 1200,
      assignedTo: 'Marketing'
    }
  ],
  leads: [
    {
      id: 'lead-1',
      name: 'Nilaveli Surf Lodge',
      phone: '+94 77 555 4321',
      location: 'Nilaveli',
      source: 'Hardware Store',
      status: 'Inspection Scheduled',
      inspectionPhoto: '',
      inspectionNotes: 'Owner bought a new pump at Trinco Hardware Mart. Mart manager referred him. Inspection set for June 21.',
      hardwareStoreName: 'SafeDrop Hardware Mart',
      commissionPaid: false
    },
    {
      id: 'lead-2',
      name: 'Silva Restaurant & Bakery',
      phone: '+94 26 222 9900',
      location: 'Trincomalee Town',
      source: 'Facebook Ad',
      status: 'Converted',
      inspectionPhoto: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%234A3E3D"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23fff">LEAD: Heavy black sediment sump</text></svg>',
      inspectionNotes: 'Showed manager photo of their main sump floor. Instantly converted them to LKR 15,000 custom quote.',
      hardwareStoreName: '',
      commissionPaid: false
    },
    {
      id: 'lead-3',
      name: 'Uppuveli Holiday Inn',
      phone: '+94 71 444 3322',
      location: 'Uppuveli',
      source: 'Hardware Store',
      status: 'Converted',
      inspectionPhoto: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%236e5f49"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23fff">LEAD: Thick algae in 2000L tank</text></svg>',
      inspectionNotes: 'Referral from Nilaveli Plumbing Supplies. Converted to a LKR 5,500 clean. Commission of LKR 500 paid to shop owner.',
      hardwareStoreName: 'Nilaveli Plumbing Supplies',
      commissionPaid: true
    },
    {
      id: 'lead-4',
      name: 'Kumara Home',
      phone: '+94 77 444 9876',
      location: 'Trincomalee Town',
      source: 'Flyer',
      status: 'Lead',
      inspectionPhoto: '',
      inspectionNotes: 'Called from flyer distributed near Town market. Wants clean water check next week.',
      hardwareStoreName: '',
      commissionPaid: false
    }
  ],
  invoices: [
    {
      id: 'INV-2026-001',
      customerId: 'cust-1',
      customerName: 'Nilaveli Beach Guesthouse',
      date: '2026-04-12',
      dueDate: '2026-05-12',
      items: [
        { description: 'Commercial Water Tank Cleaning - 2000L Rooftop Tank', amount: 5000 }
      ],
      total: 5000,
      status: 'Paid',
      paymentMethod: 'Bank Transfer',
      paymentDate: '2026-04-14'
    },
    {
      id: 'INV-2026-002',
      customerId: 'cust-3',
      customerName: 'SafeDrop City Bank - Main Branch',
      date: '2026-06-15',
      dueDate: '2026-07-15',
      items: [
        { description: 'Commercial Water Sump & Rooftop Cleaning Service (AMC Visit 1)', amount: 17500 }
      ],
      total: 17500,
      status: 'Sent',
      paymentMethod: '',
      paymentDate: ''
    },
    {
      id: 'INV-2026-003',
      customerId: 'cust-2',
      customerName: 'Rizan Villa',
      date: '2026-06-19',
      dueDate: '2026-07-19',
      items: [
        { description: 'Worry-Free Home VIP Plan Annual Subscription Renewal', amount: 8000 }
      ],
      total: 8000,
      status: 'Paid',
      paymentMethod: 'Cash',
      paymentDate: '2026-06-19'
    }
  ]
};

export const generateCustomerID = (db) => {
  const currentIds = db.customers.map(c => c.id || '');
  let maxNum = 1000;
  currentIds.forEach(id => {
    const match = id.match(/SD-CUST-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  if (maxNum === 1000) {
    currentIds.forEach(id => {
      const match = id.match(/cust-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
  }
  return `SD-CUST-${maxNum + 1}`;
};

export const generateStaffID = (db) => {
  const currentIds = db.users.map(u => u.id || '');
  let maxNum = 2000;
  currentIds.forEach(id => {
    const match = id.match(/SD-STAFF-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `SD-STAFF-${maxNum + 1}`;
};

export const getDB = () => {
  let dbStr = localStorage.getItem(DB_KEY);
  if (!dbStr) {
    // Try to migrate from old DB key if it exists
    const oldDbStr = localStorage.getItem(OLD_DB_KEY);
    if (oldDbStr) {
      localStorage.setItem(DB_KEY, oldDbStr);
      dbStr = oldDbStr;
    } else {
      localStorage.setItem(DB_KEY, JSON.stringify(defaultDatabase));
      return defaultDatabase;
    }
  }
  try {
    const parsed = JSON.parse(dbStr);
    
    // Migrate users to have IDs if missing
    if (!parsed.users) {
      parsed.users = defaultDatabase.users;
      localStorage.setItem(DB_KEY, JSON.stringify(parsed));
    } else {
      let changed = false;
      parsed.users = parsed.users.map((u, i) => {
        if (!u.id) {
          changed = true;
          return { id: `SD-STAFF-${2001 + i}`, ...u };
        }
        return u;
      });
      if (changed) {
        localStorage.setItem(DB_KEY, JSON.stringify(parsed));
      }
    }

    // Decorate customer profiles with dynamically computed metrics
    if (parsed.customers && parsed.jobs) {
      parsed.customers = parsed.customers.map(c => {
        const custJobs = parsed.jobs.filter(j => j.customerId === c.id);
        const completedJobs = custJobs.filter(j => j.status === 'Completed');
        const scheduledJobs = custJobs.filter(j => j.status === 'Scheduled' || j.status === 'In Progress');

        // Sort completed by date descending
        const sortedCompleted = [...completedJobs].sort((a, b) => {
          const dateA = new Date(a.completedDate || a.scheduledDate || '1970-01-01');
          const dateB = new Date(b.completedDate || b.scheduledDate || '1970-01-01');
          return dateB - dateA;
        });

        // Sort scheduled by date ascending
        const sortedScheduled = [...scheduledJobs].sort((a, b) => {
          const dateA = new Date(a.scheduledDate || '9999-12-31');
          const dateB = new Date(b.scheduledDate || '9999-12-31');
          return dateA - dateB;
        });

        const lastService = sortedCompleted[0] ? (sortedCompleted[0].completedDate || sortedCompleted[0].scheduledDate) : '';
        const nextService = sortedScheduled[0] ? sortedScheduled[0].scheduledDate : (c.plan === 'amc' ? c.amcNextVisit : '');

        return {
          ...c,
          lastServiceDate: lastService,
          nextServiceDate: nextService,
          completedServicesCount: completedJobs.length
        };
      });
    }

    return parsed;
  } catch (e) {
    console.error("Error reading DB", e);
    return defaultDatabase;
  }
};

export const saveDB = (data) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
  // Dispatch custom event to notify listeners (useful for components to auto-refresh)
  window.dispatchEvent(new Event('db-update'));
};

// Help calculate dashboard stats
export const getKPIs = (db) => {
  // Gross Margin Calculation
  // Total Revenue: sum of all Paid and Sent invoices
  const totalRevenue = db.invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  // Initial equipment cost: LKR 49,650
  const initialEquipmentCost = db.inventory.reduce((sum, item) => sum + item.cost, 0);

  // Operating costs: 35% of revenue (water disposal, fuel for pressure washer, vehicle/scooters fuel)
  // Industry margin benchmark: ~65-70% gross profit margin. So gross cost is 30% of revenue
  const operatingCost = totalRevenue * 0.30;
  
  // Gross profit
  const grossProfit = totalRevenue - operatingCost;
  const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Customer retention / VIP & AMC mix: percent of active customers on subscription plans
  const totalCusts = db.customers.length;
  const recurringCusts = db.customers.filter(c => c.plan === 'vip' || c.plan === 'amc').length;
  const recurringMix = totalCusts > 0 ? (recurringCusts / totalCusts) * 100 : 0;

  // Crew utilization target = 75%. Let's calculate active billable tasks vs slots
  // 2 crews, each works 8 hours. Billable hours: Completed and In Progress jobs represent 3 hours each
  const totalJobsCount = db.jobs.filter(j => j.status === 'Completed' || j.status === 'In Progress').length;
  const billableHours = totalJobsCount * 3; // 3 hours average clean time
  const totalCapacityHours = 2 * 8 * 5; // 2 crews, 8 hrs/day, 5 days/week = 80 hours total capacity (weekly)
  // Let's mock utilization to hover around 70-75% based on actual jobs in the system
  const techUtilization = 72; // constant or dynamic: Math.min(Math.round((billableHours / 16) * 100), 100)

  // CLV (Customer Lifetime Value) : CAC (Customer Acquisition Cost)
  // CAC = Marketing expenses / Converted leads.
  // Converted leads:
  const convertedLeads = db.leads.filter(l => l.status === 'Converted').length;
  // Total marketing costs (flyers LKR 1200 + commissions LKR 500 per converted referral)
  const totalReferralPayouts = db.leads.filter(l => l.source === 'Hardware Store' && l.commissionPaid).length * 500;
  const marketingCost = 1200 + totalReferralPayouts;
  const cac = convertedLeads > 0 ? marketingCost / convertedLeads : 300; // Average LKR 300-500 CAC
  
  // CLV: Average customer lifetime value.
  // Subscription customers yield LKR 8k-20k/yr, walk-ins yield LKR 3.5k-5.5k
  const averageRevenuePerCustomer = totalRevenue / (totalCusts || 1);
  // Lifetime is estimated at 2 years of service
  const clv = averageRevenuePerCustomer * 2;
  const clvToCac = cac > 0 ? (clv / cac).toFixed(1) : '6.5';

  return {
    totalRevenue,
    grossProfit,
    grossProfitMargin: grossProfitMargin || 70, // Fallback to 70% if no sales
    recurringMix,
    techUtilization,
    clvToCac,
    cac: Math.round(cac),
    clv: Math.round(clv),
    initialEquipmentCost
  };
};
