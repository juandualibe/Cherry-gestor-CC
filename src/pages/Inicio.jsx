// src/pages/Inicio.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Para navegar al proveedor

// --- Copiamos las funciones de LocalStorage ---
const cargarDatos = (key) => {
  const datosGuardados = localStorage.getItem(key);
  return datosGuardados ? JSON.parse(datosGuardados) : [];
};

// --- Función de ayuda para calcular saldo (copiada de Proveedores) ---
const calcularSaldoPendiente = (proveedorId, todasLasFacturas, todosLosPagos) => {
    const totalFacturas = todasLasFacturas
      .filter(f => f.proveedorId === proveedorId)
      .reduce((total, f) => total + f.monto, 0);
      
    const totalRechazos = todasLasFacturas
      .filter(f => f.proveedorId === proveedorId)
      .reduce((total, f) => total + (f.rechazo || 0), 0);
      
    const totalPagos = todosLosPagos
      .filter(p => p.proveedorId === proveedorId)
      .reduce((total, p) => total + p.monto, 0);

    return totalFacturas - totalRechazos - totalPagos;
};

// --- Función de ayuda para fechas (ignora la hora) ---
const hoy = new Date();
hoy.setHours(0, 0, 0, 0); // Setea a la medianoche de hoy

const sieteDiasDespues = new Date(hoy);
sieteDiasDespues.setDate(hoy.getDate() + 7);


function Inicio() {
  // Estado para guardar las alertas
  const [alertasVencidas, setAlertasVencidas] = useState([]);
  const [alertasPorVencer, setAlertasPorVencer] = useState([]);
  const [loading, setLoading] = useState(true);

  // useEffect se ejecuta una vez cuando el componente carga
  useEffect(() => {
    // 1. Cargar todos los datos
    const proveedores = cargarDatos('proveedores');
    const facturas = cargarDatos('facturasProveedores');
    const pagos = cargarDatos('pagosProveedores');
    
    const alertasVencidasTemp = [];
    const alertasPorVencerTemp = [];

    // 2. Iterar por cada proveedor
    for (const proveedor of proveedores) {
      // 3. Calcular su saldo
      const saldo = calcularSaldoPendiente(proveedor.id, facturas, pagos);
      
      // 4. Si el saldo es 0 o negativo, no debe nada, saltamos al siguiente
      if (saldo <= 0) {
        continue;
      }

      // 5. Si debe, revisamos sus facturas en busca de alertas
      const facturasProveedor = facturas.filter(f => f.proveedorId === proveedor.id);
      
      let tieneVencidas = false;
      let tienePorVencer = false;

      for (const factura of facturasProveedor) {
        // Nos aseguramos que la factura tenga fecha de vencimiento
        if (factura.fechaVencimiento) {
          const fechaVenc = new Date(factura.fechaVencimiento + 'T00:00:00'); // Asumir zona horaria local

          if (fechaVenc < hoy) {
            tieneVencidas = true;
          } else if (fechaVenc >= hoy && fechaVenc <= sieteDiasDespues) {
            tienePorVencer = true;
          }
        }
      }

      // 6. Añadimos al proveedor a la lista de alertas (si aplica)
      // Lo añadimos solo una vez, con su saldo total
      const infoAlerta = {
        id: proveedor.id,
        nombre: proveedor.nombre,
        saldo: saldo
      };

      if (tieneVencidas) {
        alertasVencidasTemp.push(infoAlerta);
      } else if (tienePorVencer) {
        // 'else if' para no mostrar al mismo proveedor en ambas listas
        alertasPorVencerTemp.push(infoAlerta);
      }
    }

    // 7. Guardamos los resultados en el estado
    setAlertasVencidas(alertasVencidasTemp);
    setAlertasPorVencer(alertasPorVencerTemp);
    setLoading(false);

  }, []); // El array vacío [] significa que solo se ejecuta al cargar

  
  return (
    <div>
      <h1>Dashboard de Almacén</h1>
      <p>Resumen rápido de las cuentas a pagar a proveedores.</p>

      <div style={{display: 'flex', flexWrap: 'wrap', gap: '2rem'}}>
        
        {/* Columna de Facturas Vencidas */}
        <div style={{flex: 1, minWidth: '300px'}}>
          <h2 style={{color: '#dc3545'}}>🔴 Proveedores con Facturas Vencidas</h2>
          <div className="lista-container">
            {loading && <p>Calculando...</p>}
            {!loading && alertasVencidas.length === 0 && (
              <p>¡Buenas noticias! No hay proveedores con facturas vencidas.</p>
            )}
            {alertasVencidas.map(alerta => (
              <div key={alerta.id} className="card" style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '200px',
                padding: '1.5rem'
              }}>
                <div>
                  <h3 style={{marginBottom: '1rem'}}>{alerta.nombre}</h3>
                  <p style={{marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666'}}>Saldo pendiente:</p>
                  <div className="total" style={{
                    fontSize: '1.8rem',
                    marginBottom: '1.5rem',
                    wordBreak: 'break-word'
                  }}>
                    ${alerta.saldo.toLocaleString('es-AR')}
                  </div>
                </div>
                <Link 
                  to="/proveedores" 
                  className="btn" 
                  style={{
                    marginTop: 'auto',
                    textDecoration: 'none',
                    textAlign: 'center',
                    display: 'block'
                  }}
                >
                  Ir a Proveedores
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Columna de Facturas por Vencer */}
        <div style={{flex: 1, minWidth: '300px'}}>
          <h2 style={{color: '#ffc107'}}>🟡 Proveedores por Vencer (Próx. 7 días)</h2>
          <div className="lista-container">
            {loading && <p>Calculando...</p>}
            {!loading && alertasPorVencer.length === 0 && (
              <p>No hay vencimientos en los próximos 7 días.</p>
            )}
            {alertasPorVencer.map(alerta => (
              <div key={alerta.id} className="card" style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '200px',
                padding: '1.5rem'
              }}>
                <div>
                  <h3 style={{marginBottom: '1rem'}}>{alerta.nombre}</h3>
                  <p style={{marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666'}}>Saldo pendiente:</p>
                  <div className="total" style={{
                    fontSize: '1.8rem',
                    marginBottom: '1.5rem',
                    wordBreak: 'break-word'
                  }}>
                    ${alerta.saldo.toLocaleString('es-AR')}
                  </div>
                </div>
                <Link 
                  to="/proveedores" 
                  className="btn" 
                  style={{
                    marginTop: 'auto',
                    textDecoration: 'none',
                    textAlign: 'center',
                    display: 'block'
                  }}
                >
                  Ir a Proveedores
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inicio;