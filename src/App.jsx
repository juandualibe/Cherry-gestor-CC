// src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Navegacion from './components/Navegacion.jsx';
import Inicio from './pages/Inicio.jsx';
import Clientes from './pages/Clientes.jsx';
import Proveedores from './pages/Proveedores.jsx';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navegacion />
        <div className="main-wrapper">
          <main className="page-content">
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/proveedores" element={<Proveedores />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;