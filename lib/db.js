import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db = null;

export async function conectarDB() {
  if (!db) {
    // 1. DETECTAR ENTORNO: Vercel usa la carpeta /tmp para escribir archivos temporales
    const esVercel = process.env.VERCEL === '1';
    const filename = esVercel ? '/tmp/polleria.db' : './polleria.db';

    db = await open({
      filename,
      driver: sqlite3.Database,
    });

    // 2. CREAR TABLAS (Tu código original con ajustes de seguridad)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS categorias (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL
      );

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

      CREATE TABLE IF NOT EXISTS ventas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fecha_hora DATETIME DEFAULT (datetime('now', 'localtime')),
          total_venta REAL NOT NULL
      );

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

    // 3. SEMILLA DE DATOS (Solo si la base de datos está vacía)
    const checkProductos = await db.get('SELECT COUNT(*) as count FROM productos');
    
    if (checkProductos.count === 0) {
      console.log("Inyectando datos de prueba para la demo...");
      
      // Creamos una categoría por defecto
      await db.run('INSERT INTO categorias (nombre) VALUES ("General")');

      // Insertamos productos clásicos de pollería para que la demo luzca bien
      await db.run(`
        INSERT INTO productos (nombre, categoria_id, tipo_medida, stock_actual, costo, precio_final) 
        VALUES 
        ('Pollo Entero', 1, 'kg', 45.5, 2200, 3100),
        ('Milanesas de Pollo', 1, 'kg', 20.0, 3800, 5500),
        ('Pata y Muslo', 1, 'kg', 30.0, 2100, 2950),
        ('Alitas de Pollo', 1, 'kg', 12.0, 1100, 1600),
        ('Maple de Huevos', 1, 'unidad', 15.0, 4200, 5800),
        ('Pechuga deshuesada', 1, 'kg', 10.0, 4500, 6800)
      `);
      
      console.log("Datos inyectados con éxito. ✨");
    }
  }
  return db;
}