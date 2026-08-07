// ============================================
// TYPEBIZ - АДМІН-ПАНЕЛЬ (ПОВНА ВЕРСІЯ)
// ============================================

async function loadStats() {
    try {
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
        var logs = await db.supabaseQuery('activity_logs?order=created_at.desc&limit=20');
        var container = document.getElementById('recentLogs');

        if (!logs || logs.length === 0) {
            container.innerHTML = '<p class="text-muted">Логів поки немає</p>';
            return;
        }

        var html = '<div style="overflow-x:auto;"><table class="table"><thead><tr><th>Час</th><th>Дія</th><th>Тип</th></tr></thead><tbody>';
        
        for (var i = 0; i < logs.length; i++) {
            var log = logs[i];
            var date = new Date(log.created_at).toLocaleString('uk-UA');
            html += '<tr>' +
                '<td style="font-size:0.85rem;">' + date + '</td>' +
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

async function loadUsers() {
    var container = document.getElementById('adminContent');
    
    try {
        var users = await db.supabaseQuery('users?select=*');
        
        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Всі користувачі</h3>' +
                    '<span class="badge badge-primary">' + (users ? users.length : 0) + '</span>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Ім\'я</th>' +
                                '<th>Email</th>' +
                                '<th>Роль</th>' +
                                '<th>Дії</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>';

        if (users && users.length > 0) {
            for (var i = 0; i < users.length; i++) {
                var user = users[i];
                var isAdmin = user.role === 'admin';
                
                html += 
                    '<tr>' +
                        '<td><strong>' + (user.full_name || 'Без імені') + '</strong></td>' +
                        '<td>' + (user.email || '—') + '</td>' +
                        '<td><span class="badge ' + (isAdmin ? 'badge-danger' : 'badge-primary') + '">' + (user.role || 'user') + '</span></td>' +
                        '<td>' +
                            (isAdmin ? 
                                '<button class="btn btn-sm btn-warning" onclick="removeAdmin(\'' + user.id + '\')" title="Зняти адміністратора">' +
                                    '<i class="fas fa-user-minus"></i>' +
                                '</button>' :
                                '<button class="btn btn-sm btn-teal" onclick="makeAdmin(\'' + user.id + '\')" title="Зробити адміністратором">' +
                                    '<i class="fas fa-user-crown"></i>' +
                                '</button>' +
                                '<button class="btn btn-sm btn-danger" onclick="deleteUser(\'' + user.id + '\')">' +
                                    '<i class="fas fa-trash"></i>' +
                                '</button>'
                            ) +
                        '</td>' +
                    '</tr>';
            }
        } else {
            html += '<tr><td colspan="4" class="text-center text-muted">Немає користувачів</td></tr>';
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

async function loadOrgs() {
    var container = document.getElementById('adminContent');
    
    try {
        var orgs = await db.supabaseQuery('organizations?select=*');
        
        // Отримуємо інформацію про користувачів окремо
        var users = await db.supabaseQuery('users?select=id,full_name,email');
        var userMap = {};
        if (users) {
            for (var i = 0; i < users.length; i++) {
                userMap[users[i].id] = users[i].full_name || users[i].email || 'Невідомо';
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
                '<div style="overflow-x:auto;">' +
                    '<table class="table">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Назва</th>' +
                                '<th>Тип</th>' +
                                '<th>Код</th>' +
                                '<th>Створив</th>' +
                                '<th>Статус</th>' +
                                '<th>Дії</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>';

        if (orgs && orgs.length > 0) {
            for (var i = 0; i < orgs.length; i++) {
                var org = orgs[i];
                var creatorName = userMap[org.created_by] || 'Невідомо';
                
                html += 
                    '<tr>' +
                        '<td><strong>' + (org.name || 'Без назви') + '</strong></td>' +
                        '<td>' + (typeLabels[org.type] || org.type || '—') + '</td>' +
                        '<td style="font-family:monospace;font-size:0.8rem;text-transform:lowercase;">' + (org.join_code || '—') + '</td>' +
                        '<td>' + creatorName + '</td>' +
                        '<td><span class="badge ' + (org.is_active !== false ? 'badge-success' : 'badge-danger') + '">' + (org.is_active !== false ? 'Активна' : 'Неактивна') + '</span></td>' +
                        '<td>' +
                            '<button class="btn btn-sm btn-outline" onclick="toggleOrg(\'' + org.id + '\', ' + (org.is_active !== false ? 'false' : 'true') + ')">' +
                                '<i class="fas ' + (org.is_active !== false ? 'fa-pause' : 'fa-play') + '"></i>' +
                            '</button>' +
                            '<button class="btn btn-sm btn-danger" onclick="deleteOrg(\'' + org.id + '\')">' +
                                '<i class="fas fa-trash"></i>' +
                            '</button>' +
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

async function loadChat() {
    var container = document.getElementById('adminContent');
    
    try {
        var orgs = await db.supabaseQuery('organizations?select=id,name');
        
        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Чати організацій</h3>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Організація</th>' +
                                '<th>Повідомлень</th>' +
                                '<th>Дії</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>';

        if (orgs && orgs.length > 0) {
            for (var i = 0; i < orgs.length; i++) {
                var org = orgs[i];
                var messages = await db.supabaseQuery('org_chat_messages?organization_id=eq.' + org.id);
                var count = messages ? messages.length : 0;
                
                html += 
                    '<tr>' +
                        '<td><strong>' + (org.name || 'Без назви') + '</strong></td>' +
                        '<td>' + count + '</td>' +
                        '<td>' +
                            '<button class="btn btn-sm btn-teal" onclick="viewChat(\'' + org.id + '\', \'' + (org.name || 'Без назви') + '\')">' +
                                '<i class="fas fa-eye"></i> Переглянути' +
                            '</button>' +
                        '</td>' +
                    '</tr>';
            }
        } else {
            html += '<tr><td colspan="3" class="text-center text-muted">Немає організацій</td></tr>';
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
                        '<span style="color:var(--muted);font-size:0.7rem;">' + new Date(msg.created_at).toLocaleString('uk-UA') + '</span>' +
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

async function loadVacations() {
    var container = document.getElementById('adminContent');
    
    try {
        var orgs = await db.supabaseQuery('organizations?select=id,name');
        
        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Відпустки в організаціях</h3>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Організація</th>' +
                                '<th>Заявок</th>' +
                                '<th>Очікують</th>' +
                                '<th>Дії</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>';

        if (orgs && orgs.length > 0) {
            for (var i = 0; i < orgs.length; i++) {
                var org = orgs[i];
                var vacations = await db.supabaseQuery('org_vacations?organization_id=eq.' + org.id);
                var count = vacations ? vacations.length : 0;
                var pending = vacations ? vacations.filter(function(v) { return v.status === 'pending'; }).length : 0;
                
                html += 
                    '<tr>' +
                        '<td><strong>' + (org.name || 'Без назви') + '</strong></td>' +
                        '<td>' + count + '</td>' +
                        '<td><span class="badge badge-warning">' + pending + '</span></td>' +
                        '<td>' +
                            '<button class="btn btn-sm btn-teal" onclick="viewVacations(\'' + org.id + '\', \'' + (org.name || 'Без назви') + '\')">' +
                                '<i class="fas fa-eye"></i> Переглянути' +
                            '</button>' +
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
        console.error('Load vacations error:', error);
        container.innerHTML = '<div class="card"><p class="text-danger">Помилка завантаження відпусток</p></div>';
    }
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
                    '<td>' + new Date(vac.start_date).toLocaleDateString('uk-UA') + ' - ' + new Date(vac.end_date).toLocaleDateString('uk-UA') + '</td>' +
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

async function loadRequests() {
    var container = document.getElementById('adminContent');
    
    try {
        var requests = await db.supabaseQuery('join_requests?select=*');
        
        // Отримуємо інформацію про користувачів та організації
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
                '<div style="overflow-x:auto;">' +
                    '<table class="table">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Користувач</th>' +
                                '<th>Організація</th>' +
                                '<th>Повідомлення</th>' +
                                '<th>Статус</th>' +
                                '<th>Дата</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>';

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
                
                html += 
                    '<tr>' +
                        '<td><strong>' + userName + '</strong></td>' +
                        '<td>' + orgName + '</td>' +
                        '<td>' + (req.message || 'Без повідомлення') + '</td>' +
                        '<td><span class="badge ' + statusClass + '">' + (statusLabels[req.status] || req.status) + '</span></td>' +
                        '<td>' + new Date(req.created_at).toLocaleDateString('uk-UA') + '</td>' +
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

async function loadLogs() {
    var container = document.getElementById('adminContent');
    
    try {
        var logs = await db.supabaseQuery('activity_logs?order=created_at.desc&limit=100');
        
        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Всі логи системи</h3>' +
                    '<span class="badge badge-primary">' + (logs ? logs.length : 0) + '</span>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Час</th>' +
                                '<th>Дія</th>' +
                                '<th>Тип</th>' +
                                '<th>Користувач</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>';

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
                var userName = userMap[log.user_id] || 'Система';
                html += 
                    '<tr>' +
                        '<td>' + new Date(log.created_at).toLocaleString('uk-UA') + '</td>' +
                        '<td><span class="badge badge-primary">' + (log.action || '—') + '</span></td>' +
                        '<td>' + (log.entity_type || '—') + '</td>' +
                        '<td>' + userName + '</td>' +
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
    
    switch(section) {
        case 'overview':
            loadOverview();
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

// ===== УПРАВЛІННЯ РОЛЯМИ (АДМІН) =====
async function makeAdmin(userId) {
    var confirmed = await showConfirm('Зробити цього користувача адміністратором? Він зможе створювати безліміт організацій.', 'Підтвердження');
    if (!confirmed) return;
    
    try {
        await db.setUserRole(userId, 'admin');
        await showToast('Користувача підвищено до адміністратора!', 'success');
        loadUsers();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function removeAdmin(userId) {
    var confirmed = await showConfirm('Зняти роль адміністратора з цього користувача?', 'Підтвердження');
    if (!confirmed) return;
    
    try {
        await db.setUserRole(userId, 'user');
        await showToast('Роль адміністратора знято!', 'success');
        loadUsers();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function deleteUser(id) {
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

async function toggleOrg(id, newStatus) {
    try {
        await db.updateOrganization(id, { is_active: newStatus });
        await showToast('Статус оновлено!', 'success');
        loadOrgs();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function deleteOrg(id) {
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

(async function init() {
    var hasAccess = await auth.requireAdmin();
    if (!hasAccess) return;

    await loadStats();
    await loadOverview();
})();
