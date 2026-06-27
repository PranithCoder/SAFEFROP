import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  FileText, 
  TrendingUp, 
  Wrench, 
  Bell, 
  Menu, 
  X, 
  AlertTriangle,
  Clock,
  LogOut,
  UserCheck
} from 'lucide-react';
import { getDB, getKPIs } from '../utils/db';
import Login from './Login';
import TechnicianView from './TechnicianView';

function SafeDropLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      {/* Droplet Outline */}
      <path 
        d="M50 8C50 8 82 45 82 66C82 83.6731 67.6731 92 50 92C32.3269 92 18 83.6731 18 66C18 45 50 8 50 8Z" 
        stroke="url(#dropletGrad)" 
        strokeWidth="6" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Wave/Water Splash inside bottom */}
      <path 
        d="M21 70C30 63 40 76 50 70C60 64 70 76 79 70C79.8 74.5 80 81 80 84C69 88.5 59 88 50 88C41 88 31 88.5 20 84C20 81 20.2 74.5 21 70Z" 
        fill="url(#dropletGrad)"
      />
      {/* Tank Body (Dark grey cylinder) */}
      <rect x="35" y="44" width="30" height="28" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="2"/>
      {/* Tank Lid */}
      <rect x="44" y="40" width="12" height="4" rx="1" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5"/>
      {/* Tank Ridges / Horizontal bands */}
      <line x1="36" y1="51" x2="64" y2="51" stroke="#38bdf8" strokeWidth="1.5"/>
      <line x1="36" y1="58" x2="64" y2="58" stroke="#38bdf8" strokeWidth="1.5"/>
      <line x1="36" y1="65" x2="64" y2="65" stroke="#38bdf8" strokeWidth="1.5"/>
      {/* Ladder on the right side */}
      <line x1="58" y1="44" x2="58" y2="72" stroke="#e2e8f0" strokeWidth="1.5"/>
      <line x1="58" y1="49" x2="64" y2="49" stroke="#e2e8f0" strokeWidth="1"/>
      <line x1="58" y1="54" x2="64" y2="54" stroke="#e2e8f0" strokeWidth="1"/>
      <line x1="58" y1="59" x2="64" y2="59" stroke="#e2e8f0" strokeWidth="1"/>
      <line x1="58" y1="64" x2="64" y2="64" stroke="#e2e8f0" strokeWidth="1"/>
      <line x1="58" y1="69" x2="64" y2="69" stroke="#e2e8f0" strokeWidth="1"/>
      {/* Gradients definitions */}
      <defs>
        <linearGradient id="dropletGrad" x1="50" y1="8" x2="50" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Layout({ children, activeTab, setActiveTab }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const u = sessionStorage.getItem('safedrop_user');
    return u ? JSON.parse(u) : null;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [db, setDb] = useState(getDB());

  const handleLogout = () => {
    sessionStorage.removeItem('safedrop_user');
    setCurrentUser(null);
  };

  useEffect(() => {
    const handleDbUpdate = () => {
      const updatedDb = getDB();
      setDb(updatedDb);
      generateNotifications(updatedDb);
    };

    handleDbUpdate();
    window.addEventListener('db-update', handleDbUpdate);
    return () => window.removeEventListener('db-update', handleDbUpdate);
  }, []);

  const generateNotifications = (currentDb) => {
    const list = [];
    
    // Check for inventory items that need restocking
    currentDb.inventory.forEach(item => {
      if (item.status === 'Restock Needed') {
        list.push({
          id: `inv-${item.id}`,
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${item.name} is running low. Please reorder.`
        });
      }
    });

    // Check for overdue invoices
    currentDb.invoices.forEach(inv => {
      if (inv.status === 'Sent') {
        const dueDate = new Date(inv.dueDate);
        const today = new Date('2026-06-19'); // Lock current time to matching mock date
        if (dueDate < today) {
          list.push({
            id: `inv-due-${inv.id}`,
            type: 'error',
            title: 'Overdue Invoice',
            message: `${inv.customerName} - ${inv.id} is past due date!`
          });
        }
      }
    });

    // Check for scheduled jobs today (2026-06-19)
    currentDb.jobs.forEach(job => {
      if (job.status === 'Scheduled' && job.scheduledDate === '2026-06-19') {
        list.push({
          id: `job-today-${job.id}`,
          type: 'info',
          title: 'Job Today',
          message: `Clean scheduled for ${job.customerName} today.`
        });
      }
    });

    // Check for hardware store commissions pending payout
    const pendingCommissions = currentDb.leads.filter(l => l.source === 'Hardware Store' && l.status === 'Converted' && !l.commissionPaid);
    if (pendingCommissions.length > 0) {
      list.push({
        id: 'commission-alert',
        type: 'warning',
        title: 'Referral Commission',
        message: `${pendingCommissions.length} referral commission payments pending payout (LKR ${pendingCommissions.length * 500}).`
      });
    }

    setNotifications(list);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'operations', label: 'SOP & Operations', icon: CheckSquare },
    { id: 'crm', label: 'Customers & CRM', icon: Users },
    { id: 'staff', label: 'Staff & Crews', icon: UserCheck },
    { id: 'b2b', label: 'B2B & Invoices', icon: FileText },
    { id: 'marketing', label: 'Marketing & Leads', icon: TrendingUp },
    { id: 'inventory', label: 'Equipment & Stock', icon: Wrench },
  ];

  // 1. If not logged in, render the Login Screen
  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // 2. If logged in as Technician, render their dedicated route runsheet
  if (currentUser.role === 'technician') {
    return <TechnicianView user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* Mobile Top Header */}
      <header className="mobile-header no-print" style={{
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 1rem',
        height: '60px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SafeDropLogo size={24} />
          <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.2rem', background: 'linear-gradient(90deg, #38bdf8, #0284c7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SafeDrop</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', position: 'relative' }}
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '15px', height: '15px', backgroundColor: 'var(--color-error)', borderRadius: '50%', fontSize: '10px', color: 'white', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {notifications.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`sidebar no-print ${mobileMenuOpen ? 'open' : ''}`}>
        <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', height: '80px' }}>
          <SafeDropLogo size={36} />
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.1, background: 'linear-gradient(90deg, #38bdf8, #0284c7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SAFEDROP</h1>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 700 }}>TANK MAINTENANCE</span>
          </div>
        </div>

        <nav style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'var(--primary-glow)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.95rem',
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 500,
                  transition: 'all var(--transition-fast)',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Notification Button in Desktop Sidebar */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold', color: '#38bdf8', border: '1px solid var(--border-color)', flexShrink: 0 }}>
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{currentUser.role.replace('_', ' ')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--text-secondary)', 
                cursor: 'pointer', 
                position: 'relative',
                padding: '6px',
                borderRadius: '4px',
                transition: 'background var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '16px', height: '16px', backgroundColor: 'var(--color-error)', borderRadius: '50%', fontSize: '10px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {notifications.length}
                </span>
              )}
            </button>
            <button 
              onClick={handleLogout}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--color-error)', 
                cursor: 'pointer', 
                padding: '6px',
                borderRadius: '4px',
                transition: 'background var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 23, 68, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Notifications Panel Modal */}
      {showNotifications && (
        <div className="no-print" style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 300,
          padding: '1rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Bell size={16} color="var(--primary)" /> Operations Alerts</h3>
            <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>Close</button>
          </div>
          {notifications.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0', textAlign: 'center' }}>No active alerts. All operations clear!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.map((notif) => (
                <div key={notif.id} style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderLeft: `3px solid ${notif.type === 'error' ? 'var(--color-error)' : notif.type === 'warning' ? 'var(--color-warning)' : 'var(--color-info)'}`,
                  fontSize: '0.8rem'
                }}>
                  <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', color: notif.type === 'error' ? 'var(--color-error)' : notif.type === 'warning' ? 'var(--color-warning)' : 'var(--color-info)' }}>
                    {notif.type === 'error' && <AlertTriangle size={12} />}
                    {notif.type === 'warning' && <AlertTriangle size={12} />}
                    {notif.type === 'info' && <Clock size={12} />}
                    {notif.title}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{notif.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Page Area */}
      <main className="main-content" style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
