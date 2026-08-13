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

function isValidFullName(value) {
    var name = (value || '').trim().replace(/\s+/g, ' ');
    var parts = name.split(' ');
    if (parts.length !== 2) return false;
    var wordRe = /^[A-ZА-ЯЁІЇЄҐ][a-zа-яёіїєґ'’-]+$/;
    return wordRe.test(parts[0]) && wordRe.test(parts[1]);
}

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
        var meta = session.user.user_metadata || {};
        var regIp = await getClientIp();
        var newProfile = {
            id: session.user.id,
            auth_id: session.user.id,
            email: session.user.email,
            full_name: meta.full_name || session.user.email.split('@')[0],
            phone: meta.phone || null,
            company_address: meta.company_address || null,
            role: 'user',
            is_active: true,
            is_banned: false,
            last_ban_action_at: null,
            reg_ip: regIp,
            last_ip: regIp,
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

    await trackVisitIp(profile);

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

async function loginUser(email, password, fullName) {
    try {
        var { data, error } = await window.sb.auth.signInWithPassword({ email: email, password: password });
        if (error) {
            if (error.message && error.message.toLowerCase().indexOf('invalid') !== -1) {
                throw new Error('Невірний email або пароль');
            }
            throw new Error(error.message);
        }

        var profile = await syncProfile(true);

        if (fullName !== undefined) {
            var enteredName = (fullName || '').trim().replace(/\s+/g, ' ');
            var storedName = ((profile && profile.full_name) || '').trim().replace(/\s+/g, ' ');
            if (!enteredName || enteredName !== storedName) {
                await window.sb.auth.signOut();
                throw new Error('Ім\'я та прізвище не збігаються з даними акаунта');
            }
        }

        if (profile && profile.is_banned === true) {
            window.location.href = '/banned';
            return { success: false, error: 'Акаунт заблоковано', banned: true };
        }

        // Записуємо сесію + ОНОВЛЮЄМО поточний IP користувача.
        // Раніше last_ip виставлявся лише один раз при реєстрації і більше
        // ніколи не оновлювався - через це перевірка розбіжності IP
        // (компрометація акаунту) не мала сенсу, бо "поточний" IP був
        // назавжди застиглим на моменті реєстрації.
        try {
            var ip = await getClientIp();
            await recordUserSession(profile.id, data.session.access_token, ip, navigator.userAgent);
            if (ip && profile.last_ip !== ip) {
                await supabaseQuery('users?id=eq.' + profile.id, {
                    method: 'PATCH',
                    body: JSON.stringify({ last_ip: ip })
                });
                profile.last_ip = ip;
                localStorage.setItem('userData', JSON.stringify(profile));
                currentUser = profile;
            }
        } catch (e) {
            console.warn('Failed to record session:', e);
        }

        if (typeof clearAllPanelOtpFlags === 'function') {
            try { clearAllPanelOtpFlags(); } catch (e) {}
        }

        window.location.href = '/dashboard';
        return { success: true, user: profile };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function registerUser(email, password, fullName, phone, companyAddress) {
    try {
        var sysSettings = await db.getSystemSettings();
        if (sysSettings && sysSettings['allow_registration'] === 'false') {
            throw new Error('Реєстрацію нових користувачів тимчасово вимкнено адміністрацією');
        }

        var regIp = await db.getClientIp();

        var { data, error } = await window.sb.auth.signUp({
            email: email,
            password: password,
            options: { data: {
                full_name: fullName || email.split('@')[0],
                phone: phone || null,
                company_address: companyAddress || null,
                reg_ip: regIp || null
            } }
        });
        if (error) {
            if (error.message && error.message.toLowerCase().indexOf('already') !== -1) {
                throw new Error('Користувач з таким email вже існує');
            }
            throw new Error(error.message);
        }

        if (!data.session) {
            return { success: true, needsEmailConfirm: true, email: email, phone: phone, companyAddress: companyAddress };
        }

        var profile = await syncProfile(true);
        localStorage.setItem('isGuest', 'false');
        
        // Записуємо сесію
        try {
            await recordUserSession(profile.id, data.session.access_token, regIp, navigator.userAgent);
        } catch (e) {
            console.warn('Failed to record session:', e);
        }
        
        return { success: true, user: profile };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function recordUserSession(userId, token, ip, userAgent) {
    try {
        // Перевіряємо чи існує вже сесія з таким токеном
        var existing = await supabaseQuery('user_sessions?session_token=eq.' + token);
        if (existing && existing.length > 0) {
            // Оновлюємо час активності
            await supabaseQuery('user_sessions?id=eq.' + existing[0].id, {
                method: 'PATCH',
                body: JSON.stringify({
                    last_activity: new Date().toISOString(),
                    ip: ip || existing[0].ip,
                    user_agent: userAgent || existing[0].user_agent
                })
            });
            return;
        }
        
        await supabaseQuery('user_sessions', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                session_token: token,
                ip: ip || null,
                user_agent: userAgent || null,
                last_activity: new Date().toISOString(),
                is_active: true
            })
        });
    } catch (e) {
        console.warn('Не вдалося записати сесію:', e);
    }
}

async function updateSessionActivity(userId) {
    try {
        var { data } = await window.sb.auth.getSession();
        var session = data && data.session;
        if (!session) return;
        
        await supabaseQuery('user_sessions?user_id=eq.' + userId + '&session_token=eq.' + session.access_token, {
            method: 'PATCH',
            body: JSON.stringify({
                last_activity: new Date().toISOString()
            })
        });
    } catch (e) {
        // Ігноруємо помилки оновлення активності
    }
}

async function terminateSession(sessionId) {
    try {
        await supabaseQuery('user_sessions?id=eq.' + sessionId, {
            method: 'DELETE'
        });
        return true;
    } catch (e) {
        console.error('Failed to terminate session:', e);
        return false;
    }
}

async function terminateAllSessions(userId, excludeCurrentToken) {
    try {
        var query = 'user_sessions?user_id=eq.' + userId;
        if (excludeCurrentToken) {
            query += '&session_token=neq.' + excludeCurrentToken;
        }
        await supabaseQuery(query, { method: 'DELETE' });
        return true;
    } catch (e) {
        console.error('Failed to terminate all sessions:', e);
        return false;
    }
}

async function getActiveSessions(userId) {
    try {
        var sessions = await supabaseQuery('user_sessions?user_id=eq.' + userId + '&is_active=eq.true&order=last_activity.desc');
        return sessions || [];
    } catch (e) {
        console.error('Failed to get sessions:', e);
        return [];
    }
}

async function verifyRegistrationOtp(email, code, phone, companyAddress) {
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

        if (profile) {
            var patch = {};
            if (phone && !profile.phone) patch.phone = phone;
            if (companyAddress && !profile.company_address) patch.company_address = companyAddress;
            if (!profile.reg_ip || !profile.last_ip) {
                try {
                    var regIp = await db.getClientIp();
                    if (regIp) {
                        if (!profile.reg_ip) patch.reg_ip = regIp;
                        if (!profile.last_ip) patch.last_ip = regIp;
                    }
                } catch (e) {}
            }

            if (Object.keys(patch).length > 0) {
                try {
                    await supabaseQuery('users?id=eq.' + profile.id, {
                        method: 'PATCH',
                        headers: { 'Prefer': 'return=representation' },
                        body: JSON.stringify(patch)
                    });
                    Object.assign(profile, patch);
                    localStorage.setItem('userData', JSON.stringify(profile));
                    currentUser = profile;
                } catch (e) {
                    console.warn('Failed to backfill profile extras:', e);
                }
            }
            
            // Записуємо сесію
            try {
                await recordUserSession(profile.id, data.session.access_token, profile.reg_ip, navigator.userAgent);
            } catch (e) {
                console.warn('Failed to record session:', e);
            }
        }

        localStorage.setItem('isGuest', 'false');
        return { success: true, user: profile };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

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
        profile = await syncProfile(false);
    }
    if (!profile) return false;

    if (profile.is_banned === true) return false;

    // Оновлюємо активність сесії
    try {
        await updateSessionActivity(profile.id);
    } catch (e) {}

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
    var user = getCurrentUser();
    if (user) {
        try {
            var { data } = await window.sb.auth.getSession();
            var session = data && data.session;
            if (session) {
                // Деактивуємо сесію
                await supabaseQuery('user_sessions?user_id=eq.' + user.id + '&session_token=eq.' + session.access_token, {
                    method: 'PATCH',
                    body: JSON.stringify({ is_active: false })
                });
            }
        } catch (e) {}
    }
    
    try { await window.sb.auth.signOut(); } catch (e) {}
    localStorage.removeItem('userData');
    localStorage.removeItem('isGuest');
    if (typeof clearAllPanelOtpFlags === 'function') {
        try { clearAllPanelOtpFlags(); } catch (e) {}
    }
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

async function requestEmailChange(newEmail) {
    var { error } = await window.sb.auth.updateUser({ email: newEmail });
    if (error) {
        if (error.message && error.message.toLowerCase().indexOf('already') !== -1) {
            throw new Error('Ця пошта вже використовується іншим акаунтом');
        }
        throw new Error(error.message);
    }
    return true;
}

async function verifyEmailChangeOtp(newEmail, code) {
    var { data, error } = await window.sb.auth.verifyOtp({
        email: newEmail,
        token: code,
        type: 'email_change'
    });
    if (error) {
        if (error.message && /expired/i.test(error.message)) {
            throw new Error('Код прострочено. Запросіть новий');
        }
        throw new Error('Невірний код підтвердження');
    }

    var user = getCurrentUser();
    if (user) {
        await supabaseQuery('users?id=eq.' + user.id, {
            method: 'PATCH',
            headers: { 'Prefer': 'return=representation' },
            body: JSON.stringify({ email: newEmail })
        });
        user.email = newEmail;
        localStorage.setItem('userData', JSON.stringify(user));
        currentUser = user;
    }
    return true;
}

async function checkEmailExists(email) {
    try {
        var { data, error } = await window.sb.rpc('email_exists', { check_email: email });
        if (error) {
            return false;
        }
        return data === true;
    } catch (e) {
        return false;
    }
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
    checkEmailExists: checkEmailExists,
    isValidFullName: isValidFullName,
    verifyRegistrationOtp: verifyRegistrationOtp,
    resendRegistrationOtp: resendRegistrationOtp,
    requestPasswordReset: requestPasswordReset,
    verifyPasswordResetOtp: verifyPasswordResetOtp,
    updatePassword: updatePassword,
    requestEmailChange: requestEmailChange,
    verifyEmailChangeOtp: verifyEmailChangeOtp,
    isAdmin: isAdmin,
    isOwner: isOwner,
    checkUserBanned: checkUserBanned,
    syncProfile: syncProfile,
    // Нові функції для сесій
    recordUserSession: recordUserSession,
    updateSessionActivity: updateSessionActivity,
    terminateSession: terminateSession,
    terminateAllSessions: terminateAllSessions,
    getActiveSessions: getActiveSessions
};
