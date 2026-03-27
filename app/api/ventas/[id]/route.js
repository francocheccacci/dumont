import { conectarDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const client = await conectarDB();

    const ventaRes = await client.execute({
      sql: 'SELECT * FROM ventas WHERE id = ?',
      args: [id]
    });

    if (!ventaRes.rows[0]) return NextResponse.json({ error: 'No existe' }, { status: 404 });

    // JOIN Triple: Trae nombre de Producto O nombre de Combo
    const itemsRes = await client.execute({
      sql: `
        SELECT 
          vi.*, 
          COALESCE(p.nombre, c.nombre) as nombre,
          COALESCE(p.tipo_medida, 'U.') as tipo_medida
        FROM venta_items vi
        LEFT JOIN productos p ON vi.producto_id = p.id
        LEFT JOIN combos c ON vi.combo_id = c.id
        WHERE vi.venta_id = ?
      `,
      args: [id]
    });

    return NextResponse.json({ venta: ventaRes.rows[0], items: itemsRes.rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}