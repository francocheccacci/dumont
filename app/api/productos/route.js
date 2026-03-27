import { conectarDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await conectarDB();

    // 1. Buscamos productos con el nombre de su categoría
    const resultado = await client.execute(`
      SELECT p.*, c.nombre as categoria_nombre 
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ORDER BY p.nombre ASC
    `);
    
    let productos = resultado.rows;

    // 2. Semilla de datos (Solo si la base está totalmente vacía)
    if (productos.length === 0) {
      console.log("Inyectando semillas de categorías y productos...");
      
      await client.batch([
        // Insertamos categorías básicas si no existen
        "INSERT OR IGNORE INTO categorias (id, nombre) VALUES (1, 'Frescos')",
        "INSERT OR IGNORE INTO categorias (id, nombre) VALUES (2, 'Congelados')",
        // Insertamos productos vinculados
        {
          sql: `INSERT INTO productos (nombre, categoria_id, tipo_medida, costo, precio_final, stock_actual, margen_ganancia)
                VALUES 
                ('Pollo Entero', 1, 'kg', 1500, 2200, 10, 46.6),
                ('Nuggets Congelados', 2, 'kg', 3000, 4500, 20, 50),
                ('Maple de Huevos', 1, 'unidad', 3000, 4200, 8, 40)`,
          args: []
        }
      ], "write");
      
      const reintento = await client.execute(`
        SELECT p.*, c.nombre as categoria_nombre 
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        ORDER BY p.nombre ASC
      `);
      productos = reintento.rows;
    }

    return NextResponse.json(productos);
    
  } catch (error) {
    console.error("Error en GET productos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const datos = await request.json();
    const client = await conectarDB();

    // Ahora el categoria_id viene del formulario (frescos o congelados)
    const resultado = await client.execute({
      sql: `INSERT INTO productos (nombre, categoria_id, tipo_medida, stock_actual, costo, precio_final, margen_ganancia) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        datos.nombre, 
        datos.categoria_id || 1, // Si no viene, por defecto es Frescos
        datos.tipo_medida, 
        datos.stock_actual || 0, 
        datos.costo, 
        datos.precio_final,
        datos.margen_ganancia || 30
      ]
    });

    return NextResponse.json({ 
      success: true, 
      id: resultado.lastInsertRowid?.toString() 
    });

  } catch (error) {
    console.error("Error en POST productos:", error);
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}