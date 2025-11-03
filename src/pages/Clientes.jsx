// src/pages/Clientes.jsx

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx'; // <-- NUEVO: Importamos la librería de Excel

// --- Funciones para interactuar con LocalStorage ---
const cargarDatos = (key) => {
  const datosGuardados = localStorage.getItem(key);
  return datosGuardados ? JSON.parse(datosGuardados) : [];
};

const guardarDatos = (key, datos) => {
  localStorage.setItem(key, JSON.stringify(datos));
};
// ----------------------------------------------------


function Clientes() {
  const [clientes, setClientes] = useState(() => cargarDatos('clientes'));
  const [deudas, setDeudas] = useState(() => cargarDatos('deudas'));
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [nombreNuevoCliente, setNombreNuevoCliente] = useState('');
  const [montoNuevaDeuda, setMontoNuevaDeuda] = useState('');
  const [fechaNuevaDeuda, setFechaNuevaDeuda] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    guardarDatos('clientes', clientes);
  }, [clientes]);

  useEffect(() => {
    guardarDatos('deudas', deudas);
  }, [deudas]);

  const handleAgregarCliente = (e) => {
    e.preventDefault();
    if (!nombreNuevoCliente.trim()) return;
    const nuevoCliente = {
      id: Date.now(),
      nombre: nombreNuevoCliente,
    };
    setClientes([...clientes, nuevoCliente]);
    setNombreNuevoCliente('');
  };

  const handleAgregarDeuda = (e) => {
    e.preventDefault();
    const monto = parseFloat(montoNuevaDeuda);
    if (!monto || monto <= 0 || !clienteSeleccionado) return;
    const nuevaDeuda = {
      id: Date.now(),
      clienteId: clienteSeleccionado.id,
      monto: monto,
      fecha: fechaNuevaDeuda,
    };
    setDeudas([...deudas, nuevaDeuda]);
    setMontoNuevaDeuda('');
  };

  const calcularTotalDeuda = (clienteId) => {
    return deudas
      .filter(deuda => deuda.clienteId === clienteId)
      .reduce((total, deuda) => total + deuda.monto, 0);
  };
  
  const deudasDelClienteSeleccionado = deudas.filter(
    deuda => clienteSeleccionado && deuda.clienteId === clienteSeleccionado.id
  );

  // <-- NUEVO: Función para exportar TODAS las deudas de clientes -->
  const handleExportarDeudas = () => {
    // 1. Buscamos el nombre de cada cliente y unimos los datos
    const dataParaExportar = deudas.map(deuda => {
      const cliente = clientes.find(c => c.id === deuda.clienteId);
      return {
        CLIENTE: cliente ? cliente.nombre : 'Cliente Desconocido',
        FECHA: new Date(deuda.fecha).toLocaleDateString('es-AR'),
        MONTO: deuda.monto
      };
    });
    
    // Opcional: Ordenamos por cliente
    dataParaExportar.sort((a, b) => a.CLIENTE.localeCompare(b.CLIENTE));
    
    // 2. Creamos la hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(dataParaExportar, {
      header: ["CLIENTE", "FECHA", "MONTO"]
    });
    
    // 3. Creamos el libro y guardamos
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Deudas de Clientes");
    XLSX.writeFile(wb, "Reporte_Deudas_Clientes.xlsx");
  };
  // <-- FIN DE LA NUEVA FUNCIÓN -->


  return (
    <div>
      <h1>Gestión de Clientes</h1>

      {/* Formulario para añadir NUEVO CLIENTE (sin cambios) */}
      <form onSubmit={handleAgregarCliente} className="form-container">
        <input
          type="text"
          value={nombreNuevoCliente}
          onChange={(e) => setNombreNuevoCliente(e.target.value)}
          placeholder="Nombre del nuevo cliente"
        />
        <button type="submit" className="btn">Agregar Cliente</button>
      </form>

      {/* Encabezado de Lista de Clientes */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem'}}>
        <h2>Lista de Clientes</h2>
        
        {/* <-- NUEVO: Botón para exportar todo --> */}
        {deudas.length > 0 && (
          <button className="btn" onClick={handleExportarDeudas} style={{backgroundColor: '#198754'}}>
            Exportar Todo a Excel
          </button>
        )}
      </div>

      {clientes.length === 0 && <p>Aún no hay clientes. ¡Agrega uno!</p>}
      
      {/* Lista de Clientes (sin cambios) */}
      <div className="lista-container">
        {clientes.map(cliente => {
          // ... (código igual)
          const total = calcularTotalDeuda(cliente.id);
          return (
            <div 
              key={cliente.id} 
              className="card" 
              onClick={() => setClienteSeleccionado(cliente)}
              style={{cursor: 'pointer'}}
            >
              <h3>{cliente.nombre}</h3>
              <p>Total adeudado:</p>
              <div className="total">
                ${total.toLocaleString('es-AR')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sección de Detalles del Cliente Seleccionado (sin cambios) */}
      {clienteSeleccionado && (
        <div style={{marginTop: '3rem'}}>
          <h2>Detalle de: {clienteSeleccionado.nombre}</h2>

          <form onSubmit={handleAgregarDeuda} className="form-container">
            {/* ... (formulario de deuda igual) ... */}
            <input
              type="date"
              value={fechaNuevaDeuda}
              onChange={(e) => setFechaNuevaDeuda(e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              min="0"
              value={montoNuevaDeuda}
              onChange={(e) => setMontoNuevaDeuda(e.target.value)}
              placeholder="Monto de la deuda"
            />
            <button type="submit" className="btn">Agregar Deuda</button>
          </form>

          <h3>Historial de Deudas</h3>
          {deudasDelClienteSeleccionado.length === 0 ? (
            <p>Este cliente no tiene deudas registradas.</p>
          ) : (
            <table className="tabla-detalles">
              {/* ... (tabla de historial igual) ... */}
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {deudasDelClienteSeleccionado
                  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                  .map(deuda => (
                    <tr key={deuda.id}>
                      <td>{new Date(deuda.fecha).toLocaleDateString('es-AR')}</td>
                      <td>${deuda.monto.toLocaleString('es-AR')}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
          
          <h3>
            Total Adeudado: 
            <span className="total" style={{fontSize: '1.5rem', marginLeft: '1rem'}}>
              ${calcularTotalDeuda(clienteSeleccionado.id).toLocaleString('es-AR')}
            </span>
          </h3>

          <button className="btn" onClick={() => setClienteSeleccionado(null)} style={{backgroundColor: '#6c757d'}}>
            Volver a la lista
          </button>
        </div>
      )}
    </div>
  );
}

export default Clientes;