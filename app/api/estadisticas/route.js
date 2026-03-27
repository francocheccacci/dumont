import { conectarDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'hoy'; // hoy, semana, mes
    const client = await conectarDB();

    // --- 1. Definición del Filtro de Fecha (SQLite/Turso) ---
    let filtroFecha = "date(fecha_hora) = date('now', 'localtime')"; // Hoy por defecto
    if (periodo === 'semana') {
      filtroFecha = "date(fecha_hora) >= date('now', 'localtime', '-7 days')";
    } else if (periodo === 'mes') {
      filtroFecha = "date(fecha_hora) >= date('now', 'localtime', '-30 days')";
    }

    // --- 2. Productos más vendidos en el periodo ---
    // Necesitamos JOIN con ventas para filtrar por fecha_hora
  const topProductosRaw = await client.execute({
      sql: `
        SELECT 
          p.nombre, 
          p.tipo_medida,
          SUM(vi.cantidad_vendida) as total_vendido,
          SUM((vi.precio_unitario_momento - p.costo) * vi.cantidad_vendida) as ganancia_total
        FROM venta_items vi
        JOIN productos p ON vi.producto_id = p.id
        JOIN ventas v ON vi.venta_id = v.id
        WHERE ${filtroFecha.replace('fecha_hora', 'v.fecha_hora')}
        GROUP BY p.id
        ORDER BY ganancia_total DESC 
        LIMIT 10
      `, // Traemos 10 para que el ranking sea más nutrido
      args: []
    });

    // --- 3. Flujo de ventas (Línea de tiempo) ---
    // Si es hoy: agrupamos por HORA. Si es semana/mes: agrupamos por DÍA.
    let queryFlujo = "";
    if (periodo === 'hoy') {
      // Cálculo de Ganancia Neta por HORA para HOY
      queryFlujo = `
        SELECT 
          strftime('%H', v.fecha_hora) as etiqueta, 
          SUM((vi.precio_unitario_momento - p.costo) * vi.cantidad_vendida) as valor
        FROM ventas v
        JOIN venta_items vi ON v.id = vi.venta_id
        JOIN productos p ON vi.producto_id = p.id
        WHERE ${filtroFecha.replace('fecha_hora', 'v.fecha_hora')}
        GROUP BY etiqueta 
        ORDER BY etiqueta ASC`;
    } else {
      // Para semana/mes seguimos mostrando el volumen de ventas (Ingresos Brutos) por DÍA
      // o podrías aplicar la misma lógica de ganancia si prefieres.
      queryFlujo = `
        SELECT date(fecha_hora) as etiqueta, SUM(total_venta) as valor
        FROM ventas 
        WHERE ${filtroFecha}
        GROUP BY etiqueta ORDER BY etiqueta ASC`;
    }
    const flujoRes = await client.execute(queryFlujo);

    // --- 4. Mejores días de la semana (Distribución semanal en el periodo) ---
    const mejoresDiasRaw = await client.execute(`
      SELECT strftime('%w', fecha_hora) as dia_numero, SUM(total_venta) as ingresos
      FROM ventas
      WHERE ${filtroFecha}
      GROUP BY dia_numero
      ORDER BY dia_numero ASC
    `);

    const nombresDias = ["D", "L", "M", "M", "J", "V", "S"];
    const mejoresDias = nombresDias.map((nombre, index) => {
      const registro = mejoresDiasRaw.rows.find(d => d.dia_numero === index.toString());
      return {
        dia: nombre,
        ingresos: registro ? Number(registro.ingresos) : 0
      };
    });

    // --- 5. Total de Ingresos del Periodo Seleccionado ---
    const totalPeriodoRaw = await client.execute(`
      SELECT SUM(total_venta) as total 
      FROM ventas 
      WHERE ${filtroFecha}
    `);

    return NextResponse.json({
      topProductos: topProductosRaw.rows,
      flujoVentas: flujoRes.rows,
      mejoresDias,
      totalPeriodo: totalPeriodoRaw.rows[0]?.total || 0,
      periodoActivo: periodo
    });

  } catch (error) {
    console.error("Error en estadísticas:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}