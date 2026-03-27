"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

// 📝 Definimos la estructura del Producto (Agregamos margen_ganancia)
interface Producto {
  id: number | null;
  nombre: string;
  tipo_medida: string;
  stock_actual: number | string; 
  costo: number | string;
  margen_ganancia?: number | string; // NUEVO
  precio_final: number | string;
}

// 📝 Estructura para el borrador de la edición masiva
interface BorradorPrecio {
  costo: number;
  margen_ganancia: number;
  precio_final: number;
  costo_anterior: number;
  precio_anterior: number;
}

export default function GestionProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState<string>('');
  
  // Estados Modales Individuales
  const [mostrarFormulario, setMostrarFormulario] = useState<boolean>(false);
  const [modoEdicion, setModoEdicion] = useState<boolean>(false);
  const [formulario, setFormulario] = useState<Producto>({
    id: null, nombre: '', tipo_medida: 'kg', stock_actual: '', costo: '', margen_ganancia: '30', precio_final: ''
  });
  const [mostrarReponer, setMostrarReponer] = useState<boolean>(false);
  const [productoAReponer, setProductoAReponer] = useState<Producto | null>(null);
  const [cantidadReponer, setCantidadReponer] = useState<string>('');

  // 🟢 ESTADOS PARA EDICIÓN MASIVA (EXCEL)
  const [modoEdicionMasiva, setModoEdicionMasiva] = useState<boolean>(false);
  const [borradorPrecios, setBorradorPrecios] = useState<Record<number, BorradorPrecio>>({});
  const [guardandoMasivo, setGuardandoMasivo] = useState<boolean>(false);

  const cargarProductos = () => {
    fetch('/api/productos')
      .then(res => res.json())
      .then((datos: Producto[]) => setProductos(datos));
  };

  useEffect(() => { cargarProductos(); }, []);

  const productosFiltrados = productos.filter((prod) =>
    prod.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // --- LÓGICA DE EDICIÓN MASIVA (TIPO EXCEL) --- //
  
  const activarEdicionMasiva = () => {
    const estadoInicial: Record<number, BorradorPrecio> = {};
    // Solo cargamos en el borrador los productos que estamos viendo (filtrados)
    productosFiltrados.forEach(p => {
      if (p.id !== null) {
        estadoInicial[p.id] = {
          costo: Number(p.costo || 0),
          margen_ganancia: Number(p.margen_ganancia || 30),
          precio_final: Number(p.precio_final || 0),
          costo_anterior: Number(p.costo || 0),
          precio_anterior: Number(p.precio_final || 0)
        };
      }
    });
    setBorradorPrecios(estadoInicial);
    setModoEdicionMasiva(true);
  };

  const handleCambioPrecioMasivo = (id: number, campo: keyof BorradorPrecio, valorString: string) => {
    const valor = parseFloat(valorString) || 0;
    const prod = { ...borradorPrecios[id] };

    if (campo === 'costo') {
      prod.costo = valor;
      prod.precio_final = parseFloat((prod.costo * (1 + (prod.margen_ganancia / 100))).toFixed(2));
    } 
    else if (campo === 'margen_ganancia') {
      prod.margen_ganancia = valor;
      prod.precio_final = parseFloat((prod.costo * (1 + (prod.margen_ganancia / 100))).toFixed(2));
    } 
    else if (campo === 'precio_final') {
      prod.precio_final = valor;
      prod.margen_ganancia = prod.costo > 0 ? parseFloat((((prod.precio_final / prod.costo) - 1) * 100).toFixed(2)) : 0;
    }

    setBorradorPrecios({ ...borradorPrecios, [id]: prod });
  };

  const guardarCambiosMasivos = async () => {
    setGuardandoMasivo(true);
    
    // Filtramos solo los que cambiaron
    const cambiosParaEnviar = Object.keys(borradorPrecios).map(idStr => {
      const id = Number(idStr);
      return {
        id: id,
        costo_nuevo: borradorPrecios[id].costo,
        margen_nuevo: borradorPrecios[id].margen_ganancia,
        precio_nuevo: borradorPrecios[id].precio_final,
        costo_anterior: borradorPrecios[id].costo_anterior,
        precio_anterior: borradorPrecios[id].precio_anterior
      };
    }).filter(p => p.costo_nuevo !== p.costo_anterior || p.precio_nuevo !== p.precio_anterior);

    if (cambiosParaEnviar.length > 0) {
      try {
        const res = await fetch('/api/productos/precios', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cambios: cambiosParaEnviar })
        });
        
        if(res.ok) {
          alert('✅ Precios actualizados y guardados en el historial');
          cargarProductos();
        } else {
          alert('❌ Error al guardar en la base de datos');
        }
      } catch (error) {
        alert("❌ Error de conexión al guardar precios.");
      }
    }
    
    setModoEdicionMasiva(false);
    setGuardandoMasivo(false);
  };

  // --- LÓGICA DE PRODUCTOS INDIVIDUALES (EXISTENTE) --- //

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const abrirParaNuevo = () => {
    setFormulario({ id: null, nombre: '', tipo_medida: 'kg', stock_actual: '', costo: '', margen_ganancia: '30', precio_final: '' });
    setModoEdicion(false); 
    setMostrarFormulario(true);
  };

  const abrirParaEditar = (producto: Producto) => {
    setFormulario(producto); 
    setModoEdicion(true); 
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => setMostrarFormulario(false);

  const guardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = modoEdicion ? `/api/productos/${formulario.id}` : '/api/productos';
    const metodo = modoEdicion ? 'PUT' : 'POST';
    
    await fetch(url, { 
      method: metodo, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(formulario) 
    });
    
    cerrarFormulario(); 
    cargarProductos();
    alert(modoEdicion ? "✨ Producto actualizado" : "✨ Producto creado");
  };

  const eliminarProducto = async (id: number | null, nombre: string) => {
    if (!id) return;
    if (confirm(`¿Estás seguro de eliminar "${nombre}"?`)) {
      await fetch(`/api/productos/${id}`, { method: 'DELETE' });
      cargarProductos();
    }
  };

  const abrirParaReponer = (producto: Producto) => {
    setProductoAReponer(producto); 
    setCantidadReponer(''); 
    setMostrarReponer(true);
  };

  const guardarReposicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoAReponer || !cantidadReponer || isNaN(parseFloat(cantidadReponer)) || parseFloat(cantidadReponer) <= 0) return;
    try {
      const respuesta = await fetch(`/api/productos/${productoAReponer.id}/reponer`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad_agregada: parseFloat(cantidadReponer) })
      });
      if (respuesta.ok) {
        setMostrarReponer(false); 
        cargarProductos();
        alert(`✅ Se agregaron ${cantidadReponer} al stock de ${productoAReponer.nombre}`);
      }
    } catch (error) { alert("❌ Error de conexión."); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0e5ec] to-[#f4f7f6] text-gray-800 font-sans p-4 md:p-8 lg:p-10">
      
      {/* 🟢 ENCABEZADO Y BOTONES */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center mb-8 gap-6">
        <div className="text-center lg:text-left">
          <h2 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight">📦 Inventario</h2>
          <p className="text-xl text-gray-500 mt-2 font-medium">Gestión de stock y precios</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 w-full lg:w-auto">
          {!modoEdicionMasiva ? (
            <>
              <Link href="/" className="px-6 py-4 bg-white/60 backdrop-blur-md text-gray-600 font-bold rounded-2xl hover:bg-white hover:text-[#b12431] shadow-sm border border-white/50 text-lg flex items-center gap-2">
                <span> ← </span> Caja
              </Link>
              <Link href="/estadisticas" className="px-6 py-4 bg-blue-50/50 backdrop-blur-md text-blue-600 font-bold rounded-2xl hover:bg-white hover:text-blue-700 shadow-sm border border-blue-100/50 text-lg flex items-center gap-2">
                <span>📊</span> Estadísticas
              </Link>
              <button onClick={activarEdicionMasiva} className="px-6 py-4 bg-yellow-50/50 backdrop-blur-md text-yellow-600 font-bold rounded-2xl hover:bg-white hover:text-yellow-700 shadow-sm border border-yellow-100/50 text-lg flex items-center gap-2 transition-all">
                <span>📝</span> Editar Precios
              </button>
              <button onClick={abrirParaNuevo} className="px-8 py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-green-500/30 hover:scale-[1.02] active:scale-95 transition-all text-xl flex items-center gap-2">
                <span>➕</span> NUEVO PRODUCTO
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setModoEdicionMasiva(false)} className="px-6 py-4 bg-gray-200/50 backdrop-blur-md text-gray-600 font-bold rounded-2xl hover:bg-white shadow-sm border border-gray-300/50 text-lg transition-all">
                Cancelar
              </button>
              <button onClick={guardarCambiosMasivos} disabled={guardandoMasivo} className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black rounded-2xl shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-95 transition-all text-xl flex items-center gap-2">
                {guardandoMasivo ? 'Guardando...' : '💾 GUARDAR CAMBIOS'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 🔍 BARRA DE BÚSQUEDA */}
      <div className="max-w-7xl mx-auto mb-8 relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-white/60 to-white/30 rounded-[2.5rem] blur opacity-50 transition duration-500"></div>
        <div className="relative bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] shadow-sm flex items-center overflow-hidden">
          <span className="pl-6 text-3xl opacity-50">🔎</span>
          <input 
            type="text" 
            placeholder={modoEdicionMasiva ? "Buscando productos para editar..." : "Buscar producto por nombre..."}
            value={busqueda}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
            disabled={modoEdicionMasiva} // Deshabilitamos buscar mientras edita para evitar bugs visuales
            className="w-full pl-4 pr-6 py-6 text-2xl bg-transparent outline-none text-gray-700 font-bold placeholder-gray-400 disabled:opacity-50"
          />
          {busqueda && !modoEdicionMasiva && (
             <button onClick={() => setBusqueda('')} className="absolute right-6 text-3xl text-gray-400 hover:text-red-500 font-bold">
               &times;
             </button>
          )}
        </div>
      </div>

      {/* 📊 TABLA DE STOCK / PRECIOS */}
      <div className={`max-w-7xl mx-auto backdrop-blur-2xl rounded-[2.5rem] shadow-sm border overflow-hidden mb-10 transition-all ${modoEdicionMasiva ? 'bg-yellow-50/30 border-yellow-200' : 'bg-white/60 border-white/50'}`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-white/40 border-b border-white/60 text-gray-500 text-lg uppercase tracking-wider">
                <th className="p-6 font-black">Producto</th>
                <th className="p-6 text-center font-black">Stock</th>
                <th className="p-6 text-center font-black">Costo ($)</th>
                <th className="p-6 text-center font-black">Margen (%)</th>
                <th className="p-6 text-center font-black">Precio Venta ($)</th>
                {!modoEdicionMasiva && <th className="p-6 text-center font-black">Acciones Rápidas</th>}
              </tr>
            </thead>
            <tbody className="text-gray-700 text-xl">
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400 font-bold text-2xl">
                    {busqueda ? 'Ningún producto coincide con la búsqueda ✨' : 'Inventario vacío.'}
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((prod) => {
                  const borrador = prod.id ? borradorPrecios[prod.id] : null;

                  return (
                    <tr key={prod.id} className="border-b border-gray-100/50 hover:bg-white/80 transition-all duration-300">
                      
                      {/* NOMBRE Y MEDIDA */}
                      <td className="p-6">
                        <span className="font-bold block text-2xl text-gray-800">{prod.nombre}</span>
                        <span className="text-sm text-gray-400 uppercase font-medium mt-1 bg-white/50 px-3 py-1 rounded-full inline-block border border-gray-100">
                          {prod.tipo_medida}
                        </span>
                      </td>
                      
                      {/* STOCK */}
                      <td className="p-6 text-center">
                        <div className={`font-black text-2xl px-4 py-2 rounded-2xl inline-flex items-center justify-center min-w-[80px] shadow-sm border ${
                          Number(prod.stock_actual) <= 5 
                            ? 'bg-red-50/80 text-red-600 border-red-100' 
                            : 'bg-green-50/80 text-emerald-600 border-green-100'
                        }`}>
                          {prod.stock_actual}
                        </div>
                      </td>

                      {/* COLUMNA COSTO */}
                      <td className="p-6 text-center">
                        {modoEdicionMasiva && borrador ? (
                           <input 
                             type="number" 
                             className="w-full max-w-[120px] text-center p-3 border-2 border-blue-200 rounded-xl bg-white focus:border-blue-500 outline-none font-bold text-gray-700 shadow-inner"
                             value={borrador.costo === 0 ? '' : borrador.costo}
                             onChange={(e) => handleCambioPrecioMasivo(prod.id!, 'costo', e.target.value)}
                           />
                        ) : (
                          <span className="text-gray-400 font-medium">${prod.costo}</span>
                        )}
                      </td>

                      {/* COLUMNA MARGEN */}
                      <td className="p-6 text-center">
                        {modoEdicionMasiva && borrador ? (
                           <div className="flex items-center justify-center gap-1">
                             <input 
                               type="number" 
                               className="w-full max-w-[90px] text-center p-3 border-2 border-purple-200 rounded-xl bg-white focus:border-purple-500 outline-none font-bold text-gray-700 shadow-inner"
                               value={borrador.margen_ganancia === 0 ? '' : borrador.margen_ganancia}
                               onChange={(e) => handleCambioPrecioMasivo(prod.id!, 'margen_ganancia', e.target.value)}
                             />
                             <span className="text-gray-400 font-bold">%</span>
                           </div>
                        ) : (
                          <span className="text-gray-400 font-medium">{prod.margen_ganancia || 30}%</span>
                        )}
                      </td>

                      {/* COLUMNA PRECIO FINAL */}
                      <td className="p-6 text-center">
                        {modoEdicionMasiva && borrador ? (
                           <div className="flex items-center justify-center gap-1">
                             <span className="text-green-600 font-bold">$</span>
                             <input 
                               type="number" 
                               className="w-full max-w-[120px] text-center p-3 border-2 border-green-300 rounded-xl bg-green-50 focus:border-green-600 outline-none font-black text-green-700 shadow-inner"
                               value={borrador.precio_final === 0 ? '' : borrador.precio_final}
                               onChange={(e) => handleCambioPrecioMasivo(prod.id!, 'precio_final', e.target.value)}
                             />
                           </div>
                        ) : (
                          <span className="font-black text-[#b12431] text-2xl">${prod.precio_final}</span>
                        )}
                      </td>

                      {/* ACCIONES INDIVIDUALES (Se ocultan si estamos editando todo) */}
                      {!modoEdicionMasiva && (
                        <td className="p-6">
                          <div className="flex justify-center gap-3">
                            <button onClick={() => abrirParaReponer(prod)} className="px-4 py-3 bg-emerald-50/50 hover:bg-white text-emerald-600 font-bold rounded-2xl shadow-sm border border-emerald-100/50 transition-all">
                              📥 Reponer
                            </button>
                            <button onClick={() => abrirParaEditar(prod)} className="px-4 py-3 bg-blue-50/50 hover:bg-white text-blue-600 font-bold rounded-2xl shadow-sm border border-blue-100/50 transition-all">
                              ✏️ Editar
                            </button>
                            <button onClick={() => eliminarProducto(prod.id, prod.nombre)} className="px-4 py-3 bg-red-50/50 hover:bg-white text-red-500 font-bold rounded-2xl shadow-sm border border-red-100/50 transition-all">
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🪟 MODALES EXISTENTES SE MANTIENEN IGUAL... */}
      {/* ... (Modal de Nuevo/Editar) ... */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-xl border border-white/60 w-full max-w-2xl overflow-hidden animate-fade-in-up">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white/50">
              <h2 className="text-3xl font-black text-gray-800 tracking-tight">{modoEdicion ? '✏️ Editar Producto' : '✨ Nuevo Producto'}</h2>
              <button onClick={cerrarFormulario} className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500">✕</button>
            </div>
            <form onSubmit={guardarProducto} className="p-8 flex flex-col gap-6">
              <div>
                <label className="block text-lg font-bold mb-2 text-gray-500 pl-2">Nombre del Producto</label>
                <input required autoFocus type="text" name="nombre" value={formulario.nombre} onChange={manejarCambio} className="w-full text-2xl p-4 bg-white/50 border border-gray-200 rounded-[1.5rem] focus:border-blue-400 outline-none transition-all shadow-inner" placeholder="Ej: Milanesas de Pollo" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-bold mb-2 text-gray-500 pl-2">Medida</label>
                  <select name="tipo_medida" value={formulario.tipo_medida} onChange={manejarCambio} className="w-full text-2xl p-4 bg-white/50 border border-gray-200 rounded-[1.5rem] outline-none appearance-none">
                    <option value="kg">Kilo (kg)</option>
                    <option value="unidad">Unidad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-lg font-bold mb-2 text-gray-500 pl-2">Stock Inicial</label>
                  <input required type="number" step="0.01" name="stock_actual" value={formulario.stock_actual} onChange={manejarCambio} className="w-full text-2xl p-4 bg-white/50 border border-gray-200 rounded-[1.5rem] outline-none shadow-inner" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-bold mb-2 text-gray-500 pl-2">Costo ($)</label>
                  <input required type="number" step="0.01" name="costo" value={formulario.costo} onChange={manejarCambio} className="w-full text-2xl p-4 bg-white/50 border border-gray-200 rounded-[1.5rem] outline-none shadow-inner" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-lg font-black mb-2 text-[#b12431] pl-2">Precio Público ($)</label>
                  <input required type="number" step="0.01" name="precio_final" value={formulario.precio_final} onChange={manejarCambio} className="w-full text-2xl p-4 bg-red-50/50 border-2 border-[#b12431]/30 rounded-[1.5rem] outline-none font-black text-[#b12431]" placeholder="0.00" />
                </div>
              </div>
              <div className="mt-6 flex gap-4">
                <button type="button" onClick={cerrarFormulario} className="w-1/3 py-5 bg-gray-100/80 text-gray-600 text-xl font-bold rounded-[1.5rem]">Cancelar</button>
                <button type="submit" className="flex-1 py-5 bg-gradient-to-r from-[#b12431] to-[#d93846] text-white text-2xl font-black rounded-[1.5rem] shadow-lg hover:scale-[1.02] active:scale-95 transition-all">{modoEdicion ? 'ACTUALIZAR' : 'GUARDAR'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ... (Modal de Reponer) ... */}
      {mostrarReponer && productoAReponer && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-xl border border-white/60 w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="p-8 pb-4 text-center relative">
               <button onClick={() => setMostrarReponer(false)} className="absolute top-6 right-6 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-500">✕</button>
               <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">📥</div>
               <h2 className="text-2xl font-black text-gray-800 tracking-tight">Ingreso de Stock</h2>
            </div>
            <form onSubmit={guardarReposicion} className="p-8 pt-0 flex flex-col gap-6 text-center">
              <p className="text-xl text-gray-500 font-medium">¿Cuánto ingresó de <br/> <span className="font-black text-2xl text-emerald-600">{productoAReponer.nombre}</span>?</p>
              <div className="flex items-center justify-center gap-4 bg-white/50 p-6 rounded-[2rem] border border-gray-100 shadow-inner">
                <input required autoFocus type="number" step="0.01" value={cantidadReponer} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCantidadReponer(e.target.value)} className="w-1/2 text-5xl bg-transparent text-center font-black outline-none text-gray-800" placeholder="0" />
                <span className="text-2xl font-bold text-gray-400">{productoAReponer.tipo_medida}</span>
              </div>
              <button type="submit" className="w-full mt-2 py-5 bg-gradient-to-r from-emerald-400 to-green-500 text-white text-2xl font-black rounded-[1.5rem] shadow-lg hover:scale-[1.02] active:scale-95 transition-all">SUMAR STOCK</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}