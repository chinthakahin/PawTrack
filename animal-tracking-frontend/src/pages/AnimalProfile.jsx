import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = 'https://pawtrack-backend.vercel.app/api';

const STATUS_BADGE = {
  Stray: 'badge-stray', Rescued: 'badge-rescued',
  Adopted: 'badge-adopted', 'Under Treatment': 'badge-treatment',
};

/* Pill list for dates */
const DatePillList = ({ items, emptyMsg }) =>
  items?.length > 0 ? (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {items.map((v, i) => (
        <span key={i} className="vacc-pill">
          📅 {new Date(v.date).toLocaleDateString()}{v.notes ? ` — ${v.notes}` : ''}
        </span>
      ))}
    </div>
  ) : (
    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{emptyMsg}</p>
  );

const AnimalProfile = ({ animalId, onNavigate }) => {
  const { isVolunteer, token } = useAuth();
  const [animal, setAnimal]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [toast, setToast]       = useState(null);
  const [medForm, setMedForm]   = useState({
    rabiesDate: '', rabiesNotes: '',
    dewormDate: '', dewormNotes: '',
    isNeutered: false, neuterDate: '',
    medicalLog: '',
  });
  const [medBusy, setMedBusy] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/animals/${animalId}`);
        setAnimal(res.data.data);
        setMedForm(f => ({ ...f, isNeutered: res.data.data?.medicalProfile?.isNeutered || false }));
      } catch { setError('Animal not found.'); }
      finally { setLoading(false); }
    })();
  }, [animalId]);

  const saveMed = async e => {
    e.preventDefault();
    setMedBusy(true);
    try {
      const payload = { isNeutered: medForm.isNeutered };
      if (medForm.rabiesDate) payload.rabiesVaccination  = { date: medForm.rabiesDate, notes: medForm.rabiesNotes };
      if (medForm.dewormDate) payload.dewormingDate       = { date: medForm.dewormDate, notes: medForm.dewormNotes };
      if (medForm.neuterDate) payload.neuterDate          = medForm.neuterDate;
      if (medForm.medicalLog) payload.medicalLog          = medForm.medicalLog;

      const res = await axios.put(`${API}/animals/${animal._id}/medical`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnimal(res.data.data);
      setMedForm(f => ({ ...f, rabiesDate: '', rabiesNotes: '', dewormDate: '', dewormNotes: '', neuterDate: '', medicalLog: '' }));
      showToast('Medical profile updated.');
    } catch (err) { showToast(err.response?.data?.error || 'Update failed', 'error'); }
    finally { setMedBusy(false); }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading profile…</p></div>;

  if (error) return (
    <div className="empty-state">
      <div className="empty-state-icon">🔍</div>
      <h3>Not Found</h3>
      <p>{error}</p>
      <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => onNavigate('/')}>← Back</button>
    </div>
  );

  const mp = animal?.medicalProfile;

  return (
    <>
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>{toast.type === 'error' ? '❌' : '✅'} {toast.msg}</div>
        </div>
      )}

      {/* Back */}
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }} onClick={() => onNavigate('/')}>
        ← Back to Dashboard
      </button>

      {/* Hero card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="profile-hero">
          <div className="profile-avatar">
            {animal.species === 'Dog' ? '🐶' : animal.species === 'Cat' ? '🐱' : '🐾'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.02em' }}>{animal.name}</h1>
              {animal.isEmergency && <span className="badge badge-sos">🚨 Emergency SOS</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              <code style={{ fontSize: 12, background: 'var(--green-50)', color: 'var(--green-700)', border: '1px solid var(--green-100)', borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>
                {animal.animalId}
              </code>
              <span className={`badge ${STATUS_BADGE[animal.status] || 'badge-stray'}`}>{animal.status}</span>
              {mp?.isNeutered && <span className="badge badge-vaccinated">✂ Neutered</span>}
              {mp?.rabiesVaccinations?.length > 0 && <span className="badge badge-vaccinated">💉 Vaccinated</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '6px 0' }}>
              {[['Species', animal.species], ['Breed', animal.breed || 'Unknown'], ['Age', animal.age || 'Unknown'], ['Gender', animal.gender]].map(([k, v]) => (
                <div key={k} className="info-row"><span className="info-label">{k}</span><span className="info-value">{v}</span></div>
              ))}
            </div>
          </div>
          {animal.qrCodeUrl && (
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <img src={animal.qrCodeUrl} alt="QR Code" style={{ width: 96, height: 96, borderRadius: 10, border: '1px solid var(--border)' }} />
              <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>Scan QR</p>
            </div>
          )}
        </div>

        {animal.lastSeenLocation?.addressText && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            📍 {animal.lastSeenLocation.addressText}
            {animal.lastSeenLocation.latitude && (
              <span style={{ marginLeft: 10, fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                ({animal.lastSeenLocation.latitude.toFixed(4)}, {animal.lastSeenLocation.longitude.toFixed(4)})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Medical profile */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 className="section-title">Medical Profile</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
          {/* Rabies */}
          <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-md)', padding: '14px 16px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--green-700)', marginBottom: 10 }}>💉 Rabies ({mp?.rabiesVaccinations?.length || 0})</p>
            <DatePillList items={mp?.rabiesVaccinations} emptyMsg="No records yet" />
          </div>
          {/* Deworming */}
          <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-md)', padding: '14px 16px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--rescued)', marginBottom: 10 }}>🪱 Deworming ({mp?.dewormingDates?.length || 0})</p>
            <DatePillList items={mp?.dewormingDates} emptyMsg="No records yet" />
          </div>
          {/* Neuter */}
          <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-md)', padding: '14px 16px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--stray)', marginBottom: 10 }}>✂ Sterilization</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: mp?.isNeutered ? 'var(--adopted)' : 'var(--text-muted)' }}>
              {mp?.isNeutered ? '✅ Neutered / Spayed' : 'Not neutered'}
            </p>
            {mp?.neuterDate && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>📅 {new Date(mp.neuterDate).toLocaleDateString()}</p>}
          </div>
        </div>

        {/* Medical logs */}
        {mp?.medicalLogs?.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-muted)', marginBottom: 10 }}>📋 Medical Logs</p>
            {[...mp.medicalLogs].reverse().map((log, i) => (
              <div key={i} className="med-log-entry">
                <div className="med-log-text">{log.note}</div>
                <div className="med-log-meta">{new Date(log.date).toLocaleDateString()} · {log.loggedBy}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Volunteer: update medical */}
      {isVolunteer && (
        <div className="card">
          <h2 className="section-title">Update Medical Records</h2>
          <form onSubmit={saveMed} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-grid">
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-700)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>💉 Rabies Vaccination</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input className="form-input" type="date" value={medForm.rabiesDate} onChange={e => setMedForm(f => ({ ...f, rabiesDate: e.target.value }))} />
                  <input className="form-input" type="text" placeholder="Notes (optional)" value={medForm.rabiesNotes} onChange={e => setMedForm(f => ({ ...f, rabiesNotes: e.target.value }))} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--rescued)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>🪱 Deworming Date</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input className="form-input" type="date" value={medForm.dewormDate} onChange={e => setMedForm(f => ({ ...f, dewormDate: e.target.value }))} />
                  <input className="form-input" type="text" placeholder="Notes (optional)" value={medForm.dewormNotes} onChange={e => setMedForm(f => ({ ...f, dewormNotes: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="form-grid">
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--stray)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>✂ Sterilization</p>
                <div className="check-row" style={{ marginBottom: 8 }}>
                  <input type="checkbox" id="neutered" checked={medForm.isNeutered} onChange={e => setMedForm(f => ({ ...f, isNeutered: e.target.checked }))} />
                  <label htmlFor="neutered">Neutered / Spayed</label>
                </div>
                {medForm.isNeutered && (
                  <input className="form-input" type="date" value={medForm.neuterDate} onChange={e => setMedForm(f => ({ ...f, neuterDate: e.target.value }))} />
                )}
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>📋 Medical Log</p>
                <textarea className="form-textarea" placeholder="Add a note or observation…" value={medForm.medicalLog} onChange={e => setMedForm(f => ({ ...f, medicalLog: e.target.value }))} rows={3} />
              </div>
            </div>

            <div>
              <button type="submit" className="btn btn-primary" disabled={medBusy}>
                {medBusy ? '⏳ Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default AnimalProfile;
