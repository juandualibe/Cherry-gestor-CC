// src/pages/Proveedores.jsx

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

// --- Funciones para interactuar con LocalStorage ---
const cargarDatos = (key) => {
  const datosGuardados = localStorage.getItem(key);
  return datosGuardados ? JSON.parse(datosGuardados) : [];
};

const guardarDatos = (key, datos) => {
  localStorage.setItem(key, JSON.stringify(datos));
};
// ----------------------------------------------------

function Proveedores() {
  // Estados de siempre
  const [proveedores, setProveedores] = useState(() => cargarDatos('proveedores'));
  const [facturas, setFacturas] = useState(() => cargarDatos('facturasProveedores'));
  const [pagos, setPagos] = useState(() => cargarDatos('pagosProveedores'));
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  
  // Estados para formularios de "Añadir"
  const [nombreNuevoProveedor, setNombreNuevoProveedor] = useState('');
  const [fechaNuevaFactura, setFechaNuevaFactura] = useState(new Date().toISOString().split('T')[0]);
  const [numeroNuevaFactura, setNumeroNuevaFactura] = useState('');
  const [montoNuevaFactura, setMontoNuevaFactura] = useState('');
  const [montoRechazo, setMontoRechazo] = useState('');
  const [montoNuevoPago, setMontoNuevoPago] = useState('');
  const [fechaNuevoPago, setFechaNuevoPago] = useState(new Date().toISOString().split('T')[0]);

  // <-- NUEVO: Estados para los modales de edición -->
  const [modalFacturaAbierto, setModalFacturaAbierto] = useState(false);
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  
  // <-- NUEVO: Estado para guardar el item que estamos editando -->
  const [itemEditando, setItemEditando] = useState(null);

  // --- Efectos para Guardar Datos (sin cambios) ---
  useEffect(() => { guardarDatos('proveedores', proveedores); }, [proveedores]);
  useEffect(() => { guardarDatos('facturasProveedores', facturas); }, [facturas]);
  useEffect(() => { guardarDatos('pagosProveedores', pagos); }, [pagos]);

  // --- Funciones de Lógica (Agregar, Eliminar, etc.) ---
  
  const handleAgregarProveedor = (e) => {
    // ... (código igual)
    e.preventDefault();
    if (!nombreNuevoProveedor.trim()) return;
    const nuevoProveedor = { id: Date.now(), nombre: nombreNuevoProveedor };
    setProveedores([...proveedores, nuevoProveedor]);
    setNombreNuevoProveedor('');
  };

  const handleCardClick = (proveedor) => {
    // ... (código igual)
    if (proveedorSeleccionado && proveedorSeleccionado.id === proveedor.id) {
      setProveedorSeleccionado(null);
    } else {
      setProveedorSeleccionado(proveedor);
    }
  };

  const handleEliminarProveedor = (proveedorId) => {
    // ... (código igual)
    const confirmar = window.confirm("¿Estás seguro de eliminar este proveedor? Se borrarán TODAS sus facturas y pagos asociados.");
    if (!confirmar) return;
    setProveedores(proveedores.filter(p => p.id !== proveedorId));
    setFacturas(facturas.filter(f => f.proveedorId !== proveedorId));
    setPagos(pagos.filter(p => p.proveedorId !== proveedorId));
    if (proveedorSeleccionado && proveedorSeleccionado.id === proveedorId) {
      setProveedorSeleccionado(null);
    }
  };

  const handleAgregarFactura = (e) => {
    // ... (código igual)
    e.preventDefault();
    const monto = parseFloat(montoNuevaFactura);
    const rechazo = parseFloat(montoRechazo) || 0;
    const numero = numeroNuevaFactura.trim();
    if (!monto || monto <= 0 || !numero || !proveedorSeleccionado) {
        alert("Por favor, completa la fecha, N° de factura y el monto.");
        return;
    }
    const nuevaFactura = { id: Date.now(), proveedorId: proveedorSeleccionado.id, fecha: fechaNuevaFactura, numero: numero, monto: monto, rechazo: rechazo };
    setFacturas([...facturas, nuevaFactura]);
    setNumeroNuevaFactura('');
    setMontoNuevaFactura('');
    setMontoRechazo('');
  };

  const handleAgregarPago = (e) => {
    // ... (código igual)
    e.preventDefault();
    const monto = parseFloat(montoNuevoPago);
    if (!monto || monto <= 0 || !proveedorSeleccionado) return;
    const nuevoPago = { id: Date.now(), proveedorId: proveedorSeleccionado.id, monto: monto, fecha: fechaNuevoPago };
    setPagos([...pagos, nuevoPago]);
    setMontoNuevoPago('');
  };

  const handleEliminarFactura = (facturaId) => {
    // ... (código igual)
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer.");
    if (!confirmar) return;
    setFacturas(facturas.filter(f => f.id !== facturaId));
  };
  
  // <-- NUEVO: Función para ELIMINAR un PAGO -->
  const handleEliminarPago = (pagoId) => {
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar este pago?");
    if (!confirmar) return;
    setPagos(pagos.filter(p => p.id !== pagoId));
  };


  // --- NUEVAS FUNCIONES PARA EL MODAL DE EDICIÓN ---

  /**
   * Cierra todos los modales y resetea el item en edición
   */
  const handleCerrarModales = () => {
    setModalFacturaAbierto(false);
    setModalPagoAbierto(false);
    setItemEditando(null);
  };

  /**
   * Abre el modal de Factura y carga sus datos en el estado 'itemEditando'
   */
  const handleAbrirModalFactura = (factura) => {
    setItemEditando({...factura});
    setModalFacturaAbierto(true);
  };

  /**
   * Abre el modal de Pago y carga sus datos
   */
  const handleAbrirModalPago = (pago) => {
    setItemEditando({...pago});
    setModalPagoAbierto(true);
  };

  /**
   * Actualiza el estado 'itemEditando' mientras el usuario escribe en el modal
   */
  const handleEdicionChange = (e) => {
    const { name, value } = e.target;
    setItemEditando(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Guarda los cambios de la Factura editada
   */
  const handleGuardarFacturaEditada = (e) => {
    e.preventDefault();
    
    // Convertimos los números
    const monto = parseFloat(itemEditando.monto);
    const rechazo = parseFloat(itemEditando.rechazo) || 0;
    
    // Validamos
    if (!monto || monto <= 0 || !itemEditando.numero) {
      alert("El N° de factura y el Monto no pueden estar vacíos.");
      return;
    }
    
    // Creamos la nueva lista de facturas
    const facturasActualizadas = facturas.map(f => 
      f.id === itemEditando.id 
        ? { ...itemEditando, monto, rechazo } // Reemplaza el item viejo por el editado
        : f // Deja los demás como están
    );
    
    setFacturas(facturasActualizadas);
    handleCerrarModales();
  };

  /**
   * Guarda los cambios del Pago editado
   */
  const handleGuardarPagoEditado = (e) => {
    e.preventDefault();
    const monto = parseFloat(itemEditando.monto);
    
    if (!monto || monto <= 0) {
      alert("El Monto no puede estar vacío.");
      return;
    }
    
    const pagosActualizados = pagos.map(p => 
      p.id === itemEditando.id 
        ? { ...itemEditando, monto } 
        : p
    );
    
    setPagos(pagosActualizados);
    handleCerrarModales();
  };
  
  // --- Funciones de Cálculo y Exportación (sin cambios) ---
  
  const calcularSaldoPendiente = (proveedorId) => {
    // ... (código igual)
    const totalFacturas = facturas.filter(f => f.proveedorId === proveedorId).reduce((total, f) => total + f.monto, 0);
    const totalRechazos = facturas.filter(f => f.proveedorId === proveedorId).reduce((total, f) => total + (f.rechazo || 0), 0);
    const totalPagos = pagos.filter(p => p.proveedorId === proveedorId).reduce((total, p) => total + p.monto, 0);
    return totalFacturas - totalRechazos - totalPagos;
  };

  const handleExportarProveedor = () => {
    // ... (código igual)
    if (!proveedorSeleccionado) return;
    const proveedorNombre = proveedorSeleccionado.nombre;
    const facturasData = facturas.filter(f => f.proveedorId === proveedorSeleccionado.id).map(f => ({ FECHA: new Date(f.fecha).toLocaleDateString('es-AR'), 'N°': f.numero, MONTO: f.monto, RECHAZO: f.rechazo || 0 }));
    const pagosData = pagos.filter(p => p.proveedorId === proveedorSeleccionado.id).map(p => ({ FECHA: new Date(p.fecha).toLocaleDateString('es-AR'), MONTO: p.monto }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(facturasData, { header: ["FECHA", "N°", "MONTO", "RECHAZO"] });
    XLSX.utils.sheet_add_json(ws, pagosData, { header: ["FECHA", "MONTO"], skipHeader: false, origin: "I1" });
    const currencyFormat = '"$"#,##0.00';
    const endFacturaRow = facturasData.length + 1;
    const endPagoRow = pagosData.length + 1;
    for (let i = 2; i <= endFacturaRow; i++) {
      if (ws['C' + i]) ws['C' + i].z = currencyFormat;
      if (ws['D' + i]) ws['D' + i].z = currencyFormat;
    }
    for (let i = 2; i <= endPagoRow; i++) {
      if (ws['J' + i]) ws['J' + i].z = currencyFormat;
    }
    XLSX.utils.book_append_sheet(wb, ws, proveedorNombre);
    XLSX.writeFile(wb, `Reporte_${proveedorNombre}.xlsx`);
  };

  // --- Renderizado ---
  return (
    <div>
      <h1>Gestión de Proveedores</h1>

      {/* Formulario para añadir NUEVO PROVEEDOR (sin cambios) */}
      <form onSubmit={handleAgregarProveedor} className="form-container">
        <input type="text" value={nombreNuevoProveedor} onChange={(e) => setNombreNuevoProveedor(e.target.value)} placeholder="Nombre del nuevo proveedor" />
        <button type="submit" className="btn">Agregar Proveedor</button>
      </form>

      {/* Lista de Proveedores (sin cambios) */}
      <h2>Lista de Proveedores</h2>
      <div className="lista-container">
        {proveedores.map(proveedor => {
          const saldo = calcularSaldoPendiente(proveedor.id);
          const claseSaldo = saldo > 0 ? 'total' : 'total positivo';
          return (
            <div key={proveedor.id} className="card" style={{cursor: 'pointer', position: 'relative'}}>
              <button onClick={(e) => { e.stopPropagation(); handleEliminarProveedor(proveedor.id); }} style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}>
                X
              </button>
              <div onClick={() => handleCardClick(proveedor)}>
                <h3>{proveedor.nombre}</h3>
                <p>Saldo pendiente:</p>
                <div className={claseSaldo}>
                  ${saldo.toLocaleString('es-AR')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- Sección de Detalles del Proveedor Seleccionado --- */}
      {proveedorSeleccionado && (
        <div style={{marginTop: '3rem'}}>
          {/* ... (código de Saldo y Exportar sin cambios) ... */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h2>Detalle de: {proveedorSeleccionado.nombre}</h2>
            <button className="btn" onClick={handleExportarProveedor} style={{backgroundColor: '#198754'}}> Exportar a Excel </button>
          </div>
          <h3> Saldo Pendiente Total: 
            <span className={calcularSaldoPendiente(proveedorSeleccionado.id) > 0 ? 'total' : 'total positivo'} style={{fontSize: '1.5rem', marginLeft: '1rem'}}>
              ${calcularSaldoPendiente(proveedorSeleccionado.id).toLocaleString('es-AR')}
            </span>
          </h3>
          <hr style={{margin: '2rem 0'}} />

          {/* Columnas de Facturas y Pagos */}
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '2rem'}}>
            {/* --- Columna Izquierda: FACTURAS --- */}
            <div style={{flex: 1, minWidth: '300px'}}>
              <h3>Cargar Factura (Deuda)</h3>
              <form onSubmit={handleAgregarFactura} className="form-container" style={{flexDirection: 'column'}}>
                {/* ... (formulario de añadir factura sin cambios) ... */}
                <input type="date" value={fechaNuevaFactura} onChange={(e) => setFechaNuevaFactura(e.target.value)} />
                <input type="text" value={numeroNuevaFactura} onChange={(e) => setNumeroNuevaFactura(e.target.value)} placeholder="N° de Factura" />
                <input type="number" step="0.01" min="0" value={montoNuevaFactura} onChange={(e) => setMontoNuevaFactura(e.target.value)} placeholder="Monto de la factura" />
                <input type="number" step="0.01" min="0" value={montoRechazo} onChange={(e) => setMontoRechazo(e.target.value)} placeholder="Monto Rechazo (si aplica)" />
                <button type="submit" className="btn">Agregar Factura</button>
              </form>
              
              {/* <-- MODIFICADA: Tabla de Facturas --> */}
              <table className="tabla-detalles">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>N° Factura</th>
                    <th>Monto</th>
                    <th>Rechazo</th>
                    <th>Acciones</th> {/* <-- MODIFICADO --> */}
                  </tr>
                </thead>
                <tbody>
                  {facturas
                    .filter(f => f.proveedorId === proveedorSeleccionado.id)
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                    .map(factura => (
                      <tr key={factura.id}>
                        <td>{new Date(factura.fecha).toLocaleDateString('es-AR')}</td>
                        <td>{factura.numero}</td>
                        <td>${factura.monto.toLocaleString('es-AR')}</td>
                        <td style={{color: 'red'}}>
                          {(factura.rechazo && factura.rechazo > 0) ? `-$${factura.rechazo.toLocaleString('es-AR')}` : '$0.00'}
                        </td>
                        {/* <-- NUEVO: Botones de Editar y Eliminar --> */}
                        <td style={{display: 'flex', gap: '0.5rem'}}>
                          <button onClick={() => handleAbrirModalFactura(factura)} style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid #007aff', background: '#007aff', color: 'white', borderRadius: '4px'}}>
                            Editar
                          </button>
                          <button onClick={() => handleEliminarFactura(factura.id)} style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid #dc3545', background: '#dc3545', color: 'white', borderRadius: '4px'}}>
                            X
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* --- Columna Derecha: PAGOS --- */}
            <div style={{flex: 1, minWidth: '300px'}}>
              <h3>Cargar Pago</h3>
              <form onSubmit={handleAgregarPago} className="form-container" style={{flexDirection: 'column'}}>
                {/* ... (formulario de añadir pago sin cambios) ... */}
                <input type="date" value={fechaNuevoPago} onChange={(e) => setFechaNuevoPago(e.target.value)} />
                <input type="number" step="0.01" min="0" value={montoNuevoPago} onChange={(e) => setMontoNuevoPago(e.target.value)} placeholder="Monto del pago" />
                <button type="submit" className="btn" style={{backgroundColor: '#5cb85c'}}>Agregar Pago</button>
              </form>
              
              {/* <-- MODIFICADA: Tabla de Pagos --> */}
              <table className="tabla-detalles">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Monto Pago</th>
                    <th>Acciones</th> {/* <-- MODIFICADO --> */}
                  </tr>
                </thead>
                <tbody>
                  {pagos
                    .filter(p => p.proveedorId === proveedorSeleccionado.id)
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                    .map(pago => (
                      <tr key={pago.id}>
                        <td>{new Date(pago.fecha).toLocaleDateString('es-AR')}</td>
                        <td>${pago.monto.toLocaleString('es-AR')}</td>
                        {/* <-- NUEVO: Botones de Editar y Eliminar --> */}
                        <td style={{display: 'flex', gap: '0.5rem'}}>
                          <button onClick={() => handleAbrirModalPago(pago)} style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid #007aff', background: '#007aff', color: 'white', borderRadius: '4px'}}>
                            Editar
                          </button>
                          <button onClick={() => handleEliminarPago(pago.id)} style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid #dc3545', background: '#dc3545', color: 'white', borderRadius: '4px'}}>
                            X
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <button className="btn" onClick={() => setProveedorSeleccionado(null)} style={{backgroundColor: '#6c757d', marginTop: '2rem'}}>
            Volver a la lista
          </button>
        </div>
      )}

      {/* --- NUEVO: MODALES DE EDICIÓN --- */}
      {/* Se mostrarán "flotando" solo si están abiertos */}

      {/* Modal para Editar Factura */}
      {modalFacturaAbierto && itemEditando && (
        <div className="modal-overlay" onClick={handleCerrarModales}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Evita que se cierre al hacer clic adentro */}
            <h2>Editar Factura</h2>
            <form onSubmit={handleGuardarFacturaEditada} className="form-container" style={{flexDirection: 'column'}}>
              <label>Fecha</label>
              <input type="date" name="fecha" value={itemEditando.fecha} onChange={handleEdicionChange} />
              
              <label>N° Factura</label>
              <input type="text" name="numero" value={itemEditando.numero} onChange={handleEdicionChange} placeholder="N° de Factura" />
              
              <label>Monto</label>
              <input type="number" step="0.01" min="0" name="monto" value={itemEditando.monto} onChange={handleEdicionChange} placeholder="Monto de la factura" />
              
              <label>Rechazo</label>
              <input type="number" step="0.01" min="0" name="rechazo" value={itemEditando.rechazo} onChange={handleEdicionChange} placeholder="Monto Rechazo (si aplica)" />
              
              <div className="modal-actions">
                <button type="button" className="btn" onClick={handleCerrarModales} style={{backgroundColor: '#6c757d'}}>Cancelar</button>
                <button type="submit" className="btn">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Editar Pago */}
      {modalPagoAbierto && itemEditando && (
        <div className="modal-overlay" onClick={handleCerrarModales}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Editar Pago</h2>
            <form onSubmit={handleGuardarPagoEditado} className="form-container" style={{flexDirection: 'column'}}>
              <label>Fecha</label>
              <input type="date" name="fecha" value={itemEditando.fecha} onChange={handleEdicionChange} />
              
              <label>Monto</label>
              <input type="number" step="0.01" min="0" name="monto" value={itemEditando.monto} onChange={handleEdicionChange} placeholder="Monto del pago" />
              
              <div className="modal-actions">
                <button type="button" className="btn" onClick={handleCerrarModales} style={{backgroundColor: '#6c757d'}}>Cancelar</button>
                <button type="submit" className="btn" style={{backgroundColor: '#5cb85c'}}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Proveedores;