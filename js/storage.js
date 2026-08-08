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

    var token = await getAccessToken();
    if (!token) throw new Error('Сесія недійсна, увійдіть повторно');

    var fileExt = file.name.split('.').pop().toLowerCase();
    // ВАЖЛИВО: файл має лежати в папці userId/... - саме так це
    // перевіряє storage RLS-політика (storage.foldername(name)[1] = auth.uid()).
    // Плаский шлях "userId.ext" без папки цю перевірку не проходить (403).
    var fileName = user.id + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + fileExt;

    var response = await fetch(SUPABASE_URL + '/storage/v1/object/avatars/' + fileName, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + token,
            'Content-Type': file.type || 'application/octet-stream',
            'x-upsert': 'true'
        },
        body: file
    });

    if (!response.ok) {
        var error = await response.text();
        console.error('Upload error:', error);
        throw new Error('Помилка завантаження: ' + error);
    }

    var publicUrl = SUPABASE_URL + '/storage/v1/object/public/avatars/' + fileName;

    // Прибираємо старі файли аватарки в папці юзера (крім щойно завантаженого)
    try {
        var listResponse = await fetch(SUPABASE_URL + '/storage/v1/object/list/avatars', {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prefix: user.id + '/' })
        });
        if (listResponse.ok) {
            var oldFiles = await listResponse.json();
            for (var i = 0; i < oldFiles.length; i++) {
                if (fileName !== user.id + '/' + oldFiles[i].name) {
                    fetch(SUPABASE_URL + '/storage/v1/object/avatars/' + user.id + '/' + oldFiles[i].name, {
                        method: 'DELETE',
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': 'Bearer ' + token
                        }
                    }).catch(function() {});
                }
            }
        }
    } catch (e) { /* не критично, просто лишиться старий файл */ }

    // Оновлюємо профіль
    await db.updateUser(user.id, { avatar_url: publicUrl });
    
    user.avatar_url = publicUrl;
    localStorage.setItem('userData', JSON.stringify(user));

    return publicUrl;
}

async function deleteAvatar() {
    var user = getCurrentUser();
    if (!user) throw new Error('Не авторизовано');

    var token = await getAccessToken();
    if (!token) throw new Error('Сесія недійсна, увійдіть повторно');

    // Шукаємо файл(и) аватарки всередині папки користувача avatars/{userId}/
    var listResponse = await fetch(SUPABASE_URL + '/storage/v1/object/list/avatars', {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prefix: user.id + '/' })
    });

    if (!listResponse.ok) return;

    var files = await listResponse.json();

    for (var i = 0; i < files.length; i++) {
        await fetch(SUPABASE_URL + '/storage/v1/object/avatars/' + user.id + '/' + files[i].name, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + token
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
