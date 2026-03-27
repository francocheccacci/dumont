"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

// 📝 DEFINICIÓN DE INTERFACES
interface Producto {
  id: number | null;
  nombre: string;
  tipo_medida: string;
  stock_actual: number | string;
  costo: number | string;
  margen_ganancia?: number | string;
  precio_final: number | string;
  categoria_id?: number;
  categoria_nombre?: string;
}

interface ItemCombo {
  producto_id: number;
  nombre: string;
  cantidad: number;
  costo_unitario: number;
}

interface Combo {
  id: number;
  nombre: string;
  margen_ganancia: number;
  precio_final: number;
  costo_total_base: number;
}

interface BorradorPrecio {
  costo: number;
  margen_ganancia: number;
  precio_final: number;
  costo_anterior: number;
  precio_anterior: number;
}

export default function GestionInventarioCompleto() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [tabActiva, setTabActiva] = useState<'Frescos' | 'Congelados' | 'Combos'>('Frescos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(true);

  // --- NUEVOS ESTADOS DENTRO DE GestionInventarioCompleto ---
  const [modoEdicionCombo, setModoEdicionCombo] = useState<boolean>(false);
  const [idComboEditar, setIdComboEditar] = useState<number | null>(null);

  // Estados Modales Productos
  const [mostrarFormulario, setMostrarFormulario] = useState<boolean>(false);
  const [modoEdicion, setModoEdicion] = useState<boolean>(false);
  const [formulario, setFormulario] = useState<Producto>({
    id: null, nombre: '', tipo_medida: 'kg', stock_actual: '', costo: '', margen_ganancia: '30', precio_final: '', categoria_id: 1
  });

  // Estados Edición Masiva
  const [modoEdicionMasiva, setModoEdicionMasiva] = useState<boolean>(false);
  const [borradorPrecios, setBorradorPrecios] = useState<Record<number, BorradorPrecio>>({});
  const [guardandoMasivo, setGuardandoMasivo] = useState<boolean>(false);

  // Estados Combos
  const [mostrarModalCombo, setMostrarModalCombo] = useState<boolean>(false);
  const [itemsSeleccionados, setItemsSeleccionados] = useState<ItemCombo[]>([]);
  const [datosNuevoCombo, setDatosNuevoCombo] = useState({ nombre: '', margen: 30, precio: 0 });

  // Estados Reponer
  const [mostrarReponer, setMostrarReponer] = useState<boolean>(false);
  const [productoAReponer, setProductoAReponer] = useState<Producto | null>(null);
  const [cantidadReponer, setCantidadReponer] = useState<string>('');

  const cargarDatos = async () => {
    try {
      const [resP, resC] = await Promise.all([
        fetch('/api/productos').then(r => r.json()),
        fetch('/api/combos').then(r => r.json())
      ]);
      setProductos(resP || []);
      setCombos(resC || []);
    } catch (e) { console.error(e); }
    setCargando(false);
  };

  useEffect(() => { cargarDatos(); }, []);

  // --- FILTRADO ---
  const productosFiltrados = productos.filter((p) =>
    p.categoria_nombre === tabActiva &&
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const combosFiltrados = combos.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // --- LÓGICA MARGEN INDIVIDUAL ---
  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let nuevoForm = { ...formulario, [name]: value };

    // Recalcular si cambia Costo, Margen o Precio Final
    if (name === 'costo' || name === 'margen_ganancia') {
      const c = parseFloat(name === 'costo' ? value : String(nuevoForm.costo)) || 0;
      const m = parseFloat(name === 'margen_ganancia' ? value : String(nuevoForm.margen_ganancia)) || 0;
      nuevoForm.precio_final = (c * (1 + m / 100)).toFixed(2);
    } else if (name === 'precio_final') {
      const p = parseFloat(value) || 0;
      const c = parseFloat(String(nuevoForm.costo)) || 0;
      if (c > 0) nuevoForm.margen_ganancia = (((p / c) - 1) * 100).toFixed(2);
    }

    setFormulario(nuevoForm);
  };

  // --- LÓGICA EDICIÓN MASIVA ---
  const activarEdicionMasiva = () => {
    const estadoInicial: Record<number, BorradorPrecio> = {};
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
    } else if (campo === 'margen_ganancia') {
      prod.margen_ganancia = valor;
      prod.precio_final = parseFloat((prod.costo * (1 + (prod.margen_ganancia / 100))).toFixed(2));
    } else if (campo === 'precio_final') {
      prod.precio_final = valor;
      prod.margen_ganancia = prod.costo > 0 ? parseFloat((((prod.precio_final / prod.costo) - 1) * 100).toFixed(2)) : 0;
    }
    setBorradorPrecios({ ...borradorPrecios, [id]: prod });
  };

  const guardarCambiosMasivos = async () => {
    setGuardandoMasivo(true);
    const cambiosParaEnviar = Object.keys(borradorPrecios).map(idStr => {
      const id = Number(idStr);
      return {
        id: id, costo_nuevo: borradorPrecios[id].costo, margen_nuevo: borradorPrecios[id].margen_ganancia,
        precio_nuevo: borradorPrecios[id].precio_final, costo_anterior: borradorPrecios[id].costo_anterior,
        precio_anterior: borradorPrecios[id].precio_anterior
      };
    }).filter(p => p.costo_nuevo !== p.costo_anterior || p.precio_nuevo !== p.precio_anterior);

    if (cambiosParaEnviar.length > 0) {
      await fetch('/api/productos/precios', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cambios: cambiosParaEnviar }) });
      cargarDatos();
    }
    setModoEdicionMasiva(false); setGuardandoMasivo(false);
  };

  // --- LÓGICA INDIVIDUAL ---
  const abrirParaNuevo = () => {
    setFormulario({ id: null, nombre: '', tipo_medida: 'kg', stock_actual: '', costo: '', margen_ganancia: '30', precio_final: '', categoria_id: tabActiva === 'Congelados' ? 2 : 1 });
    setModoEdicion(false); setMostrarFormulario(true);
  };

  const abrirParaEditar = (p: Producto) => {
    setFormulario(p); setModoEdicion(true); setMostrarFormulario(true);
  };

  const guardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = modoEdicion ? `/api/productos/${formulario.id}` : '/api/productos';
    await fetch(url, { method: modoEdicion ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formulario) });
    setMostrarFormulario(false); cargarDatos();
  };

  const eliminarProducto = async (id: number | null, nombre: string) => {
    if (!id || !confirm(`¿Eliminar "${nombre}"?`)) return;
    await fetch(`/api/productos/${id}`, { method: 'DELETE' });
    cargarDatos();
  };

  const abrirParaReponer = (producto: Producto) => {
    setProductoAReponer(producto); setCantidadReponer(''); setMostrarReponer(true);
  };

  const guardarReposicion = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/productos/${productoAReponer!.id}/reponer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cantidad_agregada: parseFloat(cantidadReponer) }) });
    setMostrarReponer(false); cargarDatos();
  };

  // --- LÓGICA COMBOS ---
  const costoBaseCombo = itemsSeleccionados.reduce((acc, item) => acc + (item.costo_unitario * item.cantidad), 0);
  const agregarAlCombo = (p: Producto) => {
    if (itemsSeleccionados.find(i => i.producto_id === p.id)) return;
    setItemsSeleccionados([...itemsSeleccionados, { producto_id: p.id!, nombre: p.nombre, cantidad: 1, costo_unitario: Number(p.costo) }]);
  };


  // --- LÓGICA EDITAR COMBO ---
  const abrirEditarCombo = async (combo: Combo) => {
    setDatosNuevoCombo({
      nombre: combo.nombre,
      margen: combo.margen_ganancia,
      precio: combo.precio_final
    });

    // Buscamos los ingredientes en la API
    const res = await fetch(`/api/combos/${combo.id}`);
    const ingredientes = await res.json();

    setItemsSeleccionados(ingredientes);
    setIdComboEditar(combo.id);
    setModoEdicionCombo(true);
    setMostrarModalCombo(true);
  };

  // --- LÓGICA ELIMINAR COMBO ---
  const eliminarCombo = async (id: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el combo "${nombre}"?`)) return;
    await fetch(`/api/combos/${id}`, { method: 'DELETE' });
    cargarDatos();
  };

  // --- ACTUALIZAR GUARDAR COMBO ---
  const guardarCombo = async () => {
    if (!datosNuevoCombo.nombre || itemsSeleccionados.length === 0) return alert("Faltan datos");

    const url = modoEdicionCombo ? `/api/combos/${idComboEditar}` : '/api/combos';
    const method = modoEdicionCombo ? 'PUT' : 'POST';

    await fetch(url, {
      method: method,
      body: JSON.stringify({
        nombre: datosNuevoCombo.nombre,
        margen_ganancia: datosNuevoCombo.margen,
        precio_final: datosNuevoCombo.precio,
        items: itemsSeleccionados
      })
    });

    setMostrarModalCombo(false);
    setModoEdicionCombo(false);
    setItemsSeleccionados([]);
    cargarDatos();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0e5ec] to-[#f4f7f6] text-gray-800 font-sans p-4 md:p-8 lg:p-10">

      {/* 🟢 ENCABEZADO */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center mb-8 gap-6">
        <div className="text-center lg:text-left">
          <h2 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight leading-none uppercase italic">📦 Inventario</h2>
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
              <button onClick={tabActiva === 'Combos' ? () => setMostrarModalCombo(true) : abrirParaNuevo} className="px-8 py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-green-500/30 hover:scale-[1.02] active:scale-95 transition-all text-xl flex items-center gap-2">
                <span>➕</span> {tabActiva === 'Combos' ? 'NUEVO COMBO' : 'NUEVO PRODUCTO'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setModoEdicionMasiva(false)} className="px-6 py-4 bg-gray-200/50 backdrop-blur-md text-gray-600 font-bold rounded-2xl hover:bg-white shadow-sm border border-gray-300/50 text-lg transition-all">Cancelar</button>
              <button onClick={guardarCambiosMasivos} disabled={guardandoMasivo} className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black rounded-2xl shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-95 transition-all text-xl flex items-center gap-2">
                {guardandoMasivo ? 'Guardando...' : '💾 GUARDAR CAMBIOS'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 🔘 SELECTOR DE PESTAÑAS */}
      <div className="max-w-7xl mx-auto mb-6 flex bg-white/40 backdrop-blur-md p-1.5 rounded-[2rem] border border-white/60 w-fit">
        {['Frescos', 'Congelados', 'Combos'].map((t: any) => (
          <button
            key={t}
            onClick={() => { setTabActiva(t); setModoEdicionMasiva(false); }}
            className={`px-8 py-3 rounded-[1.5rem] font-black transition-all ${tabActiva === t ? 'bg-gray-800 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 🔍 BARRA DE BÚSQUEDA */}
      <div className="max-w-7xl mx-auto mb-8 relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-white/60 to-white/30 rounded-[2.5rem] blur opacity-50 transition duration-500"></div>
        <div className="relative bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] shadow-sm flex items-center overflow-hidden">
          <span className="pl-6 text-3xl opacity-50">🔎</span>
          <input type="text" placeholder={`Buscar en ${tabActiva}...`} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} disabled={modoEdicionMasiva} className="w-full pl-4 pr-6 py-6 text-2xl bg-transparent outline-none text-gray-700 font-bold placeholder-gray-400 disabled:opacity-50" />
        </div>
      </div>

      {/* 📊 TABLA DINÁMICA */}
      <div className={`max-w-7xl mx-auto bg-white/60 backdrop-blur-2xl rounded-[2.5rem] shadow-sm border border-white/50 overflow-hidden mb-10 transition-all ${modoEdicionMasiva ? 'bg-yellow-50/30 border-yellow-200' : 'bg-white/60 border-white/50'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-white/40 border-b border-white/60 text-gray-500 text-lg uppercase tracking-wider font-black">
                <th className="p-6">Detalle</th>
                <th className="p-6 text-center">{tabActiva === 'Combos' ? 'Costo Base' : 'Stock'}</th>
                <th className="p-6 text-center">Costo ($)</th>
                <th className="p-6 text-center">Margen (%)</th>
                <th className="p-6 text-center font-black">Precio Venta</th>
                {!modoEdicionMasiva && <th className="p-6 text-center font-black">Acciones</th>}
              </tr>
            </thead>
            <tbody className="text-gray-700 text-xl font-bold">
              {tabActiva === 'Combos' ? (
                combosFiltrados.map(c => (
                  <tr key={c.id} className="border-b border-gray-100/50 hover:bg-white/80 transition-all">
                    <td className="p-6 text-2xl text-gray-800 uppercase font-black">{c.nombre}</td>
                    <td className="p-6 text-center text-gray-400 font-medium">${c.costo_total_base?.toFixed(2)}</td>
                    <td className="p-6 text-center text-gray-300">-</td>
                    <td className="p-6 text-center text-blue-500">{c.margen_ganancia}%</td>
                    <td className="p-6 text-center font-black text-[#b12431] text-2xl">${c.precio_final}</td>
                    <td className="p-6 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => abrirEditarCombo(c)} className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-white transition-all">✏️</button>
                        <button onClick={() => eliminarCombo(c.id, c.nombre)} className="p-2 bg-red-50 text-red-500 rounded-xl border border-red-100 hover:bg-white transition-all">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                productosFiltrados.map((prod) => {
                  const borrador = prod.id ? borradorPrecios[prod.id] : null;
                  return (
                    <tr key={prod.id} className="border-b border-gray-100/50 hover:bg-white/80 transition-all duration-300">
                      <td className="p-6">
                        <span className="font-bold block text-2xl text-gray-800">{prod.nombre}</span>
                        <span className="text-sm text-gray-400 uppercase font-medium mt-1 bg-white/50 px-3 py-1 rounded-full inline-block border border-gray-100">{prod.tipo_medida}</span>
                      </td>
                      <td className="p-6 text-center">
                        <div className={`font-black text-2xl px-4 py-2 rounded-2xl inline-flex border ${Number(prod.stock_actual) <= 5 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-emerald-600 border-green-100'}`}>{prod.stock_actual}</div>
                      </td>
                      <td className="p-6 text-center">
                        {modoEdicionMasiva && borrador ? (
                          <input type="number" className="w-24 p-2 border-2 border-blue-200 rounded-xl text-center bg-white" value={borrador.costo} onChange={(e) => handleCambioPrecioMasivo(prod.id!, 'costo', e.target.value)} />
                        ) : <span className="text-gray-400">${prod.costo}</span>}
                      </td>
                      <td className="p-6 text-center">
                        {modoEdicionMasiva && borrador ? (
                          <input type="number" className="w-20 p-2 border-2 border-purple-200 rounded-xl text-center bg-white" value={borrador.margen_ganancia} onChange={(e) => handleCambioPrecioMasivo(prod.id!, 'margen_ganancia', e.target.value)} />
                        ) : <span className="text-blue-500 font-bold">{prod.margen_ganancia || 30}%</span>}
                      </td>
                      <td className="p-6 text-center font-black text-[#b12431] text-2xl">
                        {modoEdicionMasiva && borrador ? (
                          <input type="number" className="w-28 p-2 border-2 border-green-300 rounded-xl text-center bg-green-50" value={borrador.precio_final} onChange={(e) => handleCambioPrecioMasivo(prod.id!, 'precio_final', e.target.value)} />
                        ) : `$${prod.precio_final}`}
                      </td>
                      {!modoEdicionMasiva && (
                        <td className="p-6 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => abrirParaReponer(prod)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">📥</button>
                            <button onClick={() => abrirParaEditar(prod)} className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">✏️</button>
                            <button onClick={() => eliminarProducto(prod.id, prod.nombre)} className="p-2 bg-red-50 text-red-500 rounded-xl border border-red-100">🗑️</button>
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

      {/* 🪟 MODAL: NUEVO / EDITAR PRODUCTO */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-xl border border-white/60 w-full max-w-2xl overflow-hidden animate-fade-in-up">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white/50">
              <h2 className="text-3xl font-black text-gray-800 tracking-tight leading-none uppercase italic">{modoEdicion ? '✏️ Editar' : '✨ Nuevo'} Producto</h2>
              <button onClick={() => setMostrarFormulario(false)} className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500">✕</button>
            </div>
            <form onSubmit={guardarProducto} className="p-8 flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-bold mb-2 text-gray-500 pl-2">Categoría</label>
                  <select name="categoria_id" value={formulario.categoria_id} onChange={manejarCambio} className="w-full text-2xl p-4 bg-white/50 border border-gray-200 rounded-[1.5rem] outline-none transition-all shadow-inner appearance-none">
                    <option value={1}>Frescos</option>
                    <option value={2}>Congelados</option>
                  </select>
                </div>
                <div>
                  <label className="block text-lg font-bold mb-2 text-gray-500 pl-2">Medida</label>
                  <select name="tipo_medida" value={formulario.tipo_medida} onChange={manejarCambio} className="w-full text-2xl p-4 bg-white/50 border border-gray-200 rounded-[1.5rem] outline-none">
                    <option value="kg">Kilo (kg)</option>
                    <option value="unidad">Unidad</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-lg font-bold mb-2 text-gray-500 pl-2">Nombre del Producto</label>
                <input required autoFocus name="nombre" value={formulario.nombre} onChange={manejarCambio} className="w-full text-2xl p-4 bg-white/50 border border-gray-200 rounded-[1.5rem] focus:border-blue-400 outline-none transition-all shadow-inner" placeholder="Ej: Pechuga deshuesada" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-bold mb-2 text-gray-500 pl-2">Costo ($)</label>
                  <input required type="number" step="0.01" name="costo" value={formulario.costo} onChange={manejarCambio} className="w-full text-2xl p-4 bg-white/50 border border-gray-200 rounded-[1.5rem] outline-none shadow-inner" />
                </div>
                <div>
                  <label className="block text-lg font-bold mb-2 text-gray-500 pl-2">Stock Inicial</label>
                  <input required type="number" step="0.01" name="stock_actual" value={formulario.stock_actual} onChange={manejarCambio} className="w-full text-2xl p-4 bg-white/50 border border-gray-200 rounded-[1.5rem] outline-none shadow-inner" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-bold mb-2 text-gray-500 pl-2">Margen (%)</label>
                  <input required type="number" step="0.1" name="margen_ganancia" value={formulario.margen_ganancia} onChange={manejarCambio} className="w-full text-2xl p-4 bg-blue-50/50 border border-blue-200 rounded-[1.5rem] outline-none font-bold text-blue-600" />
                </div>
                <div>
                  <label className="block text-lg font-black mb-2 text-[#b12431] pl-2">Precio Final ($)</label>
                  <input required type="number" step="0.01" name="precio_final" value={formulario.precio_final} onChange={manejarCambio} className="w-full text-2xl p-4 bg-red-50/50 border-2 border-[#b12431]/30 rounded-[1.5rem] outline-none font-black text-[#b12431]" />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-gradient-to-r from-[#b12431] to-[#d93846] text-white text-2xl font-black rounded-[1.5rem] shadow-lg hover:scale-[1.02] active:scale-95 transition-all uppercase italic">Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}

      {/* 🛠️ MODAL: ARMADOR DE COMBOS (Tu diseño original) */}
      {mostrarModalCombo && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white/60 w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in-up">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white/50">
              <h2 className="text-3xl font-black text-gray-800 uppercase italic">🛠️ Armador de Combo</h2>
              <button onClick={() => setMostrarModalCombo(false)} className="text-4xl font-bold text-gray-400 hover:text-red-500 transition-colors">✕</button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-100 bg-gray-50/30">
                <p className="text-xs font-black text-gray-400 mb-4 uppercase tracking-widest italic">Toca para sumar productos:</p>
                <div className="grid gap-3">
                  {productos.map(p => (
                    <button key={p.id} onClick={() => agregarAlCombo(p)} className="w-full p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-white/80 flex justify-between items-center font-bold hover:border-blue-400 hover:bg-white shadow-sm transition-all">
                      <span className="text-lg">{p.nombre}</span>
                      <span className="text-blue-500 bg-blue-50 px-3 py-1 rounded-xl text-sm">${p.costo}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-1/2 p-8 flex flex-col gap-6 bg-white overflow-y-auto">
                <div>
                  <label className="block text-sm font-black text-gray-400 uppercase mb-2 tracking-widest">Nombre del Combo</label>
                  <input placeholder="Ej: Combo Familiar" className="w-full text-3xl font-black border-b-2 border-gray-100 outline-none focus:border-[#b12431] transition-colors pb-2" value={datosNuevoCombo.nombre} onChange={e => setDatosNuevoCombo({ ...datosNuevoCombo, nombre: e.target.value })} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-gray-400 mb-4 uppercase italic">Ingredientes:</p>
                  <div className="space-y-3">
                    {itemsSeleccionados.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 p-4 rounded-[1.5rem] font-bold border border-gray-100">
                        <span className="text-gray-700">{item.nombre}</span>
                        <input type="number" className="w-20 p-2 rounded-xl border-2 border-gray-200 text-center focus:border-blue-400 outline-none" value={item.cantidad} onChange={e => {
                          const n = [...itemsSeleccionados]; n[idx].cantidad = parseFloat(e.target.value); setItemsSeleccionados(n);
                        }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                  <div className="flex justify-between mb-2 text-xs opacity-60 font-black uppercase tracking-widest">
                    <span>Costo: ${costoBaseCombo.toFixed(2)}</span>
                    <span>Margen: {datosNuevoCombo.margen}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-black text-gray-300 italic">TOTAL:</span>
                    <input type="number" className="bg-transparent text-5xl font-black text-right outline-none text-yellow-400 w-40" value={datosNuevoCombo.precio} onChange={e => {
                      const p = parseFloat(e.target.value); setDatosNuevoCombo({ ...datosNuevoCombo, precio: p, margen: parseFloat((((p / costoBaseCombo) - 1) * 100).toFixed(1)) });
                    }} />
                  </div>
                </div>
                <button onClick={guardarCombo} className="w-full py-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-2xl rounded-[1.5rem] shadow-lg hover:scale-[1.02] active:scale-95 transition-all">GUARDAR COMBO</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📥 MODAL: REPONER STOCK */}
      {mostrarReponer && productoAReponer && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-xl border border-white/60 w-full max-w-md p-10 animate-fade-in-up text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">📥</div>
            <h2 className="text-3xl font-black text-gray-800 mb-2 tracking-tight italic uppercase">Reponer Stock</h2>
            <p className="text-gray-500 font-bold mb-8">Producto: <span className="text-emerald-600 uppercase">{productoAReponer.nombre}</span></p>
            <form onSubmit={guardarReposicion} className="flex flex-col gap-8">
              <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-inner">
                <input autoFocus type="number" step="0.01" value={cantidadReponer} onChange={(e) => setCantidadReponer(e.target.value)} className="w-full text-6xl text-center font-black bg-transparent outline-none text-gray-800" placeholder="0" />
                <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest">{productoAReponer.tipo_medida}</p>
              </div>
              <button type="submit" className="w-full py-6 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-2xl rounded-[1.5rem] shadow-lg hover:scale-[1.02] transition-all">CONFIRMAR INGRESO</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}