import { conectarDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = await conectarDB();
    // Traemos el combo y calculamos el costo base sumando sus partes
    const res = await client.execute(`
      SELECT 
        c.*,
        COALESCE(SUM(p.costo * ci.cantidad), 0) as costo_total_base
      FROM combos c
      LEFT JOIN combo_items ci ON c.id = ci.combo_id
      LEFT JOIN productos p ON ci.producto_id = p.id
      GROUP BY c.id
    `);
    return NextResponse.json(res.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { nombre, margen_ganancia, precio_final, items } = await request.json();
    const client = await conectarDB();

    // 1. Insertamos el combo
    const resCombo = await client.execute({
      sql: `INSERT INTO combos (nombre, margen_ganancia, precio_final) VALUES (?, ?, ?)`,
      args: [nombre, margen_ganancia, precio_final]
    });
    
    const comboId = resCombo.lastInsertRowid;

    // 2. Insertamos sus ingredientes (items)
    const operaciones = items.map(item => ({
      sql: `INSERT INTO combo_items (combo_id, producto_id, cantidad) VALUES (?, ?, ?)`,
      args: [comboId, item.producto_id, item.cantidad]
    }));

    await client.batch(operaciones, "write");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}