import { conectarDB } from '../../../lib/db';
import { NextResponse } from 'next/server';
// 👇 AGREGA ESTA LÍNEA EXACTAMENTE AQUÍ 👇
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    // 1. Encendemos el motor de la base de datos
    const db = await conectarDB();

    // 2. Buscamos si ya hay productos guardados
    let productos = await db.all('SELECT * FROM productos');

    // 3. ¡Magia! Si la lista está vacía, agregamos productos de prueba iniciales
    if (productos.length === 0) {
      await db.exec(`
        INSERT INTO categorias (nombre) VALUES ('Frescos');
        
        INSERT INTO productos (nombre, categoria_id, tipo_medida, costo, precio_final)
        VALUES 
        ('Pollo Entero', 1, 'kg', 1500, 2200),
        ('Milanesas de Pollo', 1, 'kg', 2500, 3500),
        ('Maple de Huevos', 1, 'unidad', 3000, 4200);
      `);
      
      // Volvemos a buscar la lista ahora que ya tiene productos
      productos = await db.all('SELECT * FROM productos');
    }

    // 4. Enviamos la lista de productos como respuesta
    return NextResponse.json(productos);
    
  } catch (error) {
    console.error("Error al conectar con la base de datos:", error);
    return NextResponse.json(
      { error: 'Hubo un problema al buscar los productos' }, 
      { status: 500 }
    );
  }
}


export async function POST(request) {
  try {
    const datos = await request.json();
    const db = await conectarDB();

    const resultado = await db.run(
      `INSERT INTO productos (nombre, categoria_id, tipo_medida, stock_actual, costo, precio_final) 
       VALUES (?, 1, ?, ?, ?, ?)`, 
      [datos.nombre, datos.tipo_medida, datos.stock_actual || 0, datos.costo, datos.precio_final]
    );

    return NextResponse.json({ success: true, id: resultado.lastID });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}