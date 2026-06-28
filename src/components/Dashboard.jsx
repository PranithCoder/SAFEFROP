import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Wrench, 
  DollarSign, 
  Award, 
  Percent, 
  Clock, 
  Briefcase,
  AlertCircle,
  Compass
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getDB, getKPIs } from '../utils/db';

export default function Dashboard({ setActiveTab }) {
  const [db, setDb] = useState(getDB());
  const [kpis, setKpis] = useState(getKPIs(db));
  const [currentUser] = useState(() => {
    const u = sessionStorage.getItem('safedrop_user');
    return u ? JSON.parse(u) : null;
  });

  useEffect(() => {
    const handleDbUpdate = () => {
      const updatedDb = getDB();
      setDb(updatedDb);
      setKpis(getKPIs(updatedDb));
    };
    window.addEventListener('db-update', handleDbUpdate);
    return () => window.removeEventListener('db-update', handleDbUpdate);
  }, []);

  // Format currency
  const formatLKR = (val) => {
    return `LKR ${val.toLocaleString('en-US')}`;
  };

  // Mock monthly revenue data for 2026
  const revenueTrendData = [
    { name: 'Jan', Revenue: 15000, Target: 20000 },
    { name: 'Feb', Revenue: 22000, Target: 25000 },
    { name: 'Mar', Revenue: 34000, Target: 30000 },
    { name: 'Apr', Revenue: 37000, Target: 35000 },
    { name: 'May', Revenue: 42000, Target: 40000 },
    { name: 'Jun (Est)', Revenue: kpis.totalRevenue, Target: 45000 }
  ];

  // Pie chart data for business model mix
  const recurringMixData = [
    { name: 'VIP Subscriptions', value: db.invoices.filter(i => i.total === 8000).reduce((a, b) => a + b.total, 0) },
    { name: 'Commercial AMCs', value: db.invoices.filter(i => i.total > 8000).reduce((a, b) => a + b.total, 0) },
    { name: 'Walk-in Cleanings', value: db.invoices.filter(i => i.total < 8000).reduce((a, b) => a + b.total, 0) }
  ];

  // If no revenues yet, insert default mock values
  if (recurringMixData.every(x => x.value === 0)) {
    recurringMixData[0].value = 8000;
    recurringMixData[1].value = 17500;
    recurringMixData[2].value = 5000;
  }

  const COLORS = ['#00e5ff', '#00e676', '#ffb300'];

  // Calculate Year 1 Progress
  const annualTarget = 600000;
  // Combine all months + current month
  const totalYtdRevenue = 15000 + 22000 + 34000 + 37000 + 42000 + kpis.totalRevenue;
  const targetPercent = Math.min(Math.round((totalYtdRevenue / annualTarget) * 100), 100);

  return (
    <div>
      {/* Title */}
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Executive Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Operational overview of SafeDrop water tank cleaning activities.</p>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} color="var(--primary)" />
          <span>Local Time: 13:58 PM (Dry Season)</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid">
        {currentUser?.role === 'super_admin' ? (
          <div className="glass-panel kpi-card">
            <div className="kpi-header">
              <span>Total Revenue</span>
              <DollarSign size={18} color="var(--primary)" />
            </div>
            <div className="kpi-value">{formatLKR(kpis.totalRevenue)}</div>
            <div className="kpi-subtext">
              <span style={{ color: 'var(--secondary)' }}>+14.2%</span> vs last month
            </div>
          </div>
        ) : (
          <div className="glass-panel kpi-card" style={{ opacity: 0.85 }}>
            <div className="kpi-header">
              <span>Total Revenue</span>
              <DollarSign size={18} color="var(--text-muted)" />
            </div>
            <div className="kpi-value" style={{ fontSize: '1.25rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', height: '38px' }}>
              🔒 Super Admin Only
            </div>
            <div className="kpi-subtext">Restricted financial data</div>
          </div>
        )}

        {currentUser?.role === 'super_admin' ? (
          <div className="glass-panel kpi-card kpi-success">
            <div className="kpi-header">
              <span>Gross Profit Margin</span>
              <Percent size={18} color="var(--secondary)" />
            </div>
            <div className="kpi-value">{kpis.grossProfitMargin.toFixed(1)}%</div>
            <div className="kpi-subtext">
              <span style={{ color: 'var(--secondary)' }}>Target: &gt;65%</span> (WHO SOP compliance)
            </div>
          </div>
        ) : (
          <div className="glass-panel kpi-card" style={{ opacity: 0.85 }}>
            <div className="kpi-header">
              <span>Gross Profit Margin</span>
              <Percent size={18} color="var(--text-muted)" />
            </div>
            <div className="kpi-value" style={{ fontSize: '1.25rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', height: '38px' }}>
              🔒 Super Admin Only
            </div>
            <div className="kpi-subtext">Restricted margin data</div>
          </div>
        )}

        <div className="glass-panel kpi-card">
          <div className="kpi-header">
            <span>Recurring Revenue Mix</span>
            <Users size={18} color="var(--primary)" />
          </div>
          <div className="kpi-value">{kpis.recurringMix.toFixed(0)}%</div>
          <div className="kpi-subtext">
            <span>VIPs &amp; AMCs active: {db.customers.filter(c => c.plan !== 'walk-in').length}</span>
          </div>
        </div>

        <div className="glass-panel kpi-card kpi-warning">
          <div className="kpi-header">
            <span>Technician Utilization</span>
            <Clock size={18} color="var(--color-warning)" />
          </div>
          <div className="kpi-value">{kpis.techUtilization}%</div>
          <div className="kpi-subtext">
            <span style={{ color: 'var(--color-warning)' }}>Target: 75%</span> (2 crews active)
          </div>
        </div>
      </div>

      {/* Charts & Graphs Grid */}
      <div className="split-layout-asymmetric-dashboard" style={{ marginBottom: '2rem' }}>
        {/* Revenue Trend Area Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '350px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="var(--primary)" /> Revenue Growth Trend (LKR YTD)
          </h3>
          {currentUser?.role === 'super_admin' ? (
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(val) => `LKR ${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    formatter={(value) => [formatLKR(value), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="Revenue" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
              <span>🔒 Financial trend charts are restricted to Super Admin.</span>
            </div>
          )}
        </div>

        {/* Business Model Breakdown */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Income Breakdown</h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={recurringMixData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {recurringMixData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  formatter={(value) => [formatLKR(value), '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CLV:CAC Ratio</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--secondary)' }}>{kpis.clvToCac}x</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '1rem', fontSize: '0.8rem' }}>
            {recurringMixData.map((item, index) => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[index] }}></span>
                  {item.name}
                </span>
                <span style={{ fontWeight: 'bold' }}>{formatLKR(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Target Progress & Checklist Tracker */}
      <div className="cards-grid">
        {/* Year 1 Goal Tracker */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} color="var(--primary)" /> Year 1 Growth Target
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Targeting LKR 600,000 in gross service revenues. Currently scaled at 2 crews across SafeDrop service regions.
          </p>
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Progress to Goal</span>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{targetPercent}% ({formatLKR(totalYtdRevenue)} / {formatLKR(annualTarget)})</span>
            </div>
            <div style={{ height: '12px', width: '100%', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${targetPercent}%`, background: 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: '6px', transition: 'width 1s ease-in-out' }}></div>
            </div>
          </div>

          <div className="photo-capture-grid" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg CAC</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatLKR(kpis.cac)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Customer Value</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatLKR(kpis.clv)}</div>
            </div>
          </div>
        </div>

        {/* Live Technician Tracker Widget */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={20} color="var(--primary)" /> Crew Live GPS Tracker
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Broadcasting live GPS coordinates from technicians in the field.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {db.users.filter(u => u.role === 'technician').map(tech => {
              const activeJob = db.jobs.find(j => j.crewName === tech.crewName && j.status === 'In Progress');
              return (
                <div key={tech.email} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)', display: 'inline-block' }}></span>
                      <strong>{tech.crewName.split(' - ')[0]} ({tech.name})</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      GPS: <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 'bold' }}>{tech.lat}, {tech.lng}</span>
                    </div>
                    {activeJob ? (
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-warning)', marginTop: '4px' }}>
                        Cleaning: <strong>{activeJob.customerName}</strong>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Status: Idle / En route
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <div>Last Broadcast</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>{tech.lastUpdated || '13:58 PM'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Checklist / Launch Progress */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Crew Operational Checklist</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ padding: '4px', borderRadius: '50%', backgroundColor: 'var(--secondary-glow)', color: 'var(--secondary)', display: 'flex', marginTop: '2px' }}>
                <Award size={14} />
              </span>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Business Registered &amp; Div Secretariate</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}> divisional registration complete, local commercial account open.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ padding: '4px', borderRadius: '50%', backgroundColor: 'var(--secondary-glow)', color: 'var(--secondary)', display: 'flex', marginTop: '2px' }}>
                <Award size={14} />
              </span>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Equipment Stock Checked</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ingco 1800W washer &amp; pump purchased for LKR 33,950 total.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ padding: '4px', borderRadius: '50%', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', marginTop: '2px' }}>
                <AlertCircle size={14} />
              </span>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>SOP Checklist Standardisation</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Waterproof stickers ready. 1 clean in progress. Check details.</div>
                <button 
                  onClick={() => setActiveTab('operations')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', marginTop: '4px', padding: 0 }}
                >
                  View Active Jobs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
