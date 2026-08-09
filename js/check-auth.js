// ============================================
// check-auth.js - ПЕРЕВІРКА АВТОРИЗАЦІЇ (Supabase Auth)
// ============================================

var CHECK_AUTH_POLL_MS = 25000; // кожні 25 сек перевіряємо бан/сесію в реальному часі

async function checkAuthAndBan() {
    try {
        var currentPath = window.location.pathname;

        if (currentPath === '/banned') {
            return;
        }

        var publicPages = ['/login', '/register', '/', '/forgot-password'];

        var { data } = await window.sb.auth.getSession();
        var session = data && data.session;

        if (!session) {
            localStorage.removeItem('userData');
            localStorage.removeItem('isGuest');
            if (publicPages.indexOf(currentPath) === -1) {
                window.location.href = '/login';
            }
            return;
        }

        var user = await syncProfile();
        if (!user) {
            if (publicPages.indexOf(currentPath) === -1) {
                window.location.href = '/login';
            }
            return;
        }

        if (user.is_banned === true) {
            window.location.href = '/banned';
            return;
        }

        if (publicPages.indexOf(currentPath) !== -1) {
            window.location.href = '/dashboard';
        }

    } catch (e) {
        console.error('checkAuthAndBan error:', e);
    }
}

checkAuthAndBan();

// Живий поллінг: якщо юзера забанили чи розлогінили поки він вже сидить
// на сторінці (нікуди не переходячи) - його все одно виб'є, не чекаючи
// наступного переходу/перезавантаження.
setInterval(function () {
    var currentPath = window.location.pathname;
    var publicPages = ['/login', '/register', '/', '/forgot-password'];
    // На публічних сторінках і на /banned живий поллінг не потрібен -
    // там немає авторизованої сесії, яку можна забанити "на льоту".
    if (currentPath === '/banned' || publicPages.indexOf(currentPath) !== -1) {
        return;
    }
    checkAuthAndBan();
}, CHECK_AUTH_POLL_MS);
