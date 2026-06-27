import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  MapPin, 
  Phone, 
  Layers, 
  Calendar, 
  Camera, 
  Compass, 
  ShieldAlert, 
  ClipboardCheck, 
  Navigation,
  LogOut
} from 'lucide-react';
import { getDB, saveDB } from '../utils/db';

export default function TechnicianView({ user, onLogout }) {
  const [db, setDb] = useState(getDB());
  const [activeJobId, setActiveJobId] = useState(null);

  // Active Job Details
  const activeJob = db.jobs.find(j => j.id === activeJobId) || null;

  // Sync state on DB update
  useEffect(() => {
    const handleDbUpdate = () => {
      setDb(getDB());
    };
    window.addEventListener('db-update', handleDbUpdate);
    return () => window.removeEventListener('db-update', handleDbUpdate);
  }, []);

  // Live Location broadcasting simulation
  useEffect(() => {
    // Generate minor drift around Trincomalee center to simulate technician movement
    const updateLocation = () => {
      const currentDb = getDB();
      const updatedUsers = currentDb.users.map(u => {
        if (u.email === user.email) {
          // Slight coordinate drift: +/- 0.0005 degrees
          const driftLat = (Math.random() - 0.5) * 0.001;
          const driftLng = (Math.random() - 0.5) * 0.001;
          return {
            ...u,
            lat: Number((u.lat + driftLat).toFixed(6)),
            lng: Number((u.lng + driftLng).toFixed(6)),
            lastUpdated: new Date().toLocaleTimeString()
          };
        }
        return u;
      });
      saveDB({ ...currentDb, users: updatedUsers });
    };

    // Update location every 8 seconds
    updateLocation();
    const interval = setInterval(updateLocation, 8000);
    return () => clearInterval(interval);
  }, [user]);

  // SOP Steps Checklist mapping
  // We pair the 12 detailed SOP steps to the 6 DB properties so the database remains compatible.
  const subSteps = [
    { key: 'ppe', dbKey: 'beforePrep', title: '1. PPE Compliance', desc: 'Put on safety boots, gloves, harness, mask & goggles.' },
    { key: 'structure', dbKey: 'beforePrep', title: '2. Structure Check', desc: 'Inspect walls, lid, and base for cracks or structural leaks.' },
    { key: 'isolate', dbKey: 'beforePrep', title: '3. Valve Isolation', desc: 'Close main water inlet valves (lockout/tagout) to isolate the system.' },
    { key: 'photoB', dbKey: 'beforePrep', title: '4. Before Photo Uploaded', desc: 'Capture a clear, well-lit photo of the interior tank before cleaning.' },
    
    { key: 'sludge', dbKey: 'drainPump', title: '5. Sludge Pump Out', desc: 'Lower submersible pump and evacuate bottom mud safely to drainage.' },
    { key: 'drain', dbKey: 'drainPump', title: '6. Drain Tank', desc: 'Ensure water level is completely dry for technicians.' },
    
    { key: 'wash', dbKey: 'pressureWash', title: '7. High-Pressure Wash', desc: 'Blast walls, ceiling, and floor with the 1800W washer.' },
    
    { key: 'scrub', dbKey: 'vacScrape', title: '8. Scrubbing & Scrape', desc: 'Hand-scrub bio-film and algae from corners and joint lines.' },
    { key: 'vacuum', dbKey: 'vacScrape', title: '9. Wet Vacuuming', desc: 'Use the wet/dry vacuum to extract remaining sand silt and standing water.' },
    
    { key: 'disinfect', dbKey: 'rinseAfter', title: '10. Disinfection Rinse', desc: 'Spray bio-sanitizer or perform a final clean-water rinse.' },
    { key: 'photoA', dbKey: 'rinseAfter', title: '11. After Photo Uploaded', desc: 'Capture clean interior showing spotless tank walls and floor.' },
    
    { key: 'sticker', dbKey: 'stickerDoc', title: '12. Sticker & Sign-off', desc: 'Affix waterproof date reminder sticker next to pump switch.' }
  ];

  // Helper to check if a sub-step is completed
  // For standard checks, we verify if the parent dbKey is true.
  // For photo checks, we check if beforePhoto or afterPhoto is uploaded.
  // For sticker check, we check if stickerDoc is true.
  const isSubstepCompleted = (job, step) => {
    if (!job) return false;
    if (step.key === 'photoB') return !!job.beforePhoto;
    if (step.key === 'photoA') return !!job.afterPhoto;
    return !!job.sopSteps[step.dbKey];
  };

  const handleToggleSubstep = (jobId, step) => {
    const job = db.jobs.find(j => j.id === jobId);
    if (!job) return;

    let updatedJobs = [...db.jobs];
    
    // Photo simulation triggers
    if (step.key === 'photoB' && !job.beforePhoto) {
      alert("Please upload the 'Before Photo' first.");
      return;
    }
    if (step.key === 'photoA' && !job.afterPhoto) {
      alert("Please upload the 'After Photo' first.");
      return;
    }

    // Toggle the parent database key
    // For grouped steps, we auto-enable the key when the grouped components are satisfied.
    // To keep it direct, we toggle the parent key.
    const currentVal = job.sopSteps[step.dbKey];
    const nextSteps = { ...job.sopSteps, [step.dbKey]: !currentVal };
    
    let nextStatus = job.status;
    let completedDate = job.completedDate;
    
    if (nextStatus === 'Scheduled') {
      nextStatus = 'In Progress';
    }

    // Auto transition to completed if all 6 checklist groups are set
    const allChecked = Object.values(nextSteps).every(v => v === true);
    if (allChecked && job.beforePhoto && job.afterPhoto && job.stickerSerial) {
      nextStatus = 'Completed';
      completedDate = new Date().toISOString().split('T')[0];
      handleCustomerPlanUpdate(job.customerId, job.price);
    } else {
      if (nextStatus === 'Completed') {
        nextStatus = 'In Progress';
        completedDate = '';
      }
    }

    updatedJobs = db.jobs.map(j => {
      if (j.id === jobId) {
        return { ...j, sopSteps: nextSteps, status: nextStatus, completedDate };
      }
      return j;
    });

    saveDB({ ...db, jobs: updatedJobs });
  };

  const handleCustomerPlanUpdate = (customerId, jobPrice) => {
    let invoicesUpdated = [...db.invoices];
    const customersUpdated = db.customers.map(c => {
      if (c.id === customerId) {
        if (c.plan === 'vip') {
          return { ...c, vipCleansRemaining: Math.max(0, c.vipCleansRemaining - 1) };
        } else if (c.plan === 'amc') {
          const monthsToAdd = c.amcFrequency > 0 ? 12 / c.amcFrequency : 6;
          const nextDate = new Date();
          nextDate.setMonth(nextDate.getMonth() + monthsToAdd);
          return { ...c, amcNextVisit: nextDate.toISOString().split('T')[0] };
        } else {
          // Walk-in clean invoice
          const invId = `INV-2026-${String(db.invoices.length + 1).padStart(3, '0')}`;
          invoicesUpdated.push({
            id: invId,
            customerId: c.id,
            customerName: c.name,
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
            items: [{ description: `Standard Residential Tank Cleaning - ${c.tankSize}L`, amount: jobPrice }],
            total: jobPrice,
            status: 'Sent',
            paymentMethod: '',
            paymentDate: ''
          });
        }
      }
      return c;
    });

    saveDB({ ...db, customers: customersUpdated, invoices: invoicesUpdated });
  };

  const handleUploadPhoto = (jobId, type) => {
    const updatedJobs = db.jobs.map(j => {
      if (j.id === jobId) {
        if (type === 'before') {
          return {
            ...j,
            beforePhoto: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%234A3828"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23fff">BEFORE: Heavy silt &amp; bio-crust</text></svg>'
          };
        } else {
          return {
            ...j,
            afterPhoto: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%230284c7"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23fff">AFTER: Disinfected &amp; Clean blue</text></svg>'
          };
        }
      }
      return j;
    });
    saveDB({ ...db, jobs: updatedJobs });
  };

  const handleSerialChange = (jobId, val) => {
    const updatedJobs = db.jobs.map(j => {
      if (j.id === jobId) {
        return { ...j, stickerSerial: val };
      }
      return j;
    });
    saveDB({ ...db, jobs: updatedJobs });
  };

  // Filter jobs for this specific technician crew
  const myJobs = db.jobs.filter(j => j.crewName === user.crewName);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Mobile Top bar */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 1.25rem',
        height: '65px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-glow)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '0.85rem'
          }}>SD</div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>SafeDrop</h1>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TECH PORTAL</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.name}</span>
          <button 
            onClick={onLogout}
            style={{
              background: 'rgba(255, 23, 68, 0.1)',
              border: '1px solid rgba(255, 23, 68, 0.2)',
              color: 'var(--color-error)',
              padding: '6px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main content grid */}
      <main style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Connection status and simulated GPS */}
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
            <Compass size={14} className="spin" color="var(--primary)" />
            <span style={{ color: 'var(--text-secondary)' }}>Broadcasting Live GPS Position...</span>
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            {user.lat}, {user.lng}
          </div>
        </div>

        {/* Outer Split layout */}
        <div style={{ display: 'grid', gridTemplateColumns: myJobs.length > 0 ? '1fr' : '1fr', gap: '1.25rem' }}>
          
          {/* Active Job Route Queue */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardCheck size={18} color="var(--primary)" /> Today's Assigned Route ({myJobs.length} Jobs)
            </h3>
            
            {myJobs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 1rem', fontSize: '0.85rem' }}>
                No jobs dispatched to your crew today.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myJobs.map(job => (
                  <div 
                    key={job.id} 
                    onClick={() => setActiveJobId(job.id)}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: activeJobId === job.id ? 'var(--bg-tertiary)' : 'rgba(255, 255, 255, 0.01)',
                      border: `1px solid ${activeJobId === job.id ? 'var(--primary)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.95rem', color: activeJobId === job.id ? 'var(--primary)' : 'inherit' }}>
                        {job.customerName}
                      </strong>
                      <span className={`badge ${
                        job.status === 'Completed' ? 'badge-success' : 
                        job.status === 'In Progress' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {job.location}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Layers size={12} /> {job.tankSize}L Tank</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SOP Checklist details */}
          {activeJob && (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '0.05em' }}>
                  ACTIVE RUNSHEET ({activeJob.id})
                </span>
                <h3 style={{ fontSize: '1.3rem', marginTop: '2px' }}>{activeJob.customerName}</h3>
                
                {/* Contact phone actions */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '8px' }}>
                  <a 
                    href={`tel:${activeJob.customerPhone}`}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Phone size={14} /> Call Client
                  </a>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeJob.customerName + ' ' + activeJob.location)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Navigation size={14} /> Navigate
                  </a>
                </div>
              </div>

              {/* Photo capture section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Before Photo</span>
                  {activeJob.beforePhoto ? (
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', height: '90px' }}>
                      <img src={activeJob.beforePhoto} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleUploadPhoto(activeJob.id, 'before')}
                      style={{ height: '90px', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}
                    >
                      <Camera size={18} />
                      Capture Photo
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>After Photo</span>
                  {activeJob.afterPhoto ? (
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', height: '90px' }}>
                      <img src={activeJob.afterPhoto} alt="After" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleUploadPhoto(activeJob.id, 'after')}
                      style={{ height: '90px', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}
                    >
                      <Camera size={18} />
                      Capture Photo
                    </button>
                  )}
                </div>
              </div>

              {/* Waterproof Sticker Input */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Sticker Serial Number (Required)
                </label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. SDP-9984"
                  value={activeJob.stickerSerial || ''}
                  onChange={(e) => handleSerialChange(activeJob.id, e.target.value)}
                />
              </div>

              {/* 12-Step checklist items */}
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                12-Step Water Tank Cleaning SOP
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {subSteps.map(step => {
                  const isChecked = isSubstepCompleted(activeJob, step);
                  return (
                    <div 
                      key={step.key} 
                      onClick={() => handleToggleSubstep(activeJob.id, step)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isChecked ? 'rgba(0,230,118,0.03)' : 'rgba(255,255,255,0.01)',
                        border: `1px solid ${isChecked ? 'rgba(0,230,118,0.2)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: `2px solid ${isChecked ? 'var(--secondary)' : 'var(--text-muted)'}`,
                        backgroundColor: isChecked ? 'var(--secondary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: '#002b11',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        {isChecked && "✓"}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isChecked ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: isChecked ? 'line-through' : 'none' }}>
                          {step.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
