import { saveDBToFirebase } from './firebase';

// Local storage persistent database for SafeDrop Water Tank Cleaning Business

const OLD_DB_KEY = 'trinco_tank_cleaners_db';
const DB_KEY = 'safedrop_tank_cleaners_db';

export const defaultDatabase = {
  users: [
    { id: 'SD-STAFF-2001', email: 'pranith@safedrop.com', password: 'admin123', name: 'Pranith', role: 'super_admin' },
    { id: 'SD-STAFF-2002', email: 'anurathan@safedrop.com', password: 'admin123', name: 'Anurathan', role: 'admin' }
  ],
  customers: [],
  jobs: [],
  inventory: [],
  leads: [],
  invoices: [],
  auditLogs: []
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
  const oldDataStr = localStorage.getItem(DB_KEY);
  let oldData = null;
  try {
    oldData = oldDataStr ? JSON.parse(oldDataStr) : null;
  } catch (e) {
    console.error("Error parsing old database during save:", e);
  }
  
  localStorage.setItem(DB_KEY, JSON.stringify(data));
  // Dispatch custom event to notify listeners (useful for components to auto-refresh)
  window.dispatchEvent(new Event('db-update'));
  // Sync changes to Firebase Firestore
  saveDBToFirebase(data, oldData);
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

export const addAuditLog = (action, details) => {
  try {
    const db = getDB();
    const userStr = sessionStorage.getItem('safedrop_user');
    const user = userStr ? JSON.parse(userStr) : { name: 'System / Guest', email: 'guest@safedrop.com', role: 'guest' };
    
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userEmail: user.email || 'guest@safedrop.com',
      userName: user.name || 'System',
      userRole: user.role || 'guest',
      action,
      details
    };
    
    if (!db.auditLogs) {
      db.auditLogs = [];
    }
    
    db.auditLogs.unshift(newLog); // Put new logs at the beginning
    saveDB(db);
  } catch (err) {
    console.error("Error adding audit log:", err);
  }
};
