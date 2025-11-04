// src/utils/AutoBackup.jsx

import { useEffect } from 'react';
import * as XLSX from 'xlsx';

const AutoBackup = () => {
  useEffect(() => {
    const intervalo = setInterval(() => {
      verificarYHacerBackup();
    }, 60 * 60 * 1000);

    verificarYHacerBackup();

    return () => clearInterval(intervalo);
  }, []);

  const verificarYHacerBackup = () => {
    const ultimoBackup = localStorage.getItem('ultimoBackup');
    const ahora = new Date();
    
    if (!ultimoBackup) {
      hacerBackup();
      return;
    }

    const fechaUltimoBackup = new Date(ultimoBackup);
    const diasTranscurridos = Math.floor((ahora - fechaUltimoBackup) / (1000 * 60 * 60 * 24));

    if (diasTranscurridos >= 5) {
      hacerBackup();
    }
  };

  const hacerBackup = () => {
    try {
      // CLAVES CORRECTAS según Proveedores.jsx
      const clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
      const deudas = JSON.parse(localStorage.getItem('deudas') || '[]');
      const proveedores = JSON.parse(localStorage.getItem('proveedores') || '[]');
      const facturas = JSON.parse(localStorage.getItem('facturasProveedores') || '[]'); // CORREGIDO
      const pagos = JSON.parse(localStorage.getItem('pagosProveedores') || '[]'); // CORREGIDO
      const verduleriaMeses = JSON.parse(localStorage.getItem('verduleriaMeses') || '[]');
      const verduleriaVentas = JSON.parse(localStorage.getItem('verduleriaVentas') || '[]');
      const verduleriaGastosFijos = JSON.parse(localStorage.getItem('verduleriaGastosFijos') || '[]');

      const wb = XLSX.utils.book_new();

      // HOJA 1: CLIENTES CON DEUDAS
      const clientesConDeudas = clientes.map(cliente => {
        const deudasCliente = deudas.filter(d => d.clienteId === cliente.id);
        const totalDeuda = deudasCliente.reduce((sum, d) => sum + d.monto, 0);
        const cantidadDeudas = deudasCliente.length;
        const ultimaDeuda = deudasCliente.length > 0 
          ? deudasCliente.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]
          : null;

        return {
          CLIENTE: cliente.nombre,
          TOTAL_ADEUDADO: totalDeuda,
          CANTIDAD_DEUDAS: cantidadDeudas,
          ULTIMA_DEUDA_FECHA: ultimaDeuda ? formatearFecha(ultimaDeuda.fecha) : '-',
          ULTIMA_DEUDA_MONTO: ultimaDeuda ? ultimaDeuda.monto : 0
        };
      });
      if (clientesConDeudas.length > 0) {
        const wsClientes = XLSX.utils.json_to_sheet(clientesConDeudas);
        aplicarFormatoMoneda(wsClientes, clientesConDeudas.length, 'B', 'E');
        XLSX.utils.book_append_sheet(wb, wsClientes, "Resumen Clientes");
      }

      // HOJA 2: DETALLE DEUDAS
      const detalleDeudas = deudas.map(deuda => {
        const cliente = clientes.find(c => c.id === deuda.clienteId);
        return {
          CLIENTE: cliente ? cliente.nombre : 'Desconocido',
          FECHA: formatearFecha(deuda.fecha),
          MONTO: deuda.monto
        };
      }).sort((a, b) => a.CLIENTE.localeCompare(b.CLIENTE));

      if (detalleDeudas.length > 0) {
        const wsDeudas = XLSX.utils.json_to_sheet(detalleDeudas);
        aplicarFormatoMoneda(wsDeudas, detalleDeudas.length, 'C');
        XLSX.utils.book_append_sheet(wb, wsDeudas, "Detalle Deudas");
      }

      // HOJA 3: PROVEEDORES CON FACTURAS
      const proveedoresConFacturas = proveedores.map(proveedor => {
        const facturasProveedor = facturas.filter(f => f.proveedorId === proveedor.id);
        const pagosProveedor = pagos.filter(p => p.proveedorId === proveedor.id);
        
        const totalFacturas = facturasProveedor.reduce((sum, f) => sum + f.monto, 0);
        const totalRechazos = facturasProveedor.reduce((sum, f) => sum + (f.rechazo || 0), 0);
        const totalPagado = pagosProveedor.reduce((sum, p) => sum + p.monto, 0);
        const saldoPendiente = totalFacturas - totalRechazos - totalPagado;

        return {
          PROVEEDOR: proveedor.nombre,
          TOTAL_FACTURAS: facturasProveedor.length,
          MONTO_FACTURAS: totalFacturas,
          TOTAL_RECHAZOS: totalRechazos,
          TOTAL_PAGADO: totalPagado,
          SALDO_PENDIENTE: saldoPendiente,
          CANTIDAD_PAGOS: pagosProveedor.length
        };
      });

      if (proveedoresConFacturas.length > 0) {
        const wsProveedores = XLSX.utils.json_to_sheet(proveedoresConFacturas);
        aplicarFormatoMoneda(wsProveedores, proveedoresConFacturas.length, 'C', 'D', 'E', 'F');
        XLSX.utils.book_append_sheet(wb, wsProveedores, "Resumen Proveedores");
      }

      // HOJA 4: DETALLE FACTURAS
      const detalleFacturas = facturas.map(factura => {
        const proveedor = proveedores.find(p => p.id === factura.proveedorId);
        const pagosFactura = pagos.filter(p => p.proveedorId === factura.proveedorId);
        const totalPagado = pagosFactura.reduce((sum, p) => sum + p.monto, 0);
        const saldo = factura.monto - (factura.rechazo || 0) - totalPagado;

        return {
          PROVEEDOR: proveedor ? proveedor.nombre : 'Desconocido',
          FECHA_FACTURA: formatearFecha(factura.fecha),
          VENCIMIENTO: formatearFecha(factura.fechaVencimiento),
          NUMERO: factura.numero,
          MONTO: factura.monto,
          RECHAZO: factura.rechazo || 0,
          SALDO: saldo
        };
      }).sort((a, b) => {
        const fechaA = a.VENCIMIENTO.split('/').reverse().join('-');
        const fechaB = b.VENCIMIENTO.split('/').reverse().join('-');
        return new Date(fechaB) - new Date(fechaA);
      });

      if (detalleFacturas.length > 0) {
        const wsFacturas = XLSX.utils.json_to_sheet(detalleFacturas);
        aplicarFormatoMoneda(wsFacturas, detalleFacturas.length, 'E', 'F', 'G');
        XLSX.utils.book_append_sheet(wb, wsFacturas, "Detalle Facturas");
      }

      // HOJA 5: DETALLE PAGOS
      const detallePagos = pagos.map(pago => {
        const proveedor = proveedores.find(p => p.id === pago.proveedorId);
        
        return {
          PROVEEDOR: proveedor ? proveedor.nombre : 'Desconocido',
          FECHA_PAGO: formatearFecha(pago.fecha),
          MONTO_PAGADO: pago.monto
        };
      }).sort((a, b) => {
        const fechaA = a.FECHA_PAGO.split('/').reverse().join('-');
        const fechaB = b.FECHA_PAGO.split('/').reverse().join('-');
        return new Date(fechaB) - new Date(fechaA);
      });

      if (detallePagos.length > 0) {
        const wsPagos = XLSX.utils.json_to_sheet(detallePagos);
        aplicarFormatoMoneda(wsPagos, detallePagos.length, 'C');
        XLSX.utils.book_append_sheet(wb, wsPagos, "Detalle Pagos");
      }

      // HOJA 6: RESUMEN VERDULERÍA
      const resumenVerduleria = verduleriaMeses.map(mes => {
        const ventasMes = verduleriaVentas.filter(v => v.mesId === mes.id);
        const gastosMes = verduleriaGastosFijos.filter(g => g.mesId === mes.id);

        const totalVentas = ventasMes.reduce((sum, v) => sum + v.venta, 0);
        const totalCostoMerc = ventasMes.reduce((sum, v) => sum + v.costoMercaderia, 0);
        const totalGastosVariables = ventasMes.reduce((sum, v) => sum + v.gastos, 0);
        const totalGastosFijos = gastosMes.reduce((sum, g) => sum + (parseFloat(g.verduleria) || 0), 0);
        const margenNeto = totalVentas - totalCostoMerc - totalGastosVariables - totalGastosFijos;

        return {
          MES: mes.nombre,
          TOTAL_VENTAS: totalVentas,
          COSTO_MERCADERIA: totalCostoMerc,
          GASTOS_VARIABLES: totalGastosVariables,
          GASTOS_FIJOS: totalGastosFijos,
          MARGEN_NETO: margenNeto,
          DIAS_TRABAJADOS: ventasMes.length
        };
      });

      if (resumenVerduleria.length > 0) {
        const wsResumenVerd = XLSX.utils.json_to_sheet(resumenVerduleria);
        aplicarFormatoMoneda(wsResumenVerd, resumenVerduleria.length, 'B', 'C', 'D', 'E', 'F');
        XLSX.utils.book_append_sheet(wb, wsResumenVerd, "Resumen Verdulería");
      }

      // HOJA 7: VENTAS DIARIAS
      const ventasDetalle = verduleriaVentas.map(venta => {
        const mes = verduleriaMeses.find(m => m.id === venta.mesId);
        return {
          MES: mes ? mes.nombre : 'Desconocido',
          FECHA: formatearFecha(venta.fecha),
          DIA: venta.diaSemana,
          COSTO_MERCADERIA: venta.costoMercaderia,
          GASTOS: venta.gastos,
          VENTA: venta.venta,
          MARGEN: venta.margen
        };
      }).sort((a, b) => {
        const fechaA = a.FECHA.split('/').reverse().join('-');
        const fechaB = b.FECHA.split('/').reverse().join('-');
        return new Date(fechaB) - new Date(fechaA);
      });

      if (ventasDetalle.length > 0) {
        const wsVentas = XLSX.utils.json_to_sheet(ventasDetalle);
        aplicarFormatoMoneda(wsVentas, ventasDetalle.length, 'D', 'E', 'F', 'G');
        XLSX.utils.book_append_sheet(wb, wsVentas, "Ventas Diarias");
      }

      // HOJA 8: GASTOS FIJOS
      const gastosDetalle = verduleriaGastosFijos
        .filter(g => (parseFloat(g.verduleria) || 0) > 0)
        .map(gasto => {
          const mes = verduleriaMeses.find(m => m.id === gasto.mesId);
          return {
            MES: mes ? mes.nombre : 'Desconocido',
            CONCEPTO: gasto.concepto,
            GASTO_TOTAL: gasto.total,
            PORCENTAJE: gasto.porcentaje,
            ASIGNADO_VERDULERIA: gasto.verduleria
          };
        });

      if (gastosDetalle.length > 0) {
        const wsGastos = XLSX.utils.json_to_sheet(gastosDetalle);
        aplicarFormatoMoneda(wsGastos, gastosDetalle.length, 'C', 'E');
        XLSX.utils.book_append_sheet(wb, wsGastos, "Gastos Fijos");
      }

      const ahora = new Date();
      const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
      const hora = `${String(ahora.getHours()).padStart(2, '0')}-${String(ahora.getMinutes()).padStart(2, '0')}`;
      const nombreArchivo = `Backup_Cherry_${fecha}_${hora}.xlsx`;

      XLSX.writeFile(wb, nombreArchivo);
      localStorage.setItem('ultimoBackup', ahora.toISOString());

      console.log(`✅ Backup automático realizado: ${nombreArchivo}`);
    } catch (error) {
      console.error('Error al hacer backup automático:', error);
    }
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString) return '';
    const fecha = new Date(fechaString + 'T00:00:00');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  const aplicarFormatoMoneda = (ws, numRows, ...columnas) => {
    const currencyFormat = '"$"#,##0.00';
    for (let i = 2; i <= numRows + 1; i++) {
      columnas.forEach(col => {
        if (ws[col + i]) {
          ws[col + i].z = currencyFormat;
        }
      });
    }
  };

  return null;
};

export default AutoBackup;