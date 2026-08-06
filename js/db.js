// ============================================
// TYPEBIZ - РОБОТА З БАЗОЮ ДАНИХ (ПОВНА ВЕРСІЯ)
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
    var code = parts.join('-');
    console.log('🔑 Згенеровано код:', code);
    return code;
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

async function setUserRole(userId, role) {
    return supabaseQuery('users?id=eq.' + userId, {
        method: 'PATCH',
        body: JSON.stringify({ role: role })
    });
}

// ===== ОРГАНІЗАЦІЇ =====
async function createOrganization(data) {
    var user = getCurrentUser();
    if (!user) throw new Error('Не авторизовано');
    
    if (user.role !== 'admin') {
        var orgs = await getUserOrganizations();
        var leaderOrgs = orgs.filter(function(o) { return o.leader_id === user.id; });
        if (leaderOrgs.length >= 2) {
            throw new Error('Ви можете бути лідером максимум у 2 організаціях. Адміністратори можуть створювати безлімітно.');
        }
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
        var rankResult = await supabaseQuery('org_ranks', {
            method: 'POST',
            body: JSON.stringify({
                id: generateUUID(),
                organization_id: orgId,
                name: 'Директор',
                color: '#ef4444',
                is_default: true,
                order: 0,
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
        
        if (rankResult && rankResult.length > 0) {
            await addMemberToOrganization(orgId, user.id, rankResult[0].id);
        } else {
            await addMemberToOrganization(orgId, user.id, null);
        }
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
    var cleanCode = code.trim().toLowerCase();
    console.log('🔍 Пошук за кодом:', cleanCode);
    
    var result = await supabaseQuery('organizations?join_code=eq.' + cleanCode);
    
    if (result && result.length > 0) {
        console.log('✅ Організацію знайдено:', result[0].name);
        return result[0];
    }
    
    if (!cleanCode.includes('-')) {
        var allOrgs = await supabaseQuery('organizations?select=id,name,join_code');
        if (allOrgs) {
            for (var i = 0; i < allOrgs.length; i++) {
                var orgCode = allOrgs[i].join_code || '';
                var orgCodeClean = orgCode.replace(/-/g, '');
                if (orgCodeClean === cleanCode) {
                    console.log('✅ Організацію знайдено (без дефісів):', allOrgs[i].name);
                    return allOrgs[i];
                }
            }
        }
    }
    
    console.log('❌ Організацію не знайдено');
    return null;
}

// ===== РАНГИ =====
async function getOrganizationRanks(orgId) {
    return supabaseQuery('org_ranks?organization_id=eq.' + orgId + '&order=order.asc');
}

async function createRank(orgId, data) {
    var ranks = await getOrganizationRanks(orgId);
    var order = ranks ? ranks.length : 0;
    return supabaseQuery('org_ranks', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            organization_id: orgId,
            name: data.name,
            color: data.color,
            permissions: data.permissions || {},
            is_default: false,
            order: data.order !== undefined ? data.order : order
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
    var endpoint = 'join_requests?organization_id=eq.' + orgId;
    if (status) endpoint += '&status=eq.' + status;
    return supabaseQuery(endpoint);
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

// ===== ПОДІЇ =====
async function createEvent(data) {
    return supabaseQuery('org_events', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            organization_id: data.organization_id,
            title: data.title,
            description: data.description || '',
            start_date: data.start_date,
            end_date: data.end_date,
            location: data.location || '',
            created_by: data.created_by
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getEvents(organizationId) {
    return supabaseQuery('org_events?organization_id=eq.' + organizationId + '&order=start_date.asc');
}

async function deleteEvent(id) {
    return supabaseQuery('org_events?id=eq.' + id, {
        method: 'DELETE'
    });
}

// ===== ФАЙЛИ =====
async function createFile(data) {
    return supabaseQuery('org_files', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            organization_id: data.organization_id,
            name: data.name,
            url: data.url,
            size: data.size || 0,
            mime_type: data.mime_type || '',
            uploaded_by: data.uploaded_by
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getFiles(organizationId) {
    return supabaseQuery('org_files?organization_id=eq.' + organizationId + '&order=created_at.desc');
}

async function deleteFile(id) {
    return supabaseQuery('org_files?id=eq.' + id, {
        method: 'DELETE'
    });
}

// ===== ЗАВДАННЯ =====
async function createTask(data) {
    return supabaseQuery('org_tasks', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            organization_id: data.organization_id,
            title: data.title,
            description: data.description || '',
            assigned_to: data.assigned_to || null,
            created_by: data.created_by,
            due_date: data.due_date || null,
            status: data.status || 'new',
            priority: data.priority || 'medium'
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getTasks(organizationId) {
    return supabaseQuery('org_tasks?organization_id=eq.' + organizationId + '&order=created_at.desc');
}

async function updateTask(id, data) {
    return supabaseQuery('org_tasks?id=eq.' + id, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteTask(id) {
    return supabaseQuery('org_tasks?id=eq.' + id, {
        method: 'DELETE'
    });
}

// ===== ОПИТУВАННЯ =====
async function createPoll(data) {
    return supabaseQuery('org_polls', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            organization_id: data.organization_id,
            title: data.title,
            description: data.description || '',
            options: data.options,
            created_by: data.created_by,
            is_active: true,
            expires_at: data.expires_at || null
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getPolls(organizationId) {
    return supabaseQuery('org_polls?organization_id=eq.' + organizationId + '&order=created_at.desc');
}

async function votePoll(pollId, userId, optionIndex) {
    return supabaseQuery('org_poll_votes', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            poll_id: pollId,
            user_id: userId,
            option_index: optionIndex
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getPollResults(pollId) {
    return supabaseQuery('org_poll_votes?poll_id=eq.' + pollId);
}

async function deletePoll(id) {
    return supabaseQuery('org_polls?id=eq.' + id, {
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

// ============================================
// МОДУЛЬ: КЛІНІКА
// ============================================
async function getClinicPatients(orgId) {
    return supabaseQuery('clinic_patients?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createClinicPatient(data) {
    return supabaseQuery('clinic_patients', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getClinicAppointments(orgId) {
    return supabaseQuery('clinic_appointments?organization_id=eq.' + orgId + '&order=appointment_date.desc');
}

async function createClinicAppointment(data) {
    return supabaseQuery('clinic_appointments', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

// ============================================
// МОДУЛЬ: МАГАЗИН
// ============================================
async function getShopProducts(orgId) {
    return supabaseQuery('shop_products?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createShopProduct(data) {
    return supabaseQuery('shop_products', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getShopSales(orgId) {
    return supabaseQuery('shop_sales?organization_id=eq.' + orgId + '&order=sale_date.desc');
}

async function createShopSale(data) {
    return supabaseQuery('shop_sales', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

// ============================================
// МОДУЛЬ: БІБЛІОТЕКА
// ============================================
async function getLibraryBooks(orgId) {
    return supabaseQuery('library_books?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createLibraryBook(data) {
    return supabaseQuery('library_books', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getLibraryLoans(orgId) {
    return supabaseQuery('library_loans?organization_id=eq.' + orgId + '&order=loan_date.desc');
}

async function createLibraryLoan(data) {
    return supabaseQuery('library_loans', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getLibraryReaders(orgId) {
    return supabaseQuery('library_readers?organization_id=eq.' + orgId + '&order=joined_at.desc');
}

async function createLibraryReader(data) {
    return supabaseQuery('library_readers', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

// ============================================
// МОДУЛЬ: ШКОЛА
// ============================================
async function getSchoolStudents(orgId) {
    return supabaseQuery('school_students?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createSchoolStudent(data) {
    return supabaseQuery('school_students', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            organization_id: data.organization_id,
            full_name: data.full_name,
            class_id: data.class_id || null,
            birth_date: data.birth_date || null,
            parent_phone: data.parent_phone || null,
            parent_email: data.parent_email || null,
            address: data.address || null,
            created_at: new Date().toISOString()
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getSchoolClasses(orgId) {
    return supabaseQuery('school_classes?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createSchoolClass(data) {
    return supabaseQuery('school_classes', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            organization_id: data.organization_id,
            name: data.name,
            teacher_id: data.teacher_id || null,
            teacher_name: data.teacher_name || null,
            room: data.room || null,
            created_at: new Date().toISOString()
        }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function createSchoolGrade(data) {
    return supabaseQuery('school_grades', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

// ============================================
// МОДУЛЬ: РЕСТОРАН / КАФЕ
// ============================================
async function getRestaurantMenu(orgId) {
    return supabaseQuery('restaurant_menu?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createRestaurantMenuItem(data) {
    return supabaseQuery('restaurant_menu', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getRestaurantOrders(orgId) {
    return supabaseQuery('restaurant_orders?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createRestaurantOrder(data) {
    return supabaseQuery('restaurant_orders', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

// ===== РЕСТОРАН - БРОНЮВАННЯ (ДОДАНО) =====
async function getRestaurantBookings(orgId) {
    return supabaseQuery('restaurant_bookings?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createRestaurantBooking(data) {
    return supabaseQuery('restaurant_bookings', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

// ============================================
// МОДУЛЬ: ГОТЕЛЬ
// ============================================
async function getHotelRooms(orgId) {
    return supabaseQuery('hotel_rooms?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createHotelRoom(data) {
    return supabaseQuery('hotel_rooms', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getHotelBookings(orgId) {
    return supabaseQuery('hotel_bookings?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createHotelBooking(data) {
    return supabaseQuery('hotel_bookings', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

// ============================================
// МОДУЛЬ: СПОРТЗАЛ
// ============================================
async function getGymMemberships(orgId) {
    return supabaseQuery('gym_memberships?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createGymMembership(data) {
    return supabaseQuery('gym_memberships', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getGymTrainings(orgId) {
    return supabaseQuery('gym_trainings?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createGymTraining(data) {
    return supabaseQuery('gym_trainings', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

// ============================================
// МОДУЛЬ: САЛОН КРАСИ
// ============================================
async function getBeautyServices(orgId) {
    return supabaseQuery('beauty_services?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createBeautyService(data) {
    return supabaseQuery('beauty_services', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getBeautyAppointments(orgId) {
    return supabaseQuery('beauty_appointments?organization_id=eq.' + orgId + '&order=appointment_date.desc');
}

async function createBeautyAppointment(data) {
    return supabaseQuery('beauty_appointments', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

// ============================================
// МОДУЛЬ: АВТОСЕРВІС
// ============================================
async function getAutoOrders(orgId) {
    return supabaseQuery('auto_orders?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createAutoOrder(data) {
    return supabaseQuery('auto_orders', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getAutoParts(orgId) {
    return supabaseQuery('auto_parts?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createAutoPart(data) {
    return supabaseQuery('auto_parts', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

// ============================================
// МОДУЛЬ: НЕРУХОМІСТЬ
// ============================================
async function getRealtyProperties(orgId) {
    return supabaseQuery('realty_properties?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createRealtyProperty(data) {
    return supabaseQuery('realty_properties', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getRealtyDeals(orgId) {
    return supabaseQuery('realty_deals?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createRealtyDeal(data) {
    return supabaseQuery('realty_deals', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

// ============================================
// МОДУЛЬ: ЛОГІСТИКА
// ============================================
async function getLogisticsOrders(orgId) {
    return supabaseQuery('logistics_orders?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createLogisticsOrder(data) {
    return supabaseQuery('logistics_orders', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

// ============================================
// МОДУЛЬ: ДОСТАВКА
// ============================================
async function getDeliveryOrders(orgId) {
    return supabaseQuery('delivery_orders?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createDeliveryOrder(data) {
    return supabaseQuery('delivery_orders', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

// ============================================
// МОДУЛЬ: IT / GAMEDEV
// ============================================
async function getItProjects(orgId) {
    return supabaseQuery('it_projects?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createItProject(data) {
    return supabaseQuery('it_projects', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

async function getItBugs(orgId) {
    return supabaseQuery('it_bugs?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createItBug(data) {
    return supabaseQuery('it_bugs', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
}

// ============================================
// ЕКСПОРТ ВСІХ ФУНКЦІЙ
// ============================================
window.db = {
    supabaseQuery: supabaseQuery,
    createOrganization: createOrganization,
    getUserOrganizations: getUserOrganizations,
    getUserAllOrganizations: getUserAllOrganizations,
    getOrganization: getOrganization,
    updateOrganization: updateOrganization,
    deleteOrganization: deleteOrganization,
    getOrganizationByJoinCode: getOrganizationByJoinCode,
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
    createEvent: createEvent,
    getEvents: getEvents,
    deleteEvent: deleteEvent,
    createFile: createFile,
    getFiles: getFiles,
    deleteFile: deleteFile,
    createTask: createTask,
    getTasks: getTasks,
    updateTask: updateTask,
    deleteTask: deleteTask,
    createPoll: createPoll,
    getPolls: getPolls,
    votePoll: votePoll,
    getPollResults: getPollResults,
    deletePoll: deletePoll,
    createNotification: createNotification,
    getNotifications: getNotifications,
    markNotificationRead: markNotificationRead,
    updateUser: updateUser,
    deleteUser: deleteUser,
    setUserRole: setUserRole,
    // КЛІНІКА
    getClinicPatients: getClinicPatients,
    createClinicPatient: createClinicPatient,
    getClinicAppointments: getClinicAppointments,
    createClinicAppointment: createClinicAppointment,
    // МАГАЗИН
    getShopProducts: getShopProducts,
    createShopProduct: createShopProduct,
    getShopSales: getShopSales,
    createShopSale: createShopSale,
    // БІБЛІОТЕКА
    getLibraryBooks: getLibraryBooks,
    createLibraryBook: createLibraryBook,
    getLibraryLoans: getLibraryLoans,
    createLibraryLoan: createLibraryLoan,
    getLibraryReaders: getLibraryReaders,
    createLibraryReader: createLibraryReader,
    // ШКОЛА
    getSchoolStudents: getSchoolStudents,
    createSchoolStudent: createSchoolStudent,
    getSchoolClasses: getSchoolClasses,
    createSchoolClass: createSchoolClass,
    createSchoolGrade: createSchoolGrade,
    // РЕСТОРАН
    getRestaurantMenu: getRestaurantMenu,
    createRestaurantMenuItem: createRestaurantMenuItem,
    getRestaurantOrders: getRestaurantOrders,
    createRestaurantOrder: createRestaurantOrder,
    getRestaurantBookings: getRestaurantBookings,
    createRestaurantBooking: createRestaurantBooking,
    // ГОТЕЛЬ
    getHotelRooms: getHotelRooms,
    createHotelRoom: createHotelRoom,
    getHotelBookings: getHotelBookings,
    createHotelBooking: createHotelBooking,
    // СПОРТЗАЛ
    getGymMemberships: getGymMemberships,
    createGymMembership: createGymMembership,
    getGymTrainings: getGymTrainings,
    createGymTraining: createGymTraining,
    // САЛОН КРАСИ
    getBeautyServices: getBeautyServices,
    createBeautyService: createBeautyService,
    getBeautyAppointments: getBeautyAppointments,
    createBeautyAppointment: createBeautyAppointment,
    // АВТОСЕРВІС
    getAutoOrders: getAutoOrders,
    createAutoOrder: createAutoOrder,
    getAutoParts: getAutoParts,
    createAutoPart: createAutoPart,
    // НЕРУХОМІСТЬ
    getRealtyProperties: getRealtyProperties,
    createRealtyProperty: createRealtyProperty,
    getRealtyDeals: getRealtyDeals,
    createRealtyDeal: createRealtyDeal,
    // ЛОГІСТИКА
    getLogisticsOrders: getLogisticsOrders,
    createLogisticsOrder: createLogisticsOrder,
    // ДОСТАВКА
    getDeliveryOrders: getDeliveryOrders,
    createDeliveryOrder: createDeliveryOrder,
    // IT
    getItProjects: getItProjects,
    createItProject: createItProject,
    getItBugs: getItBugs,
    createItBug: createItBug
};
