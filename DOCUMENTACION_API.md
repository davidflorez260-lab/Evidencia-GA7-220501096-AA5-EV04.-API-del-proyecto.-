# Documentación de la API E-Commerce
**Evidencia:** GA7-220501096-AA5-EV03  
**Proyecto:** Página de E-commerce  
**Aprendiz:** Alex David Florez

---

## 1. Descripción general

API REST desarrollada en Node.js (módulo nativo `http`) para soportar las funcionalidades principales de un sistema de comercio electrónico:

- Autenticación de usuarios (registro e inicio de sesión)
- Gestión de categorías
- Gestión de productos (CRUD)
- Gestión de pedidos

Los datos se almacenan en archivos JSON dentro de la carpeta `data/`.

**URL base:** `http://localhost:3000`

---

## 2. Servicios y Endpoints

### 2.1 Autenticación

| Método | Endpoint     | Descripción                          |
|--------|--------------|--------------------------------------|
| POST   | /registro    | Registra un nuevo usuario            |
| POST   | /login       | Inicia sesión / autentica un usuario |

**Body (JSON) para ambos:**
```json
{
  "usuario": "alex",
  "contrasena": "1234",
  "nombre": "Alex David"   // opcional en registro
}
```

**Respuestas:**
- Registro exitoso → 201
- Login correcto → 200 + mensaje de autenticación satisfactoria
- Login incorrecto → 401 + mensaje de error en la autenticación

---

### 2.2 Categorías

| Método | Endpoint      | Descripción                |
|--------|---------------|----------------------------|
| GET    | /categorias   | Lista todas las categorías |
| POST   | /categorias   | Crea una nueva categoría   |

**Body para POST:**
```json
{
  "nombre": "Electrónica",
  "descripcion": "Dispositivos electrónicos"
}
```

---

### 2.3 Productos

| Método | Endpoint           | Descripción                          |
|--------|--------------------|--------------------------------------|
| GET    | /productos         | Lista productos (filtro ?categoria=) |
| GET    | /productos/:id     | Obtiene un producto por ID           |
| POST   | /productos         | Crea un producto                     |
| PUT    | /productos/:id     | Actualiza un producto                |
| DELETE | /productos/:id     | Elimina un producto                  |

**Body para POST / PUT:**
```json
{
  "nombre": "Auriculares Bluetooth",
  "descripcion": "Auriculares inalámbricos",
  "precio": 89000,
  "stock": 25,
  "categoriaId": 1,
  "imagen": ""
}
```

---

### 2.4 Pedidos

| Método | Endpoint        | Descripción                              |
|--------|-----------------|------------------------------------------|
| GET    | /pedidos        | Lista pedidos (filtro ?usuarioId=)       |
| GET    | /pedidos/:id    | Obtiene un pedido por ID                 |
| POST   | /pedidos        | Crea un pedido (descuenta stock)         |

**Body para POST:**
```json
{
  "usuarioId": 1,
  "direccion": "Calle 123 #45-67",
  "items": [
    { "productoId": 1, "cantidad": 2 },
    { "productoId": 2, "cantidad": 1 }
  ]
}
```

---

## 3. Cómo ejecutar

```bash
cd ecommerce-api
node server.js
```

El servidor inicia en `http://localhost:3000`.

---

## 4. Datos de ejemplo

Al iniciar por primera vez se crean automáticamente:

- 3 categorías (Electrónica, Ropa, Hogar)
- 2 productos de ejemplo

---

## 5. Versionamiento

El proyecto se gestionó con **Git**.  
Ver archivo `enlace_repositorio.txt` para el enlace del repositorio.
