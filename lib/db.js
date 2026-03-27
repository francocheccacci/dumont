// lib/db.js
import { createClient } from '@libsql/client';

console.log("🔍 URL de Turso:", process.env.TURSO_DATABASE_URL ? "Detectada ✅" : "NO DETECTADA ❌");
console.log("🔍 Token de Turso:", process.env.TURSO_AUTH_TOKEN ? "Detectado ✅" : "NO DETECTADO ❌");

let client = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_DATABASE_KEY || "",
});


export async function conectarDB() {
  if (!client) {
    // Configuración usando variables de entorno (Debes agregarlas en Vercel)
      client = createClient({
        url: process.env.TURSO_DATABASE_URL || "",
        authToken: process.env.TURSO_AUTH_TOKEN || "",
      });

    // 1. CREAR TABLAS
    // Turso usa .execute() para sentencias SQL
    await client.execute(`
      CREATE TABLE IF NOT EXISTS categorias (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS productos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          categoria_id INTEGER,
          tipo_medida TEXT CHECK(tipo_medida IN ('kg', 'unidad')) DEFAULT 'kg',
          stock_actual REAL DEFAULT 0,
          costo REAL NOT NULL,
          margen_ganancia REAL DEFAULT 30.00,
          precio_final REAL NOT NULL,
          ultima_reposicion DATE,
          FOREIGN KEY (categoria_id) REFERENCES categorias(id)
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS ventas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fecha_hora DATETIME DEFAULT (datetime('now', 'localtime')),
          total_venta REAL NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS venta_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          venta_id INTEGER,
          producto_id INTEGER,
          cantidad_vendida REAL,
          precio_unitario_momento REAL,
          subtotal REAL,
          FOREIGN KEY (venta_id) REFERENCES ventas(id),
          FOREIGN KEY (producto_id) REFERENCES productos(id)
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS reposiciones (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          producto_id INTEGER,
          cantidad_agregada REAL,
          fecha_hora DATETIME DEFAULT (datetime('now', 'localtime')),
          FOREIGN KEY (producto_id) REFERENCES productos(id)
      );
    `);

    // 2. SEMILLA DE DATOS
    const check = await client.execute('SELECT COUNT(*) as count FROM productos');
    const count = check.rows[0].count;

    if (count === 0) {
      console.log("Inyectando datos de prueba en Turso... ☁️");
      
      await client.execute('INSERT INTO categorias (nombre) VALUES ("General")');

      // Turso permite ejecutar múltiples inserts o usar batch, aquí lo mantengo simple:
      const semillas = [
        ['Pollo Entero', 1, 'kg', 45.5, 2200, 3100],
        ['Milanesas de Pollo', 1, 'kg', 20.0, 3800, 5500],
        ['Pata y Muslo', 1, 'kg', 30.0, 2100, 2950],
        ['Alitas de Pollo', 1, 'kg', 12.0, 1100, 1600],
        ['Maple de Huevos', 1, 'unidad', 15.0, 4200, 5800],
        ['Pechuga deshuesada', 1, 'kg', 10.0, 4500, 6800]
      ];

      for (const s of semillas) {
        await client.execute({
          sql: `INSERT INTO productos (nombre, categoria_id, tipo_medida, stock_actual, costo, precio_final) 
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: s
        });
      }
      
      console.log("Datos inyectados con éxito en la nube. ✨");
    }
  }
  return client;
}