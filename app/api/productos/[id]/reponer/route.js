import { conectarDB } from '../../../../../lib/db';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { cantidad_agregada } = await request.json();
    const db = await conectarDB();

    // 1. FORZAMOS la creación de la tabla por si SQLite no la creó antes
    await db.exec(`
      CREATE TABLE IF NOT EXISTS reposiciones (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          producto_id INTEGER,
          cantidad_agregada REAL,
          fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (producto_id) REFERENCES productos(id)
      )
    `);

    // 2. Anotamos en el historial
    await db.run(
      'INSERT INTO reposiciones (producto_id, cantidad_agregada) VALUES (?, ?)',
      [id, cantidad_agregada]
    );

    // 3. Sumamos al stock
    await db.run(
      'UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?',
      [cantidad_agregada, id]
    );

    return NextResponse.json({ success: true, message: 'Stock actualizado' });
  } catch (error) {
    console.error("Error oculto al reponer:", error);
    // Si hay un error, le avisamos al Frontend
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}