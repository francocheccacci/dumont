import { conectarDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { carrito, total } = await request.json();
    const client = await conectarDB();

    // 1. Insertamos la VENTA primero para obtener su ID real
    const resVenta = await client.execute({
      sql: `INSERT INTO ventas (total_venta, fecha_hora) 
            VALUES (?, datetime('now', 'localtime'))`,
      args: [total]
    });

    const ventaId = resVenta.lastInsertRowid; // Este es el ID único de esta venta
    const operaciones = [];

    // 2. Ahora preparamos los productos usando ese ventaId fijo
    for (const item of carrito) {
      if (item.esCombo) {
        // LÓGICA DE COMBO
        operaciones.push({
          sql: `INSERT INTO venta_items (venta_id, combo_id, cantidad_vendida, precio_unitario_momento, subtotal) 
                VALUES (?, ?, ?, ?, ?)`,
          args: [ventaId, item.id, item.cantidad, item.precio_final, item.subtotal]
        });

        // Descontar stock de ingredientes
        const ingredientesRes = await client.execute({
          sql: `SELECT producto_id, cantidad FROM combo_items WHERE combo_id = ?`,
          args: [item.id]
        });

        ingredientesRes.rows.forEach(ing => {
          operaciones.push({
            sql: `UPDATE productos SET stock_actual = stock_actual - (? * ?) WHERE id = ?`,
            args: [ing.cantidad, item.cantidad, ing.producto_id]
          });
        });
      } else {
        // LÓGICA PRODUCTO SIMPLE
        operaciones.push({
          sql: `INSERT INTO venta_items (venta_id, producto_id, cantidad_vendida, precio_unitario_momento, subtotal) 
                VALUES (?, ?, ?, ?, ?)`,
          args: [ventaId, item.id, item.cantidad, item.precio_final, item.subtotal]
        });

        operaciones.push({
          sql: 'UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?',
          args: [item.cantidad, item.id]
        });
      }
    }

    // Ejecutamos todos los items y stocks en un solo lote
    await client.batch(operaciones, "write");

    return NextResponse.json({ 
      success: true, 
      numeroTicket: ventaId.toString() 
    });

  } catch (error) {
    console.error("Error crítico en venta:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// El GET se mantiene igual...
export async function GET() {
  try {
    const client = await conectarDB();
    const resultado = await client.execute(`SELECT * FROM ventas ORDER BY fecha_hora DESC LIMIT 100`);
    return NextResponse.json(resultado.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}