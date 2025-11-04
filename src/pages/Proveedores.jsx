// src/pages/Proveedores.jsx

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

// --- Función de ayuda para sumar días ---
const sumarDias = (fechaString, dias) => {
  try {
    const fecha = new Date(fechaString + 'T00:00:00');
    fecha.setDate(fecha.getDate() + dias);
    return fecha.toISOString().split('T')[0];
  } catch (e) {
    return ''; 
  }
};


function Proveedores() {
  // Estados de siempre
  const [proveedores, setProveedores] = useState(() => cargarDatos('proveedores'));
  const [facturas, setFacturas] = useState(() => cargarDatos('facturasProveedores'));
  const [pagos, setPagos] = useState(() => cargarDatos('pagosProveedores'));
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  
  // Estados para formularios de "Añadir"
  const [nombreNuevoProveedor, setNombreNuevoProveedor] = useState('');
  const [fechaNuevaFactura, setFechaNuevaFactura] = useState(obtenerFechaLocal());
  const [numeroNuevaFactura, setNumeroNuevaFactura] = useState('');
  const [montoNuevaFactura, setMontoNuevaFactura] = useState('');
  const [montoRechazo, setMontoRechazo] = useState('');
  const [montoNuevoPago, setMontoNuevoPago] = useState('');
  const [fechaNuevoPago, setFechaNuevoPago] = useState(obtenerFechaLocal());

  const [fechaVencimientoNuevaFactura, setFechaVencimientoNuevaFactura] = useState(() => sumarDias(obtenerFechaLocal(), 7));

  // Estados para los modales de edición
  const [modalFacturaAbierto, setModalFacturaAbierto] = useState(false);
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);

  const mouseDownInsideModal = useRef(false);

  // --- Efectos para Guardar Datos ---
  useEffect(() => { guardarDatos('proveedores', proveedores); }, [proveedores]);
  useEffect(() => { guardarDatos('facturasProveedores', facturas); }, [facturas]);
  useEffect(() => { guardarDatos('pagosProveedores', pagos); }, [pagos]);

  useEffect(() => {
    setFechaVencimientoNuevaFactura(sumarDias(fechaNuevaFactura, 7));
  }, [fechaNuevaFactura]);

  // --- Funciones de Lógica ---
  
  const handleAgregarProveedor = (e) => {
    e.preventDefault();
    if (!nombreNuevoProveedor.trim()) return;
    const nuevoProveedor = { id: Date.now(), nombre: nombreNuevoProveedor };
    setProveedores([...proveedores, nuevoProveedor]);
    setNombreNuevoProveedor('');
  };

  const handleCardClick = (proveedor) => {
    if (proveedorSeleccionado && proveedorSeleccionado.id === proveedor.id) {
      setProveedorSeleccionado(null);
    } else {
      setProveedorSeleccionado(proveedor);
    }
  };

  const handleEliminarProveedor = (proveedorId) => {
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
    e.preventDefault();
    const monto = parseFloat(montoNuevaFactura);
    const rechazo = parseFloat(montoRechazo) || 0;
    const numero = numeroNuevaFactura.trim();
    if (!monto || monto <= 0 || !numero || !fechaVencimientoNuevaFactura || !proveedorSeleccionado) {
        alert("Por favor, completa la fecha, vencimiento, N° de factura y el monto.");
        return;
    }
    const nuevaFactura = { 
      id: Date.now(), 
      proveedorId: proveedorSeleccionado.id, 
      fecha: fechaNuevaFactura, 
      fechaVencimiento: fechaVencimientoNuevaFactura,
      numero: numero, 
      monto: monto, 
      rechazo: rechazo 
    };
    setFacturas([...facturas, nuevaFactura]);
    setNumeroNuevaFactura('');
    setMontoNuevaFactura('');
    setMontoRechazo('');
    const hoy = obtenerFechaLocal();
    setFechaNuevaFactura(hoy);
    setFechaVencimientoNuevaFactura(sumarDias(hoy, 7));
  };

  const handleAgregarPago = (e) => {
    e.preventDefault();
    const monto = parseFloat(montoNuevoPago);
    if (!monto || monto <= 0 || !proveedorSeleccionado) return;
    const nuevoPago = { id: Date.now(), proveedorId: proveedorSeleccionado.id, monto: monto, fecha: fechaNuevoPago };
    setPagos([...pagos, nuevoPago]);
    setMontoNuevoPago('');
  };

  const handleEliminarFactura = (facturaId) => {
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer.");
    if (!confirmar) return;
    setFacturas(facturas.filter(f => f.id !== facturaId));
  };
  
  const handleEliminarPago = (pagoId) => {
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar este pago?");
    if (!confirmar) return;
    setPagos(pagos.filter(p => p.id !== pagoId));
  };

  const handleCerrarModales = () => {
    setModalFacturaAbierto(false);
    setModalPagoAbierto(false);
    setItemEditando(null);
    mouseDownInsideModal.current = false;
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

  const handleGuardarFacturaEditada = (e) => {
    e.preventDefault();
    const monto = parseFloat(itemEditando.monto);
    const rechazo = parseFloat(itemEditando.rechazo) || 0;
    
    if (!monto || monto <= 0 || !itemEditando.numero) {
      alert("El N° de factura y el Monto no pueden estar vacíos.");
      return;
    }
    
    const facturasActualizadas = facturas.map(f => 
      f.id === itemEditando.id 
        ? { ...itemEditando, monto, rechazo, fechaVencimiento: itemEditando.fechaVencimiento || null }
        : f
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
  
  const calcularSaldoPendiente = (proveedorId) => {
    const totalFacturas = facturas.filter(f => f.proveedorId === proveedorId).reduce((total, f) => total + f.monto, 0);
    const totalRechazos = facturas.filter(f => f.proveedorId === proveedorId).reduce((total, f) => total + (f.rechazo || 0), 0);
    const totalPagos = pagos.filter(p => p.proveedorId === proveedorId).reduce((total, p) => total + p.monto, 0);
    return totalFacturas - totalRechazos - totalPagos;
  };

  const handleExportarProveedor = () => {
    if (!proveedorSeleccionado) return;
    const proveedorNombre = proveedorSeleccionado.nombre;
    
    const formatearFecha = (fechaString) => {
      if (!fechaString) return '';
      const fecha = new Date(fechaString + 'T00:00:00');
      const dia = String(fecha.getDate()).padStart(2, '0');
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const anio = fecha.getFullYear();
      return `${dia}/${mes}/${anio}`;
    };
    
    const facturasData = facturas.filter(f => f.proveedorId === proveedorSeleccionado.id).map(f => {
      return { 
        FECHA: formatearFecha(f.fecha), 
        VENCIMIENTO: formatearFecha(f.fechaVencimiento), 
        'N°': f.numero, 
        MONTO: f.monto, 
        RECHAZO: f.rechazo || 0 
      };
    });
    
    const pagosData = pagos.filter(p => p.proveedorId === proveedorSeleccionado.id).map(p => {
      return { 
        FECHA: formatearFecha(p.fecha), 
        MONTO: p.monto 
      };
    });
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(facturasData, { header: ["FECHA", "VENCIMIENTO", "N°", "MONTO", "RECHAZO"] });
    XLSX.utils.sheet_add_json(ws, pagosData, { header: ["FECHA", "MONTO"], skipHeader: false, origin: "I1" });
    
    const currencyFormat = '"$"#,##0.00';
    const endFacturaRow = facturasData.length + 1;
    const endPagoRow = pagosData.length + 1;
    
    for (let i = 2; i <= endFacturaRow; i++) {
      if (ws['D' + i]) ws['D' + i].z = currencyFormat;
      if (ws['E' + i]) ws['E' + i].z = currencyFormat;
    }
    for (let i = 2; i <= endPagoRow; i++) {
      if (ws['J' + i]) ws['J' + i].z = currencyFormat;
    }
    
    XLSX.utils.book_append_sheet(wb, ws, proveedorNombre);
    XLSX.writeFile(wb, `Reporte_${proveedorNombre}.xlsx`);
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file || !proveedorSeleccionado) return;

    const parsearFecha = (fechaString) => {
      if (fechaString instanceof Date) {
        return fechaString.toISOString().split('T')[0];
      }
      if (typeof fechaString === 'string') {
        const partes = fechaString.split('/'); 
        if (partes.length === 3) {
          const dia = partes[0].padStart(2, '0');
          const mes = partes[1].padStart(2, '0');
          const anio = partes[2];
          return `${anio}-${mes}-${dia}`;
        }
      }
      if (typeof fechaString === 'number') {
        const date = XLSX.SSF.parse_date_code(fechaString);
        const dia = String(date.d).padStart(2, '0');
        const mes = String(date.m).padStart(2, '0');
        const anio = date.y;
        return `${anio}-${mes}-${dia}`;
      }
      return null;
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const wb = XLSX.read(data, { type: 'buffer', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });

        const nuevasFacturas = [];
        const nuevosPagos = [];

        for (let i = 1; i < aoa.length; i++) {
          const row = aoa[i];
          
          const fechaFactura = row[0];
          const fechaVencimiento = row[1];
          const numeroFactura = row[2];
          const montoFactura = row[3];
          const rechazoFactura = row[4];

          if (fechaFactura && (typeof montoFactura === 'number' || (typeof montoFactura === 'string' && !isNaN(parseFloat(montoFactura))))) {
            const fechaParseada = parsearFecha(fechaFactura);
            if (fechaParseada) {
              nuevasFacturas.push({
                id: Date.now() + i + 'f',
                proveedorId: proveedorSeleccionado.id,
                fecha: fechaParseada,
                fechaVencimiento: parsearFecha(fechaVencimiento),
                numero: String(numeroFactura),
                monto: parseFloat(montoFactura),
                rechazo: parseFloat(rechazoFactura) || 0,
              });
            }
          }

          const fechaPago = row[8];
          const montoPago = row[9];
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

  return (
    <div>
      <h1>Gestión de Proveedores</h1>

      <form onSubmit={handleAgregarProveedor} className="form-container">
        <input type="text" value={nombreNuevoProveedor} onChange={(e) => setNombreNuevoProveedor(e.target.value)} placeholder="Nombre del nuevo proveedor" />
        <button type="submit" className="btn">Agregar Proveedor</button>
      </form>

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

      {proveedorSeleccionado && (
        <div style={{marginTop: '3rem'}}>
          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
            <h2>Detalle de: {proveedorSeleccionado.nombre}</h2>
            <div style={{display: 'flex', gap: '1rem'}}>
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

          <h3> Saldo Pendiente Total: 
            <span className={calcularSaldoPendiente(proveedorSeleccionado.id) > 0 ? 'total' : 'total positivo'} style={{fontSize: '1.5rem', marginLeft: '1rem'}}>
              ${calcularSaldoPendiente(proveedorSeleccionado.id).toLocaleString('es-AR')}
            </span>
          </h3>
          <hr style={{margin: '2rem 0'}} />

          <div style={{display: 'flex', flexWrap: 'wrap', gap: '2rem'}}>
            <div style={{flex: 1, minWidth: '300px'}}>
              <h3>Cargar Factura (Deuda)</h3>
              
              <form onSubmit={handleAgregarFactura} className="form-container" style={{flexDirection: 'column'}}>
                <label>Fecha de Factura</label>
                <input type="date" value={fechaNuevaFactura} onChange={(e) => setFechaNuevaFactura(e.target.value)} />
                <label>Fecha de Vencimiento (auto 7 días)</label>
                <input type="date" value={fechaVencimientoNuevaFactura} onChange={(e) => setFechaVencimientoNuevaFactura(e.target.value)} />
                
                <input type="text" value={numeroNuevaFactura} onChange={(e) => setNumeroNuevaFactura(e.target.value)} placeholder="N° de Factura" />
                <input type="number" step="0.01" min="0" value={montoNuevaFactura} onChange={(e) => setMontoNuevaFactura(e.target.value)} placeholder="Monto de la factura" />
                <input type="number" step="0.01" min="0" value={montoRechazo} onChange={(e) => setMontoRechazo(e.target.value)} placeholder="Monto Rechazo (si aplica)" />
                <button type="submit" className="btn">Agregar Factura</button>
              </form>
              
              <table className="tabla-detalles">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Vencimiento</th>
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
                        <td>{new Date(factura.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                        <td style={{color: 'red', fontWeight: '600'}}>
                          {factura.fechaVencimiento ? new Date(factura.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-AR') : 'N/A'}
                        </td>
                        <td>{factura.numero}</td>
                        <td>${factura.monto.toLocaleString('es-AR')}</td>
                        <td style={{color: 'red'}}>
                          {(factura.rechazo && factura.rechazo > 0) ? `-$${factura.rechazo.toLocaleString('es-AR')}` : '$0.00'}
                        </td>
                        <td className="tabla-acciones">
                          <button 
                            onClick={() => handleAbrirModalFactura(factura)} 
                            className="btn-editar"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleEliminarFactura(factura.id)} 
                            className="btn-eliminar"
                          >
                            X
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div style={{flex: 1, minWidth: '300px'}}>
              <h3>Cargar Pago</h3>
              <form onSubmit={handleAgregarPago} className="form-container" style={{flexDirection: 'column'}}>
                <label>Fecha de Pago</label>
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
                        <td>{new Date(pago.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                        <td>${pago.monto.toLocaleString('es-AR')}</td>
                        <td className="tabla-acciones">
                          <button 
                            onClick={() => handleAbrirModalPago(pago)} 
                            className="btn-editar"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleEliminarPago(pago.id)} 
                            className="btn-eliminar"
                          >
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

      {modalFacturaAbierto && itemEditando && (
        <div 
          className="modal-overlay" 
          onMouseDown={handleOverlayMouseDown}
          onClick={handleOverlayClick}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Editar Factura</h2>
            <form onSubmit={handleGuardarFacturaEditada} className="form-container" style={{flexDirection: 'column'}}>
              <label>Fecha</label>
              <input type="date" name="fecha" value={itemEditando.fecha} onChange={handleEdicionChange} />
              
              <label>Fecha Vencimiento (opcional)</label>
              <input type="date" name="fechaVencimiento" value={itemEditando.fechaVencimiento || ''} onChange={handleEdicionChange} />

              <label>N° Factura</label>
              <input type="text" name="numero" value={itemEditando.numero} onChange={handleEdicionChange} placeholder="N° de Factura" />
              <label>Monto</label>
              <input type="number" step="0.01" min="0" name="monto" value={itemEditando.monto} onChange={handleEdicionChange} placeholder="Monto de la factura" />
              <label>Rechazo</label>
              <input type="number" step="0.01" min="0" name="rechazo" value={itemEditando.rechazo || 0} onChange={handleEdicionChange} placeholder="Monto Rechazo (si aplica)" />
              <div className="modal-actions">
                <button type="button" className="btn" onClick={handleCerrarModales} style={{backgroundColor: '#6c757d'}}>Cancelar</button>
                <button type="submit" className="btn">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalPagoAbierto && itemEditando && (
        <div 
          className="modal-overlay" 
          onMouseDown={handleOverlayMouseDown}
          onClick={handleOverlayClick}
        >
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