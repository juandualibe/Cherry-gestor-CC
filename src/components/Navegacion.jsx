// src/components/Navegacion.jsx

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

function Navegacion() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">🍒</span>
          {!isCollapsed && <span className="logo-text">Cherry App</span>}
        </div>
        <button 
          className="sidebar-toggle" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">🏠</span>
          {!isCollapsed && <span className="nav-text">Dashboard</span>}
        </NavLink>

        <NavLink to="/clientes" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">👥</span>
          {!isCollapsed && <span className="nav-text">Clientes</span>}
        </NavLink>

        <NavLink to="/proveedores" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">🏢</span>
          {!isCollapsed && <span className="nav-text">Proveedores</span>}
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
  );
}

export default Navegacion;