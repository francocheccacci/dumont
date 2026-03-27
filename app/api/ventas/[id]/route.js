import { conectarDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const client = await conectarDB();

    // 1. Buscamos los datos generales de la venta (fecha, total)
    // Turso: El equivalente a .get() es .execute() y tomar el primer elemento de .rows
    const ventaRes = await client.execute({
      sql: 'SELECT * FROM ventas WHERE id = ?',
      args: [id]
    });

    const venta = ventaRes.rows[0];

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada 🕵️‍♂️' }, { status: 404 });
    }

    // 2. Buscamos el detalle de los productos que se llevó
    // Turso: El equivalente a .all() es .execute() y tomar todo el array .rows
    const itemsRes = await client.execute({
      sql: `
        SELECT vi.*, p.nombre, p.tipo_medida 
        FROM venta_items vi
        JOIN productos p ON vi.producto_id = p.id
        WHERE vi.venta_id = ?
      `,
      args: [id]
    });

    const items = itemsRes.rows;

    // Devolvemos todo empaquetado como lo espera tu Frontend
    return NextResponse.json({ venta, items });

  } catch (error) {
    console.error("Error al obtener detalle del ticket en Turso:", error);
    return NextResponse.json({ error: 'Error al obtener detalle' }, { status: 500 });
  }
}