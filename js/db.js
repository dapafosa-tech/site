// ============================================
// TYPEBIZ - РОБОТА З БАЗОЮ ДАНИХ
// ============================================

if (typeof SUPABASE_URL === 'undefined') {
    var SUPABASE_URL = 'https://iazzgxacdwhaxujoxtaz.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhenpneGFjZHdoYXh1am94dGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTY3MDIsImV4cCI6MjEwMTM3MjcwMn0.quXjQ6575ACSjxnfa-hKkD6u3KMYE_5ZLdtqS4JKXI0';
}

function getCurrentUser() {
    try {
        var userData = localStorage.getItem('userData');
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
        var r = Math.random() * 16 | 0;
        var v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function generateJoinCode() {
    var chars = 'abcdefghijklmnopqrstuvwxyz';
    var parts = [];
    for (var i = 0; i < 4; i++) {
        var part = '';
        for (var j = 0; j < 4; j++) {
            part += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        parts.push(part);
    }
    return parts.join('-');
}

async function supabaseQuery(endpoint, options) {
    if (options === undefined) options = {};
    var url = SUPABASE_URL + '/rest/v1/' + endpoint;
    var headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
    };
    
    if (options.headers) {
        for (var key in options.headers) {
            headers[key] = options.headers[key];
        }
    }

    try {
        var response = await fetch(url, {
            method: options.method || 'GET',
            headers: headers,
            body: options.body || null
        });

        if (response.status === 204) {
            return [];
        }

        if (!response.ok) {
            var errorText = await response.text();
            throw new Error('HTTP ' + response.status + ': ' + errorText);
        }

        var text = await response.text();
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
    var user = getCurrentUser();
    if (!user) throw new Error('Не авторизовано');
    
    var orgs = await getUserOrganizations();
    var leaderOrgs = orgs.filter(function(o) { return o.leader_id === user.id; });
    if (leaderOrgs.length >= 2) {
        throw new Error('Ви можете бути лідером максимум у 2 організаціях');
    }
    
    var joinCode = generateJoinCode();
    
    var orgData = {
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

    var result = await supabaseQuery('organizations', {
        method: 'POST',
        body: JSON.stringify(orgData),
        headers: {
            'Prefer': 'return=representation'
        }
    });

    if (result && result.length > 0) {
        var orgId = result[0].id;
        await createDefaultRanks(orgId);
        await addMemberToOrganization(orgId, user.id, null);
    }

    return result;
}

async function getUserOrganizations() {
    var user = getCurrentUser();
    if (!user) throw new Error('Не авторизовано');
    
    try {
        var orgs = await supabaseQuery('organizations?created_by=eq.' + user.id);
        return orgs || [];
    } catch (error) {
        console.error('Load orgs error:', error);
        return [];
    }
}

async function getUserAllOrganizations() {
    var user = getCurrentUser();
    if (!user) throw new Error('Не авторизовано');
    
    try {
        var members = await supabaseQuery('org_members?user_id=eq.' + user.id);
        if (!members || members.length === 0) return [];
        
        var orgIds = members.map(function(m) { return m.organization_id; }).join(',');
        if (!orgIds) return [];
        
        var orgs = await supabaseQuery('organizations?id=in.(' + orgIds + ')');
        return orgs || [];
    } catch (error) {
        console.error('Load all orgs error:', error);
        return [];
    }
}

async function getOrganization(id) {
    var result = await supabaseQuery('organizations?id=eq.' + id);
    return result[0] || null;
}

async function updateOrganization(id, data) {
    return supabaseQuery('organizations?id=eq.' + id, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteOrganization(id) {
    return supabaseQuery('organizations?id=eq.' + id, {
        method: 'DELETE'
    });
}

async function getOrganizationByJoinCode(code) {
    var result = await supabaseQuery('organizations?join_code=eq.' + code);
    return result[0] || null;
}

// ===== РАНГИ (ТІЛЬКИ ДИРЕКТОР) =====
async function createDefaultRanks(orgId) {
    await supabaseQuery('org_ranks', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            organization_id: orgId,
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
        })
    });
}

async function getOrganizationRanks(orgId) {
    return supabaseQuery('org_ranks?organization_id=eq.' + orgId);
}

async function createRank(orgId, data) {
    return supabaseQuery('org_ranks', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            organization_id: orgId,
            name: data.name,
            color: data.color,
            permissions: data.permissions || {},
            order: data.order || 0
        }),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

async function updateRank(id, data) {
    return supabaseQuery('org_ranks?id=eq.' + id, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteRank(id) {
    return supabaseQuery('org_ranks?id=eq.' + id, {
        method: 'DELETE'
    });
}

// ===== УЧАСНИКИ =====
async function addMemberToOrganization(orgId, userId, rankId) {
    if (rankId === undefined) rankId = null;
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
    return supabaseQuery('org_members?organization_id=eq.' + orgId);
}

async function updateMemberRank(memberId, rankId) {
    return supabaseQuery('org_members?id=eq.' + memberId, {
        method: 'PATCH',
        body: JSON.stringify({ rank_id: rankId })
    });
}

async function removeMemberFromOrganization(memberId) {
    return supabaseQuery('org_members?id=eq.' + memberId, {
        method: 'DELETE'
    });
}

// ===== ЗАЯВКИ =====
async function createJoinRequest(orgId, userId, message) {
    if (message === undefined) message = '';
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

async function getJoinRequests(orgId, status) {
    if (status === undefined) status = 'pending';
    return supabaseQuery('join_requests?organization_id=eq.' + orgId + '&status=eq.' + status);
}

async function updateJoinRequest(requestId, status) {
    return supabaseQuery('join_requests?id=eq.' + requestId, {
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
            organization_id: data.organization_id,
            user_id: data.user_id || null,
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            middle_name: data.middle_name || '',
            position: data.position || '',
            department_id: data.department_id || null,
            email: data.email || '',
            phone: data.phone || '',
            hire_date: data.hire_date || null,
            salary: data.salary || 0,
            status: data.status || 'active'
        }),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

async function getOrganizationEmployees(orgId) {
    return supabaseQuery('employees?organization_id=eq.' + orgId);
}

async function updateEmployee(id, data) {
    return supabaseQuery('employees?id=eq.' + id, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteEmployee(id) {
    return supabaseQuery('employees?id=eq.' + id, {
        method: 'DELETE'
    });
}

// ===== ВІДДІЛИ =====
async function createDepartment(data) {
    return supabaseQuery('departments', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            organization_id: data.organization_id,
            name: data.name,
            description: data.description || ''
        }),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

async function getOrganizationDepartments(orgId) {
    return supabaseQuery('departments?organization_id=eq.' + orgId);
}

async function updateDepartment(id, data) {
    return supabaseQuery('departments?id=eq.' + id, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteDepartment(id) {
    return supabaseQuery('departments?id=eq.' + id, {
        method: 'DELETE'
    });
}

// ===== ПРИЗНАЧЕННЯ У ВІДДІЛ =====
async function assignEmployeeToDepartment(employeeId, departmentId) {
    return supabaseQuery('employees?id=eq.' + employeeId, {
        method: 'PATCH',
        body: JSON.stringify({ department_id: departmentId })
    });
}

async function getEmployeesByDepartment(departmentId) {
    return supabaseQuery('employees?department_id=eq.' + departmentId);
}

async function removeEmployeeFromDepartment(employeeId) {
    return supabaseQuery('employees?id=eq.' + employeeId, {
        method: 'PATCH',
        body: JSON.stringify({ department_id: null })
    });
}

// ===== ЧАТ =====
async function sendChatMessage(organizationId, userId, message, mentions) {
    if (mentions === undefined) mentions = [];
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

async function getChatMessages(organizationId, limit) {
    if (limit === undefined) limit = 50;
    return supabaseQuery('org_chat_messages?organization_id=eq.' + organizationId + '&order=created_at.desc&limit=' + limit);
}

async function deleteChatMessage(messageId) {
    return supabaseQuery('org_chat_messages?id=eq.' + messageId, {
        method: 'DELETE'
    });
}

// ===== ВІДПУСТКИ =====
async function createVacation(data) {
    return supabaseQuery('org_vacations', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            organization_id: data.organization_id,
            user_id: data.user_id,
            start_date: data.start_date,
            end_date: data.end_date,
            type: data.type || 'annual',
            reason: data.reason || '',
            status: data.status || 'pending',
            approved_by: data.approved_by || null,
            created_at: new Date().toISOString()
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getVacations(organizationId, status) {
    var query = 'org_vacations?organization_id=eq.' + organizationId;
    if (status) {
        query += '&status=eq.' + status;
    }
    query += '&order=created_at.desc';
    return supabaseQuery(query);
}

async function getUserVacations(userId) {
    return supabaseQuery('org_vacations?user_id=eq.' + userId + '&order=created_at.desc');
}

async function updateVacationStatus(vacationId, status, approvedBy) {
    var data = { 
        status: status,
        updated_at: new Date().toISOString()
    };
    if (approvedBy) {
        data.approved_by = approvedBy;
    }
    return supabaseQuery('org_vacations?id=eq.' + vacationId, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteVacation(vacationId) {
    return supabaseQuery('org_vacations?id=eq.' + vacationId, {
        method: 'DELETE'
    });
}

// ===== СПОВІЩЕННЯ =====
async function createNotification(data) {
    return supabaseQuery('notifications', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            user_id: data.user_id,
            organization_id: data.organization_id,
            type: data.type,
            title: data.title,
            message: data.message,
            link: data.link || null,
            is_read: false,
            created_at: new Date().toISOString()
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getNotifications(userId, limit) {
    if (limit === undefined) limit = 20;
    return supabaseQuery('notifications?user_id=eq.' + userId + '&order=created_at.desc&limit=' + limit);
}

async function markNotificationRead(notificationId) {
    return supabaseQuery('notifications?id=eq.' + notificationId, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true })
    });
}

async function markAllNotificationsRead(userId) {
    return supabaseQuery('notifications?user_id=eq.' + userId, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true })
    });
}

// ===== КОРИСТУВАЧІ =====
async function updateUser(id, data) {
    return supabaseQuery('users?id=eq.' + id, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteUser(id) {
    return supabaseQuery('users?id=eq.' + id, {
        method: 'DELETE'
    });
}

// ===== ЕКСПОРТ =====
window.db = {
    supabaseQuery: supabaseQuery,
    createOrganization: createOrganization,
    getUserOrganizations: getUserOrganizations,
    getUserAllOrganizations: getUserAllOrganizations,
    getOrganization: getOrganization,
    updateOrganization: updateOrganization,
    deleteOrganization: deleteOrganization,
    getOrganizationByJoinCode: getOrganizationByJoinCode,
    createDefaultRanks: createDefaultRanks,
    getOrganizationRanks: getOrganizationRanks,
    createRank: createRank,
    updateRank: updateRank,
    deleteRank: deleteRank,
    addMemberToOrganization: addMemberToOrganization,
    getOrganizationMembers: getOrganizationMembers,
    updateMemberRank: updateMemberRank,
    removeMemberFromOrganization: removeMemberFromOrganization,
    createJoinRequest: createJoinRequest,
    getJoinRequests: getJoinRequests,
    updateJoinRequest: updateJoinRequest,
    createEmployee: createEmployee,
    getOrganizationEmployees: getOrganizationEmployees,
    updateEmployee: updateEmployee,
    deleteEmployee: deleteEmployee,
    createDepartment: createDepartment,
    getOrganizationDepartments: getOrganizationDepartments,
    updateDepartment: updateDepartment,
    deleteDepartment: deleteDepartment,
    assignEmployeeToDepartment: assignEmployeeToDepartment,
    getEmployeesByDepartment: getEmployeesByDepartment,
    removeEmployeeFromDepartment: removeEmployeeFromDepartment,
    sendChatMessage: sendChatMessage,
    getChatMessages: getChatMessages,
    deleteChatMessage: deleteChatMessage,
    createVacation: createVacation,
    getVacations: getVacations,
    getUserVacations: getUserVacations,
    updateVacationStatus: updateVacationStatus,
    deleteVacation: deleteVacation,
    createNotification: createNotification,
    getNotifications: getNotifications,
    markNotificationRead: markNotificationRead,
    markAllNotificationsRead: markAllNotificationsRead,
    updateUser: updateUser,
    deleteUser: deleteUser
};

console.log('✅ DB module loaded');
