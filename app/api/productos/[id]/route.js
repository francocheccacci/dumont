import { conectarDB } from '../../../../lib/db';
import { NextResponse } from 'next/server';

// Función para ACTUALIZAR (Editar) un producto
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const datos = await request.json();
    const db = await conectarDB();

    await db.run(
      `UPDATE productos 
       SET nombre = ?, tipo_medida = ?, stock_actual = ?, costo = ?, precio_final = ? 
       WHERE id = ?`,
      [datos.nombre, datos.tipo_medida, datos.stock_actual, datos.costo, datos.precio_final, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

// Función para ELIMINAR un producto
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const db = await conectarDB();

    await db.run('DELETE FROM productos WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}