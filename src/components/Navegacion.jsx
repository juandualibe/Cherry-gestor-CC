// src/components/Navegacion.js
import React from 'react';
// NavLink nos ayuda a saber qué link está "activo"
import { NavLink } from 'react-router-dom';

function Navegacion() {
  return (
    <nav className="navegacion">
      <ul>
        <li>
          <NavLink to="/" end>Inicio</NavLink>
        </li>
        <li>
          <NavLink to="/clientes">Clientes</NavLink>
        </li>
        <li>
          <NavLink to="/proveedores">Proveedores</NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default Navegacion;