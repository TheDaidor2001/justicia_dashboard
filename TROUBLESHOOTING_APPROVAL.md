# 🔧 Troubleshooting: Error "No autorizado" en aprobación de noticias

## 📋 Problema
Cuando un usuario con rol `director_prensa` intenta aprobar una noticia, el backend responde con:
```json
{
  "success": false,
  "message": "No autorizado"
}
```

## 🔍 Diagnóstico Frontend
- ✅ Token de autenticación se envía correctamente
- ✅ Endpoint correcto: `POST /news/{id}/approve-director`
- ✅ Permisos del frontend validados correctamente
- ✅ Usuario tiene rol `director_prensa`
- ✅ Noticia en estado `pending_director_approval`

## 🎯 Posibles Causas en Backend

### 1. **Validación de Rol**
```javascript
// Verificar que el middleware de autorización incluya 'director_prensa'
const allowedRoles = ['director_prensa', 'admin'];
if (!allowedRoles.includes(user.role)) {
  return res.status(401).json({ success: false, message: "No autorizado" });
}
```

### 2. **Middleware de Autenticación**
```javascript
// Verificar que el token JWT se decodifique correctamente
// y que el usuario exista en la base de datos
const token = req.headers.authorization?.replace('Bearer ', '');
const decoded = jwt.verify(token, JWT_SECRET);
const user = await User.findById(decoded.id);
```

### 3. **Validación de Estado de Noticia**
```javascript
// Verificar que la noticia esté en el estado correcto
if (news.status !== 'pending_director_approval') {
  return res.status(401).json({ success: false, message: "No autorizado" });
}
```

### 4. **Validación de Autoría**
```javascript
// Verificar que el director no pueda aprobar sus propias noticias
if (news.authorId === user.id || news.createdBy === user.id) {
  return res.status(401).json({ success: false, message: "No autorizado" });
}
```

### 5. **Problema en Base de Datos**
- La noticia no existe con el ID proporcionado
- Problemas de relaciones entre User y News
- Estado inconsistente en la base de datos

## 🧪 Cómo Diagnosticar

### 1. **Logs del Backend**
Agregar logs detallados en el endpoint:
```javascript
app.post('/news/:id/approve-director', async (req, res) => {
  console.log('=== APPROVAL DEBUG ===');
  console.log('User:', req.user);
  console.log('News ID:', req.params.id);
  console.log('Body:', req.body);
  
  const news = await News.findById(req.params.id);
  console.log('News found:', !!news);
  console.log('News status:', news?.status);
  console.log('News author:', news?.authorId || news?.createdBy);
  
  // ... resto de la lógica
});
```

### 2. **Verificar JWT**
```javascript
// Decodificar el token manualmente para verificar
const token = "..."; // Token del frontend
const decoded = jwt.decode(token);
console.log('Token payload:', decoded);
```

### 3. **Verificar Usuario en DB**
```sql
-- Verificar que el usuario existe y tiene el rol correcto
SELECT id, email, role, fullName FROM users WHERE id = 'USER_ID_HERE';
```

### 4. **Verificar Noticia en DB**
```sql
-- Verificar el estado y autor de la noticia
SELECT id, title, status, authorId, createdBy FROM news WHERE id = 'NEWS_ID_HERE';
```

## 🛠️ Frontend Debug Tools

He agregado un componente `ApprovalDebugger` que se muestra en el detalle de noticias para usuarios `director_prensa`. Este componente:

1. **Muestra información del usuario y noticia**
2. **Verifica permisos del frontend**
3. **Permite probar la API directamente**
4. **Captura respuestas detalladas de errores**

### Uso:
1. Loguearse como `director_prensa`
2. Ir al detalle de una noticia en estado `pending_director_approval`
3. Usar los botones de test en el componente debug
4. Revisar console.log para detalles adicionales

## ✅ Pasos de Solución

1. **Verificar logs del backend** durante una petición de aprobación
2. **Comprobar middleware de auth** y permisos
3. **Validar estructura de datos** en base de datos
4. **Revisar lógica de negocio** en el endpoint
5. **Probar con diferentes usuarios** y noticias

## 📞 Información para Soporte

- **Endpoint:** `POST /api/news/{id}/approve-director`
- **Headers:** `Authorization: Bearer {token}`
- **Body:** `{ "comments": "optional" }`
- **Error:** `{ "success": false, "message": "No autorizado" }`
- **Frontend:** Todo validado correctamente ✅
- **Probable causa:** Backend authorization/validation

---

**Nota:** El componente `ApprovalDebugger` es temporal y debe removerse una vez solucionado el problema.