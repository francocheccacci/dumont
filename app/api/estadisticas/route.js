import { conectarDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await conectarDB();

    // 1. Productos más vendidos
    // Turso: usamos .execute y accedemos a .rows
    const topProductosRaw = await client.execute(`
      SELECT p.nombre, p.tipo_medida, SUM(vi.cantidad_vendida) as total_vendido
      FROM venta_items vi
      JOIN productos p ON vi.producto_id = p.id
      GROUP BY p.id
      ORDER BY total_vendido DESC
      LIMIT 5
    `);
    const topProductos = topProductosRaw.rows;

    // 2. Horarios con más ventas
    const horasPicoRaw = await client.execute(`
      SELECT strftime('%H', fecha_hora) as hora, COUNT(*) as cantidad_tickets
      FROM ventas
      GROUP BY hora
      ORDER BY hora ASC
    `);
    
    const horasPico = Array.from({ length: 24 }, (_, i) => {
      const horaStr = i.toString().padStart(2, '0');
      // Buscamos en .rows
      const registro = horasPicoRaw.rows.find(h => h.hora === horaStr);
      return {
        hora: `${horaStr}:00`,
        cantidad_tickets: registro ? Number(registro.cantidad_tickets) : 0
      };
    });

    // 3. Mejores días de la semana
    const mejoresDiasRaw = await client.execute(`
      SELECT strftime('%w', fecha_hora) as dia_numero, SUM(total_venta) as ingresos
      FROM ventas
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

    // 4. Ingreso Total Histórico
    // En Turso, el equivalente a .get() es execute().rows[0]
    const totalHistoricoRaw = await client.execute(`SELECT SUM(total_venta) as gran_total FROM ventas`);
    const granTotal = totalHistoricoRaw.rows[0]?.gran_total || 0;

    return NextResponse.json({
      topProductos,
      horasPico,
      mejoresDias,
      totalHistorico: granTotal
    });

  } catch (error) {
    console.error("Error en estadísticas:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}