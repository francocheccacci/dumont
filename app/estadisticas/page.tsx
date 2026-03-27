"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, AreaChart, Area, Cell
} from 'recharts';

// 📝 1. INTERFACES ACTUALIZADAS
interface TopProducto {
  nombre: string;
  total_vendido: number;
  ganancia_total: number; // Nuevo
  tipo_medida: string;    // Nuevo
}

interface FlujoVenta {
  etiqueta: string; 
  valor: number;    
}

interface MejorDia {
  dia: string;
  ingresos: number;
}

interface StatsData {
  topProductos: TopProducto[];
  flujoVentas: FlujoVenta[];
  mejoresDias: MejorDia[];
  totalPeriodo: number;
  periodoActivo: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  tipo?: 'moneda' | 'cantidad';
  unidad?: string;
}

// 📝 2. TOOLTIP MEJORADO (Ahora detecta moneda vs unidades/kg)
const CustomTooltip = ({ active, payload, label, tipo = 'moneda' }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // Accedemos a los datos extra del objeto
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 ring-1 ring-black/5">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{label || data.nombre}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <p className="text-lg font-black text-gray-800">
              {tipo === 'moneda' 
                ? `$${Number(entry.value).toLocaleString('es-AR')}` 
                : `${entry.value} ${data.tipo_medida || 'u.'}`}
            </p>
          </div>
        ))}
        {tipo === 'moneda' && (
           <p className="text-[10px] text-gray-400 mt-1 font-bold italic">Ganancia neta calculada</p>
        )}
      </div>
    );
  }
  return null;
};

export default function DashboardEstadisticas() {
  const [periodo, setPeriodo] = useState<string>('hoy');
  const [verPor, setVerPor] = useState<'ganancia' | 'volumen'>('ganancia'); // Switch para el Top
  const [stats, setStats] = useState<StatsData | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    setCargando(true);
    fetch(`/api/estadisticas?periodo=${periodo}`)
      .then(res => res.json())
      .then((datos: StatsData) => { 
        setStats(datos); 
        setCargando(false); 
      })
      .catch(err => console.error("Error en stats:", err));
  }, [periodo]);

  if (cargando && !stats) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-3xl font-bold text-gray-400 gap-4 bg-[#e0e5ec]">
        <span className="animate-bounce">📊</span> Cargando Inteligencia...
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-gradient-to-br from-[#e0e5ec] to-[#f4f7f6] text-gray-800 font-sans p-3 md:p-4 lg:p-6 flex flex-col overflow-hidden">
      
      {/* 🟢 ENCABEZADO */}
      <div className="flex-none flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight leading-none">📊 Centro de Mando</h2>
          <p className="text-gray-500 font-medium">Análisis de rendimiento: <span className="text-[#b12431] font-bold capitalize">{periodo}</span></p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-white shadow-inner">
            {['hoy', 'semana', 'mes'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-6 py-2 rounded-xl font-bold transition-all text-sm uppercase tracking-tighter ${
                  periodo === p ? 'bg-[#b12431] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <Link href="/productos" className="px-6 py-3 bg-white text-gray-600 font-bold rounded-2xl hover:text-[#b12431] shadow-sm transition-all border border-white flex items-center gap-2">
            ← Volver
          </Link>
        </div>
      </div>

      {/* 🧩 GRID PRINCIPAL */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-4">
        
        {/* 💰 INGRESOS */}
        <div className="lg:col-span-1 lg:row-span-1 relative group overflow-hidden bg-gradient-to-br from-[#b12431] to-red-900 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col justify-center">
          <div className="absolute -inset-10 bg-white/10 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity"></div>
          <div className="relative z-10">
            <h3 className="text-lg font-bold opacity-70 uppercase tracking-widest mb-2">Ventas {periodo}</h3>
            <p className="text-5xl md:text-6xl font-black tracking-tighter leading-none mb-2">
              ${stats?.totalPeriodo?.toLocaleString('es-AR')}
            </p>
            <div className="h-1 w-20 bg-white/30 rounded-full"></div>
          </div>
          <div className="absolute right-6 bottom-6 text-8xl opacity-10 select-none">💸</div>
        </div>

        {/* 📈 EVOLUCIÓN */}
        <div className="lg:col-span-2 lg:row-span-1 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-6 shadow-sm border border-white/50 flex flex-col min-h-0">
          <h3 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
            <span className={`p-2 rounded-lg text-sm ${periodo === 'hoy' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
              {periodo === 'hoy' ? '💵' : '📈'}
            </span>
            {periodo === 'hoy' ? 'Ganancia Neta por Hora' : 'Evolución de Ingresos'}
          </h3>

          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.flujoVentas} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={periodo === 'hoy' ? '#10b981' : '#3b82f6'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={periodo === 'hoy' ? '#10b981' : '#3b82f6'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis
                  dataKey="etiqueta"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }}
                  // Agregamos ":00 hs" si es hoy para que se vea mejor
                  tickFormatter={(value) => periodo === 'hoy' ? `${value}hs` : value}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />

                {/* Usamos el CustomTooltip que ya teníamos, pasándole el label correcto */}
                <Tooltip content={<CustomTooltip label={periodo === 'hoy' ? "Ganancia" : "Ingreso"} />} />

                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke={periodo === 'hoy' ? '#10b981' : '#3b82f6'}
                  strokeWidth={4}
                  fill="url(#gradVentas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* 🏆 TOP PRODUCTOS CON SWITCH */}
        <div className="lg:col-span-1 lg:row-span-1 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-6 shadow-sm border border-white/50 flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h3 className="text-xl font-black text-gray-800 tracking-tight">🏆 Ranking</h3>
            
            {/* SWITCH GANANCIA VS VOLUMEN */}
            <div className="flex bg-gray-100 p-1 rounded-xl self-end">
              <button 
                onClick={() => setVerPor('ganancia')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${verPor === 'ganancia' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400'}`}
              >
                GANANCIA
              </button>
              <button 
                onClick={() => setVerPor('volumen')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${verPor === 'volumen' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
              >
                VOLUMEN
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={[...(stats?.topProductos || [])].sort((a, b) => 
                  verPor === 'ganancia' ? b.ganancia_total - a.ganancia_total : b.total_vendido - a.total_vendido
                ).slice(0, 5)} 
                layout="vertical" 
                margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 800, fill: '#475569'}} width={1} />
                <Tooltip 
                  content={<CustomTooltip tipo={verPor === 'ganancia' ? 'moneda' : 'cantidad'} />} 
                  cursor={{fill: 'transparent'}} 
                />
                <Bar 
                  dataKey={verPor === 'ganancia' ? 'ganancia_total' : 'total_vendido'} 
                  radius={[0, 10, 10, 0]} 
                  barSize={25}
                >
                  {(stats?.topProductos || []).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={verPor === 'ganancia' ? '#10b981' : '#3b82f6'} 
                      fillOpacity={1 - (index * 0.15)} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 📅 DISTRIBUCIÓN POR DÍA */}
        <div className="lg:col-span-2 lg:row-span-1 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-6 shadow-sm border border-white/50 flex flex-col min-h-0">
          <h3 className="text-xl font-black text-emerald-800 mb-4 flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg text-sm">📅</span> Distribución Semanal
          </h3>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.mejoresDias} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{fontSize: 14, fontWeight: 800, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.02)'}} />
                <Bar dataKey="ingresos" fill="#10b981" radius={[10, 10, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}