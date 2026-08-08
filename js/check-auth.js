// ============================================
// check-auth.js - УНІВЕРСАЛЬНА ПЕРЕВІРКА АВТОРИЗАЦІЇ ТА БАНА
// ============================================

(async function checkAuthAndBan() {
    try {
        // ЯКЩО МИ ВЖЕ НА СТОРІНЦІ BANNED - НІЧОГО НЕ РОБИМО!
        if (window.location.pathname === '/banned') {
            return;
        }
        
        var userData = localStorage.getItem('userData');
        var currentPath = window.location.pathname;
        var publicPages = ['/login', '/register', '/banned', '/'];
        
        // Якщо немає даних користувача
        if (!userData) {
            if (publicPages.indexOf(currentPath) === -1) {
                window.location.href = '/login';
            }
            return;
        }

        var user = JSON.parse(userData);
        
        // Якщо користувач забанений - редірект на banned
        if (user.is_banned === true) {
            window.location.href = '/banned';
            return;
        }

        // Перевіряємо статус бана в БД
        if (user.id) {
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
                        user.is_banned = true;
                        user.ban_reason = data[0].ban_reason || 'Порушення правил платформи';
                        localStorage.setItem('userData', JSON.stringify(user));
                        window.location.href = '/banned';
                        return;
                    }
                }
            } catch (e) {
                console.error('Ban check error:', e);
            }
        }

        // Якщо на публічній сторінці і авторизований - редірект на дашборд
        if (publicPages.indexOf(currentPath) !== -1 && user.id) {
            window.location.href = '/dashboard';
        }

    } catch (e) {
        console.error('checkAuthAndBan error:', e);
    }
})();
