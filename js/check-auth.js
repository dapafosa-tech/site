// ============================================
// check-auth.js - УНІВЕРСАЛЬНА ПЕРЕВІРКА АВТОРИЗАЦІЇ ТА БАНА
// Підключати на ВСІХ сторінках ПІСЛЯ db.js та auth.js
// ============================================

(async function checkAuthAndBan() {
    try {
        var userData = localStorage.getItem('userData');
        var currentPath = window.location.pathname;
        var publicPages = ['/login', '/register', '/banned', '/'];
        var isPublicPage = publicPages.indexOf(currentPath) !== -1;
        
        // Якщо немає даних користувача
        if (!userData) {
            // Якщо сторінка не публічна - редірект на логін
            if (!isPublicPage) {
                window.location.href = '/login';
            }
            return;
        }

        var user = JSON.parse(userData);
        
        // ============================================
        // ПЕРЕВІРКА БАНА
        // ============================================
        
        // Якщо вже є мітка про бан в localStorage
        if (user.is_banned === true) {
            if (currentPath !== '/banned') {
                window.location.href = '/banned';
            }
            return;
        }

        // Перевіряємо статус бана в БД (якщо є id)
        if (user.id && currentPath !== '/banned') {
            try {
                var response = await fetch(SUPABASE_URL + '/rest/v1/users?id=eq.' + user.id + '&select=is_banned,ban_reason', {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
                    }
                });

                if (response.ok) {
                    var data = await response.json();
                    if (data && data.length > 0 && data[0].is_banned === true) {
                        // Користувач забанений - оновлюємо дані
                        user.is_banned = true;
                        user.ban_reason = data[0].ban_reason || 'Порушення правил платформи';
                        localStorage.setItem('userData', JSON.stringify(user));
                        
                        if (currentPath !== '/banned') {
                            window.location.href = '/banned';
                        }
                        return;
                    }
                }
            } catch (e) {
                console.error('Ban check error:', e);
            }
        }

        // ============================================
        // РЕДІРЕКТИ ДЛЯ ПУБЛІЧНИХ СТОРІНОК
        // ============================================
        
        // Якщо користувач авторизований і намагається зайти на публічну сторінку
        if (isPublicPage && currentPath !== '/banned') {
            // Перевіряємо чи дійсний користувач
            if (user.id) {
                window.location.href = '/dashboard';
                return;
            }
        }

        // Якщо сторінка закрита і немає користувача - редірект
        if (!isPublicPage && !user.id) {
            window.location.href = '/login';
        }

    } catch (e) {
        console.error('checkAuthAndBan error:', e);
        // У разі помилки - не блокуємо сторінку
    }
})();
