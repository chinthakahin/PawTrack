import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = 'https://pawtrack-backend.vercel.app/api';

const blank = {
  name: '', species: 'Dog', breed: '', age: '', gender: 'Male',
  status: 'Stray', isEmergency: false,
  loc: { latitude: '', longitude: '', addressText: '' },
  med: { isNeutered: false, neuterDate: '', rabiesDate: '', dewormDate: '', note: '' },
};

const RegisterAnimal = ({ onNavigate }) => {
  const { token, isVolunteer } = useAuth();
  const [form, setForm]     = useState(blank);
  const [busy, setBusy]     = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');
  const [aiFilled, setAiFilled] = useState(false);

  // Auto-fill form if AI draft data exists in localStorage
  useEffect(() => {
    const draft = localStorage.getItem('ai_animal_draft');
    if (draft) {
      try {
        const aiData = JSON.parse(draft);

        // Determine species (Dog / Cat / Other)
        let detectedSpecies = 'Dog';
        if (aiData.species) {
          const lower = aiData.species.toLowerCase();
          if (lower.includes('cat')) detectedSpecies = 'Cat';
          else if (lower.includes('dog')) detectedSpecies = 'Dog';
          else detectedSpecies = 'Other';
        }

        setForm(f => ({
          ...f,
          species: detectedSpecies,
          breed: aiData.species || f.breed,
          med: {
            ...f.med,
            note: `[AI Analysis Results]\nCondition: ${aiData.healthCondition || 'N/A'}\nSummary: ${aiData.description || ''}`
          }
        }));

        setAiFilled(true);
        localStorage.removeItem('ai_animal_draft');
      } catch (err) {
        console.error('Error loading AI draft:', err);
      }
    }
  }, []);

  if (!isVolunteer) return (
    <div className="empty-state">
      <div className="empty-state-icon">🔒</div>
      <h3>Volunteers Only</h3>
      <p>Only volunteers can register new animals.</p>
      <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => onNavigate('/')}>← Back</button>
    </div>
  );

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setL = (k, v) => setForm(f => ({ ...f, loc: { ...f.loc, [k]: v } }));
  const setM = (k, v) => setForm(f => ({ ...f, med: { ...f.med, [k]: v } }));

  const getMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => { setL('latitude', pos.coords.latitude.toFixed(6)); setL('longitude', pos.coords.longitude.toFixed(6)); },
      ()  => setError('Could not get location. Enter manually.')
    );
  };

  const submit = async e => {
    e.preventDefault();
    setBusy(true); setError(''); setResult(null);
    try {
      const mp = { isNeutered: form.med.isNeutered };
      if (form.med.neuterDate) mp.neuterDate         = form.med.neuterDate;
      if (form.med.rabiesDate) mp.rabiesVaccinations = [{ date: form.med.rabiesDate }];
      if (form.med.dewormDate) mp.dewormingDates      = [{ date: form.med.dewormDate }];
      if (form.med.note)       mp.medicalLogs         = [{ note: form.med.note, date: new Date() }];

      const loc = {};
      if (form.loc.latitude)    loc.latitude    = parseFloat(form.loc.latitude);
      if (form.loc.longitude)   loc.longitude   = parseFloat(form.loc.longitude);
      if (form.loc.addressText) loc.addressText = form.loc.addressText;

      const res = await axios.post(`${API}/animals`, {
        name: form.name, species: form.species, breed: form.breed,
        age: form.age, gender: form.gender, status: form.status,
        isEmergency: form.isEmergency,
        lastSeenLocation: loc, medicalProfile: mp,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setResult(res.data.data);
      setForm(blank);
      setAiFilled(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally { setBusy(false); }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Register Animal</h2>
          <p>Add a new stray animal to the management system</p>
        </div>
      </div>

      {/* AI Auto-fill Notice */}
      {aiFilled && (
        <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#3730A3', borderRadius: 'var(--r-lg)', padding: '12px 16px', marginBottom: 20, fontSize: 14 }}>
          ✨ <strong>Auto-filled with Gemini AI Data!</strong> Please review and adjust the details as needed.
        </div>
      )}

      {/* Success */}
      {result && (
        <div style={{ background: 'var(--adopted-light)', border: '1px solid var(--adopted-border)', borderRadius: 'var(--r-lg)', padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: 'var(--adopted)', fontSize: 15, marginBottom: 6 }}>✅ Animal Registered Successfully</p>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 12 }}>
              <strong>{result.name}</strong> — ID: <code style={{ background: 'var(--green-50)', color: 'var(--green-700)', padding: '1px 6px', borderRadius: 4 }}>{result.animalId}</code>
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary btn-sm" onClick={() => onNavigate(`/animal/${result.animalId}`)}>View Profile</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setResult(null)}>Register Another</button>
            </div>
          </div>
          {result.qrCodeUrl && (
            <img src={result.qrCodeUrl} alt="QR" style={{ width: 88, height: 88, borderRadius: 10, border: '1px solid var(--border)' }} />
          )}
        </div>
      )}

      {error && <div className="notice danger" style={{ marginBottom: 20 }}>❌ {error}</div>}

      <form onSubmit={submit}>
        {/* Basic info */}
        <div className="form-section" style={{ marginBottom: 16 }}>
          <div className="form-section-header">🐾 Basic Information</div>
          <div className="form-section-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Name / Identifier *</label>
                <input className="form-input" type="text" placeholder="e.g. Buddy, Tom" value={form.name} onChange={e => setF('name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Species *</label>
                <select className="form-select" value={form.species} onChange={e => setF('species', e.target.value)}>
                  <option value="Dog">🐶 Dog</option>
                  <option value="Cat">🐱 Cat</option>
                  <option value="Other">🐾 Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Breed</label>
                <input className="form-input" type="text" placeholder="e.g. Labrador" value={form.breed} onChange={e => setF('breed', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Age</label>
                <input className="form-input" type="text" placeholder="e.g. 2 years" value={form.age} onChange={e => setF('age', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" value={form.gender} onChange={e => setF('gender', e.target.value)}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setF('status', e.target.value)}>
                  <option value="Stray">🐾 Stray</option>
                  <option value="Rescued">🏥 Rescued</option>
                  <option value="Under Treatment">💊 Under Treatment</option>
                  <option value="Adopted">🏡 Adopted</option>
                </select>
              </div>
              <div className="form-full">
                <div
                  className="check-row"
                  style={form.isEmergency ? { borderColor: 'var(--sos-border)', background: 'var(--sos-light)' } : {}}
                >
                  <input type="checkbox" id="sos" checked={form.isEmergency} onChange={e => setF('isEmergency', e.target.checked)} />
                  <label htmlFor="sos" style={{ color: form.isEmergency ? 'var(--sos)' : undefined }}>
                    🚨 Mark as Emergency SOS — Urgent rescue required
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="form-section" style={{ marginBottom: 16 }}>
          <div className="form-section-header" style={{ justifyContent: 'space-between' }}>
            <span>📍 Last Seen Location</span>
            <button type="button" className="btn btn-ghost btn-xs" onClick={getMyLocation}>📡 Use My Location</button>
          </div>
          <div className="form-section-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input className="form-input" type="number" step="any" placeholder="6.9271" value={form.loc.latitude} onChange={e => setL('latitude', e.target.value)} style={{ fontFamily: 'monospace' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input className="form-input" type="number" step="any" placeholder="79.8612" value={form.loc.longitude} onChange={e => setL('longitude', e.target.value)} style={{ fontFamily: 'monospace' }} />
              </div>
              <div className="form-group form-full">
                <label className="form-label">Address / Landmark</label>
                <input className="form-input" type="text" placeholder="e.g. Near City Park, Main Street" value={form.loc.addressText} onChange={e => setL('addressText', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Medical */}
        <div className="form-section" style={{ marginBottom: 24 }}>
          <div className="form-section-header">🏥 Initial Medical Profile <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>(optional)</span></div>
          <div className="form-section-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">💉 Rabies Vaccination Date</label>
                <input className="form-input" type="date" value={form.med.rabiesDate} onChange={e => setM('rabiesDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">🪱 Deworming Date</label>
                <input className="form-input" type="date" value={form.med.dewormDate} onChange={e => setM('dewormDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">✂ Sterilization</label>
                <div className="check-row" style={{ marginBottom: 8 }}>
                  <input type="checkbox" id="neuter" checked={form.med.isNeutered} onChange={e => setM('isNeutered', e.target.checked)} />
                  <label htmlFor="neuter">Neutered / Spayed</label>
                </div>
                {form.med.isNeutered && (
                  <input className="form-input" type="date" value={form.med.neuterDate} onChange={e => setM('neuterDate', e.target.value)} />
                )}
              </div>
              <div className="form-group">
                <label className="form-label">📋 Initial Medical Note</label>
                <textarea className="form-textarea" placeholder="Any observations, injuries…" value={form.med.note} onChange={e => setM('note', e.target.value)} rows={4} />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? '⏳ Registering…' : 'Register Animal'}
        </button>
      </form>
    </>
  );
};

export default RegisterAnimal;