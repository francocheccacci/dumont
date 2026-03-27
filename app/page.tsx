"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// 📝 Interfaces actualizadas
interface Producto {
  id: number;
  nombre: string;
  precio_final: number;
  tipo_medida: string;
  categoria_nombre?: string;
}

interface Combo {
  id: number;
  nombre: string;
  precio_final: number;
  // Los combos siempre son por unidad en la venta
}

interface ItemCarrito {
  id: number;
  nombre: string;
  precio_final: number;
  tipo_medida: string;
  cantidad: number;
  subtotal: number;
  esCombo?: boolean; // Para que la API sepa si descontar ingredientes o stock simple
}

export default function CajaRegistradora() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [tabActiva, setTabActiva] = useState<'Frescos' | 'Congelados' | 'Combos'>('Frescos');
  
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [productoActivo, setProductoActivo] = useState<any | null>(null);
  const [pesoTeclado, setPesoTeclado] = useState<string>("");

  // 🔄 Carga inicial de datos vinculados
  useEffect(() => {
    Promise.all([
      fetch('/api/productos').then(res => res.json()),
      fetch('/api/combos').then(res => res.json())
    ]).then(([dataProd, dataCombos]) => {
      setProductos(dataProd || []);
      setCombos(dataCombos || []);
    }).catch(err => console.error("Error cargando datos:", err));
  }, []);

  const totalVenta = carrito.reduce((suma, item) => suma + item.subtotal, 0);

  // --- LÓGICA DE TECLADO ---
  const presionarTecla = (tecla: string) => {
    setPesoTeclado((prev) => {
      if (tecla === '.' && prev.includes('.')) return prev;
      return prev + tecla;
    });
  };

  const borrarUltimo = () => setPesoTeclado((prev) => prev.slice(0, -1));
  const vaciarTeclado = () => setPesoTeclado("");

  const confirmarProducto = useCallback(() => {
    if (!productoActivo || pesoTeclado === "" || isNaN(parseFloat(pesoTeclado))) return;
    
    const cantidad = parseFloat(pesoTeclado);
    const subtotal = productoActivo.precio_final * cantidad;

    const nuevoItem: ItemCarrito = {
      id: productoActivo.id,
      nombre: productoActivo.nombre,
      precio_final: productoActivo.precio_final,
      tipo_medida: productoActivo.tipo_medida || 'unidad',
      cantidad,
      subtotal,
      esCombo: tabActiva === 'Combos'
    };

    setCarrito((prev) => [...prev, nuevoItem]);
    setProductoActivo(null);
    setPesoTeclado("");
  }, [productoActivo, pesoTeclado, tabActiva]);

  // Manejo de teclado físico
  useEffect(() => {
    const manejarTecladoFisico = (e: KeyboardEvent) => {
      if (!productoActivo) return;
      if (e.key >= '0' && e.key <= '9') presionarTecla(e.key);
      else if (e.key === '.' || e.key === ',') presionarTecla('.');
      else if (e.key === 'Backspace') borrarUltimo();
      else if (e.key === 'Enter') confirmarProducto();
      else if (e.key === 'Escape') { setProductoActivo(null); vaciarTeclado(); }
    };
    window.addEventListener('keydown', manejarTecladoFisico);
    return () => window.removeEventListener('keydown', manejarTecladoFisico);
  }, [productoActivo, confirmarProducto]);

  const vaciarCaja = () => {
    setCarrito([]);
    setProductoActivo(null);
    setPesoTeclado("");
  };

  const procesarCobro = async () => {
    if (carrito.length === 0) return;
    try {
      const respuesta = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrito, total: totalVenta }),
      });
      if (respuesta.ok) {
        alert("✨ ¡Venta procesada con éxito!");
        vaciarCaja();
      } else alert("❌ Error al procesar la venta.");
    } catch (error) {
      alert("❌ Error de conexión.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-gradient-to-br from-[#e0e5ec] to-[#f4f7f6] text-gray-800 font-sans p-4 lg:p-6 gap-6 overflow-hidden">
      
      {/* 🟢 PANEL 1: CATÁLOGO CON TABS */}
      <div className="w-full lg:w-1/3 h-[45vh] lg:h-full flex flex-col bg-white/60 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] shadow-sm overflow-hidden z-0 transition-all">
        
        {/* Cabecera y Links */}
        <div className="p-6 pb-2 flex flex-wrap justify-between items-center gap-2">
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter italic uppercase">Productos</h2>
          <div className="flex gap-2">
            <Link href="/productos" className="bg-white/80 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-gray-500 hover:text-[#b12431] shadow-sm border border-gray-100">Inventario</Link>
            <Link href="/estadisticas" className="bg-white/80 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-gray-500 hover:text-blue-600 shadow-sm border border-gray-100">Stats</Link>
            <Link href="/ventas" className="bg-white/80 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-gray-500 hover:text-[#b12431] shadow-sm border border-gray-100">Ventas</Link>

          </div>
        </div>

        {/* 🔘 SELECTOR DE PESTAÑAS */}
        <div className="px-6 py-4">
          <div className="flex bg-gray-200/50 backdrop-blur-md p-1 rounded-2xl border border-white/40">
            {['Frescos', 'Congelados', 'Combos'].map((tab) => (
              <button
                key={tab}
                onClick={() => { setTabActiva(tab as any); setProductoActivo(null); }}
                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                  tabActiva === tab 
                  ? 'bg-white text-gray-800 shadow-sm scale-100' 
                  : 'text-gray-400 hover:text-gray-600 scale-95'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            {/* Renderizado dinámico según Tab */}
            {(tabActiva === 'Combos' ? combos : productos.filter(p => p.categoria_nombre === tabActiva)).map((item) => (
              <button
                key={item.id}
                onClick={() => { setProductoActivo(item); setPesoTeclado(""); }}
                className={`relative h-32 rounded-[2rem] text-xl font-black transition-all duration-300 flex flex-col items-center justify-center leading-tight overflow-hidden ${
                  productoActivo?.id === item.id
                    ? "bg-gradient-to-br from-[#b12431] to-[#d93846] text-white shadow-lg shadow-red-500/30 scale-95" 
                    : "bg-white/80 text-gray-700 border border-white/80 hover:border-red-200 hover:shadow-md hover:-translate-y-1 backdrop-blur-md"
                }`}
              >
                <span className="text-center px-2 z-10 uppercase tracking-tighter">{item.nombre}</span>
                <span className={`text-sm font-bold mt-2 z-10 ${productoActivo?.id === item.id ? 'text-red-100' : 'text-gray-400'}`}>
                  ${item.precio_final}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🟢 PANEL 2: TECLADO / BALANZA */}
      <div className={`${
          productoActivo ? "fixed inset-0 z-50 p-4 bg-gray-900/40 backdrop-blur-md flex items-center justify-center lg:p-0 lg:bg-transparent lg:backdrop-blur-none" : "hidden"
        } lg:relative lg:z-0 lg:flex lg:w-1/3 lg:h-full flex-col`}
      >
        <div className="w-full h-full bg-white/80 backdrop-blur-2xl border border-white/60 rounded-[3rem] shadow-xl flex flex-col p-6 lg:p-8 relative overflow-hidden">
          
          {!productoActivo ? (
            <div className="hidden lg:flex flex-col items-center justify-center h-full text-center text-gray-400">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner text-6xl opacity-20">🛒</div>
              <h3 className="text-2xl font-black text-gray-500 uppercase italic">Esperando selección</h3>
              <p className="text-sm mt-2 font-bold opacity-50">Toca un producto o combo</p>
            </div>
          ) : (
            <>
              <button onClick={() => setProductoActivo(null)} className="lg:hidden absolute top-6 left-6 text-gray-500 bg-white w-12 h-12 rounded-full shadow-md flex items-center justify-center text-2xl font-bold">✕</button>

              <div className="text-center mb-8 mt-12 lg:mt-0">
                <h2 className="text-3xl font-black text-gray-800 tracking-tight mb-2 uppercase italic">{productoActivo.nombre}</h2>
                <div className="inline-block bg-white/80 px-6 py-2 rounded-2xl text-gray-500 font-black border border-gray-100 shadow-sm">
                  ${productoActivo.precio_final} / {productoActivo.tipo_medida || 'U.'}
                </div>
              </div>
              
              <div className="text-center mb-8 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-200 to-red-50 rounded-[2.5rem] blur opacity-30"></div>
                <div className="relative bg-white py-8 rounded-[2rem] border border-gray-100 shadow-inner flex items-center justify-center gap-3">
                  <span className="text-7xl lg:text-8xl font-black text-gray-800 tracking-tighter">{pesoTeclado || "0"}</span>
                  <span className="text-2xl text-gray-400 font-black mt-4 uppercase">{productoActivo.tipo_medida || 'U.'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 flex-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button key={num} onClick={() => presionarTecla(num.toString())} className="bg-white text-4xl font-black rounded-[1.5rem] text-gray-700 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all border border-gray-50">{num}</button>
                ))}
                <button onClick={vaciarTeclado} className="bg-red-50 text-red-500 text-3xl font-black rounded-[1.5rem] hover:bg-red-100 transition-all uppercase">C</button>
                <button onClick={() => presionarTecla("0")} className="bg-white text-4xl font-black rounded-[1.5rem] text-gray-700 shadow-sm border border-gray-50">0</button>
                <button onClick={borrarUltimo} className="bg-gray-100 text-gray-600 text-3xl font-black rounded-[1.5rem] hover:bg-gray-200 transition-all flex items-center justify-center">⌫</button>
              </div>
              
              <button onClick={confirmarProducto} className="w-full mt-6 h-24 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-3xl font-black rounded-[2rem] shadow-lg shadow-green-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center">AGREGAR</button>
            </>
          )}
        </div>
      </div>

      {/* 🟢 PANEL 3: TICKET (Tu diseño original) */}
      <div className="w-full lg:w-1/3 h-[50vh] lg:h-full bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] shadow-sm flex flex-col z-0 overflow-hidden relative">
        <div className="p-6 bg-white/50 border-b border-gray-100 flex items-center gap-3">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h2 className="text-xl font-black text-gray-700 uppercase italic">Ticket Abierto</h2>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-30">
              <span className="text-6xl mb-4 grayscale">🧾</span>
              <p className="text-xl font-black text-gray-400 uppercase italic">Caja vacía</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {carrito.map((item, index) => (
                <li key={index} className="flex justify-between items-center text-lg bg-white/80 p-4 rounded-2xl shadow-sm border border-white transition-all hover:scale-[1.01]">
                  <div className="flex-1">
                    <span className="font-black block text-gray-800 uppercase text-sm tracking-tight">{item.nombre}</span>
                    <span className="text-xs font-bold text-gray-400">{item.cantidad} {item.tipo_medida} x ${item.precio_final}</span>
                  </div>
                  <span className="font-black text-2xl text-[#b12431] ml-4 tracking-tighter">${item.subtotal.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-6 bg-white/90 backdrop-blur-xl border-t border-gray-100 z-10">
          <div className="flex justify-between items-end mb-6 px-2">
            <span className="text-2xl font-black text-gray-400 uppercase italic">Total</span>
            <span className="text-6xl font-black text-gray-800 tracking-tighter leading-none">${totalVenta.toFixed(2)}</span>
          </div>
          
          <div className="flex gap-4">
            <button onClick={vaciarCaja} disabled={carrito.length === 0} className="w-24 lg:w-32 h-20 bg-gray-100 text-gray-400 font-black rounded-[1.5rem] hover:bg-red-50 hover:text-red-400 disabled:opacity-30 transition-all uppercase">✕</button>
            <button onClick={procesarCobro} disabled={carrito.length === 0} className="flex-1 h-20 bg-gradient-to-r from-[#b12431] to-[#d93846] text-white text-3xl font-black rounded-[1.5rem] shadow-xl shadow-red-500/20 active:scale-95 disabled:opacity-30 transition-all uppercase italic">Cobrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}