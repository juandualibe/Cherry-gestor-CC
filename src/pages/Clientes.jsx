// src/pages/Clientes.jsx

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

// --- Funciones para interactuar con LocalStorage ---
const cargarDatos = (key) => {
  const datosGuardados = localStorage.getItem(key);
  return datosGuardados ? JSON.parse(datosGuardados) : [];
};

const guardarDatos = (key, datos) => {
  localStorage.setItem(key, JSON.stringify(datos));
};

// --- Función para obtener fecha local (sin UTC) ---
const obtenerFechaLocal = () => {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
};


function Clientes() {
  // Estados de la app
  const [clientes, setClientes] = useState(() => cargarDatos('clientes'));
  const [deudas, setDeudas] = useState(() => cargarDatos('deudas'));
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  // Estados para formularios de "Añadir"
  const [nombreNuevoCliente, setNombreNuevoCliente] = useState('');
  const [montoNuevaDeuda, setMontoNuevaDeuda] = useState('');
  const [fechaNuevaDeuda, setFechaNuevaDeuda] = useState(obtenerFechaLocal());

  const [modalDeudaAbierto, setModalDeudaAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);

  const mouseDownInsideModal = useRef(false);

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

  const handleEliminarCliente = (clienteId) => {
    const confirmar = window.confirm("¿Estás seguro de eliminar este cliente? Se borrarán TODAS sus deudas asociadas.");
    if (!confirmar) return;

    const nuevosClientes = clientes.filter(c => c.id !== clienteId);
    setClientes(nuevosClientes);

    const nuevasDeudas = deudas.filter(d => d.clienteId !== clienteId);
    setDeudas(nuevasDeudas);

    if (clienteSeleccionado && clienteSeleccionado.id === clienteId) {
      setClienteSeleccionado(null);
    }
  };

  const handleEliminarDeuda = (deudaId) => {
    const confirmar = window.confirm("¿Estás seguro de eliminar esta deuda?");
    if (!confirmar) return;

    const nuevasDeudas = deudas.filter(d => d.id !== deudaId);
    setDeudas(nuevasDeudas);
  };

  const handleVerDetalle = (cliente) => {
    if (clienteSeleccionado && clienteSeleccionado.id === cliente.id) {
      setClienteSeleccionado(null);
    } else {
      setClienteSeleccionado(cliente);
    }
  };

  const handleCerrarModales = () => {
    setModalDeudaAbierto(false);
    setItemEditando(null);
    mouseDownInsideModal.current = false;
  };

  const handleAbrirModalDeuda = (deuda) => {
    setItemEditando({...deuda});
    setModalDeudaAbierto(true);
  };

  const handleEdicionChange = (e) => {
    const { name, value } = e.target;
    setItemEditando(prev => ({ ...prev, [name]: value }));
  };

  const handleOverlayMouseDown = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      mouseDownInsideModal.current = false;
    } else {
      mouseDownInsideModal.current = true;
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay') && !mouseDownInsideModal.current) {
      handleCerrarModales();
    }
    mouseDownInsideModal.current = false;
  };

  const handleGuardarDeudaEditada = (e) => {
    e.preventDefault();
    const monto = parseFloat(itemEditando.monto);
    if (!monto || monto <= 0) {
      alert("El Monto no puede estar vacío.");
      return;
    }

    const deudasActualizadas = deudas.map(d => 
      d.id === itemEditando.id 
        ? { ...itemEditando, monto } 
        : d
    );
    
    setDeudas(deudasActualizadas);
    handleCerrarModales();
  };

  const handleExportarDeudas = () => {
    const formatearFecha = (fechaString) => {
      if (!fechaString) return '';
      const fecha = new Date(fechaString + 'T00:00:00');
      const dia = String(fecha.getDate()).padStart(2, '0');
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const anio = fecha.getFullYear();
      return `${dia}/${mes}/${anio}`;
    };

    const dataParaExportar = deudas.map(deuda => {
      const cliente = clientes.find(c => c.id === deuda.clienteId);
      return {
        CLIENTE: cliente ? cliente.nombre : 'Cliente Desconocido',
        FECHA: formatearFecha(deuda.fecha),
        MONTO: deuda.monto
      };
    });
    dataParaExportar.sort((a, b) => a.CLIENTE.localeCompare(b.CLIENTE));
    
    const ws = XLSX.utils.json_to_sheet(dataParaExportar, {
      header: ["CLIENTE", "FECHA", "MONTO"]
    });
    
    const currencyFormat = '"$"#,##0.00';
    const endRow = dataParaExportar.length + 1;
    for (let i = 2; i <= endRow; i++) {
      if (ws['C' + i]) ws['C' + i].z = currencyFormat;
    }
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Deudas de Clientes");
    XLSX.writeFile(wb, "Reporte_Deudas_Clientes.xlsx");
  };
  

  return (
    <div>
      <h1>Gestión de Clientes</h1>

      <form onSubmit={handleAgregarCliente} className="form-container">
        <input
          type="text"
          value={nombreNuevoCliente}
          onChange={(e) => setNombreNuevoCliente(e.target.value)}
          placeholder="Nombre del nuevo cliente"
        />
        <button type="submit" className="btn">Agregar Cliente</button>
      </form>

      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem'}}>
        <h2>Lista de Clientes</h2>
        
        {deudas.length > 0 && (
          <button className="btn" onClick={handleExportarDeudas} style={{backgroundColor: '#198754'}}>
            Exportar Deudas a Excel
          </button>
        )}
      </div>

      {clientes.length === 0 && <p>Aún no hay clientes. ¡Agrega uno!</p>}
      
      <table className="tabla-detalles" style={{width: '100%', display: clientes.length > 0 ? 'table' : 'none'}}>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Deuda Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map(cliente => {
            const total = calcularTotalDeuda(cliente.id);
            const isSelected = clienteSeleccionado && clienteSeleccionado.id === cliente.id;
            
            return (
              <tr key={cliente.id} style={{backgroundColor: isSelected ? '#e6f7ff' : 'transparent'}}>
                <td style={{fontWeight: '600'}}>{cliente.nombre}</td>
                <td>
                  <div className="total" style={{fontSize: '1.2rem', padding: '0.5rem', display: 'inline-block'}}>
                    ${total.toLocaleString('es-AR')}
                  </div>
                </td>
                <td className="tabla-acciones">
                  <button 
                    className="btn" 
                    onClick={() => handleVerDetalle(cliente)}
                    style={{backgroundColor: isSelected ? '#096dd9' : '#007aff', padding: '0.4rem 0.8rem', fontSize: '0.9rem'}}
                  >
                    {isSelected ? 'Ocultar Detalle' : 'Ver Detalle'}
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => handleEliminarCliente(cliente.id)}
                    style={{backgroundColor: '#dc3545', padding: '0.4rem 0.8rem', fontSize: '0.9rem'}}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {clienteSeleccionado && (
        <div style={{marginTop: '3rem', padding: '1.5rem', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
          <h2>Detalle de: {clienteSeleccionado.nombre}</h2>

          <form onSubmit={handleAgregarDeuda} className="form-container">
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
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {deudasDelClienteSeleccionado
                  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                  .map(deuda => (
                    <tr key={deuda.id}>
                      <td>{new Date(deuda.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                      <td>${deuda.monto.toLocaleString('es-AR')}</td>
                      <td className="tabla-acciones">
                        <button 
                          onClick={() => handleAbrirModalDeuda(deuda)} 
                          className="btn-editar"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleEliminarDeuda(deuda.id)} 
                          className="btn-eliminar"
                        >
                          X
                        </button>
                      </td>
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
        </div>
      )}

      {modalDeudaAbierto && itemEditando && (
        <div 
          className="modal-overlay" 
          onMouseDown={handleOverlayMouseDown}
          onClick={handleOverlayClick}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Editar Deuda</h2>
            <form onSubmit={handleGuardarDeudaEditada} className="form-container" style={{flexDirection: 'column'}}>
              <label>Fecha</label>
              <input type="date" name="fecha" value={itemEditando.fecha} onChange={handleEdicionChange} />
              
              <label>Monto</label>
              <input type="number" step="0.01" min="0" name="monto" value={itemEditando.monto} onChange={handleEdicionChange} placeholder="Monto de la deuda" />
              
              <div className="modal-actions">
                <button type="button" className="btn" onClick={handleCerrarModales} style={{backgroundColor: '#6c757d'}}>Cancelar</button>
                <button type="submit" className="btn">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Clientes;