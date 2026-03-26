import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Guardamos la conexión para no abrirla muchas veces y hacer el sistema muy rápido
let db = null;

export async function conectarDB() {
  if (!db) {
    // Abrimos (o creamos) el archivo donde se guardará todo
    db = await open({
      filename: './polleria.db', 
      driver: sqlite3.Database,
    });

    // Creamos las tablas automáticamente si es la primera vez que abrimos el sistema
    await db.exec(`
      -- Tabla para agrupar (ej: Frescos, Congelados)
      CREATE TABLE IF NOT EXISTS categorias (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL
      );

      -- Tabla principal de productos de la pollería
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

      -- Tabla para guardar el ticket de la venta general
      CREATE TABLE IF NOT EXISTS ventas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
          total_venta REAL NOT NULL
      );

      -- Tabla para guardar el detalle: qué productos exactos se llevaron
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
      
      CREATE TABLE IF NOT EXISTS reposiciones (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          producto_id INTEGER,
          cantidad_agregada REAL,
          fecha_hora DATETIME DEFAULT (datetime('now', 'localtime')),
          FOREIGN KEY (producto_id) REFERENCES productos(id)
      );
    `);
  }
  return db;
}

