import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const STATUS_BADGE = {
  Stray: 'badge-stray', Rescued: 'badge-rescued',
  Adopted: 'badge-adopted', 'Under Treatment': 'badge-treatment',
};

const QRScanner = ({ onNavigate }) => {
  const [manualId, setManualId]   = useState('');
  const [animal, setAnimal]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [scanning, setScanning]   = useState(false);
  const html5QrRef                = useRef(null);

  const lookup = async (id) => {
    const trimmed = id.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true); setError(''); setAnimal(null);
    try {
      const res = await axios.get(`${API}/animals/${trimmed}`);
      setAnimal(res.data.data);
    } catch {
      setError(`No animal found with ID: "${trimmed}"`);
    } finally { setLoading(false); }
  };

  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      setScanning(true); setError('');
      html5QrRef.current = new Html5Qrcode('qr-reader');
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => { stopScanner(); setManualId(decoded); lookup(decoded); },
        () => {}
      );
    } catch {
      setError('Camera access denied or unavailable. Use manual search below.');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop(); html5QrRef.current.clear(); } catch {}
      html5QrRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => () => { stopScanner(); }, []);

  const mp = animal?.medicalProfile;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h2>QR Scanner</h2>
          <p>Scan an animal's QR tag or enter its ID manually</p>
        </div>
      </div>

      {/* Camera scanner */}
      <div className="card" style={{ marginBottom: 18, textAlign: 'center' }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>📸 Camera Scanner</p>

        <div
          id="qr-reader"
          className={`qr-reader-box${scanning ? ' active' : ''}`}
          style={{ minHeight: scanning ? 300 : 0, transition: 'min-height .3s ease' }}
        />

        {!scanning ? (
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={startScanner}>
            Start Camera
          </button>
        ) : (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--green-700)', marginBottom: 10, fontWeight: 500 }}>
              🟢 Scanning — point at QR code
            </p>
            <button className="btn btn-ghost btn-sm" onClick={stopScanner}>Stop</button>
          </div>
        )}
      </div>

      {/* Manual search */}
      <div className="card" style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>🔍 Manual Search</p>
        <form onSubmit={e => { e.preventDefault(); lookup(manualId); }} style={{ display: 'flex', gap: 10 }}>
          <input
            className="form-input"
            type="text"
            placeholder="Animal ID e.g. ST-4589"
            value={manualId}
            onChange={e => setManualId(e.target.value.toUpperCase())}
            style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '.05em' }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !manualId.trim()}>
            {loading ? '⏳' : 'Search'}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && <div className="notice danger">{error}</div>}

      {/* Loading */}
      {loading && <div className="loading-container"><div className="spinner" /></div>}

      {/* Result */}
      {animal && (
        <div className="card" style={{ animation: 'slide-up .22s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
                  {animal.species === 'Dog' ? '🐶' : animal.species === 'Cat' ? '🐱' : '🐾'} {animal.name}
                </span>
                {animal.isEmergency && <span className="badge badge-sos">🚨 SOS</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <code style={{ fontSize: 11, background: 'var(--green-50)', color: 'var(--green-700)', border: '1px solid var(--green-100)', borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>
                  {animal.animalId}
                </code>
                <span className={`badge ${STATUS_BADGE[animal.status] || 'badge-stray'}`}>{animal.status}</span>
                {mp?.isNeutered && <span className="badge badge-vaccinated">✂ Neutered</span>}
                {mp?.rabiesVaccinations?.length > 0 && <span className="badge badge-vaccinated">💉 Vaccinated</span>}
              </div>
            </div>
            {animal.qrCodeUrl && (
              <img src={animal.qrCodeUrl} alt="QR" style={{ width: 72, height: 72, borderRadius: 8, border: '1px solid var(--border)', flexShrink: 0 }} />
            )}
          </div>

          {/* Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginBottom: 14 }}>
            {[['Species', animal.species], ['Breed', animal.breed || 'Unknown'], ['Age', animal.age || 'Unknown'], ['Gender', animal.gender]].map(([k, v]) => (
              <div key={k} className="info-row"><span className="info-label">{k}</span><span className="info-value">{v}</span></div>
            ))}
          </div>

          {/* Medical summary */}
          <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 'var(--r-sm)', marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>💉 Rabies: <strong>{mp?.rabiesVaccinations?.length || 0}</strong></span>
            <span>🪱 Deworming: <strong>{mp?.dewormingDates?.length || 0}</strong></span>
            <span>✂ Neutered: <strong>{mp?.isNeutered ? 'Yes' : 'No'}</strong></span>
          </div>

          {animal.lastSeenLocation?.addressText && (
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 14 }}>📍 {animal.lastSeenLocation.addressText}</p>
          )}

          <button className="btn btn-primary btn-full" onClick={() => onNavigate(`/animal/${animal.animalId}`)}>
            View Full Profile →
          </button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
