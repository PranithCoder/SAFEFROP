import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  DollarSign, 
  Briefcase, 
  Calculator, 
  Printer, 
  ArrowLeft, 
  Check, 
  AlertCircle,
  Building,
  UserCheck
} from 'lucide-react';
import { getDB, saveDB } from '../utils/db';

export default function B2BContracts() {
  const [db, setDb] = useState(getDB());
  const [activeInvoiceId, setActiveInvoiceId] = useState(null);
  const [showInvoicePrint, setShowInvoicePrint] = useState(false);
  const [showBidCalculator, setShowBidCalculator] = useState(false);
  const [selectedInvoiceStatus, setSelectedInvoiceStatus] = useState('all');

  // Calculator Form State
  const [calcForm, setCalcForm] = useState({
    clientName: '',
    sumpVolume: 10000,
    rooftopTanks: 2,
    sedimentLevel: 'Medium', // Light, Medium, Heavy
    accessComplexity: 'Standard' // Standard, Difficult
  });

  const [proposals, setProposals] = useState([
    { id: 'prop-1', client: 'Ocean View Resort', detail: '10,000L Concrete Sump + 4 Rooftop Tanks', price: 28000, status: 'Pending Review' },
    { id: 'prop-2', client: 'Hatton National Bank Trinco', detail: '5,000L Sump + 1 Rooftop Tank', price: 16500, status: 'Approved' }
  ]);

  useEffect(() => {
    const handleDbUpdate = () => {
      setDb(getDB());
    };
    window.addEventListener('db-update', handleDbUpdate);
    return () => window.removeEventListener('db-update', handleDbUpdate);
  }, []);

  const activeInvoice = db.invoices.find(inv => inv.id === activeInvoiceId) || null;

  // Invoice calculations
  const markInvoicePaid = (invId, method) => {
    const updatedInvoices = db.invoices.map(inv => {
      if (inv.id === invId) {
        return {
          ...inv,
          status: 'Paid',
          paymentMethod: method,
          paymentDate: '2026-06-19'
        };
      }
      return inv;
    });

    saveDB({ ...db, invoices: updatedInvoices });
    alert(`Invoice ${invId} marked as PAID via ${method}.`);
  };

  // Run customized bidding algorithm
  const handleCalculateBid = (e) => {
    e.preventDefault();
    
    // Bidding formula
    const sumpCost = calcForm.sumpVolume * 1.5; // LKR 1.5 per Liter
    const rooftopCost = calcForm.rooftopTanks * 4500; // LKR 4,500 per tank
    
    let sedimentMultiplier = 1.0;
    if (calcForm.sedimentLevel === 'Medium') sedimentMultiplier = 1.2;
    if (calcForm.sedimentLevel === 'Heavy') sedimentMultiplier = 1.5;

    let accessAddon = 0;
    if (calcForm.accessComplexity === 'Difficult') accessAddon = 5000;

    const totalPrice = Math.round((sumpCost + rooftopCost) * sedimentMultiplier + accessAddon);

    // Save proposal
    const newProp = {
      id: `prop-${proposals.length + 1}`,
      client: calcForm.clientName || 'Unnamed Commercial Sump Client',
      detail: `${calcForm.sumpVolume.toLocaleString()}L Concrete Sump + ${calcForm.rooftopTanks} Rooftop Tanks (${calcForm.sedimentLevel} silt)`,
      price: totalPrice,
      status: 'Pending Review'
    };

    setProposals([newProp, ...proposals]);
    setShowBidCalculator(false);
    
    // Clear form
    setCalcForm({
      clientName: '',
      sumpVolume: 10000,
      rooftopTanks: 2,
      sedimentLevel: 'Medium',
      accessComplexity: 'Standard'
    });
  };

  // Convert approved proposal to job and invoice
  const handleApproveProposal = (propId) => {
    const prop = proposals.find(p => p.id === propId);
    if (!prop) return;

    // 1. Create a customer profile if needed or fetch City Bank / Resort
    let customerId = 'cust-3'; // Default to Bank for B2B Demo
    if (prop.client.includes('Ocean')) {
      // Register new customer
      const newCustId = `cust-${db.customers.length + 1}`;
      const newCust = {
        id: newCustId,
        name: prop.client,
        phone: '+94 77 999 1111',
        address: 'Nilaveli Coastal Highway, Trinco',
        location: 'Nilaveli',
        tankSize: prop.detail,
        tankType: 'Sump + Overhead',
        plan: 'amc',
        vipCleansRemaining: 0,
        vipEmergencyCleansRemaining: 0,
        amcFrequency: 3,
        amcNextVisit: '2026-07-20',
        amcPrice: prop.price * 3, // 3 visits/year
        createdAt: '2026-06-19'
      };
      
      // Update DB customer
      const updatedCustomers = [...db.customers, newCust];
      customerId = newCustId;
      db.customers = updatedCustomers;
    }

    // 2. Schedule a job
    const newJobObj = {
      id: `job-${db.jobs.length + 1}`,
      customerId: customerId,
      customerName: prop.client,
      customerPhone: '+94 77 999 1111',
      location: 'Nilaveli',
      tankSize: 'Commercial Custom Sump',
      price: prop.price,
      status: 'Scheduled',
      scheduledDate: '2026-06-25',
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
      technicianNotes: `B2B Proposal Convert: ${prop.detail}`
    };

    // 3. Create invoice (Net 30)
    const invId = `INV-2026-${String(db.invoices.length + 1).padStart(3, '0')}`;
    const newInvoice = {
      id: invId,
      customerId: customerId,
      customerName: prop.client,
      date: '2026-06-19',
      dueDate: '2026-07-19', // Net 30
      items: [
        { description: `Commercial Water System Disinfection: ${prop.detail}`, amount: prop.price }
      ],
      total: prop.price,
      status: 'Sent',
      paymentMethod: '',
      paymentDate: ''
    };

    const updatedJobs = [...db.jobs, newJobObj];
    const updatedInvoices = [...db.invoices, newInvoice];
    saveDB({ ...db, jobs: updatedJobs, invoices: updatedInvoices });

    // Update local proposal state
    setProposals(proposals.map(p => p.id === propId ? { ...p, status: 'Approved' } : p));
    alert(`Proposal approved! Scheduled Job ${newJobObj.id} and issued Net-30 Invoice ${invId}.`);
  };

  const filteredInvoices = db.invoices.filter(inv => {
    if (selectedInvoiceStatus === 'all') return true;
    return inv.status === selectedInvoiceStatus;
  });

  // Invoice Print Preview Layout
  if (showInvoicePrint && activeInvoice) {
    return (
      <div>
        <button className="btn btn-secondary no-print" onClick={() => setShowInvoicePrint(false)} style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} /> Return to Accounts
        </button>

        <div className="report-document" style={{ maxWidth: '800px', margin: '0 auto', border: '1px solid #ccc' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #00e5ff', paddingBottom: '1rem', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ color: '#0b131e', fontSize: '1.8rem', fontWeight: 800 }}>SAFEDROP TANK MAINTENANCE</h2>
              <p style={{ fontSize: '0.85rem', color: '#555' }}>Hatton National Road, Trincomalee Town, Sri Lanka</p>
              <p style={{ fontSize: '0.85rem', color: '#555' }}>Tel: +94 77 123 9000 | Reg No: SD/WT-2026</p>
              <p style={{ fontSize: '0.85rem', color: '#555' }}><strong>VAT/TIN Registration:</strong> 8847392-09</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h1 style={{ color: '#bbb', fontSize: '2.5rem', fontWeight: 900, margin: 0, lineHeight: 1 }}>INVOICE</h1>
              <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#334155' }}>{activeInvoice.id}</p>
              <p style={{ fontSize: '0.85rem', color: '#555', marginTop: '10px' }}><strong>Date:</strong> {activeInvoice.date}</p>
              <p style={{ fontSize: '0.85rem', color: '#a00', fontWeight: 'bold' }}><strong>Payment Due:</strong> {activeInvoice.dueDate} (Net 30)</p>
            </div>
          </div>

          {/* Client Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <h4 style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Billed To:</h4>
              <p style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{activeInvoice.customerName}</p>
              <p style={{ fontSize: '0.9rem', color: '#555' }}>Trincomalee commercial account client</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h4 style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Invoice Status:</h4>
              <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.9rem', backgroundColor: activeInvoice.status === 'Paid' ? '#dcfce7' : '#fee2e2', color: activeInvoice.status === 'Paid' ? '#15803d' : '#b91c1c' }}>
                {activeInvoice.status.toUpperCase()}
              </div>
              {activeInvoice.status === 'Paid' && (
                <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '4px' }}>Paid via {activeInvoice.paymentMethod} on {activeInvoice.paymentDate}</p>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '10px' }}>Item Description</th>
                <th style={{ textAlign: 'right', padding: '10px', width: '150px' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {activeInvoice.items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 10px' }}>{item.description}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold' }}>LKR {item.amount.toLocaleString()}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid #bbb', fontSize: '1.05rem', fontWeight: 'bold' }}>
                <td style={{ padding: '12px 10px', textAlign: 'right' }}>Grand Total Due:</td>
                <td style={{ padding: '12px 10px', textAlign: 'right', color: '#0b131e' }}>LKR {activeInvoice.total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          {/* Transfer Info */}
          <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '6px', fontSize: '0.85rem', color: '#334155', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
            <h4 style={{ fontWeight: 'bold', marginBottom: '6px', color: '#0b131e' }}>OFFICIAL BANK WIRE INSTRUCTIONS:</h4>
            <p><strong>Bank:</strong> Hatton National Bank (HNB)</p>
            <p><strong>Branch:</strong> Trincomalee Harbour Branch</p>
            <p><strong>Account Name:</strong> SafeDrop Tank Maintenance Ltd</p>
            <p><strong>Account Number:</strong> 0450-9874-1234</p>
            <p style={{ marginTop: '8px', color: '#64748b' }}>* Please forward bank transfer confirmations to payments@safedrop.lk or WhatsApp +94 77 123 9000.</p>
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#777' }}>
            Thank you for choosing SafeDrop. Ensuring safe sanitation across Trincomalee.
          </div>

          {/* Print controls */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setShowInvoicePrint(false)}>Close</button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <Printer size={16} /> Print Corporate Invoice
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
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>B2B &amp; Invoices</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage large commercial proposals, quotes, and Net 30 invoicing terms.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowBidCalculator(true)}>
          <Calculator size={16} /> Sump Bidding Calculator
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }}>
        {/* Left column: B2B Proposals */}
        <div className="glass-panel" style={{ padding: '1.5rem', alignSelf: 'start' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={18} color="var(--primary)" /> Custom B2B Proposals
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {proposals.map(prop => (
              <div key={prop.id} style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{prop.client}</strong>
                  <span className={`badge ${prop.status === 'Approved' ? 'badge-success' : 'badge-warning'}`}>{prop.status}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '6px 0' }}>{prop.detail}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1rem' }}>LKR {prop.price.toLocaleString()}</span>
                  {prop.status !== 'Approved' && (
                    <button 
                      className="btn btn-success" 
                      onClick={() => handleApproveProposal(prop.id)}
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      Approve &amp; Schedule
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Invoices log */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Issued Invoices Ledger</h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'Paid', 'Sent'].map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedInvoiceStatus(status)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    backgroundColor: selectedInvoiceStatus === status ? 'var(--primary)' : 'var(--bg-tertiary)',
                    color: selectedInvoiceStatus === status ? '#002d33' : 'var(--text-secondary)',
                    fontWeight: 'bold'
                  }}
                >
                  {status === 'all' ? 'ALL' : status.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px' }}>Invoice ID</th>
                <th style={{ padding: '10px 8px' }}>Client</th>
                <th style={{ padding: '10px 8px' }}>Due Date</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Total</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background var(--transition-fast)' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{inv.id}</td>
                  <td style={{ padding: '12px 8px' }}>{inv.customerName}</td>
                  <td style={{ padding: '12px 8px', color: inv.status === 'Sent' && new Date(inv.dueDate) < new Date('2026-06-19') ? 'var(--color-error)' : 'inherit' }}>
                    {inv.dueDate}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                    LKR {inv.total.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-error'}`}>{inv.status}</span>
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button 
                      onClick={() => {
                        setActiveInvoiceId(inv.id);
                        setShowInvoicePrint(true);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    >
                      <Printer size={12} /> View
                    </button>
                    {inv.status === 'Sent' && (
                      <button 
                        onClick={() => {
                          const method = prompt("Enter payment method (Cash, Bank Transfer, Check):", "Bank Transfer");
                          if (method) markInvoicePaid(inv.id, method);
                        }}
                        className="btn btn-success"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        <Check size={12} /> Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sump Bidding Calculator Modal */}
      {showBidCalculator && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={20} color="var(--primary)" /> Sump Bidding Calculator
            </h3>
            <form onSubmit={handleCalculateBid}>
              <div className="form-group">
                <label>Commercial Client Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={calcForm.clientName}
                  onChange={(e) => setCalcForm({ ...calcForm, clientName: e.target.value })}
                  placeholder="e.g. Nilaveli Beach Hotel"
                  required
                />
              </div>

              <div className="form-group">
                <label>Concrete Sump Capacity (Litres)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={calcForm.sumpVolume}
                  onChange={(e) => setCalcForm({ ...calcForm, sumpVolume: Number(e.target.value) })}
                  placeholder="e.g. 20000"
                  required
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Estimated base sump wash cost: LKR 1.50 per Liter</span>
              </div>

              <div className="form-group">
                <label>Number of Rooftop Tanks (on-site)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={calcForm.rooftopTanks}
                  onChange={(e) => setCalcForm({ ...calcForm, rooftopTanks: Number(e.target.value) })}
                  placeholder="e.g. 4"
                  required
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Charged at LKR 4,500 standard B2B rate per unit</span>
              </div>

              <div className="details-grid" style={{ marginBottom: 0 }}>
                <div className="form-group">
                  <label>Sediment / Silt Complexity</label>
                  <select 
                    className="form-control"
                    value={calcForm.sedimentLevel}
                    onChange={(e) => setCalcForm({ ...calcForm, sedimentLevel: e.target.value })}
                  >
                    <option value="Light">Light (1.0x factor)</option>
                    <option value="Medium">Medium (1.2x factor - Biofilm scrub needed)</option>
                    <option value="Heavy">Heavy (1.5x factor - Mud sludge crust layers)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Access Difficulty</label>
                  <select 
                    className="form-control"
                    value={calcForm.accessComplexity}
                    onChange={(e) => setCalcForm({ ...calcForm, accessComplexity: e.target.value })}
                  >
                    <option value="Standard">Standard Rooftop/Ground</option>
                    <option value="Difficult">Confined space / Double ladder (+LKR 5,000)</option>
                  </select>
                </div>
              </div>

              {/* Estimate results */}
              <div style={{ backgroundColor: 'rgba(0,229,255,0.05)', padding: '1rem', borderRadius: '6px', margin: '1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>SUGGESTED CORPORATE BID QUOTE:</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Formulated on WHO drainage/washing guidelines</div>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                  LKR {(() => {
                    const sumpCost = calcForm.sumpVolume * 1.5;
                    const rooftopCost = calcForm.rooftopTanks * 4500;
                    const mult = calcForm.sedimentLevel === 'Medium' ? 1.2 : calcForm.sedimentLevel === 'Heavy' ? 1.5 : 1.0;
                    const addon = calcForm.accessComplexity === 'Difficult' ? 5000 : 0;
                    return Math.round((sumpCost + rooftopCost) * mult + addon).toLocaleString();
                  })()}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBidCalculator(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate B2B Proposal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
