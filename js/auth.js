// ============================================
// ORGSPACE - АВТОРИЗАЦИЯ
// ============================================

// Конфигурация Supabase
const SUPABASE_URL = 'https://iazzgxacdwhaxujoxtaz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhenpneGFjZHdoYXh1am94dGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTY3MDIsImV4cCI6MjEwMTM3MjcwMn0.quXjQ6575ACSjxnfa-hKkD6u3KMYE_5ZLdtqS4JKXI0';

// Текущий пользователь
let currentUser = null;

// ===== РЕГИСТРАЦИЯ =====

/**
 * Регистрация нового пользователя
 */
async function registerUser(email, password, fullName) {
    try {
        // 1. Регистрируем в Supabase Auth
        const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Ошибка регистрации');
        }

        // 2. Создаем профиль пользователя
        if (data.user) {
            await db.createUserProfile({
                auth_id: data.user.id,
                email: data.user.email,
                full_name: fullName,
                role: 'user'
            });
        }

        // 3. Сохраняем сессию
        if (data.session) {
            localStorage.setItem('supabase_session', JSON.stringify(data.session));
            currentUser = data.user;
        }

        return { success: true, user: data.user };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}

// ===== ВХОД =====

/**
 * Вход пользователя
 */
async function loginUser(email, password) {
    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Ошибка входа');
        }

        // Сохраняем сессию
        if (data.session) {
            localStorage.setItem('supabase_session', JSON.stringify(data.session));
            currentUser = data.user;
            
            // Получаем профиль
            const profile = await db.getUserProfile(data.user.id);
            if (profile) {
                currentUser.profile = profile;
            }
        }

        return { success: true, user: data.user };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// ===== ВЫХОД =====

/**
 * Выход пользователя
 */
async function logoutUser() {
    try {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${getSession()?.access_token}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }

    localStorage.removeItem('supabase_session');
    currentUser = null;
    window.location.href = '/login.html';
}

// ===== ПРОВЕРКА СЕССИИ =====

/**
 * Получает текущую сессию
 */
function getSession() {
    try {
        const session = localStorage.getItem('supabase_session');
        return session ? JSON.parse(session) : null;
    } catch {
        return null;
    }
}

/**
 * Проверяет, авторизован ли пользователь
 */
async function checkAuth() {
    const session = getSession();
    if (!session) {
        return false;
    }

    try {
        // Проверяем валидность токена
        const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${session.access_token}`
            }
        });

        if (!response.ok) {
            localStorage.removeItem('supabase_session');
            return false;
        }

        const user = await response.json();
        currentUser = user;
        
        // Получаем профиль
        const profile = await db.getUserProfile(user.id);
        if (profile) {
            currentUser.profile = profile;
        }

        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

/**
 * Защищает страницу (редирект на логин если не авторизован)
 */
async function requireAuth() {
    const isAuth = await checkAuth();
    if (!isAuth) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

/**
 * Получает текущего пользователя
 */
function getCurrentUser() {
    return currentUser;
}

/**
 * Проверяет, является ли пользователь администратором
 */
function isAdmin() {
    return currentUser?.profile?.role === 'admin';
}

// Экспортируем для использования
window.auth = {
    registerUser,
    loginUser,
    logoutUser,
    checkAuth,
    requireAuth,
    getCurrentUser,
    getSession,
    isAdmin
};

console.log('✅ Auth module loaded');