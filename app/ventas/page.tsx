"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

// 📝 DEFINICIÓN DE INTERFACES
interface Venta {
  id: number;
  fecha_hora: string;
  total_venta: number;
}

interface VentaItem {
  nombre: string;
  cantidad_vendida: number;
  tipo_medida: string;
  precio_unitario_momento: number;
  subtotal: number;
  combo_id?: number | null;
}

interface TicketDetalle {
  venta: Venta;
  items: VentaItem[];
}

export default function HistorialVentas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [periodo, setPeriodo] = useState('hoy');
  const [cargando, setCargando] = useState<boolean>(true);
  const [ticketActivo, setTicketActivo] = useState<TicketDetalle | null>(null);
  
  // 🔢 ESTADOS DE PAGINACIÓN
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Estados para el Buscador por ID
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [idABuscar, setIdABuscar] = useState('');

  // 🔄 Carga de ventas filtradas y paginadas
  const cargarVentas = () => {
    setCargando(true);
    fetch(`/api/ventas?periodo=${periodo}&pagina=${pagina}`)
      .then(res => res.json())
      .then((datos) => {
        setVentas(datos.ventas || []);
        setTotalPaginas(datos.totalPaginas || 1);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  };

  useEffect(() => {
    cargarVentas();
  }, [periodo, pagina]);

  useEffect(() => {
    setPagina(1);
  }, [periodo]);

  // 🔍 Función para buscar y ver ticket
  const verTicket = async (id: string | number) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/ventas/${id}`);
      if (!res.ok) throw new Error();
      const datos: TicketDetalle = await res.json();
      setTicketActivo(datos);
      setMostrarBuscador(false);
      setIdABuscar('');
    } catch (error) {
      alert("❌ Ticket no encontrado");
    }
  };

  const imprimirTicket = () => {
    window.print();
  };

  const formatearFecha = (fechaString: string) => {
    const opciones: Intl.DateTimeFormatOptions = {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    };
    return new Date(fechaString).toLocaleDateString('es-AR', opciones);
  };

  if (cargando && ventas.length === 0) {
    return <div className="min-h-screen flex items-center justify-center text-3xl font-bold text-gray-400 bg-gradient-to-br from-[#e0e5ec] to-[#f4f7f6]">Cargando historial... 🧾</div>;
  }

  return (
    <>
      {/* 🟢 INTERFAZ WEB */}
      <div className="min-h-screen bg-gradient-to-br from-[#e0e5ec] to-[#f4f7f6] text-gray-800 font-sans p-4 md:p-8 lg:p-10 print:hidden">

        {/* ENCABEZADO */}
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight uppercase italic">🧾 Historial</h2>
            <p className="text-xl text-gray-500 mt-2 font-medium">Ventas de: <span className="text-[#b12431] font-bold capitalize">{periodo}</span></p>
          </div>
          <div className="flex flex-wrap gap-3">
             <button 
               onClick={() => setMostrarBuscador(true)}
               className="px-6 py-4 bg-white/80 backdrop-blur-md text-blue-600 font-black rounded-2xl shadow-sm border border-blue-100 hover:bg-white transition-all flex items-center gap-2"
             >
               🔍 BUSCAR POR ID
             </button>
             <Link href="/" className="px-8 py-4 bg-white/60 backdrop-blur-md text-gray-600 font-bold rounded-2xl hover:bg-white hover:text-[#b12431] shadow-sm border border-white/50 text-xl transition-all">
               ← Volver
             </Link>
          </div>
        </div>

        {/* SELECTOR DE PERÍODO */}
        <div className="max-w-5xl mx-auto mb-8 flex bg-white/40 backdrop-blur-md p-1.5 rounded-[2rem] border border-white/60 w-fit">
          {['hoy', 'semana', 'mes', 'todos'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-8 py-3 rounded-[1.5rem] font-black transition-all text-sm uppercase ${periodo === p ? 'bg-gray-800 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* TABLA DE VENTAS */}
        <div className="max-w-5xl mx-auto bg-white/60 backdrop-blur-2xl rounded-[2.5rem] shadow-sm border border-white/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-white/40 border-b border-white/60 text-gray-500 text-lg uppercase tracking-wider font-black">
                  <th className="p-6 text-center">Nº Ticket</th>
                  <th className="p-6">Fecha y Hora</th>
                  <th className="p-6 text-right">Total</th>
                  <th className="p-6 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-xl font-bold">
                {ventas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-400 font-bold text-2xl">Sin ventas en este período.</td>
                  </tr>
                ) : (
                  ventas.map((venta) => (
                    <tr key={venta.id} className="border-b border-gray-100/50 hover:bg-white/80 transition-all">
                      <td className="p-6 text-center font-black text-gray-400 font-mono">#{venta.id.toString().padStart(5, '0')}</td>
                      <td className="p-6">{formatearFecha(venta.fecha_hora)}</td>
                      <td className="p-6 text-right font-black text-[#b12431] text-2xl">${venta.total_venta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-6 text-center">
                        <button
                          onClick={() => verTicket(venta.id)}
                          className="px-6 py-3 bg-blue-50/80 hover:bg-white text-blue-600 font-bold rounded-2xl shadow-sm border border-blue-100/50 transition-all uppercase text-sm"
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

        {/* 🔘 CONTROLES DE PAGINACIÓN */}
        {totalPaginas > 1 && (
          <div className="max-w-5xl mx-auto mt-8 flex justify-center items-center gap-6">
            <button 
              disabled={pagina === 1}
              onClick={() => setPagina(pagina - 1)}
              className="w-14 h-14 bg-white/80 rounded-2xl shadow-sm border border-white flex items-center justify-center font-black text-2xl disabled:opacity-30 hover:bg-white hover:scale-105 active:scale-95 transition-all text-gray-600"
            >
              ←
            </button>
            <div className="bg-white/40 backdrop-blur-md px-8 py-3 rounded-2xl border border-white/60 font-black text-gray-500 uppercase text-xs tracking-widest flex items-center gap-2">
              PÁGINA <span className="text-gray-800 text-xl">{pagina}</span> DE {totalPaginas}
            </div>
            <button 
              disabled={pagina === totalPaginas}
              onClick={() => setPagina(pagina + 1)}
              className="w-14 h-14 bg-white/80 rounded-2xl shadow-sm border border-white flex items-center justify-center font-black text-2xl disabled:opacity-30 hover:bg-white hover:scale-105 active:scale-95 transition-all text-gray-600"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* 🔍 POPUP BUSCADOR POR ID */}
      {mostrarBuscador && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md p-8 animate-fade-in-up">
            <h3 className="text-2xl font-black text-gray-800 mb-2 uppercase italic tracking-tighter">Buscar por Nº</h3>
            <p className="text-gray-400 font-medium mb-6">Ingresá el número de ticket</p>
            <input 
              autoFocus
              type="number"
              className="w-full text-5xl font-black text-center p-6 bg-gray-50 border-2 border-gray-100 rounded-[2rem] outline-none focus:border-blue-400 transition-all mb-6"
              value={idABuscar}
              onChange={(e) => setIdABuscar(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verTicket(idABuscar)}
              placeholder="000"
            />
            <div className="flex gap-3">
              <button onClick={() => setMostrarBuscador(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl">Cerrar</button>
              <button onClick={() => verTicket(idABuscar)} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg">BUSCAR</button>
            </div>
          </div>
        </div>
      )}

      {/* 🪟 MODAL VISTA PREVIA TICKET WEB */}
      {/* CORRECCIÓN: He añadido `print:hidden` al contenedor principal del modal */}
      {ticketActivo && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
            <div className="bg-gray-100 p-4 flex justify-between items-center border-b">
              <h3 className="font-bold text-gray-600 uppercase text-xs tracking-widest">Detalle del Ticket</h3>
              <button onClick={() => setTicketActivo(null)} className="text-2xl font-black text-gray-400">✕</button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto bg-white">
              <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Pollería Dumont</h2>
                <p className="text-gray-500 font-mono text-xs">#{ticketActivo.venta.id.toString().padStart(5, '0')}</p>
                <p className="text-gray-500 font-mono text-xs">{formatearFecha(ticketActivo.venta.fecha_hora)}</p>
              </div>

              <div className="space-y-4 mb-6 font-mono text-sm">
                {ticketActivo.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start border-b border-gray-50 pb-2 mb-2">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-gray-800 uppercase text-[13px] leading-tight">{item.nombre}</span>
                        {item.combo_id && <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-[9px] font-black italic">COMBO</span>}
                      </div>
                      <span className="text-[11px] text-gray-400 font-bold">{item.cantidad_vendida} {item.tipo_medida} x ${item.precio_unitario_momento.toLocaleString('es-AR')}</span>
                    </div>
                    <span className="font-black text-gray-800 text-sm">${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed border-gray-300 pt-4 flex justify-between items-center">
                <span className="font-black text-gray-400 uppercase italic">Total</span>
                <span className="font-black text-3xl text-gray-900 tracking-tighter">${ticketActivo.venta.total_venta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex gap-3">
              <button onClick={() => setTicketActivo(null)} className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl uppercase text-xs">Cerrar</button>
              <button onClick={imprimirTicket} className="flex-1 py-3 bg-[#b12431] text-white font-black rounded-xl shadow-lg uppercase text-xs">🖨️ Imprimir</button>
            </div>
          </div>
        </div>
      )}

      {/* 🖨️ TICKET TÉRMICO (Solo Impresión) - Diseño Original Restaurado */}
      {ticketActivo && (
        <div className="hidden print:block w-[58mm] p-2 bg-white text-black font-mono text-[12px] leading-tight">
          <div className="text-center mb-3">
            <h1 className="text-[16px] font-black uppercase m-0">POLLERÍA DUMONT</h1>
            <p className="m-0">Ticket #{ticketActivo.venta.id.toString().padStart(5, '0')}</p>
            <p className="m-0">{formatearFecha(ticketActivo.venta.fecha_hora)}</p>
          </div>
          <div className="border-b border-black border-dashed mb-2"></div>
          <table className="w-full mb-2 border-collapse">
            <tbody>
              {ticketActivo.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1 align-top">
                    <div className="font-bold uppercase">
                      {item.nombre} {item.combo_id ? '(COMBO)' : ''}
                    </div>
                    <div>
                      {item.cantidad_vendida} {item.tipo_medida} x ${item.precio_unitario_momento.toLocaleString('es-AR')}
                    </div>
                  </td>
                  <td className="py-1 text-right font-bold align-bottom">
                    ${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-black border-dashed pt-2 flex justify-between items-center">
            <span className="font-bold text-[14px]">TOTAL:</span>
            <span className="font-black text-[16px]">
              ${ticketActivo.venta.total_venta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-center font-bold text-[10px] mt-4 uppercase">¡Gracias por su compra!</p>
        </div>
      )}
    </>
  );
}