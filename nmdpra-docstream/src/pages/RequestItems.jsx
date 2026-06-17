import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, GreenBtn, Input, Modal, StatusBadge, Loader } from '../components/UI.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const EMPTY_ITEM = { description: '', unit: '', quantity: '', allocation: '' };

export default function RequestItems() {
  const { user } = useAuth();
  const [officer, setOfficer] = useState({ name: '', uniqueId: '', division: '' });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [attachment, setAttachment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef();
  const isApprover = ['rom_supervisor', 'supervisor', 'ict'].includes(user?.role);

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/items');
      if (isApprover) setAllRequests(res.data);
      else setMyRequests(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const updateItem = (idx, field, val) => {
    const updated = [...items];
    updated[idx][field] = val;
    setItems(updated);
  };

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const reset = () => {
    setOfficer({ name: '', uniqueId: '', division: '' });
    setItems([{ ...EMPTY_ITEM }]);
    setAttachment(null);
  };

  const submit = async () => {
    try {
      const formData = new FormData();
      formData.append('officerName', officer.name);
      formData.append('uniqueId', officer.uniqueId);
      formData.append('division', officer.division);
      formData.append('items', JSON.stringify(items));
      if (attachment) formData.append('document', attachment);
      await axios.post('/api/items', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowModal(true);
      reset();
      loadRequests();
    } catch { alert('Error submitting request'); }
  };

  const handleAction = async (id, action) => {
    try {
      await axios.patch(`/api/items/${id}/${action}`, {});
      loadRequests();
    } catch { alert('Error'); }
  };

  if (isApprover) {
    return (
      <Card>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Item Requisition Requests</h3>
        {loading ? <Loader /> : allRequests.length === 0 ? (
          <p style={{ color: '#888' }}>No item requests yet.</p>
        ) : allRequests.map(r => (
          <div key={r._id} style={{ padding: '16px', borderRadius: '12px', background: '#f9f9f9', marginBottom: '12px', border: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: '600', fontSize: '14px' }}>{r.officerName || r.requesterName}</span>
              <StatusBadge status={r.status} />
            </div>
            {r.division && <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>{r.division}</div>}
            {r.items?.map((item, i) => (
              <div key={i} style={{ fontSize: '13px', color: '#555', marginBottom: '3px' }}>
                • {item.description} — {item.unit} × {item.quantity} [{item.allocation}]
              </div>
            ))}
            {r.status === 'pending' && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button onClick={() => handleAction(r._id, 'approve')} style={{ padding: '8px 20px', background: '#2d7a2d', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Approve</button>
                <button onClick={() => handleAction(r._id, 'decline')} style={{ padding: '8px 20px', background: '#e53935', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Decline</button>
              </div>
            )}
          </div>
        ))}
      </Card>
    );
  }

  return (
    <Card>
      <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
        Item Requisition
      </h3>

      {/* Officer info — 3 columns */}
      <div style={{ marginTop: '16px', marginBottom: '20px' }}>
        <p style={sectionLabel}>Requisition Officer</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            ['name', 'Name of Requisition Officer'],
            ['uniqueId', 'Unique ID'],
            ['division', 'Division / Unit'],
          ].map(([key, label]) => (
            <div key={key}>
              <label style={fieldLabel}>{label}</label>
              <Input placeholder={label} value={officer[key]} onChange={v => setOfficer(p => ({ ...p, [key]: v }))} />
            </div>
          ))}
        </div>
      </div>

      {/* Items section */}
      <p style={sectionLabel}>Items</p>
      <div style={{ overflowX: 'auto', marginBottom: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              {['Description', 'Unit', 'Quantity', 'Allocation', ''].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#2d7a2d', borderBottom: '1px solid #eee' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                {['description', 'unit', 'quantity', 'allocation'].map(field => (
                  <td key={field} style={{ padding: '6px 8px' }}>
                    <Input placeholder={field.charAt(0).toUpperCase() + field.slice(1)} value={item[field]} onChange={v => updateItem(idx, field, v)} />
                  </td>
                ))}
                <td style={{ padding: '6px 8px' }}>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={() => setItems([...items, { ...EMPTY_ITEM }])} style={{
        padding: '8px 16px', background: 'transparent', border: '1.5px solid #2d7a2d',
        color: '#2d7a2d', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginBottom: '20px',
      }}>+ Add Item</button>

      {/* Supporting document */}
      <div style={{ marginBottom: '24px' }}>
        <p style={sectionLabel}>Supporting Document <span style={{ fontWeight: '400', color: '#aaa' }}>(optional)</span></p>
        <div
          onClick={() => fileRef.current.click()}
          style={{ padding: '18px', border: '2px dashed #ccc', borderRadius: '12px', textAlign: 'center', color: '#888', fontSize: '13px', cursor: 'pointer' }}
        >
          {attachment ? `📄 ${attachment.name}` : '📎 Click to attach supporting document'}
        </div>
        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => setAttachment(e.target.files[0] || null)} />
      </div>

      {/* Submit / Cancel */}
      <div style={{ display: 'flex', gap: '12px', maxWidth: '400px' }}>
        <GreenBtn label="Submit" onClick={submit} />
        <button onClick={reset} style={{
          flex: 1, padding: '13px', background: 'transparent', border: '1.5px solid #ccc',
          color: '#555', borderRadius: '30px', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
        }}>Cancel</button>
      </div>

      {/* My past requests */}
      {!loading && myRequests.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', paddingTop: '16px', borderTop: '1px solid #eee' }}>My Requests</h4>
          {myRequests.map(r => (
            <div key={r._id} style={{ padding: '12px 16px', borderRadius: '10px', background: '#f5f5f5', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#555' }}>{r.items?.map(i => i.description || i.name).join(', ')}</span>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Requisition Submitted">
          <GreenBtn label="Okay" onClick={() => setShowModal(false)} />
        </Modal>
      )}
    </Card>
  );
}

const sectionLabel = { fontSize: '13px', fontWeight: '700', color: '#333', marginBottom: '10px' };
const fieldLabel = { fontSize: '11px', color: '#888', marginBottom: '4px', display: 'block' };
