import { conectarDB } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET: Traer ingredientes de un combo específico para editar
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const client = await conectarDB();

    const res = await client.execute({
      sql: `SELECT ci.*, p.nombre, p.costo as costo_unitario 
            FROM combo_items ci 
            JOIN productos p ON ci.producto_id = p.id 
            WHERE ci.combo_id = ?`,
      args: [id]
    });

    return NextResponse.json(res.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar combo
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const client = await conectarDB();
    
    // El ON DELETE CASCADE en la base de datos se encarga de borrar los combo_items solo
    await client.execute({ sql: 'DELETE FROM combos WHERE id = ?', args: [id] });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Actualizar combo
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { nombre, margen_ganancia, precio_final, items } = await request.json();
    const client = await conectarDB();

    const operaciones = [
      // 1. Actualizar cabecera
      {
        sql: `UPDATE combos SET nombre = ?, margen_ganancia = ?, precio_final = ? WHERE id = ?`,
        args: [nombre, margen_ganancia, precio_final, id]
      },
      // 2. Borrar items viejos
      {
        sql: `DELETE FROM combo_items WHERE combo_id = ?`,
        args: [id]
      }
    ];

    // 3. Insertar items nuevos
    items.forEach(item => {
      operaciones.push({
        sql: `INSERT INTO combo_items (combo_id, producto_id, cantidad) VALUES (?, ?, ?)`,
        args: [id, item.producto_id, item.cantidad]
      });
    });

    await client.batch(operaciones, "write");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}