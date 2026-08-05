// ============================================
// TYPEBIZ - ДАШБОРД ОРГАНІЗАЦІЇ
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

// ===== ОГЛЯД =====
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

// ===== УЧАСНИКИ =====
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

// ===== ЗАЯВКИ =====
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

// ===== ОБРОБКА ЗАЯВКИ =====
async function handleRequest(requestId, status) {
    try {
        await db.updateJoinRequest(requestId, status);

        if (status === 'approved') {
            var request = await db.supabaseQuery('join_requests?id=eq.' + requestId);
            if (request && request.length > 0) {
                await db.addMemberToOrganization(request[0].organization_id, request[0].user_id);
                
                await db.createNotification({
                    user_id: request[0].user_id,
                    organization_id: request[0].organization_id,
                    type: 'join_approved',
                    title: 'Заявку схвалено',
                    message: 'Вашу заявку на вступ до "' + (currentOrg ? currentOrg.name : '') + '" схвалено!',
                    link: '/org?id=' + currentOrgId
                });
                
                await showToast('Заявку схвалено! Користувача додано.', 'success');
            }
        } else {
            var request = await db.supabaseQuery('join_requests?id=eq.' + requestId);
            if (request && request.length > 0) {
                await db.createNotification({
                    user_id: request[0].user_id,
                    organization_id: request[0].organization_id,
                    type: 'join_rejected',
                    title: 'Заявку відхилено',
                    message: 'Вашу заявку на вступ до "' + (currentOrg ? currentOrg.name : '') + '" відхилено.',
                    link: '/org?id=' + currentOrgId
                });
            }
            await showToast('Заявку відхилено.', 'warning');
        }

        loadRequests();
        loadOverview();
    } catch (error) {
        debugLog('Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ===== ВИДАЛЕННЯ УЧАСНИКА =====
async function removeMember(memberId) {
    var confirmed = await showConfirm('Ви впевнені, що хочете видалити цього учасника?', 'Підтвердження');
    if (!confirmed) return;

    try {
        var member = await db.supabaseQuery('org_members?id=eq.' + memberId);
        if (member && member.length > 0) {
            await db.createNotification({
                user_id: member[0].user_id,
                organization_id: member[0].organization_id,
                type: 'removed',
                title: 'Вас видалено з організації',
                message: 'Вас видалено з організації "' + (currentOrg ? currentOrg.name : '') + '".',
                link: '/dashboard'
            });
        }
        await db.removeMemberFromOrganization(memberId);
        await showToast('Учасника видалено', 'success');
        loadMembers();
        loadOverview();
    } catch (error) {
        debugLog('Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ===== ПОСАДИ =====
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

// ===== СТВОРЕННЯ ПОСАДИ =====
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

// ===== ІНШІ ФУНКЦІЇ (залишаються без змін) =====
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

// ===== НАЛАШТУВАННЯ =====
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
        var newCode = '';
        var chars = 'abcdefghijklmnopqrstuvwxyz';
        for (var i = 0; i < 4; i++) {
            var part = '';
            for (var j = 0; j < 4; j++) {
                part += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            if (i > 0) newCode += '-';
            newCode += part;
        }
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

// ===== ДОДАТКОВІ ФУНКЦІЇ =====
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

// Закриття модалок по кліку поза ними
var modals = document.querySelectorAll('.modal');
for (var m = 0; m < modals.length; m++) {
    modals[m].addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
}

// Запуск
init();
console.log('✅ Organization dashboard loaded');
