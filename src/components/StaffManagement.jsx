import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Search, 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Check, 
  X, 
  Edit2, 
  Users,
  Briefcase,
  Compass,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { getDB, saveDB, generateStaffID, addAuditLog } from '../utils/db';
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

export default function StaffManagement() {
  const [db, setDb] = useState(getDB());
  const [currentUser] = useState(() => {
    const userStr = sessionStorage.getItem('safedrop_user');
    return userStr ? JSON.parse(userStr) : null;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  
  // New/Edit Staff Form State
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'technician',
    crewName: 'Crew A - Shan & Arul',
    status: 'Active'
  });

  // Generated Staff ID preview
  const [previewId, setPreviewId] = useState('');

  useEffect(() => {
    const handleDbUpdate = () => {
      setDb(getDB());
    };
    window.addEventListener('db-update', handleDbUpdate);
    return () => window.removeEventListener('db-update', handleDbUpdate);
  }, []);

  // Update preview ID whenever modal opens or database changes
  useEffect(() => {
    if (showEnrollModal && !editingStaffId) {
      setPreviewId(generateStaffID(db));
    }
  }, [showEnrollModal, editingStaffId, db]);

  const handleEnrollStaff = async (e) => {
    e.preventDefault();
    
    if (editingStaffId) {
      // Editing existing staff
      const updatedUsers = db.users.map(u => {
        if (u.id === editingStaffId) {
          return {
            ...u,
            name: staffForm.name,
            email: staffForm.email,
            password: staffForm.password || u.password, // Keep old password if blank
            role: staffForm.role,
            crewName: staffForm.role === 'technician' ? staffForm.crewName : '',
            status: staffForm.status
          };
        }
        return u;
      });
      saveDB({ ...db, users: updatedUsers });
      addAuditLog('Staff Updated', `Updated staff profile for: ${staffForm.name} (${staffForm.email})`);
      alert("Staff profile updated successfully!");
    } else {
      // Registering new staff
      const newId = generateStaffID(db);
      
      const newStaffObj = {
        id: newId,
        name: staffForm.name,
        email: staffForm.email,
        password: staffForm.password,
        role: staffForm.role,
        crewName: staffForm.role === 'technician' ? staffForm.crewName : '',
        status: staffForm.status,
        // Initial coordinates for live GPS tracking (Trincomalee Town area)
        lat: staffForm.role === 'technician' ? Number((8.5670 + (Math.random() - 0.5) * 0.02).toFixed(4)) : 0,
        lng: staffForm.role === 'technician' ? Number((81.2330 + (Math.random() - 0.5) * 0.02).toFixed(4)) : 0
      };

      // Register in Firebase Auth via secondary App helper to preserve current admin login session
      let authRegisterSuccess = false;
      try {
        const firebaseConfig = {
          apiKey: "AIzaSyCEm7q6HoCRWu9mhqTewXfhYEe5ungbCWs",
          authDomain: "safe-drop-a2693.firebaseapp.com",
          projectId: "safe-drop-a2693",
          storageBucket: "safe-drop-a2693.firebasestorage.app",
          messagingSenderId: "869723417230",
          appId: "1:869723417230:web:8f9d5fe9136fe3e3ec77df",
          measurementId: "G-ELR6ZH2QBR"
        };
        const tempApp = initializeApp(firebaseConfig, `TempEnrollApp-${Date.now()}`);
        const tempAuth = getAuth(tempApp);
        await createUserWithEmailAndPassword(tempAuth, staffForm.email, staffForm.password);
        await tempApp.delete();
        authRegisterSuccess = true;
      } catch (authErr) {
        console.error("Error creating Auth user during enrollment:", authErr);
        alert(`Auth system notice: Created staff in database, but Firebase Auth registration failed: "${authErr.message}" (Ensure Email/Password provider is enabled in Firebase Console)`);
      }

      const updatedUsers = [...db.users, newStaffObj];
      saveDB({ ...db, users: updatedUsers });
      addAuditLog('Staff Enrolled', `Enrolled new staff member: ${staffForm.name} (${staffForm.email}) as ${staffForm.role}. Auth status: ${authRegisterSuccess ? 'Registered' : 'Skipped/Failed'}`);
      alert(`Staff enrolled successfully with ID: ${newId}`);
    }

    closeModal();
  };

  const startEdit = (user) => {
    setEditingStaffId(user.id);
    setStaffForm({
      name: user.name,
      email: user.email,
      password: '', // Blank represents no change
      role: user.role,
      crewName: user.crewName || 'Crew A - Shan & Arul',
      status: user.status || 'Active'
    });
    setPreviewId(user.id);
    setShowEnrollModal(true);
  };

  const toggleStaffStatus = (userId) => {
    let affectedUser = '';
    let nextStatusVal = '';
    const updatedUsers = db.users.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'Inactive' ? 'Active' : 'Inactive';
        affectedUser = `${u.name} (${u.email})`;
        nextStatusVal = nextStatus;
        return { ...u, status: nextStatus };
      }
      return u;
    });
    saveDB({ ...db, users: updatedUsers });
    addAuditLog('Staff Status Changed', `Changed status for ${affectedUser} to ${nextStatusVal}`);
  };

  const closeModal = () => {
    setShowEnrollModal(false);
    setEditingStaffId(null);
    setStaffForm({
      name: '',
      email: '',
      password: '',
      role: 'technician',
      crewName: 'Crew A - Shan & Arul',
      status: 'Active'
    });
  };

  const filteredUsers = db.users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (u.id && u.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (u.crewName && u.crewName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchSearch;
  });

  // Calculate local stats
  const totalStaff = db.users.length;
  const activeCrews = db.users.filter(u => u.role === 'technician' && u.status !== 'Inactive').length;
  const adminCount = db.users.filter(u => u.role === 'admin' || u.role === 'super_admin').length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Staff &amp; Crews</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Enroll new crew members, define roles, and monitor status.</p>
        </div>
        {currentUser?.role === 'super_admin' && (
          <button className="btn btn-primary" onClick={() => setShowEnrollModal(true)}>
            <UserPlus size={16} /> Enroll New Staff
          </button>
        )}
      </div>

      {/* Admin Notice */}
      {currentUser?.role !== 'super_admin' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          backgroundColor: 'rgba(255, 179, 0, 0.1)',
          border: '1px solid rgba(255, 179, 0, 0.25)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-warning)',
          fontSize: '0.9rem',
          marginBottom: '1.5rem'
        }}>
          <AlertTriangle size={18} />
          <span><strong>Notice:</strong> Staff management modifications (enrolling, editing, deactivating accounts) are restricted to Super Admins only.</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-panel kpi-card">
          <div className="kpi-header">
            <span>Total Enrolled Staff</span>
            <Users size={18} color="var(--primary)" />
          </div>
          <div className="kpi-value">{totalStaff}</div>
          <div className="kpi-subtext">Registered in system database</div>
        </div>

        <div className="glass-panel kpi-card kpi-success">
          <div className="kpi-header">
            <span>Active Technician Crews</span>
            <Compass size={18} color="var(--color-success)" />
          </div>
          <div className="kpi-value">{activeCrews}</div>
          <div className="kpi-subtext">Crews broadcasting GPS signals</div>
        </div>

        <div className="glass-panel kpi-card kpi-warning">
          <div className="kpi-header">
            <span>System Administrators</span>
            <ShieldCheck size={18} color="var(--color-warning)" />
          </div>
          <div className="kpi-value">{adminCount}</div>
          <div className="kpi-subtext">Role-based controls enabled</div>
        </div>
      </div>

      {/* Search directory */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search staff by ID, name, email, or crew assignment..." 
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'none', padding: 0 }}
          />
        </div>
      </div>

      {/* Staff directory grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {filteredUsers.map(user => (
          <div key={user.email} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: `4px solid ${user.status === 'Inactive' ? 'var(--color-error)' : 'var(--primary)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ fontSize: '1.15rem' }}>{user.name}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {user.id || 'N/A'}</span>
              </div>
              <span className={`badge ${
                user.role === 'super_admin' ? 'badge-error' : 
                user.role === 'admin' ? 'badge-warning' : 'badge-primary'
              }`}>
                {user.role === 'super_admin' ? 'SUPER ADMIN' : user.role === 'admin' ? 'ADMIN' : 'TECHNICIAN'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={14} /> {user.email}</div>
              {user.role === 'technician' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Briefcase size={14} /> {user.crewName || 'No crew assigned'}</div>
              )}
              {user.role === 'technician' && user.status !== 'Inactive' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                  <Compass size={14} /> Live GPS: {user.lat || '8.5670'}, {user.lng || '81.2330'}
                </div>
              )}
            </div>

            {currentUser?.role === 'super_admin' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <button 
                  onClick={() => toggleStaffStatus(user.id)}
                  className={`btn ${user.status === 'Inactive' ? 'btn-secondary' : 'btn-secondary'}`}
                  style={{ 
                    padding: '4px 10px', 
                    fontSize: '0.75rem', 
                    color: user.status === 'Inactive' ? 'var(--color-success)' : 'var(--color-error)',
                    borderColor: user.status === 'Inactive' ? 'rgba(0,230,118,0.15)' : 'rgba(255,23,68,0.15)'
                  }}
                >
                  {user.status === 'Inactive' ? <Check size={12} /> : <X size={12} />}
                  {user.status === 'Inactive' ? 'Set Active' : 'Deactivate'}
                </button>

                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                  onClick={() => startEdit(user)}
                >
                  <Edit2 size={12} /> Edit Profile
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px', textAlign: 'center', fontStyle: 'italic' }}>
                View Only (Super Admin action required to edit)
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Enroll / Edit Staff Modal */}
      {showEnrollModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
              {editingStaffId ? 'Edit Staff Profile' : 'Enroll Staff Member'}
            </h3>
            
            <form onSubmit={handleEnrollStaff}>
              <div className="form-group">
                <label>Automatic Serial Staff ID</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={previewId}
                  disabled
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-secondary)' }}
                />
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Shan & Arul or Ravi & Niro or Admin Name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address (User Login)</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="e.g. tech@safedrop.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password {editingStaffId && '(Leave blank to keep unchanged)'}</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  placeholder={editingStaffId ? '••••••••' : 'Password (minimum 6 characters)'}
                  required={!editingStaffId}
                />
              </div>

              <div className="details-grid" style={{ marginBottom: 0 }}>
                <div className="form-group">
                  <label>System Authorization Role</label>
                  <select 
                    className="form-control"
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  >
                    <option value="technician">Technician Crew</option>
                    <option value="admin">Operations Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Operational Status</label>
                  <select 
                    className="form-control"
                    value={staffForm.status}
                    onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              {staffForm.role === 'technician' && (
                <div className="form-group">
                  <label>Crew Identifier / Crew Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={staffForm.crewName}
                    onChange={(e) => setStaffForm({ ...staffForm, crewName: e.target.value })}
                    placeholder="e.g. Crew C - Shan & Ravi"
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Used to route scheduled jobs to their runsheet in the technician app.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
