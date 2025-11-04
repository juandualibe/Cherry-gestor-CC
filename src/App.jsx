// src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Navegacion from './components/Navegacion.jsx';
import Inicio from './pages/Inicio.jsx';
import Clientes from './pages/Clientes.jsx';
import Proveedores from './pages/Proveedores.jsx';
import Verduleria from './pages/Verduleria.jsx';
import AutoBackup from './utils/AutoBackup.jsx';
import BackupControl from './components/BackupControl.jsx';

function App() {
  return (
    <BrowserRouter>
      <AutoBackup />
      <div className="app-container">
        <Navegacion />
        <div className="main-wrapper">
          <main className="page-content">
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/proveedores" element={<Proveedores />} />
              <Route path="/verduleria" element={<Verduleria />} />
            </Routes>
          </main>
        </div>
        <BackupControl />
      </div>
    </BrowserRouter>
  );
}

export default App;