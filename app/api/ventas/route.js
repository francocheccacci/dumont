import { conectarDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 📜 GET: Obtener historial con filtros de tiempo
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'hoy';
    const pagina = parseInt(searchParams.get('pagina')) || 1;
    const limite = 5; // El máximo que pediste
    const offset = (pagina - 1) * limite;

    const client = await conectarDB();

    // 1. Definir filtro de fecha
    let filtroFecha = "date(fecha_hora) = date('now', 'localtime')";
    if (periodo === 'semana') filtroFecha = "date(fecha_hora) >= date('now', 'localtime', '-7 days')";
    if (periodo === 'mes') filtroFecha = "date(fecha_hora) >= date('now', 'localtime', '-30 days')";
    if (periodo === 'todos') filtroFecha = "1=1";

    // 2. Obtener el TOTAL de registros para calcular las páginas
    const totalRes = await client.execute(`SELECT COUNT(*) as total FROM ventas WHERE ${filtroFecha}`);
    const totalRegistros = totalRes.rows[0].total;
    const totalPaginas = Math.ceil(totalRegistros / limite);

    // 3. Obtener los datos paginados
    const resultado = await client.execute({
      sql: `SELECT * FROM ventas 
            WHERE ${filtroFecha}
            ORDER BY fecha_hora DESC 
            LIMIT ? OFFSET ?`,
      args: [limite, offset]
    });

    return NextResponse.json({
      ventas: resultado.rows,
      totalPaginas,
      paginaActual: pagina
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🧾 POST: Procesar nueva venta (Productos + Combos + Stock)
export async function POST(request) {
  try {
    const { carrito, total } = await request.json();
    const client = await conectarDB();

    // 1. Insertamos la VENTA primero para obtener su ID real y único
    const resVenta = await client.execute({
      sql: `INSERT INTO ventas (total_venta, fecha_hora) 
            VALUES (?, datetime('now', 'localtime'))`,
      args: [total]
    });

    const ventaId = resVenta.lastInsertRowid;
    const operaciones = [];

    // 2. Procesamos cada ítem del carrito
    for (const item of carrito) {
      if (item.esCombo) {
        // --- LÓGICA DE COMBO ---
        // Insertamos el ítem vinculándolo al combo_id
        operaciones.push({
          sql: `INSERT INTO venta_items (venta_id, combo_id, cantidad_vendida, precio_unitario_momento, subtotal) 
                VALUES (?, ?, ?, ?, ?)`,
          args: [ventaId, item.id, item.cantidad, item.precio_final, item.subtotal]
        });

        // Buscamos los ingredientes de este combo para descontar stock individual
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
        // --- LÓGICA PRODUCTO SIMPLE ---
        operaciones.push({
          sql: `INSERT INTO venta_items (venta_id, producto_id, cantidad_vendida, precio_unitario_momento, subtotal) 
                VALUES (?, ?, ?, ?, ?)`,
          args: [ventaId, item.id, item.cantidad, item.precio_final, item.subtotal]
        });

        // Restamos stock del producto directamente
        operaciones.push({
          sql: 'UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?',
          args: [item.cantidad, item.id]
        });
      }
    }

    // 3. Ejecutamos todo el lote de items y stocks en una sola transacción
    await client.batch(operaciones, "write");

    return NextResponse.json({ 
      success: true, 
      numeroTicket: ventaId.toString() 
    });

  } catch (error) {
    console.error("Error crítico en proceso de venta:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}