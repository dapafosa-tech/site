// ============================================
// check-auth.js - ПЕРЕВІРКА АВТОРИЗАЦІЇ
// ============================================

(async function checkAuthAndBan() {
    try {
        var currentPath = window.location.pathname;
        
        // ЯКЩО МИ ВЖЕ НА СТОРІНЦІ BANNED - НІЧОГО НЕ РОБИМО
        if (currentPath === '/banned') {
            return;
        }
        
        var userData = localStorage.getItem('userData');
        var publicPages = ['/login', '/register', '/'];
        
        // ЯКЩО НЕМАЄ ДАНИХ - НА ЛОГІН
        if (!userData) {
            if (publicPages.indexOf(currentPath) === -1) {
                window.location.href = '/login';
            }
            return;
        }

        var user = JSON.parse(userData);
        
        // ЯКЩО КОРИСТУВАЧ ЗАБАНЕНИЙ - КИДАЄМО НА BANNED
        if (user.is_banned === true) {
            window.location.href = '/banned';
            return;
        }

        // ПЕРЕВІРЯЄМО БАН В БД
        if (user.id) {
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
        }

        // ЯКЩО НА ПУБЛІЧНІЙ СТОРІНЦІ - НА ДАШБОРД
        if (publicPages.indexOf(currentPath) !== -1 && user.id) {
            window.location.href = '/dashboard';
        }

    } catch (e) {
        console.error('checkAuthAndBan error:', e);
    }
})();
