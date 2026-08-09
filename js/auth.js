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
//
// allowCreate=true  - дозволяємо створити рядок профілю, якщо його ще нема
//                      (перший вхід одразу після реєстрації/підтвердження OTP).
// allowCreate=false - НІЧОГО не створюємо. Якщо профілю нема - вважаємо,
//                      що акаунт видалили з public.users, і повертаємо null
//                      (виклик з check-auth.js виб'є юзера з акаунту).
async function syncProfile(allowCreate) {
    if (allowCreate === undefined) allowCreate = false;

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

    if (!profile && allowCreate) {
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
        try {
            var created = await supabaseQuery('users', {
                method: 'POST',
                headers: { 'Prefer': 'return=representation' },
                body: JSON.stringify(newProfile)
            });
            profile = created && created[0] ? created[0] : newProfile;
        } catch (insertError) {
            // 23505 = duplicate key (найчастіше users_email_key). Найімовірніша
            // причина - гонка: профіль уже встиг створитися (тригером у БД або
            // паралельним запитом) буквально в цю ж мить. Пробуємо ще раз
            // прочитати профіль за id, перш ніж здатися.
            var retryRows = await supabaseQuery('users?id=eq.' + session.user.id + '&select=*');
            profile = retryRows && retryRows.length > 0 ? retryRows[0] : null;
            if (!profile) {
                throw insertError;
            }
        }
    }

    if (!profile) {
        localStorage.removeItem('userData');
        localStorage.removeItem('isGuest');
        currentUser = null;
        return null;
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

        // allowCreate=true: якщо профілю в public.users справді ще нема
        // (напр. акаунт заведений напряму через Supabase Auth) - створюємо його.
        var profile = await syncProfile(true);

        if (profile && profile.is_banned === true) {
            window.location.href = '/banned';
            return { success: false, error: 'Акаунт заблоковано', banned: true };
        }

        // Нова сесія - скидаємо прапорці підтвердження OTP для панелей
        // (вхід з нового пристрою/сесії має знову запитати код).
        if (typeof clearAllPanelOtpFlags === 'function') {
            try { clearAllPanelOtpFlags(); } catch (e) {}
        }

        window.location.href = '/dashboard';
        return { success: true, user: profile };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================
// РЕЄСТРАЦІЯ З ПІДТВЕРДЖЕННЯМ 6-ЗНАЧНИМ КОДОМ
// ============================================
// Крок 1: signUp() - Supabase Auth реєструє юзера і шле лист.
// ВАЖЛИВО: щоб у листі був саме 6-значний код, а не посилання,
// у Supabase Dashboard -> Authentication -> Emails -> "Confirm signup"
// шаблон має використовувати {{ .Token }} замість {{ .ConfirmationURL }}.
// Крок 2: verifyRegistrationOtp() - юзер вводить код, ми підтверджуємо
// його через verifyOtp(type:'signup'), що одразу створює сесію (автологін).
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

        // Якщо в проєкті увімкнене підтвердження email - сесії ще не буде,
        // просимо ввести код із листа замість автологіну.
        if (!data.session) {
            return { success: true, needsEmailConfirm: true, email: email };
        }

        // Підтвердження email вимкнене на проєкті - сесія вже є одразу.
        var profile = await syncProfile(true);
        localStorage.setItem('isGuest', 'false');
        return { success: true, user: profile };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Підтвердження коду реєстрації. При успіху одразу створює сесію (автологін).
async function verifyRegistrationOtp(email, code) {
    try {
        var { data, error } = await window.sb.auth.verifyOtp({
            email: email,
            token: code,
            type: 'signup'
        });
        if (error) {
            if (error.message && /expired/i.test(error.message)) {
                throw new Error('Код прострочено. Натисніть "Надіслати код ще раз"');
            }
            throw new Error('Невірний код підтвердження');
        }
        if (!data || !data.session) {
            throw new Error('Не вдалося підтвердити код. Спробуйте ще раз');
        }
        var profile = await syncProfile(true);
        localStorage.setItem('isGuest', 'false');
        return { success: true, user: profile };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Повторна відправка коду реєстрації (якщо не прийшов / прострочився).
async function resendRegistrationOtp(email) {
    var { error } = await window.sb.auth.resend({ type: 'signup', email: email });
    if (error) throw new Error(error.message);
    return true;
}

async function checkAuth() {
    var { data } = await window.sb.auth.getSession();
    if (!data || !data.session) return false;

    var profile = getCurrentUser();
    if (!profile || profile.id !== data.session.user.id) {
        // allowCreate=false: звичайна перевірка сесії нічого не створює -
        // якщо профілю нема, вважаємо акаунт видаленим.
        profile = await syncProfile(false);
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
    if (typeof clearAllPanelOtpFlags === 'function') {
        try { clearAllPanelOtpFlags(); } catch (e) {}
    }
    currentUser = null;
    window.location.href = '/login';
}

// ============================================
// СКИДАННЯ ПАРОЛЯ З ПІДТВЕРДЖЕННЯМ 6-ЗНАЧНИМ КОДОМ
// ============================================
// Так само як реєстрація: щоб у листі був код, а не посилання, у Supabase
// Dashboard -> Authentication -> Emails -> "Reset Password" шаблон теж має
// використовувати {{ .Token }} замість {{ .ConfirmationURL }}.
async function requestPasswordReset(email) {
    var { error } = await window.sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/forgot-password'
    });
    if (error) throw new Error(error.message);
    return true;
}

// Підтвердження коду скидання пароля. При успіху створює тимчасову
// recovery-сесію, після чого можна викликати updatePassword().
async function verifyPasswordResetOtp(email, code) {
    var { data, error } = await window.sb.auth.verifyOtp({
        email: email,
        token: code,
        type: 'recovery'
    });
    if (error) {
        if (error.message && /expired/i.test(error.message)) {
            throw new Error('Код прострочено. Запросіть новий');
        }
        throw new Error('Невірний код підтвердження');
    }
    if (!data || !data.session) {
        throw new Error('Не вдалося підтвердити код. Спробуйте ще раз');
    }
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
    verifyRegistrationOtp: verifyRegistrationOtp,
    resendRegistrationOtp: resendRegistrationOtp,
    requestPasswordReset: requestPasswordReset,
    verifyPasswordResetOtp: verifyPasswordResetOtp,
    updatePassword: updatePassword,
    isAdmin: isAdmin,
    isOwner: isOwner,
    checkUserBanned: checkUserBanned,
    syncProfile: syncProfile
};
