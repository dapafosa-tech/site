// ============================================
// ORGSPACE - АВТОРИЗАЦИЯ
// ============================================

const SUPABASE_URL = 'https://iazzgxacdwhaxujoxtaz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhenpneGFjZHdoYXh1am94dGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTY3MDIsImV4cCI6MjEwMTM3MjcwMn0.quXjQ6575ACSjxnfa-hKkD6u3KMYE_5ZLdtqS4JKXI0';

let currentUser = null;

async function registerUser(email, password, fullName) {
    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Ошибка регистрации');
        }

        if (data.user) {
            await db.createUserProfile({
                auth_id: data.user.id,
                email: data.user.email,
                full_name: fullName,
                role: 'user'
            });
        }

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

async function loginUser(email, password) {
    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Ошибка входа');
        }

        if (data.session) {
            localStorage.setItem('supabase_session', JSON.stringify(data.session));
            currentUser = data.user;
            
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

async function logoutUser() {
    try {
        const session = getSession();
        if (session) {
            await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    }

    localStorage.removeItem('supabase_session');
    currentUser = null;
    window.location.href = '/login.html';
}

function getSession() {
    try {
        const session = localStorage.getItem('supabase_session');
        return session ? JSON.parse(session) : null;
    } catch {
        return null;
    }
}

async function checkAuth() {
    const session = getSession();
    if (!session) return false;

    try {
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

async function requireAuth() {
    const isAuth = await checkAuth();
    if (!isAuth) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

function getCurrentUser() {
    return currentUser;
}

function isAdmin() {
    return currentUser?.profile?.role === 'admin';
}

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
