import { conectarDB } from '../../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = await conectarDB();

    // 1. Buscamos los datos generales de la venta (fecha, total)
    const venta = await db.get('SELECT * FROM ventas WHERE id = ?', [id]);

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // 2. Buscamos el detalle de los productos que se llevó
    const items = await db.all(`
      SELECT vi.*, p.nombre, p.tipo_medida 
      FROM venta_items vi
      JOIN productos p ON vi.producto_id = p.id
      WHERE vi.venta_id = ?
    `, [id]);

    // Devolvemos todo empaquetado
    return NextResponse.json({ venta, items });

  } catch (error) {
    console.error("Error al obtener detalle del ticket:", error);
    return NextResponse.json({ error: 'Error al obtener detalle' }, { status: 500 });
  }
}