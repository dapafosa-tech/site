// ============================================
// TYPEBIZ - РОБОТА З ХРАНИЛИЩЕМ (AVATARS)
// ============================================

if (typeof SUPABASE_URL === 'undefined') {
    var SUPABASE_URL = 'https://iazzgxacdwhaxujoxtaz.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhenpneGFjZHdoYXh1am94dGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTY3MDIsImV4cCI6MjEwMTM3MjcwMn0.quXjQ6575ACSjxnfa-hKkD6u3KMYE_5ZLdtqS4JKXI0';
}

function getCurrentUser() {
    try {
        var userData = localStorage.getItem('userData');
        if (userData) {
            return JSON.parse(userData);
        }
        return null;
    } catch {
        return null;
    }
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function uploadAvatar(file) {
    var user = getCurrentUser();
    if (!user) throw new Error('Не авторизовано');

    var fileExt = file.name.split('.').pop();
    var fileName = user.id + '.' + fileExt;
    
    // ВАЖЛИВО: правильний шлях для завантаження
    var response = await fetch(SUPABASE_URL + '/storage/v1/object/avatars/' + fileName, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
        },
        body: file
    });

    if (!response.ok) {
        var error = await response.text();
        console.error('Upload error:', error);
        throw new Error('Помилка завантаження: ' + error);
    }

    var publicUrl = SUPABASE_URL + '/storage/v1/object/public/avatars/' + fileName;
    
    // Оновлюємо профіль
    await db.updateUser(user.id, { avatar_url: publicUrl });
    
    user.avatar_url = publicUrl;
    localStorage.setItem('userData', JSON.stringify(user));

    return publicUrl;
}

async function deleteAvatar() {
    var user = getCurrentUser();
    if (!user) throw new Error('Не авторизовано');

    // Шукаємо файл аватарки
    var listResponse = await fetch(SUPABASE_URL + '/storage/v1/object/list/avatars', {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
        }
    });

    if (!listResponse.ok) return;

    var files = await listResponse.json();
    var avatarFile = null;
    for (var i = 0; i < files.length; i++) {
        if (files[i].name.indexOf(user.id) === 0) {
            avatarFile = files[i];
            break;
        }
    }

    if (avatarFile) {
        await fetch(SUPABASE_URL + '/storage/v1/object/avatars/' + avatarFile.name, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            }
        });
    }

    await db.updateUser(user.id, { avatar_url: null });
    user.avatar_url = null;
    localStorage.setItem('userData', JSON.stringify(user));
}

function getAvatarUrl(userId) {
    return SUPABASE_URL + '/storage/v1/object/public/avatars/' + userId;
}

window.storage = {
    uploadAvatar: uploadAvatar,
    deleteAvatar: deleteAvatar,
    getAvatarUrl: getAvatarUrl
};
