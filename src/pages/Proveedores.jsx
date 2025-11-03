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

  // Estados para los modales de edición
  const [modalFacturaAbierto, setModalFacturaAbierto] = useState(false);
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  
  // Estado para guardar el item que estamos editando
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
  
  // <-- Función para ELIMINAR un PAGO -->
  const handleEliminarPago = (pagoId) => {
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar este pago?");
    if (!confirmar) return;
    setPagos(pagos.filter(p => p.id !== pagoId));
  };


  // --- NUEVAS FUNCIONES PARA EL MODAL DE EDICIÓN ---

  const handleCerrarModales = () => {
    setModalFacturaAbierto(false);
    setModalPagoAbierto(false);
    setItemEditando(null);
  };

  const handleAbrirModalFactura = (factura) => {
    setItemEditando({...factura});
    setModalFacturaAbierto(true);
  };

  const handleAbrirModalPago = (pago) => {
    setItemEditando({...pago});
    setModalPagoAbierto(true);
  };

  const handleEdicionChange = (e) => {
    const { name, value } = e.target;
    setItemEditando(prev => ({ ...prev, [name]: value }));
  };

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
  
  // --- Funciones de Cálculo y Exportación (TU VERSIÓN INTACTA) ---
  
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


  // <-- ¡NUEVO! Función de Importación Corregida (A1 / I1) -->
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file || !proveedorSeleccionado) return;

    // Función para parsear fechas "d/m/aaaa" o "dd/mm/aaaa" a "yyyy-mm-dd"
    const parsearFecha = (fechaString) => {
      // Si ya es un objeto Date (por si 'cellDates: true' funcionó)
      if (fechaString instanceof Date) {
        return fechaString.toISOString().split('T')[0];
      }
      
      // Si es un string (como "9/9/2025")
      if (typeof fechaString === 'string') {
        const partes = fechaString.split('/'); // [ "9", "9", "2025" ]
        if (partes.length === 3) {
          const dia = partes[0].padStart(2, '0');
          const mes = partes[1].padStart(2, '0');
          const anio = partes[2];
          return `${anio}-${mes}-${dia}`; // "2025-09-09"
        }
      }
      
      // Si es un número (formato de fecha de Excel)
      if (typeof fechaString === 'number') {
        const date = XLSX.SSF.parse_date_code(fechaString);
        const dia = String(date.d).padStart(2, '0');
        const mes = String(date.m).padStart(2, '0');
        const anio = date.y;
        return `${anio}-${mes}-${dia}`;
      }

      console.warn("Formato de fecha no reconocido:", fechaString);
      return null; // Formato inválido
    };


    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        // Leemos el archivo. 'cellDates: true' ayuda a convertir números a fechas.
        const wb = XLSX.read(data, { type: 'buffer', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];

        // Usamos AOA (Array de Arrays) para tener control total
        const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });

        const nuevasFacturas = [];
        const nuevosPagos = [];

        // Iteramos desde i = 1 (fila 2 de Excel, la primera de datos)
        for (let i = 1; i < aoa.length; i++) {
          const row = aoa[i];
          
          // --- Procesar Facturas (Columnas A, B, C, D) ---
          const fechaFactura = row[0]; // Col A
          const montoFactura = row[2]; // Col C

          if (fechaFactura && (typeof montoFactura === 'number' || (typeof montoFactura === 'string' && !isNaN(parseFloat(montoFactura))))) {
            const fechaParseada = parsearFecha(fechaFactura);
            if (fechaParseada) {
              nuevasFacturas.push({
                id: Date.now() + i + 'f',
                proveedorId: proveedorSeleccionado.id,
                fecha: fechaParseada,
                numero: String(row[1]), // Col B
                monto: parseFloat(montoFactura),
                rechazo: parseFloat(row[3]) || 0, // Col D
              });
            }
          }

          // --- Procesar Pagos (Columnas I, J) ---
          const fechaPago = row[8]; // Col I
          const montoPago = row[9]; // Col J

          if (fechaPago && (typeof montoPago === 'number' || (typeof montoPago === 'string' && !isNaN(parseFloat(montoPago))))) {
            const fechaParseada = parsearFecha(fechaPago);
            if (fechaParseada) {
              nuevosPagos.push({
                id: Date.now() + i + 'p',
                proveedorId: proveedorSeleccionado.id,
                fecha: fechaParseada,
                monto: parseFloat(montoPago),
              });
            }
          }
        }
        
        const confirmar = window.confirm(
          `Se encontraron ${nuevasFacturas.length} facturas y ${nuevosPagos.length} pagos. ¿Deseas agregarlos a ${proveedorSeleccionado.nombre}?`
        );
        
        if (confirmar) {
          setFacturas(facturasActuales => [...facturasActuales, ...nuevasFacturas]);
          setPagos(pagosActuales => [...pagosActuales, ...nuevosPagos]);
          alert("¡Datos importados con éxito!");
        }

      } catch (error) {
        console.error("Error al leer el archivo de Excel:", error);
        alert("Hubo un error al leer el archivo. Asegúrate de que tenga el formato A1/I1 que genera la app.");
      }
    };
    
    event.target.value = null; 
    reader.readAsArrayBuffer(file);
  };
  // <-- FIN DE LA NUEVA FUNCIÓN -->


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
          
          {/* <-- MODIFICADO: Contenedor de botones de Importar/Exportar --> */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
            <h2>Detalle de: {proveedorSeleccionado.nombre}</h2>
            
            {/* Grupo de botones */}
            <div style={{display: 'flex', gap: '1rem'}}>
              
              {/* --- ¡NUEVO! Botón de Importar --- */}
              <label className="btn" style={{backgroundColor: '#0dcaf0', cursor: 'pointer'}}>
                Importar desde Excel
                <input 
                  type="file" 
                  hidden 
                  accept=".xlsx, .xls"
                  onChange={handleFileImport}
                />
              </label>
              
              <button className="btn" onClick={handleExportarProveedor} style={{backgroundColor: '#198754'}}>
                Exportar a Excel
              </button>
            </div>
          </div>
          {/* --- FIN DE LA MODIFICACIÓN --- */}

          <h3> Saldo Pendiente Total: 
            <span className={calcularSaldoPendiente(proveedorSeleccionado.id) > 0 ? 'total' : 'total positivo'} style={{fontSize: '1.5rem', marginLeft: '1rem'}}>
              ${calcularSaldoPendiente(proveedorSeleccionado.id).toLocaleString('es-AR')}
            </span>
          </h3>
          <hr style={{margin: '2rem 0'}} />

          {/* Columnas de Facturas y Pagos (sin cambios) */}
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '2rem'}}>
            {/* --- Columna Izquierda: FACTURAS --- */}
            <div style={{flex: 1, minWidth: '300px'}}>
              <h3>Cargar Factura (Deuda)</h3>
              <form onSubmit={handleAgregarFactura} className="form-container" style={{flexDirection: 'column'}}>
                <input type="date" value={fechaNuevaFactura} onChange={(e) => setFechaNuevaFactura(e.target.value)} />
                <input type="text" value={numeroNuevaFactura} onChange={(e) => setNumeroNuevaFactura(e.target.value)} placeholder="N° de Factura" />
                <input type="number" step="0.01" min="0" value={montoNuevaFactura} onChange={(e) => setMontoNuevaFactura(e.target.value)} placeholder="Monto de la factura" />
                <input type="number" step="0.01" min="0" value={montoRechazo} onChange={(e) => setMontoRechazo(e.target.value)} placeholder="Monto Rechazo (si aplica)" />
                <button type="submit" className="btn">Agregar Factura</button>
              </form>
              
              <table className="tabla-detalles">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>N° Factura</th>
                    <th>Monto</th>
                    <th>Rechazo</th>
                    <th>Acciones</th>
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
                        <td style={{display: 'flex', gap: '0.5rem'}}>
                          <button onClick={() => handleAbrirModalFactura(factura)} style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid #007aff', background: '#007aff', color: 'white', borderRadius: '4px'}}> Editar </button>
                          <button onClick={() => handleEliminarFactura(factura.id)} style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid #dc3545', background: '#dc3545', color: 'white', borderRadius: '4px'}}> X </button>
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
                <input type="date" value={fechaNuevoPago} onChange={(e) => setFechaNuevoPago(e.target.value)} />
                <input type="number" step="0.01" min="0" value={montoNuevoPago} onChange={(e) => setMontoNuevoPago(e.target.value)} placeholder="Monto del pago" />
                <button type="submit" className="btn" style={{backgroundColor: '#5cb85c'}}>Agregar Pago</button>
              </form>
              
              <table className="tabla-detalles">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Monto Pago</th>
                    <th>Acciones</th>
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
                        <td style={{display: 'flex', gap: '0.5rem'}}>
                          <button onClick={() => handleAbrirModalPago(pago)} style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid #007aff', background: '#007aff', color: 'white', borderRadius: '4px'}}> Editar </button>
                          <button onClick={() => handleEliminarPago(pago.id)} style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid #dc3545', background: '#dc3545', color: 'white', borderRadius: '4px'}}> X </button>
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

      {/* --- MODALES DE EDICIÓN (Sin cambios) --- */}
      {modalFacturaAbierto && itemEditando && (
        <div className="modal-overlay" onClick={handleCerrarModales}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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