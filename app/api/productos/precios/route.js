import { conectarDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PUT(request) {
  try {
    const { cambios } = await request.json();
    const client = await conectarDB();
    const operaciones = [];

    // "cambios" es un array con los productos que el dueño modificó
    cambios.forEach(prod => {
      // 1. Actualizamos el producto con el nuevo costo, margen y precio
      operaciones.push({
        sql: `UPDATE productos SET costo = ?, margen_ganancia = ?, precio_final = ? WHERE id = ?`,
        args: [prod.costo_nuevo, prod.margen_nuevo, prod.precio_nuevo, prod.id]
      });

      // 2. Guardamos la evidencia en el historial
      operaciones.push({
        sql: `INSERT INTO historial_precios (producto_id, costo_anterior, costo_nuevo, precio_anterior, precio_nuevo) 
              VALUES (?, ?, ?, ?, ?)`,
        args: [prod.id, prod.costo_anterior, prod.costo_nuevo, prod.precio_anterior, prod.precio_nuevo]
      });
    });

    // Ejecutamos todo de un solo golpe (Transacción)
    await client.batch(operaciones, "write");

    return NextResponse.json({ success: true, message: '¡Precios actualizados y registrados! 📈' });
  } catch (error) {
    console.error("Error al actualizar precios masivos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}