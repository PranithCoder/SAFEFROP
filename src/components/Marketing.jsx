import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Plus, 
  MapPin, 
  Phone, 
  UserCheck, 
  Camera, 
  Mail, 
  Share2, 
  Award, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { getDB, saveDB } from '../utils/db';

export default function Marketing() {
  const [db, setDb] = useState(getDB());
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  
  // Free Sump Inspection simulator State
  const [inspectionResult, setInspectionResult] = useState({
    notes: '',
    photo: ''
  });

  // Add lead State
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    location: 'Nilaveli',
    source: 'Flyer',
    hardwareStoreName: ''
  });

  useEffect(() => {
    const handleDbUpdate = () => {
      setDb(getDB());
    };
    window.addEventListener('db-update', handleDbUpdate);
    return () => window.removeEventListener('db-update', handleDbUpdate);
  }, []);

  const activeLead = db.leads.find(l => l.id === selectedLeadId) || null;

  // Add new lead to funnel
  const handleAddLead = (e) => {
    e.preventDefault();
    
    const newLeadObj = {
      id: `lead-${db.leads.length + 1}`,
      name: newLead.name,
      phone: newLead.phone,
      location: newLead.location,
      source: newLead.source,
      status: 'Lead',
      inspectionPhoto: '',
      inspectionNotes: '',
      hardwareStoreName: newLead.source === 'Hardware Store' ? newLead.hardwareStoreName : '',
      commissionPaid: false
    };

    const updatedLeads = [...db.leads, newLeadObj];
    saveDB({ ...db, leads: updatedLeads });
    setShowAddLeadModal(false);
    setNewLead({
      name: '',
      phone: '',
      location: 'Nilaveli',
      source: 'Flyer',
      hardwareStoreName: ''
    });
  };

  // Simulate inspection visit
  const handleSimulateInspectionPhoto = () => {
    setInspectionResult({
      ...inspectionResult,
      photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%234b3e34"/><circle cx="150" cy="100" r="80" fill="none" stroke="%233e3328" stroke-width="15"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23fff">INSPECTION: Thick mud crust &amp; biofilm</text></svg>'
    });
  };

  const handleSaveInspection = (e) => {
    e.preventDefault();
    if (!selectedLeadId) return;

    const updatedLeads = db.leads.map(lead => {
      if (lead.id === selectedLeadId) {
        return {
          ...lead,
          status: 'Inspection Completed',
          inspectionPhoto: inspectionResult.photo,
          inspectionNotes: inspectionResult.notes
        };
      }
      return lead;
    });

    saveDB({ ...db, leads: updatedLeads });
    setShowInspectionModal(false);
    
    // Simulate WhatsApp Message
    const targetLead = db.leads.find(l => l.id === selectedLeadId);
    alert(`SMS Alert dispatched to ${targetLead.name} (+94 77...):
"Hi ${targetLead.name}, we inspected your rooftop tank. Mud sedimentation has breached safety limits. A cleaning is highly recommended. Standard rate: LKR 4,500. Reply to confirm cleaning date."`);

    setInspectionResult({ notes: '', photo: '' });
  };

  // Convert Lead to Customer and Schedule Job
  const handleConvertLead = (leadId) => {
    const lead = db.leads.find(l => l.id === leadId);
    if (!lead) return;

    // 1. Create customer
    const newCustId = `cust-${db.customers.length + 1}`;
    const newCustomer = {
      id: newCustId,
      name: lead.name,
      phone: lead.phone,
      address: `Road side address, ${lead.location}`,
      location: lead.location,
      tankSize: 1000, // Standard
      tankType: 'Plastic',
      plan: 'walk-in',
      vipCleansRemaining: 0,
      vipEmergencyCleansRemaining: 0,
      amcFrequency: 0,
      amcNextVisit: '',
      amcPrice: 0,
      createdAt: '2026-06-19'
    };

    // 2. Schedule job
    const newJobObj = {
      id: `job-${db.jobs.length + 1}`,
      customerId: newCustId,
      customerName: lead.name,
      customerPhone: lead.phone,
      location: lead.location,
      tankSize: 1000,
      price: 4500, // Standard flat fee
      status: 'Scheduled',
      scheduledDate: '2026-06-21',
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
      beforePhoto: lead.inspectionPhoto,
      afterPhoto: '',
      stickerSerial: '',
      technicianNotes: `Lead convert: ${lead.inspectionNotes}`
    };

    // Update leads status to Converted
    const updatedLeads = db.leads.map(l => {
      if (l.id === leadId) {
        return { ...l, status: 'Converted' };
      }
      return l;
    });

    const updatedCustomers = [...db.customers, newCustomer];
    const updatedJobs = [...db.jobs, newJobObj];

    saveDB({
      ...db,
      leads: updatedLeads,
      customers: updatedCustomers,
      jobs: updatedJobs
    });

    alert(`Converted! Customer profile ${newCustId} created, and Job scheduled for June 21.`);
  };

  // Pay Commission to Hardware store
  const handlePayCommission = (leadId) => {
    const updatedLeads = db.leads.map(l => {
      if (l.id === leadId) {
        return { ...l, commissionPaid: true };
      }
      return l;
    });
    saveDB({ ...db, leads: updatedLeads });
    alert(`LKR 500 hardware store referral commission marked as Paid.`);
  };

  // Funnel Column filtering
  const getLeadsByStatus = (status) => {
    return db.leads.filter(l => l.status === status);
  };

  // Commission List
  const pendingCommissions = db.leads.filter(l => l.source === 'Hardware Store' && l.status === 'Converted');

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Marketing &amp; Leads Funnel</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Log free inspections to convert leads, and track hardware shop referral commissions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddLeadModal(true)}>
          <Plus size={16} /> Log New Lead
        </button>
      </div>

      {/* Kanban Board columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem', overflowX: 'auto' }}>
        {/* Column 1: New Lead */}
        <div className="glass-panel" style={{ padding: '1rem', minHeight: '300px' }}>
          <h4 style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '10px' }}>
            <span>1. New Leads</span>
            <span className="badge badge-info">{getLeadsByStatus('Lead').length}</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {getLeadsByStatus('Lead').map(lead => (
              <div key={lead.id} style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.8rem' }}>
                <strong style={{ display: 'block', fontSize: '0.85rem' }}>{lead.name}</strong>
                <span style={{ color: 'var(--text-secondary)' }}><MapPin size={10} /> {lead.location}</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Src: {lead.source}</span>
                  <button 
                    onClick={() => {
                      setSelectedLeadId(lead.id);
                      setShowInspectionModal(true);
                    }}
                    className="btn btn-primary" 
                    style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                  >
                    Free Check
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Scheduled */}
        <div className="glass-panel" style={{ padding: '1rem', minHeight: '300px' }}>
          <h4 style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '10px' }}>
            <span>2. Inspection Set</span>
            <span className="badge badge-warning">{getLeadsByStatus('Inspection Scheduled').length}</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {getLeadsByStatus('Inspection Scheduled').map(lead => (
              <div key={lead.id} style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.8rem' }}>
                <strong style={{ display: 'block', fontSize: '0.85rem' }}>{lead.name}</strong>
                <span style={{ color: 'var(--text-secondary)' }}><MapPin size={10} /> {lead.location}</span>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '4px' }}>Scheduled Site Check</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Src: {lead.source}</span>
                  <button 
                    onClick={() => {
                      setSelectedLeadId(lead.id);
                      setShowInspectionModal(true);
                    }}
                    className="btn btn-primary" 
                    style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                  >
                    Conduct Check
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Completed Inspection */}
        <div className="glass-panel" style={{ padding: '1rem', minHeight: '300px' }}>
          <h4 style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '10px' }}>
            <span>3. Checked &amp; Alerted</span>
            <span className="badge badge-primary">{getLeadsByStatus('Inspection Completed').length}</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {getLeadsByStatus('Inspection Completed').map(lead => (
              <div key={lead.id} style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.8rem' }}>
                <strong style={{ display: 'block', fontSize: '0.85rem' }}>{lead.name}</strong>
                <span style={{ color: 'var(--text-secondary)' }}><MapPin size={10} /> {lead.location}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(0, 229, 255, 0.2)', backgroundColor: 'var(--primary-glow)', padding: '4px', borderRadius: '4px', margin: '6px 0' }}>
                  <Camera size={12} color="var(--primary)" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Photo Sent to Owner</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Src: {lead.source}</span>
                  <button 
                    onClick={() => handleConvertLead(lead.id)}
                    className="btn btn-success" 
                    style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                  >
                    Convert to Clean
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 4: Converted */}
        <div className="glass-panel" style={{ padding: '1rem', minHeight: '300px' }}>
          <h4 style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '10px' }}>
            <span>4. Converted Jobs</span>
            <span className="badge badge-success">{getLeadsByStatus('Converted').length}</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {getLeadsByStatus('Converted').map(lead => (
              <div key={lead.id} style={{ padding: '10px', backgroundColor: 'rgba(0, 230, 118, 0.02)', border: '1px solid rgba(0, 230, 118, 0.2)', borderRadius: '4px', fontSize: '0.8rem' }}>
                <strong style={{ display: 'block', fontSize: '0.85rem' }}>{lead.name}</strong>
                <span style={{ color: 'var(--text-secondary)' }}><MapPin size={10} /> {lead.location}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--secondary)', fontWeight: 'bold', marginTop: '6px' }}>
                  <UserCheck size={12} /> Converted Client
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hardware store commissions Ledger */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={18} color="var(--secondary)" /> Hardware Store Commission Ledger (LKR 500 / referral)
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          To build cost-effective channels, we partner with Trincomalee plumbing vendors. A commission of LKR 500 is paid to the shop owner for each customer who books a tank clean.
        </p>

        {pendingCommissions.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No hardware store referrals logged yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Hardware Shop Partner</th>
                <th style={{ padding: '8px' }}>Referred Client</th>
                <th style={{ padding: '8px' }}>Referral Status</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Commission Fee</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Payout Log</th>
              </tr>
            </thead>
            <tbody>
              {pendingCommissions.map(lead => (
                <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{lead.hardwareStoreName || 'Local Hardware Partner'}</td>
                  <td style={{ padding: '10px 8px' }}>{lead.name}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span className="badge badge-success">Converted Job</span>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--secondary)' }}>LKR 500</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    {lead.commissionPaid ? (
                      <span className="badge badge-success">Paid</span>
                    ) : (
                      <button 
                        onClick={() => handlePayCommission(lead.id)}
                        className="btn btn-primary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        Log Payout
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Log Lead Modal */}
      {showAddLeadModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Log Marketing Lead</h3>
            <form onSubmit={handleAddLead}>
              <div className="form-group">
                <label>Prospect Client Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  placeholder="e.g. Nilaveli Beach Bungalow owner"
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Phone</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="e.g. +94 77 987 6543"
                  required
                />
              </div>

              <div className="details-grid" style={{ marginBottom: 0 }}>
                <div className="form-group">
                  <label>Region Location</label>
                  <select 
                    className="form-control"
                    value={newLead.location}
                    onChange={(e) => setNewLead({ ...newLead, location: e.target.value })}
                  >
                    <option value="Nilaveli">Nilaveli (Tourist belt)</option>
                    <option value="Uppuveli">Uppuveli (Hotel lane)</option>
                    <option value="Trincomalee Town">Trincomalee Town</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Lead Source Channel</label>
                  <select 
                    className="form-control"
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                  >
                    <option value="Flyer">Printed Flyers</option>
                    <option value="Facebook">Sinhala/Tamil Facebook</option>
                    <option value="WhatsApp Group">WhatsApp Community</option>
                    <option value="Hardware Store">Hardware Store Referral</option>
                  </select>
                </div>
              </div>

              {newLead.source === 'Hardware Store' && (
                <div className="form-group">
                  <label>Hardware Partner Shop Name</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={newLead.hardwareStoreName}
                    onChange={(e) => setNewLead({ ...newLead, hardwareStoreName: e.target.value })}
                    placeholder="e.g. Trinco Hardware Mart or Nilaveli Plumbing Supplies"
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Shop owners receive LKR 500 commission on service conversions.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddLeadModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Free inspection visit logger modal */}
      {showInspectionModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Log Sump Health Inspection Check</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Pop the tank lid, snap a photo. Showing biological residue directly to villa owners achieves instant sales conversions.
            </p>
            <form onSubmit={handleSaveInspection}>
              <div className="form-group">
                <label>Snap Tank Sludge Photo</label>
                {inspectionResult.photo ? (
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', height: '140px', display: 'flex', position: 'relative', marginBottom: '10px' }}>
                    <img src={inspectionResult.photo} alt="Inspection mud" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick={handleSimulateInspectionPhoto}
                    style={{ width: '100%', height: '120px', flexDirection: 'column', gap: '6px' }}
                  >
                    <Camera size={24} />
                    Simulate Camera Snap
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Inspection Observation Details</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  value={inspectionResult.notes}
                  onChange={(e) => setInspectionResult({ ...inspectionResult, notes: e.target.value })}
                  placeholder="e.g. Biofilm crust on walls, heavy sandy silt mud layer at base due to deep well groundwater..."
                  required
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInspectionModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={!inspectionResult.photo}>
                  Send Alert &amp; Log Check
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
