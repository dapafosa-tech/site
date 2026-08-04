// ============================================
// TYPEBIZ - РАБОТА С БАЗОЙ ДАННЫХ (ПОЛНАЯ)
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
        const orgs = await supabaseQuery(`organizations?created_by=eq.${user.id}`);
        return orgs || [];
    } catch (error) {
        console.error('Load orgs error:', error);
        return [];
    }
}

async function getUserAllOrganizations() {
    const user = getCurrentUser();
    if (!user) throw new Error('Не авторизован');
    
    try {
        const members = await supabaseQuery(`org_members?user_id=eq.${user.id}`);
        if (!members || members.length === 0) return [];
        
        const orgIds = members.map(m => m.organization_id).join(',');
        if (!orgIds) return [];
        
        const orgs = await supabaseQuery(`organizations?id=in.(${orgIds})`);
        return orgs || [];
    } catch (error) {
        console.error('Load all orgs error:', error);
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
        { name: 'Основатель', color: '#ef4444', permissions: { all: true, manage_members: true, manage_ranks: true, manage_departments: true, manage_settings: true, manage_requests: true, delete_org: true } },
        { name: 'Администратор', color: '#f59e0b', permissions: { manage_members: true, manage_ranks: true, manage_departments: true, manage_settings: true, manage_requests: true } },
        { name: 'Модератор', color: '#3b82f6', permissions: { manage_members: true, manage_requests: true } },
        { name: 'Старший участник', color: '#8b5cf6', permissions: { invite_members: true, create_departments: true } },
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

// ===== СОТРУДНИКИ =====
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

async function updateEmployee(id, data) {
    return supabaseQuery(`employees?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteEmployee(id) {
    return supabaseQuery(`employees?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== ОТДЕЛЫ =====
async function createDepartment(data) {
    return supabaseQuery('departments', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

async function getOrganizationDepartments(orgId) {
    return supabaseQuery(`departments?organization_id=eq.${orgId}`);
}

async function updateDepartment(id, data) {
    return supabaseQuery(`departments?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteDepartment(id) {
    return supabaseQuery(`departments?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== ДОКУМЕНТЫ =====
async function createDocument(data) {
    return supabaseQuery('documents', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

async function getOrganizationDocuments(orgId) {
    return supabaseQuery(`documents?organization_id=eq.${orgId}`);
}

async function updateDocument(id, data) {
    return supabaseQuery(`documents?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteDocument(id) {
    return supabaseQuery(`documents?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== ТОВАРЫ =====
async function createProduct(data) {
    return supabaseQuery('products', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

async function getOrganizationProducts(orgId) {
    return supabaseQuery(`products?organization_id=eq.${orgId}`);
}

async function updateProduct(id, data) {
    return supabaseQuery(`products?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteProduct(id) {
    return supabaseQuery(`products?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== КНИГИ =====
async function createBook(data) {
    return supabaseQuery('books', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

async function getOrganizationBooks(orgId) {
    return supabaseQuery(`books?organization_id=eq.${orgId}`);
}

async function updateBook(id, data) {
    return supabaseQuery(`books?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteBook(id) {
    return supabaseQuery(`books?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== ЗАЯВЛЕНИЯ =====
async function createApplication(data) {
    return supabaseQuery('applications', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

async function getOrganizationApplications(orgId) {
    return supabaseQuery(`applications?organization_id=eq.${orgId}`);
}

async function updateApplication(id, data) {
    return supabaseQuery(`applications?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteApplication(id) {
    return supabaseQuery(`applications?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== ЛОГИ =====
async function logActivity(data) {
    return supabaseQuery('activity_logs', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

// ===== ЭКСПОРТ =====
window.db = {
    supabaseQuery,
    createOrganization,
    getUserOrganizations,
    getUserAllOrganizations,
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
    updateEmployee,
    deleteEmployee,
    createDepartment,
    getOrganizationDepartments,
    updateDepartment,
    deleteDepartment,
    createDocument,
    getOrganizationDocuments,
    updateDocument,
    deleteDocument,
    createProduct,
    getOrganizationProducts,
    updateProduct,
    deleteProduct,
    createBook,
    getOrganizationBooks,
    updateBook,
    deleteBook,
    createApplication,
    getOrganizationApplications,
    updateApplication,
    deleteApplication,
    logActivity
};

console.log('✅ DB module loaded');
