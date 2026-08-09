// ============================================
// check-auth.js - ПЕРЕВІРКА АВТОРИЗАЦІЇ (Supabase Auth)
// Живий поллінг: бан, видалення профілю (public.users) і видалення
// самого акаунту (auth.users) виб'ють юзера з акаунту майже одразу,
// не чекаючи наступного переходу/перезавантаження сторінки.
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
        //    (getSession() бере дані з локального токена і не бачить,
        //    що юзера видалили з auth.users - тому дзвонимо getUser()).
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

        // 2) Перевіряємо, чи існує ще профіль у public.users.
        //    allowCreate=false: якщо рядка нема - акаунт видалили з users,
        //    нічого не відновлюємо, а виганяємо юзера.
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
            window.location.href = '/banned';
            return;
        }

        if (PUBLIC_PAGES.indexOf(currentPath) !== -1) {
            window.location.href = '/dashboard';
        }

    } catch (e) {
        console.error('checkAuthAndBan error:', e);
    }
}

checkAuthAndBan();

setInterval(function () {
    var currentPath = window.location.pathname;
    // На публічних сторінках і на /banned живий поллінг не потрібен -
    // там немає авторизованої сесії, яку можна забанити/видалити "на льоту".
    if (currentPath === '/banned' || PUBLIC_PAGES.indexOf(currentPath) !== -1) {
        return;
    }
    checkAuthAndBan();
}, CHECK_AUTH_POLL_MS);
