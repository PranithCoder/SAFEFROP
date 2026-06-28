import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Calendar, 
  User, 
  MapPin, 
  Layers, 
  DollarSign, 
  Camera, 
  Award, 
  Printer, 
  Plus, 
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { getDB, saveDB, addAuditLog } from '../utils/db';

export default function Operations() {
  const [db, setDb] = useState(getDB());
  const [activeJobId, setActiveJobId] = useState(null);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showReportView, setShowReportView] = useState(false);
  
  // Form State for new job
  const [newJob, setNewJob] = useState({
    customerId: '',
    scheduledDate: '',
    crewName: 'Crew A - Shan & Arul',
    technicianNotes: ''
  });

  useEffect(() => {
    const handleDbUpdate = () => {
      setDb(getDB());
    };
    window.addEventListener('db-update', handleDbUpdate);
    return () => window.removeEventListener('db-update', handleDbUpdate);
  }, []);

  const activeJob = db.jobs.find(j => j.id === activeJobId) || null;

  // Save changes locally
  const updateJobsList = (updatedJobs) => {
    const updatedDb = { ...db, jobs: updatedJobs };
    saveDB(updatedDb);
  };

  // SOP Steps definitions
  const sopStepsList = [
    { key: 'beforePrep', title: 'Before Photo & Prep', desc: 'Secure roof area, snap before photo, close water inlet valve, open drain valve.' },
    { key: 'drainPump', title: 'Drain & Pump Out', desc: 'Activate submersible pump in muddy bottom sludge, drain dirty water safely.' },
    { key: 'pressureWash', title: 'High-Pressure Washing', desc: 'Wear PPE. Blast tank walls and floor with Ingco 1800W washer (no chemical wash).' },
    { key: 'vacScrape', title: 'Scrape & Wet/Dry Vac', desc: 'Manually scrape bio-sludge corners, vacuum loose sand debris to spotless base.' },
    { key: 'rinseAfter', title: 'Rinse & After Photo', desc: 'Final freshwater rinse, capture after photo of sparkling clean tank floor.' },
    { key: 'stickerDoc', title: 'Service Sticker & Report', desc: 'Affix waterproof date sticker next to pump switch. Log serial number.' }
  ];

  // Toggle SOP checklist items
  const handleToggleStep = (jobId, stepKey) => {
    let actionLog = '';
    const updatedJobs = db.jobs.map(j => {
      if (j.id === jobId) {
        const nextSteps = { ...j.sopSteps, [stepKey]: !j.sopSteps[stepKey] };
        let nextStatus = j.status;
        let completedDate = j.completedDate;
        
        // Auto transition status
        if (nextStatus === 'Scheduled') {
          nextStatus = 'In Progress';
        }
        
        // If everything is checked, complete the job
        const allChecked = Object.values(nextSteps).every(v => v === true);
        if (allChecked) {
          nextStatus = 'Completed';
          completedDate = '2026-06-19'; // Today's date
          
          // Execute VIP/AMC customer counter decrements or updates
          handleCustomerPlanUpdate(j.customerId, j.price, j.stickerSerial);
          actionLog = `Job #${jobId} for ${j.customerName} completed (SOP fully validated).`;
        } else {
          // If status was completed but user unchecked a step
          if (nextStatus === 'Completed') {
            nextStatus = 'In Progress';
            completedDate = '';
          }
          actionLog = `Job #${jobId} (${j.customerName}): Toggled SOP step '${stepKey}' to ${nextSteps[stepKey] ? 'Checked' : 'Unchecked'}.`;
        }

        return { ...j, sopSteps: nextSteps, status: nextStatus, completedDate };
      }
      return j;
    });
    updateJobsList(updatedJobs);
    if (actionLog) {
      addAuditLog('Job SOP Updated', actionLog);
    }
  };

  // Perform updates to customers & billing when job completes
  const handleCustomerPlanUpdate = (customerId, jobPrice, stickerSerial) => {
    let invoicesUpdated = [...db.invoices];
    const customersUpdated = db.customers.map(c => {
      if (c.id === customerId) {
        if (c.plan === 'vip') {
          return {
            ...c,
            vipCleansRemaining: Math.max(0, c.vipCleansRemaining - 1)
          };
        } else if (c.plan === 'amc') {
          // Calculate next visit (add 3 or 4 months based on frequency)
          const monthsToAdd = c.amcFrequency > 0 ? 12 / c.amcFrequency : 6;
          const nextDate = new Date('2026-06-19');
          nextDate.setMonth(nextDate.getMonth() + monthsToAdd);
          return {
            ...c,
            amcNextVisit: nextDate.toISOString().split('T')[0]
          };
        } else {
          // Walk-in cleaning creates a new pending invoice
          const invId = `INV-2026-${String(db.invoices.length + 1).padStart(3, '0')}`;
          invoicesUpdated.push({
            id: invId,
            customerId: c.id,
            customerName: c.name,
            date: '2026-06-19',
            dueDate: '2026-07-19',
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

  const handleSimulatePhoto = (jobId, type) => {
    const updatedJobs = db.jobs.map(j => {
      if (j.id === jobId) {
        if (type === 'before') {
          return {
            ...j,
            beforePhoto: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%235A4F3F"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23fff">BEFORE: Algae &amp; Mud layer</text></svg>'
          };
        } else {
          return {
            ...j,
            afterPhoto: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%2300E5FF"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23004D40">AFTER: Spotless clean tank</text></svg>'
          };
        }
      }
      return j;
    });
    updateJobsList(updatedJobs);
  };

  const handleStickerSerialChange = (jobId, val) => {
    const updatedJobs = db.jobs.map(j => {
      if (j.id === jobId) {
        return { ...j, stickerSerial: val };
      }
      return j;
    });
    updateJobsList(updatedJobs);
  };

  const handleNotesChange = (jobId, val) => {
    const updatedJobs = db.jobs.map(j => {
      if (j.id === jobId) {
        return { ...j, technicianNotes: val };
      }
      return j;
    });
    updateJobsList(updatedJobs);
  };

  // Create new job ticket
  const handleCreateJob = (e) => {
    e.preventDefault();
    const customer = db.customers.find(c => c.id === newJob.customerId);
    if (!customer) return;

    // Price determination
    let price = 3500;
    if (customer.tankSize === 1000) price = 4500;
    else if (customer.tankSize === 2000) price = 5500;
    else if (typeof customer.tankSize === 'string' && customer.tankSize.includes('Sump')) price = 15000;

    // If VIP plan, the clean is prepaid (price is 0 for transactional invoice but we log LKR 4000/clean equivalent value)
    if (customer.plan === 'vip') price = 4000;
    else if (customer.plan === 'amc') price = customer.amcPrice / customer.amcFrequency;

    const newJobObj = {
      id: `job-${db.jobs.length + 1}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      location: customer.location,
      tankSize: customer.tankSize,
      price: Math.round(price),
      status: 'Scheduled',
      scheduledDate: newJob.scheduledDate,
      completedDate: '',
      crewName: newJob.crewName,
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
      technicianNotes: newJob.technicianNotes
    };

    const updatedJobs = [...db.jobs, newJobObj];
    updateJobsList(updatedJobs);
    addAuditLog('Job Scheduled', `Scheduled new job ticket #${newJobObj.id} for customer ${newJobObj.customerName} on ${newJobObj.scheduledDate}`);
    setShowAddJobModal(false);
    setNewJob({
      customerId: '',
      scheduledDate: '',
      crewName: 'Crew A - Shan & Arul',
      technicianNotes: ''
    });
    setActiveJobId(newJobObj.id);
  };

  // Render certificate printable
  if (showReportView && activeJob) {
    return (
      <div>
        <button className="btn btn-secondary no-print" onClick={() => setShowReportView(false)} style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} /> Return to Checklist
        </button>

        <div className="report-document" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="report-header">
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0b131e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                SAFEDROP TANK MAINTENANCE
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#555', marginTop: '4px' }}>Reg No: SD/WT-2026 | SafeDrop Tank Maintenance</p>
              <p style={{ fontSize: '0.85rem', color: '#555' }}>WhatsApp/Hotline: +94 77 123 9000 | info@safedrop.lk</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#00b45a', border: '2px solid #00b45a', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                HEALTH CERTIFIED
              </div>
              <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '6px' }}>Report Ref: {activeJob.id}</p>
            </div>
          </div>

          <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid #bbf7d0', fontSize: '0.9rem' }}>
            <strong>WHO-Aligned Water System Sanitation Report:</strong> This document certifies that the water system components detailed below have been fully drained, high-pressure washed without harmful chemical residues, cleared of biofilm, and disinfected.
          </div>

          <div className="report-meta">
            <div>
              <h4 style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: '#777', marginBottom: '4px' }}>CLIENT DETAILS</h4>
              <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{activeJob.customerName}</p>
              <p style={{ color: '#444', fontSize: '0.9rem' }}>{activeJob.location}</p>
              <p style={{ color: '#444', fontSize: '0.9rem' }}>Phone: {activeJob.customerPhone}</p>
            </div>
            <div>
              <h4 style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: '#777', marginBottom: '4px' }}>SERVICE DETAILS</h4>
              <p style={{ fontSize: '0.9rem' }}><strong>Tank Configuration:</strong> {activeJob.tankSize}L Capacity</p>
              <p style={{ fontSize: '0.9rem' }}><strong>Service Crew:</strong> {activeJob.crewName}</p>
              <p style={{ fontSize: '0.9rem' }}><strong>Sanitation Date:</strong> {activeJob.completedDate || '2026-06-19'}</p>
              <p style={{ fontSize: '0.9rem' }}><strong>Reminders Stickered:</strong> Yes (Serial {activeJob.stickerSerial || 'N/A'})</p>
            </div>
          </div>

          <div className="report-section">
            <h3 style={{ fontSize: '1.1rem', borderBottom: '2px solid #ddd', paddingBottom: '6px' }}>Executed SOP Steps Checklist</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✓ Closed Inlet &amp; Isolated System</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✓ Evacuated Sludge via Submersible Pump</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✓ High-Pressure Blast Walls &amp; Corners</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✓ Scraped and Cleared Biofilms</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✓ Removed Loose Silt &amp; Vacuumed Dry</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✓ Placed Service Sticker (Due in 6 Months)</div>
            </div>
          </div>

          <div className="report-section">
            <h3 style={{ fontSize: '1.1rem', borderBottom: '2px solid #ddd', paddingBottom: '6px' }}>Before &amp; After Photo Logs</h3>
            <div className="photo-grid">
              <div className="photo-container">
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#8b5a2b', marginBottom: '4px' }}>BEFORE SANITATION</div>
                {activeJob.beforePhoto ? (
                  <img src={activeJob.beforePhoto} alt="Before tank clean" style={{ border: '1px solid #ddd', height: '140px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', color: '#94a3b8', fontSize: '0.85rem' }}>No Photo Captured</div>
                )}
              </div>
              <div className="photo-container">
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#00665c', marginBottom: '4px' }}>AFTER SANITATION</div>
                {activeJob.afterPhoto ? (
                  <img src={activeJob.afterPhoto} alt="After tank clean" style={{ border: '1px solid #ddd', height: '140px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', color: '#94a3b8', fontSize: '0.85rem' }}>No Photo Captured</div>
                )}
              </div>
            </div>
          </div>

          {activeJob.technicianNotes && (
            <div className="report-section">
              <h3 style={{ fontSize: '1.1rem', borderBottom: '2px solid #ddd', paddingBottom: '6px' }}>Technician Field Observations</h3>
              <p style={{ fontSize: '0.9rem', color: '#334155', fontStyle: 'italic', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                "{activeJob.technicianNotes}"
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '3rem', borderTop: '1px solid #eee', paddingTop: '1.5rem', fontSize: '0.85rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '50px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: 'cursive', fontSize: '1.2rem', color: '#3b82f6' }}>
                {activeJob.crewName.split('-')[1]?.trim() || 'Shan & Arul'}
              </div>
              <div style={{ borderTop: '1px solid #bbb', width: '180px', margin: '0 auto', paddingAt: '4px' }}><strong>Crew Lead Signature</strong></div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '50px' }}></div>
              <div style={{ borderTop: '1px solid #bbb', width: '180px', margin: '0 auto', paddingAt: '4px' }}><strong>Customer Sign-off</strong></div>
            </div>
          </div>

          <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setShowReportView(false)}>Close</button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <Printer size={16} /> Print Health Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>SOP &amp; Operations</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Guide crews through cleaning checklists and manage job queues.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddJobModal(true)}>
          <Plus size={16} /> Dispatch New Job
        </button>
      </div>

      <div className="details-grid">
        {/* Jobs List Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Active Cleaning Queues</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {db.jobs.map(job => (
              <div 
                key={job.id} 
                onClick={() => {
                  setActiveJobId(job.id);
                  setShowReportView(false);
                }}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: activeJobId === job.id ? 'var(--bg-tertiary)' : 'rgba(255, 255, 255, 0.01)',
                  border: `1px solid ${activeJobId === job.id ? 'var(--primary)' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: activeJobId === job.id ? 'var(--primary)' : 'inherit' }}>
                    {job.customerName}
                  </span>
                  <span className={`badge ${
                    job.status === 'Completed' ? 'badge-success' : 
                    job.status === 'In Progress' ? 'badge-warning' : 'badge-info'
                  }`}>
                    {job.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {job.location}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Layers size={12} /> {job.tankSize}L Tank</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {job.scheduledDate}</span>
                </div>

                {/* Progress bar of SOP steps completed */}
                {(() => {
                  const completedSteps = Object.values(job.sopSteps).filter(Boolean).length;
                  const pct = Math.round((completedSteps / 6) * 100);
                  return (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                        <span>SOP Progress</span>
                        <span>{completedSteps}/6 Steps ({pct}%)</span>
                      </div>
                      <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: job.status === 'Completed' ? 'var(--secondary)' : 'var(--primary)', borderRadius: '2px' }}></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>

        {/* SOP Steps Guide details */}
        <div className="glass-panel" style={{ padding: '1.5rem', alignSelf: 'start' }}>
          {activeJob ? (
            <div>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  OPERATIONAL RUNSHEET ({activeJob.id})
                </span>
                <h3 style={{ fontSize: '1.4rem', marginTop: '2px' }}>{activeJob.customerName}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Assigned Crew: <strong>{activeJob.crewName}</strong> | Fee: <strong>LKR {activeJob.price.toLocaleString()}</strong>
                </p>
              </div>

              {/* Photos capture simulation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Before Photo</span>
                  {activeJob.beforePhoto ? (
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', height: '100px', display: 'flex', position: 'relative' }}>
                      <img src={activeJob.beforePhoto} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleSimulatePhoto(activeJob.id, 'before')}
                      style={{ height: '100px', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}
                    >
                      <Camera size={20} />
                      Simulate Upload
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>After Photo</span>
                  {activeJob.afterPhoto ? (
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', height: '100px', display: 'flex', position: 'relative' }}>
                      <img src={activeJob.afterPhoto} alt="After" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleSimulatePhoto(activeJob.id, 'after')}
                      style={{ height: '100px', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}
                      disabled={!activeJob.sopSteps.pressureWash}
                    >
                      <Camera size={20} />
                      Simulate Upload
                    </button>
                  )}
                </div>
              </div>

              {/* SOP checklist checklist */}
              <div className="sop-checklist">
                {sopStepsList.map((step, idx) => {
                  const isChecked = activeJob.sopSteps[step.key];
                  
                  // Check if steps can be unlocked (before checklist must be followed sequentially)
                  // For example, step 5/6 needs photo uploaded
                  let isLocked = false;
                  if (idx === 4 && !activeJob.beforePhoto) isLocked = true;
                  if (idx === 5 && (!activeJob.afterPhoto || !activeJob.stickerSerial)) isLocked = true;

                  return (
                    <div 
                      key={step.key} 
                      className={`sop-item ${isChecked ? 'completed' : ''} ${isLocked ? 'btn-disabled' : ''}`}
                      onClick={() => !isLocked && handleToggleStep(activeJob.id, step.key)}
                      style={{ opacity: isLocked ? 0.4 : 1 }}
                    >
                      <div className="sop-checkbox">✓</div>
                      <div className="sop-content">
                        <div className="sop-title">{step.title}</div>
                        <div className="sop-desc">{step.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Waterproof sticker serialization - Required for final step */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Waterproof Reminder Sticker Serial Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. TNC-8894" 
                  value={activeJob.stickerSerial}
                  onChange={(e) => handleStickerSerialChange(activeJob.id, e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Affix this sticker beside the water pump power switch. Prompts repeat bookings!
                </span>
              </div>

              {/* Technician Notes */}
              <div className="form-group">
                <label>Crew Comments / Sump Observations</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  value={activeJob.technicianNotes}
                  onChange={(e) => handleNotesChange(activeJob.id, e.target.value)}
                  placeholder="Enter comments on tank conditions, crack repairs, or valve replacements..."
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setShowReportView(true)}
                  disabled={activeJob.status !== 'Completed'}
                >
                  <Printer size={16} /> Print Report
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              Select a cleaning ticket from the queue list to guide technicians through the SOP checklist and log before/after status.
            </div>
          )}
        </div>
      </div>

      {/* Add Job Modal */}
      {showAddJobModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Dispatch Cleaning Crew</h3>
            <form onSubmit={handleCreateJob}>
              <div className="form-group">
                <label>Select Customer Profile</label>
                <select 
                  className="form-control" 
                  value={newJob.customerId}
                  onChange={(e) => setNewJob({ ...newJob, customerId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Customer --</option>
                  {db.customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.location} - {c.tankSize}L {c.plan.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Schedule Target Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={newJob.scheduledDate}
                  onChange={(e) => setNewJob({ ...newJob, scheduledDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Assign Operations Crew</label>
                <select 
                  className="form-control"
                  value={newJob.crewName}
                  onChange={(e) => setNewJob({ ...newJob, crewName: e.target.value })}
                >
                  <option value="Crew A - Shan & Arul">Crew A - Shan &amp; Arul (Nilaveli Area)</option>
                  <option value="Crew B - Ravi & Niro">Crew B - Ravi &amp; Niro (SafeDrop Service Area)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Job Preparatory Notes</label>
                <textarea 
                  className="form-control" 
                  rows="2" 
                  value={newJob.technicianNotes}
                  onChange={(e) => setNewJob({ ...newJob, technicianNotes: e.target.value })}
                  placeholder="Notes about location access, ladder requirements, or sediment complexity..."
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddJobModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Dispatch Crew</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
