import { conectarDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { cantidad_agregada } = await request.json();
    
    // Validamos que la cantidad sea un número válido
    const cantidad = parseFloat(cantidad_agregada);
    if (isNaN(cantidad) || cantidad <= 0) {
      return NextResponse.json({ error: "Cantidad no válida" }, { status: 400 });
    }

    const client = await conectarDB();

    // Usamos batch para enviar todo en una sola transacción a la nube
    await client.batch([
      // 1. Aseguramos la tabla (Opcional si ya lo haces en db.js, pero no estorba)
      {
        sql: `CREATE TABLE IF NOT EXISTS reposiciones (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          producto_id INTEGER,
          cantidad_agregada REAL,
          fecha_hora DATETIME DEFAULT (datetime('now', 'localtime')),
          FOREIGN KEY (producto_id) REFERENCES productos(id)
        )`,
        args: []
      },
      // 2. Anotamos en el historial
      {
        sql: 'INSERT INTO reposiciones (producto_id, cantidad_agregada) VALUES (?, ?)',
        args: [id, cantidad]
      },
      // 3. Sumamos al stock
      {
        sql: 'UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?',
        args: [cantidad, id]
      }
    ], "write"); // "write" asegura que sea una transacción atómica

    return NextResponse.json({ success: true, message: 'Stock actualizado en la nube ✨' });

  } catch (error) {
    console.error("Error al reponer stock en Turso:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}