import React, { useState } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import IPsecProfile from './components/IPsecProfile';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeMenu, setActiveMenu] = useState('System');
  const [ipsecInfo, setIpsecInfo] = useState({});  // IPsec 정보 상태 추가

  // 로그인 성공 처리 함수
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>T 시스템</h1>
        </div>
        <nav className="sidebar-menu">
          <button
            className={`menu-item ${activeMenu === 'System' ? 'active' : ''}`}
            onClick={() => setActiveMenu('System')}
          >
            System
          </button>
          <button
            className={`menu-item ${activeMenu === 'AWS' ? 'active' : ''}`}
            onClick={() => setActiveMenu('AWS')}
          >
            AWS
          </button>
          <button
            className={`menu-item ${activeMenu === 'IPsecProfile' ? 'active' : ''}`}
            onClick={() => setActiveMenu('IPsecProfile')}
          >
            IPsec Profile
          </button>
        </nav>
      </aside>
      
      <main className="content">
        {activeMenu === 'System' && (
          <div className="system-info">
            <h2>Virtual UTM Device Information</h2>
            <p>Model: Axgate-13000</p>
            <p>Firmware: 1.2.3</p>
            <p>Status: Active</p>
          </div>
        )}

        {activeMenu === 'AWS' && (
          isAuthenticated ? (
            <Dashboard setIpsecInfo={setIpsecInfo} /> // Dashboard에 IPsec 정보 전달
          ) : (
            <LoginPage onLoginSuccess={handleLoginSuccess} /> // 로그인 페이지 표시
          )
        )}

        {activeMenu === 'IPsecProfile' && (
          <IPsecProfile ipsecInfo={ipsecInfo} /> // IPsecProfile에 IPsec 정보 전달
        )}
      </main>
    </div>
  );
};

export default App;
