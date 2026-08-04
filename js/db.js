// ============================================
// TYPEBIZ - РАБОТА С БАЗОЙ ДАННЫХ (ИСПРАВЛЕННАЯ)
// ============================================

if (typeof SUPABASE_URL === 'undefined') {
    var SUPABASE_URL = 'https://iazzgxacdwhaxujoxtaz.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhenpneGFjZHdoYXh1am94dGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTY3MDIsImV4cCI6MjEwMTM3MjcwMn0.quXjQ6575ACSjxnfa-hKkD6u3KMYE_5ZLdtqS4JKXI0';
}

function getCurrentUser() {
    try {
        const userData = localStorage.getItem('userData');
        if (userData) {
            return JSON.parse(userData);
        }
        return null;
    } catch {
        return null;
    }
}

async function supabaseQuery(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 204) {
            return [];
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const text = await response.text();
        if (!text || text.trim() === '') {
            return [];
        }

        try {
            return JSON.parse(text);
        } catch {
            if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
                try {
                    return eval('(' + text + ')');
                } catch {
                    return [];
                }
            }
            return [];
        }

    } catch (error) {
        console.error('Supabase query error:', error);
        throw error;
    }
}

// ===== ОРГАНИЗАЦИИ =====
async function createOrganization(data) {
    const user = getCurrentUser();
    if (!user) throw new Error('Не авторизован');
    
    const joinCode = generateJoinCode();
    
    const orgData = {
        name: data.name,
        type: data.type,
        description: data.description || '',
        created_by: user.id,
        leader_id: user.id,
        join_code: joinCode,
        is_active: true,
        settings: data.settings || {},
        created_at: new Date().toISOString()
    };

    const result = await supabaseQuery('organizations', {
        method: 'POST',
        body: JSON.stringify(orgData),
        headers: {
            'Prefer': 'return=representation'
        }
    });

    // Создаём ранги по умолчанию
    if (result && result.length > 0) {
        const orgId = result[0].id;
        await createDefaultRanks(orgId);
        await addMemberToOrganization(orgId, user.id, null);
    }

    return result;
}

async function getUserOrganizations() {
    const user = getCurrentUser();
    if (!user) throw new Error('Не авторизован');
    
    try {
        // ПРОСТОЙ ВАРИАНТ: получаем организации где пользователь создатель
        const orgs = await supabaseQuery(`organizations?created_by=eq.${user.id}`);
        return orgs || [];
    } catch (error) {
        console.error('Load orgs error:', error);
        return [];
    }
}

async function getOrganization(id) {
    const result = await supabaseQuery(`organizations?id=eq.${id}`);
    return result[0] || null;
}

async function updateOrganization(id, data) {
    return supabaseQuery(`organizations?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteOrganization(id) {
    return supabaseQuery(`organizations?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== КОД ВСТУПЛЕНИЯ =====
function generateJoinCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

async function getOrganizationByJoinCode(code) {
    const result = await supabaseQuery(`organizations?join_code=eq.${code}`);
    return result[0] || null;
}

// ===== РАНГИ =====
async function createDefaultRanks(orgId) {
    const ranks = [
        { name: 'Основатель', color: '#ef4444', permissions: { all: true } },
        { name: 'Администратор', color: '#f59e0b', permissions: { manage: true } },
        { name: 'Модератор', color: '#3b82f6', permissions: { moderate: true } },
        { name: 'Участник', color: '#10b981', permissions: { view: true } }
    ];

    for (const rank of ranks) {
        await supabaseQuery('org_ranks', {
            method: 'POST',
            body: JSON.stringify({
                organization_id: orgId,
                name: rank.name,
                color: rank.color,
                permissions: rank.permissions
            })
        });
    }
}

async function getOrganizationRanks(orgId) {
    return supabaseQuery(`org_ranks?organization_id=eq.${orgId}`);
}

async function createRank(orgId, data) {
    return supabaseQuery('org_ranks', {
        method: 'POST',
        body: JSON.stringify({
            organization_id: orgId,
            ...data
        }),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

async function deleteRank(id) {
    return supabaseQuery(`org_ranks?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== УЧАСТНИКИ =====
async function addMemberToOrganization(orgId, userId, rankId = null) {
    return supabaseQuery('org_members', {
        method: 'POST',
        body: JSON.stringify({
            organization_id: orgId,
            user_id: userId,
            rank_id: rankId,
            joined_at: new Date().toISOString(),
            is_active: true
        })
    });
}

async function getOrganizationMembers(orgId) {
    return supabaseQuery(`org_members?organization_id=eq.${orgId}`);
}

async function updateMemberRank(memberId, rankId) {
    return supabaseQuery(`org_members?id=eq.${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify({ rank_id: rankId })
    });
}

async function removeMemberFromOrganization(memberId) {
    return supabaseQuery(`org_members?id=eq.${memberId}`, {
        method: 'DELETE'
    });
}

// ===== ЗАЯВКИ НА ВСТУПЛЕНИЕ =====
async function createJoinRequest(orgId, userId, message = '') {
    return supabaseQuery('join_requests', {
        method: 'POST',
        body: JSON.stringify({
            organization_id: orgId,
            user_id: userId,
            status: 'pending',
            message: message,
            created_at: new Date().toISOString()
        }),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

async function getJoinRequests(orgId, status = 'pending') {
    return supabaseQuery(`join_requests?organization_id=eq.${orgId}&status=eq.${status}`);
}

async function getMyJoinRequests(userId) {
    return supabaseQuery(`join_requests?user_id=eq.${userId}&order=created_at.desc`);
}

async function updateJoinRequest(requestId, status) {
    return supabaseQuery(`join_requests?id=eq.${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
            status: status,
            updated_at: new Date().toISOString()
        })
    });
}

// ===== ПОЛЬЗОВАТЕЛИ =====
async function updateUser(id, data) {
    return supabaseQuery(`users?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteUser(id) {
    return supabaseQuery(`users?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== СОТРУДНИКИ (старое) =====
async function createEmployee(data) {
    return supabaseQuery('employees', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

async function getOrganizationEmployees(orgId) {
    return supabaseQuery(`employees?organization_id=eq.${orgId}`);
}

async function deleteEmployee(id) {
    return supabaseQuery(`employees?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== ЭКСПОРТ =====
window.db = {
    supabaseQuery,
    createOrganization,
    getUserOrganizations,
    getOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganizationByJoinCode,
    createDefaultRanks,
    getOrganizationRanks,
    createRank,
    deleteRank,
    addMemberToOrganization,
    getOrganizationMembers,
    updateMemberRank,
    removeMemberFromOrganization,
    createJoinRequest,
    getJoinRequests,
    getMyJoinRequests,
    updateJoinRequest,
    updateUser,
    deleteUser,
    createEmployee,
    getOrganizationEmployees,
    deleteEmployee
};

console.log('✅ DB module loaded');
