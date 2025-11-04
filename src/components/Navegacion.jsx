// src/components/Navegacion.jsx

import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

function Navegacion() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      <button 
        className="mobile-menu-toggle"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        <span className={`hamburger ${isMobileOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {isMobileOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🍒</span>
            {!isCollapsed && <span className="logo-text">Cherry App</span>}
          </div>
          <button 
            className="sidebar-toggle" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Toggle sidebar"
            title={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink 
            to="/" 
            end 
            className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
            onClick={handleNavClick}
          >
            <span className="nav-icon">🏠</span>
            {!isCollapsed && <span className="nav-text">Dashboard</span>}
          </NavLink>

          <NavLink 
            to="/clientes" 
            className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
            onClick={handleNavClick}
          >
            <span className="nav-icon">👥</span>
            {!isCollapsed && <span className="nav-text">Clientes</span>}
          </NavLink>

          <NavLink 
            to="/proveedores" 
            className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
            onClick={handleNavClick}
          >
            <span className="nav-icon">🏢</span>
            {!isCollapsed && <span className="nav-text">Proveedores</span>}
          </NavLink>

          <NavLink 
            to="/verduleria" 
            className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
            onClick={handleNavClick}
          >
            <span className="nav-icon">🥬</span>
            {!isCollapsed && <span className="nav-text">Verdulería</span>}
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">JD</div>
            {!isCollapsed && (
              <div className="user-details">
                <div className="user-name">juandualibe</div>
                <div className="user-role">Administrador</div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Navegacion;