// ============================================
// check-auth.js - підключати на всіх сторінках
// ============================================

(async function initAuth() {
    try {
        var userData = localStorage.getItem('userData');
        if (!userData) {
            // Якщо немає сесії і ми не на сторінках входу/реєстрації
            var publicPages = ['/login', '/register', '/banned'];
            if (publicPages.indexOf(window.location.pathname) === -1) {
                window.location.href = '/login';
            }
            return;
        }

        var user = JSON.parse(userData);
        
        // Якщо користувач забанений
        if (user.is_banned === true) {
            if (window.location.pathname !== '/banned') {
                window.location.href = '/banned';
            }
            return;
        }

        // Перевіряємо статус бана в БД
        if (window.location.pathname !== '/banned' && user.id) {
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
                        // Оновлюємо дані
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

        // Якщо на сторінці логіну або реєстрації і авторизований - редірект на дашборд
        if (window.location.pathname === '/login' || window.location.pathname === '/register') {
            window.location.href = '/dashboard';
        }

    } catch (e) {
        console.error('Auth init error:', e);
    }
})();
