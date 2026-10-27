/**
 * ============================================================
 * API E-COMMERCE - Evidencia GA7-220501096-AA5-EV03
 * Diseño y desarrollo de servicios web – proyecto
 *
 * Descripción:
 * Servicios web necesarios para un sistema de E-commerce:
 * - Autenticación (registro e inicio de sesión)
 * - Categorías de productos
 * - Productos (CRUD)
 * - Pedidos
 *
 * Tecnologías: Node.js nativo (módulo http)
 * Almacenamiento: archivos JSON (sin base de datos externa)
 * Versionamiento: Git
 * ============================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// ============================================================
// CONFIGURACIÓN
// ============================================================
const PORT = 3000;
const DATA_DIR = __dirname;

// Archivos de persistencia
const USERS_FILE = path.join(DATA_DIR, 'data', 'users.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'data', 'categories.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'data', 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'data', 'orders.json');

// ============================================================
// UTILIDADES
// ============================================================

/** Asegura que exista la carpeta data */
function ensureDataDir() {
  const dir = path.join(DATA_DIR, 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Lee un archivo JSON. Si no existe, lo crea con valor por defecto. */
function readJSON(filePath, defaultValue = []) {
  try {
    ensureDataDir();
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error leyendo', filePath, err.message);
    return defaultValue;
  }
}

/** Guarda datos en un archivo JSON */
function writeJSON(filePath, data) {
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error escribiendo', filePath, err.message);
  }
}

/** Envía respuesta JSON */
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data, null, 2));
}

/** Parsea el body de una petición POST/PUT */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Body inválido. Se espera JSON.'));
      }
    });
    req.on('error', reject);
  });
}

/** Genera un ID simple incremental */
function nextId(items) {
  if (!items.length) return 1;
  return Math.max(...items.map(i => i.id || 0)) + 1;
}

// ============================================================
// SERVICIO: AUTENTICACIÓN
// ============================================================

/**
 * POST /registro
 * Registra un nuevo usuario.
 * Body: { "usuario": "...", "contrasena": "...", "nombre": "..." }
 */
function registrarUsuario(body) {
  const { usuario, contrasena, nombre } = body;
  if (!usuario || !contrasena) {
    return { status: 400, data: { mensaje: 'Se requieren usuario y contraseña.' } };
  }
  const users = readJSON(USERS_FILE);
  if (users.find(u => u.usuario.toLowerCase() === usuario.toLowerCase())) {
    return { status: 400, data: { mensaje: 'El usuario ya se encuentra registrado.' } };
  }
  const nuevo = {
    id: nextId(users),
    usuario: usuario.trim(),
    contrasena, // En producción se debe hashear
    nombre: nombre || usuario,
    fechaRegistro: new Date().toISOString()
  };
  users.push(nuevo);
  writeJSON(USERS_FILE, users);
  return {
    status: 201,
    data: { mensaje: 'Registro exitoso.', usuario: nuevo.usuario, id: nuevo.id }
  };
}

/**
 * POST /login
 * Autentica un usuario.
 * Body: { "usuario": "...", "contrasena": "..." }
 */
function loginUsuario(body) {
  const { usuario, contrasena } = body;
  if (!usuario || !contrasena) {
    return { status: 400, data: { mensaje: 'Error en la autenticación: se requieren usuario y contraseña.' } };
  }
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.usuario.toLowerCase() === usuario.toLowerCase());
  if (!user || user.contrasena !== contrasena) {
    return {
      status: 401,
      data: { mensaje: 'Error en la autenticación: usuario o contraseña incorrectos.', autenticado: false }
    };
  }
  return {
    status: 200,
    data: {
      mensaje: `Autenticación satisfactoria. Bienvenido/a ${user.nombre || user.usuario}.`,
      autenticado: true,
      usuario: user.usuario,
      id: user.id
    }
  };
}

// ============================================================
// SERVICIO: CATEGORÍAS
// ============================================================

/** GET /categorias - Lista todas las categorías */
function listarCategorias() {
  const categorias = readJSON(CATEGORIES_FILE);
  return { status: 200, data: { total: categorias.length, categorias } };
}

/**
 * POST /categorias
 * Crea una categoría.
 * Body: { "nombre": "...", "descripcion": "..." }
 */
function crearCategoria(body) {
  const { nombre, descripcion } = body;
  if (!nombre) {
    return { status: 400, data: { mensaje: 'El nombre de la categoría es obligatorio.' } };
  }
  const categorias = readJSON(CATEGORIES_FILE);
  const nueva = {
    id: nextId(categorias),
    nombre: nombre.trim(),
    descripcion: descripcion || '',
    fechaCreacion: new Date().toISOString()
  };
  categorias.push(nueva);
  writeJSON(CATEGORIES_FILE, categorias);
  return { status: 201, data: { mensaje: 'Categoría creada correctamente.', categoria: nueva } };
}

// ============================================================
// SERVICIO: PRODUCTOS
// ============================================================

/** GET /productos - Lista todos los productos (opcional ?categoria=id) */
function listarProductos(query) {
  let productos = readJSON(PRODUCTS_FILE);
  if (query.categoria) {
    const catId = parseInt(query.categoria, 10);
    productos = productos.filter(p => p.categoriaId === catId);
  }
  return { status: 200, data: { total: productos.length, productos } };
}

/** GET /productos/:id - Obtiene un producto por ID */
function obtenerProducto(id) {
  const productos = readJSON(PRODUCTS_FILE);
  const producto = productos.find(p => p.id === id);
  if (!producto) {
    return { status: 404, data: { mensaje: 'Producto no encontrado.' } };
  }
  return { status: 200, data: { producto } };
}

/**
 * POST /productos
 * Crea un producto.
 * Body: { "nombre", "descripcion", "precio", "stock", "categoriaId", "imagen" }
 */
function crearProducto(body) {
  const { nombre, descripcion, precio, stock, categoriaId, imagen } = body;
  if (!nombre || precio === undefined) {
    return { status: 400, data: { mensaje: 'Nombre y precio son obligatorios.' } };
  }
  const productos = readJSON(PRODUCTS_FILE);
  const nuevo = {
    id: nextId(productos),
    nombre: nombre.trim(),
    descripcion: descripcion || '',
    precio: Number(precio),
    stock: stock !== undefined ? Number(stock) : 0,
    categoriaId: categoriaId ? Number(categoriaId) : null,
    imagen: imagen || '',
    fechaCreacion: new Date().toISOString()
  };
  productos.push(nuevo);
  writeJSON(PRODUCTS_FILE, productos);
  return { status: 201, data: { mensaje: 'Producto creado correctamente.', producto: nuevo } };
}

/**
 * PUT /productos/:id
 * Actualiza un producto.
 */
function actualizarProducto(id, body) {
  const productos = readJSON(PRODUCTS_FILE);
  const index = productos.findIndex(p => p.id === id);
  if (index === -1) {
    return { status: 404, data: { mensaje: 'Producto no encontrado.' } };
  }
  const actual = productos[index];
  productos[index] = {
    ...actual,
    nombre: body.nombre !== undefined ? body.nombre.trim() : actual.nombre,
    descripcion: body.descripcion !== undefined ? body.descripcion : actual.descripcion,
    precio: body.precio !== undefined ? Number(body.precio) : actual.precio,
    stock: body.stock !== undefined ? Number(body.stock) : actual.stock,
    categoriaId: body.categoriaId !== undefined ? Number(body.categoriaId) : actual.categoriaId,
    imagen: body.imagen !== undefined ? body.imagen : actual.imagen,
    fechaActualizacion: new Date().toISOString()
  };
  writeJSON(PRODUCTS_FILE, productos);
  return { status: 200, data: { mensaje: 'Producto actualizado.', producto: productos[index] } };
}

/** DELETE /productos/:id */
function eliminarProducto(id) {
  let productos = readJSON(PRODUCTS_FILE);
  const index = productos.findIndex(p => p.id === id);
  if (index === -1) {
    return { status: 404, data: { mensaje: 'Producto no encontrado.' } };
  }
  const eliminado = productos.splice(index, 1)[0];
  writeJSON(PRODUCTS_FILE, productos);
  return { status: 200, data: { mensaje: 'Producto eliminado.', producto: eliminado } };
}

// ============================================================
// SERVICIO: PEDIDOS
// ============================================================

/** GET /pedidos - Lista pedidos (opcional ?usuarioId=) */
function listarPedidos(query) {
  let pedidos = readJSON(ORDERS_FILE);
  if (query.usuarioId) {
    const uid = parseInt(query.usuarioId, 10);
    pedidos = pedidos.filter(p => p.usuarioId === uid);
  }
  return { status: 200, data: { total: pedidos.length, pedidos } };
}

/** GET /pedidos/:id */
function obtenerPedido(id) {
  const pedidos = readJSON(ORDERS_FILE);
  const pedido = pedidos.find(p => p.id === id);
  if (!pedido) {
    return { status: 404, data: { mensaje: 'Pedido no encontrado.' } };
  }
  return { status: 200, data: { pedido } };
}

/**
 * POST /pedidos
 * Crea un pedido.
 * Body: {
 *   "usuarioId": 1,
 *   "items": [ { "productoId": 1, "cantidad": 2 }, ... ],
 *   "direccion": "..."
 * }
 */
function crearPedido(body) {
  const { usuarioId, items, direccion } = body;
  if (!usuarioId || !items || !Array.isArray(items) || items.length === 0) {
    return { status: 400, data: { mensaje: 'usuarioId e items (array) son obligatorios.' } };
  }

  const productos = readJSON(PRODUCTS_FILE);
  const detalle = [];
  let total = 0;

  for (const item of items) {
    const prod = productos.find(p => p.id === Number(item.productoId));
    if (!prod) {
      return { status: 400, data: { mensaje: `Producto con id ${item.productoId} no existe.` } };
    }
    const cantidad = Number(item.cantidad) || 1;
    if (prod.stock < cantidad) {
      return { status: 400, data: { mensaje: `Stock insuficiente para ${prod.nombre}.` } };
    }
    const subtotal = prod.precio * cantidad;
    total += subtotal;
    detalle.push({
      productoId: prod.id,
      nombre: prod.nombre,
      precio: prod.precio,
      cantidad,
      subtotal
    });
  }

  // Descontar stock
  for (const item of detalle) {
    const prod = productos.find(p => p.id === item.productoId);
    prod.stock -= item.cantidad;
  }
  writeJSON(PRODUCTS_FILE, productos);

  const pedidos = readJSON(ORDERS_FILE);
  const nuevo = {
    id: nextId(pedidos),
    usuarioId: Number(usuarioId),
    items: detalle,
    total,
    direccion: direccion || '',
    estado: 'pendiente',
    fecha: new Date().toISOString()
  };
  pedidos.push(nuevo);
  writeJSON(ORDERS_FILE, pedidos);

  return { status: 201, data: { mensaje: 'Pedido creado correctamente.', pedido: nuevo } };
}

// ============================================================
// SERVIDOR Y RUTAS
// ============================================================

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method = req.method.toUpperCase();
  const query = parsed.query;

  console.log(`[${new Date().toISOString()}] ${method} ${pathname}`);

  // CORS preflight
  if (method === 'OPTIONS') {
    sendJSON(res, 204, {});
    return;
  }

  try {
    // ---------- INFO ----------
    if (pathname === '/' && method === 'GET') {
      sendJSON(res, 200, {
        servicio: 'API E-Commerce',
        evidencia: 'GA7-220501096-AA5-EV03',
        version: '1.0.0',
        endpoints: {
          auth: ['POST /registro', 'POST /login'],
          categorias: ['GET /categorias', 'POST /categorias'],
          productos: [
            'GET /productos',
            'GET /productos/:id',
            'POST /productos',
            'PUT /productos/:id',
            'DELETE /productos/:id'
          ],
          pedidos: ['GET /pedidos', 'GET /pedidos/:id', 'POST /pedidos']
        },
        mensaje: 'API E-Commerce funcionando correctamente.'
      });
      return;
    }

    // ---------- AUTH ----------
    if (pathname === '/registro' && method === 'POST') {
      const body = await parseBody(req);
      const result = registrarUsuario(body);
      sendJSON(res, result.status, result.data);
      return;
    }

    if (pathname === '/login' && method === 'POST') {
      const body = await parseBody(req);
      const result = loginUsuario(body);
      sendJSON(res, result.status, result.data);
      return;
    }

    // ---------- CATEGORÍAS ----------
    if (pathname === '/categorias' && method === 'GET') {
      const result = listarCategorias();
      sendJSON(res, result.status, result.data);
      return;
    }

    if (pathname === '/categorias' && method === 'POST') {
      const body = await parseBody(req);
      const result = crearCategoria(body);
      sendJSON(res, result.status, result.data);
      return;
    }

    // ---------- PRODUCTOS ----------
    if (pathname === '/productos' && method === 'GET') {
      const result = listarProductos(query);
      sendJSON(res, result.status, result.data);
      return;
    }

    if (pathname === '/productos' && method === 'POST') {
      const body = await parseBody(req);
      const result = crearProducto(body);
      sendJSON(res, result.status, result.data);
      return;
    }

    // /productos/:id
    const productMatch = pathname.match(/^\/productos\/(\d+)$/);
    if (productMatch) {
      const id = parseInt(productMatch[1], 10);
      if (method === 'GET') {
        const result = obtenerProducto(id);
        sendJSON(res, result.status, result.data);
        return;
      }
      if (method === 'PUT') {
        const body = await parseBody(req);
        const result = actualizarProducto(id, body);
        sendJSON(res, result.status, result.data);
        return;
      }
      if (method === 'DELETE') {
        const result = eliminarProducto(id);
        sendJSON(res, result.status, result.data);
        return;
      }
    }

    // ---------- PEDIDOS ----------
    if (pathname === '/pedidos' && method === 'GET') {
      const result = listarPedidos(query);
      sendJSON(res, result.status, result.data);
      return;
    }

    if (pathname === '/pedidos' && method === 'POST') {
      const body = await parseBody(req);
      const result = crearPedido(body);
      sendJSON(res, result.status, result.data);
      return;
    }

    const orderMatch = pathname.match(/^\/pedidos\/(\d+)$/);
    if (orderMatch && method === 'GET') {
      const id = parseInt(orderMatch[1], 10);
      const result = obtenerPedido(id);
      sendJSON(res, result.status, result.data);
      return;
    }

    // 404
    sendJSON(res, 404, { mensaje: 'Ruta no encontrada.' });
  } catch (err) {
    console.error(err);
    sendJSON(res, 500, { mensaje: 'Error interno del servidor: ' + err.message });
  }
});

// Inicializar datos de ejemplo si están vacíos
function seedData() {
  ensureDataDir();
  const cats = readJSON(CATEGORIES_FILE);
  if (cats.length === 0) {
    writeJSON(CATEGORIES_FILE, [
      { id: 1, nombre: 'Electrónica', descripcion: 'Dispositivos electrónicos', fechaCreacion: new Date().toISOString() },
      { id: 2, nombre: 'Ropa', descripcion: 'Prendas de vestir', fechaCreacion: new Date().toISOString() },
      { id: 3, nombre: 'Hogar', descripcion: 'Artículos para el hogar', fechaCreacion: new Date().toISOString() }
    ]);
  }
  const prods = readJSON(PRODUCTS_FILE);
  if (prods.length === 0) {
    writeJSON(PRODUCTS_FILE, [
      {
        id: 1,
        nombre: 'Auriculares Bluetooth',
        descripcion: 'Auriculares inalámbricos con cancelación de ruido',
        precio: 89000,
        stock: 25,
        categoriaId: 1,
        imagen: '',
        fechaCreacion: new Date().toISOString()
      },
      {
        id: 2,
        nombre: 'Camiseta básica',
        descripcion: 'Camiseta de algodón unisex',
        precio: 35000,
        stock: 50,
        categoriaId: 2,
        imagen: '',
        fechaCreacion: new Date().toISOString()
      }
    ]);
  }
}

seedData();

server.listen(PORT, () => {
  console.log('================================================');
  console.log('  API E-COMMERCE INICIADA');
  console.log('  Evidencia: GA7-220501096-AA5-EV03');
  console.log('================================================');
  console.log(`  Servidor: http://localhost:${PORT}`);
  console.log('  Endpoints principales:');
  console.log('    POST /registro  |  POST /login');
  console.log('    GET/POST /categorias');
  console.log('    GET/POST /productos  |  GET/PUT/DELETE /productos/:id');
  console.log('    GET/POST /pedidos    |  GET /pedidos/:id');
  console.log('================================================');
});
