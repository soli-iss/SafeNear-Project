import React, { useState, useEffect } from 'react';

function Dashboard({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [shelters, setShelters] = useState([]);
  const [maps, setMaps] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal States
  const [showShelterModal, setShowShelterModal] = useState(false);
  const [editingShelter, setEditingShelter] = useState(null);
  const [shelterForm, setShelterForm] = useState({ 
    name: '', 
    open: false, 
    location: '', 
    mapID: '', 
    x: null, 
    y: null, 
    capacity: '', 
    has_wifi: false 
  });

  const [showMapModal, setShowMapModal] = useState(false);
  const [editingMap, setEditingMap] = useState(null);
  const [mapForm, setMapForm] = useState({ name: '', path: '', mapFile: null });
  const [selectedMap, setSelectedMap] = useState(null);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', admin: true });

  // For adding shelter from map coordinates
  const [addingShelterCoords, setAddingShelterCoords] = useState(null);
  const [isRelocating, setIsRelocating] = useState(false);

  // State לשמירת המקלט שהבלון שלו פתוח כעת במפה
  const [activePopupShelterId, setActivePopupShelterId] = useState(null);

  const isAdmin = user && (user.admin === 1 || user.admin === true);
  
  // זיהוי האם המשתמש הנוכחי שמחובר הוא ה-admin הראשי האולטימטיבי
  const isSuperAdmin = user && user.username === 'admin';

  const fetchWithAuth = async (url, options = {}) => {
    const res = await fetch(url, options);
    if (res.status === 401 || res.status === 403) {
      onLogout();
      throw new Error('פג תוקף החיבור או שאינך מורשה. אנא התחבר שוב.');
    }
    return res;
  };

  // פונקציה חכמה לטעינת נתונים מורחבים מ-LocalStorage (עובדת לפי ID ולפי שם המקלט כגיבוי)
  const enrichSheltersData = (rawShelters) => {
    const savedExtras = JSON.parse(localStorage.getItem('safenear_shelters_extras') || '{}');
    return rawShelters.map(shelter => {
      // הוספנו בדיקה גם לפי shelter.name
      const extras = savedExtras[shelter.id] || savedExtras[shelter.name] || {};
      return {
        ...shelter,
        capacity: extras.capacity !== undefined ? extras.capacity : (shelter.capacity || ''),
        has_wifi: extras.has_wifi !== undefined ? extras.has_wifi : (shelter.has_wifi || shelter.hasWifi || false),
        notes: extras.notes || shelter.notes || '' // נוודא שגם הערות עוברות
      };
    });
  };

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Shelters (Public)
      const resShelters = await fetch('/api/shelters');
      if (!resShelters.ok) throw new Error('טעינת המקלטים נכשלה');
      const dataShelters = await resShelters.json();
      
      // העשרת נתוני המקלטים מה-LocalStorage
      setShelters(enrichSheltersData(dataShelters));

      // Fetch Maps (Public)
      const resMaps = await fetch('/api/maps');
      if (!resMaps.ok) throw new Error('טעינת המפות נכשלה');
      const dataMaps = await resMaps.json();
      setMaps(dataMaps);

      // Fetch Users & Logs (Requires Admin)
      if (isAdmin) {
        const [resUsers, resLogs] = await Promise.all([
          fetchWithAuth('/users', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetchWithAuth('/api/logs', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (resUsers.ok) {
          const dataUsers = await resUsers.json();
          setUsers(dataUsers);
        }
        if (resLogs.ok) {
          const dataLogs = await resLogs.json();
          setLogs(dataLogs);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  // --- Shelter Handlers ---
const handleShelterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const method = editingShelter ? 'PUT' : 'POST';
    const url = editingShelter ? `/api/shelters/${editingShelter.id}` : '/api/shelters';

    try {
      const response = await fetchWithAuth(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: shelterForm.name,
          location: shelterForm.location,
          notes: shelterForm.notes,
          capacity: parseInt(shelterForm.capacity, 10) || 0,
          wifi: shelterForm.wifi ? 1 : 0,
          open: shelterForm.open ? 1 : 0,
          mapID: parseInt(shelterForm.mapID, 10),
          x: shelterForm.x !== undefined ? shelterForm.x : null,
          y: shelterForm.y !== undefined ? shelterForm.y : null
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'הפעולה נכשלה');

      // שמירה ב-LocalStorage
      const savedExtras = JSON.parse(localStorage.getItem('safenear_shelters_extras') || '{}');
      const extrasPayload = {
        capacity: shelterForm.capacity ? parseInt(shelterForm.capacity, 10) : null,
        has_wifi: shelterForm.wifi,
        notes: shelterForm.notes
      };

      const newId = data.id || data.insertId || data.shelterId;
      if (newId) savedExtras[newId] = extrasPayload;
      if (shelterForm.name) savedExtras[shelterForm.name] = extrasPayload;

      console.log("Saving to localStorage with name:", shelterForm.name, "Payload:", extrasPayload);
    
      localStorage.setItem('safenear_shelters_extras', JSON.stringify(savedExtras));

      // סיום פעולה
      showNotification(editingShelter ? 'המקלט עודכן בהצלחה!' : 'המקלט נוסף בהצלחה!');
      setShowShelterModal(false);
      setEditingShelter(null);
      setShelterForm({ name: '', open: false, location: '', mapID: '', x: null, y: null, capacity: '', has_wifi: false });
      setAddingShelterCoords(null);
      fetchData();
    } catch (err) {
      showNotification(err.message, true);
      setError(err.message);
    }
  };
const handleToggleShelterStatus = async (shelter) => {
    try {
      const isClosing = shelter.open === 1 || shelter.open === true;

      const response = await fetchWithAuth(`/api/shelters/${shelter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: shelter.name,
          open: shelter.open ? 0 : 1, // Toggle
          location: shelter.location,
          mapID: shelter.map_id,
          x: shelter.x !== undefined ? shelter.x : null,
          y: shelter.y !== undefined ? shelter.y : null
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'שינוי הסטטוס נכשל');

      if (isClosing) {
        showNotification(`המקלט "${shelter.name}" כעת סגור.`, true);
      } else {
        showNotification(`המקלט "${shelter.name}" כעת פתוח לציבור.`);
      }
      
      fetchData();
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleToggleAllShelters = async (shouldOpen) => {
    if (!window.confirm(`האם אתה בטוח שברצונך ${shouldOpen ? 'לפתוח' : 'לסגור'} את כל המקלטים במערכת?`)) return;
    
    setLoading(true);
    try {
      const updatePromises = shelters.map(shelter => 
        fetchWithAuth(`/api/shelters/${shelter.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            name: shelter.name,
            open: shouldOpen ? 1 : 0,
            location: shelter.location,
            mapID: shelter.map_id,
            x: shelter.x !== undefined ? shelter.x : null,
            y: shelter.y !== undefined ? shelter.y : null
          })
        })
      );

      await Promise.all(updatePromises);
      showNotification(`כל המקלטים עודכנו למצב ${shouldOpen ? 'פתוח' : 'סגור'}.`);
      fetchData();
    } catch (err) {
      showNotification('אירעה שגיאה בעדכון המקלטים', true);
    } finally {
      setLoading(false);
    }
  };

const handleEditShelterClick = (shelter) => {
    // 1. שולפים את הנתונים מה-localStorage
    const savedExtras = JSON.parse(localStorage.getItem('safenear_shelters_extras') || '{}');
    
    // תיקון: שולפים לפי ID ואם לא קיים - לפי השם (זה הגיבוי למקלט חדש)
    const extras = savedExtras[shelter.id] || savedExtras[shelter.name] || {};

    setEditingShelter(shelter);
    
    // 2. מעדכנים את ה-State עם הנתונים מהשרת (shelter) ומה-localStorage (extras)
    setShelterForm({
      name: shelter.name,
      open: shelter.open === 1 || shelter.open === true,
      location: shelter.location,
      mapID: shelter.map_id || '',
      x: shelter.x !== undefined && shelter.x !== null ? shelter.x : null,
      y: shelter.y !== undefined && shelter.y !== null ? shelter.y : null,
      
      // השדות מה-localStorage עם גיבוי מה-shelter עצמו
      capacity: extras.capacity !== undefined ? extras.capacity : (shelter.capacity || ''),
      wifi: extras.has_wifi !== undefined ? extras.has_wifi : (shelter.has_wifi === 1 || shelter.has_wifi === true),
      notes: extras.notes || shelter.notes || '' 
    });

    setShowShelterModal(true);
  };

  const handleDeleteShelter = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק מקלט זה?')) return;
    try {
      const response = await fetchWithAuth(`/api/shelters/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'המחיקה נכשלה');
      
      // מחיקה של הנתונים המורחבים מה-LocalStorage כשהמקלט נמחק
      const savedExtras = JSON.parse(localStorage.getItem('safenear_shelters_extras') || '{}');
      const shelterToDelete = shelters.find(s => s.id === id);
      if (shelterToDelete) {
        delete savedExtras[id];
        delete savedExtras[shelterToDelete.name];
      }
      localStorage.setItem('safenear_shelters_extras', JSON.stringify(savedExtras));

      showNotification('המקלט נמחק בהצלחה.');
      fetchData();
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  // --- Map Handlers ---
  const handleMapSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const method = editingMap ? 'PUT' : 'POST';
    const url = editingMap ? `/api/maps/${editingMap.id}` : '/api/maps';

    try {
      const formData = new FormData();
      formData.append('name', mapForm.name);
      
      if (mapForm.mapFile) {
        formData.append('mapFile', mapForm.mapFile);
      } else {
        formData.append('path', mapForm.path);
      }

      const response = await fetchWithAuth(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'הפעולה נכשלה');

      showNotification(editingMap ? 'המפה עודכנה בהצלחה!' : 'המפה נוספה בהצלחה!');
      setShowMapModal(false);
      setEditingMap(null);
      setMapForm({ name: '', path: '', mapFile: null });
      fetchData();
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleEditMapClick = (map) => {
    setEditingMap(map);
    setMapForm({ name: map.name, path: map.path, mapFile: null });
    setShowMapModal(true);
  };

  const handleDeleteMap = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק מפה זו? מחיקה זו עלולה לגרום לשגיאות במקלטים המקושרים למפה.')) return;
    try {
      const response = await fetchWithAuth(`/api/maps/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'המחיקה נכשלה');
      showNotification('המפה נמחקה בהצלחה.');
      fetchData();
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  // --- User Handlers ---
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const method = editingUser ? 'PUT' : 'POST';
    const url = editingUser ? `/users/${editingUser.id}` : '/users';

    try {
      const response = await fetchWithAuth(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: userForm.username,
          password: userForm.password,
          admin: 1
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'הפעולה נכשלה');

      showNotification(editingUser ? 'פרטי המשתמש עודכנו בהצלחה!' : 'המשתמש נרשם בהצלחה!');
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ username: '', password: '', admin: true });
      fetchData();
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleEditUserClick = (targetUser) => {
    setEditingUser(targetUser);
    setUserForm({
      username: targetUser.username,
      password: '',
      admin: true
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (id) => {
    if (id === user.id) {
      showNotification("אינך יכול למחוק את החשבון של עצמך.", true);
      return;
    }
    if (!window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) return;
    try {
      const response = await fetch(`/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'המחיקה נכשלה');
      showNotification('המשתמש נמחק בהצלחה.');
      fetchData();
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  // Helper mapping functions
  const getMapName = (mapId) => {
    const map = maps.find(m => m.id === mapId);
    return map ? map.name : `מפה לא ידועה (מזהה: ${mapId})`;
  };

  // Calculate Overview Stats
  const totalShelters = shelters.length;
  const openShelters = shelters.filter(s => s.open === 1 || s.open === true).length;
  const closedShelters = totalShelters - openShelters;
  const totalMaps = maps.length;
  const totalUsers = users.length;

  // Map Click Handler for Coordinates
  const handleMapCanvasClick = (e, mapId) => {
    if (!isAdmin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 10000);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 10000);

    if (isRelocating) {
      setShelterForm({ ...shelterForm, mapID: mapId, x, y });
      setIsRelocating(false);
      setShowShelterModal(true);
    } else {
      setAddingShelterCoords({ x, y });
      setShelterForm({ name: '', open: false, location: '', mapID: mapId, x, y, capacity: '', has_wifi: false });
      setEditingShelter(null);
      setShowShelterModal(true);
    }
  };

  return (
    <div className="dashboard-container" style={{ direction: 'rtl' }}>
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand" style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
          <span className="brand-logo" style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', lineHeight: '1.2' }}>SafeNear</span>
          <span className="brand-subtext" style={{ fontSize: '12px', color: '#9ca3af', letterSpacing: '0.5px' }}>מערכת ניטור מקלטים</span>
        </div>
        <div className="user-profile">
          <div className="user-details" style={{ textAlign: 'right', width: '100%' }}>
            <h3 className="username" style={{ margin: 0 }}>{user?.username}</h3>
            <span className="role">{isAdmin ? 'צוות עירייה' : 'תושב העיר'}</span>
          </div>
        </div>
        <nav className="sidebar-menu">
          <button
            className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); setActivePopupShelterId(null); }}
            style={{ textAlign: 'right', width: '100%' }}
          >
            עמוד הבית
          </button>
          <button
            className={`menu-item ${activeTab === 'shelters' ? 'active' : ''}`}
            onClick={() => { setActiveTab('shelters'); setActivePopupShelterId(null); }}
            style={{ textAlign: 'right', width: '100%' }}
          >
            רשימת המקלטים
          </button>
          <button
            className={`menu-item ${activeTab === 'maps' ? 'active' : ''}`}
            onClick={() => { setActiveTab('maps'); setActivePopupShelterId(null); }}
            style={{ textAlign: 'right', width: '100%' }}
          >
            מפות עירוניות
          </button>
          {isAdmin && (
            <>
              <button
                className={`menu-item ${activeTab === 'users' ? 'active' : ''}`} 
                onClick={() => { setActiveTab('users'); setActivePopupShelterId(null); }}
                style={{ textAlign: 'right', width: '100%' }}
              >
                ניהול המשתמשים
              </button>
              <button 
                className={`menu-item ${activeTab === 'logs' ? 'active' : ''}`} 
                onClick={() => { setActiveTab('logs'); setActivePopupShelterId(null); }}
                style={{ textAlign: 'right', width: '100%' }}
              >
                יומן פעילות
              </button>
            </>
          )}
        </nav>
        <button className="logout-btn" onClick={onLogout} style={{ textAlign: 'right', width: '100%' }}>
          התנתק מהמערכת
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-content" style={{ textAlign: 'right' }}>
        {/* Status Alerts */}
        {error && (
          <div className="alert alert-danger" style={{ textAlign: 'right' }}>
            <p>{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success" style={{ textAlign: 'right' }}>
            <p>{successMsg}</p>
          </div>
        )}

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="tab-pane">
            <header className="content-header">
              <h1>מבט כללי על המערכת</h1>
              <p>נתונים בזמן אמת על המקלטים בעיר</p>
            </header>

            <div className="stats-grid" style={{ direction: 'rtl' }}>
              <div className="stat-card accent-blue">
                <div className="stat-info">
                  <h3>סה"כ מקלטים</h3>
                  <span className="stat-value">{totalShelters}</span>
                </div>
              </div>
              <div className="stat-card accent-green">
                <div className="stat-info">
                  <h3>מקלטים פתוחים</h3>
                  <span className="stat-value">{openShelters}</span>
                </div>
              </div>
              <div className="stat-card accent-red">
                <div className="stat-info">
                  <h3>מקלטים סגורים</h3>
                  <span className="stat-value">{closedShelters}</span>
                </div>
              </div>
              <div className="stat-card accent-purple">
                <div className="stat-info">
                  <h3>סה"כ מפות</h3>
                  <span className="stat-value">{totalMaps}</span>
                </div>
              </div>
            </div>

            <section className="dashboard-recent">
              <div className="card">
                <h2>סקירה מהירה</h2>
                <div className="overview-summary">
                  {isAdmin ? (
                    <>
                      <p>ברוכים הבאים, <strong>{user?.username}</strong>. אתם מחוברים כעת כ-<strong>צוות עירייה 🛠️</strong>.</p>
                      <p>כנציגי עירייה, יש לכם הרשאות מלאות להוסיף, לערוך ולמחוק מקלטים או מפות  ולצפות ביומן הפעילות של המערכת בזמן אמת.</p>
                    </>
                  ) : (
                    <>
                      <p>ברוכים הבאים ל-<strong>SafeNear </strong>. אתם מחוברים כעת כ-<strong>תושב 🏠</strong>.</p>
                      <p>כתושבים, אתם יכולים לעקוב אחר זמינות המקלטים בעיר בזמן אמת, לצפות במיקומם המדויק על גבי המפות ולמצוא את המקלט הקרוב ביותר אליכם בשעת חירום.</p>
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

{/* Tab 2: Shelters Management */}
        {activeTab === 'shelters' && (
          <div className="tab-pane">
<header className="content-header search-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '20px' }}>
  <div>
    <h1>מקלטים</h1>
    <p>עקבו אחר זמינות המקלטים, סטטוס הפתיחה ומיקומם בעיר.</p>
  </div>
  {isAdmin && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginTop: '15px' }}>
<button 
  className="btn btn-primary" 
  onClick={() => {
    // 1. מנקה את הטופס כדי שלא יהיו בו פרטים ממקלט קודם
    setShelterForm({ 
      name: '', 
      open: false, 
      location: '', 
      mapID: maps[0]?.id || '', 
      x: null, 
      y: null, 
      capacity: '', 
      has_wifi: false 
    });
    // 2. מסמן שאין מקלט בעריכה (כי אנחנו מוסיפים חדש)
    setEditingShelter(null);
    // 3. פותח את המודאל
    setShowShelterModal(true);
  }}
>
  הוסף מקלט חדש
</button>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn" style={{ backgroundColor: '#10b981', color: '#fff' }} onClick={() => handleToggleAllShelters(true)}>
          פתח הכל
        </button>
        <button className="btn" style={{ backgroundColor: '#ef4444', color: '#fff' }} onClick={() => handleToggleAllShelters(false)}>
          סגור הכל
        </button>
      </div>
    </div>
  )}
</header>

            <div className="card">
              {loading && <p>טוען נתוני מקלטים...</p>}
              {!loading && shelters.length === 0 && <p className="empty-text">לא נמצאו מקלטים במערכת.</p>}
              {!loading && shelters.length > 0 && (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'right' }}>מזהה</th>
                        <th style={{ textAlign: 'right' }}>שם המקלט</th>
                        <th style={{ textAlign: 'right' }}>סטטוס</th>
                        <th style={{ textAlign: 'right' }}>מיקום מפורט</th>
                        <th style={{ textAlign: 'right' }}>מפה מקושרת</th>
                        {isAdmin && <th style={{ textAlign: 'right' }}>פעולות</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {shelters.map((shelter) => (
                        <tr key={shelter.id}>
                          <td>{shelter.id}</td>
                          <td className="bold">{shelter.name}</td>
                          <td>
                            <span
                              className={`status-badge ${shelter.open === 1 || shelter.open === true ? 'status-open' : 'status-closed'} ${isAdmin ? 'interactive' : ''}`}
                              onClick={() => handleToggleShelterStatus(shelter)}
                              title={isAdmin ? "לחץ כדי לשנות סטטוס זמינות מקלט" : ""}
                            >
                              {shelter.open === 1 || shelter.open === true ? 'פתוח' : 'סגור'}
                            </span>
                          </td>
                          <td>{shelter.location}</td>
                          <td>
                            <span className="map-badge">
                              {getMapName(shelter.map_id)}
                            </span>
                          </td>
                          {isAdmin && (
                            <td>
                              <div className="action-buttons">
                                <button className="btn-icon-edit" onClick={() => handleEditShelterClick(shelter)}>ערוך</button>
                                <button className="btn-icon-delete" onClick={() => handleDeleteShelter(shelter.id)}>מחק</button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Maps Management */}
        {activeTab === 'maps' && (
          <div className="tab-pane">
            <header className="content-header search-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1>מפות עירוניות</h1>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {selectedMap && (
                  <button className="btn btn-secondary" onClick={() => { setSelectedMap(null); setActivePopupShelterId(null); }}>
                    חזרה למפות
                  </button>
                )}
                {isAdmin && (
                  <button className="btn btn-primary" onClick={() => {
                    setEditingMap(null);
                    setMapForm({ name: '', path: '', mapFile: null });
                    setShowMapModal(true);
                  }}>
                    הוסף מפה חדשה
                  </button>
                )}
              </div>
            </header>
{!selectedMap ? (
              <div className="maps-grid" style={{ direction: 'rtl' }}>
                {maps.map((map) => (
                  <div key={map.id} className="map-card" style={{ cursor: 'pointer' }} onClick={(e) => {
                    if (e.target.tagName !== 'BUTTON') setSelectedMap(map);
                  }}>
                    <div className="map-preview">
                      <img src={`/uploads/${map.path}`} alt={map.name} className="map-preview-img" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'block'; }} />
                      <span className="map-filename" style={{marginTop: 'auto'}}>{map.path}</span>
                    </div>
                    <div className="map-info" style={{ textAlign: 'right' }}>
                      <h3>{map.name}</h3>
                      <p>
                        כמות מקלטים: ({shelters.filter(s => Number(s.map_id || s.mapID) === Number(map.id)).length})
                      </p>
                      {isAdmin && (
                        <div className="map-actions" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); handleEditMapClick(map); }}>עריכה</button>
                          <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleDeleteMap(map.id); }}>מחיקה</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {maps.length === 0 && <p className="empty-text">אין מפות זמינות במערכת.</p>}
              </div>

            ) : (
              <div className="map-detail-layout" style={{ direction: 'rtl', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', width: '100%' }}>
                {isAdmin && isRelocating && (
                  <div className="alert alert-info" style={{ width: '100%', maxWidth: '900px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderRadius: '8px' }}>
                    <span>לחץ בנקודה כלשהי על המפה כדי לקבוע את המיקום החדש עבור המקלט: <strong>{shelterForm.name || 'המקלט הנבחר'}</strong>.</span>
                    <button className="btn btn-secondary" onClick={() => {
                      setIsRelocating(false);
                      setShowShelterModal(true);
                    }}>בטל בחירה</button>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '20px', width: '100%', maxWidth: '1200px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div
                    className={`map-canvas-wrapper ${isAdmin ? 'admin-mode' : ''} ${isRelocating ? 'relocating-mode' : ''}`}
                    onClick={(e) => {
                      if (!isRelocating) setActivePopupShelterId(null);
                      handleMapCanvasClick(e, selectedMap.id);
                    }}
                    style={{
                      flex: '1 1 700px',
                      maxWidth: '900px',
                      width: '100%',
                      position: 'relative',
                      border: isRelocating ? '3px solid #3b82f6' : '1px solid var(--border-color)',
                      borderRadius: '12px',
                      overflow: 'visible',
                      boxShadow: 'var(--shadow-lg)',
                      cursor: isRelocating ? 'crosshair' : 'default',
                      background: 'var(--bg-tertiary)'
                    }}
                  >
                    <img 
                      src={`/uploads/${selectedMap.path}`} 
                      alt={selectedMap.name} 
                      className="map-canvas-img" 
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />

                    {/* Render Shelters on Map */}
                    {shelters.filter(s => s.map_id === selectedMap.id && s.x !== null && s.y !== null).map(shelter => {
                      const isPopupOpen = activePopupShelterId === shelter.id;

                      return (
                        <div
                          key={shelter.id}
                          className={`shelter-pin ${shelter.open ? 'pin-open' : 'pin-closed'}`}
                          style={{ left: `${shelter.x / 100}%`, top: `${shelter.y / 100}%`, position: 'absolute' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePopupShelterId(shelter.id);
                          }}
                        >
                          <div className="pin-dot"></div>
                          <span className="pin-name">{shelter.name}</span>

                          {/* --- בלון המידע הצף המעוצב והמתוקן --- */}
                          {isPopupOpen && (
                            <div className="shelter-popup" onClick={(e) => e.stopPropagation()}>
                              <div className="shelter-popup-header">
                                <h4 className="shelter-popup-title">{shelter.name}</h4>
                                <button 
                                  className="shelter-popup-close" 
                                  onClick={(e) => { e.stopPropagation(); setActivePopupShelterId(null); }}
                                >
                                  ×
                                </button>
                              </div>
                              <div className="shelter-popup-body">
                                <p><strong>מיקום:</strong> {shelter.location}</p>
                                <p>
                                  <strong>סטטוס:</strong>{' '}
                                  <span style={{ fontWeight: 'bold', color: shelter.open ? '#4caf50' : '#ef4444' }}>
                                    {shelter.open ? 'פתוח לציבור' : 'סגור זמנית'}
                                  </span>
                                </p>
                                
                                {/* כאן התיקון המינימלי להוספת ההערות */}
                               {(() => {
                                  const savedExtras = JSON.parse(localStorage.getItem('safenear_shelters_extras') || '{}');
                                  
                                  // תיקון: מחפשים לפי ID, ואם לא נמצא - לפי השם
                                  const extras = savedExtras[shelter.id] || savedExtras[shelter.name] || {};
                                  
                                  // אם יש הערות ב-extras (מה-localStorage) או ב-shelter (מהשרת), נציג אותן
                                  const notesToDisplay = extras.notes || shelter.notes;
                                  
                                  return notesToDisplay ? <p><strong>הערות:</strong> {notesToDisplay}</p> : null;
                              })()}

                                {/* הצגת אייקוני האבזור החדשים - קורא מה-LocalStorage ששומר הכל יציב */}
                                <div className="shelter-amenities" style={{ display: 'flex', gap: '15px', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)', justifyContent: 'flex-start', alignItems: 'center' }}>
                                  
                                  <div className="amenity-item" title="תפוסת קהל מקסימלית" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span className="amenity-icon" style={{ fontSize: '16px' }}>👤</span>
                                    <strong style={{ fontSize: '13px' }}>
                                      {shelter.capacity !== undefined && shelter.capacity !== null && shelter.capacity !== '' ? shelter.capacity : 'לא מוגדר'}
                                    </strong>
                                  </div>

                                  <div className="amenity-item" style={{ display: 'flex', alignItems: 'center' }}>
                                    {(shelter.has_wifi === 1 || shelter.has_wifi === true || shelter.hasWifi === 1 || shelter.hasWifi === true) ? (
                                      <span className="amenity-icon" title="יש אינטרנט אלחוטי זמין ✅" style={{ fontSize: '18px' }}>📶</span>
                                    ) : (
                                      <span className="amenity-icon" title="אין אינטרנט אלחוטי ❌" style={{ fontSize: '18px' }}>❌📶</span>
                                    )}
                                  </div>
                                </div>

                                {/* מתג ההזזה (Switch Toggle) - עירייה בלבד */}
                                {isAdmin ? (
                                  <div className="switch-container">
                                    <span className="switch-label">שנה מצב זמינות:</span>
                                    <label className="switch">
                                      <input 
                                        type="checkbox" 
                                        checked={shelter.open === 1 || shelter.open === true}
                                        onChange={() => handleToggleShelterStatus(shelter)}
                                      />
                                      <span className="slider"></span>
                                    </label>
                                  </div>
                                ) : (
                                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                    תושב - מצב צפייה בלבד
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {isAdmin && (
                      <div className="map-add-hint">
                        לחץ בנקודה כלשהי על המפה כדי למקם מקלט חדש
                      </div>
                    )}
                  </div>

<div className="map-shelter-list" style={{ flex: '1 1 280px', maxWidth: '350px', width: '100%', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '15px', display: 'flex', flexDirection: 'column' }}>
                    <div className="map-shelter-list-header" style={{ textAlign: 'right', marginBottom: '15px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px' }}>מקלטים באזור זה</h3>
                    </div>
                    <div className="map-shelter-items" style={{ direction: 'rtl', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                      {shelters.filter(s => s.map_id === selectedMap.id).length === 0 ? (
                        <p className="empty-text" style={{ padding: '15px', fontSize: '13px', textAlign: 'right' }}>טרם מוקמו מקלטים על גבי מפה זו.</p>
                      ) : (
                        shelters.filter(s => s.map_id === selectedMap.id).map(shelter => (
                          <div 
                            key={shelter.id} 
                            className="map-shelter-item" 
                            onClick={() => {
                              if (shelter.x !== null) {
                                setActivePopupShelterId(shelter.id);
                              } else if (isAdmin) {
                                handleEditShelterClick(shelter);
                              }
                            }}
                            style={{ 
                                cursor: 'pointer', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '8px 0',
                                borderBottom: '1px solid var(--border-color)' 
                            }}
                          >
                            {/* צד ימין: שם ותיאור + הנקודה */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 'bold' }}>{shelter.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{shelter.location}</div>
                                </div>
                                <div className={`shelter-status-dot ${shelter.open ? 'dot-open' : 'dot-closed'}`} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: shelter.open ? '#10b981' : '#ef4444' }}></div>
                            </div>
                            
                            {/* צד שמאל: כפתור עריכה */}
                            {isAdmin && (
                              <div style={{ display: 'flex', gap: '8px' }}> {/* עוטף את שניהם בשורה */}
                                
                                {/* כפתור העריכה הקיים */}
                                <button 
                                  className="map-shelter-edit-btn" 
                                  title="ערוך פרטי מקלט"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditShelterClick(shelter);
                                  }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                                >
                                  ✏️
                                </button>

                                {/* כפתור המחיקה החדש */}
                                <button 
                                  className="map-shelter-delete-btn" 
                                  title="מחק מקלט"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteShelter(shelter.id); // פונקציית המחיקה שלך
                                  }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                                >
                                  🗑️
                                </button>

                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  

                    {/* כפתור הוספת מקלט מהיר בתחתית הרשימה - עירייה בלבד */}
                    {isAdmin && (
                      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <button 
                          className="btn btn-primary" 
                          onClick={() => {
                            setEditingShelter(null);
                            setShelterForm({ 
                              name: '', 
                              open: false, 
                              location: '', 
                              mapID: selectedMap.id || '', 
                              x: null, 
                              y: null, 
                              capacity: '', 
                              has_wifi: false 
                            });
                            setShowShelterModal(true);
                          }}
                          style={{ 
                            width: 'auto',          // הכפתור יתפוס רק את המקום שהוא צריך
                            minWidth: '200px',      // כדי שלא יהיה קטן מדי
                            padding: '12px 40px',   // מרווחים פנימיים יפים
                            borderRadius: '12px',
                            textAlign: 'center'
                          }}
                        >
                          הוסף מקלט חדש
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

{/* Tab 4: Users Management */}
{activeTab === 'users' && isAdmin && (
  <div className="tab-pane">
    <header className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <div>
        <h1>ניהול משתמשים</h1>
        <p>ניהול הרשאות וצפייה במשתמשי המערכת.</p>
      </div>
      {/* כפתור הוספת משתמש */}
      <button 
        className="btn btn-primary" 
        onClick={() => {
          setEditingUser(null);
          setShowUserModal(true);
        }}
        style={{ marginTop: '20px' }} // זה יוסיף את הרווח שביקשת
      >
        הוסף משתמש חדש
      </button>
    </header>

    <div className="card">
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'right' }}>מזהה</th>
              <th style={{ textAlign: 'right' }}>שם משתמש</th>
              <th style={{ textAlign: 'right' }}>סוג הרשאה</th>
              <th style={{ textAlign: 'right' }}>תאריך רישום</th>
              <th style={{ textAlign: 'right' }}>פעולות</th>
            </tr>
          </thead>
                  <tbody>
                    {users.map((targetUser) => {
                      const isTargetAdminUser = targetUser.username === 'admin';
                      const isCurrentUserRow = targetUser.id === user.id;

                      const canEdit = isSuperAdmin || isCurrentUserRow;
                      const canDelete = isSuperAdmin && !isTargetAdminUser && !isCurrentUserRow;

                      return (
                        <tr key={targetUser.id}>
                          <td>{targetUser.id}</td>
                          <td className="bold">{targetUser.username}</td>
                          <td>
                            <span className={`role-badge ${targetUser.admin === 1 || targetUser.admin === true ? 'role-admin' : 'role-user'}`}>
                              {targetUser.admin === 1 || targetUser.admin === true ? 'מנהל מערכת' : 'משתמש'}
                            </span>
                          </td>
                          <td>{targetUser.created_at ? new Date(targetUser.created_at).toLocaleDateString('he-IL') : 'N/A'}</td>
                          <td>
                            <div className="action-buttons">
                              {canEdit ? (
                                <button className="btn-icon-edit" onClick={() => handleEditUserClick(targetUser)}>ערוך</button>
                              ) : (
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>אין גישה</span>
                              )}
                              
                              {canDelete && (
                                <button className="btn-icon-delete" onClick={() => handleDeleteUser(targetUser.id)}>מחק</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Activity Logs (Admin Only) */}
        {activeTab === 'logs' && isAdmin && (
          <div className="tab-pane">
            <header className="content-header search-header">
              <div>
                <h1>יומן פעילות מערכת</h1>
                <p>מעקב אחר שינויים ופעולות שבוצעו במערכת על ידי עובדי העירייה.</p>
              </div>
            </header>

            <div className="card">
              {logs.length === 0 ? (
                <p className="empty-text">טרם נרשמו פעולות ביומן המערכת.</p>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'right' }}>זמן אירוע</th>
                        <th style={{ textAlign: 'right' }}>שם המשתמש</th>
                        <th style={{ textAlign: 'right' }}>פעולה</th>
                        <th style={{ textAlign: 'right' }}>פרטי שינוי</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id}>
                          <td>{new Date(log.timestamp).toLocaleString('he-IL')}</td>
                          <td><strong>{log.username}</strong></td>
                          <td><span className="placed-badge">{log.action}</span></td>
                          <td>
                            <details style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                              <summary>הצג פרטי אירוע (Payload)</summary>
                              <pre style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', textAlign: 'left' }}>
                                {log.details}
                              </pre>
                            </details>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL DIALOGS --- */}

      {/* Shelter Modal */}
      {showShelterModal && (
        <div className="modal-backdrop" style={{ direction: 'rtl' }}>
          <div className="modal-content">
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>{editingShelter ? 'עריכת פרטי מקלט' : 'הוספת מקלט חדש'}</h2>
              <button className="close-btn" onClick={() => setShowShelterModal(false)}>X</button>
            </div>
            <form onSubmit={handleShelterSubmit}>
              <div className="form-group" style={{ textAlign: 'right' }}>
                <label>שם המקלט</label>
                <input
                  type="text"
                  required
                  placeholder="לדוגמה: מקלט דיזנגוף 5"
                  value={shelterForm.name}
                  onChange={e => setShelterForm({ ...shelterForm, name: e.target.value })}
                  style={{ textAlign: 'right' }}
                />
              </div>
              <div className="form-group" style={{ textAlign: 'right' }}>
                <label>מיקום מפורט</label>
                <input
                  type="text"
                  required
                  placeholder="לדוגמה: כניסה א', קומה 1-"
                  value={shelterForm.location}
                  onChange={e => setShelterForm({ ...shelterForm, location: e.target.value })}
                  style={{ textAlign: 'right' }}
                />
              </div>
              <div className="form-group" style={{ textAlign: 'right' }}>
                <label>הערות</label>
                <input
                  type="text"
                  placeholder="הוסיפו הערות נוספות שחשוב לדעת"
                  value={shelterForm.notes || ''}
                  onChange={e => setShelterForm({ ...shelterForm, notes: e.target.value })}
                  style={{ textAlign: 'right' }}
                />
              </div>

              {/* שורת קלטים כפולה לנתוני האבזור (קיבולת ואינטרנט) */}
              <div className="form-row-flexible">
                {/* קלט קיבולת אנשים - מספר בלבד */}
                <div className="form-group" style={{ textAlign: 'right' }}>
                  <label>קיבולת אנשים מקסימלית</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="לדוגמה: 50"
                    value={shelterForm.capacity}
                    onChange={e => setShelterForm({ ...shelterForm, capacity: e.target.value })}
                    style={{ textAlign: 'right' }}
                  />
                </div>

                {/* קלט זמינות אינטרנט אלחוטי - מתג לסמן יש/אין */}
                <div className="form-group" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ marginBottom: '8px' }}>אינטרנט אלחוטי (Wi-Fi)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={shelterForm.has_wifi}
                        onChange={e => setShelterForm({ ...shelterForm, has_wifi: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </label>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {shelterForm.has_wifi ? 'יש חיבור אינטרנט' :'אין חיבור אינטרנט'}
                    </span>
                  </div>
                </div>
              </div>

              {/* הבחירה של מפת  עברה לכאן: מתחת לוויפי וקיבולת, ולפני הקואורדינטות */}
              <div className="form-group" style={{ textAlign: 'right' }}>
                <label>קישור למפה הרלוונטית</label>
                <select
                  required
                  value={shelterForm.mapID}
                  onChange={e => setShelterForm({ ...shelterForm, mapID: e.target.value })}
                  style={{ textAlign: 'right', direction: 'rtl' }}
                >
                  <option value="" disabled>-- בחר מפה מקושרת --</option>
                  {maps.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.path})</option>
                  ))}
                </select>
              </div>

              <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'right' }}>
                <input
                  type="checkbox"
                  id="shelter-open"
                  checked={shelterForm.open}
                  onChange={e => setShelterForm({ ...shelterForm, open: e.target.checked })}
                />
                <label htmlFor="shelter-open" style={{ margin: 0 }}>סמן מקלט זה כפתוח ומוכן לקליטה</label>
              </div>

              {shelterForm.x !== null && shelterForm.y !== null && !isNaN(shelterForm.x) && !isNaN(shelterForm.y) && (
                <div className="coords-display" style={{ textAlign: 'right', direction: 'rtl' }}>
                  <span>קואורדינטות שנבחרו: X {Math.round(shelterForm.x / 100)}%, Y {Math.round(shelterForm.y / 100)}%</span>
                  <button type="button" className="clear-coords-btn" onClick={() => setShelterForm({ ...shelterForm, x: null, y: null })} style={{ marginRight: '10px' }}>
                    אפס מיקום
                  </button>
                </div>
              )}
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{marginLeft: 'auto', background: '#3b82f6', color: 'white'}} onClick={() => {
                  setShowShelterModal(false);
                  setIsRelocating(true);
                  setActiveTab('maps');
                  const mapToSelect = maps.find(m => m.id === Number(shelterForm.mapID));
                  if (mapToSelect) setSelectedMap(mapToSelect);
                }}>בחר מיקום על גבי המפה</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowShelterModal(false)}>ביטול</button>
                <button type="submit" className="btn btn-primary">{editingShelter ? 'שמור שינויים' : 'צור מקלט'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMapModal && (
        <div className="modal-backdrop" style={{ direction: 'rtl' }}>
          <div className="modal-content">
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>{editingMap ? 'עריכת מפה' : 'הוספת מפה חדשה'}</h2>
              <button className="close-btn" onClick={() => setShowMapModal(false)}>X</button>
            </div>
            <form onSubmit={handleMapSubmit}>
              <div className="form-group" style={{ textAlign: 'right' }}>
                <label>שם אזור המפה</label>
                <input
                  type="text"
                  required
                  placeholder="לדוגמה: אודיטוריום ראשי"
                  value={mapForm.name}
                  onChange={e => setMapForm({ ...mapForm, name: e.target.value })}
                  style={{ textAlign: 'right' }}
                />
              </div>
              <div className="form-group" style={{ textAlign: 'right' }}>
                <label>קובץ תמונת המפה (גרור ושחרר או לחץ להעלאה)</label>
                <div 
                  className="drop-zone"
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('dragover'); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('dragover'); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove('dragover');
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setMapForm({ ...mapForm, mapFile: e.dataTransfer.files[0], path: e.dataTransfer.files[0].name });
                    }
                  }}
                  onClick={(e) => e.currentTarget.querySelector('input[type="file"]').click()}
                  style={{
                    border: '2px dashed #4b5563', borderRadius: '6px', padding: '30px', textAlign: 'center', 
                    color: '#9ca3af', cursor: 'pointer', transition: 'all 0.2s', background: 'rgba(30, 41, 59, 0.5)'
                  }}
                >
                  <input 
                    type="file" 
                    accept="image/*"
                    style={{display: 'none'}}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setMapForm({ ...mapForm, mapFile: e.target.files[0], path: e.target.files[0].name });
                      }
                    }}
                  />
                  {mapForm.mapFile ? (
                    <span style={{color: '#e2e8f0'}}>הקובץ שנבחר: {mapForm.mapFile.name}</span>
                  ) : mapForm.path ? (
                    <span style={{color: '#e2e8f0'}}>קובץ קיים: {mapForm.path} (לחץ כדי להחליף)</span>
                  ) : (
                    <span>גרור ושחרר קובץ תמונה כאן, או לחץ לבחירת קובץ</span>
                  )}
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMapModal(false)}>ביטול</button>
                <button type="submit" className="btn btn-primary">{editingMap ? 'שמור שינויים' : 'צור מפה'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-backdrop" style={{ direction: 'rtl' }}>
          <div className="modal-content">
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>{editingUser ? 'עדכון פרטי משתמש' : 'רישום משתמש חדש'}</h2>
              <button className="close-btn" onClick={() => setShowUserModal(false)}>X</button>
            </div>
            <form onSubmit={handleUserSubmit}>
              <div className="form-group" style={{ textAlign: 'right' }}>
                <label>שם משתמש</label>
                <input
                  type="text"
                  required
                  placeholder="לדוגמה: dany_cohen"
                  value={userForm.username}
                  onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                  style={{ textAlign: 'right' }}
                  disabled={editingUser}
                />
              </div>
              <div className="form-group" style={{ textAlign: 'right' }}>
                <label>{editingUser ? 'סיסמה חדשה (השאר ריק כדי לא לשנות)' : 'סיסמה'}</label>
                <input
                  type="password"
                  required={!editingUser}
                  placeholder={editingUser ? '••••••••' : 'הזן סיסמה מאובטחת'}
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                  style={{ textAlign: 'right' }}
                />
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>ביטול</button>
                <button type="submit" className="btn btn-primary">{editingUser ? 'עדכן משתמש' : 'רשום משתמש'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;
