// ============================================
// TYPEBIZ - РОБОТА З БАЗОЮ ДАНИХ
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

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ===== НОВИЙ ФОРМАТ КОДУ ВСТУПУ =====
function generateJoinCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let code = '';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (i < 3) code += '-';
    }
    return code;
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

// ===== ОРГАНІЗАЦІЇ =====
async function createOrganization(data) {
    const user = getCurrentUser();
    if (!user) throw new Error('Не авторизовано');
    
    const orgs = await getUserOrganizations();
    const leaderOrgs = orgs.filter(o => o.leader_id === user.id);
    if (leaderOrgs.length >= 2) {
        throw new Error('Ви можете бути лідером максимум у 2 організаціях');
    }
    
    const joinCode = generateJoinCode();
    
    const orgData = {
        id: generateUUID(),
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
    if (!user) throw new Error('Не авторизовано');
    
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
    if (!user) throw new Error('Не авторизовано');
    
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

async function getOrganizationByJoinCode(code) {
    const result = await supabaseQuery(`organizations?join_code=eq.${code}`);
    return result[0] || null;
}

// ===== РАНГИ (З ПРАВАМИ) =====
async function createDefaultRanks(orgId) {
    const ranks = [
        { 
            name: 'Директор', 
            color: '#ef4444', 
            permissions: { 
                all: true,
                manage_members: true,
                manage_ranks: true,
                manage_departments: true,
                manage_settings: true,
                manage_requests: true,
                manage_vacations: true,
                manage_chat: true,
                delete_org: true
            } 
        },
        { 
            name: 'Адміністратор', 
            color: '#f59e0b', 
            permissions: { 
                manage_members: true,
                manage_ranks: true,
                manage_departments: true,
                manage_settings: true,
                manage_requests: true,
                manage_vacations: true,
                manage_chat: true
            } 
        },
        { 
            name: 'Менеджер', 
            color: '#3b82f6', 
            permissions: { 
                manage_members: true,
                manage_requests: true,
                manage_vacations: true,
                manage_chat: true
            } 
        },
        { 
            name: 'Старший учасник', 
            color: '#8b5cf6', 
            permissions: { 
                manage_chat: true
            } 
        },
        { 
            name: 'Учасник', 
            color: '#10b981', 
            permissions: { 
                view: true
            } 
        }
    ];

    for (const rank of ranks) {
        await supabaseQuery('org_ranks', {
            method: 'POST',
            body: JSON.stringify({
                id: generateUUID(),
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
            id: generateUUID(),
            organization_id: orgId,
            name: data.name,
            color: data.color,
            permissions: data.permissions || {}
        }),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

async function updateRank(id, data) {
    return supabaseQuery(`org_ranks?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteRank(id) {
    return supabaseQuery(`org_ranks?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== УЧАСНИКИ =====
async function addMemberToOrganization(orgId, userId, rankId = null) {
    return supabaseQuery('org_members', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
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

// ===== ЗАЯВКИ НА ВСТУП =====
async function createJoinRequest(orgId, userId, message = '') {
    return supabaseQuery('join_requests', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
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

async function updateJoinRequest(requestId, status) {
    return supabaseQuery(`join_requests?id=eq.${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
            status: status,
            updated_at: new Date().toISOString()
        })
    });
}

// ===== СПІВРОБІТНИКИ =====
async function createEmployee(data) {
    return supabaseQuery('employees', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            ...data
        }),
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

// ===== ВІДДІЛИ =====
async function createDepartment(data) {
    return supabaseQuery('departments', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            ...data
        }),
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

// ===== ПРИЗНАЧЕННЯ У ВІДДІЛ =====
async function assignEmployeeToDepartment(employeeId, departmentId) {
    return supabaseQuery(`employees?id=eq.${employeeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ department_id: departmentId })
    });
}

async function getEmployeesByDepartment(departmentId) {
    return supabaseQuery(`employees?department_id=eq.${departmentId}`);
}

async function removeEmployeeFromDepartment(employeeId) {
    return supabaseQuery(`employees?id=eq.${employeeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ department_id: null })
    });
}

// ===== ЧАТ =====
async function sendChatMessage(organizationId, userId, message, mentions = []) {
    return supabaseQuery('org_chat_messages', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            organization_id: organizationId,
            user_id: userId,
            message: message,
            mentions: mentions,
            created_at: new Date().toISOString()
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getChatMessages(organizationId, limit = 50) {
    return supabaseQuery(
        `org_chat_messages?organization_id=eq.${organizationId}&order=created_at.desc&limit=${limit}`
    );
}

async function deleteChatMessage(messageId) {
    return supabaseQuery(`org_chat_messages?id=eq.${messageId}`, {
        method: 'DELETE'
    });
}

// ===== ВІДПУСТКИ =====
async function createVacation(data) {
    return supabaseQuery('org_vacations', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            ...data,
            created_at: new Date().toISOString()
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getVacations(organizationId, status = null) {
    let query = `org_vacations?organization_id=eq.${organizationId}`;
    if (status) {
        query += `&status=eq.${status}`;
    }
    query += `&order=created_at.desc`;
    return supabaseQuery(query);
}

async function getUserVacations(userId) {
    return supabaseQuery(
        `org_vacations?user_id=eq.${userId}&order=created_at.desc`
    );
}

async function updateVacationStatus(vacationId, status, approvedBy = null) {
    const data = { 
        status: status,
        updated_at: new Date().toISOString()
    };
    if (approvedBy) {
        data.approved_by = approvedBy;
    }
    return supabaseQuery(`org_vacations?id=eq.${vacationId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteVacation(vacationId) {
    return supabaseQuery(`org_vacations?id=eq.${vacationId}`, {
        method: 'DELETE'
    });
}

// ===== СПОВІЩЕННЯ =====
async function createNotification(data) {
    return supabaseQuery('notifications', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            ...data,
            created_at: new Date().toISOString()
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getNotifications(userId, limit = 20) {
    return supabaseQuery(
        `notifications?user_id=eq.${userId}&order=created_at.desc&limit=${limit}`
    );
}

async function markNotificationRead(notificationId) {
    return supabaseQuery(`notifications?id=eq.${notificationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true })
    });
}

async function markAllNotificationsRead(userId) {
    return supabaseQuery(`notifications?user_id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true })
    });
}

// ===== КОРИСТУВАЧІ =====
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

// ===== ЕКСПОРТ =====
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
    updateRank,
    deleteRank,
    addMemberToOrganization,
    getOrganizationMembers,
    updateMemberRank,
    removeMemberFromOrganization,
    createJoinRequest,
    getJoinRequests,
    updateJoinRequest,
    createEmployee,
    getOrganizationEmployees,
    updateEmployee,
    deleteEmployee,
    createDepartment,
    getOrganizationDepartments,
    updateDepartment,
    deleteDepartment,
    assignEmployeeToDepartment,
    getEmployeesByDepartment,
    removeEmployeeFromDepartment,
    sendChatMessage,
    getChatMessages,
    deleteChatMessage,
    createVacation,
    getVacations,
    getUserVacations,
    updateVacationStatus,
    deleteVacation,
    createNotification,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    updateUser,
    deleteUser
};

console.log('✅ DB module loaded');
