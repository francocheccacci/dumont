"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

// 📝 DEFINICIÓN DE INTERFACES ACTUALIZADAS
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
  combo_id?: number | null; // Identificador para combos
}

interface TicketDetalle {
  venta: Venta;
  items: VentaItem[];
}

export default function HistorialVentas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [ticketActivo, setTicketActivo] = useState<TicketDetalle | null>(null);
  const [cargandoTicket, setCargandoTicket] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/ventas')
      .then(res => res.json())
      .then((datos: Venta[]) => {
        setVentas(datos);
        setCargando(false);
      });
  }, []);

  const verTicket = async (id: number) => {
    setCargandoTicket(true);
    try {
      const res = await fetch(`/api/ventas/${id}`);
      const datos: TicketDetalle = await res.json();
      setTicketActivo(datos);
    } catch (error) {
      alert("Error al cargar el ticket");
    }
    setCargandoTicket(false);
  };

  const imprimirTicket = () => {
    window.print();
  };

  const formatearFecha = (fechaString: string) => {
    const opciones: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(fechaString).toLocaleDateString('es-AR', opciones);
  };

  if (cargando) {
    return <div className="min-h-screen flex items-center justify-center text-3xl font-bold text-gray-400 bg-gradient-to-br from-[#e0e5ec] to-[#f4f7f6]">Cargando historial... 🧾</div>;
  }

  return (
    <>
      {/* 🟢 LA INTERFAZ WEB */}
      <div className="min-h-screen bg-gradient-to-br from-[#e0e5ec] to-[#f4f7f6] text-gray-800 font-sans p-4 md:p-8 lg:p-10 print:hidden">

        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight uppercase italic">🧾 Historial</h2>
            <p className="text-xl text-gray-500 mt-2 font-medium">Tickets emitidos recientemente</p>
          </div>
          <Link href="/" className="px-8 py-4 bg-white/60 backdrop-blur-md text-gray-600 font-bold rounded-2xl hover:bg-white hover:text-[#b12431] shadow-sm border border-white/50 text-xl transition-all">
            ← Volver a Caja
          </Link>
        </div>

        <div className="max-w-5xl mx-auto bg-white/60 backdrop-blur-2xl rounded-[2.5rem] shadow-sm border border-white/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-white/40 border-b border-white/60 text-gray-500 text-lg uppercase tracking-wider">
                  <th className="p-6 font-black text-center">Nº Ticket</th>
                  <th className="p-6 font-black">Fecha y Hora</th>
                  <th className="p-6 font-black text-right">Total</th>
                  <th className="p-6 font-black text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-xl font-bold">
                {ventas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-400 font-bold text-2xl">Sin ventas.</td>
                  </tr>
                ) : (
                  ventas.map((venta) => (
                    <tr key={venta.id} className="border-b border-gray-100/50 hover:bg-white/80 transition-all">
                      <td className="p-6 text-center font-black text-gray-400">#{venta.id.toString().padStart(5, '0')}</td>
                      <td className="p-6">{formatearFecha(venta.fecha_hora)}</td>
                      <td className="p-6 text-right font-black text-[#b12431] text-2xl">${venta.total_venta.toLocaleString('es-AR')}</td>
                      <td className="p-6 text-center">
                        <button
                          onClick={() => verTicket(venta.id)}
                          className="px-6 py-3 bg-blue-50/80 hover:bg-white text-blue-600 font-bold rounded-2xl shadow-sm border border-blue-100/50 transition-all"
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

        {/* 🪟 MODAL TICKET WEB (Actualizado para Combos) */}
        {ticketActivo && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
              <div className="bg-gray-100 p-4 flex justify-between items-center border-b">
                <h3 className="font-bold text-gray-600 uppercase text-xs tracking-widest">Vista Previa</h3>
                <button onClick={() => setTicketActivo(null)} className="text-2xl font-black text-gray-400">✕</button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto bg-white">
                <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter">Pollería Don Pepe</h2>
                  <p className="text-gray-500 font-mono text-xs">TICKET #{ticketActivo.venta.id.toString().padStart(5, '0')}</p>
                  <p className="text-gray-500 font-mono text-xs">{formatearFecha(ticketActivo.venta.fecha_hora)}</p>
                </div>

                <div className="space-y-4 mb-6 font-mono text-sm">
                  {ticketActivo.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start border-b border-gray-50 pb-2 mb-2">
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-gray-800 uppercase text-[13px] leading-tight">
                            {item.nombre}
                          </span>
                          {item.combo_id && (
                            <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-[9px] font-black italic">
                              COMBO
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 font-bold">
                          {item.cantidad_vendida} {item.tipo_medida} x ${item.precio_unitario_momento.toLocaleString('es-AR')}
                        </span>
                      </div>
                      <span className="font-black text-gray-800 text-sm">
                        ${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-dashed border-gray-300 pt-4 flex justify-between items-center">
                  <span className="font-black text-gray-400 uppercase italic">Total</span>
                  <span className="font-black text-3xl text-gray-900 tracking-tighter">${ticketActivo.venta.total_venta.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t flex gap-3">
                <button onClick={() => setTicketActivo(null)} className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl uppercase text-xs">Cerrar</button>
                <button onClick={imprimirTicket} className="flex-1 py-3 bg-[#b12431] text-white font-black rounded-xl shadow-lg uppercase text-xs">🖨️ Imprimir</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🖨️ TICKET TÉRMICO (Solo Impresión) */}
      {ticketActivo && (
        <div className="hidden print:block w-[58mm] p-2 bg-white text-black font-mono text-[11px] leading-tight">
          <div className="text-center mb-2">
            <h1 className="text-[14px] font-black uppercase m-0">Pollería Don Pepe</h1>
            <p className="m-0">Ticket #{ticketActivo.venta.id.toString().padStart(5, '0')}</p>
            <p className="m-0">{formatearFecha(ticketActivo.venta.fecha_hora)}</p>
          </div>
          <div className="border-b border-black border-dashed mb-2"></div>
          <table className="w-full mb-2">
            <tbody>
              {ticketActivo.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start border-b border-gray-50 pb-2 mb-2">
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-gray-800 uppercase text-[13px] leading-tight">
                        {item.nombre}
                      </span>
                      {item.combo_id && (
                        <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-[9px] font-black italic">
                          COMBO
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 font-bold">
                      {item.cantidad_vendida} {item.tipo_medida} x ${item.precio_unitario_momento.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <span className="font-black text-gray-800 text-sm">
                    ${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </tbody>
          </table>
          <div className="border-t border-black border-dashed pt-2 flex justify-between items-center text-[13px]">
            <span className="font-bold uppercase">Total:</span>
            <span className="font-black">${ticketActivo.venta.total_venta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
          </div>
          <p className="text-center font-bold text-[9px] mt-4 uppercase">¡Gracias por elegirnos!</p>
        </div>
      )}
    </>
  );
}