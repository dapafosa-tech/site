// ============================================
// TYPEBIZ - РАБОТА С ХРАНИЛИЩЕМ (AVATARS)
// ============================================

if (typeof SUPABASE_URL === 'undefined') {
    var SUPABASE_URL = 'https://iazzgxacdwhaxujoxtaz.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhenpneGFjZHdoYXh1am94dGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTY3MDIsImV4cCI6MjEwMTM3MjcwMn0.quXjQ6575ACSjxnfa-hKkD6u3KMYE_5ZLdtqS4JKXI0';
}

function getCurrentUser() {
    try {
        const userData = localStorage.getItem('userData');
        if (userData) {
            return JSON.parse(userData);
        }
        return null;
    } catch {
        return null;
    }
}

// ===== ЗАГРУЗКА АВАТАРКИ =====
async function uploadAvatar(file) {
    const user = getCurrentUser();
    if (!user) throw new Error('Не авторизован');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${fileName}`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: file
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ошибка загрузки: ${error}`);
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`;
    
    // Обновляем профиль пользователя
    await db.updateUser(user.id, { avatar_url: publicUrl });
    
    // Обновляем локальные данные
    user.avatar_url = publicUrl;
    localStorage.setItem('userData', JSON.stringify(user));

    return publicUrl;
}

// ===== УДАЛЕНИЕ АВАТАРКИ =====
async function deleteAvatar() {
    const user = getCurrentUser();
    if (!user) throw new Error('Не авторизован');

    const filePath = `avatars/${user.id}.*`;
    
    // Находим файл
    const listResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/list/avatars`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
    });

    if (!listResponse.ok) return;

    const files = await listResponse.json();
    const avatarFile = files.find(f => f.name.startsWith(user.id));

    if (avatarFile) {
        await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${avatarFile.name}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            }
        });
    }

    // Обновляем профиль
    await db.updateUser(user.id, { avatar_url: null });
    user.avatar_url = null;
    localStorage.setItem('userData', JSON.stringify(user));
}

// ===== ПОЛУЧЕНИЕ URL АВАТАРКИ =====
function getAvatarUrl(userId) {
    return `${SUPABASE_URL}/storage/v1/object/public/avatars/${userId}`;
}

window.storage = {
    uploadAvatar,
    deleteAvatar,
    getAvatarUrl
};

console.log('✅ Storage module loaded');
