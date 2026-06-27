import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Trash, 
  Check, 
  AlertTriangle, 
  DollarSign, 
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { getDB, saveDB } from '../utils/db';

export default function Inventory() {
  const [db, setDb] = useState(getDB());
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Equipment',
    quantity: 1,
    unit: 'unit',
    status: 'Available',
    cost: 0,
    assignedTo: 'Store'
  });

  useEffect(() => {
    const handleDbUpdate = () => {
      setDb(getDB());
    };
    window.addEventListener('db-update', handleDbUpdate);
    return () => window.removeEventListener('db-update', handleDbUpdate);
  }, []);

  const handleAddItem = (e) => {
    e.preventDefault();
    const itemObj = {
      id: `inv-${db.inventory.length + 1}`,
      name: newItem.name,
      category: newItem.category,
      quantity: Number(newItem.quantity) || 1,
      unit: newItem.unit,
      status: newItem.status,
      cost: Number(newItem.cost) || 0,
      assignedTo: newItem.assignedTo
    };

    const updatedInventory = [...db.inventory, itemObj];
    saveDB({ ...db, inventory: updatedInventory });
    setShowAddItemModal(false);
    setNewItem({
      name: '',
      category: 'Equipment',
      quantity: 1,
      unit: 'unit',
      status: 'Available',
      cost: 0,
      assignedTo: 'Store'
    });
  };

  const handleToggleStatus = (itemId) => {
    const updatedInventory = db.inventory.map(item => {
      if (item.id === itemId) {
        let nextStatus = item.status;
        if (item.status === 'Available') nextStatus = 'In Use';
        else if (item.status === 'In Use') nextStatus = 'Maintenance';
        else nextStatus = 'Available';

        return { ...item, status: nextStatus };
      }
      return item;
    });
    saveDB({ ...db, inventory: updatedInventory });
  };

  const handleRestockConsumable = (itemId) => {
    const updatedInventory = db.inventory.map(item => {
      if (item.id === itemId) {
        const restockQuantity = item.unit === 'pieces' ? 100 : 5;
        const restockCost = item.name.includes('Sticker') ? 1000 : 500;
        
        // Add expense to invoices/payouts log (optional)
        return {
          ...item,
          quantity: item.quantity + restockQuantity,
          status: 'Available',
          cost: item.cost + restockCost
        };
      }
      return item;
    });

    saveDB({ ...db, inventory: updatedInventory });
    alert("Restock ordered! Quantity increased and logged to equipment costs.");
  };

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Equipment &amp; Inventory</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Track pressure washers, pumps, crew gear, and consumables.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddItemModal(true)}>
          <Plus size={16} /> Add Inventory Item
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        {/* Equipment Ledger */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wrench size={18} color="var(--primary)" /> Professional Operations Gear
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Asset / Equipment</th>
                <th style={{ padding: '8px' }}>Category</th>
                <th style={{ padding: '8px' }}>Assigned</th>
                <th style={{ padding: '8px' }}>Status</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Cost (LKR)</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {db.inventory.filter(item => item.category !== 'Consumable').map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{item.name}</td>
                  <td style={{ padding: '12px 8px' }}>{item.category}</td>
                  <td style={{ padding: '12px 8px' }}>{item.assignedTo}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span className={`badge ${
                      item.status === 'Available' ? 'badge-success' : 
                      item.status === 'In Use' ? 'badge-warning' : 'badge-error'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>LKR {item.cost.toLocaleString()}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleToggleStatus(item.id)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                    >
                      Cycle Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Consumables Inventory */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Stickers &amp; Printing stock</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {db.inventory.filter(item => item.category === 'Consumable').map(item => (
              <div key={item.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{item.name}</strong>
                  <span className={`badge ${item.quantity < 20 ? 'badge-error' : 'badge-success'}`}>
                    {item.quantity} {item.unit}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Accumulated spend: LKR {item.cost.toLocaleString()}</span>
                  <button 
                    onClick={() => handleRestockConsumable(item.id)}
                    className="btn btn-primary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    Order Refill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Add Inventory Item</h3>
            <form onSubmit={handleAddItem}>
              <div className="form-group">
                <label>Item Name / Description</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g. Ingco Pressure Washer 1800W"
                  required
                />
              </div>

              <div className="details-grid" style={{ marginBottom: 0 }}>
                <div className="form-group">
                  <label>Item Category</label>
                  <select 
                    className="form-control"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  >
                    <option value="Equipment">Major Equipment</option>
                    <option value="PPE">PPE / Safety Gear</option>
                    <option value="Consumable">Consumable Reminders</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Item Status</label>
                  <select 
                    className="form-control"
                    value={newItem.status}
                    onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
                  >
                    <option value="Available">Available in Store</option>
                    <option value="In Use">Dispatched with Crew</option>
                    <option value="Maintenance">Under repair / check</option>
                    <option value="Restock Needed">Needs restock orders</option>
                  </select>
                </div>
              </div>

              <div className="details-grid" style={{ marginBottom: 0 }}>
                <div className="form-group">
                  <label>Initial Quantity</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    placeholder="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Item Cost (LKR)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={newItem.cost}
                    onChange={(e) => setNewItem({ ...newItem, cost: e.target.value })}
                    placeholder="e.g. 10000"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddItemModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
