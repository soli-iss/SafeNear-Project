import React, { useState, useEffect } from 'react';
import LoginForm from './Login';
import Dashboard from './Dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Browser check logic
  const checkBrowserSupport = () => {
    const ua = navigator.userAgent;
    const vendor = navigator.vendor;
    const isFirefox = /Firefox/.test(ua);
    const isChrome = /Chrome/.test(ua) && /Google Inc/.test(vendor) && !/Edg|OPR|Brave/.test(ua);
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
    return (isFirefox || isChrome) && !isMobile;
  };

  const isSupported = checkBrowserSupport();

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('shelter_user');
    const storedToken = localStorage.getItem('shelter_token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (err) {
        localStorage.removeItem('shelter_user');
        localStorage.removeItem('shelter_token');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (data) => {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('shelter_user', JSON.stringify(data.user));
    localStorage.setItem('shelter_token', data.token);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('shelter_user');
    localStorage.removeItem('shelter_token');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader-spinner"></div>
        <p>Restoring session...</p>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="login-container">
        <div className="login-form" style={{textAlign: 'center'}}>
          <h1 style={{fontSize: '24px', color: '#ef4444'}}>Browser Not Supported</h1>
          <p style={{color: '#94a3b8', marginTop: '16px'}}>
            For security and compatibility reasons, SafeNear only supports Desktop Google Chrome and Mozilla Firefox. Mobile devices and other browsers are strictly prohibited.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      {!token ? (
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Dashboard user={user} token={token} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
