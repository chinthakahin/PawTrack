import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = 'https://pawtrack-backend.vercel.app/api';

const AuthPage = ({ onNavigate }) => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'public' });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        const res = await axios.post(`${API}/auth/login`, { email: form.email, password: form.password });
        login(res.data.user, res.data.token);
        onNavigate('/');
      } else {
        const res = await axios.post(`${API}/auth/register`, form);
        login(res.data.user, res.data.token);
        onNavigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => { setIsLogin(!isLogin); setError(''); };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🐾</div>
          <h1>PawTrack</h1>
          <p>Stray Animal Management System</p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab${isLogin ? ' active' : ''}`} onClick={() => { setIsLogin(true); setError(''); }}>Sign In</button>
          <button className={`auth-tab${!isLogin ? ' active' : ''}`} onClick={() => { setIsLogin(false); setError(''); }}>Register</button>
        </div>

        {/* Error */}
        {error && <div className="notice danger" style={{ marginBottom: 18 }}>⚠️ {error}</div>}

        {/* Form */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" name="name" placeholder="Your full name" value={form.name} onChange={handle} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" name="password" placeholder="Min. 6 characters" value={form.password} onChange={handle} required minLength={6} />
          </div>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <select className="form-select" name="role" value={form.role} onChange={handle}>
                <option value="public">🌍 Public / Citizen</option>
                <option value="volunteer">🤝 Volunteer / Rescuer</option>
              </select>
            </div>
          )}
          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? '⏳ Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span onClick={switchMode} style={{ color: 'var(--green-700)', fontWeight: 600, cursor: 'pointer' }}>
            {isLogin ? 'Register' : 'Sign in'}
          </span>
        </p>

        {/* Access info */}
        <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--bg)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 4 }}>Access Levels</strong>
          🌍 <strong>Public</strong> — Browse animals, scan QR, submit adoptions<br />
          🤝 <strong>Volunteer</strong> — All above + register, manage SOS, medical records, approve adoptions
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
