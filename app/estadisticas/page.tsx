"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, AreaChart, Area 
} from 'recharts';

// 📝 1. DEFINICIÓN DE INTERFACES PARA LOS GRÁFICOS
interface TopProducto {
  nombre: string;
  total_vendido: number;
  tipo_medida?: string;
}

interface HoraPico {
  hora: string;
  cantidad_tickets: number;
}

interface MejorDia {
  dia: string;
  ingresos: number;
}

interface StatsData {
  topProductos: TopProducto[];
  horasPico: HoraPico[];
  mejoresDias: MejorDia[];
  totalHistorico: number;
}
// 1. Agregamos una interface para los props del Tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

// 2. Le asignamos la interface a la función
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-gray-200">
        <p className="text-sm font-bold text-gray-800 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-yellow-600 font-medium">
            {entry.name}: <span className="text-gray-900">${entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardEstadisticasFuturista() {
  // 📝 3. ESTADO CON TIPO DEFINIDO
  const [stats, setStats] = useState<StatsData>({
    topProductos: [], 
    horasPico: [], 
    mejoresDias: [], 
    totalHistorico: 0
  });
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/estadisticas')
      .then(res => res.json())
      .then((datos: StatsData) => { 
        setStats(datos); 
        setCargando(false); 
      })
      .catch(err => console.error("Error en stats:", err));
  }, []);

  if (cargando) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-3xl font-bold text-gray-400 gap-4 bg-[#e0e5ec]">
        <span className="animate-pulse">📊</span> Cargando Métricas...
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-gradient-to-br from-[#e0e5ec] to-[#f4f7f6] text-gray-800 font-sans p-3 md:p-4 lg:p-6 flex flex-col overflow-hidden">
      
      {/* 🟢 ENCABEZADO */}
      <div className="flex-none flex justify-between items-center mb-4 h-14 md:h-16">
        <div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-800 tracking-tight leading-none">📊 Centro de Mando</h2>
          <p className="text-sm md:text-base text-gray-500 font-medium hidden sm:block">Inteligencia Comercial en Tiempo Real</p>
        </div>
        <Link href="/productos" className="px-4 py-2 md:px-6 md:py-3 bg-white/60 backdrop-blur-md text-gray-600 font-bold rounded-xl hover:bg-white hover:text-[#b12431] shadow-sm transition-all border border-white/50 text-sm md:text-base flex items-center gap-2">
          ← Volver
        </Link>
      </div>

      {/* 🧩 GRID PRINCIPAL */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 grid-rows-4 lg:grid-rows-2 gap-4">
        
        {/* 💰 INGRESOS TOTALES */}
        <div className="lg:col-span-1 lg:row-span-1 relative group overflow-hidden bg-gradient-to-br from-[#b12431] to-red-900 rounded-[2rem] p-6 text-white shadow-lg flex flex-col justify-center">
          <div className="absolute -inset-10 bg-white/10 blur-3xl rounded-full opacity-30"></div>
          <div className="relative z-10 flex flex-col h-full justify-center">
            <h3 className="text-sm md:text-lg font-bold opacity-80 uppercase tracking-wider mb-1">Ingresos Totales</h3>
            <p className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-none">
              ${stats.totalHistorico.toLocaleString('es-AR')}
            </p>
            <div className="absolute right-0 bottom-0 text-6xl md:text-8xl opacity-10 translate-x-4 translate-y-4 select-none">💰</div>
          </div>
        </div>

        {/* ⏰ HORARIOS PICO */}
        <div className="lg:col-span-2 lg:row-span-1 bg-white/60 backdrop-blur-2xl rounded-[2rem] p-4 md:p-6 shadow-sm border border-white/50 flex flex-col min-h-0">
          <h3 className="text-lg md:text-xl font-black text-blue-800 mb-2 md:mb-4 flex items-center gap-2 flex-none">
            <span className="text-xl md:text-2xl">⏰</span> Flujo de Ventas
          </h3>
          <div className="flex-1 min-h-0 w-full">
            {stats.horasPico.length === 0 ? (
               <div className="h-full flex items-center justify-center text-gray-400">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.horasPico} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                  <XAxis dataKey="hora" stroke="rgba(0,0,0,0.3)" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                  <YAxis stroke="rgba(0,0,0,0.3)" tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <defs>
                    <linearGradient id="colorHora" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="cantidad_tickets" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHora)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 🏆 PRODUCTOS ESTRELLA */}
        <div className="lg:col-span-2 lg:row-span-1 bg-white/60 backdrop-blur-2xl rounded-[2rem] p-4 md:p-6 shadow-sm border border-white/50 flex flex-col min-h-0">
          <h3 className="text-lg md:text-xl font-black text-gray-700 mb-2 md:mb-4 flex items-center gap-2 flex-none">
            <span className="text-xl md:text-2xl">🏆</span> Más Vendidos
          </h3>
          <div className="flex-1 min-h-0 w-full">
            {stats.topProductos.length === 0 ? (
               <div className="h-full flex items-center justify-center text-gray-400">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topProductos} layout="vertical" margin={{ top: 0, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} horizontal={false} />
                  <YAxis dataKey="nombre" type="category" stroke="rgba(0,0,0,0.5)" tick={{ fontSize: 13, fontWeight: 'bold' }} width={100} />
                  <XAxis type="number" hide={true} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="total_vendido" fill="url(#colorUv)" radius={[0, 8, 8, 0]} barSize={24} />
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="#b12431" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#d93846" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 📅 DÍAS FUERTES */}
        <div className="lg:col-span-1 lg:row-span-1 bg-white/60 backdrop-blur-2xl rounded-[2rem] p-4 md:p-6 shadow-sm border border-white/50 flex flex-col min-h-0">
          <h3 className="text-lg md:text-xl font-black text-emerald-800 mb-2 md:mb-4 flex items-center gap-2 flex-none">
            <span className="text-xl md:text-2xl">📅</span> Días Fuertes
          </h3>
          <div className="flex-1 min-h-0 w-full">
            {stats.mejoresDias.length === 0 ? (
               <div className="h-full flex items-center justify-center text-gray-400">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.mejoresDias} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                  <XAxis dataKey="dia" stroke="rgba(0,0,0,0.5)" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                  <YAxis stroke="rgba(0,0,0,0.3)" tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="ingresos" name="Ingresos" fill="url(#colorDia)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="colorDia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}