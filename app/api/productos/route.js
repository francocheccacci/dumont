import { conectarDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await conectarDB();

    // 1. Buscamos los productos en la nube
    const resultado = await client.execute('SELECT * FROM productos ORDER BY nombre ASC');
    let productos = resultado.rows;

    // 2. Semilla de datos (Si la nube está vacía)
    if (productos.length === 0) {
      console.log("Inyectando semillas en Turso...");
      
      // En Turso usamos un batch para las semillas (más rápido)
      await client.batch([
        "INSERT INTO categorias (nombre) VALUES ('Frescos')",
        {
          sql: `INSERT INTO productos (nombre, categoria_id, tipo_medida, costo, precio_final, stock_actual)
                VALUES 
                ('Pollo Entero', 1, 'kg', 1500, 2200, 10),
                ('Milanesas de Pollo', 1, 'kg', 2500, 3500, 5),
                ('Maple de Huevos', 1, 'unidad', 3000, 4200, 8)`,
          args: []
        }
      ], "write");
      
      // Volvemos a buscar
      const reintento = await client.execute('SELECT * FROM productos ORDER BY nombre ASC');
      productos = reintento.rows;
    }

    return NextResponse.json(productos);
    
  } catch (error) {
    console.error("Error en GET productos (Turso):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const datos = await request.json();
    const client = await conectarDB();

    // Insertamos usando args para evitar inyección SQL
    const resultado = await client.execute({
      sql: `INSERT INTO productos (nombre, categoria_id, tipo_medida, stock_actual, costo, precio_final) 
            VALUES (?, 1, ?, ?, ?, ?)`,
      args: [
        datos.nombre, 
        datos.tipo_medida, 
        datos.stock_actual || 0, 
        datos.costo, 
        datos.precio_final
      ]
    });

    // En Turso, el ID generado está en lastInsertRowid
    return NextResponse.json({ 
      success: true, 
      id: resultado.lastInsertRowid?.toString() 
    });

  } catch (error) {
    console.error("Error en POST productos (Turso):", error);
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}