// ============================================
// TYPEBIZ - РАБОТА С БАЗОЙ ДАННЫХ
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

function generateJoinCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
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

// ===== ОРГАНИЗАЦИИ =====
async function createOrganization(data) {
    const user = getCurrentUser();
    if (!user) throw new Error('Не авторизован');
    
    const orgs = await getUserOrganizations();
    const leaderOrgs = orgs.filter(o => o.leader_id === user.id);
    if (leaderOrgs.length >= 2) {
        throw new Error('Вы можете быть лидером максимум в 2 организациях');
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
        await createDefaultRank(orgId);
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

async function getOrganizationByJoinCode(code) {
    const result = await supabaseQuery(`organizations?join_code=eq.${code}`);
    return result[0] || null;
}

// ===== РАНГИ =====
async function createDefaultRank(orgId) {
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
                delete_org: true
            }
        })
    });
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

// ===== ЗАЯВКИ НА ВСТУПЛЕНИЕ =====
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

// ===== ОТДЕЛЫ =====
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

// ===== НАЗНАЧЕНИЕ В ОТДЕЛ =====
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

// ===== МОДУЛЬ: МАГАЗИН =====
async function createShopProduct(data) {
    return supabaseQuery('shop_products', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            ...data
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getShopProducts(orgId) {
    return supabaseQuery(`shop_products?organization_id=eq.${orgId}`);
}

// ===== МОДУЛЬ: БИБЛИОТЕКА =====
async function createLibraryBook(data) {
    return supabaseQuery('library_books', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            ...data
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getLibraryBooks(orgId) {
    return supabaseQuery(`library_books?organization_id=eq.${orgId}`);
}

// ===== МОДУЛЬ: РЕСТОРАН =====
async function createRestaurantItem(data) {
    return supabaseQuery('restaurant_menu', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            ...data
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getRestaurantMenu(orgId) {
    return supabaseQuery(`restaurant_menu?organization_id=eq.${orgId}`);
}

// ===== МОДУЛЬ: ШКОЛА =====
async function createSchoolClass(data) {
    return supabaseQuery('school_classes', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            ...data
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getSchoolClasses(orgId) {
    return supabaseQuery(`school_classes?organization_id=eq.${orgId}`);
}

// ===== МОДУЛЬ: КЛИНИКА =====
async function createClinicPatient(data) {
    return supabaseQuery('clinic_patients', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            ...data
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getClinicPatients(orgId) {
    return supabaseQuery(`clinic_patients?organization_id=eq.${orgId}`);
}

// ===== МОДУЛЬ: IT =====
async function createItProject(data) {
    return supabaseQuery('it_projects', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            ...data
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getItProjects(orgId) {
    return supabaseQuery(`it_projects?organization_id=eq.${orgId}`);
}

// ===== МОДУЛЬ: ОТЕЛЬ =====
async function createHotelRoom(data) {
    return supabaseQuery('hotel_rooms', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            ...data
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getHotelRooms(orgId) {
    return supabaseQuery(`hotel_rooms?organization_id=eq.${orgId}`);
}

// ===== ДОКУМЕНТЫ =====
async function createDocument(data) {
    return supabaseQuery('documents', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            ...data
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getOrganizationDocuments(orgId) {
    return supabaseQuery(`documents?organization_id=eq.${orgId}`);
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
    createDefaultRank,
    getOrganizationRanks,
    createRank,
    deleteRank,
    addMemberToOrganization,
    getOrganizationMembers,
    updateMemberRank,
    removeMemberFromOrganization,
    createJoinRequest,
    getJoinRequests,
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
    assignEmployeeToDepartment,
    getEmployeesByDepartment,
    removeEmployeeFromDepartment,
    createShopProduct,
    getShopProducts,
    createLibraryBook,
    getLibraryBooks,
    createRestaurantItem,
    getRestaurantMenu,
    createSchoolClass,
    getSchoolClasses,
    createClinicPatient,
    getClinicPatients,
    createItProject,
    getItProjects,
    createHotelRoom,
    getHotelRooms,
    createDocument,
    getOrganizationDocuments
};

console.log('✅ DB module loaded');
