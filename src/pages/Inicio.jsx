// src/pages/Inicio.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const cargarDatos = (key) => {
  const datosGuardados = localStorage.getItem(key);
  return datosGuardados ? JSON.parse(datosGuardados) : [];
};

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

const hoy = new Date();
hoy.setHours(0, 0, 0, 0);

const tresDiasDespues = new Date(hoy);
tresDiasDespues.setDate(hoy.getDate() + 3);

const sieteDiasDespues = new Date(hoy);
sieteDiasDespues.setDate(hoy.getDate() + 7);


function Inicio() {
  const [alertasVencidas, setAlertasVencidas] = useState([]);
  const [alertasProximasVencer, setAlertasProximasVencer] = useState([]);
  const [alertasPorVencer, setAlertasPorVencer] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const proveedores = cargarDatos('proveedores');
    const facturas = cargarDatos('facturasProveedores');
    const pagos = cargarDatos('pagosProveedores');
    
    const alertasVencidasTemp = [];
    const alertasProximasVencerTemp = [];
    const alertasPorVencerTemp = [];

    for (const proveedor of proveedores) {
      const saldo = calcularSaldoPendiente(proveedor.id, facturas, pagos);
      
      if (saldo <= 0) {
        continue;
      }

      const facturasProveedor = facturas.filter(f => f.proveedorId === proveedor.id);
      
      let tieneVencidas = false;
      let tieneProximasVencer = false;
      let tienePorVencer = false;

      for (const factura of facturasProveedor) {
        if (factura.fechaVencimiento) {
          const fechaVenc = new Date(factura.fechaVencimiento + 'T00:00:00');

          if (fechaVenc < hoy) {
            tieneVencidas = true;
          } else if (fechaVenc >= hoy && fechaVenc <= tresDiasDespues) {
            tieneProximasVencer = true;
          } else if (fechaVenc > tresDiasDespues && fechaVenc <= sieteDiasDespues) {
            tienePorVencer = true;
          }
        }
      }

      const infoAlerta = {
        id: proveedor.id,
        nombre: proveedor.nombre,
        saldo: saldo
      };

      if (tieneVencidas) {
        alertasVencidasTemp.push(infoAlerta);
      } else if (tieneProximasVencer) {
        alertasProximasVencerTemp.push(infoAlerta);
      } else if (tienePorVencer) {
        alertasPorVencerTemp.push(infoAlerta);
      }
    }

    setAlertasVencidas(alertasVencidasTemp);
    setAlertasProximasVencer(alertasProximasVencerTemp);
    setAlertasPorVencer(alertasPorVencerTemp);
    setLoading(false);

  }, []);

  
  return (
    <div>
      <h1>Dashboard de Almacén</h1>
      <p>Resumen rápido de las cuentas a pagar a proveedores.</p>

      <div style={{display: 'flex', flexWrap: 'wrap', gap: '2rem'}}>
        
        <div style={{flex: 1, minWidth: '300px'}}>
          <h2 style={{color: '#dc3545'}}>🔴 Facturas Vencidas</h2>
          <div className="lista-container">
            {loading && <p>Calculando...</p>}
            {!loading && alertasVencidas.length === 0 && (
              <p>¡Buenas noticias! No hay facturas vencidas.</p>
            )}
            {alertasVencidas.map(alerta => (
              <div key={alerta.id} className="card" style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '200px',
                padding: '1.5rem',
                borderLeft: '4px solid #dc3545'
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
                    display: 'block',
                    backgroundColor: '#dc3545'
                  }}
                >
                  Ir a Proveedores
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div style={{flex: 1, minWidth: '300px'}}>
          <h2 style={{color: '#ff8c00'}}>🟠 Próximas a Vencer (0-3 días)</h2>
          <div className="lista-container">
            {loading && <p>Calculando...</p>}
            {!loading && alertasProximasVencer.length === 0 && (
              <p>No hay vencimientos urgentes.</p>
            )}
            {alertasProximasVencer.map(alerta => (
              <div key={alerta.id} className="card" style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '200px',
                padding: '1.5rem',
                borderLeft: '4px solid #ff8c00'
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
                    display: 'block',
                    backgroundColor: '#ff8c00'
                  }}
                >
                  Ir a Proveedores
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div style={{flex: 1, minWidth: '300px'}}>
          <h2 style={{color: '#ffc107'}}>🟡 Por Vencer (4-7 días)</h2>
          <div className="lista-container">
            {loading && <p>Calculando...</p>}
            {!loading && alertasPorVencer.length === 0 && (
              <p>No hay vencimientos en esta ventana.</p>
            )}
            {alertasPorVencer.map(alerta => (
              <div key={alerta.id} className="card" style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '200px',
                padding: '1.5rem',
                borderLeft: '4px solid #ffc107'
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