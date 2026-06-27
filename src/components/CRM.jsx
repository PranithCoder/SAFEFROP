import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Phone, 
  MapPin, 
  Layers, 
  Calendar, 
  ShieldCheck, 
  DollarSign, 
  Search,
  BookOpen
} from 'lucide-react';
import { getDB, saveDB, generateCustomerID } from '../utils/db';

export default function CRM() {
  const [db, setDb] = useState(getDB());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  
  // Scheduling Form State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCustomerForSchedule, setSelectedCustomerForSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    scheduledDate: '',
    crewName: 'Crew A - Shan & Arul',
    technicianNotes: ''
  });

  // New Customer Form State
  const [newCust, setNewCust] = useState({
    name: '',
    phone: '',
    address: '',
    location: 'Trincomalee Town',
    tankSize: 1000,
    tankType: 'Plastic',
    plan: 'walk-in',
    amcFrequency: 0,
    amcPrice: 0,
    initialServiceDate: '',
    initialCrewName: 'Crew A - Shan & Arul'
  });

  useEffect(() => {
    const handleDbUpdate = () => {
      setDb(getDB());
    };
    window.addEventListener('db-update', handleDbUpdate);
    return () => window.removeEventListener('db-update', handleDbUpdate);
  }, []);

  const handleAddCustomer = (e) => {
    e.preventDefault();
    
    let amcPriceVal = 0;
    if (newCust.plan === 'vip') {
      amcPriceVal = 8000;
    } else if (newCust.plan === 'amc') {
      amcPriceVal = newCust.amcPrice;
    }

    const autoCustId = generateCustomerID(db);

    const newCustomerObj = {
      id: autoCustId,
      name: newCust.name,
      phone: newCust.phone,
      address: newCust.address,
      location: newCust.location,
      tankSize: Number(newCust.tankSize) || newCust.tankSize,
      tankType: newCust.tankType,
      plan: newCust.plan,
      vipCleansRemaining: newCust.plan === 'vip' ? 2 : 0,
      vipEmergencyCleansRemaining: newCust.plan === 'vip' ? 1 : 0,
      amcFrequency: newCust.plan === 'amc' ? Number(newCust.amcFrequency) : 0,
      amcNextVisit: newCust.plan === 'amc' ? '2026-07-01' : '',
      amcPrice: amcPriceVal,
      createdAt: '2026-06-19'
    };

    // If VIP or AMC subscription added, auto-create a paid invoice
    let updatedInvoices = [...db.invoices];
    if (newCustomerObj.plan !== 'walk-in') {
      const invId = `INV-2026-${String(db.invoices.length + 1).padStart(3, '0')}`;
      updatedInvoices.push({
        id: invId,
        customerId: newCustomerObj.id,
        customerName: newCustomerObj.name,
        date: '2026-06-19',
        dueDate: '2026-06-19',
        items: [{
          description: newCustomerObj.plan === 'vip' 
            ? 'Annual VIP Worry-Free Home Plan Subscription' 
            : `Yearly B2B Maintenance Contract - ${newCustomerObj.amcFrequency}x Cleans`,
          amount: newCustomerObj.amcPrice
        }],
        total: newCustomerObj.amcPrice,
        status: 'Paid',
        paymentMethod: 'Bank Transfer',
        paymentDate: '2026-06-19'
      });
    }

    // Schedule initial clean if date selected
    let updatedJobs = [...db.jobs];
    if (newCust.initialServiceDate) {
      let price = 3500;
      const tankSizeNum = Number(newCustomerObj.tankSize);
      if (tankSizeNum === 1000) price = 4500;
      else if (tankSizeNum === 2000) price = 5500;
      else if (typeof newCustomerObj.tankSize === 'string' && newCustomerObj.tankSize.includes('Sump')) price = 15000;

      if (newCustomerObj.plan === 'vip') price = 4000;
      else if (newCustomerObj.plan === 'amc') price = newCustomerObj.amcPrice / (newCustomerObj.amcFrequency || 1);

      updatedJobs.push({
        id: `job-${db.jobs.length + 1}`,
        customerId: newCustomerObj.id,
        customerName: newCustomerObj.name,
        customerPhone: newCustomerObj.phone,
        location: newCustomerObj.location,
        tankSize: newCustomerObj.tankSize,
        price: Math.round(price),
        status: 'Scheduled',
        scheduledDate: newCust.initialServiceDate,
        completedDate: '',
        crewName: newCust.initialCrewName,
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
        technicianNotes: 'Scheduled initial clean on registration.'
      });
    }

    const updatedCustomers = [...db.customers, newCustomerObj];
    saveDB({ 
      ...db, 
      customers: updatedCustomers, 
      invoices: updatedInvoices,
      jobs: updatedJobs
    });
    
    setShowAddCustomerModal(false);
    setNewCust({
      name: '',
      phone: '',
      address: '',
      location: 'Trincomalee Town',
      tankSize: 1000,
      tankType: 'Plastic',
      plan: 'walk-in',
      amcFrequency: 0,
      amcPrice: 0,
      initialServiceDate: '',
      initialCrewName: 'Crew A - Shan & Arul'
    });
  };

  const handleScheduleService = (e) => {
    e.preventDefault();
    if (!selectedCustomerForSchedule) return;

    let price = 3500;
    const tankSizeNum = Number(selectedCustomerForSchedule.tankSize);
    if (tankSizeNum === 1000) price = 4500;
    else if (tankSizeNum === 2000) price = 5500;
    else if (typeof selectedCustomerForSchedule.tankSize === 'string' && selectedCustomerForSchedule.tankSize.includes('Sump')) price = 15000;

    if (selectedCustomerForSchedule.plan === 'vip') price = 4000;
    else if (selectedCustomerForSchedule.plan === 'amc') price = selectedCustomerForSchedule.amcPrice / (selectedCustomerForSchedule.amcFrequency || 1);

    const newJobObj = {
      id: `job-${db.jobs.length + 1}`,
      customerId: selectedCustomerForSchedule.id,
      customerName: selectedCustomerForSchedule.name,
      customerPhone: selectedCustomerForSchedule.phone,
      location: selectedCustomerForSchedule.location,
      tankSize: selectedCustomerForSchedule.tankSize,
      price: Math.round(price),
      status: 'Scheduled',
      scheduledDate: scheduleForm.scheduledDate,
      completedDate: '',
      crewName: scheduleForm.crewName,
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
      technicianNotes: scheduleForm.technicianNotes
    };

    const updatedJobs = [...db.jobs, newJobObj];
    saveDB({ ...db, jobs: updatedJobs });
    alert(`Service scheduled for ${selectedCustomerForSchedule.name} on ${scheduleForm.scheduledDate}!`);
    setShowScheduleModal(false);
    setSelectedCustomerForSchedule(null);
    setScheduleForm({
      scheduledDate: '',
      crewName: 'Crew A - Shan & Arul',
      technicianNotes: ''
    });
  };

  const handleBookVipClean = (customer) => {
    // Verify VIP cleaning limits
    if (customer.plan === 'vip' && customer.vipCleansRemaining <= 0) {
      alert("No VIP cleans left in this subscription. Please renew.");
      return;
    }

    // Schedule job ticket
    const newJobObj = {
      id: `job-${db.jobs.length + 1}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      location: customer.location,
      tankSize: customer.tankSize,
      price: 4000, // VIP plan clean value
      status: 'Scheduled',
      scheduledDate: '2026-06-20', // Tomorrow
      completedDate: '',
      crewName: 'Crew A - Shan & Arul',
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
      technicianNotes: 'Prepaid VIP Cleaning Booking.'
    };

    const updatedJobs = [...db.jobs, newJobObj];
    saveDB({ ...db, jobs: updatedJobs });
    alert(`VIP clean scheduled for tomorrow! You can track this in the SOP tab.`);
  };

  const filteredCustomers = db.customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm) || 
                          c.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterPlan === 'all' || c.plan === filterPlan;
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Customer Relationship Management (CRM)</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage client profiles, check subscription plans, and dispatch schedules.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddCustomerModal(true)}>
          <Plus size={16} /> Register Customer
        </button>
      </div>

      {/* Pricing Guide Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.05), rgba(0, 230, 118, 0.05))', borderLeft: '4px solid var(--primary)' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={18} color="var(--primary)" /> Standard Flat Rate Pricing Matrix
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '0.75rem', fontSize: '0.9rem' }}>
          <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>500L (Small):</span>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>LKR 3,500</div>
          </div>
          <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>1000L (Standard):</span>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>LKR 4,500</div>
          </div>
          <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>2000L (Large Guesthouses):</span>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>LKR 5,500</div>
          </div>
          <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>VIP Plan:</span>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--secondary)' }}>LKR 8,000 / Yr</div>
          </div>
        </div>
      </div>

      {/* Filters board */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '250px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search name, phone or ward address..." 
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'none', padding: 0 }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'walk-in', 'vip', 'amc'].map(planType => (
            <button
              key={planType}
              onClick={() => setFilterPlan(planType)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                backgroundColor: filterPlan === planType ? 'var(--primary)' : 'var(--bg-tertiary)',
                color: filterPlan === planType ? '#002d33' : 'var(--text-primary)',
                fontWeight: 600,
                transition: 'all var(--transition-fast)'
              }}
            >
              {planType === 'all' ? 'All Customers' : planType.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Customers List grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ fontSize: '1.15rem' }}>{customer.name}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {customer.id}</span>
              </div>
              <span className={`badge ${
                customer.plan === 'vip' ? 'badge-success' : 
                customer.plan === 'amc' ? 'badge-primary' : 'badge-info'
              }`}>
                {customer.plan === 'vip' ? 'VIP MEMBER' : customer.plan === 'amc' ? 'B2B CONTRACT' : 'WALK-IN'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={14} /> {customer.phone}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={14} /> {customer.address}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Layers size={14} /> {customer.tankSize}L ({customer.tankType})</div>
            </div>

            {/* Service Tracking Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border-color)', marginTop: '4px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Last Service:</span>
                <div style={{ fontWeight: 'bold', color: customer.lastServiceDate ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {customer.lastServiceDate || 'Never'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Next Service:</span>
                <div style={{ fontWeight: 'bold', color: customer.nextServiceDate ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {customer.nextServiceDate || 'Not scheduled'}
                </div>
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Services Done:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>{customer.completedServicesCount || 0}</span>
              </div>
            </div>

            {/* VIP Plan Details */}
            {customer.plan === 'vip' && (
              <div style={{ backgroundColor: 'rgba(0, 230, 118, 0.04)', border: '1px solid rgba(0, 230, 118, 0.15)', borderRadius: '6px', padding: '10px', fontSize: '0.8rem', marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>VIP Cleans Left:</span>
                  <strong style={{ color: 'var(--secondary)' }}>{customer.vipCleansRemaining} / 2</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Emergency Visits Left:</span>
                  <strong style={{ color: 'var(--secondary)' }}>{customer.vipEmergencyCleansRemaining} / 1</strong>
                </div>
                <button 
                  className="btn btn-success" 
                  style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}
                  onClick={() => handleBookVipClean(customer)}
                  disabled={customer.vipCleansRemaining === 0}
                >
                  Book Scheduled VIP Clean
                </button>
              </div>
            )}

            {/* AMC B2B Plan Details */}
            {customer.plan === 'amc' && (
              <div style={{ backgroundColor: 'rgba(0, 229, 255, 0.04)', border: '1px solid rgba(0, 229, 255, 0.15)', borderRadius: '6px', padding: '10px', fontSize: '0.8rem', marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Cleans frequency:</span>
                  <strong>{customer.amcFrequency} times / year</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Annual Fee:</span>
                  <strong>LKR {customer.amcPrice.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', marginTop: '6px' }}>
                  <Calendar size={12} />
                  <span>Next scheduled: {customer.amcNextVisit || 'Not set'}</span>
                </div>
              </div>
            )}

            {customer.plan === 'walk-in' && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span>No Contract Registered</span>
                <span style={{ color: 'var(--text-secondary)' }}>Charges per clean</span>
              </div>
            )}

            {/* Generic Schedule Clean button */}
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', padding: '6px', fontSize: '0.75rem', gap: '4px', marginTop: '6px' }}
              onClick={() => {
                setSelectedCustomerForSchedule(customer);
                setShowScheduleModal(true);
              }}
            >
              <Calendar size={12} /> Schedule Service Date
            </button>
          </div>
        ))}
      </div>

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Add Customer Profile</h3>
            <form onSubmit={handleAddCustomer}>
              <div className="form-group">
                <label>Customer Name / Business Entity</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  placeholder="e.g. Nilaveli Beach Guesthouse or Perera Home"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone / WhatsApp Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newCust.phone}
                  onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                  placeholder="e.g. +94 77 123 4567"
                  required
                />
              </div>

              <div className="form-group">
                <label>Street Address</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newCust.address}
                  onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                  placeholder="e.g. 102 Nilaveli Road, Ward 4"
                  required
                />
              </div>

              <div className="details-grid" style={{ marginBottom: 0 }}>
                <div className="form-group">
                  <label>Geographic Ward</label>
                  <select 
                    className="form-control"
                    value={newCust.location}
                    onChange={(e) => setNewCust({ ...newCust, location: e.target.value })}
                  >
                    <option value="Trincomalee Town">Trincomalee Town</option>
                    <option value="Nilaveli">Nilaveli</option>
                    <option value="Uppuveli">Uppuveli</option>
                    <option value="China Bay">China Bay</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tank Volume (Litres)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={newCust.tankSize}
                    onChange={(e) => setNewCust({ ...newCust, tankSize: e.target.value })}
                    placeholder="e.g. 1000"
                    required
                  />
                </div>
              </div>

              <div className="details-grid" style={{ marginBottom: 0 }}>
                <div className="form-group">
                  <label>Tank Material Type</label>
                  <select 
                    className="form-control"
                    value={newCust.tankType}
                    onChange={(e) => setNewCust({ ...newCust, tankType: e.target.value })}
                  >
                    <option value="Plastic">Plastic (Blue/Black)</option>
                    <option value="Concrete">Concrete (Ground Sump)</option>
                    <option value="Metal">Metal/Galvanized</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Service Plan Level</label>
                  <select 
                    className="form-control"
                    value={newCust.plan}
                    onChange={(e) => setNewCust({ ...newCust, plan: e.target.value })}
                  >
                    <option value="walk-in">Walk-in (Standard Quote)</option>
                    <option value="vip">Worry-Free Home VIP Plan (LKR 8,000/yr)</option>
                    <option value="amc">Commercial AMC (Custom B2B Contract)</option>
                  </select>
                </div>
              </div>

              {/* Show AMC frequency fields if B2B contract */}
              {newCust.plan === 'amc' && (
                <div className="details-grid" style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label>Cleaning Frequency</label>
                    <select 
                      className="form-control"
                      value={newCust.amcFrequency}
                      onChange={(e) => setNewCust({ ...newCust, amcFrequency: e.target.value })}
                    >
                      <option value="2">2 times / year (semi-annual)</option>
                      <option value="3">3 times / year (every 4 months)</option>
                      <option value="4">4 times / year (quarterly)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Annual Contract Fee (LKR)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={newCust.amcPrice}
                      onChange={(e) => setNewCust({ ...newCust, amcPrice: e.target.value })}
                      placeholder="e.g. 20000"
                    />
                  </div>
                </div>
              )}

              {/* Optional Initial Service Scheduling */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>Schedule First Service (Optional)</h4>
                <div className="details-grid" style={{ marginBottom: 0 }}>
                  <div className="form-group">
                    <label>Initial Clean Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={newCust.initialServiceDate}
                      onChange={(e) => setNewCust({ ...newCust, initialServiceDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Assign Operations Crew</label>
                    <select 
                      className="form-control"
                      value={newCust.initialCrewName}
                      onChange={(e) => setNewCust({ ...newCust, initialCrewName: e.target.value })}
                    >
                      <option value="Crew A - Shan & Arul">Crew A - Shan &amp; Arul</option>
                      <option value="Crew B - Ravi & Niro">Crew B - Ravi &amp; Niro</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddCustomerModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Schedule Service Modal */}
      {showScheduleModal && selectedCustomerForSchedule && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Schedule Service Date</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Create a scheduled cleaning job for <strong>{selectedCustomerForSchedule.name}</strong>.
            </p>
            <form onSubmit={handleScheduleService}>
              <div className="form-group">
                <label>Schedule Target Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={scheduleForm.scheduledDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Assign Operations Crew</label>
                <select 
                  className="form-control"
                  value={scheduleForm.crewName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, crewName: e.target.value })}
                >
                  <option value="Crew A - Shan & Arul">Crew A - Shan &amp; Arul (Nilaveli Area)</option>
                  <option value="Crew B - Ravi & Niro">Crew B - Ravi &amp; Niro (SafeDrop Service Area)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Job Preparatory Notes</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  value={scheduleForm.technicianNotes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, technicianNotes: e.target.value })}
                  placeholder="Notes about location access, tank volume, ladder requirements..."
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedCustomerForSchedule(null);
                }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
