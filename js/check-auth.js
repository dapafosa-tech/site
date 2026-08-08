// ============================================
// check-auth.js - ПЕРЕВІРКА АВТОРИЗАЦІЇ (Supabase Auth)
// ============================================

(async function checkAuthAndBan() {
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
})();
