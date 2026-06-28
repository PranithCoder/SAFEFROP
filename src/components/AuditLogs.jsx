import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Trash2, 
  Filter, 
  Clock, 
  User, 
  Key, 
  Tag, 
  AlertTriangle 
} from 'lucide-react';
import { getDB, saveDB, addAuditLog } from '../utils/db';

export default function AuditLogs() {
  const [db, setDb] = useState(getDB());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterActionGroup, setFilterActionGroup] = useState('all');
  
  const [currentUser] = useState(() => {
    const userStr = sessionStorage.getItem('safedrop_user');
    return userStr ? JSON.parse(userStr) : null;
  });

  useEffect(() => {
    const handleDbUpdate = () => {
      setDb(getDB());
    };
    window.addEventListener('db-update', handleDbUpdate);
    return () => window.removeEventListener('db-update', handleDbUpdate);
  }, []);

  const handleClearLogs = () => {
    if (window.confirm("ARE YOU SURE? This will permanently delete all historical audit logs. Only the deletion action itself will be preserved.")) {
      const email = currentUser?.email || 'unknown@safedrop.com';
      const name = currentUser?.name || 'Super Admin';
      
      // Seed a fresh audit logs list containing just the clear action
      const freshLogs = [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userEmail: email,
          userName: name,
          userRole: 'super_admin',
          action: 'Audit Logs Cleared',
          details: `All system audit logs were permanently purged by ${name} (${email}).`
        }
      ];

      saveDB({ ...db, auditLogs: freshLogs });
      alert("Audit logs successfully cleared.");
    }
  };

  const getActionBadgeClass = (action) => {
    const act = action.toLowerCase();
    if (act.includes('clear')) return 'badge-error';
    if (act.includes('fail') || act.includes('denied') || act.includes('restrict')) return 'badge-error';
    if (act.includes('login') && act.includes('success')) return 'badge-success';
    if (act.includes('staff') || act.includes('enrolled') || act.includes('update')) return 'badge-primary';
    if (act.includes('schedule') || act.includes('job') || act.includes('sop')) return 'badge-info';
    if (act.includes('invoice') || act.includes('paid') || act.includes('proposal') || act.includes('calc')) return 'badge-warning';
    return 'badge-secondary';
  };

  const formatTimestamp = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (e) {
      return isoString;
    }
  };

  // Filter logs
  const logs = db.auditLogs || [];
  
  const filteredLogs = logs.filter(log => {
    // 1. Search term match
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchLower) ||
      log.userEmail.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.details.toLowerCase().includes(searchLower);

    // 2. Role filter match
    const matchesRole = filterRole === 'all' || log.userRole === filterRole;

    // 3. Action Group filter match
    let matchesGroup = true;
    if (filterActionGroup !== 'all') {
      const act = log.action.toLowerCase();
      if (filterActionGroup === 'login') {
        matchesGroup = act.includes('login') || act.includes('sign in');
      } else if (filterActionGroup === 'staff') {
        matchesGroup = act.includes('staff');
      } else if (filterActionGroup === 'operations') {
        matchesGroup = act.includes('job') || act.includes('sop') || act.includes('schedul') || act.includes('cust') || act.includes('inventory');
      } else if (filterActionGroup === 'financial') {
        matchesGroup = act.includes('invoice') || act.includes('paid') || act.includes('proposal');
      } else if (filterActionGroup === 'security') {
        matchesGroup = act.includes('clear') || act.includes('restrict') || act.includes('denied');
      }
    }

    return matchesSearch && matchesRole && matchesGroup;
  });

  return (
    <div style={{ padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Security &amp; Audit Logs</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Real-time chronological log of administrative and technician actions.</p>
        </div>
        {currentUser?.role === 'super_admin' && logs.length > 1 && (
          <button className="btn btn-secondary" onClick={handleClearLogs} style={{ color: 'var(--color-error)', borderColor: 'rgba(255,23,68,0.2)' }}>
            <Trash2 size={16} /> Clear Audit History
          </button>
        )}
      </div>

      {/* Notice for Admin View Only */}
      {currentUser?.role !== 'super_admin' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--primary)',
          fontSize: '0.9rem',
          marginBottom: '1.5rem'
        }}>
          <ShieldAlert size={18} />
          <span>You are viewing audit logs as <strong>{currentUser?.name} (Admin)</strong>. You have read-only permissions for security records.</span>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search logs by keyword, email, name, action..." 
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'none', padding: 0 }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} color="var(--text-muted)" />
            <select 
              className="form-control" 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '4px 8px', height: '34px', width: '130px' }}
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="technician">Technician</option>
              <option value="guest">Guest</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select 
              className="form-control" 
              value={filterActionGroup} 
              onChange={(e) => setFilterActionGroup(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '4px 8px', height: '34px', width: '150px' }}
            >
              <option value="all">All Actions</option>
              <option value="login">Authentication</option>
              <option value="staff">Staff Changes</option>
              <option value="operations">Operations &amp; Jobs</option>
              <option value="financial">Financials &amp; B2B</option>
              <option value="security">Security Alerts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Clock size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>No matching security logs found in history.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Timestamp</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>User Profile</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Action</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border-color)', 
                      transition: 'background var(--transition-fast)' 
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Timestamp */}
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: 'var(--text-secondary)', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                        <Clock size={12} color="var(--text-muted)" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </td>

                    {/* User profile */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 600 }}>{log.userName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.userEmail}</div>
                      <span className={`badge ${
                        log.userRole === 'super_admin' ? 'badge-error' : 
                        log.userRole === 'admin' ? 'badge-warning' : 'badge-primary'
                      }`} style={{ fontSize: '0.65rem', padding: '1px 6px', marginTop: '4px', display: 'inline-block' }}>
                        {log.userRole === 'super_admin' ? 'Super Admin' : log.userRole === 'admin' ? 'Admin' : 'Technician'}
                      </span>
                    </td>

                    {/* Action badge */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                      <span className={`badge ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Details content */}
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', verticalAlign: 'top', minWidth: '280px' }}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
