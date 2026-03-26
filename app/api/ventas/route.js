import { conectarDB } from '../../../lib/db';
import { NextResponse } from 'next/server';

// Usamos POST porque estamos "enviando" nueva información para guardar
export async function POST(request) {
  try {
    // 1. Recibimos el ticket de la caja (el carrito y el total de plata)
    const datos = await request.json();
    const { carrito, total } = datos;

    const db = await conectarDB();

    // 2. Guardamos la Venta General (Fecha, Hora y Total)
    const resultadoVenta = await db.run(
      'INSERT INTO ventas (total_venta) VALUES (?)',
      [total]
    );
    
    // Obtenemos el número de ticket que la base de datos acaba de crear
    const ventaId = resultadoVenta.lastID;

    // 3. Guardamos cada producto del ticket y descontamos el stock
    for (const item of carrito) {
      // Guardamos el detalle de lo que se llevó
      await db.run(
        `INSERT INTO venta_items (venta_id, producto_id, cantidad_vendida, precio_unitario_momento, subtotal) 
         VALUES (?, ?, ?, ?, ?)`,
        [ventaId, item.id, item.cantidad, item.precio_final, item.subtotal]
      );

      // ¡Magia! Descontamos el stock de la heladera/congelador
      await db.run(
        'UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?',
        [item.cantidad, item.id]
      );
    }

    // Le avisamos a la pantalla de la caja que todo salió perfecto
    return NextResponse.json({ 
      success: true, 
      message: '¡Venta cobrada y guardada con éxito!',
      numeroTicket: ventaId
    });

  } catch (error) {
    console.error("Error al cobrar:", error);
    return NextResponse.json(
      { error: 'Hubo un problema al guardar la venta' }, 
      { status: 500 }
    );
  }
}

// Función para OBTENER el historial de ventas
export async function GET() {
  try {
    const db = await conectarDB();
    
    // Buscamos las últimas 100 ventas, de la más nueva a la más vieja
    const ventas = await db.all(`
      SELECT * FROM ventas 
      ORDER BY fecha_hora DESC 
      LIMIT 100
    `);

    return NextResponse.json(ventas);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    return NextResponse.json({ error: 'Error al obtener el historial' }, { status: 500 });
  }
}