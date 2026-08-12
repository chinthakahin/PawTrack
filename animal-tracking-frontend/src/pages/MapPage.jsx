import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API = 'https://pawtrack-backend.vercel.app/api';

const pinColor = (status, isEmergency) => {
  if (isEmergency) return '#dc2626';
  return ({ Adopted: '#16a34a', Rescued: '#d97706', 'Under Treatment': '#7c3aed' })[status] || '#64748b';
};

const MapPage = ({ onNavigate }) => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersMapRef = useRef({}); // Store markers by animalId for quick access

  const withLoc = animals.filter(a => a.lastSeenLocation?.latitude && a.lastSeenLocation?.longitude);

  const fetchAnimals = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/animals`);
      setAnimals(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch animals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  // Initialize and Update Leaflet Map
  useEffect(() => {
    if (loading || withLoc.length === 0 || !mapContainerRef.current) return;

    // Destroy existing map instance on re-render to prevent duplicate container errors
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const first = withLoc[0];
    const map = L.map(mapContainerRef.current).setView(
      [first.lastSeenLocation.latitude, first.lastSeenLocation.longitude],
      13
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapInstanceRef.current = map;
    markersMapRef.current = {};

    const bounds = [];

    withLoc.forEach(animal => {
      const { latitude, longitude, addressText } = animal.lastSeenLocation;
      const color = pinColor(animal.status, animal.isEmergency);

      const icon = L.divIcon({
        html: `<div style="width:34px;height:34px;background:${color};border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 6px rgba(0,0,0,.3);cursor:pointer;">
          ${animal.species === 'Dog' ? '🐶' : animal.species === 'Cat' ? '🐱' : '🐾'}
        </div>`,
        className: '',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const popupHtml = `
        <div style="font-family: sans-serif; padding: 2px; min-width: 160px;">
          <h4 style="margin: 0 0 4px 0; font-size: 15px; color: #0f172a;">
            ${animal.species === 'Dog' ? '🐶' : animal.species === 'Cat' ? '🐱' : '🐾'} ${animal.name}
          </h4>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">ID: <code>${animal.animalId}</code></p>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #334155;">
            Status: <strong>${animal.status}</strong>
          </p>
          ${animal.isEmergency ? '<div style="color:#dc2626; font-weight:700; font-size:12px; margin-bottom:6px;">🚨 Emergency SOS</div>' : ''}
          ${addressText ? `<p style="margin: 0 0 8px 0; font-size: 11px; color: #64748b;">📍 ${addressText}</p>` : ''}
          <button id="btn-map-view-${animal.animalId}" style="background:#4F46E5; color:#fff; border:none; padding:6px 10px; border-radius:4px; font-size:12px; font-weight:600; width:100%; cursor:pointer;">
            View Profile →
          </button>
        </div>
      `;

      const marker = L.marker([latitude, longitude], { icon })
        .addTo(map)
        .bindPopup(popupHtml);

      // Attach click listener to Popup button on open
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-map-view-${animal.animalId}`);
        if (btn) {
          btn.onclick = () => {
            if (onNavigate) onNavigate(`/animal/${animal.animalId}`);
          };
        }
      });

      markersMapRef.current[animal.animalId] = marker;
      bounds.push([latitude, longitude]);
    });

    // Fit map view to fit all markers
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading, animals]);

  // Click handler for sidebar list items
  const handleSelectAnimal = (animal) => {
    const map = mapInstanceRef.current;
    const marker = markersMapRef.current[animal.animalId];

    if (map && animal.lastSeenLocation) {
      map.flyTo([animal.lastSeenLocation.latitude, animal.lastSeenLocation.longitude], 16, {
        duration: 1.2
      });
      if (marker) {
        setTimeout(() => marker.openPopup(), 1200);
      }
    }
  };

  /* Hotspot aggregation */
  const hotspots = withLoc.reduce((acc, a) => {
    const key = `${Math.round(a.lastSeenLocation.latitude * 100) / 100},${Math.round(a.lastSeenLocation.longitude * 100) / 100}`;
    if (!acc[key]) {
      acc[key] = {
        lat: a.lastSeenLocation.latitude,
        lng: a.lastSeenLocation.longitude,
        count: 0,
        address: a.lastSeenLocation.addressText || 'Unknown area'
      };
    }
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
          { icon: '📍', value: stats.mapped, label: 'On Map',        color: 'var(--green-600)' },
          { icon: '🚨', value: stats.sos,    label: 'SOS Alerts',    color: 'var(--sos)' },
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
          {/* Map Container */}
          <div className="map-container" style={{ minHeight: '520px', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '520px' }} />
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
            <div className="card">
              <p className="section-title">High-Density Areas</p>
              {topHotspots.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No data</p>
              ) : topHotspots.map((h, i) => (
                <div
                  key={i}
                  className="hotspot-rank"
                  style={{ cursor: 'pointer' }}
                  onClick={() => mapInstanceRef.current?.flyTo([h.lat, h.lng], 15)}
                >
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
                  key={a._id || a.animalId}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '7px 6px', background: 'none', border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer', textAlign: 'left', marginBottom: 2, transition: 'background var(--t-fast)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--green-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  onClick={() => handleSelectAnimal(a)}
                >
                  <span style={{ fontSize: 18 }}>{a.species === 'Dog' ? '🐶' : a.species === 'Cat' ? '🐱' : '🐾'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{a.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{a.animalId} · {a.status}</p>
                  </div>
                  {a.isEmergency && <span style={{ fontSize: 14 }}>🚨</span>}
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