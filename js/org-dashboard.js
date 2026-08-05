// ============================================
// TYPEBIZ - ДАШБОРД ОРГАНІЗАЦІЇ (ПОВНА ВЕРСІЯ)
// ============================================

var currentOrgId = null;
var currentOrg = null;

var typeLabels = {
    'shop': 'Магазин',
    'library': 'Бібліотека',
    'company': 'Компанія',
    'school': 'Школа',
    'clinic': 'Клініка',
    'restaurant': 'Ресторан',
    'cafe': 'Кафе',
    'hotel': 'Готель',
    'gym': 'Спортзал',
    'beauty': 'Салон краси',
    'auto': 'Автосервіс',
    'realty': 'Нерухомість',
    'it': 'IT-компанія',
    'marketing': 'Маркетинг',
    'legal': 'Юридична',
    'finance': 'Фінанси',
    'education': 'Освіта',
    'medical': 'Медицина',
    'sport': 'Спорт',
    'art': 'Мистецтво',
    'music': 'Музика',
    'photo': 'Фото',
    'video': 'Відео',
    'construction': 'Будівництво',
    'repair': 'Ремонт',
    'cleaning': 'Клінінг',
    'delivery': 'Доставка',
    'logistics': 'Логістика',
    'agriculture': 'Сільське господарство',
    'tourism': 'Туризм',
    'event': 'Івент',
    'charity': 'Благодійність',
    'government': 'Державна',
    'gamedev': 'GameDev',
    'indie': 'Інді-розробка',
    'publishing': 'Видавництво',
    'animation': 'Анімація',
    'vr': 'VR/AR',
    'esports': 'Кіберспорт',
    'streaming': 'Стримінг',
    'podcast': 'Подкаст',
    'blogging': 'Блогінг',
    'social': 'Соцмережі',
    'startup': 'Стартап',
    'agency': 'Агентство',
    'consulting': 'Консалтинг',
    'freelance': 'Фриланс',
    'remote': 'Віддалена робота',
    'coworking': 'Коворкінг',
    'incubator': 'Інкубатор',
    'accelerator': 'Акселератор',
    'venture': 'Венчур',
    'nonprofit': 'Некомерційна',
    'community': 'Спільнота',
    'religious': 'Релігійна',
    'cultural': 'Культурна',
    'research': 'Дослідження',
    'science': 'Наука',
    'space': 'Космос',
    'robotics': 'Робототехніка',
    'ai': 'ШІ',
    'blockchain': 'Блокчейн',
    'crypto': 'Криптовалюта',
    'defi': 'DeFi',
    'nft': 'NFT',
    'metaverse': 'Метавсесвіт',
    'web3': 'Web3',
    'other': 'Інше'
};

var statusLabels = {
    'pending': '⏳ Очікує',
    'approved': '✅ Схвалено',
    'rejected': '❌ Відхилено'
};

var vacationStatusLabels = {
    'pending': '⏳ Очікує',
    'approved': '✅ Схвалено',
    'rejected': '❌ Відхилено',
    'cancelled': '🚫 Скасовано'
};

var vacationTypeLabels = {
    'annual': 'Щорічна',
    'sick': 'Лікарняний',
    'unpaid': 'Без збереження',
    'maternity': 'Декретна',
    'other': 'Інша'
};

function debugLog(message, data) {
    if (data === undefined) data = null;
    console.log('[ORG] ' + message, data || '');
}

async function init() {
    var isAuth = await auth.requireAuth();
    if (!isAuth) return;
    await loadOrganization();
}

function getOrgIdFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function loadOrganization() {
    var orgId = getOrgIdFromUrl();
    if (!orgId) {
        window.location.href = '/dashboard';
        return;
    }

    currentOrgId = orgId;
    
    try {
        currentOrg = await db.getOrganization(orgId);
    } catch (error) {
        debugLog('Помилка завантаження:', error);
        await showAlert('Помилка завантаження організації', 'error');
        window.location.href = '/dashboard';
        return;
    }

    if (!currentOrg) {
        await showAlert('Організацію не знайдено', 'error');
        window.location.href = '/dashboard';
        return;
    }

    document.getElementById('orgName').textContent = currentOrg.name;
    document.getElementById('orgType').textContent = typeLabels[currentOrg.type] || currentOrg.type;
    document.getElementById('joinCode').textContent = currentOrg.join_code || '---';

    loadSection('overview');
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

    switch (section) {
        case 'overview': loadOverview(); break;
        case 'members': loadMembers(); break;
        case 'requests': loadRequests(); break;
        case 'ranks': loadRanks(); break;
        case 'departments': loadDepartments(); break;
        case 'chat': loadChat(); break;
        case 'vacations': loadVacations(); break;
        case 'settings': loadSettings(); break;
        default: loadOverview();
    }
}

// ========== ОГЛЯД ==========
async function loadOverview() {
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Огляд';
    document.getElementById('pageSubtitle').textContent = 'Управління організацією "' + (currentOrg ? currentOrg.name : '') + '"';

    try {
        var members = await db.getOrganizationMembers(currentOrgId);
        var ranks = await db.getOrganizationRanks(currentOrgId);
        var requests = await db.getJoinRequests(currentOrgId);

        var pendingCount = 0;
        if (requests) {
            for (var i = 0; i < requests.length; i++) {
                if (requests[i].status === 'pending') pendingCount++;
            }
        }

        container.innerHTML = 
            '<div class="grid-4">' +
                '<div class="stat-card">' +
                    '<div class="stat-value">' + (members ? members.length : 0) + '</div>' +
                    '<div class="stat-label">Учасників</div>' +
                '</div>' +
                '<div class="stat-card" style="border-color: var(--teal);">' +
                    '<div class="stat-value">' + (ranks ? ranks.length : 0) + '</div>' +
                    '<div class="stat-label">Посад</div>' +
                '</div>' +
                '<div class="stat-card" style="border-color: #F59E0B;">' +
                    '<div class="stat-value">' + pendingCount + '</div>' +
                    '<div class="stat-label">Очікують заявки</div>' +
                '</div>' +
                '<div class="stat-card" style="border-color: var(--muted);">' +
                    '<div class="stat-value" style="font-family:monospace;font-size:1.5rem;letter-spacing:3px;text-transform:lowercase;">' + (currentOrg ? currentOrg.join_code || '---' : '---') + '</div>' +
                    '<div class="stat-label">Код вступу</div>' +
                '</div>' +
            '</div>' +
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Інформація про організацію</h3>' +
                '</div>' +
                '<div class="grid-2">' +
                    '<div>' +
                        '<p><strong>Назва:</strong> ' + (currentOrg ? currentOrg.name : '') + '</p>' +
                        '<p><strong>Тип:</strong> ' + (currentOrg ? (typeLabels[currentOrg.type] || currentOrg.type) : '') + '</p>' +
                        '<p><strong>Опис:</strong> ' + (currentOrg ? (currentOrg.description || 'Немає опису') : '') + '</p>' +
                    '</div>' +
                    '<div>' +
                        '<p><strong>Код вступу:</strong> <span style="font-family:monospace;font-size:1.2rem;letter-spacing:2px;background:var(--ink);padding:0.2rem 0.8rem;border-radius:var(--radius-sm);color:var(--gold);text-transform:lowercase;">' + (currentOrg ? currentOrg.join_code || '---' : '---') + '</span></p>' +
                        '<p><strong>Створено:</strong> ' + (currentOrg ? new Date(currentOrg.created_at).toLocaleDateString('uk-UA') : '') + '</p>' +
                    '</div>' +
                '</div>' +
            '</div>';
    } catch (error) {
        debugLog('Помилка:', error);
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

// ========== УЧАСНИКИ ==========
async function loadMembers() {
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Учасники';
    document.getElementById('pageSubtitle').textContent = 'Управління учасниками організації';

    try {
        var members = await db.getOrganizationMembers(currentOrgId);
        var ranks = await db.getOrganizationRanks(currentOrgId);
        var user = auth.getCurrentUser();

        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Список учасників (' + (members ? members.length : 0) + ')</h3>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Користувач</th>' +
                                '<th>Посада</th>' +
                                '<th>Дата вступу</th>' +
                                '<th>Дії</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>';

        if (members && members.length > 0) {
            for (var i = 0; i < members.length; i++) {
                var member = members[i];
                try {
                    var userData = await db.supabaseQuery('users?id=eq.' + member.user_id);
                    var userName = userData && userData.length > 0 ? (userData[0].full_name || userData[0].email) : 'Невідомо';
                    var rank = null;
                    if (ranks) {
                        for (var r = 0; r < ranks.length; r++) {
                            if (ranks[r].id === member.rank_id) {
                                rank = ranks[r];
                                break;
                            }
                        }
                    }
                    var isLeader = currentOrg && currentOrg.leader_id === member.user_id;

                    html += 
                        '<tr>' +
                            '<td><strong>' + userName + (isLeader ? ' 👑' : '') + '</strong></td>' +
                            '<td>' + (rank ? '<span style="color:' + rank.color + '">' + rank.name + '</span>' : 'Без посади') + '</td>' +
                            '<td>' + new Date(member.joined_at).toLocaleDateString('uk-UA') + '</td>' +
                            '<td>' + (!isLeader && currentOrg && currentOrg.leader_id === (user ? user.id : null) ? 
                                '<button class="btn btn-sm btn-teal" onclick="openAssignRank(\'' + member.id + '\', \'' + userName + '\')">' +
                                    '<i class="fas fa-crown"></i>' +
                                '</button>' +
                                '<button class="btn btn-sm btn-danger" onclick="removeMember(\'' + member.id + '\')">' +
                                    '<i class="fas fa-times"></i>' +
                                '</button>' : '—') + '</td>' +
                        '</tr>';
                } catch (e) {
                    debugLog('Помилка завантаження користувача:', e);
                }
            }
        } else {
            html += '<tr><td colspan="4" class="text-center text-muted">Немає учасників</td></tr>';
        }

        html += 
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        container.innerHTML = html;
    } catch (error) {
        debugLog('Помилка:', error);
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

// ========== ЗАЯВКИ ==========
async function loadRequests() {
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Заявки на вступ';
    document.getElementById('pageSubtitle').textContent = 'Управління заявками';

    try {
        var requests = await db.getJoinRequests(currentOrgId);
        var user = auth.getCurrentUser();

        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Заявки (' + (requests ? requests.length : 0) + ')</h3>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Користувач</th>' +
                                '<th>Повідомлення</th>' +
                                '<th>Статус</th>' +
                                '<th>Дата</th>' +
                                '<th>Дії</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>';

        if (requests && requests.length > 0) {
            for (var i = 0; i < requests.length; i++) {
                var req = requests[i];
                try {
                    var userData = await db.supabaseQuery('users?id=eq.' + req.user_id);
                    var userName = userData && userData.length > 0 ? (userData[0].full_name || userData[0].email) : 'Невідомо';

                    var isPending = req.status === 'pending';
                    var isLeader = currentOrg && currentOrg.leader_id === (user ? user.id : null);

                    var statusClass = req.status === 'pending' ? 'badge-warning' : 
                                      req.status === 'approved' ? 'badge-success' : 'badge-danger';

                    html += 
                        '<tr>' +
                            '<td><strong>' + userName + '</strong></td>' +
                            '<td>' + (req.message || 'Без повідомлення') + '</td>' +
                            '<td><span class="badge ' + statusClass + '">' + (statusLabels[req.status] || req.status) + '</span></td>' +
                            '<td>' + new Date(req.created_at).toLocaleDateString('uk-UA') + '</td>' +
                            '<td>' + (isPending && isLeader ? 
                                '<button class="btn btn-sm btn-teal" onclick="handleRequest(\'' + req.id + '\', \'approved\')">' +
                                    '<i class="fas fa-check"></i>' +
                                '</button>' +
                                '<button class="btn btn-sm btn-danger" onclick="handleRequest(\'' + req.id + '\', \'rejected\')">' +
                                    '<i class="fas fa-times"></i>' +
                                '</button>' : (isPending ? '⏳' : '—')) + '</td>' +
                        '</tr>';
                } catch (e) {
                    debugLog('Помилка завантаження користувача:', e);
                }
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
        debugLog('Помилка:', error);
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

async function handleRequest(requestId, status) {
    try {
        await db.updateJoinRequest(requestId, status);

        if (status === 'approved') {
            var request = await db.supabaseQuery('join_requests?id=eq.' + requestId);
            if (request && request.length > 0) {
                await db.addMemberToOrganization(request[0].organization_id, request[0].user_id);
                await showToast('Заявку схвалено! Користувача додано.', 'success');
            }
        } else {
            await showToast('Заявку відхилено.', 'warning');
        }

        loadRequests();
        loadOverview();
    } catch (error) {
        debugLog('Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function removeMember(memberId) {
    var confirmed = await showConfirm('Ви впевнені, що хочете видалити цього учасника?', 'Підтвердження');
    if (!confirmed) return;

    try {
        await db.removeMemberFromOrganization(memberId);
        await showToast('Учасника видалено', 'success');
        loadMembers();
        loadOverview();
    } catch (error) {
        debugLog('Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ========== ПОСАДИ ==========
async function loadRanks() {
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Посади';
    document.getElementById('pageSubtitle').textContent = 'Управління посадами в організації';

    try {
        var ranks = await db.getOrganizationRanks(currentOrgId);
        var user = auth.getCurrentUser();
        var canManage = currentOrg && currentOrg.leader_id === (user ? user.id : null);

        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Посади (' + (ranks ? ranks.length : 0) + ')</h3>' +
                    (canManage ? 
                        '<button class="btn btn-gold btn-sm" onclick="openCreateRank()">' +
                            '<i class="fas fa-plus"></i> Створити посаду' +
                        '</button>' : '') +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Назва</th>' +
                                '<th>Колір</th>' +
                                '<th>Дії</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>';

        if (ranks && ranks.length > 0) {
            for (var i = 0; i < ranks.length; i++) {
                var rank = ranks[i];
                var isDefault = ['Директор', 'Адміністратор', 'Менеджер', 'Старший учасник', 'Учасник'].indexOf(rank.name) !== -1;

                html += 
                    '<tr>' +
                        '<td><strong>' + rank.name + '</strong></td>' +
                        '<td><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:' + rank.color + ';"></span> ' + rank.color + '</td>' +
                        '<td>' + ((!isDefault || rank.name === 'Директор') && canManage ? 
                            '<button class="btn btn-sm btn-teal" onclick="openEditRank(\'' + rank.id + '\')">' +
                                '<i class="fas fa-edit"></i>' +
                            '</button>' : '') +
                            (!isDefault && canManage ? 
                                '<button class="btn btn-sm btn-danger" onclick="deleteRank(\'' + rank.id + '\')">' +
                                    '<i class="fas fa-trash"></i>' +
                                '</button>' : '') + '</td>' +
                    '</tr>';
            }
        } else {
            html += '<tr><td colspan="3" class="text-center text-muted">Немає посад</td></tr>';
        }

        html += 
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        container.innerHTML = html;
    } catch (error) {
        debugLog('Помилка:', error);
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function openCreateRank() {
    document.getElementById('rankModalTitle').textContent = 'Створити посаду';
    document.getElementById('rankSubmitText').textContent = 'Створити';
    document.getElementById('rankEditId').value = '';
    document.getElementById('rankName').value = '';
    document.getElementById('rankColor').value = '#F2A93B';
    
    var checkboxes = document.querySelectorAll('.rank-permission');
    for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = false;
    }
    
    var options = document.querySelectorAll('.color-option');
    for (var j = 0; j < options.length; j++) {
        options[j].classList.remove('selected');
    }
    var firstOption = document.querySelector('.color-option');
    if (firstOption) firstOption.classList.add('selected');
    
    document.getElementById('rankModal').classList.add('active');
}

async function openEditRank(rankId) {
    try {
        var ranks = await db.getOrganizationRanks(currentOrgId);
        var rank = null;
        for (var i = 0; i < ranks.length; i++) {
            if (ranks[i].id === rankId) {
                rank = ranks[i];
                break;
            }
        }
        if (!rank) return;

        document.getElementById('rankModalTitle').textContent = 'Редагувати посаду';
        document.getElementById('rankSubmitText').textContent = 'Зберегти';
        document.getElementById('rankEditId').value = rank.id;
        document.getElementById('rankName').value = rank.name;
        document.getElementById('rankColor').value = rank.color;
        
        var permissions = rank.permissions || {};
        var checkboxes = document.querySelectorAll('.rank-permission');
        for (var j = 0; j < checkboxes.length; j++) {
            checkboxes[j].checked = permissions[checkboxes[j].value] === true;
        }
        
        var options = document.querySelectorAll('.color-option');
        for (var k = 0; k < options.length; k++) {
            options[k].classList.toggle('selected', options[k].style.backgroundColor === rank.color);
        }
        
        document.getElementById('rankModal').classList.add('active');
    } catch (error) {
        debugLog('Помилка:', error);
        await showAlert('Помилка завантаження посади', 'error');
    }
}

async function deleteRank(rankId) {
    var confirmed = await showConfirm('Ви впевнені, що хочете видалити цю посаду?', 'Підтвердження');
    if (!confirmed) return;

    try {
        await db.deleteRank(rankId);
        await showToast('Посаду видалено', 'success');
        loadRanks();
    } catch (error) {
        debugLog('Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

document.getElementById('rankForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    var editId = document.getElementById('rankEditId').value;
    var name = document.getElementById('rankName').value.trim();
    var color = document.getElementById('rankColor').value;

    var permissions = {};
    var checkboxes = document.querySelectorAll('.rank-permission:checked');
    for (var i = 0; i < checkboxes.length; i++) {
        permissions[checkboxes[i].value] = true;
    }

    if (!name) {
        await showAlert('Введіть назву посади', 'warning');
        return;
    }

    try {
        if (editId) {
            await db.updateRank(editId, { name: name, color: color, permissions: permissions });
            await showToast('Посаду оновлено!', 'success');
        } else {
            await db.createRank(currentOrgId, { name: name, color: color, permissions: permissions });
            await showToast('Посаду створено!', 'success');
        }

        closeModal('rankModal');
        loadRanks();
    } catch (error) {
        debugLog('Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

// ========== ВІДДІЛИ ==========
async function loadDepartments() {
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Відділи';
    document.getElementById('pageSubtitle').textContent = 'Управління відділами організації';

    try {
        var depts = await db.getOrganizationDepartments(currentOrgId);
        var user = auth.getCurrentUser();
        var canManage = currentOrg && currentOrg.leader_id === (user ? user.id : null);

        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Відділи (' + (depts ? depts.length : 0) + ')</h3>' +
                    (canManage ? 
                        '<button class="btn btn-gold btn-sm" onclick="openCreateDepartment()">' +
                            '<i class="fas fa-plus"></i> Створити відділ' +
                        '</button>' : '') +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Назва</th>' +
                                '<th>Опис</th>' +
                                '<th>Співробітники</th>' +
                                '<th>Дії</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>';

        if (depts && depts.length > 0) {
            for (var i = 0; i < depts.length; i++) {
                var dept = depts[i];
                var employees = await db.getEmployeesByDepartment(dept.id);
                var employeeNames = employees && employees.length > 0
                    ? employees.map(function(e) { return (e.first_name + ' ' + e.last_name).trim(); }).join(', ')
                    : 'Немає співробітників';

                html += 
                    '<tr>' +
                        '<td><strong>' + dept.name + '</strong></td>' +
                        '<td>' + (dept.description || '—') + '</td>' +
                        '<td><small>' + employeeNames + '</small></td>' +
                        '<td>' + (canManage ? 
                            '<button class="btn btn-sm btn-teal" onclick="openAssignEmployee(\'' + dept.id + '\', \'' + dept.name + '\')">' +
                                '<i class="fas fa-user-plus"></i>' +
                            '</button>' +
                            '<button class="btn btn-sm btn-danger" onclick="deleteDepartment(\'' + dept.id + '\')">' +
                                '<i class="fas fa-trash"></i>' +
                            '</button>' : '—') + '</td>' +
                    '</tr>';
            }
        } else {
            html += '<tr><td colspan="4" class="text-center text-muted">Немає відділів</td></tr>';
        }

        html += 
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        container.innerHTML = html;
    } catch (error) {
        debugLog('Помилка:', error);
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function openCreateDepartment() {
    document.getElementById('departmentModal').classList.add('active');
}

document.getElementById('departmentForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    var name = document.getElementById('deptName').value.trim();
    var description = document.getElementById('deptDesc').value.trim();

    if (!name) {
        await showAlert('Введіть назву відділу', 'warning');
        return;
    }

    try {
        await db.createDepartment({
            organization_id: currentOrgId,
            name: name,
            description: description || ''
        });
        await showToast('Відділ створено!', 'success');
        closeModal('departmentModal');
        document.getElementById('departmentForm').reset();
        loadDepartments();
    } catch (error) {
        debugLog('Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

async function deleteDepartment(deptId) {
    var confirmed = await showConfirm('Ви впевнені, що хочете видалити цей відділ?', 'Підтвердження');
    if (!confirmed) return;

    try {
        await db.deleteDepartment(deptId);
        await showToast('Відділ видалено', 'success');
        loadDepartments();
    } catch (error) {
        debugLog('Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function openAssignEmployee(departmentId, departmentName) {
    document.getElementById('assignDeptId').value = departmentId;
    document.getElementById('assignDeptName').value = departmentName;

    var employees = await db.getOrganizationEmployees(currentOrgId);
    var select = document.getElementById('assignEmployeeSelect');
    select.innerHTML = '<option value="">Оберіть співробітника...</option>';

    if (employees && employees.length > 0) {
        var deptEmployees = await db.getEmployeesByDepartment(departmentId);
        var deptEmployeeIds = deptEmployees.map(function(e) { return e.id; });

        for (var i = 0; i < employees.length; i++) {
            var emp = employees[i];
            if (deptEmployeeIds.indexOf(emp.id) === -1) {
                var option = document.createElement('option');
                option.value = emp.id;
                var fullName = [emp.first_name, emp.last_name, emp.middle_name].filter(function(s) { return s && s.trim(); }).join(' ');
                option.textContent = fullName || 'Без імені';
                select.appendChild(option);
            }
        }
    }

    if (select.options.length <= 1) {
        select.innerHTML = '<option value="">Немає доступних співробітників</option>';
    }

    document.getElementById('assignEmployeeModal').classList.add('active');
}

document.getElementById('assignEmployeeForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    var departmentId = document.getElementById('assignDeptId').value;
    var employeeId = document.getElementById('assignEmployeeSelect').value;

    if (!employeeId) {
        await showAlert('Оберіть співробітника', 'warning');
        return;
    }

    try {
        await db.assignEmployeeToDepartment(employeeId, departmentId);
        await showToast('Співробітника призначено у відділ!', 'success');
        closeModal('assignEmployeeModal');
        loadDepartments();
        loadOverview();
    } catch (error) {
        debugLog('Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

// ========== ЧАТ ==========
async function loadChat() {
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Чат';
    document.getElementById('pageSubtitle').textContent = 'Спілкування в організації';

    try {
        var messages = await db.getChatMessages(currentOrgId);
        var user = auth.getCurrentUser();

        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Чат організації</h3>' +
                    '<small style="color:var(--muted);font-size:0.7rem;">Використовуйте @ для згадування</small>' +
                '</div>' +
                '<div id="chatMessages" style="max-height:400px;overflow-y:auto;margin-bottom:1rem;padding:0.5rem;">';

        if (messages && messages.length > 0) {
            for (var i = messages.length - 1; i >= 0; i--) {
                var msg = messages[i];
                var userData = await db.supabaseQuery('users?id=eq.' + msg.user_id);
                var userName = userData && userData.length > 0 
                    ? (userData[0].full_name || userData[0].email || 'Невідомо') 
                    : 'Невідомо';
                var isOwn = msg.user_id === (user ? user.id : null);
                var hasMention = msg.mentions && msg.mentions.indexOf(user ? user.id : null) !== -1;

                html += 
                    '<div style="display:flex;justify-content:' + (isOwn ? 'flex-end' : 'flex-start') + ';margin-bottom:0.5rem;">' +
                        '<div style="max-width:70%;background:' + (isOwn ? 'var(--gold)' : 'var(--ink)') + ';color:' + (isOwn ? 'var(--ink)' : 'var(--text-onink)') + ';padding:0.5rem 1rem;border-radius:12px;border-bottom-' + (isOwn ? 'right' : 'left') + '-radius:4px;border:' + (isOwn ? 'none' : '1px solid var(--ink-line)') + ';">' +
                            '<div style="font-size:0.7rem;opacity:0.7;margin-bottom:0.2rem;">' +
                                userName + ' · ' + new Date(msg.created_at).toLocaleTimeString('uk-UA') +
                                (hasMention ? ' <span style="color:var(--teal);">@згадування</span>' : '') +
                            '</div>' +
                            '<div>' + msg.message + '</div>' +
                            (isOwn ? 
                                '<button class="btn btn-sm btn-danger" onclick="deleteChatMessage(\'' + msg.id + '\')" style="margin-top:0.25rem;padding:0.1rem 0.5rem;font-size:0.6rem;">' +
                                    '<i class="fas fa-trash"></i>' +
                                '</button>' : '') +
                        '</div>' +
                    '</div>';
            }
        } else {
            html += '<div class="text-center text-muted">Немає повідомлень. Напишіть першим!</div>';
        }

        html += 
                '</div>' +
                '<form id="chatForm" style="display:flex;gap:0.5rem;">' +
                    '<input type="text" class="form-control" id="chatInput" placeholder="Введіть повідомлення... (використовуйте @ для згадування)" required>' +
                    '<button type="submit" class="btn btn-gold">' +
                        '<i class="fas fa-paper-plane"></i>' +
                    '</button>' +
                '</form>' +
            '</div>';

        container.innerHTML = html;

        var messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        document.getElementById('chatForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            var input = document.getElementById('chatInput');
            var message = input.value.trim();

            if (!message) return;

            var mentionRegex = /@(\S+)/g;
            var mentions = [];
            var match;
            var allMembers = await db.getOrganizationMembers(currentOrgId);
            
            while ((match = mentionRegex.exec(message)) !== null) {
                var username = match[1];
                for (var m = 0; m < allMembers.length; m++) {
                    var member = allMembers[m];
                    var memberData = await db.supabaseQuery('users?id=eq.' + member.user_id);
                    if (memberData && memberData.length > 0 && 
                        (memberData[0].full_name && memberData[0].full_name.toLowerCase().indexOf(username.toLowerCase()) !== -1 || 
                         memberData[0].email && memberData[0].email.toLowerCase().indexOf(username.toLowerCase()) !== -1)) {
                        mentions.push(member.user_id);
                        break;
                    }
                }
            }

            try {
                await db.sendChatMessage(currentOrgId, (auth.getCurrentUser() ? auth.getCurrentUser().id : null), message, mentions);
                input.value = '';
                await loadChat();
            } catch (error) {
                await showAlert('Помилка відправки: ' + error.message, 'error');
            }
        });

    } catch (error) {
        console.error('Load chat error:', error);
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження чату</div>';
    }
}

async function deleteChatMessage(messageId) {
    var confirmed = await showConfirm('Видалити повідомлення?', 'Підтвердження');
    if (!confirmed) return;

    try {
        await db.deleteChatMessage(messageId);
        await showToast('Повідомлення видалено', 'success');
        await loadChat();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ========== ВІДПУСТКИ ==========
async function loadVacations() {
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Відпустки';
    document.getElementById('pageSubtitle').textContent = 'Управління відпустками співробітників';

    try {
        var vacations = await db.getVacations(currentOrgId);
        var user = auth.getCurrentUser();
        var isLeader = currentOrg && currentOrg.leader_id === (user ? user.id : null);

        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Відпустки (' + (vacations ? vacations.length : 0) + ')</h3>' +
                    '<button class="btn btn-gold btn-sm" onclick="openCreateVacation()">' +
                        '<i class="fas fa-plus"></i> Створити заявку' +
                    '</button>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Співробітник</th>' +
                                '<th>Період</th>' +
                                '<th>Тип</th>' +
                                '<th>Статус</th>' +
                                '<th>Дії</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>';

        if (vacations && vacations.length > 0) {
            for (var i = 0; i < vacations.length; i++) {
                var vac = vacations[i];
                var userData = await db.supabaseQuery('users?id=eq.' + vac.user_id);
                var userName = userData && userData.length > 0 
                    ? (userData[0].full_name || userData[0].email || 'Невідомо') 
                    : 'Невідомо';

                var isPending = vac.status === 'pending';
                var statusClass = vac.status === 'pending' ? 'badge-warning' : 
                                   vac.status === 'approved' ? 'badge-success' : 
                                   vac.status === 'rejected' ? 'badge-danger' : 'badge-secondary';

                html += 
                    '<tr>' +
                        '<td><strong>' + userName + '</strong></td>' +
                        '<td>' + new Date(vac.start_date).toLocaleDateString('uk-UA') + ' - ' + new Date(vac.end_date).toLocaleDateString('uk-UA') + '</td>' +
                        '<td>' + (vacationTypeLabels[vac.type] || vac.type) + '</td>' +
                        '<td><span class="badge ' + statusClass + '">' + (vacationStatusLabels[vac.status] || vac.status) + '</span></td>' +
                        '<td>' + (isPending && isLeader ? 
                            '<button class="btn btn-sm btn-teal" onclick="approveVacation(\'' + vac.id + '\')">' +
                                '<i class="fas fa-check"></i>' +
                            '</button>' +
                            '<button class="btn btn-sm btn-danger" onclick="rejectVacation(\'' + vac.id + '\')">' +
                                '<i class="fas fa-times"></i>' +
                            '</button>' : '') +
                            (vac.user_id === (user ? user.id : null) && vac.status === 'pending' ? 
                                '<button class="btn btn-sm btn-danger" onclick="cancelVacation(\'' + vac.id + '\')">' +
                                    '<i class="fas fa-ban"></i>' +
                                '</button>' : '') + '</td>' +
                    '</tr>';
            }
        } else {
            html += '<tr><td colspan="5" class="text-center text-muted">Немає заявок на відпустку</td></tr>';
        }

        html += 
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        container.innerHTML = html;
    } catch (error) {
        console.error('Load vacations error:', error);
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function openCreateVacation() {
    document.getElementById('vacationModal').classList.add('active');
}

document.getElementById('vacationForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    var startDate = document.getElementById('vacStart').value;
    var endDate = document.getElementById('vacEnd').value;
    var type = document.getElementById('vacType').value;
    var reason = document.getElementById('vacReason').value.trim();

    if (!startDate || !endDate) {
        await showAlert('Оберіть дати', 'warning');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        await showAlert('Дата початку не може бути пізнішою за дату закінчення', 'warning');
        return;
    }

    try {
        var user = auth.getCurrentUser();
        await db.createVacation({
            organization_id: currentOrgId,
            user_id: user ? user.id : null,
            start_date: startDate,
            end_date: endDate,
            type: type,
            reason: reason || '',
            status: 'pending'
        });

        await showToast('Заявку на відпустку відправлено!', 'success');
        closeModal('vacationModal');
        document.getElementById('vacationForm').reset();
        loadVacations();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

async function approveVacation(vacationId) {
    var confirmed = await showConfirm('Схвалити заявку на відпустку?', 'Підтвердження');
    if (!confirmed) return;

    try {
        var user = auth.getCurrentUser();
        await db.updateVacationStatus(vacationId, 'approved', user ? user.id : null);
        await showToast('Заявку схвалено!', 'success');
        loadVacations();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function rejectVacation(vacationId) {
    var confirmed = await showConfirm('Відхилити заявку на відпустку?', 'Підтвердження');
    if (!confirmed) return;

    try {
        var user = auth.getCurrentUser();
        await db.updateVacationStatus(vacationId, 'rejected', user ? user.id : null);
        await showToast('Заявку відхилено', 'warning');
        loadVacations();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function cancelVacation(vacationId) {
    var confirmed = await showConfirm('Скасувати заявку на відпустку?', 'Підтвердження');
    if (!confirmed) return;

    try {
        await db.updateVacationStatus(vacationId, 'cancelled');
        await showToast('Заявку скасовано', 'success');
        loadVacations();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ========== НАЛАШТУВАННЯ ==========
async function loadSettings() {
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Налаштування';
    document.getElementById('pageSubtitle').textContent = 'Управління налаштуваннями організації';

    var user = auth.getCurrentUser();
    var isLeader = currentOrg && currentOrg.leader_id === (user ? user.id : null);

    container.innerHTML = 
        '<div class="card">' +
            '<h3 class="card-title mb-2">Налаштування організації</h3>' +
            '<form id="settingsForm">' +
                '<div class="form-group">' +
                    '<label class="form-label">Назва організації</label>' +
                    '<input type="text" class="form-control" id="settingsName" value="' + (currentOrg ? currentOrg.name || '' : '') + '" required>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label class="form-label">Опис</label>' +
                    '<textarea class="form-control" id="settingsDesc" rows="3" placeholder="Короткий опис організації">' + (currentOrg ? currentOrg.description || '' : '') + '</textarea>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label class="form-label">Код вступу</label>' +
                    '<div style="display:flex;gap:0.5rem;align-items:center;">' +
                        '<input type="text" class="form-control" id="settingsCode" value="' + (currentOrg ? currentOrg.join_code || '' : '') + '" style="font-family:monospace;font-size:1.2rem;letter-spacing:2px;text-transform:lowercase;" readonly>' +
                        (isLeader ? 
                            '<button type="button" class="btn btn-teal" onclick="regenerateCode()" title="Згенерувати новий код">' +
                                '<i class="fas fa-sync"></i>' +
                            '</button>' : '') +
                    '</div>' +
                    '<small style="color:var(--muted);">Код формату: abcd-abcd-abcd-abcd (латиниця, малі літери)</small>' +
                '</div>' +
                '<div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:1rem;">' +
                    '<button type="submit" class="btn btn-gold">' +
                        '<i class="fas fa-save"></i> Зберегти налаштування' +
                    '</button>' +
                    (isLeader ? 
                        '<button type="button" class="btn btn-danger" onclick="deleteOrganization()">' +
                            '<i class="fas fa-trash"></i> Видалити організацію' +
                        '</button>' : '') +
                '</div>' +
            '</form>' +
        '</div>';

    document.getElementById('settingsForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        var name = document.getElementById('settingsName').value.trim();
        var description = document.getElementById('settingsDesc').value.trim();

        if (!name) {
            await showAlert('Назва обов\'язкова', 'warning');
            return;
        }

        try {
            await db.updateOrganization(currentOrgId, { name: name, description: description });
            await showToast('Налаштування збережено!', 'success');
            currentOrg = await db.getOrganization(currentOrgId);
            document.getElementById('orgName').textContent = currentOrg.name;
        } catch (error) {
            debugLog('Помилка:', error);
            await showAlert('Помилка: ' + error.message, 'error');
        }
    });
}

async function regenerateCode() {
    var confirmed = await showConfirm('Ви впевнені, що хочете змінити код вступу?', 'Підтвердження');
    if (!confirmed) return;

    try {
        var newCode = generateJoinCode();
        await db.updateOrganization(currentOrgId, { join_code: newCode });
        await showToast('Код оновлено!', 'success');
        currentOrg = await db.getOrganization(currentOrgId);
        document.getElementById('settingsCode').value = currentOrg.join_code;
        document.getElementById('joinCode').textContent = currentOrg.join_code;
    } catch (error) {
        debugLog('Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
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

async function deleteOrganization() {
    var confirmed = await showConfirm('Ви впевнені, що хочете видалити організацію? Це незворотна дія!', 'Увага');
    if (!confirmed) return;

    try {
        await db.deleteOrganization(currentOrgId);
        await showToast('Організацію видалено', 'success');
        window.location.href = '/dashboard';
    } catch (error) {
        debugLog('Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function openAssignRank(memberId, userName) {
    document.getElementById('assignMemberId').value = memberId;
    document.getElementById('assignUserName').value = userName;

    try {
        var ranks = await db.getOrganizationRanks(currentOrgId);
        var select = document.getElementById('assignRankSelect');
        select.innerHTML = '<option value="">Оберіть посаду...</option>';

        if (ranks && ranks.length > 0) {
            for (var i = 0; i < ranks.length; i++) {
                var option = document.createElement('option');
                option.value = ranks[i].id;
                option.textContent = ranks[i].name;
                select.appendChild(option);
            }
        }

        document.getElementById('assignRankModal').classList.add('active');
    } catch (error) {
        debugLog('Помилка:', error);
        await showAlert('Помилка завантаження посад', 'error');
    }
}

document.getElementById('assignRankForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    var memberId = document.getElementById('assignMemberId').value;
    var rankId = document.getElementById('assignRankSelect').value;

    if (!rankId) {
        await showAlert('Оберіть посаду', 'warning');
        return;
    }

    try {
        await db.updateMemberRank(memberId, rankId);
        await showToast('Посаду призначено!', 'success');
        closeModal('assignRankModal');
        loadMembers();
    } catch (error) {
        debugLog('Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function selectColor(el) {
    var options = document.querySelectorAll('.color-option');
    for (var i = 0; i < options.length; i++) {
        options[i].classList.remove('selected');
    }
    el.classList.add('selected');
    document.getElementById('rankColor').value = el.style.backgroundColor;
}

var modals = document.querySelectorAll('.modal');
for (var m = 0; m < modals.length; m++) {
    modals[m].addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
}

init();
console.log('✅ Organization dashboard loaded');
