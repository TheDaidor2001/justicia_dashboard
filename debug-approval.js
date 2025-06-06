// Script de debugging para diagnósticar el problema de aprobación
// Ejecutar en la consola del navegador cuando esté logueado como director

console.log('=== DEBUG APPROVAL ISSUE ===');

// 1. Verificar información del usuario actual
const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
console.log('1. Usuario actual:', userInfo);
console.log('   - ID:', userInfo.id);
console.log('   - Role:', userInfo.role);
console.log('   - Full Name:', userInfo.fullName);

// 2. Verificar token
const token = localStorage.getItem('access_token');
console.log('2. Token presente:', !!token);
console.log('   - Token length:', token?.length || 0);
console.log('   - Token start:', token?.substring(0, 20) + '...');

// 3. Verificar configuración de API
console.log('3. API Base URL:', import.meta?.env?.VITE_API_URL || 'No configurada');

// 4. Función para probar la petición manualmente
window.testApproval = async function(newsId) {
  console.log('\n=== TESTING APPROVAL REQUEST ===');
  console.log('News ID:', newsId);
  
  const baseURL = import.meta?.env?.VITE_API_URL || 'http://localhost:3000/api';
  const endpoint = `${baseURL}/news/${newsId}/approve-director`;
  
  console.log('Endpoint:', endpoint);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({})
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Response data:', data);
    
    return data;
  } catch (error) {
    console.error('Request error:', error);
    return { error: error.message };
  }
};

// 5. Función para verificar permisos en el frontend
window.checkFrontendPermissions = function(news) {
  console.log('\n=== FRONTEND PERMISSIONS CHECK ===');
  console.log('News object:', news);
  console.log('News status:', news.status);
  console.log('News type:', news.type);
  console.log('News createdBy:', news.createdBy);
  console.log('News authorId:', news.authorId);
  
  const creatorId = news.authorId || news.createdBy;
  const currentUserId = userInfo.id;
  const isOwnNews = String(creatorId) === String(currentUserId);
  
  console.log('Creator ID:', creatorId);
  console.log('Current User ID:', currentUserId);
  console.log('Is own news:', isOwnNews);
  console.log('Can approve as director (should be true):', 
    userInfo.role === 'director_prensa' && 
    !isOwnNews && 
    news.status === 'pending_director_approval'
  );
};

console.log('\n=== INSTRUCCIONES ===');
console.log('1. Para probar una aprobación: testApproval("NEWS_ID_AQUI")');
console.log('2. Para verificar permisos: checkFrontendPermissions(newsObject)');
console.log('3. Copia el ID de la noticia que quieres aprobar');