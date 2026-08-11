// ============================================
// check-auth.js - ПЕРЕВІРКА АВТОРИЗАЦІЇ (Supabase Auth)
// Живий поллінг: бан, видалення профілю (public.users) і видалення
// самого акаунту (auth.users) виб'ють юзера з акаунту майже одразу,
// не чекаючи наступного переходу/перезавантаження сторінки.
// 
// Також перевіряє прострочені повідомлення з вимогою відповіді
// ============================================

var CHECK_AUTH_POLL_MS = 25000; // кожні 25 сек

var PUBLIC_PAGES = ['/login', '/register', '/', '/forgot-password'];

async function _forceLogoutAccountGone(reasonMsg) {
    try { await window.sb.auth.signOut(); } catch (e) {}
    localStorage.removeItem('userData');
    localStorage.removeItem('isGuest');
    if (typeof clearAllPanelOtpFlags === 'function') {
        try { clearAllPanelOtpFlags(); } catch (e) {}
    }
    try { sessionStorage.setItem('accountGoneMsg', reasonMsg || 'Ваш акаунт було видалено.'); } catch (e) {}
    window.location.href = '/login';
}

// ============================================================
// ПЕРЕВІРКА ПРОСТРОЧЕНИХ ПОВІДОМЛЕНЬ
// ============================================================
async function checkExpiredDirectMessages() {
    try {
        var user = auth.getCurrentUser();
        if (!user) return;
        
        var expired = await db.getDirectMessagesWithResponseRequired(user.id);
        if (expired && expired.length > 0) {
            for (var i = 0; i < expired.length; i++) {
                var msg = expired[i];
                // Відправляємо сповіщення, що час вийшов
                await db.createNotification({
                    user_id: user.id,
                    type: 'direct_message_no_response',
                    title: '⏰ Час на відповідь вийшов',
                    message: 'Ви не відповіли на повідомлення від ' + (msg.sender_name || 'Адміністрація') + ' вчасно.',
                    link: '/dashboard'
                });
                // Позначаємо як прочитане, щоб більше не турбувати
                await db.supabaseQuery('direct_messages?id=eq.' + msg.id, {
                    method: 'PATCH',
                    body: JSON.stringify({ is_read: true })
                });
            }
        }
    } catch (e) {
        console.warn('checkExpiredDirectMessages error:', e);
    }
}

// ============================================================
// ОСНОВНА ПЕРЕВІРКА
// ============================================================
async function checkAuthAndBan() {
    try {
        var currentPath = window.location.pathname;

        if (currentPath === '/banned') {
            return;
        }

        var { data } = await window.sb.auth.getSession();
        var session = data && data.session;

        if (!session) {
            localStorage.removeItem('userData');
            localStorage.removeItem('isGuest');
            if (PUBLIC_PAGES.indexOf(currentPath) === -1) {
                window.location.href = '/login';
            }
            return;
        }

        var hadLocalProfile = !!getCurrentUser();

        // 1) Перевіряємо існування самого акаунту в auth.users НА СЕРВЕРІ
        var authGone = false;
        try {
            var check = await window.sb.auth.getUser();
            if (check.error || !check.data || !check.data.user) authGone = true;
        } catch (e) {
            authGone = true;
        }

        if (authGone) {
            if (hadLocalProfile || PUBLIC_PAGES.indexOf(currentPath) === -1) {
                await _forceLogoutAccountGone('Ваш акаунт було видалено.');
            } else {
                localStorage.removeItem('userData');
                localStorage.removeItem('isGuest');
            }
            return;
        }

        // 2) Перевіряємо, чи існує ще профіль у public.users
        var user = await syncProfile(false);
        if (!user) {
            if (hadLocalProfile || PUBLIC_PAGES.indexOf(currentPath) === -1) {
                await _forceLogoutAccountGone('Ваш акаунт було видалено.');
            } else if (PUBLIC_PAGES.indexOf(currentPath) === -1) {
                window.location.href = '/login';
            }
            return;
        }

        if (user.is_banned === true) {
            var stillBanned = !user.banned_until || new Date(user.banned_until) > new Date();
            if (!stillBanned) {
                // Строк бану вийшов - автоматично знімаємо
                try {
                    await db.supabaseQuery('users?id=eq.' + user.id, {
                        method: 'PATCH',
                        body: JSON.stringify({ is_banned: false, ban_reason: null, banned_until: null })
                    });
                } catch (e) { console.warn('Auto-unban failed:', e); }
            } else {
                window.location.href = '/banned';
                return;
            }
        }

        if (PUBLIC_PAGES.indexOf(currentPath) !== -1) {
            window.location.href = '/dashboard';
        }

    } catch (e) {
        console.error('checkAuthAndBan error:', e);
    }
}

// ============================================================
// ЗАПУСК
// ============================================================

// Перевіряємо при завантаженні
checkAuthAndBan();

// Перевіряємо прострочені повідомлення кожні 5 хвилин
setInterval(checkExpiredDirectMessages, 5 * 60 * 1000);

// Основний поллінг
setInterval(function () {
    var currentPath = window.location.pathname;
    if (currentPath === '/banned' || PUBLIC_PAGES.indexOf(currentPath) !== -1) {
        return;
    }
    checkAuthAndBan();
}, CHECK_AUTH_POLL_MS);
