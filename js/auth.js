// ============================================
// TYPEBIZ - AUTH LAYER (Supabase Auth)
// ============================================

if (typeof SUPABASE_URL === 'undefined') {
    var SUPABASE_URL = 'https://iazzgxacdwhaxujoxtaz.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhenpneGFjZHdoYXh1am94dGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTY3MDIsImV4cCI6MjEwMTM3MjcwMn0.quXjQ6575ACSjxnfa-hKkD6u3KMYE_5ZLdtqS4JKXI0';
}
if (typeof window.sb === 'undefined') {
    window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
}

var currentUser = null;

// currentUser тут - це РЯДОК ІЗ ТАБЛИЦІ public.users (профіль),
// а не об'єкт сесії Supabase Auth. id профілю = auth.users.id.
function getCurrentUser() {
    try {
        var userData = localStorage.getItem('userData');
        if (userData) {
            currentUser = JSON.parse(userData);
            return currentUser;
        }
        return null;
    } catch {
        return null;
    }
}

// Підтягує/оновлює профіль з public.users для поточної сесії і кладе в localStorage.
// Токен сесії вже підставляється автоматично через getAccessToken() у db.js,
// тож цей запит іде "від імені" юзера і його пропускає RLS-політика
// "users: сам собі" (users_select_self).
async function syncProfile() {
    var { data } = await window.sb.auth.getSession();
    var session = data && data.session;
    if (!session) {
        localStorage.removeItem('userData');
        localStorage.removeItem('isGuest');
        currentUser = null;
        return null;
    }
    var rows = await supabaseQuery('users?id=eq.' + session.user.id + '&select=*');
    var profile = rows && rows.length > 0 ? rows[0] : null;
    if (!profile) {
        // Перший вхід після реєстрації через Supabase Auth - профілю ще нема, створюємо.
        var newProfile = {
            id: session.user.id,
            auth_id: session.user.id,
            email: session.user.email,
            full_name: (session.user.user_metadata && session.user.user_metadata.full_name) || session.user.email.split('@')[0],
            role: 'user',
            is_active: true,
            is_banned: false,
            created_at: new Date().toISOString()
        };
        var created = await supabaseQuery('users', {
            method: 'POST',
            headers: { 'Prefer': 'return=representation' },
            body: JSON.stringify(newProfile)
        });
        profile = created && created[0] ? created[0] : newProfile;
    }
    localStorage.setItem('userData', JSON.stringify(profile));
    localStorage.setItem('isGuest', 'false');
    currentUser = profile;
    return profile;
}

async function checkUserBanned(userId) {
    if (!userId) return null;
    try {
        var data = await supabaseQuery('users?id=eq.' + userId + '&select=is_banned,ban_reason');
        if (data && data.length > 0) {
            return {
                is_banned: data[0].is_banned === true,
                ban_reason: data[0].ban_reason || 'Порушення правил платформи'
            };
        }
        return null;
    } catch {
        return null;
    }
}

async function loginUser(email, password) {
    try {
        var { data, error } = await window.sb.auth.signInWithPassword({ email: email, password: password });
        if (error) {
            if (error.message && error.message.toLowerCase().indexOf('invalid') !== -1) {
                throw new Error('Невірний email або пароль');
            }
            throw new Error(error.message);
        }

        var profile = await syncProfile();

        if (profile && profile.is_banned === true) {
            window.location.href = '/banned';
            return { success: false, error: 'Акаунт заблоковано', banned: true };
        }

        window.location.href = '/dashboard';
        return { success: true, user: profile };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function registerUser(email, password, fullName) {
    try {
        var { data, error } = await window.sb.auth.signUp({
            email: email,
            password: password,
            options: { data: { full_name: fullName || email.split('@')[0] } }
        });
        if (error) {
            if (error.message && error.message.toLowerCase().indexOf('already') !== -1) {
                throw new Error('Користувач з таким email вже існує');
            }
            throw new Error(error.message);
        }

        // Якщо в проєкті увімкнене підтвердження email, сесії ще не буде -
        // просимо користувача перевірити пошту замість автологіну.
        if (!data.session) {
            return { success: true, needsEmailConfirm: true };
        }

        var profile = await syncProfile();
        localStorage.setItem('isGuest', 'false');
        return { success: true, user: profile };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function checkAuth() {
    var { data } = await window.sb.auth.getSession();
    if (!data || !data.session) return false;

    var profile = getCurrentUser();
    if (!profile || profile.id !== data.session.user.id) {
        profile = await syncProfile();
    }
    if (!profile) return false;

    if (profile.is_banned === true) return false;

    try {
        var banInfo = await checkUserBanned(profile.id);
        if (banInfo && banInfo.is_banned === true) {
            profile.is_banned = true;
            profile.ban_reason = banInfo.ban_reason || 'Порушення правил платформи';
            localStorage.setItem('userData', JSON.stringify(profile));
            return false;
        }
        currentUser = profile;
        return true;
    } catch {
        return false;
    }
}

async function requireAuth() {
    var isAuth = await checkAuth();
    if (!isAuth) {
        var user = getCurrentUser();
        if (user && user.is_banned === true) {
            window.location.href = '/banned';
        } else {
            window.location.href = '/login';
        }
        return false;
    }
    return true;
}

async function logoutUser() {
    try { await window.sb.auth.signOut(); } catch (e) {}
    localStorage.removeItem('userData');
    localStorage.removeItem('isGuest');
    currentUser = null;
    window.location.href = '/login';
}

async function requestPasswordReset(email) {
    var { error } = await window.sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/forgot-password'
    });
    if (error) throw new Error(error.message);
    return true;
}

async function updatePassword(newPassword) {
    var { error } = await window.sb.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
    return true;
}

function isAdmin() {
    var user = getCurrentUser();
    return user && (user.role === 'admin' || user.role === 'owner');
}

function isOwner() {
    var user = getCurrentUser();
    return user && user.role === 'owner';
}

window.auth = {
    getCurrentUser: getCurrentUser,
    checkAuth: checkAuth,
    requireAuth: requireAuth,
    logoutUser: logoutUser,
    loginUser: loginUser,
    registerUser: registerUser,
    requestPasswordReset: requestPasswordReset,
    updatePassword: updatePassword,
    isAdmin: isAdmin,
    isOwner: isOwner,
    checkUserBanned: checkUserBanned,
    syncProfile: syncProfile
};
