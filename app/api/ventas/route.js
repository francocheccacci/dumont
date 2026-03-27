import { conectarDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 🧾 Función para procesar una NUEVA VENTA
export async function POST(request) {
  try {
    const { carrito, total } = await request.json();
    const client = await conectarDB();

    // 1. Preparamos el "Batch": una lista de todas las órdenes SQL juntas
    const operaciones = [];

    // A. Insertar la venta principal
    operaciones.push({
      sql: `INSERT INTO ventas (total_venta, fecha_hora) 
            VALUES (?, datetime('now', 'localtime'))`,
      args: [total]
    });

    // B. Procesar cada producto del carrito
    carrito.forEach(item => {
      // Insertar detalle de la venta
      // Usamos (SELECT last_insert_rowid()) para agarrar el ID de la venta que acabamos de crear arriba
      operaciones.push({
        sql: `INSERT INTO venta_items (venta_id, producto_id, cantidad_vendida, precio_unitario_momento, subtotal) 
              VALUES ((SELECT last_insert_rowid()), ?, ?, ?, ?)`,
        args: [item.id, item.cantidad, item.precio_final, item.subtotal]
      });

      // Restar el stock
      operaciones.push({
        sql: 'UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?',
        args: [item.cantidad, item.id]
      });
    });

    // 2. Ejecutamos TODO de un solo golpe (Transacción Atómica)
    const resultado = await client.batch(operaciones, "write");

    // El ID de la venta es el lastInsertRowid del primer elemento del batch
    const ventaId = resultado[0].lastInsertRowid?.toString();

    return NextResponse.json({ 
      success: true, 
      message: '¡Venta cobrada y guardada en la nube! 🍗✨',
      numeroTicket: ventaId
    });

  } catch (error) {
    console.error("Error crítico al cobrar en Turso:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 📜 Función para obtener el HISTORIAL
export async function GET() {
  try {
    const client = await conectarDB();
    
    // Turso: los datos están en .rows
    const resultado = await client.execute(`
      SELECT * FROM ventas 
      ORDER BY fecha_hora DESC 
      LIMIT 100
    `);

    return NextResponse.json(resultado.rows);
  } catch (error) {
    console.error("Error al obtener ventas de Turso:", error);
    return NextResponse.json({ error: 'Error al obtener el historial' }, { status: 500 });
  }
}