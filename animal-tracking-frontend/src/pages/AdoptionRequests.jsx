import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

const STATUS_STYLE = {
  Pending:  { badge: 'badge-stray',    accent: 'var(--stray)' },
  Approved: { badge: 'badge-adopted',  accent: 'var(--adopted)' },
  Rejected: { badge: 'badge-sos',      accent: 'var(--sos)' },
};

const AdoptionRequests = ({ onNavigate }) => {
  const { token, isVolunteer } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');
  const [notes, setNotes]       = useState({});
  const [busy, setBusy]         = useState({});
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRequests = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/adoptions`, { headers: { Authorization: `Bearer ${token}` } });
      setRequests(res.data.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    if (isVolunteer) fetchRequests();
    else setLoading(false);
  }, [isVolunteer, fetchRequests]);

  if (!isVolunteer) return (
    <div className="empty-state">
      <div className="empty-state-icon">🔒</div>
      <h3>Volunteers Only</h3>
      <p>Only volunteers can manage adoption requests.</p>
      <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => onNavigate('/')}>← Back</button>
    </div>
  );

  const handleStatus = async (id, status) => {
    setBusy(b => ({ ...b, [id]: true }));
    try {
      await axios.put(`${API}/adoptions/${id}`, { status, reviewNotes: notes[id] || '' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(status === 'Approved' ? '✅ Request approved' : '❌ Request rejected');
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.error || 'Update failed', 'error');
    } finally {
      setBusy(b => ({ ...b, [id]: false }));
    }
  };

  const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];
  const stats = {
    all:      requests.length,
    pending:  requests.filter(r => r.status === 'Pending').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    rejected: requests.filter(r => r.status === 'Rejected').length,
  };

  const filtered = requests.filter(r => filter === 'All' || r.status === filter);

  return (
    <>
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h2>Adoption Requests</h2>
          <p>Review and manage incoming adoption and foster applications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 22 }}>
        {[
          { icon: '📋', value: stats.all,      label: 'Total',    color: 'var(--green-600)' },
          { icon: '⏳', value: stats.pending,  label: 'Pending',  color: 'var(--rescued)' },
          { icon: '✅', value: stats.approved, label: 'Approved', color: 'var(--adopted)' },
          { icon: '❌', value: stats.rejected, label: 'Rejected', color: 'var(--sos)' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="filter-bar" style={{ marginBottom: 22 }}>
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-chip${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f} {f !== 'All' && <span style={{ opacity: .7 }}>({stats[f.toLowerCase()]})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /><p>Loading…</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No {filter !== 'All' ? filter.toLowerCase() : ''} requests</h3>
          <p>Adoption requests from public users will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(req => {
            const s   = STATUS_STYLE[req.status] || STATUS_STYLE.Pending;
            const ani = req.animalId;
            return (
              <div
                key={req._id}
                className="request-card"
                style={req.status === 'Approved' ? { borderLeftWidth: 3, borderLeftColor: 'var(--adopted-border)', borderLeftStyle: 'solid' } :
                       req.status === 'Rejected' ? { borderLeftWidth: 3, borderLeftColor: 'var(--sos-border)',     borderLeftStyle: 'solid' } : {}}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                        {req.requestType === 'Foster' ? '🤲' : '🏡'} {req.requestType} Application
                      </span>
                      <span className={`badge ${s.badge}`}>{req.status}</span>
                    </div>
                    {ani ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--green-50)', border: '1px solid var(--green-100)', borderRadius: 'var(--r-full)', fontSize: 12.5 }}>
                        <span>{ani.species === 'Dog' ? '🐶' : ani.species === 'Cat' ? '🐱' : '🐾'}</span>
                        <strong style={{ color: 'var(--green-700)' }}>{ani.name}</strong>
                        <code style={{ color: 'var(--text-muted)', fontSize: 11 }}>{ani.animalId}</code>
                      </div>
                    ) : (
                      <code style={{ fontSize: 12, color: 'var(--text-muted)' }}>{req.animalDisplayId}</code>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Applicant info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '4px 16px', marginBottom: 14 }}>
                  {[
                    ['👤 Name',  req.applicantName],
                    ['📧 Email', req.applicantEmail],
                    ['📞 Phone', req.applicantPhone || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="info-row">
                      <span className="info-label">{k}</span>
                      <span className="info-value" style={{ wordBreak: 'break-all' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Message */}
                {req.message && (
                  <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--r-sm)', marginBottom: 14, borderLeft: '3px solid var(--green-500)' }}>
                    <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 2, fontWeight: 600 }}>Message</p>
                    <p style={{ fontSize: 13.5, color: 'var(--text)', fontStyle: 'italic' }}>"{req.message}"</p>
                  </div>
                )}

                {/* Review note (if resolved) */}
                {req.reviewNotes && (
                  <div style={{ padding: '8px 12px', background: req.status === 'Approved' ? 'var(--adopted-light)' : 'var(--sos-light)', borderRadius: 'var(--r-sm)', marginBottom: 14, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <strong>Review note:</strong> {req.reviewNotes}
                  </div>
                )}

                {/* Action buttons — only Pending */}
                {req.status === 'Pending' && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: 180 }}>
                      <label className="form-label">Review note (optional)</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="e.g. Approved — suitable home"
                        value={notes[req._id] || ''}
                        onChange={e => setNotes(n => ({ ...n, [req._id]: e.target.value }))}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-success"
                        disabled={busy[req._id]}
                        onClick={() => handleStatus(req._id, 'Approved')}
                      >
                        {busy[req._id] ? '⏳' : '✅ Approve'}
                      </button>
                      <button
                        className="btn btn-danger"
                        disabled={busy[req._id]}
                        onClick={() => handleStatus(req._id, 'Rejected')}
                      >
                        {busy[req._id] ? '⏳' : 'Reject'}
                      </button>
                      {ani?.animalId && (
                        <button className="btn btn-ghost" onClick={() => onNavigate(`/animal/${ani.animalId}`)}>
                          View Animal
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default AdoptionRequests;
