import { conectarDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ✏️ Función para ACTUALIZAR (Editar) un producto
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const datos = await request.json();
    const client = await conectarDB();

    // En Turso usamos .execute con sql y args
    await client.execute({
      sql: `UPDATE productos 
            SET nombre = ?, tipo_medida = ?, stock_actual = ?, costo = ?, precio_final = ? 
            WHERE id = ?`,
      args: [
        datos.nombre, 
        datos.tipo_medida, 
        datos.stock_actual, 
        datos.costo, 
        datos.precio_final, 
        id
      ]
    });

    return NextResponse.json({ success: true, message: "Producto actualizado en la nube ☁️" });
  } catch (error) {
    console.error("Error al actualizar en Turso:", error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

// 🗑️ Función para ELIMINAR un producto
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const client = await conectarDB();

    // Ejecutamos la eliminación
    await client.execute({
      sql: 'DELETE FROM productos WHERE id = ?',
      args: [id]
    });

    return NextResponse.json({ success: true, message: "Producto eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar en Turso:", error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}