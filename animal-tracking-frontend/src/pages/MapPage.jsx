import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const pinColor = (status, isEmergency) => {
  if (isEmergency) return '#dc2626';
  return ({ Adopted: '#16a34a', Rescued: '#d97706', 'Under Treatment': '#7c3aed' })[status] || '#64748b';
};

const MapPage = ({ onNavigate }) => {
  const [animals, setAnimals]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const mapRef     = React.useRef(null);
  const leafletRef = React.useRef(null);

  const withLoc = animals.filter(a => a.lastSeenLocation?.latitude && a.lastSeenLocation?.longitude);

  const fetchAnimals = useCallback(async () => {
    try { const res = await axios.get(`${API}/animals`); setAnimals(res.data.data || []); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAnimals(); }, [fetchAnimals]);

  useEffect(() => {
    if (loading || mapReady || withLoc.length === 0) return;
    (async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');
        leafletRef.current = L;

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl:        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl:      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        const el = document.getElementById('leaflet-map');
        if (!el || el._leaflet_id) return;

        const first = withLoc[0];
        const map = L.map('leaflet-map').setView([first.lastSeenLocation.latitude, first.lastSeenLocation.longitude], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        withLoc.forEach(animal => {
          const color = pinColor(animal.status, animal.isEmergency);
          const icon  = L.divIcon({
            html: `<div style="width:34px;height:34px;background:${color};border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 6px rgba(0,0,0,.25);">
              ${animal.species === 'Dog' ? '🐶' : animal.species === 'Cat' ? '🐱' : '🐾'}
            </div>`,
            className: '', iconSize: [34, 34], iconAnchor: [17, 17]
          });
          L.marker([animal.lastSeenLocation.latitude, animal.lastSeenLocation.longitude], { icon })
            .addTo(map)
            .bindPopup(`<b>${animal.name}</b><br/><small style="color:#64748b">${animal.animalId}</small><br/>${animal.status}${animal.isEmergency ? '<br/><span style="color:#dc2626;font-weight:700">🚨 Emergency</span>' : ''}`);
        });

        mapRef.current = map;
        setMapReady(true);
      } catch (err) { console.error(err); }
    })();
  }, [loading, withLoc, mapReady]);

  /* Hotspot aggregation */
  const hotspots = withLoc.reduce((acc, a) => {
    const key = `${Math.round(a.lastSeenLocation.latitude * 100) / 100},${Math.round(a.lastSeenLocation.longitude * 100) / 100}`;
    if (!acc[key]) acc[key] = { lat: a.lastSeenLocation.latitude, lng: a.lastSeenLocation.longitude, count: 0, address: a.lastSeenLocation.addressText || 'Unknown area' };
    acc[key].count++;
    return acc;
  }, {});
  const topHotspots = Object.values(hotspots).sort((a, b) => b.count - a.count).slice(0, 5);

  const stats = {
    mapped: withLoc.length,
    sos:    withLoc.filter(a => a.isEmergency).length,
    areas:  Object.keys(hotspots).length,
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Hotspot Map</h2>
          <p>Geographic distribution of registered stray animals</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 22 }}>
        {[
          { icon: '📍', value: stats.mapped, label: 'On Map',         color: 'var(--green-600)' },
          { icon: '🚨', value: stats.sos,    label: 'SOS Alerts',     color: 'var(--sos)' },
          { icon: '🗺️', value: stats.areas,  label: 'Distinct Areas', color: 'var(--rescued)' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /><p>Loading map…</p></div>
      ) : withLoc.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🗺️</div>
            <h3>No location data yet</h3>
            <p>Register animals with latitude & longitude to see them on the map.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onNavigate('/register')}>+ Register Animal</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18 }}>
          {/* Map */}
          <div className="map-container">
            <div id="leaflet-map" style={{ width: '100%', height: '100%' }} />
          </div>

          {/* Sidebar panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Legend */}
            <div className="card">
              <p className="section-title">Legend</p>
              {[
                { color: '#dc2626', label: '🚨 Emergency SOS' },
                { color: '#d97706', label: '🏥 Rescued' },
                { color: '#16a34a', label: '🏡 Adopted' },
                { color: '#7c3aed', label: '💊 Under Treatment' },
                { color: '#64748b', label: '🐾 Stray' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                  {l.label}
                </div>
              ))}
            </div>

            {/* Top hotspots */}
            <div className="card" style={{ flex: 1 }}>
              <p className="section-title">High-Density Areas</p>
              {topHotspots.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No data</p>
              ) : topHotspots.map((h, i) => (
                <div key={i} className="hotspot-rank">
                  <div className={`hotspot-rank-number ${i === 0 ? 'top' : 'normal'}`}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="hotspot-rank-label">{h.address}</div>
                    <div className="hotspot-rank-count">{h.count} animal{h.count > 1 ? 's' : ''} reported</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick list */}
            <div className="card" style={{ maxHeight: 240, overflowY: 'auto' }}>
              <p className="section-title">Animals on Map</p>
              {withLoc.map(a => (
                <button
                  key={a._id}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '7px 6px', background: 'none', border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer', textAlign: 'left', marginBottom: 2, transition: 'background var(--t-fast)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--green-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  onClick={() => mapRef.current?.setView([a.lastSeenLocation.latitude, a.lastSeenLocation.longitude], 16)}
                >
                  <span style={{ fontSize: 18 }}>{a.species === 'Dog' ? '🐶' : a.species === 'Cat' ? '🐱' : '🐾'}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.animalId} · {a.status}</p>
                  </div>
                  {a.isEmergency && <span style={{ marginLeft: 'auto', fontSize: 14 }}>🚨</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MapPage;
