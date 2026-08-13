// ============================================
// TYPEBIZ - АДМІН-ПАНЕЛЬ З ПРАВАМИ
// ============================================

function hasAccess(user, requiredRole) {
    if (!user) return false;
    var roleHierarchy = {
        'user': 0,
        'moderator': 1,
        'admin': 2,
        'owner': 3
    };
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

function canViewData(user) {
    return user && (user.role === 'owner' || user.role === 'admin' || user.role === 'moderator');
}

function canBanUser(user) {
    return user && (user.role === 'owner' || user.role === 'admin');
}

function canDeleteUser(user) {
    return user && (user.role === 'owner' || user.role === 'admin');
}

function canChangeRoles(user) {
    return user && user.role === 'owner';
}

function canFreezeOrg(user) {
    return user && (user.role === 'owner' || user.role === 'admin');
}

function canTransferLeadership(user) {
    return user && user.role === 'owner';
}

function canRenameOrg(user) {
    return user && user.role === 'owner';
}

function canDeleteOrg(user) {
    return user && (user.role === 'owner' || user.role === 'admin');
}

// ============= СТАТИСТИКА =============

async function loadStats() {
    try {
        var user = auth.getCurrentUser();
        if (!canViewData(user)) {
            document.getElementById('statsGrid').style.display = 'none';
            return;
        }

        var users = await db.supabaseQuery('users?select=*');
        var orgs = await db.supabaseQuery('organizations?select=*');
        var messages = await db.supabaseQuery('org_chat_messages?select=*');
        var vacations = await db.supabaseQuery('org_vacations?select=*');

        document.getElementById('totalUsers').textContent = users ? users.length : 0;
        document.getElementById('totalOrgs').textContent = orgs ? orgs.length : 0;
        document.getElementById('totalMessages').textContent = messages ? messages.length : 0;
        document.getElementById('totalVacations').textContent = vacations ? vacations.length : 0;
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

async function loadRecentLogs() {
    try {
        var user = auth.getCurrentUser();
        if (!canViewData(user)) {
            document.getElementById('recentLogs').innerHTML = '<p class="text-muted">Немає доступу до логів</p>';
            return;
        }

        var logs = await db.supabaseQuery('activity_logs?order=created_at.desc&limit=20');
        var container = document.getElementById('recentLogs');

        if (!logs || logs.length === 0) {
            container.innerHTML = '<p class="text-muted">Логів поки немає</p>';
            return;
        }

        var html = '<div style="overflow-x:auto;"><table class="table"><thead><tr><th>Час</th><th>Користувач</th><th>Дія</th><th>Тип</th></tr></thead><tbody>';
        
        for (var i = 0; i < logs.length; i++) {
            var log = logs[i];
            var date = formatDateTimeKyiv(log.created_at);
            var userName = log.user_name || 'Система';
            html += '<tr>' +
                '<td style="font-size:0.85rem;">' + date + '</td>' +
                '<td><strong>' + userName + '</strong></td>' +
                '<td><span class="badge badge-primary">' + (log.action || '—') + '</span></td>' +
                '<td>' + (log.entity_type || '—') + '</td>' +
            '</tr>';
        }

        html += '</tbody></table></div>';
        container.innerHTML = html;
    } catch (error) {
        console.error('Load logs error:', error);
        document.getElementById('recentLogs').innerHTML = '<p class="text-danger">Помилка завантаження логів</p>';
    }
}

// ============= НАВІГАЦІЯ =============

function loadSection(section) {
    var links = document.querySelectorAll('.nav-menu a');
    for (var i = 0; i < links.length; i++) {
        links[i].classList.remove('active');
    }
    for (var j = 0; j < links.length; j++) {
        var onclick = links[j].getAttribute('onclick') || '';
        if (onclick.indexOf(section) !== -1) {
            links[j].classList.add('active');
        }
    }
    
    var titles = {
        'overview': 'Огляд',
        'owner': 'Панель засновника',
        'users': 'Користувачі',
        'orgs': 'Організації',
        'chat': 'Чати',
        'vacations': 'Відпустки',
        'requests': 'Заявки',
        'logs': 'Логи'
    };
    
    document.getElementById('pageTitle').textContent = titles[section] || 'Адмін-панель';
    
    switch(section) {
        case 'overview':
            loadOverview();
            break;
        case 'owner':
            loadOwnerPanel();
            break;
        case 'users':
            loadUsers();
            break;
        case 'orgs':
            loadOrgs();
            break;
        case 'chat':
            loadChat();
            break;
        case 'vacations':
            loadVacations();
            break;
        case 'requests':
            loadRequests();
            break;
        case 'logs':
            loadLogs();
            break;
        default:
            loadOverview();
    }
}

async function loadOverview() {
    var container = document.getElementById('adminContent');
    container.innerHTML = 
        '<div class="card">' +
            '<div class="card-header">' +
                '<h3 class="card-title">Останні дії</h3>' +
            '</div>' +
            '<div id="recentLogs">' +
                '<p class="text-muted">Завантаження...</p>' +
            '</div>' +
        '</div>';
    await loadRecentLogs();
    await loadStats();
}

// ============= ПАНЕЛЬ ЗАСНОВНИКА =============

async function loadOwnerPanel() {
    var container = document.getElementById('adminContent');
    var user = auth.getCurrentUser();
    
    if (!user || user.role !== 'owner') {
        container.innerHTML = '<div class="card"><p class="text-danger">Доступ заборонено. Тільки для засновника.</p></div>';
        return;
    }
    
    document.getElementById('pageTitle').textContent = 'Панель засновника';
    document.getElementById('pageSubtitle').textContent = 'Повне управління системою';
    
    try {
        var stats = {
            totalUsers: (await db.supabaseQuery('users?select=id')).length,
            totalOrgs: (await db.supabaseQuery('organizations?select=id')).length,
            totalAdmins: (await db.supabaseQuery('users?role=eq.admin&select=id')).length,
            totalModerators: (await db.supabaseQuery('users?role=eq.moderator&select=id')).length,
            totalBanned: (await db.supabaseQuery('users?is_banned=eq.true&select=id')).length,
            totalMessages: (await db.supabaseQuery('org_chat_messages?select=id')).length
        };
        
        var html = '';
        
        html += '<div class="grid-4" style="margin-bottom:1.5rem;">';
        html += '<div class="stat-card"><div class="stat-value">' + stats.totalUsers + '</div><div class="stat-label">Користувачів</div></div>';
        html += '<div class="stat-card" style="border-color:#8B5CF6;"><div class="stat-value">' + stats.totalOrgs + '</div><div class="stat-label">Організацій</div></div>';
        html += '<div class="stat-card" style="border-color:#E2503E;"><div class="stat-value">' + stats.totalAdmins + '</div><div class="stat-label">Адміністраторів</div></div>';
        html += '<div class="stat-card" style="border-color:#F59E0B;"><div class="stat-value">' + stats.totalModerators + '</div><div class="stat-label">Модераторів</div></div>';
        html += '</div>';
        
        html += '<div class="grid-2" style="margin-bottom:1.5rem;">';
        html += '<div class="stat-card" style="border-color:#E2503E;"><div class="stat-value" style="color:#E2503E;">' + stats.totalBanned + '</div><div class="stat-label">Заблокованих користувачів</div></div>';
        html += '<div class="stat-card" style="border-color:#3B82F6;"><div class="stat-value">' + stats.totalMessages + '</div><div class="stat-label">Повідомлень у чатах</div></div>';
        html += '</div>';
        
        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Адміністратори та модератори</h3></div>';
        html += '<div style="overflow-x:auto;">';
        html += '<table class="table"><thead><tr><th>Користувач</th><th>Email</th><th>Роль</th></tr></thead><tbody>';
        
        var admins = await db.supabaseQuery('users?role=eq.admin&select=id,full_name,email');
        var moderators = await db.supabaseQuery('users?role=eq.moderator&select=id,full_name,email');
        
        if (admins && admins.length > 0) {
            for (var i = 0; i < admins.length; i++) {
                var a = admins[i];
                html += '<tr><td><strong>' + (a.full_name || 'Без імені') + '</strong></td><td>' + a.email + '</td><td><span class="badge badge-danger">Адмін</span></td></tr>';
            }
        }
        
        if (moderators && moderators.length > 0) {
            for (var i = 0; i < moderators.length; i++) {
                var m = moderators[i];
                html += '<tr><td><strong>' + (m.full_name || 'Без імені') + '</strong></td><td>' + m.email + '</td><td><span class="badge badge-warning">Модератор</span></td></tr>';
            }
        }
        
        if ((!admins || admins.length === 0) && (!moderators || moderators.length === 0)) {
            html += '<tr><td colspan="3" class="text-center text-muted">Немає адміністраторів або модераторів</td></tr>';
        }
        
        html += '</tbody></table></div></div>';
        
        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Швидкі дії</h3></div>';
        html += '<div style="display:flex;gap:0.75rem;flex-wrap:wrap;">';
        html += '<button class="btn btn-teal" onclick="loadSection(\'users\')"><i class="fas fa-users"></i> Керувати користувачами</button>';
        html += '<button class="btn btn-gold" onclick="loadSection(\'orgs\')"><i class="fas fa-building"></i> Керувати організаціями</button>';
        html += '<button class="btn btn-danger" onclick="loadSection(\'logs\')"><i class="fas fa-history"></i> Переглянути логи</button>';
        html += '</div></div>';
        
        container.innerHTML = html;
        
    } catch (error) {
        container.innerHTML = '<div class="card"><p class="text-danger">Помилка завантаження панелі засновника: ' + error.message + '</p></div>';
    }
}

function showOwnerPanel() {
    var user = auth.getCurrentUser();
    var link = document.getElementById('ownerPanelLink');
    if (link) {
        link.style.display = (user && user.role === 'owner') ? 'block' : 'none';
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

async function handleLogout() {
    var confirmed = await showConfirm('Ви впевнені, що хочете вийти?', 'Вихід');
    if (confirmed) {
        auth.logoutUser();
    }
}

document.querySelectorAll('.modal').forEach(function(modal) {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

async function init() {
    var user = auth.getCurrentUser();
    
    // Показуємо панель засновника для owner
    showOwnerPanel();
    
    // Перевіряємо доступ (owner, admin, moderator)
    var hasAccess = user && (user.role === 'owner' || user.role === 'admin' || user.role === 'moderator');
    
    if (!hasAccess) {
        document.getElementById('adminContent').innerHTML = 
            '<div class="card"><p class="text-danger">Доступ заборонено. Потрібні права: owner, admin або moderator.</p></div>';
        return;
    }

    await loadStats();
    await loadOverview();
}

init();

// ============= КОРИСТУВАЧІ =============

async function loadUsers() {
    var container = document.getElementById('adminContent');
    var user = auth.getCurrentUser();
    
    if (!canViewData(user)) {
        container.innerHTML = '<div class="card"><p class="text-danger">Немає доступу</p></div>';
        return;
    }
    
    var isOwner = user && user.role === 'owner';
    var isAdmin = user && user.role === 'admin';
    
    try {
        var users = await db.supabaseQuery('users?select=*');
        
        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Всі користувачі</h3>' +
                    '<span class="badge badge-primary">' + (users ? users.length : 0) + '</span>' +
                '</div>' +
                '<div class="search-filters">' +
                    '<div class="search-wrapper">' +
                        '<i class="fas fa-search search-icon"></i>' +
                        '<input type="text" class="search-input" id="userSearchInput" placeholder="Пошук за ім\'ям або email..." oninput="filterUsersTable()">' +
                        '<button class="search-clear" onclick="document.getElementById(\'userSearchInput\').value=\'\';filterUsersTable();this.classList.remove(\'visible\');">' +
                            '<i class="fas fa-times"></i>' +
                        '</button>' +
                    '</div>' +
                    '<select class="filter-select" id="userRoleFilter" onchange="filterUsersTable()">' +
                        '<option value="">Всі ролі</option>' +
                        '<option value="owner">Засновник</option>' +
                        '<option value="admin">Адмін</option>' +
                        '<option value="moderator">Модератор</option>' +
                        '<option value="user">Користувач</option>' +
                    '</select>' +
                    '<select class="filter-select" id="userStatusFilter" onchange="filterUsersTable()">' +
                        '<option value="">Всі статуси</option>' +
                        '<option value="active">Активний</option>' +
                        '<option value="banned">Заблокований</option>' +
                    '</select>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table" id="usersTable">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Ім\'я</th>' +
                                '<th>Email</th>' +
                                '<th>Роль</th>' +
                                '<th>Статус</th>' +
                                '<th>IP</th>' +
                                '<th>Дії</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody id="usersTableBody">';

        if (users && users.length > 0) {
            for (var i = 0; i < users.length; i++) {
                var u = users[i];
                var isUserOwner = u.role === 'owner';
                var isUserAdmin = u.role === 'admin';
                var isUserModerator = u.role === 'moderator';
                var isUserBanned = u.is_banned === true;
                var isCurrentUser = u.id === user.id;
                
                var roleLabels = {
                    'owner': '<span class="badge" style="background:#8B5CF6;color:white;">Засновник</span>',
                    'admin': '<span class="badge badge-danger">Адмін</span>',
                    'moderator': '<span class="badge badge-warning">Модератор</span>',
                    'user': '<span class="badge badge-primary">Користувач</span>'
                };
                
                html += 
                    '<tr data-name="' + (u.full_name || '').toLowerCase() + '" data-email="' + (u.email || '').toLowerCase() + '" data-role="' + (u.role || 'user') + '" data-status="' + (isUserBanned ? 'banned' : 'active') + '">' +
                        '<td><strong>' + (u.full_name || 'Без імені') + '</strong>' + (isCurrentUser ? ' (ви)' : '') + '</td>' +
                        '<td>' + (u.email || '—') + '</td>' +
                        '<td>' + (roleLabels[u.role] || roleLabels.user) + '</td>' +
                        '<td><span class="badge ' + (isUserBanned ? 'badge-danger' : 'badge-success') + '">' + (isUserBanned ? 'Заблоковано' : 'Активний') + '</span></td>' +
                        '<td style="font-size:0.8rem;white-space:nowrap;">' +
                            '<div title="IP реєстрації">' + (u.reg_ip || '—') + '</div>' +
                            '<div class="text-muted" title="Останній вхід">' + (u.last_ip || '—') + '</div>' +
                        '</td>' +
                        '<td style="white-space:nowrap;">' +
                            ((canBanUser(user) && !isCurrentUser) ? 
                                (isUserBanned ? 
                                    '<button class="btn btn-sm btn-teal" onclick="unbanUser(\'' + u.id + '\')" title="Розблокувати" style="padding:0.25rem 0.7rem;font-size:0.7rem;"><i class="fas fa-user-check"></i></button>' :
                                    '<button class="btn btn-sm btn-danger" onclick="banUser(\'' + u.id + '\')" title="Заблокувати" style="padding:0.25rem 0.7rem;font-size:0.7rem;"><i class="fas fa-user-slash"></i></button>'
                                ) : ''
                            ) +
                            (canChangeRoles(user) && !isCurrentUser && !isUserOwner ? 
                                (isUserAdmin ? 
                                    '<button class="btn btn-sm btn-warning" onclick="changeUserRole(\'' + u.id + '\', \'user\')" title="Зняти адміна" style="padding:0.25rem 0.7rem;font-size:0.7rem;"><i class="fas fa-user-minus"></i></button>' :
                                    (isUserModerator ?
                                        '<button class="btn btn-sm btn-teal" onclick="changeUserRole(\'' + u.id + '\', \'admin\')" title="Зробити адміном" style="padding:0.25rem 0.7rem;font-size:0.7rem;"><i class="fas fa-user-crown"></i></button>' +
                                        '<button class="btn btn-sm btn-warning" onclick="changeUserRole(\'' + u.id + '\', \'user\')" title="Зняти модератора" style="padding:0.25rem 0.7rem;font-size:0.7rem;"><i class="fas fa-user-minus"></i></button>' :
                                        '<button class="btn btn-sm btn-teal" onclick="changeUserRole(\'' + u.id + '\', \'moderator\')" title="Зробити модератором" style="padding:0.25rem 0.7rem;font-size:0.7rem;"><i class="fas fa-user-shield"></i></button>' +
                                        '<button class="btn btn-sm btn-teal" onclick="changeUserRole(\'' + u.id + '\', \'admin\')" title="Зробити адміном" style="padding:0.25rem 0.7rem;font-size:0.7rem;"><i class="fas fa-user-crown"></i></button>'
                                    )
                                ) : ''
                            ) +
                            (canDeleteUser(user) && !isCurrentUser ? 
                                '<button class="btn btn-sm btn-danger" onclick="deleteUser(\'' + u.id + '\')" style="padding:0.25rem 0.7rem;font-size:0.7rem;"><i class="fas fa-trash"></i></button>' : ''
                            ) +
                        '</td>' +
                    '</tr>';
            }
        } else {
            html += '<tr><td colspan="6" class="text-center text-muted">Немає користувачів</td></tr>';
        }

        html += 
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        container.innerHTML = html;
    } catch (error) {
        console.error('Load users error:', error);
        container.innerHTML = '<div class="card"><p class="text-danger">Помилка завантаження користувачів</p></div>';
    }
}

function filterUsersTable() {
    var searchInput = document.getElementById('userSearchInput');
    var roleFilter = document.getElementById('userRoleFilter');
    var statusFilter = document.getElementById('userStatusFilter');
    
    if (!searchInput) return;
    
    var query = searchInput.value.toLowerCase().trim();
    var role = roleFilter ? roleFilter.value : '';
    var status = statusFilter ? statusFilter.value : '';
    
    var rows = document.querySelectorAll('#usersTableBody tr');
    rows.forEach(function(row) {
        var name = row.getAttribute('data-name') || '';
        var email = row.getAttribute('data-email') || '';
        var rowRole = row.getAttribute('data-role') || '';
        var rowStatus = row.getAttribute('data-status') || '';
        
        var matchSearch = name.indexOf(query) !== -1 || email.indexOf(query) !== -1;
        var matchRole = !role || rowRole === role;
        var matchStatus = !status || rowStatus === status;
        
        if (matchSearch && matchRole && matchStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function canModerateAppeals(user) {
    return user && (user.role === 'owner' || user.role === 'admin');
}

// Модератор не може банити на 5+ днів без форми
function canBanWithoutForm(user, days) {
    if (!user) return false;
    if (user.role === 'owner' || user.role === 'admin') return true;
    // Модератор може банити тільки до 5 днів
    return days <= 5;
}

// Модератор не може відповідати на адмін-форми
function canRespondToAdminForms(user) {
    return user && (user.role === 'owner' || user.role === 'admin');
}

// Модератор не може схвалювати/відхиляти форми
function canApproveAdminForms(user) {
    return user && (user.role === 'owner' || user.role === 'admin');
}

async function banUser(userId) {
    try {
        var user = auth.getCurrentUser();
        var targetRows = await db.supabaseQuery('users?id=eq.' + userId + '&select=id,role,full_name,email');
        var target = targetRows && targetRows[0];
        if (!target) { await showAlert('Користувача не знайдено', 'error'); return; }
        
        if (user.role === 'moderator' && target.role !== 'user') {
            await showAlert('Модератор може блокувати тільки звичайних користувачів', 'error');
            return;
        }

        try {
            var meRows = await db.supabaseQuery('users?id=eq.' + user.id + '&select=last_ban_action_at');
            var lastBanAt = meRows && meRows[0] && meRows[0].last_ban_action_at;
            if (lastBanAt) {
                var cooldownMs = 60 * 1000;
                var elapsedMs = Date.now() - new Date(lastBanAt).getTime();
                if (elapsedMs < cooldownMs) {
                    var secondsLeft = Math.ceil((cooldownMs - elapsedMs) / 1000);
                    await showAlert('Зачекайте ще ' + secondsLeft + ' сек. перед наступним баном (кулдаун 1 хв між банами).', 'warning');
                    return;
                }
            }
        } catch (cooldownError) { console.warn('Ban cooldown check failed, skipping:', cooldownError.message); }

        var reason = await showPrompt('Введіть причину блокування:', 'Порушення правил', 'Блокування користувача');
        if (reason === null) return;
        if (!reason || reason.trim() === '') { await showAlert('Введіть причину блокування', 'warning'); return; }

        var daysInput = await showPrompt('На скільки днів заблокувати? (макс. 2000, залиште порожнім для безстрокового бану):', '', 'Строк блокування');
        if (daysInput === null) return;
        var banUntil = null;
        var banDays = 0;
        if (daysInput && daysInput.trim() !== '') {
            var days = parseInt(daysInput.trim(), 10);
            if (isNaN(days) || days <= 0) { await showAlert('Строк має бути додатним числом днів', 'warning'); return; }
            if (days > 2000) { await showAlert('Максимальний строк - 2000 днів', 'warning'); return; }
            banUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
            banDays = days;
        } else {
            banDays = 2000;
        }

        if (user.role === 'moderator' && banDays > 5) {
            try {
                await db.supabaseQuery('admin_forms', {
                    method: 'POST',
                    body: JSON.stringify({
                        form_type: 'punishment',
                        created_by: user.id,
                        created_by_role: user.role,
                        recipient_text: 'admin_team',
                        subject: 'Форма покарання: бан ' + (target.full_name || target.email || 'користувача'),
                        body: 'Бан на ' + (banUntil ? banDays + ' дн.' : 'назавжди') + '. Причина: ' + reason.trim(),
                        target_user_id: userId,
                        ban_days: banDays || 0,
                        status: 'pending'
                    })
                });
                await showToast('Створено форму покарання для затвердження адміністрацією', 'info');
                return;
            } catch (formError) { 
                console.warn('Помилка створення форми покарання:', formError);
                await showAlert('Помилка створення форми: ' + formError.message, 'error');
                return;
            }
        }

        var confirmed = await showConfirm('Ви впевнені, що хочете заблокувати цього користувача' + (banUntil ? ' на ' + daysInput.trim() + ' дн.' : ' безстроково') + '?', 'Підтвердження');
        if (!confirmed) return;

        var members = await db.supabaseQuery('org_members?user_id=eq.' + userId);
        if (members && members.length > 0) { for (var i = 0; i < members.length; i++) { await db.removeMemberFromOrganization(members[i].id); } }
        await db.supabaseQuery('users?id=eq.' + userId, { method: 'PATCH', body: JSON.stringify({ is_banned: true, ban_reason: reason.trim(), banned_until: banUntil, banned_at: new Date().toISOString(), role: 'user' }) });
        try {
            await db.supabaseQuery('users?id=eq.' + user.id, { method: 'PATCH', body: JSON.stringify({ last_ban_action_at: new Date().toISOString() }) });
        } catch (e) { console.warn('Could not update last_ban_action_at:', e.message); }
        await db.addLog('Заблоковано користувача', 'user', userId, { reason: reason.trim(), user_name: target.full_name || target.email || 'Користувач' });
        await showToast('Користувача заблоковано!', 'success');
        loadUsers();
    } catch (error) {
        console.error('banUser error:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function changeUserRole(userId, newRole) {
    var user = auth.getCurrentUser();
    if (!canChangeRoles(user)) {
        await showAlert('Тільки засновник може змінювати ролі', 'error');
        return;
    }
    
    var roleLabels = {
        'owner': 'засновника',
        'admin': 'адміністратора',
        'moderator': 'модератора',
        'user': 'звичайного користувача'
    };
    
    var confirmed = await showConfirm('Змінити роль цього користувача на "' + roleLabels[newRole] + '"?', 'Підтвердження');
    if (!confirmed) return;
    
    try {
        await db.setUserRole(userId, newRole);
        await db.addLog('Змінено роль користувача', 'user', userId, { new_role: newRole });
        await showToast('Роль змінено!', 'success');
        loadUsers();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function banUser(userId) {
    var user = auth.getCurrentUser();
    if (!canBanUser(user)) {
        await showAlert('Тільки засновник або адмін може блокувати', 'error');
        return;
    }
    
    var reason = await showPrompt('Введіть причину блокування:', 'Порушення правил', 'Блокування користувача');
    if (reason === null) return;
    if (!reason || reason.trim() === '') {
        await showAlert('Введіть причину блокування', 'warning');
        return;
    }
    
    var confirmed = await showConfirm('Ви впевнені, що хочете заблокувати цього користувача?', 'Підтвердження');
    if (!confirmed) return;
    
    try {
        var members = await db.supabaseQuery('org_members?user_id=eq.' + userId);
        if (members && members.length > 0) {
            for (var i = 0; i < members.length; i++) {
                await db.removeMemberFromOrganization(members[i].id);
            }
        }
        
        await db.supabaseQuery('users?id=eq.' + userId, {
            method: 'PATCH',
            body: JSON.stringify({ 
                is_banned: true, 
                ban_reason: reason.trim(),
                banned_at: new Date().toISOString(),
                role: 'user'
            })
        });
        
        var userData = await db.supabaseQuery('users?id=eq.' + userId);
        var userName = userData && userData.length > 0 ? (userData[0].full_name || userData[0].email || 'Користувач') : 'Користувач';
        await db.addLog('Заблоковано користувача', 'user', userId, { reason: reason.trim(), user_name: userName });
        await showToast('Користувача заблоковано!', 'success');
        loadUsers();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function unbanUser(userId) {
    var user = auth.getCurrentUser();
    if (!canBanUser(user)) {
        await showAlert('Тільки засновник або адмін може розблоковувати', 'error');
        return;
    }
    
    var confirmed = await showConfirm('Розблокувати цього користувача?', 'Підтвердження');
    if (!confirmed) return;
    
    try {
        await db.supabaseQuery('users?id=eq.' + userId, {
            method: 'PATCH',
            body: JSON.stringify({ 
                is_banned: false, 
                ban_reason: null 
            })
        });
        
        var userData = await db.supabaseQuery('users?id=eq.' + userId);
        var userName = userData && userData.length > 0 ? (userData[0].full_name || userData[0].email || 'Користувач') : 'Користувач';
        await db.addLog('Розблоковано користувача', 'user', userId, { user_name: userName });
        await showToast('Користувача розблоковано!', 'success');
        loadUsers();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function deleteUser(id) {
    var user = auth.getCurrentUser();
    if (!canDeleteUser(user)) {
        await showAlert('Тільки засновник або адмін може видаляти', 'error');
        return;
    }
    
    var confirmed = await showConfirm('Ви впевнені, що хочете видалити цього користувача?', 'Підтвердження');
    if (!confirmed) return;
    
    try {
        await db.deleteUser(id);
        await showToast('Користувача видалено', 'success');
        loadUsers();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ============= ОРГАНІЗАЦІЇ =============

async function loadOrgs() {
    var container = document.getElementById('adminContent');
    var user = auth.getCurrentUser();
    
    if (!canViewData(user)) {
        container.innerHTML = '<div class="card"><p class="text-danger">Немає доступу</p></div>';
        return;
    }
    
    var isOwner = user && user.role === 'owner';
    var isAdmin = user && user.role === 'admin';
    
    try {
        var orgs = await db.supabaseQuery('organizations?select=*');
        
        var users = await db.supabaseQuery('users?select=id,full_name,email');
        var userMap = {};
        if (users) {
            for (var i = 0; i < users.length; i++) {
                userMap[users[i].id] = users[i].full_name || users[i].email || 'Невідомо';
            }
        }
        
        var members = await db.supabaseQuery('org_members?select=*');
        var leaderMap = {};
        if (members) {
            for (var i = 0; i < members.length; i++) {
                var m = members[i];
                if (m.is_leader) {
                    leaderMap[m.organization_id] = m.user_id;
                }
            }
        }
        
        var typeLabels = {
            'shop': 'Магазин', 'library': 'Бібліотека', 'company': 'Компанія',
            'school': 'Школа', 'clinic': 'Клініка', 'restaurant': 'Ресторан',
            'cafe': 'Кафе', 'hotel': 'Готель', 'gym': 'Спортзал',
            'beauty': 'Салон краси', 'auto': 'Автосервіс', 'realty': 'Нерухомість',
            'it': 'IT-компанія', 'other': 'Інше'
        };
        
        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Всі організації</h3>' +
                    '<span class="badge badge-primary">' + (orgs ? orgs.length : 0) + '</span>' +
                '</div>' +
                '<div class="search-filters">' +
                    '<div class="search-wrapper">' +
                        '<i class="fas fa-search search-icon"></i>' +
                        '<input type="text" class="search-input" id="orgSearchInput" placeholder="Пошук за назвою або типом..." oninput="filterOrgsTable()">' +
                        '<button class="search-clear" onclick="document.getElementById(\'orgSearchInput\').value=\'\';filterOrgsTable();this.classList.remove(\'visible\');">' +
                            '<i class="fas fa-times"></i>' +
                        '</button>' +
                    '</div>' +
                    '<select class="filter-select" id="orgStatusFilter" onchange="filterOrgsTable()">' +
                        '<option value="">Всі статуси</option>' +
                        '<option value="active">Активна</option>' +
                        '<option value="frozen">Заморожена</option>' +
                    '</select>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table" id="orgsTable">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Назва</th>' +
                                '<th>Тип</th>' +
                                '<th>Код</th>' +
                                '<th>Лідер</th>' +
                                '<th>Статус</th>' +
                                '<th>Дії</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody id="orgsTableBody">';

        if (orgs && orgs.length > 0) {
            for (var i = 0; i < orgs.length; i++) {
                var org = orgs[i];
                var creatorName = userMap[org.created_by] || 'Невідомо';
                var leaderName = userMap[leaderMap[org.id]] || creatorName;
                var isActive = org.is_active !== false;
                var freezeReason = org.freeze_reason || '';
                var statusText = isActive ? 'Активна' : 'Заморожена';
                var statusClass = isActive ? 'badge-success' : 'badge-danger';
                var statusValue = isActive ? 'active' : 'frozen';
                
                html += 
                    '<tr data-name="' + (org.name || '').toLowerCase() + '" data-type="' + (typeLabels[org.type] || org.type || '').toLowerCase() + '" data-status="' + statusValue + '">' +
                        '<td><strong>' + (org.name || 'Без назви') + '</strong></td>' +
                        '<td>' + (typeLabels[org.type] || org.type || '—') + '</td>' +
                        '<td style="font-family:monospace;font-size:0.8rem;text-transform:lowercase;">' + (org.join_code || '—') + '</td>' +
                        '<td>' + leaderName + '</td>' +
                        '<td><span class="badge ' + statusClass + '">' + statusText + (freezeReason ? ' (' + freezeReason + ')' : '') + '</span></td>' +
                        '<td style="white-space:nowrap;">' +
                            (canTransferLeadership(user) ? 
                                '<button class="btn btn-sm btn-teal" onclick="openTransferLeadership(\'' + org.id + '\', \'' + (org.name || '') + '\')" title="Передати лідерство" style="padding:0.25rem 0.7rem;font-size:0.7rem;"><i class="fas fa-user-crown"></i></button>' : ''
                            ) +
                            (canRenameOrg(user) ? 
                                '<button class="btn btn-sm btn-primary" onclick="renameOrg(\'' + org.id + '\', \'' + (org.name || '') + '\')" title="Перейменувати" style="padding:0.25rem 0.7rem;font-size:0.7rem;"><i class="fas fa-edit"></i></button>' : ''
                            ) +
                            (canFreezeOrg(user) ? 
                                (isActive ? 
                                    '<button class="btn btn-sm btn-warning" onclick="freezeOrg(\'' + org.id + '\')" title="Заморозити" style="padding:0.25rem 0.7rem;font-size:0.7rem;"><i class="fas fa-pause"></i></button>' :
                                    '<button class="btn btn-sm btn-teal" onclick="unfreezeOrg(\'' + org.id + '\')" title="Розморозити" style="padding:0.25rem 0.7rem;font-size:0.7rem;"><i class="fas fa-play"></i></button>'
                                ) : ''
                            ) +
                            (canDeleteOrg(user) ? 
                                '<button class="btn btn-sm btn-danger" onclick="deleteOrg(\'' + org.id + '\')" style="padding:0.25rem 0.7rem;font-size:0.7rem;"><i class="fas fa-trash"></i></button>' : ''
                            ) +
                        '</td>' +
                    '</tr>';
            }
        } else {
            html += '<tr><td colspan="6" class="text-center text-muted">Немає організацій</td></tr>';
        }

        html += 
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        container.innerHTML = html;
    } catch (error) {
        console.error('Load orgs error:', error);
        container.innerHTML = '<div class="card"><p class="text-danger">Помилка завантаження організацій</p></div>';
    }
}

function filterOrgsTable() {
    var searchInput = document.getElementById('orgSearchInput');
    var statusFilter = document.getElementById('orgStatusFilter');
    
    if (!searchInput) return;
    
    var query = searchInput.value.toLowerCase().trim();
    var status = statusFilter ? statusFilter.value : '';
    
    var rows = document.querySelectorAll('#orgsTableBody tr');
    rows.forEach(function(row) {
        var name = row.getAttribute('data-name') || '';
        var type = row.getAttribute('data-type') || '';
        var rowStatus = row.getAttribute('data-status') || '';
        
        var matchSearch = name.indexOf(query) !== -1 || type.indexOf(query) !== -1;
        var matchStatus = !status || rowStatus === status;
        
        if (matchSearch && matchStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

async function renameOrg(orgId, currentName) {
    var user = auth.getCurrentUser();
    if (!canRenameOrg(user)) {
        await showAlert('Тільки засновник може перейменовувати', 'error');
        return;
    }
    
    var newName = await showPrompt('Введіть нову назву організації:', currentName, 'Перейменування організації');
    if (newName === null) return;
    if (!newName || newName.trim() === '') {
        await showAlert('Введіть назву організації', 'warning');
        return;
    }
    
    var confirmed = await showConfirm('Змінити назву з "' + currentName + '" на "' + newName.trim() + '"?', 'Підтвердження');
    if (!confirmed) return;
    
    try {
        await db.updateOrganization(orgId, { name: newName.trim() });
        await db.addLog('Перейменовано організацію', 'organization', orgId, { old_name: currentName, new_name: newName.trim() });
        await showToast('Організацію перейменовано!', 'success');
        loadOrgs();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function openTransferLeadership(orgId, orgName) {
    var user = auth.getCurrentUser();
    if (!canTransferLeadership(user)) {
        await showAlert('Тільки засновник може передавати лідерство', 'error');
        return;
    }
    
    try {
        var members = await db.getOrganizationMembers(orgId);
        var users = await db.supabaseQuery('users?select=id,full_name,email');
        var userMap = {};
        for (var i = 0; i < users.length; i++) {
            userMap[users[i].id] = users[i].full_name || users[i].email || 'Користувач';
        }
        
        var currentLeader = await db.supabaseQuery('org_members?organization_id=eq.' + orgId + '&is_leader=eq.true');
        var currentLeaderId = currentLeader && currentLeader.length > 0 ? currentLeader[0].user_id : null;
        
        var options = '';
        for (var i = 0; i < members.length; i++) {
            var m = members[i];
            if (m.user_id === currentLeaderId) continue;
            var userName = userMap[m.user_id] || 'Невідомо';
            options += '<option value="' + m.id + '" data-user-id="' + m.user_id + '">' + userName + '</option>';
        }
        
        if (!options) {
            await showAlert('Немає інших учасників для передачі лідерства', 'warning');
            return;
        }
        
        var html = '';
        html += '<div style="margin-bottom:1rem;">';
        html += '<p>Передати лідерство в організації <strong>"' + orgName + '"</strong> іншому учаснику:</p>';
        html += '<select class="form-control" id="transferLeaderSelect" style="margin-top:0.5rem;">' + options + '</select>';
        html += '</div>';
        
        await showAlert(html, 'info', 'Передача лідерства');
        
        var select = document.getElementById('transferLeaderSelect');
        if (!select) return;
        
        var selectedMemberId = select.value;
        if (!selectedMemberId) return;
        
        var confirmed = await showConfirm('Ви впевнені, що хочете передати лідерство цьому учаснику?', 'Підтвердження');
        if (!confirmed) return;
        
        if (currentLeader && currentLeader.length > 0) {
            await db.supabaseQuery('org_members?id=eq.' + currentLeader[0].id, {
                method: 'PATCH',
                body: JSON.stringify({ is_leader: false })
            });
        }
        
        await db.supabaseQuery('org_members?id=eq.' + selectedMemberId, {
            method: 'PATCH',
            body: JSON.stringify({ is_leader: true })
        });
        
        await db.addLog('Передано лідерство в організації', 'organization', orgId, {});
        await showToast('Лідерство передано!', 'success');
        loadOrgs();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function freezeOrg(orgId) {
    var user = auth.getCurrentUser();
    if (!canFreezeOrg(user)) {
        await showAlert('Тільки засновник або адмін може заморожувати', 'error');
        return;
    }
    
    var reason = await showPrompt('Введіть причину заморозки організації:', 'Порушення правил', 'Заморозка організації');
    if (reason === null) return;
    if (!reason || reason.trim() === '') {
        await showAlert('Введіть причину заморозки', 'warning');
        return;
    }
    
    var confirmed = await showConfirm('Ви впевнені, що хочете заморозити цю організацію?', 'Підтвердження');
    if (!confirmed) return;
    
    try {
        await db.updateOrganization(orgId, { 
            is_active: false, 
            freeze_reason: reason.trim(),
            frozen_by: user.id,
            frozen_at: new Date().toISOString()
        });
        
        await db.addLog('Заморожено організацію', 'organization', orgId, { reason: reason.trim() });
        await showToast('Організацію заморожено!', 'success');
        loadOrgs();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function unfreezeOrg(orgId) {
    var user = auth.getCurrentUser();
    if (!canFreezeOrg(user)) {
        await showAlert('Тільки засновник або адмін може розморожувати', 'error');
        return;
    }
    
    var confirmed = await showConfirm('Розморозити цю організацію?', 'Підтвердження');
    if (!confirmed) return;
    
    try {
        await db.updateOrganization(orgId, { 
            is_active: true, 
            freeze_reason: null,
            frozen_by: null,
            frozen_at: null
        });
        
        await db.addLog('Розморожено організацію', 'organization', orgId, {});
        await showToast('Організацію розморожено!', 'success');
        loadOrgs();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function deleteOrg(id) {
    var user = auth.getCurrentUser();
    if (!canDeleteOrg(user)) {
        await showAlert('Тільки засновник або адмін може видаляти', 'error');
        return;
    }
    
    var confirmed = await showConfirm('Ви впевнені, що хочете видалити цю організацію? Всі дані будуть втрачені.', 'Увага');
    if (!confirmed) return;
    
    try {
        await db.deleteOrganization(id);
        await showToast('Організацію видалено', 'success');
        loadOrgs();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ============= ЧАТИ =============

async function loadChat() {
    var container = document.getElementById('adminContent');
    var user = auth.getCurrentUser();
    
    if (!canViewData(user)) {
        container.innerHTML = '<div class="card"><p class="text-danger">Немає доступу</p></div>';
        return;
    }
    
    try {
        var orgs = await db.supabaseQuery('organizations?select=id,name,is_active');
        
        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Чати організацій</h3>' +
                '</div>' +
                '<div class="search-filters">' +
                    '<div class="search-wrapper">' +
                        '<i class="fas fa-search search-icon"></i>' +
                        '<input type="text" class="search-input" id="chatSearchInput" placeholder="Пошук за назвою організації..." oninput="filterChatsTable()">' +
                        '<button class="search-clear" onclick="document.getElementById(\'chatSearchInput\').value=\'\';filterChatsTable();this.classList.remove(\'visible\');">' +
                            '<i class="fas fa-times"></i>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table" id="chatsTable">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Організація</th>' +
                                '<th>Статус</th>' +
                                '<th>Повідомлень</th>' +
                                '<th>Дії</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody id="chatsTableBody">';

        if (orgs && orgs.length > 0) {
            for (var i = 0; i < orgs.length; i++) {
                var org = orgs[i];
                var messages = await db.supabaseQuery('org_chat_messages?organization_id=eq.' + org.id);
                var count = messages ? messages.length : 0;
                var isActive = org.is_active !== false;
                
                html += 
                    '<tr data-name="' + (org.name || '').toLowerCase() + '">' +
                        '<td><strong>' + (org.name || 'Без назви') + '</strong></td>' +
                        '<td><span class="badge ' + (isActive ? 'badge-success' : 'badge-danger') + '">' + (isActive ? 'Активна' : 'Заморожена') + '</span></td>' +
                        '<td>' + count + '</td>' +
                        '<td>' +
                            '<button class="btn btn-sm btn-teal" onclick="viewChat(\'' + org.id + '\', \'' + (org.name || 'Без назви') + '\')" style="padding:0.25rem 0.7rem;font-size:0.7rem;"><i class="fas fa-eye"></i></button>' +
                        '</td>' +
                    '</tr>';
            }
        } else {
            html += '<tr><td colspan="4" class="text-center text-muted">Немає організацій</td></tr>';
        }

        html += 
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        container.innerHTML = html;
    } catch (error) {
        console.error('Load chat error:', error);
        container.innerHTML = '<div class="card"><p class="text-danger">Помилка завантаження чатів</p></div>';
    }
}

function filterChatsTable() {
    var searchInput = document.getElementById('chatSearchInput');
    if (!searchInput) return;
    
    var query = searchInput.value.toLowerCase().trim();
    var rows = document.querySelectorAll('#chatsTableBody tr');
    rows.forEach(function(row) {
        var name = row.getAttribute('data-name') || '';
        if (name.indexOf(query) !== -1) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

async function viewChat(orgId, orgName) {
    document.getElementById('chatModalTitle').textContent = 'Чат: ' + orgName;
    document.getElementById('chatModal').classList.add('active');
    
    try {
        var messages = await db.supabaseQuery('org_chat_messages?organization_id=eq.' + orgId + '&order=created_at.asc&limit=50');
        var container = document.getElementById('chatMessagesContainer');
        
        if (!messages || messages.length === 0) {
            container.innerHTML = '<p class="text-muted">Немає повідомлень</p>';
            return;
        }
        
        var users = await db.supabaseQuery('users?select=id,full_name,email');
        var userMap = {};
        if (users) {
            for (var i = 0; i < users.length; i++) {
                userMap[users[i].id] = users[i].full_name || users[i].email || 'Користувач';
            }
        }
        
        var html = '';
        for (var i = 0; i < messages.length; i++) {
            var msg = messages[i];
            var userName = userMap[msg.user_id] || 'Невідомий користувач';
            
            html += 
                '<div style="padding:0.75rem;border-bottom:1px solid var(--ink-line);">' +
                    '<div style="font-size:0.8rem;color:var(--gold);display:flex;justify-content:space-between;">' +
                        '<span><i class="fas fa-user"></i> ' + userName + '</span>' +
                        '<span style="color:var(--muted);font-size:0.7rem;">' + formatDateTimeKyiv(msg.created_at) + '</span>' +
                    '</div>' +
                    '<div style="margin-top:0.4rem;font-size:0.95rem;">' + (msg.message || '') + '</div>' +
                '</div>';
        }
        container.innerHTML = html;
    } catch (error) {
        console.error('View chat error:', error);
        document.getElementById('chatMessagesContainer').innerHTML = '<p class="text-danger">Помилка завантаження повідомлень</p>';
    }
}

// ============= ВІДПУСТКИ =============

async function loadVacations() {
    var container = document.getElementById('adminContent');
    var user = auth.getCurrentUser();
    
    if (!canViewData(user)) {
        container.innerHTML = '<div class="card"><p class="text-danger">Немає доступу</p></div>';
        return;
    }
    
    try {
        var orgs = await db.supabaseQuery('organizations?select=id,name,is_active');
        
        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Відпустки в організаціях</h3>' +
                '</div>' +
                '<div class="search-filters">' +
                    '<div class="search-wrapper">' +
                        '<i class="fas fa-search search-icon"></i>' +
                        '<input type="text" class="search-input" id="vacationSearchInput" placeholder="Пошук за назвою організації..." oninput="filterVacationsTable()">' +
                        '<button class="search-clear" onclick="document.getElementById(\'vacationSearchInput\').value=\'\';filterVacationsTable();this.classList.remove(\'visible\');">' +
                            '<i class="fas fa-times"></i>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table" id="vacationsTable">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Організація</th>' +
                                '<th>Статус</th>' +
                                '<th>Заявок</th>' +
                                '<th>Очікують</th>' +
                                '<th>Дії</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody id="vacationsTableBody">';

        if (orgs && orgs.length > 0) {
            for (var i = 0; i < orgs.length; i++) {
                var org = orgs[i];
                var vacations = await db.supabaseQuery('org_vacations?organization_id=eq.' + org.id);
                var count = vacations ? vacations.length : 0;
                var pending = vacations ? vacations.filter(function(v) { return v.status === 'pending'; }).length : 0;
                var isActive = org.is_active !== false;
                
                html += 
                    '<tr data-name="' + (org.name || '').toLowerCase() + '">' +
                        '<td><strong>' + (org.name || 'Без назви') + '</strong></td>' +
                        '<td><span class="badge ' + (isActive ? 'badge-success' : 'badge-danger') + '">' + (isActive ? 'Активна' : 'Заморожена') + '</span></td>' +
                        '<td>' + count + '</td>' +
                        '<td><span class="badge badge-warning">' + pending + '</span></td>' +
                        '<td>' +
                            '<button class="btn btn-sm btn-teal" onclick="viewVacations(\'' + org.id + '\', \'' + (org.name || 'Без назви') + '\')" style="padding:0.25rem 0.7rem;font-size:0.7rem;"><i class="fas fa-eye"></i></button>' +
                        '</td>' +
                    '</tr>';
            }
        } else {
            html += '<tr><td colspan="5" class="text-center text-muted">Немає організацій</td></tr>';
        }

        html += 
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        container.innerHTML = html;
    } catch (error) {
        console.error('Load vacations error:', error);
        container.innerHTML = '<div class="card"><p class="text-danger">Помилка завантаження відпусток</p></div>';
    }
}

function filterVacationsTable() {
    var searchInput = document.getElementById('vacationSearchInput');
    if (!searchInput) return;
    
    var query = searchInput.value.toLowerCase().trim();
    var rows = document.querySelectorAll('#vacationsTableBody tr');
    rows.forEach(function(row) {
        var name = row.getAttribute('data-name') || '';
        if (name.indexOf(query) !== -1) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

async function viewVacations(orgId, orgName) {
    document.getElementById('vacationModalTitle').textContent = 'Відпустки: ' + orgName;
    document.getElementById('vacationModal').classList.add('active');
    
    try {
        var vacations = await db.supabaseQuery('org_vacations?organization_id=eq.' + orgId + '&order=created_at.desc');
        var container = document.getElementById('vacationContainer');
        
        if (!vacations || vacations.length === 0) {
            container.innerHTML = '<p class="text-muted">Немає заявок на відпустку</p>';
            return;
        }
        
        var vacationStatusLabels = {
            'pending': 'Очікує',
            'approved': 'Схвалено',
            'rejected': 'Відхилено',
            'cancelled': 'Скасовано'
        };
        var vacationTypeLabels = {
            'annual': 'Щорічна',
            'sick': 'Лікарняний',
            'unpaid': 'Без збереження',
            'maternity': 'Декретна',
            'other': 'Інша'
        };
        
        var users = await db.supabaseQuery('users?select=id,full_name,email');
        var userMap = {};
        if (users) {
            for (var i = 0; i < users.length; i++) {
                userMap[users[i].id] = users[i].full_name || users[i].email || 'Користувач';
            }
        }
        
        var html = '<div style="overflow-x:auto;"><table class="table"><thead><tr><th>Користувач</th><th>Період</th><th>Тип</th><th>Статус</th></tr></thead><tbody>';
        
        for (var i = 0; i < vacations.length; i++) {
            var vac = vacations[i];
            var userName = userMap[vac.user_id] || 'Невідомий користувач';
            var statusClass = vac.status === 'pending' ? 'badge-warning' : 
                             vac.status === 'approved' ? 'badge-success' : 
                             vac.status === 'cancelled' ? 'badge-secondary' : 'badge-danger';
            
            html += 
                '<tr>' +
                    '<td><strong>' + userName + '</strong></td>' +
                    '<td>' + formatDateKyiv(vac.start_date) + ' - ' + formatDateKyiv(vac.end_date) + '</td>' +
                    '<td>' + (vacationTypeLabels[vac.type] || vac.type || '—') + '</td>' +
                    '<td><span class="badge ' + statusClass + '">' + (vacationStatusLabels[vac.status] || vac.status || '—') + '</span></td>' +
                '</tr>';
        }
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
    } catch (error) {
        console.error('View vacations error:', error);
        document.getElementById('vacationContainer').innerHTML = '<p class="text-danger">Помилка завантаження даних</p>';
    }
}

// ============= ЗАЯВКИ =============

async function loadRequests() {
    var container = document.getElementById('adminContent');
    var user = auth.getCurrentUser();
    
    if (!canViewData(user)) {
        container.innerHTML = '<div class="card"><p class="text-danger">Немає доступу</p></div>';
        return;
    }
    
    try {
        var requests = await db.supabaseQuery('join_requests?select=*');
        
        var users = await db.supabaseQuery('users?select=id,full_name,email');
        var userMap = {};
        if (users) {
            for (var i = 0; i < users.length; i++) {
                userMap[users[i].id] = users[i].full_name || users[i].email || 'Невідомо';
            }
        }
        
        var orgs = await db.supabaseQuery('organizations?select=id,name');
        var orgMap = {};
        if (orgs) {
            for (var i = 0; i < orgs.length; i++) {
                orgMap[orgs[i].id] = orgs[i].name || 'Без назви';
            }
        }
        
        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Всі заявки на вступ</h3>' +
                    '<span class="badge badge-primary">' + (requests ? requests.length : 0) + '</span>' +
                '</div>' +
                '<div class="search-filters">' +
                    '<div class="search-wrapper">' +
                        '<i class="fas fa-search search-icon"></i>' +
                        '<input type="text" class="search-input" id="requestSearchInput" placeholder="Пошук за користувачем або організацією..." oninput="filterRequestsTable()">' +
                        '<button class="search-clear" onclick="document.getElementById(\'requestSearchInput\').value=\'\';filterRequestsTable();this.classList.remove(\'visible\');">' +
                            '<i class="fas fa-times"></i>' +
                        '</button>' +
                    '</div>' +
                    '<select class="filter-select" id="requestStatusFilter" onchange="filterRequestsTable()">' +
                        '<option value="">Всі статуси</option>' +
                        '<option value="pending">Очікує</option>' +
                        '<option value="approved">Схвалено</option>' +
                        '<option value="rejected">Відхилено</option>' +
                    '</select>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table" id="requestsTable">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Користувач</th>' +
                                '<th>Організація</th>' +
                                '<th>Повідомлення</th>' +
                                '<th>Статус</th>' +
                                '<th>Дата</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody id="requestsTableBody">';

        if (requests && requests.length > 0) {
            var statusLabels = {
                'pending': 'Очікує',
                'approved': 'Схвалено',
                'rejected': 'Відхилено'
            };
            
            for (var i = 0; i < requests.length; i++) {
                var req = requests[i];
                var userName = userMap[req.user_id] || 'Невідомо';
                var orgName = orgMap[req.organization_id] || '—';
                var statusClass = req.status === 'pending' ? 'badge-warning' : 
                                 req.status === 'approved' ? 'badge-success' : 'badge-danger';
                var statusValue = req.status || 'pending';
                
                html += 
                    '<tr data-user="' + userName.toLowerCase() + '" data-org="' + orgName.toLowerCase() + '" data-status="' + statusValue + '">' +
                        '<td><strong>' + userName + '</strong></td>' +
                        '<td>' + orgName + '</td>' +
                        '<td>' + (req.message || 'Без повідомлення') + '</td>' +
                        '<td><span class="badge ' + statusClass + '">' + (statusLabels[req.status] || req.status) + '</span></td>' +
                        '<td>' + formatDateKyiv(req.created_at) + '</td>' +
                    '</tr>';
            }
        } else {
            html += '<tr><td colspan="5" class="text-center text-muted">Немає заявок</td></tr>';
        }

        html += 
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        container.innerHTML = html;
    } catch (error) {
        console.error('Load requests error:', error);
        container.innerHTML = '<div class="card"><p class="text-danger">Помилка завантаження заявок</p></div>';
    }
}

function filterRequestsTable() {
    var searchInput = document.getElementById('requestSearchInput');
    var statusFilter = document.getElementById('requestStatusFilter');
    
    if (!searchInput) return;
    
    var query = searchInput.value.toLowerCase().trim();
    var status = statusFilter ? statusFilter.value : '';
    
    var rows = document.querySelectorAll('#requestsTableBody tr');
    rows.forEach(function(row) {
        var userName = row.getAttribute('data-user') || '';
        var orgName = row.getAttribute('data-org') || '';
        var rowStatus = row.getAttribute('data-status') || '';
        
        var matchSearch = userName.indexOf(query) !== -1 || orgName.indexOf(query) !== -1;
        var matchStatus = !status || rowStatus === status;
        
        if (matchSearch && matchStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// ============= ЛОГИ =============

async function loadLogs() {
    var container = document.getElementById('adminContent');
    var user = auth.getCurrentUser();
    
    if (!canViewData(user)) {
        container.innerHTML = '<div class="card"><p class="text-danger">Немає доступу</p></div>';
        return;
    }
    
    try {
        var logs = await db.supabaseQuery('activity_logs?order=created_at.desc&limit=200');
        
        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Всі логи системи</h3>' +
                    '<span class="badge badge-primary">' + (logs ? logs.length : 0) + '</span>' +
                '</div>' +
                '<div class="search-filters">' +
                    '<div class="search-wrapper">' +
                        '<i class="fas fa-search search-icon"></i>' +
                        '<input type="text" class="search-input" id="logSearchInput" placeholder="Пошук за користувачем, дією або типом..." oninput="filterLogsTable()">' +
                        '<button class="search-clear" onclick="document.getElementById(\'logSearchInput\').value=\'\';filterLogsTable();this.classList.remove(\'visible\');">' +
                            '<i class="fas fa-times"></i>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table" id="logsTable">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Час</th>' +
                                '<th>Користувач</th>' +
                                '<th>Дія</th>' +
                                '<th>Тип</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody id="logsTableBody">';

        if (logs && logs.length > 0) {
            var users = await db.supabaseQuery('users?select=id,full_name,email');
            var userMap = {};
            if (users) {
                for (var i = 0; i < users.length; i++) {
                    userMap[users[i].id] = users[i].full_name || users[i].email || 'Невідомо';
                }
            }
            
            for (var i = 0; i < logs.length; i++) {
                var log = logs[i];
                var userName = log.user_name || userMap[log.user_id] || 'Система';
                var action = log.action || '—';
                var entity = log.entity_type || '—';
                
                html += 
                    '<tr data-user="' + userName.toLowerCase() + '" data-action="' + action.toLowerCase() + '" data-entity="' + entity.toLowerCase() + '">' +
                        '<td>' + formatDateTimeKyiv(log.created_at) + '</td>' +
                        '<td><strong>' + userName + '</strong></td>' +
                        '<td><span class="badge badge-primary">' + action + '</span></td>' +
                        '<td>' + entity + '</td>' +
                    '</tr>';
            }
        } else {
            html += '<tr><td colspan="4" class="text-center text-muted">Немає логів</td></tr>';
        }

        html += 
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        container.innerHTML = html;
    } catch (error) {
        console.error('Load logs error:', error);
        container.innerHTML = '<div class="card"><p class="text-danger">Помилка завантаження логів</p></div>';
    }
}

function filterLogsTable() {
    var searchInput = document.getElementById('logSearchInput');
    if (!searchInput) return;
    
    var query = searchInput.value.toLowerCase().trim();
    var rows = document.querySelectorAll('#logsTableBody tr');
    rows.forEach(function(row) {
        var userName = row.getAttribute('data-user') || '';
        var action = row.getAttribute('data-action') || '';
        var entity = row.getAttribute('data-entity') || '';
        
        var matchSearch = userName.indexOf(query) !== -1 || action.indexOf(query) !== -1 || entity.indexOf(query) !== -1;
        
        if (matchSearch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}
