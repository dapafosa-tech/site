// ============================================
// TYPEBIZ - АВТОРИЗАЦИЯ
// ============================================

// Убираем дублирование - используем глобальные переменные
if (typeof SUPABASE_URL === 'undefined') {
    var SUPABASE_URL = 'https://iazzgxacdwhaxujoxtaz.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhenpneGFjZHdoYXh1am94dGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTY3MDIsImV4cCI6MjEwMTM3MjcwMn0.quXjQ6575ACSjxnfa-hKkD6u3KMYE_5ZLdtqS4JKXI0';
}

let currentUser = null;

function getCurrentUser() {
    try {
        const userData = localStorage.getItem('userData');
        if (userData) {
            currentUser = JSON.parse(userData);
            return currentUser;
        }
        return null;
    } catch {
        return null;
    }
}

async function checkAuth() {
    const user = getCurrentUser();
    if (!user) return false;

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(user.email)}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) return false;
        
        const data = await response.json();
        if (!data || data.length === 0) return false;
        
        currentUser = data[0];
        localStorage.setItem('userData', JSON.stringify(currentUser));
        return true;
    } catch {
        return false;
    }
}

async function requireAuth() {
    const isAuth = await checkAuth();
    if (!isAuth) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

async function requireAdmin() {
    const isAuth = await checkAuth();
    if (!isAuth) {
        window.location.href = '/login';
        return false;
    }
    
    const user = getCurrentUser();
    if (user?.role !== 'admin') {
        await showAlert('Доступ запрещен. Требуются права администратора.', 'error');
        window.location.href = '/dashboard';
        return false;
    }
    return true;
}

function logoutUser() {
    localStorage.removeItem('userData');
    localStorage.removeItem('isGuest');
    currentUser = null;
    window.location.href = '/login';
}

async function loginUser(email, password) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка при поиске пользователя');
        }

        const users = await response.json();
        
        if (!users || users.length === 0) {
            throw new Error('Пользователь не найден');
        }

        const user = users[0];

        if (user.password && user.password !== password) {
            throw new Error('Неверный пароль');
        }

        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('isGuest', 'false');
        currentUser = user;

        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function registerUser(email, password, fullName) {
    try {
        const userId = generateUUID();
        
        const userData = {
            id: userId,
            auth_id: userId,
            email: email,
            full_name: fullName,
            password: password,
            role: 'user',
            is_active: true,
            created_at: new Date().toISOString()
        };

        const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            if (errorText.includes('duplicate key') || errorText.includes('already exists')) {
                throw new Error('Пользователь с таким email уже существует');
            }
            throw new Error('Ошибка при создании аккаунта');
        }

        const result = await response.json();
        const user = result[0] || result;
        
        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('isGuest', 'false');
        currentUser = user;

        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function isAdmin() {
    const user = getCurrentUser();
    return user?.role === 'admin';
}

window.auth = {
    getCurrentUser,
    checkAuth,
    requireAuth,
    requireAdmin,
    logoutUser,
    loginUser,
    registerUser,
    isAdmin
};

console.log('✅ Auth module loaded');
