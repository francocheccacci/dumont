"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ticketActivo, setTicketActivo] = useState(null);
  const [cargandoTicket, setCargandoTicket] = useState(false);

  useEffect(() => {
    fetch('/api/ventas')
      .then(res => res.json())
      .then(datos => {
        setVentas(datos);
        setCargando(false);
      });
  }, []);

  const verTicket = async (id) => {
    setCargandoTicket(true);
    try {
      const res = await fetch(`/api/ventas/${id}`);
      const datos = await res.json();
      setTicketActivo(datos);
    } catch (error) {
      alert("Error al cargar el ticket");
    }
    setCargandoTicket(false);
  };

  const imprimirTicket = () => {
    window.print(); // Esta orden abre la ventana de impresión del navegador
  };

  const formatearFecha = (fechaString) => {
    const opciones = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaString).toLocaleDateString('es-AR', opciones);
  };

  if (cargando) {
    return <div className="min-h-screen flex items-center justify-center text-3xl font-bold text-gray-400 bg-gradient-to-br from-[#e0e5ec] to-[#f4f7f6]">Cargando historial... 🧾</div>;
  }

  return (
    <>
      {/* 🟢 LA INTERFAZ WEB (Se oculta al imprimir con "print:hidden") */}
      <div className="min-h-screen bg-gradient-to-br from-[#e0e5ec] to-[#f4f7f6] text-gray-800 font-sans p-4 md:p-8 lg:p-10 print:hidden">
        
        {/* Encabezado */}
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight">🧾 Historial de Ventas</h2>
            <p className="text-xl text-gray-500 mt-2 font-medium">Revisa y reimprime tickets pasados</p>
          </div>
          <Link href="/" className="px-8 py-4 bg-white/60 backdrop-blur-md text-gray-600 font-bold rounded-2xl hover:bg-white hover:text-[#b12431] shadow-sm transition-all border border-white/50 text-xl flex items-center gap-2">
            ← Volver a Caja
          </Link>
        </div>

        {/* Tabla de Ventas (Estilo Cristal) */}
        <div className="max-w-5xl mx-auto bg-white/60 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-white/40 border-b border-white/60 text-gray-500 text-lg uppercase tracking-wider">
                  <th className="p-6 font-black text-center">Nº Ticket</th>
                  <th className="p-6 font-black">Fecha y Hora</th>
                  <th className="p-6 font-black text-right">Total Venta</th>
                  <th className="p-6 font-black text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-xl">
                {ventas.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-gray-400 font-bold text-2xl">
                      Aún no hay ventas registradas.
                    </td>
                  </tr>
                ) : (
                  ventas.map((venta) => (
                    <tr key={venta.id} className="border-b border-gray-100/50 hover:bg-white/80 transition-all">
                      <td className="p-6 text-center font-black text-gray-400">#{venta.id.toString().padStart(5, '0')}</td>
                      <td className="p-6 font-bold text-gray-700">{formatearFecha(venta.fecha_hora)}</td>
                      <td className="p-6 text-right font-black text-[#b12431] text-2xl">${venta.total_venta.toLocaleString('es-AR')}</td>
                      <td className="p-6 text-center">
                        <button 
                          onClick={() => verTicket(venta.id)}
                          className="px-6 py-3 bg-blue-50/80 hover:bg-white text-blue-600 font-bold rounded-2xl shadow-sm border border-blue-100/50 transition-all flex items-center gap-2 mx-auto"
                        >
                          👁️ Ver Ticket
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🪟 MODAL DEL TICKET (Diseño Web) */}
        {ticketActivo && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="bg-gray-100 p-4 flex justify-between items-center border-b">
                <h3 className="font-bold text-gray-600">Vista Previa del Ticket</h3>
                <button onClick={() => setTicketActivo(null)} className="text-2xl font-black text-gray-400 hover:text-red-500">✕</button>
              </div>

              {/* Contenedor del ticket web (con scroll si es muy largo) */}
              <div className="p-6 flex-1 overflow-y-auto bg-white">
                <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                  <h2 className="text-2xl font-black uppercase">POLLERÍA DON PEPE</h2>
                  <p className="text-gray-500 text-sm">El mejor pollo de la zona</p>
                  <p className="text-gray-500 mt-2 font-mono text-sm">Ticket #{ticketActivo.venta.id.toString().padStart(5, '0')}</p>
                  <p className="text-gray-500 font-mono text-sm">{formatearFecha(ticketActivo.venta.fecha_hora)}</p>
                </div>

                <div className="space-y-3 mb-4 font-mono text-sm">
                  {ticketActivo.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <span className="block font-bold">{item.nombre}</span>
                        <span className="text-gray-500">{item.cantidad_vendida} {item.tipo_medida} x ${item.precio_unitario_momento}</span>
                      </div>
                      <span className="font-bold">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-dashed border-gray-300 pt-4 flex justify-between items-center text-xl">
                  <span className="font-bold">TOTAL:</span>
                  <span className="font-black text-2xl">${ticketActivo.venta.total_venta.toLocaleString('es-AR')}</span>
                </div>
                
                <p className="text-center text-gray-500 mt-6 font-bold uppercase text-sm">¡Gracias por su compra!</p>
              </div>

              <div className="p-4 bg-gray-50 border-t flex gap-3">
                <button onClick={() => setTicketActivo(null)} className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl">Cerrar</button>
                <button onClick={imprimirTicket} className="flex-1 py-3 bg-[#b12431] text-white font-black rounded-xl shadow-lg flex justify-center items-center gap-2">
                  🖨️ IMPRIMIR
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* 🖨️ EL TICKET REAL DE IMPRESIÓN (Solo visible al imprimir) */}
      {/* Usamos print:block para que solo aparezca en el papel, y w-[58mm] para ajustarlo al rollito térmico */}
      {ticketActivo && (
        <div className="hidden print:block w-[58mm] p-2 bg-white text-black font-mono text-[12px] leading-tight mx-auto">
          <div className="text-center mb-3">
            <h1 className="text-[16px] font-black uppercase m-0">POLLERÍA DON PEPE</h1>
            <p className="m-0 text-[10px]">El mejor pollo de la zona</p>
            <p className="m-0 mt-1">Ticket #{ticketActivo.venta.id.toString().padStart(5, '0')}</p>
            <p className="m-0">{formatearFecha(ticketActivo.venta.fecha_hora)}</p>
          </div>
          
          <div className="border-b border-black border-dashed mb-2"></div>

          <table className="w-full mb-2">
            <tbody>
              {ticketActivo.items.map((item, idx) => (
                <tr key={idx} className="align-top">
                  <td className="py-1">
                    <div className="font-bold truncate max-w-[35mm]">{item.nombre}</div>
                    <div className="text-[10px]">{item.cantidad_vendida} {item.tipo_medida} x ${item.precio_unitario_momento}</div>
                  </td>
                  <td className="py-1 text-right font-bold align-bottom">
                    ${item.subtotal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-black border-dashed pt-2 flex justify-between items-center mb-4">
            <span className="font-bold text-[14px]">TOTAL:</span>
            <span className="font-black text-[16px]">${ticketActivo.venta.total_venta}</span>
          </div>

          <p className="text-center font-bold text-[10px] uppercase mt-4">¡Gracias por su compra!</p>
          <p className="text-center text-[8px] mt-1">Sistema diseñado a medida</p>
        </div>
      )}
    </>
  );
}