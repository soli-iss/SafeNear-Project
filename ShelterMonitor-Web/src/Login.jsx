import React, { useState } from 'react';

function LoginForm({ onLoginSuccess }) {
  const [role, setRole] = useState('resident'); // ברירת מחדל: תושב
  const [username, setUsername] = useState(''); // שם משתמש לעירייה
  const [adminCode, setAdminCode] = useState(''); // סיסמה לעירייה
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    if (role === 'resident') {
      console.log("Logging in as Resident...");
      const residentSession = {
        token: 'dummy-resident-token-12345', 
        user: { 
          username: 'תושב העיר  🏠', 
          admin: false 
        }
      };
      onLoginSuccess(residentSession);
    } else {
      // כניסת עירייה - שולח את שם המשתמש והסיסמה שהוקלדו בפועל!
      try {
        const response = await fetch('http://localhost:8086/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username, password: adminCode }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'שם משתמש או סיסמה שגויים');
        onLoginSuccess(data);
      } catch (err) {
        setError(err.message);
      }
    }
    setProcessing(false);
  };

  return (
    <div className="login-container" style={{ direction: 'rtl' }}>
      <form onSubmit={onSubmit} className="login-form" style={{ padding: '40px 30px' }}>
        <div className="login-header" style={{ marginBottom: '30px', textAlign: 'center' }}>
          <div className="app-logo" style={{ fontSize: '52px', marginBottom: '12px' }}>🏠</div>
          <h1 style={{ 
            fontSize: '42px', 
            fontWeight: 'bold', 
            color: '#4caf50', 
            margin: '0',
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '-1px'
          }}>SafeNear</h1>
          <p style={{ 
            fontSize: '16px', 
            color: '#64748b', 
            marginTop: '4px',
            fontWeight: '500'
          }}>מצא מקלט קרוב אליך</p>
        </div>

        {error && (
          <div className="login-error" style={{ 
            color: '#ef4444', 
            backgroundColor: '#fef2f2',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '15px',
            fontSize: '14px',
            textAlign: 'center',
            border: '1px solid #fee2e2'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* בחירת סוג משתמש */}
        <div className="input-group" style={{ marginBottom: '20px' }}>
          <label style={{ color: '#475569', fontSize: '15px', fontWeight: 'bold' }}>סוג משתמש</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="form-select">
            <option value="resident">תושב העיר  🏠</option>
            <option value="admin">צוות עירייה 🛠️</option>
          </select>
        </div>

        {/* שדות התחברות שמופיעים רק אם נבחר עירייה */}
        {role === 'admin' && (
          <div style={{ 
            marginBottom: '20px', 
            backgroundColor: 'rgba(76, 175, 80, 0.07)', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {/* שדה שם משתמש */}
            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ color: '#285c2a', fontSize: '14px', fontWeight: 'bold' }}>שם משתמש</label>
              <input
                type="text"
                required
                placeholder="הזן שם משתמש (למשל: admin)"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={processing}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-secondary)',                   
                  color: 'var(--text-main)',
                  fontSize: '14px',
                  textAlign: 'center',
                  outline: 'none'
                }}
              />
            </div>

            {/* שדה סיסמה */}
            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ color: '#285c2a', fontSize: '14px', fontWeight: 'bold' }}>סיסמה</label>
              <input
                type="password"
                required
                placeholder="הזן סיסמה"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                disabled={processing}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-secondary)',                   
                  color: 'var(--text-main)',
                  fontSize: '14px',
                  textAlign: 'center',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        )}

        <button 
          type="submit" 
          className="login-button" 
          disabled={processing}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#ffffff',
            backgroundColor: '#4caf50', 
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            marginTop: '10px'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#43a047'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
        >
          {processing ? 'בודק...' : 'כניסה'}
        </button>
      </form>
    </div>
  );
}

export default LoginForm;