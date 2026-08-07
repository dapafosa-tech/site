var currentOrgId = null;
var currentOrg = null;
var allPatients = [];
var allProducts = [];
var allSales = [];
var allBooks = [];
var allStudents = [];
var allRooms = [];
var allMemberships = [];
var allServices = [];
var allAutoOrders = [];
var allProperties = [];
var allLogisticsOrders = [];
var allDeliveryOrders = [];
var allProjects = [];
var allOrders = [];
var selectedOrderItems = [];

function checkOrgActive() {
    if (currentOrg && currentOrg.is_active === false) {
        var reason = currentOrg.freeze_reason || 'Причина не вказана';
        showAlert(
            'Організація заморожена адміністрацією.\n\nПричина: ' + reason + '\n\nДоступ до всіх функцій обмежено.',
            'warning',
            'Організація неактивна'
        );
        return false;
    }
    return true;
}

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
    'pending': 'Очікує',
    'approved': 'Схвалено',
    'rejected': 'Відхилено'
};

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

var taskStatusLabels = {
    'new': 'Нове',
    'in_progress': 'В роботі',
    'review': 'На перевірці',
    'done': 'Виконано',
    'closed': 'Закрито'
};

var taskPriorityLabels = {
    'low': 'Низький',
    'medium': 'Середній',
    'high': 'Високий',
    'urgent': 'Терміновий'
};

var orderStatusLabels = {
    'new': 'Прийнято',
    'in_progress': 'В процесі',
    'completed': 'Виконано',
    'cancelled': 'Скасовано'
};

function setupNavigationByType(orgType) {
    var navMap = {
        'clinic': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'clinic'],
        'shop': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'shop'],
        'library': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'library'],
        'school': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'school'],
        'restaurant': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'restaurant'],
        'cafe': ['overview', 'members', 'requests', 'ranks', 'departments', 'chat', 'vacations', 'events', 'tasks', 'polls', 'files', 'settings', 'restaurant'],
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
        } else {
            link.style.display = 'none';
        }
    });
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

    if (currentOrg.is_active === false) {
        var reason = currentOrg.freeze_reason || 'Причина не вказана';
        await showAlert(
            'Організація "' + currentOrg.name + '" заморожена адміністрацією.\n\nПричина: ' + reason + '\n\nДоступ до всіх функцій обмежено.',
            'warning',
            'Організація неактивна'
        );
    }

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

    if (!checkOrgActive() && section !== 'overview' && section !== 'settings') {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена. Доступні лише Огляд та Налаштування.</div>';
        document.getElementById('pageTitle').textContent = 'Доступ заборонено';
        document.getElementById('pageSubtitle').textContent = 'Організація заморожена';
        return;
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
        var isActive = currentOrg && currentOrg.is_active !== false;

        container.innerHTML = 
            '<div class="grid-4">' +
                '<div class="stat-card" style="' + (!isActive ? 'border-color:#E2503E;' : '') + '">' +
                    '<div class="stat-value" style="' + (!isActive ? 'color:#E2503E;' : '') + '">' + (members ? members.length : 0) + '</div>' +
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
                    (!isActive ? '<span style="color:#E2503E;font-weight:600;font-size:0.85rem;"><i class="fas fa-lock"></i> ЗАМОРОЖЕНО</span>' : '') +
                '</div>' +
                '<div class="grid-2">' +
                    '<div>' +
                        '<p><strong>Назва:</strong> ' + (currentOrg ? currentOrg.name : '') + '</p>' +
                        '<p><strong>Тип:</strong> ' + (currentOrg ? (typeLabels[currentOrg.type] || currentOrg.type) : '') + '</p>' +
                        '<p><strong>Опис:</strong> ' + (currentOrg ? (currentOrg.description || 'Немає опису') : '') + '</p>' +
                        (!isActive ? '<p><strong>Причина заморозки:</strong> <span style="color:#E2503E;">' + (currentOrg.freeze_reason || 'Причина не вказана') + '</span></p>' : '') +
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

async function loadMembers() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Учасники';
    document.getElementById('pageSubtitle').textContent = 'Управління учасниками організації';

    try {
        var members = await db.getOrganizationMembers(currentOrgId);
        var ranks = await db.getOrganizationRanks(currentOrgId);
        var user = auth.getCurrentUser();
        var isLeader = currentOrg && currentOrg.leader_id === (user ? user.id : null);

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
                                '<th>Відділ</th>' +
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
                    
                    var employee = null;
                    var employees = await db.getOrganizationEmployees(currentOrgId);
                    for (var e = 0; e < employees.length; e++) {
                        if (employees[e].user_id === member.user_id && employees[e].organization_id === currentOrgId) {
                            employee = employees[e];
                            break;
                        }
                    }
                    
                    var departmentName = '—';
                    if (employee && employee.department_id) {
                        var depts = await db.getOrganizationDepartments(currentOrgId);
                        for (var d = 0; d < depts.length; d++) {
                            if (depts[d].id === employee.department_id) {
                                departmentName = depts[d].name;
                                break;
                            }
                        }
                    }
                    
                    var isLeaderUser = currentOrg && currentOrg.leader_id === member.user_id;
                    var isCurrentUser = member.user_id === (user ? user.id : null);
                    var canManage = isLeader && !isLeaderUser && !isCurrentUser;

                    html += 
                        '<tr>' +
                            '<td><strong>' + userName + (isLeaderUser ? ' (керівник)' : '') + (isCurrentUser ? ' (ви)' : '') + '</strong></td>' +
                            '<td>' + (rank ? '<span style="color:' + rank.color + '">' + rank.name + (rank.is_default ? ' (основна)' : '') + '</span>' : 'Без посади') + '</td>' +
                            '<td>' + departmentName + '</td>' +
                            '<td>' + new Date(member.joined_at).toLocaleDateString('uk-UA') + '</td>' +
                            '<td>' + (canManage ? 
                                '<div style="display:flex;gap:0.25rem;flex-wrap:wrap;">' +
                                    '<button class="btn btn-sm btn-teal" onclick="openAssignRank(\'' + member.id + '\', \'' + userName + '\')" title="Змінити посаду">' +
                                        '<i class="fas fa-crown"></i>' +
                                    '</button>' +
                                    (rank && !rank.is_default ? 
                                        '<button class="btn btn-sm btn-warning" onclick="removeRankFromMember(\'' + member.id + '\')" title="Зняти посаду">' +
                                            '<i class="fas fa-times-circle"></i>' +
                                        '</button>' : '') +
                                    (employee && employee.department_id ? 
                                        '<button class="btn btn-sm btn-warning" onclick="removeFromDepartment(\'' + employee.id + '\')" title="Видалити з відділу">' +
                                            '<i class="fas fa-user-slash"></i>' +
                                        '</button>' : '') +
                                    '<button class="btn btn-sm btn-danger" onclick="removeMember(\'' + member.id + '\', \'' + userName + '\')" title="Вигнати з організації">' +
                                        '<i class="fas fa-user-minus"></i>' +
                                    '</button>' +
                                '</div>' : (isCurrentUser ? '—' : '—')) + '</td>' +
                        '</tr>';
                } catch (e) {}
            }
        } else {
            html += '<tr><td colspan="5" class="text-center text-muted">Немає учасників</td></tr>';
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

async function removeRankFromMember(memberId) {
    var confirmed = await showConfirm('Зняти посаду з цього користувача?', 'Підтвердження');
    if (!confirmed) return;

    try {
        await db.updateMemberRank(memberId, null);
        await showToast('Посаду знято!', 'success');
        loadMembers();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function removeFromDepartment(employeeId) {
    var confirmed = await showConfirm('Видалити цього співробітника з відділу?', 'Підтвердження');
    if (!confirmed) return;

    try {
        await db.removeEmployeeFromDepartment(employeeId);
        await showToast('Співробітника видалено з відділу!', 'success');
        loadMembers();
        loadDepartments();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function removeMember(memberId, userName) {
    var confirmed = await showConfirm('Ви впевнені, що хочете вигнати користувача "' + userName + '" з організації?', 'Увага');
    if (!confirmed) return;

    try {
        await db.removeMemberFromOrganization(memberId);
        var employees = await db.getOrganizationEmployees(currentOrgId);
        for (var i = 0; i < employees.length; i++) {
            if (employees[i].user_id) {
                var userData = await db.supabaseQuery('users?id=eq.' + employees[i].user_id);
                if (userData && userData.length > 0) {
                    var emp = employees[i];
                    await db.deleteEmployee(emp.id);
                    break;
                }
            }
        }
        await showToast('Користувача вигнано з організації!', 'success');
        loadMembers();
        loadOverview();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function loadRequests() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
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
                                '</button>' : (isPending ? 'Очікує' : '—')) + '</td>' +
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

async function loadRanks() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
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
                        '<td><strong>' + rank.name + (rank.is_default ? ' (основна)' : '') + '</strong></td>' +
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

    resetRankTabs();
    document.getElementById('rankModal').classList.add('active');
}

function resetRankTabs() {
    var tabBtns = document.querySelectorAll('.rank-tab-btn');
    tabBtns.forEach(function(b, i) {
        b.classList.toggle('active', i === 0);
        b.style.color = i === 0 ? 'var(--gold)' : '';
        b.style.borderBottom = i === 0 ? '2px solid var(--gold)' : '';
    });
    var viewTab = document.getElementById('rankTabView');
    var actionsTab = document.getElementById('rankTabActions');
    if (viewTab) viewTab.style.display = 'block';
    if (actionsTab) actionsTab.style.display = 'none';
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

        resetRankTabs();
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

document.querySelectorAll('.rank-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        var tab = this.getAttribute('data-tab');

        document.querySelectorAll('.rank-tab-btn').forEach(function(b) {
            b.classList.remove('active');
            b.style.color = '';
            b.style.borderBottom = '';
        });
        this.classList.add('active');
        this.style.color = 'var(--gold)';
        this.style.borderBottom = '2px solid var(--gold)';

        var viewTab = document.getElementById('rankTabView');
        var actionsTab = document.getElementById('rankTabActions');
        if (tab === 'actions') {
            viewTab.style.display = 'none';
            actionsTab.style.display = 'block';
        } else {
            viewTab.style.display = 'block';
            actionsTab.style.display = 'none';
        }
    });
});

function toggleAllViewPermissions() {
    var master = document.getElementById('viewAllPermissions');
    var checkboxes = document.querySelectorAll('#rankTabView .rank-permission');
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].id === 'viewAllPermissions') continue;
        checkboxes[i].checked = master.checked;
    }
}

function toggleAllActionsPermissions() {
    var master = document.getElementById('actionsAllPermissions');
    var checkboxes = document.querySelectorAll('#rankTabActions .rank-permission');
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].id === 'actionsAllPermissions') continue;
        checkboxes[i].checked = master.checked;
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

async function loadDepartments() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
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
                    ? employees.filter(function(e) { return e.organization_id === currentOrgId; }).map(function(e) { return (e.first_name + ' ' + e.last_name).trim(); }).join(', ')
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

    var select = document.getElementById('assignEmployeeSelect');
    select.innerHTML = '<option value="">Завантаження...</option>';

    try {
        var employees = await ensureEmployeesForMembers(currentOrgId);

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
                    option.textContent = fullName || emp.email || 'Без імені';
                    select.appendChild(option);
                }
            }
        }

        if (select.options.length <= 1) {
            select.innerHTML = '<option value="">Усі учасники вже розподілені по відділах</option>';
        }
    } catch (error) {
        select.innerHTML = '<option value="">Помилка завантаження учасників</option>';
        console.error('openAssignEmployee error:', error);
    }

    document.getElementById('assignEmployeeModal').classList.add('active');
}

async function ensureEmployeesForMembers(orgId) {
    var members = await db.getOrganizationMembers(orgId);
    var employees = await db.getOrganizationEmployees(orgId);

    if (!members || members.length === 0) {
        return employees || [];
    }

    employees = employees.filter(function(e) { return e.organization_id === orgId; });

    var existingByUserId = {};
    (employees || []).forEach(function(e) {
        if (e.user_id) existingByUserId[e.user_id] = e;
    });

    var created = [];
    for (var i = 0; i < members.length; i++) {
        var member = members[i];
        if (!member.user_id || existingByUserId[member.user_id]) continue;

        try {
            var userData = await db.supabaseQuery('users?id=eq.' + member.user_id);
            var u = userData && userData.length > 0 ? userData[0] : null;
            var fullName = (u && u.full_name ? u.full_name : '').trim();
            var nameParts = fullName ? fullName.split(/\s+/) : [];

            var newEmployee = await db.createEmployee({
                organization_id: orgId,
                user_id: member.user_id,
                first_name: nameParts[0] || (u ? u.email : '') || 'Учасник',
                last_name: nameParts.slice(1).join(' ') || '',
                email: u ? u.email : '',
                status: 'active'
            });

            if (newEmployee && newEmployee.length > 0) {
                created.push(newEmployee[0]);
            }
        } catch (e) {
            console.error('Не вдалося створити картку співробітника для учасника', member.id, e);
        }
    }

    return (employees || []).concat(created);
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

async function loadChat() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
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
                                (hasMention ? ' (згадування)' : '') +
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

async function loadVacations() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
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

async function loadEvents() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
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

async function loadTasks() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
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

async function loadPolls() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
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
            html += '<p style="color:var(--teal);margin-top:1rem;">Ви вже проголосували</p>';
        } else {
            html += '<p style="color:var(--muted);margin-top:1rem;">Опитування завершено</p>';
        }

        await showAlert(html, 'info', 'Результати опитування');
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

async function loadFiles() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
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
        var fileExt = file.name.split('.').pop();
        var fileName = Date.now() + '_' + Math.random().toString(36).substring(7) + '.' + fileExt;
        
        var uploadUrl = SUPABASE_URL + '/storage/v1/object/public/org_files/' + fileName;

        var uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
            },
            body: file
        });

        if (!uploadResponse.ok) {
            var errorText = await uploadResponse.text();
            
            if (uploadResponse.status === 404) {
                await showAlert('Сховище не знайдено. Перевірте назву bucket: "org_files"', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-upload"></i> Завантажити';
                return;
            }
            
            if (uploadResponse.status === 403) {
                await showAlert('Немає прав на завантаження. Перевірте політики.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-upload"></i> Завантажити';
                return;
            }
            
            throw new Error('Помилка завантаження: ' + uploadResponse.status + ' - ' + errorText);
        }

        var fileUrl = SUPABASE_URL + '/storage/v1/object/public/org_files/' + fileName;

        await db.createFile({
            organization_id: currentOrgId,
            name: file.name,
            url: fileUrl,
            size: file.size,
            mime_type: file.type || 'application/octet-stream',
            uploaded_by: user ? user.id : null
        });

        await showToast('Файл завантажено!', 'success');
        closeModal('fileModal');
        document.getElementById('fileForm').reset();
        loadFiles();
    } catch (error) {
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
            await fetch(SUPABASE_URL + '/storage/v1/object/public/org_files/' + fileName, {
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

var modals = document.querySelectorAll('.modal');
for (var m = 0; m < modals.length; m++) {
    modals[m].addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
}

async function deleteUserAccount() {
    var confirmed = await showConfirm('Ви впевнені, що хочете видалити свій акаунт? Це незворотна дія!', 'Увага');
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

init();

// ===== МОДУЛЬ: КЛІНІКА =====
async function loadClinic() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Клініка';
    document.getElementById('pageSubtitle').textContent = 'Управління пацієнтами та записами';

    try {
        var patients = await db.getClinicPatients(currentOrgId);
        var appointments = await db.getClinicAppointments(currentOrgId);
        allPatients = patients || [];

        var html = '';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">';
        
        html += '<div class="card">';
        html += '<div class="card-header">';
        html += '<h3 class="card-title">Пацієнти (' + (patients ? patients.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openClinicPatient()"><i class="fas fa-plus"></i> Додати</button>';
        html += '</div>';
        html += '<div style="margin-bottom:0.75rem;display:flex;gap:0.5rem;">';
        html += '<input type="text" class="form-control" id="patientSearch" placeholder="Пошук пацієнтів..." style="flex:1;" oninput="filterPatients()">';
        html += '</div>';
        html += '<div id="clinicPatientsList" style="max-height:300px;overflow-y:auto;">';
        
        if (patients && patients.length > 0) {
            for (var i = 0; i < patients.length; i++) {
                var p = patients[i];
                html += '<div class="patient-item" data-name="' + (p.full_name || '').toLowerCase() + '" data-phone="' + (p.phone || '') + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="viewClinicPatient(\'' + p.id + '\')">';
                html += '<div><strong>' + (p.full_name || 'Без імені') + '</strong>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (p.phone || '') + (p.birth_date ? ' · ' + new Date(p.birth_date).toLocaleDateString('uk-UA') : '') + '</div></div>';
                html += '<div><button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteClinicPatient(\'' + p.id + '\')"><i class="fas fa-trash"></i></button></div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає пацієнтів.</div>';
        }
        html += '</div></div>';

        html += '<div class="card">';
        html += '<div class="card-header">';
        html += '<h3 class="card-title">Записи (' + (appointments ? appointments.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openClinicAppointment()"><i class="fas fa-plus"></i> Записати</button>';
        html += '</div>';
        html += '<div id="clinicAppointmentsList" style="max-height:300px;overflow-y:auto;">';
        
        if (appointments && appointments.length > 0) {
            for (var i = 0; i < appointments.length; i++) {
                var a = appointments[i];
                var statusMap = {
                    'scheduled': { class: 'badge-scheduled', label: 'Заплановано' },
                    'in_progress': { class: 'badge-in_progress', label: 'В процесі' },
                    'completed': { class: 'badge-completed', label: 'Виконано' },
                    'cancelled': { class: 'badge-cancelled', label: 'Скасовано' }
                };
                var statusInfo = statusMap[a.status] || { class: 'badge-secondary', label: a.status || 'Невідомо' };
                
                html += '<div style="padding:0.5rem;border-bottom:1px solid var(--ink-line);">';
                html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
                html += '<div><strong>' + (a.patient_name || 'Пацієнт') + '</strong> → ' + (a.doctor_name || 'Лікар') + '</div>';
                html += '<div>';
                html += '<span class="badge ' + statusInfo.class + '" style="margin-right:0.5rem;">' + statusInfo.label + '</span>';
                html += '<button class="btn btn-sm btn-teal" onclick="changeAppointmentStatus(\'' + a.id + '\', \'' + a.status + '\')" title="Змінити статус" style="padding:0.1rem 0.4rem;font-size:0.6rem;">';
                html += '<i class="fas fa-sync"></i>';
                html += '</button>';
                html += '</div>';
                html += '</div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (a.appointment_date ? new Date(a.appointment_date).toLocaleString('uk-UA') : '') + (a.reason ? ' · ' + a.reason : '') + '</div>';
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

function filterPatients() {
    var searchInput = document.getElementById('patientSearch');
    if (!searchInput) return;
    var query = searchInput.value.toLowerCase().trim();
    var items = document.querySelectorAll('.patient-item');
    items.forEach(function(item) {
        var name = item.getAttribute('data-name') || '';
        var phone = item.getAttribute('data-phone') || '';
        if (name.indexOf(query) !== -1 || phone.indexOf(query) !== -1) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

async function viewClinicPatient(patientId) {
    try {
        var patients = await db.getClinicPatients(currentOrgId);
        var patient = null;
        for (var i = 0; i < patients.length; i++) {
            if (patients[i].id === patientId) {
                patient = patients[i];
                break;
            }
        }
        if (!patient) return;
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">' + patient.full_name + '</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Телефон:</strong> ' + (patient.phone || '—') + '</div>';
        html += '<div><strong>Дата народження:</strong> ' + (patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('uk-UA') : '—') + '</div>';
        html += '<div><strong>Група крові:</strong> ' + (patient.blood_type || '—') + '</div>';
        html += '<div><strong>Алергії:</strong> ' + (patient.allergies || 'Немає') + '</div>';
        html += '<div style="grid-column:span 2;"><strong>Адреса:</strong> ' + (patient.address || '—') + '</div>';
        html += '</div></div>';
        
        html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">';
        html += '<button class="btn btn-danger" onclick="closeModal(\'alertModal\');deleteClinicPatient(\'' + patient.id + '\')"><i class="fas fa-trash"></i> Видалити</button>';
        html += '</div>';
        
        await showAlert(html, 'info', 'Пацієнт');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
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
                option.textContent = patients[i].full_name + (patients[i].phone ? ' (' + patients[i].phone + ')' : '');
                select.appendChild(option);
            }
        } else {
            select.innerHTML = '<option value="">Немає пацієнтів. Спочатку додайте пацієнта.</option>';
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

    if (!patientId) {
        await showAlert('Оберіть пацієнта зі списку', 'warning');
        return;
    }
    if (!date) {
        await showAlert('Оберіть дату та час', 'warning');
        return;
    }

    try {
        var patients = await db.getClinicPatients(currentOrgId);
        var patientName = '';
        for (var i = 0; i < patients.length; i++) {
            if (patients[i].id === patientId) {
                patientName = patients[i].full_name;
                break;
            }
        }
        
        await db.createClinicAppointment({
            organization_id: currentOrgId,
            patient_id: patientId,
            patient_name: patientName || null,
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
    var confirmed = await showConfirm('Видалити пацієнта? Всі його записи також будуть видалені.', 'Підтвердження');
    if (!confirmed) return;
    try {
        await db.supabaseQuery('clinic_patients?id=eq.' + patientId, { method: 'DELETE' });
        await showToast('Пацієнта видалено', 'success');
        loadClinic();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function changeAppointmentStatus(appointmentId, currentStatus) {
    var statuses = [
        { value: 'scheduled', label: 'Заплановано' },
        { value: 'in_progress', label: 'В процесі' },
        { value: 'completed', label: 'Виконано' },
        { value: 'cancelled', label: 'Скасовано' }
    ];
    
    var currentLabel = 'Невідомо';
    for (var i = 0; i < statuses.length; i++) {
        if (statuses[i].value === currentStatus) {
            currentLabel = statuses[i].label;
            break;
        }
    }
    
    var html = '';
    html += '<div style="display:flex;flex-direction:column;gap:0.75rem;">';
    html += '<p style="color:var(--text-secondary);margin-bottom:0.25rem;font-size:0.95rem;">Поточний статус: <strong style="color:var(--gold);">' + currentLabel + '</strong></p>';
    html += '<p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:0.25rem;">Оберіть новий статус:</p>';
    
    for (var i = 0; i < statuses.length; i++) {
        var s = statuses[i];
        var isActive = s.value === currentStatus;
        var btnClass = isActive ? 'btn-gold' : 'btn-outline';
        var style = isActive ? 'opacity:0.7;cursor:default;' : '';
        
        html += '<button class="btn ' + btnClass + '" onclick="setAppointmentStatus(\'' + appointmentId + '\', \'' + s.value + '\')" style="width:100%;justify-content:center;' + style + '">';
        html += s.label + (isActive ? ' (поточний)' : '');
        html += '</button>';
    }
    html += '</div>';
    
    await showAlert(html, 'info', 'Зміна статусу запису');
}

async function setAppointmentStatus(appointmentId, newStatus) {
    try {
        closeModal('alertModal');
        
        var labels = {
            'scheduled': 'Заплановано',
            'in_progress': 'В процесі',
            'completed': 'Виконано',
            'cancelled': 'Скасовано'
        };
        
        var confirmed = await showConfirm('Змінити статус на "' + labels[newStatus] + '"?', 'Підтвердження');
        if (!confirmed) return;
        
        await db.supabaseQuery('clinic_appointments?id=eq.' + appointmentId, {
            method: 'PATCH',
            body: JSON.stringify({ 
                status: newStatus,
                updated_at: new Date().toISOString()
            })
        });
        
        await showToast('Статус оновлено!', 'success');
        loadClinic();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ===== МОДУЛЬ: МАГАЗИН =====
async function loadShop() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Магазин';
    document.getElementById('pageSubtitle').textContent = 'Управління товарами та продажами';

    try {
        var products = await db.getShopProducts(currentOrgId);
        var sales = await db.getShopSales(currentOrgId);
        allProducts = products || [];
        allSales = sales || [];

        var html = '';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">';
        
        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Товари (' + (products ? products.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openShopProduct()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="shopProductSearch" placeholder="Пошук товарів..." oninput="filterShopProducts()"></div>';
        html += '<div id="shopProductsList" style="max-height:300px;overflow-y:auto;">';
        if (products && products.length > 0) {
            for (var i = 0; i < products.length; i++) {
                var p = products[i];
                html += '<div class="shop-product-item" data-id="' + p.id + '" data-name="' + (p.name || '').toLowerCase() + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="viewShopProduct(\'' + p.id + '\')">';
                html += '<div><strong>' + p.name + '</strong><div style="font-size:0.75rem;color:var(--muted);">' + (p.price || 0) + ' грн · ' + (p.quantity || 0) + ' шт.</div></div>';
                html += '<div><button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteShopProduct(\'' + p.id + '\')"><i class="fas fa-trash"></i></button></div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає товарів</div>';
        }
        html += '</div></div>';

        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Продажі (' + (sales ? sales.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openShopSale()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="shopSaleSearch" placeholder="Пошук продажів..." oninput="filterShopSales()"></div>';
        html += '<div id="shopSalesList" style="max-height:300px;overflow-y:auto;">';
        if (sales && sales.length > 0) {
            for (var i = 0; i < sales.length; i++) {
                var s = sales[i];
                html += '<div class="shop-sale-item" data-id="' + s.id + '" data-customer="' + (s.customer_name || '').toLowerCase() + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);cursor:pointer;" onclick="viewShopSale(\'' + s.id + '\')">';
                html += '<div><strong>' + (s.product_name || 'Товар') + '</strong> × ' + (s.quantity || 1) + '</div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (s.total || 0) + ' грн · ' + (s.sale_date ? new Date(s.sale_date).toLocaleDateString('uk-UA') : '') + (s.customer_name ? ' · ' + s.customer_name : '') + '</div>';
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

function filterShopProducts() {
    var query = document.getElementById('shopProductSearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.shop-product-item');
    items.forEach(function(item) {
        var name = item.getAttribute('data-name') || '';
        if (name.indexOf(query) !== -1) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterShopSales() {
    var query = document.getElementById('shopSaleSearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.shop-sale-item');
    items.forEach(function(item) {
        var customer = item.getAttribute('data-customer') || '';
        if (customer.indexOf(query) !== -1) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

async function viewShopProduct(productId) {
    try {
        var products = await db.getShopProducts(currentOrgId);
        var product = null;
        for (var i = 0; i < products.length; i++) {
            if (products[i].id === productId) {
                product = products[i];
                break;
            }
        }
        if (!product) return;
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">' + product.name + '</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Ціна:</strong> ' + (product.price || 0) + ' грн</div>';
        html += '<div><strong>Кількість:</strong> ' + (product.quantity || 0) + ' шт.</div>';
        html += '<div><strong>Мінімум:</strong> ' + (product.min_quantity || 0) + ' шт.</div>';
        html += '<div><strong>Категорія:</strong> ' + (product.category || '—') + '</div>';
        html += '<div style="grid-column:span 2;"><strong>Опис:</strong> ' + (product.description || 'Немає опису') + '</div>';
        html += '</div></div>';
        
        html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">';
        html += '<button class="btn btn-teal" onclick="closeModal(\'alertModal\');openEditShopProduct(\'' + product.id + '\')"><i class="fas fa-edit"></i> Редагувати</button>';
        html += '<button class="btn btn-danger" onclick="closeModal(\'alertModal\');deleteShopProduct(\'' + product.id + '\')"><i class="fas fa-trash"></i> Видалити</button>';
        html += '</div>';
        
        await showAlert(html, 'info', 'Товар');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function viewShopSale(saleId) {
    try {
        var sales = await db.getShopSales(currentOrgId);
        var sale = null;
        for (var i = 0; i < sales.length; i++) {
            if (sales[i].id === saleId) {
                sale = sales[i];
                break;
            }
        }
        if (!sale) return;
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">Продаж #' + sale.id.slice(0,8) + '</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Товар:</strong> ' + (sale.product_name || '—') + '</div>';
        html += '<div><strong>Кількість:</strong> ' + (sale.quantity || 0) + '</div>';
        html += '<div><strong>Ціна:</strong> ' + (sale.price || 0) + ' грн</div>';
        html += '<div><strong>Сума:</strong> ' + (sale.total || 0) + ' грн</div>';
        html += '<div><strong>Клієнт:</strong> ' + (sale.customer_name || '—') + '</div>';
        html += '<div><strong>Дата:</strong> ' + (sale.sale_date ? new Date(sale.sale_date).toLocaleString('uk-UA') : '—') + '</div>';
        html += '<div><strong>Статус:</strong> ' + (sale.status || 'completed') + '</div>';
        html += '</div></div>';
        
        await showAlert(html, 'info', 'Продаж');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

function openEditShopProduct(productId) {
    openShopProduct(productId);
}

function openShopProduct(editId) {
    document.getElementById('shopProductModal').classList.add('active');
    if (editId) {
        var product = allProducts.find(function(p) { return p.id === editId; });
        if (product) {
            document.getElementById('shopProductId').value = product.id;
            document.getElementById('shopProductName').value = product.name;
            document.getElementById('shopProductPrice').value = product.price;
            document.getElementById('shopProductQuantity').value = product.quantity;
        }
    } else {
        document.getElementById('shopProductId').value = '';
        document.getElementById('shopProductName').value = '';
        document.getElementById('shopProductPrice').value = '';
        document.getElementById('shopProductQuantity').value = '';
    }
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
        var productName = product ? product.name : 'Товар';
        
        await db.createShopSale({
            organization_id: currentOrgId,
            product_id: productId,
            product_name: productName,
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

// ===== МОДУЛЬ: БІБЛІОТЕКА =====
async function loadLibrary() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Бібліотека';
    document.getElementById('pageSubtitle').textContent = 'Управління книгами та читачами';

    try {
        var books = await db.getLibraryBooks(currentOrgId);
        var loans = await db.getLibraryLoans(currentOrgId);
        var readers = await db.getLibraryReaders(currentOrgId);
        allBooks = books || [];

        var html = '';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.5rem;">';
        
        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Книги (' + (books ? books.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openLibraryBook()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="libraryBookSearch" placeholder="Пошук книг..." oninput="filterLibraryBooks()"></div>';
        html += '<div id="libraryBooksList" style="max-height:300px;overflow-y:auto;">';
        if (books && books.length > 0) {
            for (var i = 0; i < books.length; i++) {
                var b = books[i];
                html += '<div class="library-book-item" data-title="' + (b.title || '').toLowerCase() + '" data-author="' + (b.author || '').toLowerCase() + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);cursor:pointer;" onclick="viewLibraryBook(\'' + b.id + '\')">';
                html += '<div><strong>' + b.title + '</strong> — ' + (b.author || 'Невідомо') + '</div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">В наявності: ' + (b.available || 0) + '/' + (b.quantity || 0) + '</div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає книг</div>';
        }
        html += '</div></div>';

        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Читачі (' + (readers ? readers.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openLibraryReader()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="libraryReaderSearch" placeholder="Пошук читачів..." oninput="filterLibraryReaders()"></div>';
        html += '<div id="libraryReadersList" style="max-height:300px;overflow-y:auto;">';
        if (readers && readers.length > 0) {
            for (var i = 0; i < readers.length; i++) {
                var r = readers[i];
                html += '<div class="library-reader-item" data-name="' + (r.full_name || '').toLowerCase() + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);cursor:pointer;" onclick="viewLibraryReader(\'' + r.id + '\')">';
                html += '<div><strong>' + r.full_name + '</strong></div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (r.phone || '') + ' · ' + new Date(r.joined_at).toLocaleDateString('uk-UA') + '</div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає читачів</div>';
        }
        html += '</div></div>';

        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Видача (' + (loans ? loans.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openLibraryLoan()"><i class="fas fa-hand-holding"></i></button></div>';
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

function filterLibraryBooks() {
    var query = document.getElementById('libraryBookSearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.library-book-item');
    items.forEach(function(item) {
        var title = item.getAttribute('data-title') || '';
        var author = item.getAttribute('data-author') || '';
        if (title.indexOf(query) !== -1 || author.indexOf(query) !== -1) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterLibraryReaders() {
    var query = document.getElementById('libraryReaderSearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.library-reader-item');
    items.forEach(function(item) {
        var name = item.getAttribute('data-name') || '';
        if (name.indexOf(query) !== -1) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

async function viewLibraryBook(bookId) {
    try {
        var books = await db.getLibraryBooks(currentOrgId);
        var book = null;
        for (var i = 0; i < books.length; i++) {
            if (books[i].id === bookId) {
                book = books[i];
                break;
            }
        }
        if (!book) return;
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">' + book.title + '</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Автор:</strong> ' + (book.author || '—') + '</div>';
        html += '<div><strong>ISBN:</strong> ' + (book.isbn || '—') + '</div>';
        html += '<div><strong>Видавець:</strong> ' + (book.publisher || '—') + '</div>';
        html += '<div><strong>Рік:</strong> ' + (book.year || '—') + '</div>';
        html += '<div><strong>Жанр:</strong> ' + (book.genre || '—') + '</div>';
        html += '<div><strong>В наявності:</strong> ' + (book.available || 0) + '/' + (book.quantity || 0) + '</div>';
        html += '<div style="grid-column:span 2;"><strong>Опис:</strong> ' + (book.description || 'Немає опису') + '</div>';
        html += '</div></div>';
        
        await showAlert(html, 'info', 'Книга');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function viewLibraryReader(readerId) {
    try {
        var readers = await db.getLibraryReaders(currentOrgId);
        var reader = null;
        for (var i = 0; i < readers.length; i++) {
            if (readers[i].id === readerId) {
                reader = readers[i];
                break;
            }
        }
        if (!reader) return;
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">' + reader.full_name + '</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Телефон:</strong> ' + (reader.phone || '—') + '</div>';
        html += '<div><strong>Email:</strong> ' + (reader.email || '—') + '</div>';
        html += '<div><strong>Адреса:</strong> ' + (reader.address || '—') + '</div>';
        html += '<div><strong>Дата реєстрації:</strong> ' + (reader.joined_at ? new Date(reader.joined_at).toLocaleDateString('uk-UA') : '—') + '</div>';
        html += '</div></div>';
        
        await showAlert(html, 'info', 'Читач');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
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

function openLibraryReader() {
    document.getElementById('libraryReaderModal').classList.add('active');
    document.getElementById('libraryReaderId').value = '';
    document.getElementById('libraryReaderName').value = '';
    document.getElementById('libraryReaderPhone').value = '';
    document.getElementById('libraryReaderEmail').value = '';
}

document.getElementById('libraryReaderForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var name = document.getElementById('libraryReaderName').value.trim();
    var phone = document.getElementById('libraryReaderPhone').value.trim();
    var email = document.getElementById('libraryReaderEmail').value.trim();

    if (!name) {
        await showAlert('Введіть ПІБ читача', 'warning');
        return;
    }

    try {
        await db.createLibraryReader({
            organization_id: currentOrgId,
            full_name: name,
            phone: phone || null,
            email: email || null
        });
        await showToast('Читача додано!', 'success');
        closeModal('libraryReaderModal');
        document.getElementById('libraryReaderForm').reset();
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

// ===== МОДУЛЬ: ШКОЛА =====
async function loadSchool() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Школа';
    document.getElementById('pageSubtitle').textContent = 'Управління учнями та класами';

    try {
        var students = await db.getSchoolStudents(currentOrgId);
        var classes = await db.getSchoolClasses(currentOrgId);
        allStudents = students || [];

        var html = '';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">';
        
        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Учні (' + (students ? students.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openSchoolStudent()"><i class="fas fa-plus"></i> Додати</button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="schoolStudentSearch" placeholder="Пошук учнів..." oninput="filterSchoolStudents()"></div>';
        html += '<div id="schoolStudentsList" style="max-height:300px;overflow-y:auto;">';
        if (students && students.length > 0) {
            for (var i = 0; i < students.length; i++) {
                var s = students[i];
                var className = '';
                if (s.class_id) {
                    for (var c = 0; c < classes.length; c++) {
                        if (classes[c].id === s.class_id) {
                            className = classes[c].name;
                            break;
                        }
                    }
                }
                html += '<div class="school-student-item" data-name="' + (s.full_name || '').toLowerCase() + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);cursor:pointer;" onclick="viewSchoolStudent(\'' + s.id + '\')">';
                html += '<div><strong>' + s.full_name + '</strong></div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (className ? 'Клас: ' + className : 'Без класу') + (s.birth_date ? ' · ' + new Date(s.birth_date).toLocaleDateString('uk-UA') : '') + '</div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає учнів</div>';
        }
        html += '</div></div>';

        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Класи (' + (classes ? classes.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openSchoolClass()"><i class="fas fa-plus"></i> Створити</button></div>';
        html += '<div id="schoolClassesList" style="max-height:300px;overflow-y:auto;">';
        if (classes && classes.length > 0) {
            for (var i = 0; i < classes.length; i++) {
                var c = classes[i];
                html += '<div style="padding:0.5rem;border-bottom:1px solid var(--ink-line);">';
                html += '<div><strong>' + c.name + '</strong></div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (c.room ? 'Каб. ' + c.room : '') + (c.teacher_name ? ' · Кл. кер.: ' + c.teacher_name : '') + '</div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає класів</div>';
        }
        html += '</div></div></div>';

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function filterSchoolStudents() {
    var query = document.getElementById('schoolStudentSearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.school-student-item');
    items.forEach(function(item) {
        var name = item.getAttribute('data-name') || '';
        if (name.indexOf(query) !== -1) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

async function viewSchoolStudent(studentId) {
    try {
        var students = await db.getSchoolStudents(currentOrgId);
        var student = null;
        for (var i = 0; i < students.length; i++) {
            if (students[i].id === studentId) {
                student = students[i];
                break;
            }
        }
        if (!student) return;
        
        var classes = await db.getSchoolClasses(currentOrgId);
        var className = '';
        if (student.class_id) {
            for (var c = 0; c < classes.length; c++) {
                if (classes[c].id === student.class_id) {
                    className = classes[c].name;
                    break;
                }
            }
        }
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">' + student.full_name + '</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Клас:</strong> ' + (className || 'Без класу') + '</div>';
        html += '<div><strong>Дата народження:</strong> ' + (student.birth_date ? new Date(student.birth_date).toLocaleDateString('uk-UA') : '—') + '</div>';
        html += '<div><strong>Телефон батьків:</strong> ' + (student.parent_phone || '—') + '</div>';
        html += '<div><strong>Email батьків:</strong> ' + (student.parent_email || '—') + '</div>';
        html += '<div style="grid-column:span 2;"><strong>Адреса:</strong> ' + (student.address || '—') + '</div>';
        html += '</div></div>';
        
        await showAlert(html, 'info', 'Учень');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

function openSchoolStudent() {
    document.getElementById('schoolStudentModal').classList.add('active');
    document.getElementById('schoolStudentId').value = '';
    document.getElementById('schoolStudentName').value = '';
    document.getElementById('schoolStudentBirth').value = '';
    document.getElementById('schoolStudentPhone').value = '';
    document.getElementById('schoolStudentEmail').value = '';
    document.getElementById('schoolStudentAddress').value = '';
    loadSchoolClassesSelect();
}

async function loadSchoolClassesSelect() {
    try {
        var classes = await db.getSchoolClasses(currentOrgId);
        var select = document.getElementById('schoolStudentClass');
        if (!select) return;
        select.innerHTML = '<option value="">Без класу</option>';
        if (classes && classes.length > 0) {
            for (var i = 0; i < classes.length; i++) {
                var option = document.createElement('option');
                option.value = classes[i].id;
                option.textContent = classes[i].name + (classes[i].teacher_name ? ' (' + classes[i].teacher_name + ')' : '');
                select.appendChild(option);
            }
        }
    } catch (error) {
        console.error('Load classes error:', error);
    }
}

document.getElementById('schoolStudentForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var name = document.getElementById('schoolStudentName').value.trim();
    var classId = document.getElementById('schoolStudentClass').value;
    var birth = document.getElementById('schoolStudentBirth').value;
    var phone = document.getElementById('schoolStudentPhone').value.trim();
    var email = document.getElementById('schoolStudentEmail').value.trim();
    var address = document.getElementById('schoolStudentAddress').value.trim();

    if (!name) {
        await showAlert('Введіть ПІБ учня', 'warning');
        return;
    }

    try {
        await db.createSchoolStudent({
            organization_id: currentOrgId,
            full_name: name,
            class_id: classId || null,
            birth_date: birth || null,
            parent_phone: phone || null,
            parent_email: email || null,
            address: address || null
        });
        await showToast('Учня додано!', 'success');
        closeModal('schoolStudentModal');
        document.getElementById('schoolStudentForm').reset();
        loadSchool();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

function openSchoolClass() {
    document.getElementById('schoolClassModal').classList.add('active');
    document.getElementById('schoolClassId').value = '';
    document.getElementById('schoolClassName').value = '';
    document.getElementById('schoolClassRoom').value = '';
    document.getElementById('schoolClassTeacher').value = '';
    loadSchoolTeachersSelect();
}

async function loadSchoolTeachersSelect() {
    try {
        var members = await db.getOrganizationMembers(currentOrgId);
        var select = document.getElementById('schoolClassTeacher');
        if (!select) return;
        
        select.innerHTML = '<option value="">Без класного керівника</option>';
        if (members && members.length > 0) {
            for (var i = 0; i < members.length; i++) {
                var userData = await db.supabaseQuery('users?id=eq.' + members[i].user_id);
                if (userData && userData.length > 0) {
                    var option = document.createElement('option');
                    option.value = userData[0].id;
                    option.textContent = userData[0].full_name || userData[0].email || 'Користувач';
                    select.appendChild(option);
                }
            }
        }
    } catch (error) {
        console.error('Load teachers error:', error);
    }
}

document.getElementById('schoolClassForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var name = document.getElementById('schoolClassName').value.trim();
    var room = document.getElementById('schoolClassRoom').value.trim();
    var teacherId = document.getElementById('schoolClassTeacher').value;
    var teacherName = '';

    if (!name) {
        await showAlert('Введіть назву класу', 'warning');
        return;
    }

    if (teacherId) {
        var userData = await db.supabaseQuery('users?id=eq.' + teacherId);
        if (userData && userData.length > 0) {
            teacherName = userData[0].full_name || userData[0].email || '';
        }
    }

    try {
        await db.createSchoolClass({
            organization_id: currentOrgId,
            name: name,
            room: room || null,
            teacher_id: teacherId || null,
            teacher_name: teacherName || null
        });
        await showToast('Клас створено!', 'success');
        closeModal('schoolClassModal');
        document.getElementById('schoolClassForm').reset();
        loadSchool();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

// ===== МОДУЛЬ: РЕСТОРАН =====
async function loadRestaurant() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Ресторан / Кафе';
    document.getElementById('pageSubtitle').textContent = 'Управління меню, замовленнями та бронюваннями';

    try {
        var menu = await db.getRestaurantMenu(currentOrgId);
        var orders = await db.getRestaurantOrders(currentOrgId);
        var bookings = await db.getRestaurantBookings(currentOrgId);

        var html = '';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.5rem;">';
        
        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Меню (' + (menu ? menu.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openRestaurantMenuItem()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="restaurantMenuSearch" placeholder="Пошук страв..." oninput="filterRestaurantMenu()"></div>';
        html += '<div id="restaurantMenuList" style="max-height:300px;overflow-y:auto;">';
        if (menu && menu.length > 0) {
            for (var i = 0; i < menu.length; i++) {
                var m = menu[i];
                html += '<div class="restaurant-menu-item" data-name="' + (m.name || '').toLowerCase() + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="viewRestaurantMenuItem(\'' + m.id + '\')">';
                html += '<div><strong>' + m.name + '</strong><div style="font-size:0.75rem;color:var(--muted);">' + (m.price || 0) + ' грн · ' + (m.category || '') + (m.is_available !== false ? ' (в наявності)' : ' (немає)') + '</div></div>';
                html += '<div><button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteRestaurantMenuItem(\'' + m.id + '\')"><i class="fas fa-trash"></i></button></div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає страв</div>';
        }
        html += '</div></div>';

        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Замовлення (' + (orders ? orders.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openRestaurantOrder()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="restaurantOrderSearch" placeholder="Пошук замовлень..." oninput="filterRestaurantOrders()"></div>';
        html += '<div id="restaurantOrdersList" style="max-height:300px;overflow-y:auto;">';
        if (orders && orders.length > 0) {
            for (var i = 0; i < orders.length; i++) {
                var o = orders[i];
                var statusClass = o.status === 'new' ? 'badge-warning' : o.status === 'in_progress' ? 'badge-primary' : o.status === 'completed' ? 'badge-success' : 'badge-danger';
                html += '<div class="restaurant-order-item" data-id="' + o.id + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);cursor:pointer;" onclick="viewRestaurantOrder(\'' + o.id + '\')">';
                html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
                html += '<div><strong>Стіл ' + (o.table_number || '?') + '</strong> · ' + (o.total || 0) + ' грн</div>';
                html += '<span class="badge ' + statusClass + '">' + (orderStatusLabels[o.status] || o.status) + '</span>';
                html += '</div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (o.customer_name || 'Гість') + ' · ' + new Date(o.created_at).toLocaleTimeString('uk-UA') + '</div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає замовлень</div>';
        }
        html += '</div></div>';

        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Бронювання (' + (bookings ? bookings.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openRestaurantBooking()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="restaurantBookingSearch" placeholder="Пошук бронювань..." oninput="filterRestaurantBookings()"></div>';
        html += '<div id="restaurantBookingsList" style="max-height:300px;overflow-y:auto;">';
        if (bookings && bookings.length > 0) {
            for (var i = 0; i < bookings.length; i++) {
                var b = bookings[i];
                var statusLabels = {
                    'confirmed': 'Підтверджено',
                    'cancelled': 'Скасовано',
                    'completed': 'Виконано'
                };
                var statusClass = b.status === 'confirmed' ? 'badge-success' : b.status === 'cancelled' ? 'badge-danger' : 'badge-secondary';
                html += '<div class="restaurant-booking-item" data-name="' + (b.customer_name || '').toLowerCase() + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);cursor:pointer;" onclick="viewRestaurantBooking(\'' + b.id + '\')">';
                html += '<div><strong>' + b.customer_name + '</strong> → Стіл ' + b.table_number + ' (' + (b.guests_count || 1) + ' ос.)</div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (b.booking_date ? new Date(b.booking_date).toLocaleString('uk-UA') : '') + ' · <span class="badge ' + statusClass + '">' + (statusLabels[b.status] || b.status) + '</span></div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає бронювань</div>';
        }
        html += '</div></div></div>';

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function filterRestaurantMenu() {
    var query = document.getElementById('restaurantMenuSearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.restaurant-menu-item');
    items.forEach(function(item) {
        var name = item.getAttribute('data-name') || '';
        if (name.indexOf(query) !== -1) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterRestaurantOrders() {
    var query = document.getElementById('restaurantOrderSearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.restaurant-order-item');
    items.forEach(function(item) {
        item.style.display = 'block';
    });
}

function filterRestaurantBookings() {
    var query = document.getElementById('restaurantBookingSearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.restaurant-booking-item');
    items.forEach(function(item) {
        var name = item.getAttribute('data-name') || '';
        if (name.indexOf(query) !== -1) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

async function viewRestaurantMenuItem(itemId) {
    try {
        var menu = await db.getRestaurantMenu(currentOrgId);
        var item = null;
        for (var i = 0; i < menu.length; i++) {
            if (menu[i].id === itemId) {
                item = menu[i];
                break;
            }
        }
        if (!item) return;
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">' + item.name + '</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Ціна:</strong> ' + (item.price || 0) + ' грн</div>';
        html += '<div><strong>Категорія:</strong> ' + (item.category || '—') + '</div>';
        html += '<div><strong>Доступно:</strong> ' + (item.is_available !== false ? 'Так' : 'Ні') + '</div>';
        html += '<div style="grid-column:span 2;"><strong>Опис:</strong> ' + (item.description || 'Немає опису') + '</div>';
        html += '<div style="grid-column:span 2;"><strong>Інгредієнти:</strong> ' + (item.ingredients || '—') + '</div>';
        html += '</div></div>';
        
        html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">';
        html += '<button class="btn btn-teal" onclick="closeModal(\'alertModal\');toggleRestaurantItemAvailability(\'' + item.id + '\', ' + (item.is_available !== false ? 'false' : 'true') + ')"><i class="fas fa-sync"></i> ' + (item.is_available !== false ? 'Зняти з продажу' : 'Додати в продаж') + '</button>';
        html += '</div>';
        
        await showAlert(html, 'info', 'Страва');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function viewRestaurantBooking(bookingId) {
    try {
        var bookings = await db.getRestaurantBookings(currentOrgId);
        var booking = null;
        for (var i = 0; i < bookings.length; i++) {
            if (bookings[i].id === bookingId) {
                booking = bookings[i];
                break;
            }
        }
        if (!booking) return;
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">Бронювання</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Клієнт:</strong> ' + booking.customer_name + '</div>';
        html += '<div><strong>Стіл:</strong> ' + booking.table_number + '</div>';
        html += '<div><strong>Телефон:</strong> ' + (booking.customer_phone || '—') + '</div>';
        html += '<div><strong>Кількість гостей:</strong> ' + (booking.guests_count || 1) + '</div>';
        html += '<div><strong>Дата:</strong> ' + (booking.booking_date ? new Date(booking.booking_date).toLocaleString('uk-UA') : '—') + '</div>';
        html += '<div><strong>Статус:</strong> ' + (booking.status || 'confirmed') + '</div>';
        html += '<div style="grid-column:span 2;"><strong>Примітка:</strong> ' + (booking.note || '—') + '</div>';
        html += '</div></div>';
        
        html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">';
        html += '<button class="btn btn-teal" onclick="closeModal(\'alertModal\');updateRestaurantBookingStatus(\'' + booking.id + '\', \'confirmed\')"><i class="fas fa-check"></i> Підтвердити</button>';
        html += '<button class="btn btn-danger" onclick="closeModal(\'alertModal\');updateRestaurantBookingStatus(\'' + booking.id + '\', \'cancelled\')"><i class="fas fa-times"></i> Скасувати</button>';
        html += '<button class="btn btn-success" onclick="closeModal(\'alertModal\');updateRestaurantBookingStatus(\'' + booking.id + '\', \'completed\')"><i class="fas fa-check-double"></i> Виконано</button>';
        html += '</div>';
        
        await showAlert(html, 'info', 'Бронювання');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function toggleRestaurantItemAvailability(itemId, isAvailable) {
    try {
        await db.supabaseQuery('restaurant_menu?id=eq.' + itemId, {
            method: 'PATCH',
            body: JSON.stringify({ is_available: isAvailable })
        });
        await showToast('Статус оновлено!', 'success');
        loadRestaurant();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function updateRestaurantBookingStatus(bookingId, status) {
    try {
        await db.supabaseQuery('restaurant_bookings?id=eq.' + bookingId, {
            method: 'PATCH',
            body: JSON.stringify({ 
                status: status,
                updated_at: new Date().toISOString()
            })
        });
        await showToast('Статус бронювання оновлено!', 'success');
        loadRestaurant();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

function openRestaurantMenuItem() {
    document.getElementById('restaurantMenuModal').classList.add('active');
    document.getElementById('restaurantMenuItemId').value = '';
    document.getElementById('restaurantMenuItemName').value = '';
    document.getElementById('restaurantMenuItemPrice').value = '';
    document.getElementById('restaurantMenuItemCategory').value = '';
    document.getElementById('restaurantMenuItemAvailable').checked = true;
}

document.getElementById('restaurantMenuForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var name = document.getElementById('restaurantMenuItemName').value.trim();
    var price = parseFloat(document.getElementById('restaurantMenuItemPrice').value);
    var category = document.getElementById('restaurantMenuItemCategory').value.trim();
    var isAvailable = document.getElementById('restaurantMenuItemAvailable').checked;

    if (!name) {
        await showAlert('Введіть назву страви', 'warning');
        return;
    }

    try {
        await db.createRestaurantMenuItem({
            organization_id: currentOrgId,
            name: name,
            price: price || 0,
            category: category || null,
            is_available: isAvailable
        });
        await showToast('Страву додано!', 'success');
        closeModal('restaurantMenuModal');
        document.getElementById('restaurantMenuForm').reset();
        loadRestaurant();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

async function deleteRestaurantMenuItem(id) {
    var confirmed = await showConfirm('Видалити страву?', 'Підтвердження');
    if (!confirmed) return;
    try {
        await db.supabaseQuery('restaurant_menu?id=eq.' + id, { method: 'DELETE' });
        await showToast('Страву видалено', 'success');
        loadRestaurant();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

function openRestaurantOrder() {
    document.getElementById('restaurantOrderModal').classList.add('active');
    document.getElementById('restaurantOrderId').value = '';
    document.getElementById('restaurantOrderTable').value = '';
    document.getElementById('restaurantOrderCustomer').value = '';
    document.getElementById('restaurantOrderPhone').value = '';
    document.getElementById('restaurantOrderTip').value = '0';
    selectedOrderItems = [];
    updateOrderItemsList();
    loadRestaurantMenuItemsSelect();
}

function loadRestaurantMenuItemsSelect() {
    var container = document.getElementById('restaurantOrderItemsContainer');
    if (!container) return;
    container.innerHTML = '';
    
    var addBtn = document.createElement('button');
    addBtn.className = 'btn btn-sm btn-teal';
    addBtn.innerHTML = '<i class="fas fa-plus"></i> Додати страву';
    addBtn.onclick = function() { addOrderItem(); };
    container.appendChild(addBtn);
    
    var list = document.createElement('div');
    list.id = 'restaurantOrderItemsList';
    list.style.marginTop = '0.5rem';
    container.appendChild(list);
    updateOrderItemsList();
}

function addOrderItem() {
    showRestaurantMenuItemSelect();
}

async function showRestaurantMenuItemSelect() {
    var menu = await db.getRestaurantMenu(currentOrgId);
    var availableItems = menu ? menu.filter(function(m) { return m.is_available !== false; }) : [];
    
    if (availableItems.length === 0) {
        await showAlert('Немає доступних страв. Спочатку додайте страви в меню.', 'warning');
        return;
    }
    
    var html = '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem;">';
    html += '<select id="tempMenuItemSelect" class="form-control" style="flex:1;min-width:150px;">';
    for (var i = 0; i < availableItems.length; i++) {
        html += '<option value="' + availableItems[i].id + '" data-price="' + availableItems[i].price + '">' + availableItems[i].name + ' (' + availableItems[i].price + ' грн)</option>';
    }
    html += '</select>';
    html += '<input type="number" id="tempMenuItemQty" class="form-control" style="width:70px;" value="1" min="1">';
    html += '<button class="btn btn-sm btn-gold" onclick="addSelectedMenuItem()"><i class="fas fa-check"></i></button>';
    html += '<button class="btn btn-sm btn-danger" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>';
    html += '</div>';
    
    var container = document.getElementById('restaurantOrderItemsContainer');
    var addBtn = container.querySelector('.btn-teal');
    if (addBtn) {
        addBtn.insertAdjacentHTML('afterend', html);
    }
}

function addSelectedMenuItem() {
    var select = document.getElementById('tempMenuItemSelect');
    var qtyInput = document.getElementById('tempMenuItemQty');
    if (!select || !qtyInput) return;
    
    var itemId = select.value;
    var itemName = select.options[select.selectedIndex].text.split(' (')[0];
    var price = parseFloat(select.options[select.selectedIndex].getAttribute('data-price')) || 0;
    var qty = parseInt(qtyInput.value) || 1;
    
    var existing = selectedOrderItems.find(function(i) { return i.id === itemId; });
    if (existing) {
        existing.quantity += qty;
    } else {
        selectedOrderItems.push({
            id: itemId,
            name: itemName,
            price: price,
            quantity: qty
        });
    }
    
    var tempDiv = select.closest('div');
    if (tempDiv) tempDiv.remove();
    
    updateOrderItemsList();
}

function updateOrderItemsList() {
    var list = document.getElementById('restaurantOrderItemsList');
    if (!list) return;
    
    if (selectedOrderItems.length === 0) {
        list.innerHTML = '<div class="text-muted" style="font-size:0.85rem;padding:0.25rem;">Немає страв</div>';
        updateOrderTotals();
        return;
    }
    
    var html = '';
    var subtotal = 0;
    for (var i = 0; i < selectedOrderItems.length; i++) {
        var item = selectedOrderItems[i];
        var total = item.price * item.quantity;
        subtotal += total;
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.25rem 0;border-bottom:1px solid var(--ink-line);">';
        html += '<div><strong>' + item.name + '</strong> × ' + item.quantity + ' = ' + total + ' грн</div>';
        html += '<button class="btn btn-sm btn-danger" onclick="removeOrderItem(' + i + ')"><i class="fas fa-times"></i></button>';
        html += '</div>';
    }
    list.innerHTML = html;
    
    document.getElementById('restaurantOrderSubtotal').value = subtotal.toFixed(2);
    updateOrderTotals();
}

function removeOrderItem(index) {
    selectedOrderItems.splice(index, 1);
    updateOrderItemsList();
}

function updateOrderTotals() {
    var subtotal = parseFloat(document.getElementById('restaurantOrderSubtotal').value) || 0;
    var tipPercent = parseFloat(document.getElementById('restaurantOrderTip').value) || 0;
    var tipAmount = subtotal * (tipPercent / 100);
    var total = subtotal + tipAmount;
    
    document.getElementById('restaurantOrderTipAmount').textContent = tipAmount.toFixed(2) + ' грн';
    document.getElementById('restaurantOrderTotalAmount').textContent = total.toFixed(2) + ' грн';
}

document.addEventListener('DOMContentLoaded', function() {
    var tipInput = document.getElementById('restaurantOrderTip');
    if (tipInput) {
        tipInput.addEventListener('input', updateOrderTotals);
    }
});

document.getElementById('restaurantOrderForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var tableNumber = parseInt(document.getElementById('restaurantOrderTable').value);
    var customerName = document.getElementById('restaurantOrderCustomer').value.trim();
    var customerPhone = document.getElementById('restaurantOrderPhone').value.trim();
    var tipPercent = parseFloat(document.getElementById('restaurantOrderTip').value) || 0;
    
    if (selectedOrderItems.length === 0) {
        await showAlert('Додайте хоча б одну страву', 'warning');
        return;
    }
    
    if (!tableNumber) {
        await showAlert('Введіть номер столика', 'warning');
        return;
    }
    
    try {
        var subtotal = 0;
        var items = selectedOrderItems.map(function(item) {
            subtotal += item.price * item.quantity;
            return {
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            };
        });
        
        var tipAmount = subtotal * (tipPercent / 100);
        var total = subtotal + tipAmount;
        
        await db.createRestaurantOrder({
            organization_id: currentOrgId,
            table_number: tableNumber,
            items: items,
            subtotal: subtotal,
            tip_percent: tipPercent,
            tip_amount: tipAmount,
            total: total,
            customer_name: customerName || null,
            customer_phone: customerPhone || null,
            status: 'new'
        });
        
        await showToast('Замовлення створено!', 'success');
        closeModal('restaurantOrderModal');
        document.getElementById('restaurantOrderForm').reset();
        selectedOrderItems = [];
        loadRestaurant();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

async function viewRestaurantOrder(orderId) {
    try {
        var orders = await db.getRestaurantOrders(currentOrgId);
        var order = null;
        for (var i = 0; i < orders.length; i++) {
            if (orders[i].id === orderId) {
                order = orders[i];
                break;
            }
        }
        if (!order) return;
        
        var items = order.items || [];
        var itemsHtml = '';
        for (var j = 0; j < items.length; j++) {
            var item = items[j];
            itemsHtml += '<div style="padding:0.25rem 0;border-bottom:1px solid var(--ink-line);">';
            itemsHtml += item.name + ' × ' + item.quantity + ' = ' + (item.price * item.quantity) + ' грн';
            itemsHtml += '</div>';
        }
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">';
        html += '<div><strong>Стіл:</strong> ' + (order.table_number || '—') + '</div>';
        html += '<div><strong>Статус:</strong> <span class="badge ' + (order.status === 'new' ? 'badge-warning' : order.status === 'in_progress' ? 'badge-primary' : order.status === 'completed' ? 'badge-success' : 'badge-danger') + '">' + (orderStatusLabels[order.status] || order.status) + '</span></div>';
        html += '<div><strong>Клієнт:</strong> ' + (order.customer_name || 'Гість') + '</div>';
        html += '<div><strong>Телефон:</strong> ' + (order.customer_phone || '—') + '</div>';
        html += '<div><strong>Створено:</strong> ' + new Date(order.created_at).toLocaleString('uk-UA') + '</div>';
        html += '<div><strong>Чайові:</strong> ' + (order.tip_percent || 0) + '% (' + (order.tip_amount || 0) + ' грн)</div>';
        html += '</div></div>';
        
        html += '<div style="margin-bottom:1rem;"><strong>Страви:</strong>';
        html += '<div style="margin-top:0.5rem;background:var(--ink);border-radius:6px;padding:0.5rem;">' + itemsHtml + '</div>';
        html += '<div style="margin-top:0.5rem;text-align:right;font-size:1.1rem;font-weight:700;color:var(--gold);">Всього: ' + (order.total || 0) + ' грн</div>';
        html += '</div>';
        
        html += '<div style="display:flex;flex-direction:column;gap:0.5rem;margin-top:1rem;border-top:1px solid var(--ink-line);padding-top:1rem;">';
        html += '<p style="color:var(--text-secondary);font-size:0.85rem;">Змінити статус:</p>';
        
        var statuses = [
            { value: 'new', label: 'Прийнято' },
            { value: 'in_progress', label: 'В процесі' },
            { value: 'completed', label: 'Виконано' },
            { value: 'cancelled', label: 'Скасовано' }
        ];
        
        for (var k = 0; k < statuses.length; k++) {
            var s = statuses[k];
            var isActive = s.value === order.status;
            html += '<button class="btn ' + (isActive ? 'btn-gold' : 'btn-outline') + '" onclick="updateRestaurantOrderStatus(\'' + orderId + '\', \'' + s.value + '\')" style="width:100%;justify-content:center;' + (isActive ? 'opacity:0.7;' : '') + '">';
            html += s.label + (isActive ? ' (поточний)' : '');
            html += '</button>';
        }
        html += '</div>';
        
        await showAlert(html, 'info', 'Деталі замовлення');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function updateRestaurantOrderStatus(orderId, newStatus) {
    try {
        closeModal('alertModal');
        var confirmed = await showConfirm('Змінити статус на "' + (orderStatusLabels[newStatus] || newStatus) + '"?', 'Підтвердження');
        if (!confirmed) return;
        
        await db.supabaseQuery('restaurant_orders?id=eq.' + orderId, {
            method: 'PATCH',
            body: JSON.stringify({ 
                status: newStatus,
                updated_at: new Date().toISOString()
            })
        });
        
        await showToast('Статус оновлено!', 'success');
        loadRestaurant();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

function openRestaurantBooking() {
    document.getElementById('restaurantBookingModal').classList.add('active');
    document.getElementById('restaurantBookingId').value = '';
    document.getElementById('restaurantBookingTable').value = '';
    document.getElementById('restaurantBookingCustomer').value = '';
    document.getElementById('restaurantBookingPhone').value = '';
    document.getElementById('restaurantBookingGuests').value = '1';
    document.getElementById('restaurantBookingDate').value = '';
    document.getElementById('restaurantBookingNote').value = '';
}

document.getElementById('restaurantBookingForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var tableNumber = parseInt(document.getElementById('restaurantBookingTable').value);
    var customerName = document.getElementById('restaurantBookingCustomer').value.trim();
    var customerPhone = document.getElementById('restaurantBookingPhone').value.trim();
    var guestsCount = parseInt(document.getElementById('restaurantBookingGuests').value) || 1;
    var bookingDate = document.getElementById('restaurantBookingDate').value;
    var note = document.getElementById('restaurantBookingNote').value.trim();

    if (!tableNumber || !customerName || !bookingDate) {
        await showAlert('Заповніть всі обов\'язкові поля', 'warning');
        return;
    }

    try {
        await db.createRestaurantBooking({
            organization_id: currentOrgId,
            table_number: tableNumber,
            customer_name: customerName,
            customer_phone: customerPhone || null,
            guests_count: guestsCount,
            booking_date: bookingDate,
            status: 'confirmed',
            note: note || null
        });
        await showToast('Бронювання створено!', 'success');
        closeModal('restaurantBookingModal');
        document.getElementById('restaurantBookingForm').reset();
        loadRestaurant();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

// ===== МОДУЛЬ: ГОТЕЛЬ =====
async function loadHotel() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Готель';
    document.getElementById('pageSubtitle').textContent = 'Управління номерами та бронюваннями';

    try {
        var rooms = await db.getHotelRooms(currentOrgId);
        var bookings = await db.getHotelBookings(currentOrgId);
        allRooms = rooms || [];

        var html = '';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">';
        
        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Номери (' + (rooms ? rooms.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openHotelRoom()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="hotelRoomSearch" placeholder="Пошук номерів..." oninput="filterHotelRooms()"></div>';
        html += '<div id="hotelRoomsList" style="max-height:300px;overflow-y:auto;">';
        if (rooms && rooms.length > 0) {
            for (var i = 0; i < rooms.length; i++) {
                var r = rooms[i];
                html += '<div class="hotel-room-item" data-number="' + (r.number || '').toLowerCase() + '" data-type="' + (r.type || '').toLowerCase() + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);cursor:pointer;" onclick="viewHotelRoom(\'' + r.id + '\')">';
                html += '<div><strong>№' + r.number + '</strong> — ' + (r.type || 'Стандарт') + '</div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (r.price || 0) + ' грн · ' + (r.is_available ? 'Вільний' : 'Зайнятий') + '</div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає номерів</div>';
        }
        html += '</div></div>';

        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Бронювання (' + (bookings ? bookings.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openHotelBooking()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="hotelBookingSearch" placeholder="Пошук бронювань..." oninput="filterHotelBookings()"></div>';
        html += '<div id="hotelBookingsList" style="max-height:300px;overflow-y:auto;">';
        if (bookings && bookings.length > 0) {
            for (var i = 0; i < bookings.length; i++) {
                var b = bookings[i];
                html += '<div class="hotel-booking-item" data-guest="' + (b.guest_name || '').toLowerCase() + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);cursor:pointer;" onclick="viewHotelBooking(\'' + b.id + '\')">';
                html += '<div><strong>' + b.guest_name + '</strong> → №' + (b.room_number || '?') + '</div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (b.check_in ? new Date(b.check_in).toLocaleDateString('uk-UA') : '') + ' - ' + (b.check_out ? new Date(b.check_out).toLocaleDateString('uk-UA') : '') + '</div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає бронювань</div>';
        }
        html += '</div></div></div>';

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function filterHotelRooms() {
    var query = document.getElementById('hotelRoomSearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.hotel-room-item');
    items.forEach(function(item) {
        var number = item.getAttribute('data-number') || '';
        var type = item.getAttribute('data-type') || '';
        if (number.indexOf(query) !== -1 || type.indexOf(query) !== -1) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterHotelBookings() {
    var query = document.getElementById('hotelBookingSearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.hotel-booking-item');
    items.forEach(function(item) {
        var guest = item.getAttribute('data-guest') || '';
        if (guest.indexOf(query) !== -1) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

async function viewHotelRoom(roomId) {
    try {
        var rooms = await db.getHotelRooms(currentOrgId);
        var room = null;
        for (var i = 0; i < rooms.length; i++) {
            if (rooms[i].id === roomId) {
                room = rooms[i];
                break;
            }
        }
        if (!room) return;
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">Номер №' + room.number + '</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Тип:</strong> ' + (room.type || 'Стандарт') + '</div>';
        html += '<div><strong>Ціна:</strong> ' + (room.price || 0) + ' грн</div>';
        html += '<div><strong>Місткість:</strong> ' + (room.capacity || 1) + ' ос.</div>';
        html += '<div><strong>Статус:</strong> ' + (room.is_available ? 'Вільний' : 'Зайнятий') + '</div>';
        html += '<div style="grid-column:span 2;"><strong>Опис:</strong> ' + (room.description || 'Немає опису') + '</div>';
        html += '</div></div>';
        
        html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">';
        html += '<button class="btn btn-teal" onclick="closeModal(\'alertModal\');toggleHotelRoomStatus(\'' + room.id + '\', ' + (room.is_available ? 'false' : 'true') + ')"><i class="fas fa-sync"></i> ' + (room.is_available ? 'Зайняти' : 'Звільнити') + '</button>';
        html += '</div>';
        
        await showAlert(html, 'info', 'Номер');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function viewHotelBooking(bookingId) {
    try {
        var bookings = await db.getHotelBookings(currentOrgId);
        var booking = null;
        for (var i = 0; i < bookings.length; i++) {
            if (bookings[i].id === bookingId) {
                booking = bookings[i];
                break;
            }
        }
        if (!booking) return;
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">Бронювання</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Гість:</strong> ' + booking.guest_name + '</div>';
        html += '<div><strong>Номер:</strong> №' + (booking.room_number || '?') + '</div>';
        html += '<div><strong>Телефон:</strong> ' + (booking.guest_phone || '—') + '</div>';
        html += '<div><strong>Заїзд:</strong> ' + (booking.check_in ? new Date(booking.check_in).toLocaleDateString('uk-UA') : '—') + '</div>';
        html += '<div><strong>Виїзд:</strong> ' + (booking.check_out ? new Date(booking.check_out).toLocaleDateString('uk-UA') : '—') + '</div>';
        html += '<div><strong>Статус:</strong> ' + (booking.status || 'confirmed') + '</div>';
        html += '</div></div>';
        
        await showAlert(html, 'info', 'Бронювання');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function toggleHotelRoomStatus(roomId, isAvailable) {
    try {
        await db.supabaseQuery('hotel_rooms?id=eq.' + roomId, {
            method: 'PATCH',
            body: JSON.stringify({ is_available: isAvailable })
        });
        await showToast('Статус оновлено!', 'success');
        loadHotel();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

function openHotelRoom() {
    document.getElementById('hotelRoomModal').classList.add('active');
    document.getElementById('hotelRoomId').value = '';
    document.getElementById('hotelRoomNumber').value = '';
    document.getElementById('hotelRoomType').value = '';
    document.getElementById('hotelRoomPrice').value = '';
}

document.getElementById('hotelRoomForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var number = document.getElementById('hotelRoomNumber').value.trim();
    var type = document.getElementById('hotelRoomType').value.trim();
    var price = parseFloat(document.getElementById('hotelRoomPrice').value);

    if (!number) {
        await showAlert('Введіть номер кімнати', 'warning');
        return;
    }

    try {
        await db.createHotelRoom({
            organization_id: currentOrgId,
            number: number,
            type: type || 'Стандарт',
            price: price || 0,
            is_available: true
        });
        await showToast('Номер додано!', 'success');
        closeModal('hotelRoomModal');
        document.getElementById('hotelRoomForm').reset();
        loadHotel();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

function openHotelBooking() {
    document.getElementById('hotelBookingModal').classList.add('active');
    document.getElementById('hotelBookingId').value = '';
    document.getElementById('hotelBookingGuest').value = '';
    document.getElementById('hotelBookingPhone').value = '';
    document.getElementById('hotelBookingCheckIn').value = '';
    document.getElementById('hotelBookingCheckOut').value = '';
    loadHotelRoomsSelect();
}

async function loadHotelRoomsSelect() {
    try {
        var rooms = await db.getHotelRooms(currentOrgId);
        var select = document.getElementById('hotelBookingRoom');
        if (!select) return;
        select.innerHTML = '<option value="">Оберіть номер...</option>';
        if (rooms && rooms.length > 0) {
            for (var i = 0; i < rooms.length; i++) {
                if (rooms[i].is_available) {
                    var option = document.createElement('option');
                    option.value = rooms[i].id;
                    option.textContent = '№' + rooms[i].number + ' (' + rooms[i].type + ')';
                    select.appendChild(option);
                }
            }
        }
    } catch (error) {
        console.error('Load rooms error:', error);
    }
}

document.getElementById('hotelBookingForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var roomId = document.getElementById('hotelBookingRoom').value;
    var guestName = document.getElementById('hotelBookingGuest').value.trim();
    var guestPhone = document.getElementById('hotelBookingPhone').value.trim();
    var checkIn = document.getElementById('hotelBookingCheckIn').value;
    var checkOut = document.getElementById('hotelBookingCheckOut').value;

    if (!roomId || !guestName || !checkIn || !checkOut) {
        await showAlert('Заповніть всі обов\'язкові поля', 'warning');
        return;
    }

    try {
        var roomNumber = document.getElementById('hotelBookingRoom').options[document.getElementById('hotelBookingRoom').selectedIndex]?.text || null;
        await db.createHotelBooking({
            organization_id: currentOrgId,
            room_id: roomId,
            room_number: roomNumber,
            guest_name: guestName,
            guest_phone: guestPhone || null,
            check_in: checkIn,
            check_out: checkOut,
            status: 'confirmed'
        });
        await db.supabaseQuery('hotel_rooms?id=eq.' + roomId, {
            method: 'PATCH',
            body: JSON.stringify({ is_available: false })
        });
        await showToast('Бронювання створено!', 'success');
        closeModal('hotelBookingModal');
        document.getElementById('hotelBookingForm').reset();
        loadHotel();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

// ===== МОДУЛЬ: СПОРТЗАЛ =====
async function loadGym() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Спортзал';
    document.getElementById('pageSubtitle').textContent = 'Управління абонементами та тренуваннями';

    try {
        var memberships = await db.getGymMemberships(currentOrgId);
        var trainings = await db.getGymTrainings(currentOrgId);
        allMemberships = memberships || [];

        var html = '';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">';
        
        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Абонементи (' + (memberships ? memberships.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openGymMembership()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="gymMembershipSearch" placeholder="Пошук абонементів..." oninput="filterGymMemberships()"></div>';
        html += '<div id="gymMembershipsList" style="max-height:300px;overflow-y:auto;">';
        if (memberships && memberships.length > 0) {
            for (var i = 0; i < memberships.length; i++) {
                var m = memberships[i];
                var statusClass = m.status === 'active' ? 'badge-success' : 'badge-danger';
                html += '<div class="gym-membership-item" data-name="' + (m.user_name || '').toLowerCase() + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);cursor:pointer;" onclick="viewGymMembership(\'' + m.id + '\')">';
                html += '<div><strong>' + (m.user_name || 'Користувач') + '</strong> — ' + (m.type || 'Стандарт') + '</div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (m.start_date ? new Date(m.start_date).toLocaleDateString('uk-UA') : '') + ' - ' + (m.end_date ? new Date(m.end_date).toLocaleDateString('uk-UA') : '') + ' <span class="badge ' + statusClass + '">' + (m.status || 'active') + '</span></div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає абонементів</div>';
        }
        html += '</div></div>';

        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Тренування (' + (trainings ? trainings.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openGymTraining()"><i class="fas fa-plus"></i></button></div>';
        html += '<div id="gymTrainingsList" style="max-height:300px;overflow-y:auto;">';
        if (trainings && trainings.length > 0) {
            for (var i = 0; i < trainings.length; i++) {
                var t = trainings[i];
                html += '<div style="padding:0.5rem;border-bottom:1px solid var(--ink-line);">';
                html += '<div><strong>' + t.name + '</strong> — ' + (t.trainer || 'Тренер') + '</div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (t.schedule || '') + ' · ' + (t.max_participants || 10) + ' місць</div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає тренувань</div>';
        }
        html += '</div></div></div>';

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function filterGymMemberships() {
    var query = document.getElementById('gymMembershipSearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.gym-membership-item');
    items.forEach(function(item) {
        var name = item.getAttribute('data-name') || '';
        if (name.indexOf(query) !== -1) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

async function viewGymMembership(membershipId) {
    try {
        var memberships = await db.getGymMemberships(currentOrgId);
        var membership = null;
        for (var i = 0; i < memberships.length; i++) {
            if (memberships[i].id === membershipId) {
                membership = memberships[i];
                break;
            }
        }
        if (!membership) return;
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">Абонемент</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Користувач:</strong> ' + (membership.user_name || '—') + '</div>';
        html += '<div><strong>Тип:</strong> ' + (membership.type || 'Стандарт') + '</div>';
        html += '<div><strong>Початок:</strong> ' + (membership.start_date ? new Date(membership.start_date).toLocaleDateString('uk-UA') : '—') + '</div>';
        html += '<div><strong>Закінчення:</strong> ' + (membership.end_date ? new Date(membership.end_date).toLocaleDateString('uk-UA') : '—') + '</div>';
        html += '<div><strong>Ціна:</strong> ' + (membership.price || 0) + ' грн</div>';
        html += '<div><strong>Статус:</strong> <span class="badge ' + (membership.status === 'active' ? 'badge-success' : 'badge-danger') + '">' + (membership.status || 'active') + '</span></div>';
        html += '</div></div>';
        
        html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">';
        html += '<button class="btn btn-teal" onclick="closeModal(\'alertModal\');toggleGymMembershipStatus(\'' + membership.id + '\', \'' + (membership.status === 'active' ? 'inactive' : 'active') + '\')"><i class="fas fa-sync"></i> ' + (membership.status === 'active' ? 'Деактивувати' : 'Активувати') + '</button>';
        html += '<button class="btn btn-danger" onclick="closeModal(\'alertModal\');deleteGymMembership(\'' + membership.id + '\')"><i class="fas fa-trash"></i> Видалити</button>';
        html += '</div>';
        
        await showAlert(html, 'info', 'Абонемент');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

function openGymMembership() {
    document.getElementById('gymMembershipModal').classList.add('active');
    document.getElementById('gymMembershipId').value = '';
    document.getElementById('gymMembershipUser').value = '';
    document.getElementById('gymMembershipType').value = '';
    document.getElementById('gymMembershipStart').value = '';
    document.getElementById('gymMembershipEnd').value = '';
    document.getElementById('gymMembershipPrice').value = '';
}

document.getElementById('gymMembershipForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var userName = document.getElementById('gymMembershipUser').value.trim();
    var type = document.getElementById('gymMembershipType').value.trim();
    var startDate = document.getElementById('gymMembershipStart').value;
    var endDate = document.getElementById('gymMembershipEnd').value;
    var price = parseFloat(document.getElementById('gymMembershipPrice').value);

    if (!userName || !startDate || !endDate) {
        await showAlert('Заповніть всі обов\'язкові поля', 'warning');
        return;
    }

    try {
        await db.createGymMembership({
            organization_id: currentOrgId,
            user_name: userName,
            type: type || 'Стандарт',
            start_date: startDate,
            end_date: endDate,
            price: price || 0,
            status: 'active'
        });
        await showToast('Абонемент додано!', 'success');
        closeModal('gymMembershipModal');
        document.getElementById('gymMembershipForm').reset();
        loadGym();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

async function toggleGymMembershipStatus(membershipId, newStatus) {
    try {
        await db.supabaseQuery('gym_memberships?id=eq.' + membershipId, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
        });
        await showToast('Статус оновлено!', 'success');
        loadGym();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function deleteGymMembership(membershipId) {
    var confirmed = await showConfirm('Видалити абонемент?', 'Підтвердження');
    if (!confirmed) return;
    try {
        await db.supabaseQuery('gym_memberships?id=eq.' + membershipId, { method: 'DELETE' });
        await showToast('Абонемент видалено', 'success');
        loadGym();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

function openGymTraining() {
    document.getElementById('gymTrainingModal').classList.add('active');
    document.getElementById('gymTrainingId').value = '';
    document.getElementById('gymTrainingName').value = '';
    document.getElementById('gymTrainingTrainer').value = '';
    document.getElementById('gymTrainingSchedule').value = '';
}

document.getElementById('gymTrainingForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var name = document.getElementById('gymTrainingName').value.trim();
    var trainer = document.getElementById('gymTrainingTrainer').value.trim();
    var schedule = document.getElementById('gymTrainingSchedule').value.trim();

    if (!name) {
        await showAlert('Введіть назву тренування', 'warning');
        return;
    }

    try {
        await db.createGymTraining({
            organization_id: currentOrgId,
            name: name,
            trainer: trainer || null,
            schedule: schedule || null
        });
        await showToast('Тренування додано!', 'success');
        closeModal('gymTrainingModal');
        document.getElementById('gymTrainingForm').reset();
        loadGym();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

// ===== МОДУЛЬ: САЛОН КРАСИ =====
async function loadBeauty() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Салон краси';
    document.getElementById('pageSubtitle').textContent = 'Управління послугами та записами';

    try {
        var services = await db.getBeautyServices(currentOrgId);
        var appointments = await db.getBeautyAppointments(currentOrgId);
        allServices = services || [];

        var html = '';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">';
        
        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Послуги (' + (services ? services.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openBeautyService()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="beautyServiceSearch" placeholder="Пошук послуг..." oninput="filterBeautyServices()"></div>';
        html += '<div id="beautyServicesList" style="max-height:300px;overflow-y:auto;">';
        if (services && services.length > 0) {
            for (var i = 0; i < services.length; i++) {
                var s = services[i];
                html += '<div class="beauty-service-item" data-name="' + (s.name || '').toLowerCase() + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);cursor:pointer;" onclick="viewBeautyService(\'' + s.id + '\')">';
                html += '<div><strong>' + s.name + '</strong> — ' + (s.price || 0) + ' грн</div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (s.category || '') + ' · ' + (s.duration || 0) + ' хв.</div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає послуг</div>';
        }
        html += '</div></div>';

        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Записи (' + (appointments ? appointments.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openBeautyAppointment()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="beautyAppointmentSearch" placeholder="Пошук записів..." oninput="filterBeautyAppointments()"></div>';
        html += '<div id="beautyAppointmentsList" style="max-height:300px;overflow-y:auto;">';
        if (appointments && appointments.length > 0) {
            for (var i = 0; i < appointments.length; i++) {
                var a = appointments[i];
                var statusClass = a.status === 'scheduled' ? 'badge-warning' : 'badge-success';
                html += '<div class="beauty-appointment-item" data-client="' + (a.client_name || '').toLowerCase() + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);cursor:pointer;" onclick="viewBeautyAppointment(\'' + a.id + '\')">';
                html += '<div><strong>' + a.client_name + '</strong> → ' + (a.service_name || 'Послуга') + '</div>';
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

function filterBeautyServices() {
    var query = document.getElementById('beautyServiceSearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.beauty-service-item');
    items.forEach(function(item) {
        var name = item.getAttribute('data-name') || '';
        if (name.indexOf(query) !== -1) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterBeautyAppointments() {
    var query = document.getElementById('beautyAppointmentSearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.beauty-appointment-item');
    items.forEach(function(item) {
        var client = item.getAttribute('data-client') || '';
        if (client.indexOf(query) !== -1) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

async function viewBeautyService(serviceId) {
    try {
        var services = await db.getBeautyServices(currentOrgId);
        var service = null;
        for (var i = 0; i < services.length; i++) {
            if (services[i].id === serviceId) {
                service = services[i];
                break;
            }
        }
        if (!service) return;
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">' + service.name + '</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Ціна:</strong> ' + (service.price || 0) + ' грн</div>';
        html += '<div><strong>Тривалість:</strong> ' + (service.duration || 0) + ' хв.</div>';
        html += '<div><strong>Категорія:</strong> ' + (service.category || '—') + '</div>';
        html += '<div style="grid-column:span 2;"><strong>Опис:</strong> ' + (service.description || 'Немає опису') + '</div>';
        html += '</div></div>';
        
        await showAlert(html, 'info', 'Послуга');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function viewBeautyAppointment(appointmentId) {
    try {
        var appointments = await db.getBeautyAppointments(currentOrgId);
        var appointment = null;
        for (var i = 0; i < appointments.length; i++) {
            if (appointments[i].id === appointmentId) {
                appointment = appointments[i];
                break;
            }
        }
        if (!appointment) return;
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">Запис</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Клієнт:</strong> ' + appointment.client_name + '</div>';
        html += '<div><strong>Послуга:</strong> ' + (appointment.service_name || '—') + '</div>';
        html += '<div><strong>Телефон:</strong> ' + (appointment.client_phone || '—') + '</div>';
        html += '<div><strong>Майстер:</strong> ' + (appointment.master || '—') + '</div>';
        html += '<div><strong>Дата:</strong> ' + (appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleString('uk-UA') : '—') + '</div>';
        html += '<div><strong>Статус:</strong> ' + (appointment.status || 'scheduled') + '</div>';
        html += '</div></div>';
        
        await showAlert(html, 'info', 'Запис');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

function openBeautyService() {
    document.getElementById('beautyServiceModal').classList.add('active');
    document.getElementById('beautyServiceId').value = '';
    document.getElementById('beautyServiceName').value = '';
    document.getElementById('beautyServicePrice').value = '';
    document.getElementById('beautyServiceDuration').value = '30';
}

document.getElementById('beautyServiceForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var name = document.getElementById('beautyServiceName').value.trim();
    var price = parseFloat(document.getElementById('beautyServicePrice').value);
    var duration = parseInt(document.getElementById('beautyServiceDuration').value);

    if (!name) {
        await showAlert('Введіть назву послуги', 'warning');
        return;
    }

    try {
        await db.createBeautyService({
            organization_id: currentOrgId,
            name: name,
            price: price || 0,
            duration: duration || 30,
            category: 'Інше'
        });
        await showToast('Послугу додано!', 'success');
        closeModal('beautyServiceModal');
        document.getElementById('beautyServiceForm').reset();
        loadBeauty();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

function openBeautyAppointment() {
    document.getElementById('beautyAppointmentModal').classList.add('active');
    document.getElementById('beautyAppointmentId').value = '';
    document.getElementById('beautyAppointmentClient').value = '';
    document.getElementById('beautyAppointmentPhone').value = '';
    document.getElementById('beautyAppointmentDate').value = '';
    document.getElementById('beautyAppointmentMaster').value = '';
    loadBeautyServicesSelect();
}

async function loadBeautyServicesSelect() {
    try {
        var services = await db.getBeautyServices(currentOrgId);
        var select = document.getElementById('beautyAppointmentService');
        if (!select) return;
        select.innerHTML = '<option value="">Оберіть послугу...</option>';
        if (services && services.length > 0) {
            for (var i = 0; i < services.length; i++) {
                var option = document.createElement('option');
                option.value = services[i].id;
                option.textContent = services[i].name + ' (' + services[i].price + ' грн)';
                select.appendChild(option);
            }
        }
    } catch (error) {
        console.error('Load services error:', error);
    }
}

document.getElementById('beautyAppointmentForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var serviceId = document.getElementById('beautyAppointmentService').value;
    var clientName = document.getElementById('beautyAppointmentClient').value.trim();
    var clientPhone = document.getElementById('beautyAppointmentPhone').value.trim();
    var date = document.getElementById('beautyAppointmentDate').value;
    var master = document.getElementById('beautyAppointmentMaster').value.trim();

    if (!serviceId || !clientName || !date) {
        await showAlert('Заповніть всі обов\'язкові поля', 'warning');
        return;
    }

    try {
        var services = await db.getBeautyServices(currentOrgId);
        var serviceName = null;
        for (var i = 0; i < services.length; i++) {
            if (services[i].id === serviceId) {
                serviceName = services[i].name;
                break;
            }
        }
        await db.createBeautyAppointment({
            organization_id: currentOrgId,
            service_id: serviceId,
            service_name: serviceName,
            client_name: clientName,
            client_phone: clientPhone || null,
            appointment_date: date,
            master: master || 'Майстер',
            status: 'scheduled'
        });
        await showToast('Запис створено!', 'success');
        closeModal('beautyAppointmentModal');
        document.getElementById('beautyAppointmentForm').reset();
        loadBeauty();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

// ===== МОДУЛЬ: АВТОСЕРВІС =====
async function loadAuto() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Автосервіс';
    document.getElementById('pageSubtitle').textContent = 'Управління замовленнями та запчастинами';

    try {
        var orders = await db.getAutoOrders(currentOrgId);
        var parts = await db.getAutoParts(currentOrgId);
        allAutoOrders = orders || [];

        var html = '';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">';
        
        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Замовлення (' + (orders ? orders.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openAutoOrder()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="autoOrderSearch" placeholder="Пошук замовлень..." oninput="filterAutoOrders()"></div>';
        html += '<div id="autoOrdersList" style="max-height:300px;overflow-y:auto;">';
        if (orders && orders.length > 0) {
            for (var i = 0; i < orders.length; i++) {
                var o = orders[i];
                var statusClass = o.status === 'new' ? 'badge-warning' : 'badge-success';
                html += '<div class="auto-order-item" data-client="' + (o.client_name || '').toLowerCase() + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);cursor:pointer;" onclick="viewAutoOrder(\'' + o.id + '\')">';
                html += '<div><strong>' + o.client_name + '</strong> — ' + (o.car_model || 'Авто') + '</div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (o.car_number || '') + ' · <span class="badge ' + statusClass + '">' + (o.status || 'new') + '</span></div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає замовлень</div>';
        }
        html += '</div></div>';

        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Запчастини (' + (parts ? parts.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openAutoPart()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="autoPartSearch" placeholder="Пошук запчастин..." oninput="filterAutoParts()"></div>';
        html += '<div id="autoPartsList" style="max-height:300px;overflow-y:auto;">';
        if (parts && parts.length > 0) {
            for (var i = 0; i < parts.length; i++) {
                var p = parts[i];
                html += '<div class="auto-part-item" data-name="' + (p.name || '').toLowerCase() + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);cursor:pointer;" onclick="viewAutoPart(\'' + p.id + '\')">';
                html += '<div><strong>' + p.name + '</strong> — ' + (p.price || 0) + ' грн</div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (p.quantity || 0) + ' шт. · ' + (p.supplier || '') + '</div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає запчастин</div>';
        }
        html += '</div></div></div>';

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function filterAutoOrders() {
    var query = document.getElementById('autoOrderSearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.auto-order-item');
    items.forEach(function(item) {
        var client = item.getAttribute('data-client') || '';
        if (client.indexOf(query) !== -1) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterAutoParts() {
    var query = document.getElementById('autoPartSearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.auto-part-item');
    items.forEach(function(item) {
        var name = item.getAttribute('data-name') || '';
        if (name.indexOf(query) !== -1) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

async function viewAutoOrder(orderId) {
    try {
        var orders = await db.getAutoOrders(currentOrgId);
        var order = null;
        for (var i = 0; i < orders.length; i++) {
            if (orders[i].id === orderId) {
                order = orders[i];
                break;
            }
        }
        if (!order) return;
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">Замовлення</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Клієнт:</strong> ' + order.client_name + '</div>';
        html += '<div><strong>Телефон:</strong> ' + (order.client_phone || '—') + '</div>';
        html += '<div><strong>Авто:</strong> ' + (order.car_model || '—') + '</div>';
        html += '<div><strong>Номер:</strong> ' + (order.car_number || '—') + '</div>';
        html += '<div><strong>Статус:</strong> ' + (order.status || 'new') + '</div>';
        html += '<div><strong>Дата:</strong> ' + new Date(order.created_at).toLocaleString('uk-UA') + '</div>';
        html += '<div style="grid-column:span 2;"><strong>Опис:</strong> ' + (order.description || 'Немає опису') + '</div>';
        html += '</div></div>';
        
        html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">';
        html += '<button class="btn btn-teal" onclick="closeModal(\'alertModal\');updateAutoOrderStatus(\'' + order.id + '\', \'in_progress\')"><i class="fas fa-wrench"></i> В роботі</button>';
        html += '<button class="btn btn-success" onclick="closeModal(\'alertModal\');updateAutoOrderStatus(\'' + order.id + '\', \'completed\')"><i class="fas fa-check"></i> Виконано</button>';
        html += '<button class="btn btn-danger" onclick="closeModal(\'alertModal\');updateAutoOrderStatus(\'' + order.id + '\', \'cancelled\')"><i class="fas fa-times"></i> Скасувати</button>';
        html += '</div>';
        
        await showAlert(html, 'info', 'Замовлення');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function viewAutoPart(partId) {
    try {
        var parts = await db.getAutoParts(currentOrgId);
        var part = null;
        for (var i = 0; i < parts.length; i++) {
            if (parts[i].id === partId) {
                part = parts[i];
                break;
            }
        }
        if (!part) return;
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">' + part.name + '</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Ціна:</strong> ' + (part.price || 0) + ' грн</div>';
        html += '<div><strong>Кількість:</strong> ' + (part.quantity || 0) + ' шт.</div>';
        html += '<div><strong>Постачальник:</strong> ' + (part.supplier || '—') + '</div>';
        html += '</div></div>';
        
        await showAlert(html, 'info', 'Запчастина');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function updateAutoOrderStatus(orderId, status) {
    try {
        await db.supabaseQuery('auto_orders?id=eq.' + orderId, {
            method: 'PATCH',
            body: JSON.stringify({ 
                status: status,
                updated_at: new Date().toISOString()
            })
        });
        await showToast('Статус оновлено!', 'success');
        loadAuto();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

function openAutoOrder() {
    document.getElementById('autoOrderModal').classList.add('active');
    document.getElementById('autoOrderId').value = '';
    document.getElementById('autoOrderClient').value = '';
    document.getElementById('autoOrderPhone').value = '';
    document.getElementById('autoOrderCar').value = '';
    document.getElementById('autoOrderNumber').value = '';
    document.getElementById('autoOrderDesc').value = '';
}

document.getElementById('autoOrderForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var clientName = document.getElementById('autoOrderClient').value.trim();
    var clientPhone = document.getElementById('autoOrderPhone').value.trim();
    var carModel = document.getElementById('autoOrderCar').value.trim();
    var carNumber = document.getElementById('autoOrderNumber').value.trim();
    var description = document.getElementById('autoOrderDesc').value.trim();

    if (!clientName) {
        await showAlert('Введіть ім\'я клієнта', 'warning');
        return;
    }

    try {
        await db.createAutoOrder({
            organization_id: currentOrgId,
            client_name: clientName,
            client_phone: clientPhone || null,
            car_model: carModel || null,
            car_number: carNumber || null,
            description: description || null,
            status: 'new'
        });
        await showToast('Замовлення створено!', 'success');
        closeModal('autoOrderModal');
        document.getElementById('autoOrderForm').reset();
        loadAuto();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

function openAutoPart() {
    document.getElementById('autoPartModal').classList.add('active');
    document.getElementById('autoPartId').value = '';
    document.getElementById('autoPartName').value = '';
    document.getElementById('autoPartPrice').value = '';
    document.getElementById('autoPartQuantity').value = '0';
    document.getElementById('autoPartSupplier').value = '';
}

document.getElementById('autoPartForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var name = document.getElementById('autoPartName').value.trim();
    var price = parseFloat(document.getElementById('autoPartPrice').value);
    var quantity = parseInt(document.getElementById('autoPartQuantity').value) || 0;
    var supplier = document.getElementById('autoPartSupplier').value.trim();

    if (!name) {
        await showAlert('Введіть назву запчастини', 'warning');
        return;
    }

    try {
        await db.createAutoPart({
            organization_id: currentOrgId,
            name: name,
            price: price || 0,
            quantity: quantity || 0,
            supplier: supplier || null
        });
        await showToast('Запчастину додано!', 'success');
        closeModal('autoPartModal');
        document.getElementById('autoPartForm').reset();
        loadAuto();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

// ===== МОДУЛЬ: НЕРУХОМІСТЬ =====
async function loadRealty() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Нерухомість';
    document.getElementById('pageSubtitle').textContent = 'Управління об\'єктами та угодами';

    try {
        var properties = await db.getRealtyProperties(currentOrgId);
        var deals = await db.getRealtyDeals(currentOrgId);
        allProperties = properties || [];

        var html = '';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">';
        
        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Об\'єкти (' + (properties ? properties.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openRealtyProperty()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="realtyPropertySearch" placeholder="Пошук об\'єктів..." oninput="filterRealtyProperties()"></div>';
        html += '<div id="realtyPropertiesList" style="max-height:300px;overflow-y:auto;">';
        if (properties && properties.length > 0) {
            for (var i = 0; i < properties.length; i++) {
                var p = properties[i];
                html += '<div class="realty-property-item" data-address="' + (p.address || '').toLowerCase() + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);cursor:pointer;" onclick="viewRealtyProperty(\'' + p.id + '\')">';
                html += '<div><strong>' + p.address + '</strong></div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (p.type || '') + ' · ' + (p.price || 0) + ' грн · ' + (p.area || 0) + ' м²</div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає об\'єктів</div>';
        }
        html += '</div></div>';

        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Угоди (' + (deals ? deals.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openRealtyDeal()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="realtyDealSearch" placeholder="Пошук угод..." oninput="filterRealtyDeals()"></div>';
        html += '<div id="realtyDealsList" style="max-height:300px;overflow-y:auto;">';
        if (deals && deals.length > 0) {
            for (var i = 0; i < deals.length; i++) {
                var d = deals[i];
                var statusClass = d.status === 'pending' ? 'badge-warning' : 'badge-success';
                html += '<div class="realty-deal-item" data-client="' + (d.client_name || '').toLowerCase() + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);cursor:pointer;" onclick="viewRealtyDeal(\'' + d.id + '\')">';
                html += '<div><strong>' + d.client_name + '</strong> → ' + (d.property_address || 'Об\'єкт') + '</div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (d.deal_type || '') + ' · ' + (d.amount || 0) + ' грн <span class="badge ' + statusClass + '">' + (d.status || 'pending') + '</span></div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає угод</div>';
        }
        html += '</div></div></div>';

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function filterRealtyProperties() {
    var query = document.getElementById('realtyPropertySearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.realty-property-item');
    items.forEach(function(item) {
        var address = item.getAttribute('data-address') || '';
        if (address.indexOf(query) !== -1) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterRealtyDeals() {
    var query = document.getElementById('realtyDealSearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.realty-deal-item');
    items.forEach(function(item) {
        var client = item.getAttribute('data-client') || '';
        if (client.indexOf(query) !== -1) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

async function viewRealtyProperty(propertyId) {
    try {
        var properties = await db.getRealtyProperties(currentOrgId);
        var property = null;
        for (var i = 0; i < properties.length; i++) {
            if (properties[i].id === propertyId) {
                property = properties[i];
                break;
            }
        }
        if (!property) return;
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">' + property.address + '</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Тип:</strong> ' + (property.type || '—') + '</div>';
        html += '<div><strong>Ціна:</strong> ' + (property.price || 0) + ' грн</div>';
        html += '<div><strong>Площа:</strong> ' + (property.area || 0) + ' м²</div>';
        html += '<div><strong>Кімнат:</strong> ' + (property.rooms || '—') + '</div>';
        html += '<div><strong>Статус:</strong> ' + (property.status || 'active') + '</div>';
        html += '<div style="grid-column:span 2;"><strong>Опис:</strong> ' + (property.description || 'Немає опису') + '</div>';
        html += '</div></div>';
        
        await showAlert(html, 'info', 'Об\'єкт');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function viewRealtyDeal(dealId) {
    try {
        var deals = await db.getRealtyDeals(currentOrgId);
        var deal = null;
        for (var i = 0; i < deals.length; i++) {
            if (deals[i].id === dealId) {
                deal = deals[i];
                break;
            }
        }
        if (!deal) return;
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">Угода</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Клієнт:</strong> ' + deal.client_name + '</div>';
        html += '<div><strong>Об\'єкт:</strong> ' + (deal.property_address || '—') + '</div>';
        html += '<div><strong>Телефон:</strong> ' + (deal.client_phone || '—') + '</div>';
        html += '<div><strong>Тип:</strong> ' + (deal.deal_type || '—') + '</div>';
        html += '<div><strong>Сума:</strong> ' + (deal.amount || 0) + ' грн</div>';
        html += '<div><strong>Статус:</strong> ' + (deal.status || 'pending') + '</div>';
        html += '<div><strong>Дата:</strong> ' + (deal.deal_date ? new Date(deal.deal_date).toLocaleDateString('uk-UA') : '—') + '</div>';
        html += '</div></div>';
        
        html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">';
        html += '<button class="btn btn-success" onclick="closeModal(\'alertModal\');updateRealtyDealStatus(\'' + deal.id + '\', \'completed\')"><i class="fas fa-check"></i> Завершити</button>';
        html += '<button class="btn btn-danger" onclick="closeModal(\'alertModal\');updateRealtyDealStatus(\'' + deal.id + '\', \'cancelled\')"><i class="fas fa-times"></i> Скасувати</button>';
        html += '</div>';
        
        await showAlert(html, 'info', 'Угода');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function updateRealtyDealStatus(dealId, status) {
    try {
        await db.supabaseQuery('realty_deals?id=eq.' + dealId, {
            method: 'PATCH',
            body: JSON.stringify({ status: status })
        });
        await showToast('Статус оновлено!', 'success');
        loadRealty();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

function openRealtyProperty() {
    document.getElementById('realtyPropertyModal').classList.add('active');
    document.getElementById('realtyPropertyId').value = '';
    document.getElementById('realtyPropertyAddress').value = '';
    document.getElementById('realtyPropertyType').value = '';
    document.getElementById('realtyPropertyPrice').value = '';
    document.getElementById('realtyPropertyArea').value = '';
}

document.getElementById('realtyPropertyForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var address = document.getElementById('realtyPropertyAddress').value.trim();
    var type = document.getElementById('realtyPropertyType').value.trim();
    var price = parseFloat(document.getElementById('realtyPropertyPrice').value);
    var area = parseFloat(document.getElementById('realtyPropertyArea').value);

    if (!address) {
        await showAlert('Введіть адресу', 'warning');
        return;
    }

    try {
        await db.createRealtyProperty({
            organization_id: currentOrgId,
            address: address,
            type: type || 'Квартира',
            price: price || 0,
            area: area || 0,
            status: 'active'
        });
        await showToast('Об\'єкт додано!', 'success');
        closeModal('realtyPropertyModal');
        document.getElementById('realtyPropertyForm').reset();
        loadRealty();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

function openRealtyDeal() {
    document.getElementById('realtyDealModal').classList.add('active');
    document.getElementById('realtyDealId').value = '';
    document.getElementById('realtyDealClient').value = '';
    document.getElementById('realtyDealPhone').value = '';
    document.getElementById('realtyDealType').value = '';
    document.getElementById('realtyDealAmount').value = '';
    loadRealtyPropertiesSelect();
}

async function loadRealtyPropertiesSelect() {
    try {
        var properties = await db.getRealtyProperties(currentOrgId);
        var select = document.getElementById('realtyDealProperty');
        if (!select) return;
        select.innerHTML = '<option value="">Оберіть об\'єкт...</option>';
        if (properties && properties.length > 0) {
            for (var i = 0; i < properties.length; i++) {
                if (properties[i].status === 'active') {
                    var option = document.createElement('option');
                    option.value = properties[i].id;
                    option.textContent = properties[i].address + ' (' + properties[i].price + ' грн)';
                    select.appendChild(option);
                }
            }
        }
    } catch (error) {
        console.error('Load properties error:', error);
    }
}

document.getElementById('realtyDealForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var propertyId = document.getElementById('realtyDealProperty').value;
    var clientName = document.getElementById('realtyDealClient').value.trim();
    var clientPhone = document.getElementById('realtyDealPhone').value.trim();
    var dealType = document.getElementById('realtyDealType').value;
    var amount = parseFloat(document.getElementById('realtyDealAmount').value);

    if (!propertyId || !clientName || !dealType) {
        await showAlert('Заповніть всі обов\'язкові поля', 'warning');
        return;
    }

    try {
        var property = null;
        var properties = await db.getRealtyProperties(currentOrgId);
        for (var i = 0; i < properties.length; i++) {
            if (properties[i].id === propertyId) {
                property = properties[i];
                break;
            }
        }
        await db.createRealtyDeal({
            organization_id: currentOrgId,
            property_id: propertyId,
            property_address: property ? property.address : null,
            client_name: clientName,
            client_phone: clientPhone || null,
            deal_type: dealType,
            amount: amount || 0,
            deal_date: new Date().toISOString().split('T')[0],
            status: 'pending'
        });
        await showToast('Угоду створено!', 'success');
        closeModal('realtyDealModal');
        document.getElementById('realtyDealForm').reset();
        loadRealty();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

// ===== МОДУЛЬ: ЛОГІСТИКА =====
async function loadLogistics() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Логістика';
    document.getElementById('pageSubtitle').textContent = 'Управління вантажами та маршрутами';

    try {
        var orders = await db.getLogisticsOrders(currentOrgId);
        allLogisticsOrders = orders || [];

        var html = '';
        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Вантажі (' + (orders ? orders.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openLogisticsOrder()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="logisticsOrderSearch" placeholder="Пошук вантажів..." oninput="filterLogisticsOrders()"></div>';
        html += '<div style="overflow-x:auto;"><table class="table"><thead><tr><th>№</th><th>Клієнт</th><th>Вага</th><th>Статус</th><th>Дата доставки</th><th>Дії</th></tr></thead><tbody>';
        if (orders && orders.length > 0) {
            for (var i = 0; i < orders.length; i++) {
                var o = orders[i];
                var statusClass = o.status === 'new' ? 'badge-warning' : 'badge-success';
                html += '<tr><td><strong>' + (o.order_number || '—') + '</strong></td><td>' + (o.client_name || '—') + '</td><td>' + (o.weight || 0) + ' кг</td><td><span class="badge ' + statusClass + '">' + (o.status || 'new') + '</span></td><td>' + (o.delivery_date ? new Date(o.delivery_date).toLocaleDateString('uk-UA') : '—') + '</td><td><button class="btn btn-sm btn-danger" onclick="deleteLogisticsOrder(\'' + o.id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
            }
        } else {
            html += '<tr><td colspan="6" class="text-center text-muted">Немає замовлень</td></tr>';
        }
        html += '</tbody></table></div></div>';

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function filterLogisticsOrders() {
    var query = document.getElementById('logisticsOrderSearch').value.toLowerCase().trim();
    var rows = document.querySelectorAll('#logisticsOrdersList tr');
    rows.forEach(function(row) {
        var text = row.textContent.toLowerCase();
        if (text.indexOf(query) !== -1) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function openLogisticsOrder() {
    document.getElementById('logisticsOrderModal').classList.add('active');
    document.getElementById('logisticsOrderId').value = '';
    document.getElementById('logisticsOrderNumber').value = 'LOG-' + Date.now().toString().slice(-6);
    document.getElementById('logisticsOrderClient').value = '';
    document.getElementById('logisticsOrderPickup').value = '';
    document.getElementById('logisticsOrderDelivery').value = '';
    document.getElementById('logisticsOrderWeight').value = '';
    document.getElementById('logisticsOrderDeliveryDate').value = '';
}

document.getElementById('logisticsOrderForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var orderNumber = document.getElementById('logisticsOrderNumber').value.trim();
    var clientName = document.getElementById('logisticsOrderClient').value.trim();
    var pickup = document.getElementById('logisticsOrderPickup').value.trim();
    var delivery = document.getElementById('logisticsOrderDelivery').value.trim();
    var weight = parseFloat(document.getElementById('logisticsOrderWeight').value);
    var deliveryDate = document.getElementById('logisticsOrderDeliveryDate').value;

    if (!orderNumber || !clientName) {
        await showAlert('Заповніть обов\'язкові поля', 'warning');
        return;
    }

    try {
        await db.createLogisticsOrder({
            organization_id: currentOrgId,
            order_number: orderNumber,
            client_name: clientName,
            pickup_address: pickup || null,
            delivery_address: delivery || null,
            weight: weight || 0,
            delivery_date: deliveryDate || null,
            status: 'new'
        });
        await showToast('Замовлення створено!', 'success');
        closeModal('logisticsOrderModal');
        document.getElementById('logisticsOrderForm').reset();
        loadLogistics();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

async function deleteLogisticsOrder(orderId) {
    var confirmed = await showConfirm('Видалити замовлення?', 'Підтвердження');
    if (!confirmed) return;
    try {
        await db.supabaseQuery('logistics_orders?id=eq.' + orderId, { method: 'DELETE' });
        await showToast('Замовлення видалено', 'success');
        loadLogistics();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ===== МОДУЛЬ: ДОСТАВКА =====
async function loadDelivery() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Доставка';
    document.getElementById('pageSubtitle').textContent = 'Управління замовленнями та кур\'єрами';

    try {
        var orders = await db.getDeliveryOrders(currentOrgId);
        allDeliveryOrders = orders || [];

        var html = '';
        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Замовлення (' + (orders ? orders.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openDeliveryOrder()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="deliveryOrderSearch" placeholder="Пошук замовлень..." oninput="filterDeliveryOrders()"></div>';
        html += '<div style="overflow-x:auto;"><table class="table"><thead><tr><th>№</th><th>Клієнт</th><th>Кур\'єр</th><th>Статус</th><th>Час доставки</th><th>Дії</th></tr></thead><tbody>';
        if (orders && orders.length > 0) {
            for (var i = 0; i < orders.length; i++) {
                var o = orders[i];
                var statusClass = o.status === 'pending' ? 'badge-warning' : o.status === 'delivered' ? 'badge-success' : 'badge-primary';
                html += '<tr><td><strong>' + (o.order_number || '—') + '</strong></td><td>' + (o.client_name || '—') + '</td><td>' + (o.courier_name || 'Не призначено') + '</td><td><span class="badge ' + statusClass + '">' + (o.status || 'pending') + '</span></td><td>' + (o.delivery_time ? new Date(o.delivery_time).toLocaleString('uk-UA') : '—') + '</td><td><button class="btn btn-sm btn-danger" onclick="deleteDeliveryOrder(\'' + o.id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
            }
        } else {
            html += '<tr><td colspan="6" class="text-center text-muted">Немає замовлень</td></tr>';
        }
        html += '</tbody></table></div></div>';

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function filterDeliveryOrders() {
    var query = document.getElementById('deliveryOrderSearch').value.toLowerCase().trim();
    var rows = document.querySelectorAll('#deliveryOrdersList tr');
    rows.forEach(function(row) {
        var text = row.textContent.toLowerCase();
        if (text.indexOf(query) !== -1) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function openDeliveryOrder() {
    document.getElementById('deliveryOrderModal').classList.add('active');
    document.getElementById('deliveryOrderId').value = '';
    document.getElementById('deliveryOrderNumber').value = 'DEL-' + Date.now().toString().slice(-6);
    document.getElementById('deliveryOrderClient').value = '';
    document.getElementById('deliveryOrderPhone').value = '';
    document.getElementById('deliveryOrderAddress').value = '';
    document.getElementById('deliveryOrderCourier').value = '';
    document.getElementById('deliveryOrderTime').value = '';
}

document.getElementById('deliveryOrderForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var orderNumber = document.getElementById('deliveryOrderNumber').value.trim();
    var clientName = document.getElementById('deliveryOrderClient').value.trim();
    var clientPhone = document.getElementById('deliveryOrderPhone').value.trim();
    var clientAddress = document.getElementById('deliveryOrderAddress').value.trim();
    var courierName = document.getElementById('deliveryOrderCourier').value.trim();
    var deliveryTime = document.getElementById('deliveryOrderTime').value;

    if (!orderNumber || !clientName) {
        await showAlert('Заповніть обов\'язкові поля', 'warning');
        return;
    }

    try {
        await db.createDeliveryOrder({
            organization_id: currentOrgId,
            order_number: orderNumber,
            client_name: clientName,
            client_phone: clientPhone || null,
            client_address: clientAddress || null,
            courier_name: courierName || null,
            delivery_time: deliveryTime || null,
            status: 'pending'
        });
        await showToast('Замовлення створено!', 'success');
        closeModal('deliveryOrderModal');
        document.getElementById('deliveryOrderForm').reset();
        loadDelivery();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

async function deleteDeliveryOrder(orderId) {
    var confirmed = await showConfirm('Видалити замовлення?', 'Підтвердження');
    if (!confirmed) return;
    try {
        await db.supabaseQuery('delivery_orders?id=eq.' + orderId, { method: 'DELETE' });
        await showToast('Замовлення видалено', 'success');
        loadDelivery();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ===== МОДУЛЬ: IT / GAMEDEV =====
async function loadIT() {
    if (!checkOrgActive()) {
        var container = document.getElementById('sectionContent');
        container.innerHTML = '<div class="alert alert-danger">Доступ заборонено. Організація заморожена.</div>';
        return;
    }
    
    var container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'IT / GameDev';
    document.getElementById('pageSubtitle').textContent = 'Управління проектами та задачами';

    try {
        var projects = await db.getItProjects(currentOrgId);
        var bugs = await db.getItBugs(currentOrgId);
        allProjects = projects || [];

        var html = '';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">';
        
        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Проекти (' + (projects ? projects.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openITProject()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="itProjectSearch" placeholder="Пошук проектів..." oninput="filterITProjects()"></div>';
        html += '<div id="itProjectsList" style="max-height:300px;overflow-y:auto;">';
        if (projects && projects.length > 0) {
            for (var i = 0; i < projects.length; i++) {
                var p = projects[i];
                html += '<div class="it-project-item" data-name="' + (p.name || '').toLowerCase() + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);cursor:pointer;" onclick="viewITProject(\'' + p.id + '\')">';
                html += '<div><strong>' + p.name + '</strong></div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (p.status || 'active') + (p.deadline ? ' · ' + new Date(p.deadline).toLocaleDateString('uk-UA') : '') + '</div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає проектів</div>';
        }
        html += '</div></div>';

        html += '<div class="card">';
        html += '<div class="card-header"><h3 class="card-title">Баги (' + (bugs ? bugs.length : 0) + ')</h3>';
        html += '<button class="btn btn-gold btn-sm" onclick="openITBug()"><i class="fas fa-plus"></i></button></div>';
        html += '<div style="margin-bottom:0.75rem;"><input type="text" class="form-control" id="itBugSearch" placeholder="Пошук багів..." oninput="filterITBugs()"></div>';
        html += '<div id="itBugsList" style="max-height:300px;overflow-y:auto;">';
        if (bugs && bugs.length > 0) {
            for (var i = 0; i < bugs.length; i++) {
                var b = bugs[i];
                html += '<div class="it-bug-item" data-title="' + (b.title || '').toLowerCase() + '" style="padding:0.5rem;border-bottom:1px solid var(--ink-line);cursor:pointer;" onclick="viewITBug(\'' + b.id + '\')">';
                html += '<div><strong>' + b.title + '</strong></div>';
                html += '<div style="font-size:0.75rem;color:var(--muted);">' + (b.priority || 'medium') + ' · ' + (b.status || 'open') + (b.assigned_name ? ' → ' + b.assigned_name : '') + '</div>';
                html += '</div>';
            }
        } else {
            html += '<div class="text-center text-muted" style="padding:1rem;">Немає багів</div>';
        }
        html += '</div></div></div>';

        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function filterITProjects() {
    var query = document.getElementById('itProjectSearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.it-project-item');
    items.forEach(function(item) {
        var name = item.getAttribute('data-name') || '';
        if (name.indexOf(query) !== -1) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterITBugs() {
    var query = document.getElementById('itBugSearch').value.toLowerCase().trim();
    var items = document.querySelectorAll('.it-bug-item');
    items.forEach(function(item) {
        var title = item.getAttribute('data-title') || '';
        if (title.indexOf(query) !== -1) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

async function viewITProject(projectId) {
    try {
        var projects = await db.getItProjects(currentOrgId);
        var project = null;
        for (var i = 0; i < projects.length; i++) {
            if (projects[i].id === projectId) {
                project = projects[i];
                break;
            }
        }
        if (!project) return;
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">' + project.name + '</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Статус:</strong> ' + (project.status || 'active') + '</div>';
        html += '<div><strong>Дедлайн:</strong> ' + (project.deadline ? new Date(project.deadline).toLocaleDateString('uk-UA') : '—') + '</div>';
        html += '<div style="grid-column:span 2;"><strong>Опис:</strong> ' + (project.description || 'Немає опису') + '</div>';
        html += '<div style="grid-column:span 2;"><strong>Repo:</strong> ' + (project.repo_url ? '<a href="' + project.repo_url + '" target="_blank" style="color:var(--teal);">' + project.repo_url + '</a>' : '—') + '</div>';
        html += '</div></div>';
        
        await showAlert(html, 'info', 'Проект');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function viewITBug(bugId) {
    try {
        var bugs = await db.getItBugs(currentOrgId);
        var bug = null;
        for (var i = 0; i < bugs.length; i++) {
            if (bugs[i].id === bugId) {
                bug = bugs[i];
                break;
            }
        }
        if (!bug) return;
        
        var html = '';
        html += '<div style="background:var(--ink);border-radius:8px;padding:1rem;margin-bottom:1rem;">';
        html += '<h3 style="color:var(--gold);">' + bug.title + '</h3>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">';
        html += '<div><strong>Проект:</strong> ' + (bug.project_name || '—') + '</div>';
        html += '<div><strong>Пріоритет:</strong> ' + (bug.priority || 'medium') + '</div>';
        html += '<div><strong>Статус:</strong> ' + (bug.status || 'open') + '</div>';
        html += '<div><strong>Призначено:</strong> ' + (bug.assigned_name || '—') + '</div>';
        html += '<div style="grid-column:span 2;"><strong>Опис:</strong> ' + (bug.description || 'Немає опису') + '</div>';
        html += '</div></div>';
        
        html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">';
        html += '<button class="btn btn-teal" onclick="closeModal(\'alertModal\');updateITBugStatus(\'' + bug.id + '\', \'in_progress\')"><i class="fas fa-play"></i> В роботі</button>';
        html += '<button class="btn btn-success" onclick="closeModal(\'alertModal\');updateITBugStatus(\'' + bug.id + '\', \'fixed\')"><i class="fas fa-check"></i> Виправлено</button>';
        html += '<button class="btn btn-danger" onclick="closeModal(\'alertModal\');updateITBugStatus(\'' + bug.id + '\', \'closed\')"><i class="fas fa-times"></i> Закрити</button>';
        html += '</div>';
        
        await showAlert(html, 'info', 'Баг');
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function updateITBugStatus(bugId, status) {
    try {
        await db.supabaseQuery('it_bugs?id=eq.' + bugId, {
            method: 'PATCH',
            body: JSON.stringify({ status: status })
        });
        await showToast('Статус оновлено!', 'success');
        loadIT();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

function openITProject() {
    document.getElementById('itProjectModal').classList.add('active');
    document.getElementById('itProjectId').value = '';
    document.getElementById('itProjectName').value = '';
    document.getElementById('itProjectDesc').value = '';
    document.getElementById('itProjectDeadline').value = '';
}

document.getElementById('itProjectForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var name = document.getElementById('itProjectName').value.trim();
    var description = document.getElementById('itProjectDesc').value.trim();
    var deadline = document.getElementById('itProjectDeadline').value;

    if (!name) {
        await showAlert('Введіть назву проекту', 'warning');
        return;
    }

    try {
        await db.createItProject({
            organization_id: currentOrgId,
            name: name,
            description: description || null,
            deadline: deadline || null,
            status: 'active'
        });
        await showToast('Проект створено!', 'success');
        closeModal('itProjectModal');
        document.getElementById('itProjectForm').reset();
        loadIT();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

function openITBug() {
    document.getElementById('itBugModal').classList.add('active');
    document.getElementById('itBugId').value = '';
    document.getElementById('itBugTitle').value = '';
    document.getElementById('itBugDesc').value = '';
    document.getElementById('itBugPriority').value = 'medium';
    loadITProjectsSelect();
    loadITUsersSelect();
}

async function loadITProjectsSelect() {
    try {
        var projects = await db.getItProjects(currentOrgId);
        var select = document.getElementById('itBugProject');
        if (!select) return;
        select.innerHTML = '<option value="">Оберіть проект...</option>';
        if (projects && projects.length > 0) {
            for (var i = 0; i < projects.length; i++) {
                var option = document.createElement('option');
                option.value = projects[i].id;
                option.textContent = projects[i].name;
                select.appendChild(option);
            }
        }
    } catch (error) {
        console.error('Load projects error:', error);
    }
}

async function loadITUsersSelect() {
    try {
        var members = await db.getOrganizationMembers(currentOrgId);
        var select = document.getElementById('itBugAssign');
        if (!select) return;
        select.innerHTML = '<option value="">Не призначено</option>';
        if (members && members.length > 0) {
            for (var i = 0; i < members.length; i++) {
                var userData = await db.supabaseQuery('users?id=eq.' + members[i].user_id);
                if (userData && userData.length > 0) {
                    var option = document.createElement('option');
                    option.value = members[i].user_id;
                    option.textContent = userData[0].full_name || userData[0].email || 'Користувач';
                    select.appendChild(option);
                }
            }
        }
    } catch (error) {
        console.error('Load users error:', error);
    }
}

document.getElementById('itBugForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var projectId = document.getElementById('itBugProject').value;
    var title = document.getElementById('itBugTitle').value.trim();
    var description = document.getElementById('itBugDesc').value.trim();
    var priority = document.getElementById('itBugPriority').value;
    var assignedTo = document.getElementById('itBugAssign').value;

    if (!projectId || !title) {
        await showAlert('Виберіть проект і введіть назву бага', 'warning');
        return;
    }

    try {
        var projectName = '';
        var projects = await db.getItProjects(currentOrgId);
        for (var i = 0; i < projects.length; i++) {
            if (projects[i].id === projectId) {
                projectName = projects[i].name;
                break;
            }
        }
        var assignedName = '';
        if (assignedTo) {
            var userData = await db.supabaseQuery('users?id=eq.' + assignedTo);
            if (userData && userData.length > 0) {
                assignedName = userData[0].full_name || userData[0].email;
            }
        }
        await db.createItBug({
            organization_id: currentOrgId,
            project_id: projectId,
            project_name: projectName,
            title: title,
            description: description || null,
            priority: priority || 'medium',
            assigned_to: assignedTo || null,
            assigned_name: assignedName || null,
            status: 'open'
        });
        await showToast('Баг додано!', 'success');
        closeModal('itBugModal');
        document.getElementById('itBugForm').reset();
        loadIT();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});
