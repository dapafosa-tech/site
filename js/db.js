// ============================================
// TYPEBIZ - DATABASE LAYER (ПОВНА ВЕРСІЯ)
// ============================================

if (typeof SUPABASE_URL === 'undefined') {
    var SUPABASE_URL = 'https://iazzgxacdwhaxujoxtaz.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhenpneGFjZHdoYXh1am94dGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTY3MDIsImV4cCI6MjEwMTM3MjcwMn0.quXjQ6575ACSjxnfa-hKkD6u3KMYE_5ZLdtqS4JKXI0';
}

if (typeof window.sb === 'undefined') {
    window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });
}

async function getAccessToken() {
    try {
        var { data } = await window.sb.auth.getSession();
        return (data && data.session) ? data.session.access_token : null;
    } catch (e) {
        return null;
    }
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

var _clientIpCache = null;

async function getClientIp() {
    if (_clientIpCache) return _clientIpCache;
    try {
        var res = await fetch('https://api.ipify.org?format=json');
        if (!res.ok) return null;
        var data = await res.json();
        _clientIpCache = data && data.ip ? data.ip : null;
        return _clientIpCache;
    } catch (e) {
        return null;
    }
}

async function trackVisitIp(profile) {
    if (!profile || !profile.id) return;
    try {
        if (sessionStorage.getItem('ipTrackedFor') === profile.id && profile.reg_ip) return;
    } catch (e) {}
    try {
        var ip = await getClientIp();
        if (!ip) return;
        try { sessionStorage.setItem('ipTrackedFor', profile.id); } catch (e) {}
        var patch = {};
        if (profile.last_ip !== ip) patch.last_ip = ip;
        if (!profile.reg_ip) patch.reg_ip = ip;
        if (Object.keys(patch).length === 0) return;
        await supabaseQuery('users?id=eq.' + profile.id, {
            method: 'PATCH',
            body: JSON.stringify(patch)
        });
        if (patch.last_ip) profile.last_ip = patch.last_ip;
        if (patch.reg_ip) profile.reg_ip = patch.reg_ip;
    } catch (e) {
        console.warn('trackVisitIp error:', e);
    }
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
    var token = await getAccessToken();
    var headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + (token || SUPABASE_ANON_KEY),
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
        if (response.status === 204) return [];
        if (!response.ok) {
            var errorText = await response.text();
            throw new Error('HTTP ' + response.status + ': ' + errorText);
        }
        var text = await response.text();
        if (!text || text.trim() === '') return [];
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

var _systemSettingsCache = null;

async function getSystemSettings() {
    if (_systemSettingsCache) return _systemSettingsCache;
    try {
        var rows = await supabaseQuery('system_settings?select=*');
        var map = {};
        if (rows) {
            for (var i = 0; i < rows.length; i++) {
                map[rows[i].key] = rows[i].value;
            }
        }
        _systemSettingsCache = map;
        return map;
    } catch (e) {
        return {};
    }
}

function clearSystemSettingsCache() {
    _systemSettingsCache = null;
}

var _bannedWordsCache = null;

async function getBannedWords() {
    if (_bannedWordsCache) return _bannedWordsCache;
    try {
        var rows = await supabaseQuery('banned_words?select=word');
        _bannedWordsCache = (rows || []).map(function(r) { return (r.word || '').toLowerCase().trim(); }).filter(function(w) { return w.length > 0; });
        return _bannedWordsCache;
    } catch (e) {
        return [];
    }
}

function clearBannedWordsCache() {
    _bannedWordsCache = null;
}

async function findBannedWord(text) {
    var words = await getBannedWords();
    if (!words.length || !text) return null;
    var lower = text.toLowerCase();
    for (var i = 0; i < words.length; i++) {
        if (words[i] && lower.indexOf(words[i]) !== -1) {
            return words[i];
        }
    }
    return null;
}

async function getActiveAnnouncements() {
    try {
        var rows = await supabaseQuery('announcements?is_active=eq.true&order=created_at.desc');
        return rows || [];
    } catch (e) {
        return [];
    }
}

async function getUserName(userId) {
    try {
        var result = await supabaseQuery('users?id=eq.' + userId + '&select=full_name,email');
        if (result && result.length > 0) {
            return result[0].full_name || result[0].email || 'Невідомо';
        }
        return 'Система';
    } catch {
        return 'Система';
    }
}

async function addLog(action, entityType, entityId, details) {
    try {
        var user = getCurrentUser();
        if (!user) return null;
        var userName = user.full_name || user.email || 'Користувач';
        return await supabaseQuery('activity_logs', {
            method: 'POST',
            body: JSON.stringify({
                id: generateUUID(),
                user_id: user.id,
                user_name: userName,
                action: action,
                entity_type: entityType,
                entity_id: entityId || null,
                details: details || {},
                created_at: new Date().toISOString()
            })
        });
    } catch (e) {
        return null;
    }
}

async function updateUser(id, data) {
    var result = await supabaseQuery('users?id=eq.' + id, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
    await addLog('Оновлено користувача', 'user', id, data);
    return result;
}

async function deleteUser(id) {
    var result = await supabaseQuery('users?id=eq.' + id, {
        method: 'DELETE'
    });
    await addLog('Видалено користувача', 'user', id, { deleted: true });
    return result;
}

async function setUserRole(userId, role) {
    var validRoles = ['user', 'moderator', 'admin', 'owner'];
    if (validRoles.indexOf(role) === -1) {
        throw new Error('Невірна роль. Доступні: user, moderator, admin, owner');
    }
    var result = await supabaseQuery('users?id=eq.' + userId, {
        method: 'PATCH',
        body: JSON.stringify({ role: role })
    });
    await addLog('Змінено роль користувача', 'user', userId, { new_role: role });
    return result;
}

async function getUserRole(userId) {
    try {
        var result = await supabaseQuery('users?id=eq.' + userId + '&select=role');
        if (result && result.length > 0) {
            return result[0].role || 'user';
        }
        return 'user';
    } catch {
        return 'user';
    }
}

async function isUserBanned(userId) {
    try {
        var result = await supabaseQuery('users?id=eq.' + userId + '&select=is_banned');
        if (result && result.length > 0) {
            return result[0].is_banned === true;
        }
        return false;
    } catch {
        return false;
    }
}

async function getUsersWithRoles() {
    return supabaseQuery('users?select=id,full_name,email,role,is_banned,ban_reason');
}

async function getAppeals(filters) {
    if (filters === undefined) filters = {};
    var query = 'appeals?order=created_at.desc';
    if (filters.userId) query += '&user_id=eq.' + filters.userId;
    if (filters.status) query += '&status=eq.' + filters.status;
    if (filters.appealId) query += '&id=eq.' + filters.appealId;
    return supabaseQuery(query);
}

async function getAppealMessages(appealId) {
    return supabaseQuery('appeal_messages?appeal_id=eq.' + appealId + '&order=created_at.asc');
}

async function updateAppealStatus(appealId, status) {
    var result = await supabaseQuery('appeals?id=eq.' + appealId, {
        method: 'PATCH',
        body: JSON.stringify({ status: status, updated_at: new Date().toISOString() })
    });
    await addLog('Змінено статус апеляції', 'appeal', appealId, { status: status });
    return result;
}

async function sendAppealMessage(data) {
    return supabaseQuery('appeal_messages', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function createSupportTicket(data) {
    return supabaseQuery('support_tickets', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function getSupportTickets(filters) {
    if (filters === undefined) filters = {};
    var query = 'support_tickets?order=created_at.desc';
    if (filters.userId) query += '&user_id=eq.' + filters.userId;
    if (filters.status) query += '&status=eq.' + filters.status;
    return supabaseQuery(query);
}

async function getSupportTicket(ticketId) {
    var result = await supabaseQuery('support_tickets?id=eq.' + ticketId);
    return result && result.length > 0 ? result[0] : null;
}

async function updateSupportTicket(ticketId, data) {
    return supabaseQuery('support_tickets?id=eq.' + ticketId, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function getSupportMessages(ticketId) {
    return supabaseQuery('support_messages?ticket_id=eq.' + ticketId + '&order=created_at.asc');
}

async function sendSupportMessage(data) {
    return supabaseQuery('support_messages', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function createOrganization(data) {
    var user = getCurrentUser();
    if (!user) throw new Error('Не авторизовано');
    if (await isUserBanned(user.id)) throw new Error('Ваш акаунт заблоковано');
    if (user.role !== 'admin' && user.role !== 'owner') {
        var sysSettings = await getSystemSettings();
        var maxOrgs = parseInt(sysSettings['max_organizations'], 10);
        if (!maxOrgs || isNaN(maxOrgs) || maxOrgs < 1) maxOrgs = 1;
        var ledOrgs = await getUserLedOrganizations();
        if (ledOrgs && ledOrgs.length >= maxOrgs) {
            throw new Error('Ви досягли ліміту організацій, де можете бути лідером (' + maxOrgs + '). Адміністратори та засновники можуть створювати безлімітно.');
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
        headers: { 'Prefer': 'return=representation' }
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
            await addMemberToOrganization(orgId, user.id, rankResult[0].id, true);
        } else {
            await addMemberToOrganization(orgId, user.id, null, true);
        }
        await addLog('Створено організацію', 'organization', orgId, {
            name: data.name,
            type: data.type,
            user_name: user.full_name || user.email
        });
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

async function getUserLedOrganizations() {
    var user = getCurrentUser();
    if (!user) throw new Error('Не авторизовано');
    try {
        var orgs = await supabaseQuery('organizations?leader_id=eq.' + user.id);
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
    var result = await supabaseQuery('organizations?id=eq.' + id, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
    await addLog('Оновлено організацію', 'organization', id, data);
    return result;
}

async function deleteOrganization(id) {
    var result = await supabaseQuery('organizations?id=eq.' + id, {
        method: 'DELETE'
    });
    await addLog('Видалено організацію', 'organization', id, { deleted: true });
    return result;
}

async function getOrganizationByJoinCode(code) {
    var cleanCode = code.trim().toLowerCase();
    var result = await supabaseQuery('organizations?join_code=eq.' + cleanCode);
    if (result && result.length > 0) return result[0];
    if (!cleanCode.includes('-')) {
        var allOrgs = await supabaseQuery('organizations?select=id,name,join_code');
        if (allOrgs) {
            for (var i = 0; i < allOrgs.length; i++) {
                var orgCode = allOrgs[i].join_code || '';
                var orgCodeClean = orgCode.replace(/-/g, '');
                if (orgCodeClean === cleanCode) {
                    return allOrgs[i];
                }
            }
        }
    }
    return null;
}

async function getOrganizationRanks(orgId) {
    return supabaseQuery('org_ranks?organization_id=eq.' + orgId + '&order=order.asc');
}

async function createRank(orgId, data) {
    var ranks = await getOrganizationRanks(orgId);
    var order = ranks ? ranks.length : 0;
    var result = await supabaseQuery('org_ranks', {
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
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Створено посаду', 'rank', orgId, { name: data.name });
    return result;
}

async function updateRank(id, data) {
    var result = await supabaseQuery('org_ranks?id=eq.' + id, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
    await addLog('Оновлено посаду', 'rank', id, data);
    return result;
}

async function deleteRank(id) {
    var result = await supabaseQuery('org_ranks?id=eq.' + id, {
        method: 'DELETE'
    });
    await addLog('Видалено посаду', 'rank', id, { deleted: true });
    return result;
}

async function addMemberToOrganization(orgId, userId, rankId, skipLimitCheck) {
    if (rankId === undefined) rankId = null;
    if (await isUserBanned(userId)) throw new Error('Користувача заблоковано');
    if (!skipLimitCheck) {
        var sysSettings = await getSystemSettings();
        var maxMembers = parseInt(sysSettings['max_members'], 10);
        if (maxMembers && !isNaN(maxMembers) && maxMembers > 0) {
            var existingMembers = await getOrganizationMembers(orgId);
            if (existingMembers && existingMembers.length >= maxMembers) {
                throw new Error('Досягнуто максимальної кількості учасників організації (' + maxMembers + ').');
            }
        }
    }
    var result = await supabaseQuery('org_members', {
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
    await addLog('Додано учасника до організації', 'member', orgId, { user_id: userId });
    return result;
}

async function getOrganizationMembers(orgId) {
    return supabaseQuery('org_members?organization_id=eq.' + orgId);
}

async function updateMemberRank(memberId, rankId) {
    var result = await supabaseQuery('org_members?id=eq.' + memberId, {
        method: 'PATCH',
        body: JSON.stringify({ rank_id: rankId })
    });
    await addLog('Оновлено посаду учасника', 'member', memberId, { rank_id: rankId });
    return result;
}

async function removeMemberFromOrganization(memberId) {
    var result = await supabaseQuery('org_members?id=eq.' + memberId, {
        method: 'DELETE'
    });
    await addLog('Видалено учасника з організації', 'member', memberId, { deleted: true });
    return result;
}

async function createJoinRequest(orgId, userId, message) {
    if (message === undefined) message = '';
    if (await isUserBanned(userId)) throw new Error('Ваш акаунт заблоковано');
    var result = await supabaseQuery('join_requests', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            organization_id: orgId,
            user_id: userId,
            status: 'pending',
            message: message,
            created_at: new Date().toISOString()
        }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Створено заявку на вступ', 'join_request', orgId, { user_id: userId });
    return result;
}

async function getJoinRequests(orgId, status) {
    var endpoint = 'join_requests?organization_id=eq.' + orgId;
    if (status) endpoint += '&status=eq.' + status;
    return supabaseQuery(endpoint);
}

async function updateJoinRequest(requestId, status) {
    var result = await supabaseQuery('join_requests?id=eq.' + requestId, {
        method: 'PATCH',
        body: JSON.stringify({
            status: status,
            updated_at: new Date().toISOString()
        })
    });
    await addLog('Оновлено заявку на вступ', 'join_request', requestId, { status: status });
    return result;
}

async function createEmployee(data) {
    var result = await supabaseQuery('employees', {
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
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Створено співробітника', 'employee', data.organization_id, data);
    return result;
}

async function getOrganizationEmployees(orgId) {
    return supabaseQuery('employees?organization_id=eq.' + orgId);
}

async function updateEmployee(id, data) {
    var result = await supabaseQuery('employees?id=eq.' + id, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
    await addLog('Оновлено співробітника', 'employee', id, data);
    return result;
}

async function deleteEmployee(id) {
    var result = await supabaseQuery('employees?id=eq.' + id, {
        method: 'DELETE'
    });
    await addLog('Видалено співробітника', 'employee', id, { deleted: true });
    return result;
}

async function createDepartment(data) {
    var result = await supabaseQuery('departments', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            organization_id: data.organization_id,
            name: data.name,
            description: data.description || ''
        }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Створено відділ', 'department', data.organization_id, { name: data.name });
    return result;
}

async function getOrganizationDepartments(orgId) {
    return supabaseQuery('departments?organization_id=eq.' + orgId);
}

async function updateDepartment(id, data) {
    var result = await supabaseQuery('departments?id=eq.' + id, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
    await addLog('Оновлено відділ', 'department', id, data);
    return result;
}

async function deleteDepartment(id) {
    var result = await supabaseQuery('departments?id=eq.' + id, {
        method: 'DELETE'
    });
    await addLog('Видалено відділ', 'department', id, { deleted: true });
    return result;
}

async function assignEmployeeToDepartment(employeeId, departmentId) {
    var result = await supabaseQuery('employees?id=eq.' + employeeId, {
        method: 'PATCH',
        body: JSON.stringify({ department_id: departmentId })
    });
    await addLog('Призначено співробітника у відділ', 'employee', employeeId, { department_id: departmentId });
    return result;
}

async function getEmployeesByDepartment(departmentId) {
    return supabaseQuery('employees?department_id=eq.' + departmentId);
}

async function removeEmployeeFromDepartment(employeeId) {
    var result = await supabaseQuery('employees?id=eq.' + employeeId, {
        method: 'PATCH',
        body: JSON.stringify({ department_id: null })
    });
    await addLog('Видалено співробітника з відділу', 'employee', employeeId, { department_id: null });
    return result;
}

async function sendChatMessage(organizationId, userId, message, mentions) {
    if (mentions === undefined) mentions = [];
    var result = await supabaseQuery('org_chat_messages', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            organization_id: organizationId,
            user_id: userId,
            message: message,
            mentions: mentions,
            is_deleted: false,
            created_at: new Date().toISOString()
        }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Відправлено повідомлення в чат', 'chat_message', organizationId, { user_id: userId });
    return result;
}

async function getChatMessages(organizationId, limit) {
    if (limit === undefined) limit = 50;
    return supabaseQuery('org_chat_messages?organization_id=eq.' + organizationId + '&is_deleted=eq.false&order=created_at.desc&limit=' + limit);
}

async function deleteChatMessage(messageId, deletedByUserId) {
    var result = await supabaseQuery('org_chat_messages?id=eq.' + messageId, {
        method: 'PATCH',
        body: JSON.stringify({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: deletedByUserId || null
        })
    });
    await addLog('Видалено повідомлення в чаті', 'chat_message', messageId, { deleted: true, deleted_by: deletedByUserId || null });
    return result;
}

async function createVacation(data) {
    var result = await supabaseQuery('org_vacations', {
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
    await addLog('Створено заявку на відпустку', 'vacation', data.organization_id, { user_id: data.user_id });
    return result;
}

async function getVacations(organizationId, status) {
    var query = 'org_vacations?organization_id=eq.' + organizationId;
    if (status) query += '&status=eq.' + status;
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
    if (approvedBy) data.approved_by = approvedBy;
    var result = await supabaseQuery('org_vacations?id=eq.' + vacationId, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
    await addLog('Оновлено статус відпустки', 'vacation', vacationId, { status: status });
    return result;
}

async function deleteVacation(vacationId) {
    var result = await supabaseQuery('org_vacations?id=eq.' + vacationId, {
        method: 'DELETE'
    });
    await addLog('Видалено заявку на відпустку', 'vacation', vacationId, { deleted: true });
    return result;
}

async function createEvent(data) {
    var result = await supabaseQuery('org_events', {
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
    await addLog('Створено подію', 'event', data.organization_id, { title: data.title });
    return result;
}

async function getEvents(organizationId) {
    return supabaseQuery('org_events?organization_id=eq.' + organizationId + '&order=start_date.asc');
}

async function deleteEvent(id) {
    var result = await supabaseQuery('org_events?id=eq.' + id, {
        method: 'DELETE'
    });
    await addLog('Видалено подію', 'event', id, { deleted: true });
    return result;
}

async function createTask(data) {
    var result = await supabaseQuery('org_tasks', {
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
    await addLog('Створено завдання', 'task', data.organization_id, { title: data.title });
    return result;
}

async function getTasks(organizationId) {
    return supabaseQuery('org_tasks?organization_id=eq.' + organizationId + '&order=created_at.desc');
}

async function updateTask(id, data) {
    var result = await supabaseQuery('org_tasks?id=eq.' + id, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
    await addLog('Оновлено завдання', 'task', id, data);
    return result;
}

async function deleteTask(id) {
    var result = await supabaseQuery('org_tasks?id=eq.' + id, {
        method: 'DELETE'
    });
    await addLog('Видалено завдання', 'task', id, { deleted: true });
    return result;
}

async function createPoll(data) {
    var result = await supabaseQuery('org_polls', {
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
    await addLog('Створено опитування', 'poll', data.organization_id, { title: data.title });
    return result;
}

async function getPolls(organizationId) {
    return supabaseQuery('org_polls?organization_id=eq.' + organizationId + '&order=created_at.desc');
}

async function votePoll(pollId, userId, optionIndex) {
    var result = await supabaseQuery('org_poll_votes', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            poll_id: pollId,
            user_id: userId,
            option_index: optionIndex
        }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Віддано голос в опитуванні', 'poll_vote', pollId, { user_id: userId });
    return result;
}

async function getPollResults(pollId) {
    return supabaseQuery('org_poll_votes?poll_id=eq.' + pollId);
}

async function deletePoll(id) {
    var result = await supabaseQuery('org_polls?id=eq.' + id, {
        method: 'DELETE'
    });
    await addLog('Видалено опитування', 'poll', id, { deleted: true });
    return result;
}

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

async function getClinicPatients(orgId) {
    return supabaseQuery('clinic_patients?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createClinicPatient(data) {
    var result = await supabaseQuery('clinic_patients', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Додано пацієнта клініки', 'clinic_patient', data.organization_id, { name: data.full_name });
    return result;
}

async function getClinicAppointments(orgId) {
    return supabaseQuery('clinic_appointments?organization_id=eq.' + orgId + '&order=appointment_date.desc');
}

async function createClinicAppointment(data) {
    var result = await supabaseQuery('clinic_appointments', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Створено запис клініки', 'clinic_appointment', data.organization_id, { patient_id: data.patient_id });
    return result;
}

async function getShopProducts(orgId) {
    return supabaseQuery('shop_products?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createShopProduct(data) {
    var result = await supabaseQuery('shop_products', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Додано товар в магазин', 'shop_product', data.organization_id, { name: data.name });
    return result;
}

async function getShopSales(orgId) {
    return supabaseQuery('shop_sales?organization_id=eq.' + orgId + '&order=sale_date.desc');
}

async function createShopSale(data) {
    var result = await supabaseQuery('shop_sales', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Оформлено продаж', 'shop_sale', data.organization_id, { product_id: data.product_id });
    return result;
}

async function getLibraryBooks(orgId) {
    return supabaseQuery('library_books?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createLibraryBook(data) {
    var result = await supabaseQuery('library_books', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Додано книгу в бібліотеку', 'library_book', data.organization_id, { title: data.title });
    return result;
}

async function getLibraryLoans(orgId) {
    return supabaseQuery('library_loans?organization_id=eq.' + orgId + '&order=loan_date.desc');
}

async function createLibraryLoan(data) {
    var result = await supabaseQuery('library_loans', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Видано книгу', 'library_loan', data.organization_id, { book_id: data.book_id });
    return result;
}

async function getLibraryReaders(orgId) {
    return supabaseQuery('library_readers?organization_id=eq.' + orgId + '&order=joined_at.desc');
}

async function createLibraryReader(data) {
    var result = await supabaseQuery('library_readers', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Додано читача бібліотеки', 'library_reader', data.organization_id, { name: data.full_name });
    return result;
}

async function getSchoolStudents(orgId) {
    return supabaseQuery('school_students?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createSchoolStudent(data) {
    var result = await supabaseQuery('school_students', {
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
    await addLog('Додано учня', 'school_student', data.organization_id, { name: data.full_name });
    return result;
}

async function getSchoolClasses(orgId) {
    return supabaseQuery('school_classes?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createSchoolClass(data) {
    var result = await supabaseQuery('school_classes', {
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
    await addLog('Створено клас', 'school_class', data.organization_id, { name: data.name });
    return result;
}

async function createSchoolGrade(data) {
    var result = await supabaseQuery('school_grades', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Додано оцінку', 'school_grade', data.organization_id, { student_id: data.student_id });
    return result;
}

async function getRestaurantMenu(orgId) {
    return supabaseQuery('restaurant_menu?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createRestaurantMenuItem(data) {
    var result = await supabaseQuery('restaurant_menu', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Додано страву в меню', 'restaurant_menu', data.organization_id, { name: data.name });
    return result;
}

async function getRestaurantOrders(orgId) {
    return supabaseQuery('restaurant_orders?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createRestaurantOrder(data) {
    var result = await supabaseQuery('restaurant_orders', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Створено замовлення в ресторані', 'restaurant_order', data.organization_id, { table: data.table_number });
    return result;
}

async function getRestaurantBookings(orgId) {
    return supabaseQuery('restaurant_bookings?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createRestaurantBooking(data) {
    var result = await supabaseQuery('restaurant_bookings', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Створено бронювання в ресторані', 'restaurant_booking', data.organization_id, { table: data.table_number });
    return result;
}

async function getHotelRooms(orgId) {
    return supabaseQuery('hotel_rooms?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createHotelRoom(data) {
    var result = await supabaseQuery('hotel_rooms', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Додано номер в готелі', 'hotel_room', data.organization_id, { number: data.number });
    return result;
}

async function getHotelBookings(orgId) {
    return supabaseQuery('hotel_bookings?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createHotelBooking(data) {
    var result = await supabaseQuery('hotel_bookings', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Створено бронювання в готелі', 'hotel_booking', data.organization_id, { room: data.room_number });
    return result;
}

async function getGymMemberships(orgId) {
    return supabaseQuery('gym_memberships?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createGymMembership(data) {
    var result = await supabaseQuery('gym_memberships', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Додано абонемент у спортзал', 'gym_membership', data.organization_id, { user: data.user_name });
    return result;
}

async function getGymTrainings(orgId) {
    return supabaseQuery('gym_trainings?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createGymTraining(data) {
    var result = await supabaseQuery('gym_trainings', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Додано тренування', 'gym_training', data.organization_id, { name: data.name });
    return result;
}

async function getBeautyServices(orgId) {
    return supabaseQuery('beauty_services?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createBeautyService(data) {
    var result = await supabaseQuery('beauty_services', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Додано послугу в салон краси', 'beauty_service', data.organization_id, { name: data.name });
    return result;
}

async function getBeautyAppointments(orgId) {
    return supabaseQuery('beauty_appointments?organization_id=eq.' + orgId + '&order=appointment_date.desc');
}

async function createBeautyAppointment(data) {
    var result = await supabaseQuery('beauty_appointments', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Створено запис у салон краси', 'beauty_appointment', data.organization_id, { client: data.client_name });
    return result;
}

async function getAutoOrders(orgId) {
    return supabaseQuery('auto_orders?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createAutoOrder(data) {
    var result = await supabaseQuery('auto_orders', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Створено замовлення в автосервісі', 'auto_order', data.organization_id, { client: data.client_name });
    return result;
}

async function getAutoParts(orgId) {
    return supabaseQuery('auto_parts?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createAutoPart(data) {
    var result = await supabaseQuery('auto_parts', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Додано запчастину', 'auto_part', data.organization_id, { name: data.name });
    return result;
}

async function getRealtyProperties(orgId) {
    return supabaseQuery('realty_properties?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createRealtyProperty(data) {
    var result = await supabaseQuery('realty_properties', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Додано об\'єкт нерухомості', 'realty_property', data.organization_id, { address: data.address });
    return result;
}

async function getRealtyDeals(orgId) {
    return supabaseQuery('realty_deals?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createRealtyDeal(data) {
    var result = await supabaseQuery('realty_deals', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Створено угоду з нерухомості', 'realty_deal', data.organization_id, { client: data.client_name });
    return result;
}

async function getLogisticsOrders(orgId) {
    return supabaseQuery('logistics_orders?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createLogisticsOrder(data) {
    var result = await supabaseQuery('logistics_orders', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Створено логістичне замовлення', 'logistics_order', data.organization_id, { client: data.client_name });
    return result;
}

async function getDeliveryOrders(orgId) {
    return supabaseQuery('delivery_orders?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createDeliveryOrder(data) {
    var result = await supabaseQuery('delivery_orders', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Створено замовлення доставки', 'delivery_order', data.organization_id, { client: data.client_name });
    return result;
}

async function getItProjects(orgId) {
    return supabaseQuery('it_projects?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createItProject(data) {
    var result = await supabaseQuery('it_projects', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Створено IT-проект', 'it_project', data.organization_id, { name: data.name });
    return result;
}

async function getItBugs(orgId) {
    return supabaseQuery('it_bugs?organization_id=eq.' + orgId + '&order=created_at.desc');
}

async function createItBug(data) {
    var result = await supabaseQuery('it_bugs', {
        method: 'POST',
        body: JSON.stringify({ id: generateUUID(), ...data }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Додано баг', 'it_bug', data.organization_id, { title: data.title });
    return result;
}

async function createReport(data) {
    var result = await supabaseQuery('reports', {
        method: 'POST',
        body: JSON.stringify({
            id: generateUUID(),
            from_user_id: data.from_user_id,
            target_user_id: data.target_user_id,
            reason: data.reason,
            description: data.description || '',
            status: data.status || 'pending',
            organization_id: data.organization_id,
            created_at: new Date().toISOString()
        }),
        headers: { 'Prefer': 'return=representation' }
    });
    await addLog('Створено скаргу', 'report', data.organization_id, {
        target_user_id: data.target_user_id,
        reason: data.reason
    });
    return result;
}

async function getReports(organizationId) {
    var query = 'reports?order=created_at.desc';
    if (organizationId) query += '&organization_id=eq.' + organizationId;
    return supabaseQuery(query);
}

async function getReport(reportId) {
    var result = await supabaseQuery('reports?id=eq.' + reportId);
    return result[0] || null;
}

async function updateReportStatus(reportId, status) {
    var result = await supabaseQuery('reports?id=eq.' + reportId, {
        method: 'PATCH',
        body: JSON.stringify({
            status: status,
            resolved_at: status === 'resolved' ? new Date().toISOString() : null
        })
    });
    await addLog('Оновлено статус скарги', 'report', reportId, { status: status });
    return result;
}

async function deleteReport(reportId) {
    var result = await supabaseQuery('reports?id=eq.' + reportId, {
        method: 'DELETE'
    });
    await addLog('Видалено скаргу', 'report', reportId, { deleted: true });
    return result;
}

async function getUserReports(userId) {
    return supabaseQuery('reports?from_user_id=eq.' + userId + '&order=created_at.desc');
}

// ============================================
// ШІ МОДЕРАЦІЯ - ДОДАТКОВІ ФУНКЦІЇ
// ============================================

async function isAiEnabled() {
    try {
        var settings = await getSystemSettings();
        return settings['ai_moderation_enabled'] !== 'false';
    } catch {
        return false;
    }
}

async function getAiGraceMinutes() {
    try {
        var settings = await getSystemSettings();
        return parseInt(settings['ai_support_grace_minutes'] || '10', 10);
    } catch {
        return 10;
    }
}

async function canAiReplyToTicket(ticketId) {
    try {
        var ticket = await getSupportTicket(ticketId);
        if (!ticket) return false;
        if (ticket.status === 'closed') return false;
        
        var messages = await getSupportMessages(ticketId);
        for (var i = 0; i < messages.length; i++) {
            if (isStaffRole(messages[i].sender_type)) {
                return false;
            }
            if (messages[i].sender_type === 'ai') {
                return false;
            }
        }
        
        var graceMinutes = await getAiGraceMinutes();
        var created = new Date(ticket.created_at);
        var now = new Date();
        var diffMinutes = (now - created) / 60000;
        
        return diffMinutes >= graceMinutes;
    } catch {
        return false;
    }
}

function isStaffRole(role) {
    return role === 'owner' || role === 'admin' || role === 'moderator' || role === 'bot';
}

// ============================================
// НОВІ ФУНКЦІЇ ДЛЯ ПОВНИХ ДАНИХ
// ============================================

/**
 * ОТРИМАТИ ПОВНУ ІНФОРМАЦІЮ ПРО КОРИСТУВАЧА ДЛЯ ШІ
 */
async function getUserFullData(userId) {
    try {
        // 1. ОСНОВНІ ДАНІ
        const { data: user, error } = await window.sb
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error || !user) return null;
        
        // 2. ОРГАНІЗАЦІЇ КОРИСТУВАЧА
        const { data: members } = await window.sb
            .from('org_members')
            .select(`
                organization_id,
                is_leader,
                joined_at,
                organizations:organization_id (
                    id,
                    name,
                    type,
                    status,
                    leader_id,
                    created_at
                )
            `)
            .eq('user_id', userId);
        
        // 3. ІСТОРІЯ БАНІВ
        const { data: bans } = await window.sb
            .from('ai_actions_log')
            .select('*')
            .eq('target_user_id', userId)
            .eq('action_type', 'censor_and_ban')
            .order('created_at', { ascending: false })
            .limit(10);
        
        // 4. ПОВІДОМЛЕННЯ КОРИСТУВАЧА
        const { data: messages } = await window.sb
            .from('org_chat_messages')
            .select('message, created_at, is_censored')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);
        
        // 5. АПЕЛЯЦІЇ КОРИСТУВАЧА
        const { data: appeals } = await window.sb
            .from('appeals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        // 6. ТИКЕТИ КОРИСТУВАЧА
        const { data: tickets } = await window.sb
            .from('support_tickets')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);
        
        return {
            user: user,
            organizations: members || [],
            ban_history: bans || [],
            messages: messages || [],
            appeals: appeals || [],
            tickets: tickets || [],
            total_bans: bans ? bans.length : 0,
            total_appeals: appeals ? appeals.length : 0
        };
    } catch (error) {
        console.error('❌ Помилка отримання даних:', error);
        return null;
    }
}

/**
 * ОТРИМАТИ ВСІХ КОРИСТУВАЧІВ З ПОВНИМИ ДАНИМИ (ДЛЯ ШІ)
 */
async function getAllUsersFullData() {
    try {
        const { data: users } = await window.sb
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!users) return [];
        
        const result = [];
        for (const user of users) {
            const fullData = await getUserFullData(user.id);
            if (fullData) result.push(fullData);
        }
        
        return result;
    } catch (error) {
        console.error('❌ Помилка:', error);
        return [];
    }
}

/**
 * ОНОВИТИ СТАТУС БАНУ В UI
 */
async function refreshBanStatus(userId) {
    try {
        const { data: user } = await window.sb
            .from('users')
            .select('is_banned, ban_reason, banned_until')
            .eq('id', userId)
            .single();
        
        if (!user) return null;
        
        // ОНОВЛЮЄМО LOCALSTORAGE
        const localUser = JSON.parse(localStorage.getItem('userData') || '{}');
        if (localUser.id === userId) {
            localUser.is_banned = user.is_banned;
            localUser.ban_reason = user.ban_reason;
            localUser.banned_until = user.banned_until;
            localStorage.setItem('userData', JSON.stringify(localUser));
        }
        
        return user;
    } catch (error) {
        console.error('❌ Помилка оновлення статусу:', error);
        return null;
    }
}

/**
 * СТВОРИТИ АПЕЛЯЦІЮ (ВИКОРИСТОВУЄМО ТІЛЬКИ ТІ ПОЛЯ, ЩО Є!)
 */
async function createAppeal(data) {
    try {
        // ВИКОРИСТОВУЄМО ТІЛЬКИ ТІ ПОЛЯ, ЯКІ ТОЧНО Є В ТАБЛИЦІ
        var appealData = {
            id: generateUUID(),
            user_id: data.user_id,
            ban_reason: data.ban_reason || 'Порушення правил',
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        // ЯКЩО Є ДОДАТКОВІ ПОЛЯ - ДОДАЄМО
        if (data.target_user_id) appealData.target_user_id = data.target_user_id;
        if (data.reason) appealData.reason = data.reason;
        if (data.description) appealData.description = data.description;
        
        const result = await supabaseQuery('appeals', {
            method: 'POST',
            body: JSON.stringify(appealData),
            headers: { 'Prefer': 'return=representation' }
        });
        
        await addLog('Створено апеляцію', 'appeal', null, {
            user_id: data.user_id,
            ban_reason: data.ban_reason
        });
        
        return result;
    } catch (error) {
        console.error('❌ Помилка створення апеляції:', error);
        throw error;
    }
}

/**
 * ОТРИМАТИ АПЕЛЯЦІЮ З ВІДПОВІДДЮ ШІ
 */
async function getAppealWithAIResponse(appealId) {
    try {
        const appeal = await supabaseQuery('appeals?id=eq.' + appealId);
        if (!appeal || appeal.length === 0) return null;
        
        const messages = await supabaseQuery('appeal_messages?appeal_id=eq.' + appealId + '&order=created_at.asc');
        const aiLogs = await supabaseQuery('ai_actions_log?target_user_id=eq.' + appeal[0].user_id + '&order=created_at.desc&limit=5');
        
        return {
            ...appeal[0],
            messages: messages || [],
            ai_logs: aiLogs || []
        };
    } catch (error) {
        console.error('❌ Помилка отримання апеляції:', error);
        return null;
    }
}

/**
 * ПЕРЕВІРИТИ СТАТУС ОБРОБКИ АПЕЛЯЦІЇ
 */
async function checkAppealStatus(appealId) {
    try {
        const result = await supabaseQuery('appeals?id=eq.' + appealId + '&select=status,resolution,resolved_at');
        if (result && result.length > 0) {
            return result[0];
        }
        return null;
    } catch (error) {
        console.error('❌ Помилка перевірки статусу:', error);
        return null;
    }
}

// ============================================
// НОВІ ФУНКЦІЇ ДЛЯ АДМІН-ФОРМ (ЗАПИТИ ТА ПЕРЕДАЧІ)
// ============================================

/**
 * СТВОРИТИ АДМІН-ФОРМУ (ЗАПИТ АБО ПЕРЕДАЧА)
 */
async function createAdminForm(data) {
    try {
        var user = getCurrentUser();
        if (!user) throw new Error('Не авторизовано');
        
        // ВАЛІДАЦІЯ
        var validTypes = ['transfer', 'request', 'punishment'];
        if (validTypes.indexOf(data.form_type) === -1) {
            throw new Error('Невірний тип форми. Доступні: transfer, request, punishment');
        }
        
        var formData = {
            id: generateUUID(),
            form_type: data.form_type,
            created_by: user.id,
            created_by_role: user.role,
            recipient_text: data.recipient_text || 'admin_team',
            subject: data.subject || 'Без теми',
            body: data.body || '',
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        // ДОДАТКОВІ ПОЛЯ ДЛЯ punishment
        if (data.form_type === 'punishment') {
            if (data.target_user_id) formData.target_user_id = data.target_user_id;
            if (data.ban_days) formData.ban_days = parseInt(data.ban_days, 10) || 0;
        }
        
        // ЯКЩО ЦЕ ПЕРЕДАЧА - ДОДАЄМО ДАНІ
        if (data.form_type === 'transfer') {
            formData.transfer_data = data.transfer_data || {};
        }
        
        var result = await supabaseQuery('admin_forms', {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: { 'Prefer': 'return=representation' }
        });
        
        await addLog('Створено адмін-форму', 'admin_form', null, {
            type: data.form_type,
            subject: data.subject
        });
        
        return result;
    } catch (error) {
        console.error('❌ Помилка створення адмін-форми:', error);
        throw error;
    }
}

/**
 * ОТРИМАТИ ВСІ АДМІН-ФОРМИ
 */
async function getAdminForms(filters) {
    if (filters === undefined) filters = {};
    var query = 'admin_forms?order=created_at.desc';
    if (filters.type) query += '&form_type=eq.' + filters.type;
    if (filters.status) query += '&status=eq.' + filters.status;
    return supabaseQuery(query);
}

/**
 * ОНОВИТИ АДМІН-ФОРМУ (ВІДПОВІСТИ)
 */
async function respondAdminForm(formId, data) {
    try {
        var user = getCurrentUser();
        if (!user) throw new Error('Не авторизовано');
        
        var updateData = {
            status: data.status || 'answered',
            response: data.response || '',
            answered_by: user.id,
            answered_at: new Date().toISOString()
        };
        
        // ЯКЩО СХВАЛЮЄМО ПОКАРАННЯ - ВИКОНУЄМО БАН
        var form = await getAdminForm(formId);
        if (form && form.form_type === 'punishment' && data.status === 'approved' && form.target_user_id) {
            var days = form.ban_days || 5;
            var until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
            await supabaseQuery('users?id=eq.' + form.target_user_id, {
                method: 'PATCH',
                body: JSON.stringify({ 
                    is_banned: true, 
                    ban_reason: '[Форма #' + formId.substring(0,8) + '] ' + (form.subject || ''), 
                    banned_until: until 
                })
            });
            await addLog('Бан виконано за схваленою формою', 'user', form.target_user_id, { form_id: formId, days: days });
        }
        
        var result = await supabaseQuery('admin_forms?id=eq.' + formId, {
            method: 'PATCH',
            body: JSON.stringify(updateData)
        });
        
        await addLog('Відповідь на адмін-форму', 'admin_form', formId, data);
        return result;
    } catch (error) {
        console.error('❌ Помилка відповіді на форму:', error);
        throw error;
    }
}

/**
 * ОТРИМАТИ ОДНУ АДМІН-ФОРМУ
 */
async function getAdminForm(formId) {
    var result = await supabaseQuery('admin_forms?id=eq.' + formId);
    return result && result.length > 0 ? result[0] : null;
}

/**
 * ВИДАЛИТИ АДМІН-ФОРМУ
 */
async function deleteAdminForm(formId) {
    try {
        var result = await supabaseQuery('admin_forms?id=eq.' + formId, {
            method: 'DELETE'
        });
        await addLog('Видалено адмін-форму', 'admin_form', formId, {});
        return result;
    } catch (error) {
        console.error('❌ Помилка видалення форми:', error);
        throw error;
    }
}

// ============================================
// ФУНКЦІЇ ДЛЯ ЗАПИТІВ ДО ШІ (AI OWNER REQUESTS)
// ============================================

/**
 * СТВОРИТИ ЗАПИТ ДО ШІ
 */
async function createAiOwnerRequest(prompt) {
    try {
        var user = getCurrentUser();
        if (!user) throw new Error('Не авторизовано');
        if (!prompt || prompt.trim() === '') throw new Error('Введіть текст запиту');
        
        var result = await supabaseQuery('ai_owner_requests', {
            method: 'POST',
            body: JSON.stringify({
                id: generateUUID(),
                requested_by: user.id,
                prompt: prompt.trim(),
                status: 'queued',
                created_at: new Date().toISOString()
            }),
            headers: { 'Prefer': 'return=representation' }
        });
        
        await addLog('Створено запит до ШІ', 'ai_owner_request', null, { prompt: prompt });
        return result;
    } catch (error) {
        console.error('❌ Помилка створення запиту:', error);
        throw error;
    }
}

/**
 * ОТРИМАТИ ВСІ ЗАПИТИ ДО ШІ
 */
async function getAiOwnerRequests(filters) {
    if (filters === undefined) filters = {};
    var query = 'ai_owner_requests?order=created_at.desc';
    if (filters.status) query += '&status=eq.' + filters.status;
    if (filters.userId) query += '&requested_by=eq.' + filters.userId;
    return supabaseQuery(query);
}

/**
 * ОНОВИТИ СТАТУС ЗАПИТУ ДО ШІ
 */
async function updateAiOwnerRequest(requestId, data) {
    try {
        var result = await supabaseQuery('ai_owner_requests?id=eq.' + requestId, {
            method: 'PATCH',
            body: JSON.stringify({
                status: data.status || 'done',
                greeting: data.greeting || null,
                response: data.response || null,
                updated_at: new Date().toISOString()
            })
        });
        return result;
    } catch (error) {
        console.error('❌ Помилка оновлення запиту:', error);
        throw error;
    }
}

// ============================================
// ЕКСПОРТ ВСІХ ФУНКЦІЙ
// ============================================

window.db = {
    // ОСНОВНІ ФУНКЦІЇ
    supabaseQuery: supabaseQuery,
    addLog: addLog,
    getUserName: getUserName,
    getClientIp: getClientIp,
    getSystemSettings: getSystemSettings,
    clearSystemSettingsCache: clearSystemSettingsCache,
    getBannedWords: getBannedWords,
    clearBannedWordsCache: clearBannedWordsCache,
    findBannedWord: findBannedWord,
    getActiveAnnouncements: getActiveAnnouncements,
    
    // КОРИСТУВАЧІ
    getUserRole: getUserRole,
    isUserBanned: isUserBanned,
    getUsersWithRoles: getUsersWithRoles,
    updateUser: updateUser,
    deleteUser: deleteUser,
    setUserRole: setUserRole,
    getUserFullData: getUserFullData,
    getAllUsersFullData: getAllUsersFullData,
    refreshBanStatus: refreshBanStatus,
    
    // ОРГАНІЗАЦІЇ
    createOrganization: createOrganization,
    getUserOrganizations: getUserOrganizations,
    getUserAllOrganizations: getUserAllOrganizations,
    getUserLedOrganizations: getUserLedOrganizations,
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
    
    // СПІВРОБІТНИКИ
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
    
    // ЧАТ
    sendChatMessage: sendChatMessage,
    getChatMessages: getChatMessages,
    deleteChatMessage: deleteChatMessage,
    
    // ВІДПУСТКИ
    createVacation: createVacation,
    getVacations: getVacations,
    getUserVacations: getUserVacations,
    updateVacationStatus: updateVacationStatus,
    deleteVacation: deleteVacation,
    
    // ПОДІЇ
    createEvent: createEvent,
    getEvents: getEvents,
    deleteEvent: deleteEvent,
    
    // ЗАВДАННЯ
    createTask: createTask,
    getTasks: getTasks,
    updateTask: updateTask,
    deleteTask: deleteTask,
    
    // ОПИТУВАННЯ
    createPoll: createPoll,
    getPolls: getPolls,
    votePoll: votePoll,
    getPollResults: getPollResults,
    deletePoll: deletePoll,
    
    // СПОВІЩЕННЯ
    createNotification: createNotification,
    getNotifications: getNotifications,
    markNotificationRead: markNotificationRead,
    
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
    getDeliveryOrders: getDeliveryOrders,
    createDeliveryOrder: createDeliveryOrder,
    
    // IT
    getItProjects: getItProjects,
    createItProject: createItProject,
    getItBugs: getItBugs,
    createItBug: createItBug,
    
    // СКАРГИ
    createReport: createReport,
    getReports: getReports,
    getReport: getReport,
    updateReportStatus: updateReportStatus,
    deleteReport: deleteReport,
    getUserReports: getUserReports,
    
    // ПІДТРИМКА
    createSupportTicket: createSupportTicket,
    getSupportTickets: getSupportTickets,
    getSupportTicket: getSupportTicket,
    updateSupportTicket: updateSupportTicket,
    getSupportMessages: getSupportMessages,
    sendSupportMessage: sendSupportMessage,
    
    // АПЕЛЯЦІЇ
    getAppeals: getAppeals,
    getAppealMessages: getAppealMessages,
    updateAppealStatus: updateAppealStatus,
    sendAppealMessage: sendAppealMessage,
    createAppeal: createAppeal,
    getAppealWithAIResponse: getAppealWithAIResponse,
    checkAppealStatus: checkAppealStatus,
    
    // ШІ
    isAiEnabled: isAiEnabled,
    getAiGraceMinutes: getAiGraceMinutes,
    canAiReplyToTicket: canAiReplyToTicket,
    isStaffRole: isStaffRole,
    
    // НОВІ ФУНКЦІЇ ДЛЯ АДМІН-ФОРМ
    createAdminForm: createAdminForm,
    getAdminForms: getAdminForms,
    getAdminForm: getAdminForm,
    respondAdminForm: respondAdminForm,
    deleteAdminForm: deleteAdminForm,
    
    // НОВІ ФУНКЦІЇ ДЛЯ ЗАПИТІВ ДО ШІ
    createAiOwnerRequest: createAiOwnerRequest,
    getAiOwnerRequests: getAiOwnerRequests,
    updateAiOwnerRequest: updateAiOwnerRequest
};
