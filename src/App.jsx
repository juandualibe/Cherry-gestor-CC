// src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 👇 ¡Actualiza las extensiones aquí!
import Navegacion from './components/Navegacion.jsx';
import Inicio from './pages/Inicio.jsx';
import Clientes from './pages/Clientes.jsx';
import Proveedores from './pages/Proveedores.jsx';

function App() {
  return (
    // BrowserRouter envuelve toda la app para habilitar la navegación
    <BrowserRouter>
      <div className="App">
        <Navegacion />
        <main className="page-content">
          {/* Routes define qué componente mostrar según la URL */}
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/proveedores" element={<Proveedores />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;