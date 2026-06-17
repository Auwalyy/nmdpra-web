import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, GreenBtn, GoldBtn, Input, Modal, BackBtn } from '../components/UI.jsx';

const EMPTY_FORM = {
  retailOutlet: '', retailOutletAddress: '', pmsOpeningStock: '',
  productReceived: '', priceRange: '', pumpDispensingLevel: '',
};

export default function AddFacility() {
  const [view, setView] = useState('choose');
  const [form, setForm] = useState(EMPTY_FORM);
  const [showModal, setShowModal] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [fileForm, setFileForm] = useState({ facilityName: '', description: '', fileName: '' });

  const f = (k) => v => setForm(p => ({ ...p, [k]: v }));

  const fetchFacilities = () =>
    axios.get('/api/facilities').then(r => setFacilities(r.data)).catch(() => {});

  useEffect(() => { if (view === 'list') fetchFacilities(); }, [view]);

  const submitFacility = async () => {
    try {
      await axios.post('/api/facilities', form);
      setShowModal(true);
    } catch { alert('Error submitting facility'); }
  };

  const submitFile = async (fileType) => {
    try {
      await axios.post('/api/files', { ...fileForm, fileType });
      setShowModal(true);
    } catch { alert('Error'); }
  };

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    const headers = ['Retail Outlet', 'Address', 'PMS Opening Stock', 'Product Received', 'Price Range', 'Pump Dispensing Level'];
    const rows = facilities.map(f => [
      f.retailOutlet, f.retailOutletAddress, f.pmsOpeningStock,
      f.productReceived, f.priceRange, f.pumpDispensingLevel,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'facilities.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (view === 'choose') {
    return (
      <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
        <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <GoldBtn label="General File" onClick={() => setView('general')} />
          <GreenBtn label="Take Over File" onClick={() => setView('takeover')} />
          <div style={{ borderTop: '1px solid #eee', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <GreenBtn label="Add New Facility" onClick={() => setView('add')} style={{ background: '#1e5c1e' }} />
            <GreenBtn label="View Facilities" onClick={() => setView('list')} style={{ background: '#3a6b9f' }} />
          </div>
        </div>
      </Card>
    );
  }

  if (view === 'add') {
    return (
      <Card>
        <BackBtn onClick={() => setView('choose')} />
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Add a Facility</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', maxWidth: '860px' }}>
          {[
            ['retailOutlet', 'Retail Outlet'],
            ['retailOutletAddress', 'Retail Outlet Address'],
            ['pmsOpeningStock', 'PMS Opening Stock'],
            ['productReceived', 'Product Received'],
            ['priceRange', 'Price Range'],
            ['pumpDispensingLevel', 'Pump Dispensing Level'],
          ].map(([key, label]) => (
            <div key={key}>
              <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>{label}</label>
              <Input placeholder={label} value={form[key]} onChange={f(key)} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: '20px', maxWidth: '200px' }}>
          <GreenBtn label="Add +" onClick={submitFacility} />
        </div>
        {showModal && (
          <Modal title="Facility Added">
            <GreenBtn label="Okay" onClick={() => { setShowModal(false); setView('choose'); setForm(EMPTY_FORM); }} />
          </Modal>
        )}
      </Card>
    );
  }

  if (view === 'list') {
    return (
      <Card>
        <BackBtn onClick={() => setView('choose')} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Facilities</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { label: '🖨 Print', action: handlePrint, bg: '#555' },
              { label: '⬇ Export CSV', action: handleExportCSV, bg: '#2d7a2d' },
            ].map(({ label, action, bg }) => (
              <button key={label} onClick={action} style={{
                padding: '8px 16px', background: bg, color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '13px',
                fontWeight: '600', cursor: 'pointer',
              }}>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }} className="printable-table">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                {['Retail Outlet', 'Address', 'PMS Opening Stock', 'Product Received', 'Price Range', 'Pump Dispensing Level'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: '#2d7a2d', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facilities.map((fc, i) => (
                <tr key={fc._id || i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  {['retailOutlet', 'retailOutletAddress', 'pmsOpeningStock', 'productReceived', 'priceRange', 'pumpDispensingLevel'].map(k => (
                    <td key={k} style={{ padding: '12px 14px', color: '#555' }}>{fc[k] ?? '—'}</td>
                  ))}
                </tr>
              ))}
              {facilities.length === 0 && (
                <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#888' }}>No facilities found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  if (view === 'general' || view === 'takeover') {
    return (
      <Card>
        <BackBtn onClick={() => setView('choose')} />
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
          {view === 'general' ? 'Upload General File' : 'Upload Take Over File'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
          <Input placeholder="Facility Name" value={fileForm.facilityName} onChange={v => setFileForm({ ...fileForm, facilityName: v })} />
          <Input placeholder="File Name / Reference" value={fileForm.fileName} onChange={v => setFileForm({ ...fileForm, fileName: v })} />
          <Input placeholder="Description" value={fileForm.description} onChange={v => setFileForm({ ...fileForm, description: v })} />
          <div style={{ padding: '24px', border: '2px dashed #ccc', borderRadius: '12px', textAlign: 'center', color: '#888', fontSize: '14px', cursor: 'pointer' }}>
            📎 Click to attach file
          </div>
          <GreenBtn label="Upload File" onClick={() => submitFile(view === 'general' ? 'general' : 'takeover')} />
        </div>
        {showModal && (
          <Modal title="File Uploaded">
            <GreenBtn label="Okay" onClick={() => { setShowModal(false); setView('choose'); }} />
          </Modal>
        )}
      </Card>
    );
  }

  return null;
}
