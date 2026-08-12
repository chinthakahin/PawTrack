import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = 'https://pawtrack-backend.vercel.app/api';

const STATUS_BADGE = {
  Stray:           'badge-stray',
  Rescued:         'badge-rescued',
  Adopted:         'badge-adopted',
  'Under Treatment':'badge-treatment',
};
const SPECIES_EMOJI = { Dog: '🐶', Cat: '🐱', Other: '🐾' };

/* ── Adopt/Foster modal ─────────────────────── */
const AdoptModal = ({ animal, onClose, onSubmit }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    applicantName:  user?.name  || '',
    applicantEmail: user?.email || '',
    applicantPhone: '',
    message:        '',
    requestType:    'Adopt',
  });
  const [busy, setBusy] = useState(false);
  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    await onSubmit({ ...form, animalId: animal._id, animalDisplayId: animal.animalId });
    setBusy(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Adoption / Foster Request</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Animal chip */}
        <div style={{ padding: '10px 14px', background: 'var(--green-50)', border: '1px solid var(--green-100)', borderRadius: 'var(--r-sm)', marginBottom: 20, fontSize: 13.5, fontWeight: 600, color: 'var(--green-700)' }}>
          {SPECIES_EMOJI[animal.species]} {animal.name} &nbsp;·&nbsp; <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{animal.animalId}</span>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Request type</label>
            <select className="form-select" name="requestType" value={form.requestType} onChange={set}>
              <option value="Adopt">Adopt</option>
              <option value="Foster">Foster (temporary)</option>
            </select>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Your name</label>
              <input className="form-input" type="text" name="applicantName" value={form.applicantName} onChange={set} required placeholder="Full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" name="applicantEmail" value={form.applicantEmail} onChange={set} required placeholder="your@email.com" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Phone (optional)</label>
            <input className="form-input" type="tel" name="applicantPhone" value={form.applicantPhone} onChange={set} placeholder="+1 234 567 890" />
          </div>
          <div className="form-group">
            <label className="form-label">Why do you want to adopt?</label>
            <textarea className="form-textarea" name="message" value={form.message} onChange={set} placeholder="Tell us about your home, lifestyle…" rows={3} />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
            {busy ? '⏳ Submitting…' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ── Single animal card ─────────────────────── */
const AnimalCard = ({ animal, onNavigate, onToggleSOS, onDelete, onAdopt }) => {
  const { isVolunteer } = useAuth();
  const mp = animal.medicalProfile;

  return (
    <div className={`animal-card${animal.isEmergency ? ' emergency' : ''}`}>
      {/* SOS ribbon */}
      {animal.isEmergency && (
        <div style={{ marginBottom: 10 }}>
          <span className="badge badge-sos">🚨 Emergency SOS</span>
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 5 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              {SPECIES_EMOJI[animal.species]} {animal.name}
            </span>
            <code style={{ fontSize: 10.5, background: 'var(--green-50)', color: 'var(--green-700)', border: '1px solid var(--green-100)', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>
              {animal.animalId}
            </code>
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            <span className={`badge ${STATUS_BADGE[animal.status] || 'badge-stray'}`}>{animal.status}</span>
            {mp?.isNeutered && <span className="badge badge-vaccinated">✂ Neutered</span>}
            {mp?.rabiesVaccinations?.length > 0 && <span className="badge badge-vaccinated">💉 Vaccinated</span>}
          </div>
        </div>

        {/* Volunteer actions — stacked icon buttons */}
        {isVolunteer && (
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            <button
              className={`btn btn-xs ${animal.isEmergency ? 'btn-warning' : 'btn-ghost'}`}
              onClick={() => onToggleSOS(animal._id, animal.isEmergency)}
              title={animal.isEmergency ? 'Remove SOS' : 'Mark SOS'}
            >
              {animal.isEmergency ? '✔ SOS off' : '🚨 SOS'}
            </button>
            <button
              className="btn btn-xs btn-danger"
              onClick={() => onDelete(animal._id)}
              title="Delete record"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 10px', marginBottom: 12 }}>
        {[['Breed', animal.breed || 'Unknown'], ['Age', animal.age || 'Unknown'], ['Gender', animal.gender], ['Species', animal.species]].map(([k, v]) => (
          <div key={k} style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--text-muted)' }}>{k}: </span>{v}
          </div>
        ))}
      </div>

      {/* Location */}
      {animal.lastSeenLocation?.addressText && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          📍 {animal.lastSeenLocation.addressText}
        </div>
      )}

      <div className="card-divider" />

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => onNavigate(`/animal/${animal.animalId}`)} style={{ flex: 1 }}>
          View Profile
        </button>
        {animal.status !== 'Adopted' && (
          <button className="btn btn-success btn-sm" onClick={() => onAdopt(animal)} style={{ flex: 1 }}>
            🏡 Adopt Me
          </button>
        )}
      </div>

      {/* QR thumbnail */}
      {animal.qrCodeUrl && (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <img
            src={animal.qrCodeUrl}
            alt={`QR ${animal.name}`}
            style={{ width: 52, height: 52, borderRadius: 6, border: '1px solid var(--border)', opacity: .8 }}
          />
        </div>
      )}
    </div>
  );
};

/* ── Dashboard page ─────────────────────────── */
const Dashboard = ({ onNavigate }) => {
  const { isVolunteer, token } = useAuth();
  const [animals, setAnimals]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setFilter] = useState('All');
  const [adoptTarget, setAdopt]   = useState(null);
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAnimals = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/animals`);
      setAnimals(res.data.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAnimals(); }, [fetchAnimals]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this animal record?')) return;
    try {
      await axios.delete(`${API}/animals/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Record deleted.');
      fetchAnimals();
    } catch (err) { showToast(err.response?.data?.error || 'Delete failed', 'error'); }
  };

  const toggleSOS = async (id, current) => {
    try {
      await axios.put(`${API}/animals/${id}`, { isEmergency: !current }, { headers: { Authorization: `Bearer ${token}` } });
      showToast(!current ? '🚨 SOS alert activated' : '✅ SOS alert removed');
      fetchAnimals();
    } catch { showToast('Failed to update status', 'error'); }
  };

  const handleAdoptSubmit = async (data) => {
    try {
      await axios.post(`${API}/adoptions`, data);
      showToast('Adoption request submitted! Volunteers will be in touch.');
      setAdopt(null);
    } catch (err) { showToast(err.response?.data?.error || 'Submission failed', 'error'); }
  };

  const filtered = animals.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      a.name?.toLowerCase().includes(q) ||
      a.animalId?.toLowerCase().includes(q) ||
      a.species?.toLowerCase().includes(q) ||
      a.breed?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || a.status === statusFilter || (statusFilter === 'SOS' && a.isEmergency);
    return matchSearch && matchStatus;
  });

  const stats = {
    total:    animals.length,
    sos:      animals.filter(a => a.isEmergency).length,
    rescued:  animals.filter(a => a.status === 'Rescued').length,
    adopted:  animals.filter(a => a.status === 'Adopted').length,
    stray:    animals.filter(a => a.status === 'Stray').length,
  };

  return (
    <>
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>{toast.type === 'error' ? '❌' : '✅'} {toast.msg}</div>
        </div>
      )}

      {adoptTarget && (
        <AdoptModal animal={adoptTarget} onClose={() => setAdopt(null)} onSubmit={handleAdoptSubmit} />
      )}

      {/* SOS banner */}
      {stats.sos > 0 && (
        <div className="alert-banner danger">
          <div className="alert-banner-left">
            <span className="alert-banner-icon">🚨</span>
            <div>
              <div className="alert-banner-title">{stats.sos} Emergency SOS {stats.sos === 1 ? 'Alert' : 'Alerts'} Active</div>
              <div className="alert-banner-sub">Animals in urgent need of attention</div>
            </div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => setFilter('SOS')}>View Alerts</button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        {[
          { icon: '🐾', value: stats.total,   label: 'Registered',   color: 'var(--green-600)' },
          { icon: '🚨', value: stats.sos,     label: 'SOS Active',   color: 'var(--sos)' },
          { icon: '🏥', value: stats.rescued, label: 'Rescued',      color: 'var(--rescued)' },
          { icon: '🏡', value: stats.adopted, label: 'Adopted',      color: 'var(--adopted)' },
          { icon: '🌍', value: stats.stray,   label: 'Stray',        color: 'var(--stray)' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Header + search + register btn */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Animals</h2>
          <p>{filtered.length} record{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="page-header-right">
          <div className="search-bar">
            <span className="search-bar-icon">🔍</span>
            <input
              type="text"
              placeholder="Search name, ID, species…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1 }} onClick={() => setSearch('')}>✕</button>
            )}
          </div>
          {isVolunteer && (
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('/register')}>
              + Register
            </button>
          )}
        </div>
      </div>

      {/* Status filter chips */}
      <div className="filter-bar" style={{ marginBottom: 22 }}>
        {['All', 'SOS', 'Stray', 'Rescued', 'Under Treatment', 'Adopted'].map(f => (
          <button key={f} className={`filter-chip${statusFilter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="loading-container"><div className="spinner" /><p>Loading…</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🐾</div>
          <h3>No animals found</h3>
          <p>{search ? 'Try adjusting your search.' : 'No animals registered yet.'}</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(a => (
            <AnimalCard
              key={a._id}
              animal={a}
              onNavigate={onNavigate}
              onToggleSOS={toggleSOS}
              onDelete={handleDelete}
              onAdopt={setAdopt}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default Dashboard;
