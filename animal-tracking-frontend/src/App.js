import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AnimalProfile from './pages/AnimalProfile';
import QRScanner from './pages/QRScanner';
import MapPage from './pages/MapPage';
import RegisterAnimal from './pages/RegisterAnimal';
import AdoptionRequests from './pages/AdoptionRequests';
import AnimalAIIdentifier from './components/AnimalAIIdentifier';
import './index.css';

// Simple client-side router without react-router-dom
const parseRoute = (path) => {
  if (path.startsWith('/animal/')) {
    return { page: 'animal', animalId: path.replace('/animal/', '') };
  }
  const routes = {
    '/': 'dashboard',
    '/scanner': 'scanner',
    '/map': 'map',
    '/register': 'register',
    '/adoptions': 'adoptions',
    '/ai': 'ai',
    '/auth': 'auth',
  };
  return { page: routes[path] || 'dashboard' };
};

const PAGE_TITLES = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of all registered stray animals' },
  scanner: { title: 'QR Scanner', subtitle: 'Scan or search an animal by ID' },
  map: { title: 'Hotspot Map', subtitle: 'Geographic distribution of stray animals' },
  register: { title: 'Register Animal', subtitle: 'Add a new stray to the system' },
  adoptions: { title: 'Adoption Requests', subtitle: 'Manage incoming adoption applications' },
  animal: { title: 'Animal Profile', subtitle: 'Full profile, medical history & QR code' },
  ai: { title: 'AI Identification', subtitle: 'Identify animal species & health status using Gemini AI' },
  auth: { title: 'Sign In', subtitle: 'Access your PawTrack account' },
};

const AppInner = () => {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState('/');

  const navigate = (path) => setCurrentPath(path);

  const route = parseRoute(currentPath);

  // Show auth page when not logged in and not on a public page
  const publicPages = ['dashboard', 'scanner', 'animal', 'ai'];
  const requiresAuth = !publicPages.includes(route.page);

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        <p>Loading PawTrack...</p>
      </div>
    );
  }

  // Auth page renders full-screen without sidebar
  if (route.page === 'auth' || (!user && requiresAuth)) {
    return <AuthPage onNavigate={navigate} />;
  }

  const pageInfo = PAGE_TITLES[route.page] || PAGE_TITLES.dashboard;

  return (
    <div className="app-shell">
      <Sidebar currentPath={currentPath} onNavigate={navigate} />

      <div className="main-content">
        {/* Top Bar */}
        <div className="topbar">
          <div className="topbar-title">
            <h1>{pageInfo.title}</h1>
            <p>{pageInfo.subtitle}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!user && (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/auth')}>
                🔑 Sign In
              </button>
            )}
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge ${user.role === 'volunteer' ? 'badge-volunteer' : 'badge-public'}`}>
                  {user.role === 'volunteer' ? '🤝' : '🌍'} {user.role}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Page Content */}
        <main className="page-content">
          {route.page === 'dashboard' && <Dashboard onNavigate={navigate} />}
          {route.page === 'animal' && <AnimalProfile animalId={route.animalId} onNavigate={navigate} />}
          {route.page === 'scanner' && <QRScanner onNavigate={navigate} />}
          {route.page === 'map' && <MapPage onNavigate={navigate} />}
          {route.page === 'register' && <RegisterAnimal onNavigate={navigate} />}
          {route.page === 'adoptions' && <AdoptionRequests onNavigate={navigate} />}
          {route.page === 'ai' && <AnimalAIIdentifier onNavigate={navigate} />}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;