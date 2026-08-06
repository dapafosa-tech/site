// ============================================
// TYPEBIZ - ДАШБОРД ОРГАНІЗАЦІЇ (ВИПРАВЛЕНА ВЕРСІЯ)
// ============================================

var currentOrgId = null;
var currentOrg = null;

var typeLabels = {
    'shop': 'Магазин', 'library': 'Бібліотека', 'company': 'Компанія',
    'school': 'Школа', 'clinic': 'Клініка', 'restaurant': 'Ресторан',
    'cafe': 'Кафе', 'hotel': 'Готель', 'gym': 'Спортзал',
    'beauty': 'Салон краси', 'auto': 'Автосервіс', 'realty': 'Нерухомість',
    'it': 'IT-компанія', 'marketing': 'Маркетинг', 'legal': 'Юридична',
    'finance': 'Фінанси', 'education': 'Освіта', 'medical': 'Медицина',
    'sport': 'Спорт', 'art': 'Мистецтво', 'music': 'Музика',
    'photo': 'Фото', 'video': 'Відео', 'construction': 'Будівництво',
    'repair': 'Ремонт', 'cleaning': 'Клінінг', 'delivery': 'Доставка',
    'logistics': 'Логістика', 'agriculture': 'Сільське господарство',
    'tourism': 'Туризм', 'event': 'Івент', 'charity': 'Благодійність',
    'government': 'Державна', 'gamedev': 'GameDev', 'indie': 'Інді-розробка',
    'publishing': 'Видавництво', 'animation': 'Анімація', 'vr': 'VR/AR',
    'esports': 'Кіберспорт', 'streaming': 'Стримінг', 'podcast': 'Подкаст',
    'blogging': 'Блогінг', 'social': 'Соцмережі', 'startup': 'Стартап',
    'agency': 'Агентство', 'consulting': 'Консалтинг', 'freelance': 'Фриланс',
    'remote': 'Віддалена робота', 'coworking': 'Коворкінг', 'incubator': 'Інкубатор',
    'accelerator': 'Акселератор', 'venture': 'Венчур', 'nonprofit': 'Некомерційна',
    'community': 'Спільнота', 'religious': 'Релігійна', 'cultural': 'Культурна',
    'research': 'Дослідження', 'science': 'Наука', 'space': 'Космос',
    'robotics': 'Робототехніка', 'ai': 'ШІ', 'blockchain': 'Блокчейн',
    'crypto': 'Криптовалюта', 'defi': 'DeFi', 'nft': 'NFT',
    'metaverse': 'Метавсесвіт', 'web3': 'Web3', 'other': 'Інше'
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

var taskStatusLabels = {
    'new': '🆕 Нове',
    'in_progress': '🔄 В роботі',
    'review': '👀 На перевірці',
    'done': '✅ Виконано',
    'closed': '📌 Закрито'
};

var taskPriorityLabels = {
    'low': '🟢 Низький',
    'medium': '🟡 Середній',
    'high': '🔴 Високий',
    'urgent': '🔥 Терміновий'
};

// ===== НАЛАШТУВАННЯ НАВІГАЦІЇ ЗА ТИПОМ ОРГАНІЗАЦІЇ =====
function setupNavigationByType(orgType) {
    var navMap = {
        'clinic': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'clinic'],
        'shop': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'shop'],
        'library': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'library'],
        'school': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'school'],
        'restaurant': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'restaurant'],
        'hotel': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'hotel'],
        'gym': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'gym'],
        'beauty': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'beauty'],
        'auto': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'auto'],
        'realty': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'realty'],
        'logistics': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'logistics'],
        'delivery': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'delivery'],
        'it': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'it'],
        'gamedev': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'it']
    };

    var navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;

    var allLinks = navMenu.querySelectorAll('a');
    var moduleSections = ['clinic', 'shop', 'library', 'school', 'restaurant', 'hotel', 'gym', 'beauty', 'auto', 'realty', 'logistics', 'delivery', 'it'];
    
    allLinks.forEach(function(link) {
        var onclick = link.getAttribute('onclick') || '';
        var isModule = false;
        for (var i = 0; i < moduleSections.length; i++) {
            if (onclick.indexOf("'" + moduleSections[i] + "'") !== -1) {
                isModule = true;
                break;
            }
        }
        if (isModule) {
            link.style.display = 'none';
        }
    });

    var allowedModules = navMap[orgType] || ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings'];
    
    allLinks.forEach(function(link) {
        var onclick = link.getAttribute('onclick') || '';
        var shouldShow = false;
        
        for (var i = 0; i < allowedModules.length; i++) {
            if (onclick.indexOf("'" + allowedModules[i] + "'") !== -1) {
                shouldShow = true;
                break;
            }
        }
        
        if (shouldShow) {
            link.style.display = 'flex';
        }
    });
}

// ===== ІНІЦІАЛІЗАЦІЯ =====
async function init() {
    var isAuth = await auth.requireAuth();
    if (!isAuth) return;
    await loadOrganization();
}

function getOrgIdFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ===== ЗАВАНТАЖЕННЯ ОРГАНІЗАЦІЇ =====
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

    setupNavigationByType(currentOrg.type);

    try {
        var ranks = await db.getOrganizationRanks(currentOrgId);
        var user = auth.getCurrentUser();
        var members = await db.getOrganizationMembers(currentOrgId);
        var userMember = null;
        for (var i = 0; i < members.length; i++) {
            if (members[i].user_id === user.id) {
                userMember = members[i];
                break;
            }
        }
        
        if (userMember && !userMember.rank_id && currentOrg.leader_id === user.id) {
            var directorRank = null;
            for (var j = 0; j < ranks.length; j++) {
                if (ranks[j].is_default) {
                    directorRank = ranks[j];
                    break;
                }
            }
            if (directorRank) {
                await db.updateMemberRank(userMember.id, directorRank.id);
            }
        }
    } catch (e) {}

    loadSection('overview');
}

// ===== ЗАВАНТАЖЕННЯ РОЗДІЛІВ =====
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
        case 'events': loadEvents(); break;
        case 'tasks': loadTasks(); break;
        case 'polls': loadPolls(); break;
        case 'files': loadFiles(); break;
        case 'settings': loadSettings(); break;
        case 'clinic': loadClinic(); break;
        case 'shop': loadShop(); break;
        case 'library': loadLibrary(); break;
        case 'school': loadSchool(); break;
        case 'restaurant': loadRestaurant(); break;
        case 'hotel': loadHotel(); break;
        case 'gym': loadGym(); break;
        case 'beauty': loadBeauty(); break;
        case 'auto': loadAuto(); break;
        case 'realty': loadRealty(); break;
        case 'logistics': loadLogistics(); break;
        case 'delivery': loadDelivery(); break;
        case 'it': loadIT(); break;
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
        var tasks = await db.getTasks(currentOrgId);

        var pendingCount = 0;
        if (requests) {
            for (var i = 0; i < requests.length; i++) {
                if (requests[i].status === 'pending') pendingCount++;
            }
        }

        var tasksCount = tasks ? tasks.length : 0;

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
                '<div class="stat-card" style="border-color: #3B82F6;">' +
                    '<div class="stat-value">' + tasksCount + '</div>' +
                    '<div class="stat-label">Завдань</div>' +
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
                            '<td>' + (rank ? '<span style="color:' + rank.color + '">' + rank.name + (rank.is_default ? ' ⭐' : '') + '</span>' : 'Без посади') + '</td>' +
                            '<td>' + new Date(member.joined_at).toLocaleDateString('uk-UA') + '</td>' +
                            '<td>' + (!isLeader && currentOrg && currentOrg.leader_id === (user ? user.id : null) ? 
                                '<button class="btn btn-sm btn-teal" onclick="openAssignRank(\'' + member.id + '\', \'' + userName + '\')">' +
                                    '<i class="fas fa-crown"></i>' +
                                '</button>' +
                                '<button class="btn btn-sm btn-danger" onclick="removeMember(\'' + member.id + '\')">' +
                                    '<i class="fas fa-times"></i>' +
                                '</button>' : '—') + '</td>' +
                        '</tr>';
                } catch (e) {}
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
                } catch (e) {}
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

                html += 
                    '<tr>' +
                        '<td><strong>' + rank.name + (rank.is_default ? ' ⭐' : '') + '</strong></td>' +
                        '<td><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:' + rank.color + ';"></span> ' + rank.color + '</td>' +
                        '<td>' + (canManage ? 
                            '<button class="btn btn-sm btn-teal" onclick="openEditRank(\'' + rank.id + '\')">' +
                                '<i class="fas fa-edit"></i>' +
                            '</button>' : '') +
                            (!rank.is_default && canManage ? 
                                '<button class="btn btn-sm btn-danger" onclick="deleteRank(\'' + rank.id + '\')">' +
                                    '<i class="fas fa-trash"></i>' +
                                '</button>' : '') +
                            (canManage && !rank.is_default ? 
                                '<button class="btn btn-sm btn-outline" onclick="moveRank(\'' + rank.id + '\', \'up\')">' +
                                    '<i class="fas fa-arrow-up"></i>' +
                                '</button>' +
                                '<button class="btn btn-sm btn-outline" onclick="moveRank(\'' + rank.id + '\', \'down\')">' +
                                    '<i class="fas fa-arrow-down"></i>' +
                                '</button>' : '') +
                        '</td>' +
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
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function moveRank(rankId, direction) {
    try {
        var ranks = await db.getOrganizationRanks(currentOrgId);
        var index = -1;
        for (var i = 0; i < ranks.length; i++) {
            if (ranks[i].id === rankId) {
                index = i;
                break;
            }
        }

        if (index === -1 || (direction === 'up' && index <= 0) || (direction === 'down' && index >= ranks.length - 1)) {
            return;
        }

        var newIndex = direction === 'up' ? index - 1 : index + 1;
        var tempOrder = ranks[index].order || index;
        ranks[index].order = ranks[newIndex].order || newIndex;
        ranks[newIndex].order = tempOrder;

        await db.updateRank(ranks[index].id, { order: ranks[index].order });
        await db.updateRank(ranks[newIndex].id, { order: ranks[newIndex].order });

        await showToast('Посаду переміщено!', 'success');
        loadRanks();
    } catch (error) {
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
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

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

// ========== ПОДІЇ ==========
async function loadEvents() {
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Календар подій';
    document.getElementById('pageSubtitle').textContent = 'Планування зустрічей та подій';

    try {
        var events = await db.getEvents(currentOrgId);
        var user = auth.getCurrentUser();
        var isLeader = currentOrg && currentOrg.leader_id === (user ? user.id : null);

        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Події (' + (events ? events.length : 0) + ')</h3>' +
                    '<button class="btn btn-gold btn-sm" onclick="openCreateEvent()">' +
                        '<i class="fas fa-plus"></i> Створити подію' +
                    '</button>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Назва</th>' +
                                '<th>Дата</th>' +
                                '<th>Місце</th>' +
                                '<th>Дії</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>';

        if (events && events.length > 0) {
            for (var i = 0; i < events.length; i++) {
                var ev = events[i];
                html += 
                    '<tr>' +
                        '<td><strong>' + ev.title + '</strong></td>' +
                        '<td>' + new Date(ev.start_date).toLocaleString('uk-UA') + '</td>' +
                        '<td>' + (ev.location || '—') + '</td>' +
                        '<td>' + (isLeader ? 
                            '<button class="btn btn-sm btn-danger" onclick="deleteEvent(\'' + ev.id + '\')">' +
                                '<i class="fas fa-trash"></i>' +
                            '</button>' : '—') + '</td>' +
                    '</tr>';
            }
        } else {
            html += '<tr><td colspan="4" class="text-center text-muted">Немає подій</td></tr>';
        }

        html += 
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function openCreateEvent() {
    document.getElementById('eventModal').classList.add('active');
}

document.getElementById('eventForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    var title = document.getElementById('eventTitle').value.trim();
    var description = document.getElementById('eventDesc').value.trim();
    var startDate = document.getElementById('eventStart').value;
    var endDate = document.getElementById('eventEnd').value;
    var location = document.getElementById('eventLocation').value.trim();

    if (!title || !startDate || !endDate) {
        await showAlert('Заповніть всі обов\'язкові поля', 'warning');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        await showAlert('Дата початку не може бути пізнішою за дату закінчення', 'warning');
        return;
    }

    try {
        var user = auth.getCurrentUser();
        await db.createEvent({
            organization_id: currentOrgId,
            title: title,
            description: description || '',
            start_date: startDate,
            end_date: endDate,
            location: location || '',
            created_by: user ? user.id : null
        });

        await showToast('Подію створено!', 'success');
        closeModal('eventModal');
        document.getElementById('eventForm').reset();
        loadEvents();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

async function deleteEvent(eventId) {
    var confirmed = await showConfirm('Ви впевнені, що хочете видалити цю подію?', 'Підтвердження');
    if (!confirmed) return;

    try {
        await db.deleteEvent(eventId);
        await showToast('Подію видалено', 'success');
        loadEvents();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ========== ЗАВДАННЯ ==========
async function loadTasks() {
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Завдання';
    document.getElementById('pageSubtitle').textContent = 'Управління задачами';

    try {
        var tasks = await db.getTasks(currentOrgId);
        var user = auth.getCurrentUser();
        var isLeader = currentOrg && currentOrg.leader_id === (user ? user.id : null);

        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Завдання (' + (tasks ? tasks.length : 0) + ')</h3>' +
                    '<button class="btn btn-gold btn-sm" onclick="openCreateTask()">' +
                        '<i class="fas fa-plus"></i> Створити завдання' +
                    '</button>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Назва</th>' +
                                '<th>Відповідальний</th>' +
                                '<th>Дедлайн</th>' +
                                '<th>Статус</th>' +
                                '<th>Пріоритет</th>' +
                                '<th>Дії</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>';

        if (tasks && tasks.length > 0) {
            for (var i = 0; i < tasks.length; i++) {
                var task = tasks[i];
                var assignedUser = await db.supabaseQuery('users?id=eq.' + task.assigned_to);
                var assignedName = assignedUser && assignedUser.length > 0 
                    ? (assignedUser[0].full_name || assignedUser[0].email) 
                    : 'Не призначено';
                var isAssignee = task.assigned_to === (user ? user.id : null);

                html += 
                    '<tr>' +
                        '<td><strong>' + task.title + '</strong></td>' +
                        '<td>' + assignedName + '</td>' +
                        '<td>' + (task.due_date ? new Date(task.due_date).toLocaleDateString('uk-UA') : '—') + '</td>' +
                        '<td><span class="badge ' + (task.status === 'done' ? 'badge-success' : task.status === 'in_progress' ? 'badge-warning' : 'badge-primary') + '">' + (taskStatusLabels[task.status] || task.status) + '</span></td>' +
                        '<td><span class="badge ' + (task.priority === 'high' || task.priority === 'urgent' ? 'badge-danger' : task.priority === 'medium' ? 'badge-warning' : 'badge-success') + '">' + (taskPriorityLabels[task.priority] || task.priority) + '</span></td>' +
                        '<td>' + (isLeader || isAssignee ? 
                            '<button class="btn btn-sm btn-teal" onclick="editTask(\'' + task.id + '\')">' +
                                '<i class="fas fa-edit"></i>' +
                            '</button>' +
                            '<button class="btn btn-sm btn-danger" onclick="deleteTask(\'' + task.id + '\')">' +
                                '<i class="fas fa-trash"></i>' +
                            '</button>' : '—') + '</td>' +
                    '</tr>';
            }
        } else {
            html += '<tr><td colspan="6" class="text-center text-muted">Немає завдань</td></tr>';
        }

        html += 
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function openCreateTask() {
    document.getElementById('taskModal').classList.add('active');
    document.getElementById('taskEditId').value = '';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDesc').value = '';
    document.getElementById('taskDue').value = '';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskSubmitText').textContent = 'Створити';
    loadTaskAssignees();
}

async function editTask(taskId) {
    try {
        var tasks = await db.getTasks(currentOrgId);
        var task = null;
        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].id === taskId) {
                task = tasks[i];
                break;
            }
        }
        if (!task) return;

        document.getElementById('taskModal').classList.add('active');
        document.getElementById('taskEditId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDesc').value = task.description || '';
        document.getElementById('taskDue').value = task.due_date ? task.due_date.split('T')[0] : '';
        document.getElementById('taskPriority').value = task.priority || 'medium';
        document.getElementById('taskSubmitText').textContent = 'Зберегти';
        await loadTaskAssignees();
        if (task.assigned_to) {
            document.getElementById('taskAssign').value = task.assigned_to;
        }
    } catch (error) {
        await showAlert('Помилка завантаження завдання', 'error');
    }
}

async function loadTaskAssignees() {
    var members = await db.getOrganizationMembers(currentOrgId);
    var select = document.getElementById('taskAssign');
    if (!select) return;
    
    select.innerHTML = '<option value="">Не призначено</option>';
    
    if (members && members.length > 0) {
        for (var i = 0; i < members.length; i++) {
            var member = members[i];
            var userData = await db.supabaseQuery('users?id=eq.' + member.user_id);
            if (userData && userData.length > 0) {
                var option = document.createElement('option');
                option.value = member.user_id;
                option.textContent = userData[0].full_name || userData[0].email || 'Користувач';
                select.appendChild(option);
            }
        }
    }
}

document.getElementById('taskForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    var editId = document.getElementById('taskEditId').value;
    var title = document.getElementById('taskTitle').value.trim();
    var description = document.getElementById('taskDesc').value.trim();
    var assignedTo = document.getElementById('taskAssign').value;
    var dueDate = document.getElementById('taskDue').value;
    var priority = document.getElementById('taskPriority').value;

    if (!title) {
        await showAlert('Введіть назву завдання', 'warning');
        return;
    }

    try {
        var user = auth.getCurrentUser();
        var data = {
            organization_id: currentOrgId,
            title: title,
            description: description || '',
            assigned_to: assignedTo || null,
            created_by: user ? user.id : null,
            due_date: dueDate || null,
            priority: priority || 'medium'
        };

        if (editId) {
            await db.updateTask(editId, data);
            await showToast('Завдання оновлено!', 'success');
        } else {
            data.status = 'new';
            await db.createTask(data);
            await showToast('Завдання створено!', 'success');
        }

        closeModal('taskModal');
        document.getElementById('taskForm').reset();
        loadTasks();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

async function deleteTask(taskId) {
    var confirmed = await showConfirm('Ви впевнені, що хочете видалити це завдання?', 'Підтвердження');
    if (!confirmed) return;

    try {
        await db.deleteTask(taskId);
        await showToast('Завдання видалено', 'success');
        loadTasks();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ========== ОПИТУВАННЯ ==========
async function loadPolls() {
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Опитування';
    document.getElementById('pageSubtitle').textContent = 'Збір думок та голосування';

    try {
        var polls = await db.getPolls(currentOrgId);
        var user = auth.getCurrentUser();

        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Опитування (' + (polls ? polls.length : 0) + ')</h3>' +
                    '<button class="btn btn-gold btn-sm" onclick="openCreatePoll()">' +
                        '<i class="fas fa-plus"></i> Створити опитування' +
                    '</button>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Назва</th>' +
                                '<th>Варіанти</th>' +
                                '<th>Статус</th>' +
                                '<th>Дії</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>';

        if (polls && polls.length > 0) {
            for (var i = 0; i < polls.length; i++) {
                var poll = polls[i];
                var options = poll.options || [];
                var optionLabels = options.join(', ');

                html += 
                    '<tr>' +
                        '<td><strong>' + poll.title + '</strong></td>' +
                        '<td>' + optionLabels + '</td>' +
                        '<td><span class="badge ' + (poll.is_active ? 'badge-success' : 'badge-secondary') + '">' + (poll.is_active ? 'Активне' : 'Завершене') + '</span></td>' +
                        '<td>' +
                            '<button class="btn btn-sm btn-teal" onclick="viewPoll(\'' + poll.id + '\')">' +
                                '<i class="fas fa-eye"></i>' +
                            '</button>' +
                            '<button class="btn btn-sm btn-danger" onclick="deletePoll(\'' + poll.id + '\')">' +
                                '<i class="fas fa-trash"></i>' +
                            '</button>' +
                        '</td>' +
                    '</tr>';
            }
        } else {
            html += '<tr><td colspan="4" class="text-center text-muted">Немає опитувань</td></tr>';
        }

        html += 
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function openCreatePoll() {
    document.getElementById('pollModal').classList.add('active');
    document.getElementById('pollEditId').value = '';
    document.getElementById('pollTitle').value = '';
    document.getElementById('pollDesc').value = '';
    document.getElementById('pollOptions').value = '';
    document.getElementById('pollSubmitText').textContent = 'Створити';
}

document.getElementById('pollForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    var title = document.getElementById('pollTitle').value.trim();
    var description = document.getElementById('pollDesc').value.trim();
    var optionsText = document.getElementById('pollOptions').value.trim();

    if (!title || !optionsText) {
        await showAlert('Заповніть назву та варіанти відповідей', 'warning');
        return;
    }

    var options = optionsText.split('\n').filter(function(o) { return o.trim(); });
    if (options.length < 2) {
        await showAlert('Додайте мінімум 2 варіанти відповідей', 'warning');
        return;
    }

    try {
        var user = auth.getCurrentUser();
        await db.createPoll({
            organization_id: currentOrgId,
            title: title,
            description: description || '',
            options: options,
            created_by: user ? user.id : null,
            expires_at: null
        });

        await showToast('Опитування створено!', 'success');
        closeModal('pollModal');
        document.getElementById('pollForm').reset();
        loadPolls();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

async function viewPoll(pollId) {
    try {
        var polls = await db.getPolls(currentOrgId);
        var poll = null;
        for (var i = 0; i < polls.length; i++) {
            if (polls[i].id === pollId) {
                poll = polls[i];
                break;
            }
        }
        if (!poll) return;

        var results = await db.getPollResults(pollId);
        var user = auth.getCurrentUser();
        var hasVoted = results && results.some(function(v) { return v.user_id === (user ? user.id : null); });

        var html = 
            '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">' +
                '<h3 style="color:var(--gold);">' + poll.title + '</h3>' +
                '<p style="color:var(--muted);">' + (poll.description || '') + '</p>' +
            '</div>';

        var options = poll.options || [];
        var totalVotes = results ? results.length : 0;

        html += '<div style="margin-top:1rem;">';
        for (var j = 0; j < options.length; j++) {
            var votes = results ? results.filter(function(v) { return v.option_index === j; }).length : 0;
            var percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            
            html += 
                '<div style="margin-bottom:0.75rem;">' +
                    '<div style="display:flex;justify-content:space-between;font-size:0.85rem;">' +
                        '<span>' + options[j] + '</span>' +
                        '<span>' + votes + ' голосів (' + percent + '%)</span>' +
                    '</div>' +
                    '<div style="background:var(--ink);border-radius:4px;height:8px;overflow:hidden;">' +
                        '<div style="background:var(--gold);height:100%;width:' + percent + '%;border-radius:4px;transition:width 0.5s;"></div>' +
                    '</div>' +
                '</div>';
        }
        html += '</div>';

        if (!hasVoted && poll.is_active) {
            html += 
                '<div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;">' +
                    options.map(function(opt, idx) {
                        return '<button class="btn btn-sm btn-teal" onclick="votePoll(\'' + pollId + '\', ' + idx + ')">' + opt + '</button>';
                    }).join('') +
                '</div>';
        } else if (hasVoted) {
            html += '<p style="color:var(--teal);margin-top:1rem;">✅ Ви вже проголосували</p>';
        } else {
            html += '<p style="color:var(--muted);margin-top:1rem;">⏳ Опитування завершено</p>';
        }

        await showAlert(html, 'info', '📊 Результати опитування');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function votePoll(pollId, optionIndex) {
    var confirmed = await showConfirm('Ви впевнені, що хочете проголосувати за цей варіант?', 'Голосування');
    if (!confirmed) return;

    try {
        var user = auth.getCurrentUser();
        await db.votePoll(pollId, user ? user.id : null, optionIndex);
        await showToast('Голос зараховано!', 'success');
        viewPoll(pollId);
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function deletePoll(pollId) {
    var confirmed = await showConfirm('Ви впевнені, що хочете видалити це опитування?', 'Підтвердження');
    if (!confirmed) return;

    try {
        await db.deletePoll(pollId);
        await showToast('Опитування видалено', 'success');
        loadPolls();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ========== ФАЙЛИ ==========
async function loadFiles() {
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Файли';
    document.getElementById('pageSubtitle').textContent = 'Сховище файлів організації';

    try {
        var files = await db.getFiles(currentOrgId);
        var user = auth.getCurrentUser();

        var html = 
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3 class="card-title">Файли (' + (files ? files.length : 0) + ')</h3>' +
                    '<button class="btn btn-gold btn-sm" onclick="openUploadFile()">' +
                        '<i class="fas fa-upload"></i> Завантажити' +
                    '</button>' +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="table">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Назва</th>' +
                                '<th>Розмір</th>' +
                                '<th>Завантажив</th>' +
                                '<th>Дії</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>';

        if (files && files.length > 0) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                var uploader = await db.supabaseQuery('users?id=eq.' + file.uploaded_by);
                var uploaderName = uploader && uploader.length > 0 ? (uploader[0].full_name || uploader[0].email) : 'Невідомо';
                var size = file.size > 1024 * 1024 ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : (file.size / 1024).toFixed(0) + ' KB';

                html += 
                    '<tr>' +
                        '<td><strong>' + file.name + '</strong></td>' +
                        '<td>' + size + '</td>' +
                        '<td>' + uploaderName + '</td>' +
                        '<td>' +
                            '<a href="' + file.url + '" target="_blank" class="btn btn-sm btn-teal">' +
                                '<i class="fas fa-download"></i>' +
                            '</a>' +
                            '<button class="btn btn-sm btn-danger" onclick="deleteFile(\'' + file.id + '\')">' +
                                '<i class="fas fa-trash"></i>' +
                            '</button>' +
                        '</td>' +
                    '</tr>';
            }
        } else {
            html += '<tr><td colspan="4" class="text-center text-muted">Немає файлів</td></tr>';
        }

        html += 
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function openUploadFile() {
    document.getElementById('fileModal').classList.add('active');
}

document.getElementById('fileForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    var fileInput = document.getElementById('fileInput');
    var file = fileInput.files[0];

    if (!file) {
        await showAlert('Оберіть файл', 'warning');
        return;
    }

    var submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Завантаження...';

    try {
        var user = auth.getCurrentUser();
        var fileName = Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        
        var uploadResponse = await fetch(SUPABASE_URL + '/storage/v1/object/org_files/' + fileName, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            },
            body: file
        });

        if (!uploadResponse.ok) {
            var errorText = await uploadResponse.text();
            console.error('Upload error:', uploadResponse.status, errorText);
            
            if (uploadResponse.status === 404) {
                await showAlert('Сховище не налаштоване. Зверніться до адміністратора.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-upload"></i> Завантажити';
                return;
            }
            
            throw new Error('Помилка завантаження: ' + uploadResponse.status);
        }

        var fileUrl = SUPABASE_URL + '/storage/v1/object/public/org_files/' + fileName;

        await db.createFile({
            organization_id: currentOrgId,
            name: file.name,
            url: fileUrl,
            size: file.size,
            mime_type: file.type,
            uploaded_by: user ? user.id : null
        });

        await showToast('Файл завантажено!', 'success');
        closeModal('fileModal');
        document.getElementById('fileForm').reset();
        loadFiles();
    } catch (error) {
        console.error('Upload error:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-upload"></i> Завантажити';
});

async function deleteFile(fileId) {
    var confirmed = await showConfirm('Ви впевнені, що хочете видалити цей файл?', 'Підтвердження');
    if (!confirmed) return;

    try {
        var files = await db.getFiles(currentOrgId);
        var file = null;
        for (var i = 0; i < files.length; i++) {
            if (files[i].id === fileId) {
                file = files[i];
                break;
            }
        }

        if (file) {
            var fileName = file.url.split('/').pop();
            await fetch(SUPABASE_URL + '/storage/v1/object/org_files/' + fileName, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
                }
            });
        }

        await db.deleteFile(fileId);
        await showToast('Файл видалено', 'success');
        loadFiles();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ============================================
// МОДУЛЬ: КЛІНІКА
// ============================================
async function loadClinic() {
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = '🏥 Клініка';
    document.getElementById('pageSubtitle').textContent = 'Управління пацієнтами та записами';

    try {
        var patients = await db.getClinicPatients(currentOrgId);
        var appointments = await db.getClinicAppointments(currentOrgId);

        var html = '';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">';
        html += '<div class="card"><div class="card-header"><h3 class="card-title">Пацієнти (' + (patients ? patients.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openClinicPatient()"><i class="fas fa-plus"></i> Додати</button></div>';
        html += '<div id="clinicPatientsList" style="max-height:300px;overflow-y:auto;">';
        
        if (patients && patients.length > 0) {
            for (var i = 0; i < patients.length; i++) {
                var p = patients[i];
                html += '<div style="padding:0.5rem;border-bottom:1px solid var(--ink-line);display:flex;justify-content:space-between;align-items:center;">';
                html += '<div><strong>' + p.full_name + '</strong>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (p.phone || '') + (p.birth_date ? ' · ' + new Date(p.birth_date).toLocaleDateString('uk-UA') : '') + '</div></div>';
                html += '<div><button class="btn btn-sm btn-danger" onclick="deleteClinicPatient(\'' + p.id + '\')"><i class="fas fa-trash"></i></button></div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає пацієнтів</div>';
        }
        html += '</div></div>';

        html += '<div class="card"><div class="card-header"><h3 class="card-title">Записи (' + (appointments ? appointments.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openClinicAppointment()"><i class="fas fa-plus"></i> Записати</button></div>';
        html += '<div id="clinicAppointmentsList" style="max-height:300px;overflow-y:auto;">';
        
        if (appointments && appointments.length > 0) {
            for (var i = 0; i < appointments.length; i++) {
                var a = appointments[i];
                var statusClass = a.status === 'scheduled' ? 'badge-warning' : a.status === 'completed' ? 'badge-success' : 'badge-danger';
                html += '<div style="padding:0.5rem;border-bottom:1px solid var(--ink-line);">';
                html += '<div><strong>' + (a.patient_name || 'Пацієнт') + '</strong> → ' + (a.doctor_name || 'Лікар') + '</div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (a.appointment_date ? new Date(a.appointment_date).toLocaleString('uk-UA') : '') + ' <span class="badge ' + statusClass + '">' + (a.status || 'scheduled') + '</span></div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає записів</div>';
        }
        html += '</div></div></div>';

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function openClinicPatient() {
    document.getElementById('clinicPatientModal').classList.add('active');
    document.getElementById('clinicPatientId').value = '';
    document.getElementById('clinicPatientName').value = '';
    document.getElementById('clinicPatientPhone').value = '';
    document.getElementById('clinicPatientBirth').value = '';
    document.getElementById('clinicPatientBlood').value = '';
    document.getElementById('clinicPatientAllergies').value = '';
}

document.getElementById('clinicPatientForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var name = document.getElementById('clinicPatientName').value.trim();
    var phone = document.getElementById('clinicPatientPhone').value.trim();
    var birth = document.getElementById('clinicPatientBirth').value;
    var blood = document.getElementById('clinicPatientBlood').value;
    var allergies = document.getElementById('clinicPatientAllergies').value.trim();

    if (!name) {
        await showAlert('Введіть ПІБ пацієнта', 'warning');
        return;
    }

    try {
        await db.createClinicPatient({
            organization_id: currentOrgId,
            full_name: name,
            phone: phone || null,
            birth_date: birth || null,
            blood_type: blood || null,
            allergies: allergies || null
        });
        await showToast('Пацієнта додано!', 'success');
        closeModal('clinicPatientModal');
        document.getElementById('clinicPatientForm').reset();
        loadClinic();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

function openClinicAppointment() {
    document.getElementById('clinicAppointmentModal').classList.add('active');
    document.getElementById('clinicAppointmentId').value = '';
    document.getElementById('clinicAppointmentPatient').value = '';
    document.getElementById('clinicAppointmentDoctor').value = '';
    document.getElementById('clinicAppointmentDate').value = '';
    document.getElementById('clinicAppointmentReason').value = '';
    loadClinicPatientsSelect();
}

async function loadClinicPatientsSelect() {
    try {
        var patients = await db.getClinicPatients(currentOrgId);
        var select = document.getElementById('clinicAppointmentPatient');
        if (!select) return;
        
        select.innerHTML = '<option value="">Оберіть пацієнта...</option>';
        if (patients && patients.length > 0) {
            for (var i = 0; i < patients.length; i++) {
                var option = document.createElement('option');
                option.value = patients[i].id;
                option.textContent = patients[i].full_name;
                select.appendChild(option);
            }
        }
    } catch (error) {
        console.error('Load patients error:', error);
    }
}

document.getElementById('clinicAppointmentForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var patientId = document.getElementById('clinicAppointmentPatient').value;
    var doctorName = document.getElementById('clinicAppointmentDoctor').value.trim();
    var date = document.getElementById('clinicAppointmentDate').value;
    var reason = document.getElementById('clinicAppointmentReason').value.trim();

    if (!patientId || !date) {
        await showAlert('Оберіть пацієнта та дату', 'warning');
        return;
    }

    try {
        await db.createClinicAppointment({
            organization_id: currentOrgId,
            patient_id: patientId,
            doctor_name: doctorName || 'Лікар',
            appointment_date: date,
            reason: reason || null,
            status: 'scheduled'
        });
        await showToast('Запис створено!', 'success');
        closeModal('clinicAppointmentModal');
        document.getElementById('clinicAppointmentForm').reset();
        loadClinic();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

async function deleteClinicPatient(patientId) {
    var confirmed = await showConfirm('Видалити пацієнта?', 'Підтвердження');
    if (!confirmed) return;
    
    try {
        await db.supabaseQuery('clinic_patients?id=eq.' + patientId, { method: 'DELETE' });
        await showToast('Пацієнта видалено', 'success');
        loadClinic();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ============================================
// МОДУЛЬ: МАГАЗИН (СКОРОЧЕНА ВЕРСІЯ)
// ============================================
async function loadShop() {
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = '🛒 Магазин';
    document.getElementById('pageSubtitle').textContent = 'Управління товарами та продажами';

    try {
        var products = await db.getShopProducts(currentOrgId);
        var sales = await db.getShopSales(currentOrgId);

        var html = '';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">';
        html += '<div class="card"><div class="card-header"><h3 class="card-title">Товари (' + (products ? products.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openShopProduct()"><i class="fas fa-plus"></i> Додати</button></div>';
        html += '<div id="shopProductsList" style="max-height:300px;overflow-y:auto;">';
        
        if (products && products.length > 0) {
            for (var i = 0; i < products.length; i++) {
                var p = products[i];
                html += '<div style="padding:0.5rem;border-bottom:1px solid var(--ink-line);display:flex;justify-content:space-between;align-items:center;">';
                html += '<div><strong>' + p.name + '</strong><div style="font-size:0.75rem;color:var(--muted);">' + (p.price || 0) + ' грн · ' + (p.quantity || 0) + ' шт.</div></div>';
                html += '<div><button class="btn btn-sm btn-danger" onclick="deleteShopProduct(\'' + p.id + '\')"><i class="fas fa-trash"></i></button></div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає товарів</div>';
        }
        html += '</div></div>';

        html += '<div class="card"><div class="card-header"><h3 class="card-title">Продажі (' + (sales ? sales.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openShopSale()"><i class="fas fa-plus"></i> Продаж</button></div>';
        html += '<div id="shopSalesList" style="max-height:300px;overflow-y:auto;">';
        
        if (sales && sales.length > 0) {
            for (var i = 0; i < sales.length; i++) {
                var s = sales[i];
                html += '<div style="padding:0.5rem;border-bottom:1px solid var(--ink-line);">';
                html += '<div><strong>' + (s.product_name || 'Товар') + '</strong> × ' + (s.quantity || 1) + '</div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (s.total || 0) + ' грн · ' + (s.sale_date ? new Date(s.sale_date).toLocaleDateString('uk-UA') : '') + '</div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає продажів</div>';
        }
        html += '</div></div></div>';

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function openShopProduct() {
    document.getElementById('shopProductModal').classList.add('active');
    document.getElementById('shopProductId').value = '';
    document.getElementById('shopProductName').value = '';
    document.getElementById('shopProductPrice').value = '';
    document.getElementById('shopProductQuantity').value = '';
}

document.getElementById('shopProductForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var name = document.getElementById('shopProductName').value.trim();
    var price = parseFloat(document.getElementById('shopProductPrice').value);
    var quantity = parseInt(document.getElementById('shopProductQuantity').value) || 0;

    if (!name) {
        await showAlert('Введіть назву товару', 'warning');
        return;
    }

    try {
        await db.createShopProduct({
            organization_id: currentOrgId,
            name: name,
            price: price || 0,
            quantity: quantity || 0
        });
        await showToast('Товар додано!', 'success');
        closeModal('shopProductModal');
        document.getElementById('shopProductForm').reset();
        loadShop();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

function openShopSale() {
    document.getElementById('shopSaleModal').classList.add('active');
    document.getElementById('shopSaleId').value = '';
    document.getElementById('shopSaleProduct').value = '';
    document.getElementById('shopSaleQuantity').value = '1';
    document.getElementById('shopSaleCustomer').value = '';
    loadShopProductsSelect();
}

async function loadShopProductsSelect() {
    try {
        var products = await db.getShopProducts(currentOrgId);
        var select = document.getElementById('shopSaleProduct');
        if (!select) return;
        
        select.innerHTML = '<option value="">Оберіть товар...</option>';
        if (products && products.length > 0) {
            for (var i = 0; i < products.length; i++) {
                var option = document.createElement('option');
                option.value = products[i].id;
                option.textContent = products[i].name + ' (' + products[i].price + ' грн)';
                select.appendChild(option);
            }
        }
    } catch (error) {
        console.error('Load products error:', error);
    }
}

document.getElementById('shopSaleForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var productId = document.getElementById('shopSaleProduct').value;
    var quantity = parseInt(document.getElementById('shopSaleQuantity').value) || 1;
    var customer = document.getElementById('shopSaleCustomer').value.trim();

    if (!productId) {
        await showAlert('Оберіть товар', 'warning');
        return;
    }

    try {
        var products = await db.getShopProducts(currentOrgId);
        var product = null;
        for (var i = 0; i < products.length; i++) {
            if (products[i].id === productId) {
                product = products[i];
                break;
            }
        }
        var price = product ? product.price : 0;
        
        await db.createShopSale({
            organization_id: currentOrgId,
            product_id: productId,
            quantity: quantity,
            price: price,
            total: price * quantity,
            customer_name: customer || null,
            payment_method: 'cash',
            status: 'completed'
        });
        
        if (product) {
            var newQuantity = (product.quantity || 0) - quantity;
            await db.supabaseQuery('shop_products?id=eq.' + productId, {
                method: 'PATCH',
                body: JSON.stringify({ quantity: Math.max(0, newQuantity) })
            });
        }
        
        await showToast('Продаж оформлено!', 'success');
        closeModal('shopSaleModal');
        document.getElementById('shopSaleForm').reset();
        loadShop();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

async function deleteShopProduct(productId) {
    var confirmed = await showConfirm('Видалити товар?', 'Підтвердження');
    if (!confirmed) return;
    
    try {
        await db.supabaseQuery('shop_products?id=eq.' + productId, { method: 'DELETE' });
        await showToast('Товар видалено', 'success');
        loadShop();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ============================================
// МОДУЛЬ: БІБЛІОТЕКА (СКОРОЧЕНА ВЕРСІЯ)
// ============================================
async function loadLibrary() {
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = '📚 Бібліотека';
    document.getElementById('pageSubtitle').textContent = 'Управління книгами та читачами';

    try {
        var books = await db.getLibraryBooks(currentOrgId);
        var loans = await db.getLibraryLoans(currentOrgId);

        var html = '';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">';
        html += '<div class="card"><div class="card-header"><h3 class="card-title">Книги (' + (books ? books.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openLibraryBook()"><i class="fas fa-plus"></i> Додати</button></div>';
        html += '<div id="libraryBooksList" style="max-height:300px;overflow-y:auto;">';
        
        if (books && books.length > 0) {
            for (var i = 0; i < books.length; i++) {
                var b = books[i];
                html += '<div style="padding:0.5rem;border-bottom:1px solid var(--ink-line);">';
                html += '<div><strong>' + b.title + '</strong> — ' + (b.author || 'Невідомо') + '</div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">В наявності: ' + (b.available || 0) + '/' + (b.quantity || 0) + '</div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає книг</div>';
        }
        html += '</div></div>';

        html += '<div class="card"><div class="card-header"><h3 class="card-title">Видача (' + (loans ? loans.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openLibraryLoan()"><i class="fas fa-hand-holding"></i> Видати</button></div>';
        html += '<div id="libraryLoansList" style="max-height:300px;overflow-y:auto;">';
        
        if (loans && loans.length > 0) {
            for (var i = 0; i < loans.length; i++) {
                var l = loans[i];
                var statusClass = l.status === 'active' ? 'badge-warning' : 'badge-success';
                html += '<div style="padding:0.5rem;border-bottom:1px solid var(--ink-line);">';
                html += '<div><strong>' + (l.book_title || 'Книга') + '</strong> → ' + (l.reader_name || 'Читач') + '</div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (l.loan_date ? new Date(l.loan_date).toLocaleDateString('uk-UA') : '') + ' <span class="badge ' + statusClass + '">' + (l.status || 'active') + '</span></div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає видач</div>';
        }
        html += '</div></div></div>';

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function openLibraryBook() {
    document.getElementById('libraryBookModal').classList.add('active');
    document.getElementById('libraryBookId').value = '';
    document.getElementById('libraryBookTitle').value = '';
    document.getElementById('libraryBookAuthor').value = '';
    document.getElementById('libraryBookIsbn').value = '';
    document.getElementById('libraryBookQuantity').value = '1';
}

document.getElementById('libraryBookForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var title = document.getElementById('libraryBookTitle').value.trim();
    var author = document.getElementById('libraryBookAuthor').value.trim();
    var isbn = document.getElementById('libraryBookIsbn').value.trim();
    var quantity = parseInt(document.getElementById('libraryBookQuantity').value) || 1;

    if (!title) {
        await showAlert('Введіть назву книги', 'warning');
        return;
    }

    try {
        await db.createLibraryBook({
            organization_id: currentOrgId,
            title: title,
            author: author || null,
            isbn: isbn || null,
            quantity: quantity,
            available: quantity
        });
        await showToast('Книгу додано!', 'success');
        closeModal('libraryBookModal');
        document.getElementById('libraryBookForm').reset();
        loadLibrary();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

function openLibraryLoan() {
    document.getElementById('libraryLoanModal').classList.add('active');
    document.getElementById('libraryLoanId').value = '';
    document.getElementById('libraryLoanBook').value = '';
    document.getElementById('libraryLoanReader').value = '';
    loadLibraryBooksSelect();
    loadLibraryReadersSelect();
}

async function loadLibraryBooksSelect() {
    try {
        var books = await db.getLibraryBooks(currentOrgId);
        var select = document.getElementById('libraryLoanBook');
        if (!select) return;
        
        select.innerHTML = '<option value="">Оберіть книгу...</option>';
        if (books && books.length > 0) {
            for (var i = 0; i < books.length; i++) {
                if ((books[i].available || 0) > 0) {
                    var option = document.createElement('option');
                    option.value = books[i].id;
                    option.textContent = books[i].title + ' (' + books[i].available + ' шт.)';
                    select.appendChild(option);
                }
            }
        }
    } catch (error) {
        console.error('Load books error:', error);
    }
}

async function loadLibraryReadersSelect() {
    try {
        var readers = await db.getLibraryReaders(currentOrgId);
        var select = document.getElementById('libraryLoanReader');
        if (!select) return;
        
        select.innerHTML = '<option value="">Оберіть читача...</option>';
        if (readers && readers.length > 0) {
            for (var i = 0; i < readers.length; i++) {
                var option = document.createElement('option');
                option.value = readers[i].id;
                option.textContent = readers[i].full_name;
                select.appendChild(option);
            }
        }
    } catch (error) {
        console.error('Load readers error:', error);
    }
}

document.getElementById('libraryLoanForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var bookId = document.getElementById('libraryLoanBook').value;
    var readerId = document.getElementById('libraryLoanReader').value;

    if (!bookId || !readerId) {
        await showAlert('Оберіть книгу та читача', 'warning');
        return;
    }

    try {
        await db.createLibraryLoan({
            organization_id: currentOrgId,
            book_id: bookId,
            reader_id: readerId,
            loan_date: new Date().toISOString(),
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
        });
        
        var books = await db.getLibraryBooks(currentOrgId);
        var book = null;
        for (var i = 0; i < books.length; i++) {
            if (books[i].id === bookId) {
                book = books[i];
                break;
            }
        }
        if (book) {
            await db.supabaseQuery('library_books?id=eq.' + bookId, {
                method: 'PATCH',
                body: JSON.stringify({ available: Math.max(0, (book.available || 0) - 1) })
            });
        }
        
        await showToast('Книгу видано!', 'success');
        closeModal('libraryLoanModal');
        document.getElementById('libraryLoanForm').reset();
        loadLibrary();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

// ============================================
// МОДУЛЬ: НАЛАШТУВАННЯ
// ============================================
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
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

function closeModal(id) {
    var modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

function selectColor(el) {
    var options = document.querySelectorAll('.color-option');
    for (var i = 0; i < options.length; i++) {
        options[i].classList.remove('selected');
    }
    el.classList.add('selected');
    var colorEl = document.getElementById('rankColor');
    if (colorEl) colorEl.value = el.style.backgroundColor;
}

// ===== ЗАКРИТТЯ МОДАЛОК ПО КЛІКУ ПОЗА НЕЮ =====
var modals = document.querySelectorAll('.modal');
for (var m = 0; m < modals.length; m++) {
    modals[m].addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
}

// ===== ВИДАЛЕННЯ АККАУНТА =====
async function deleteUserAccount() {
    var confirmed = await showConfirm('Ви впевнені, що хочете видалити свій акаунт? Це незворотна дія!', '⚠️ Увага');
    if (!confirmed) return;
    
    var confirmed2 = await showConfirm('Всі ваші дані будуть втрачені. Продовжити?', 'Останнє попередження');
    if (!confirmed2) return;

    try {
        var user = auth.getCurrentUser();
        await db.deleteUser(user.id);
        localStorage.removeItem('userData');
        await showToast('Акаунт видалено', 'success');
        setTimeout(function() {
            window.location.href = '/login';
        }, 1500);
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ===== ЗАПУСК =====
init();
