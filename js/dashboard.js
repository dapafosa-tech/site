// ============================================
// TYPEBIZ - ДАШБОРД (ПОВНА ВЕРСІЯ ЗІ СПОВІЩЕННЯМИ)
// ============================================

// ============================================================
// БАЗОВІ ФУНКЦІЇ
// ============================================================

function toggleMobileSidebar() {
    document.getElementById('sidebar').classList.toggle('mobile-active');
    document.getElementById('sidebarBackdrop').classList.toggle('active');
}

function closeMobileSidebar() {
    document.getElementById('sidebar').classList.remove('mobile-active');
    document.getElementById('sidebarBackdrop').classList.remove('active');
}

document.querySelectorAll('.sidebar .nav-menu a').forEach(function(link) {
    link.addEventListener('click', closeMobileSidebar);
});

function logoutUser() {
    showConfirm('Ви впевнені, що хочете вийти?', 'Вихід').then(function(confirmed) {
        if (confirmed) {
            localStorage.removeItem('userData');
            localStorage.removeItem('isGuest');
            window.location.href = '/login';
        }
    });
}

function openCreateOrg() {
    document.getElementById('createOrgModal').classList.add('active');
}

function openJoinOrg() {
    document.getElementById('joinOrgModal').classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// ============================================================
// ФОРМАТУВАННЯ
// ============================================================

function formatDateKyiv(d) {
    try { return new Date(d).toLocaleDateString('uk-UA', { timeZone: 'Europe/Kyiv' }); } catch { return ''; }
}

function formatDateTimeKyiv(d) {
    try { return new Date(d).toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' }); } catch { return ''; }
}

// ============================================================
// ДАШБОРД - МОЇ ОРГАНІЗАЦІЇ
// ============================================================

async function loadDashboard() {
    var user = auth.getCurrentUser();
    if (!user) {
        window.location.href = '/login';
        return;
    }

    document.getElementById('userName').textContent = user.full_name || 'Користувач';
    document.getElementById('userEmail').textContent = user.email;

    var avatarEl = document.getElementById('userAvatar');
    if (user.avatar_url) {
        avatarEl.innerHTML = '<img src="' + user.avatar_url + '" alt="Аватар">';
    } else {
        avatarEl.textContent = (user.full_name || 'U')[0].toUpperCase();
    }

    var adminLink = document.getElementById('adminLink');
    var ownerLink = document.getElementById('ownerLink');
    if (user.role === 'owner') {
        ownerLink.style.display = 'block';
        adminLink.style.display = 'none';
    } else if (user.role === 'admin' || user.role === 'moderator') {
        adminLink.style.display = 'block';
        ownerLink.style.display = 'none';
    } else {
        adminLink.style.display = 'none';
        ownerLink.style.display = 'none';
    }

    document.querySelectorAll('.nav-menu a').forEach(function(a) {
        a.classList.remove('active');
    });
    var dashLink = document.getElementById('dashboardLink');
    if (dashLink) dashLink.classList.add('active');

    document.getElementById('pageEyebrow').textContent = 'Картотека організацій';
    document.getElementById('pageTitle').textContent = 'Мої організації';
    document.getElementById('pageSubtitle').textContent = 'Керуйте своїми організаціями та створюйте нові';
    document.getElementById('pageActions').style.display = 'flex';

    await loadOrganizations();
}

function loadDashboardView() {
    loadDashboard();
}

async function loadOrganizations() {
    var loading = document.getElementById('orgLoading');
    var grid = document.getElementById('orgGrid');
    var emptyState = document.getElementById('emptyState');
    
    try {
        var user = auth.getCurrentUser();
        if (!user) throw new Error('Користувач не авторизований');
        
        var members = await db.supabaseQuery('org_members?user_id=eq.' + user.id);
        if (!members || members.length === 0) {
            loading.style.display = 'none';
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        var orgIds = members.map(function(m) { return m.organization_id; }).join(',');
        if (!orgIds) {
            loading.style.display = 'none';
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        var orgs = await db.supabaseQuery('organizations?id=in.(' + orgIds + ')');
        loading.style.display = 'none';
        grid.innerHTML = '';
        grid.style.display = 'grid';
        
        if (!orgs || orgs.length === 0) {
            emptyState.style.display = 'block';
            grid.style.display = 'none';
            return;
        }
        
        emptyState.style.display = 'none';
        
        var accentPalette = ['#F2A93B', '#46C9B8', '#E2503E', '#8B93A6', '#8B5CF6', '#F59E0B'];
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
        
        var iconMap = {
            'shop': 'fa-store', 'library': 'fa-book', 'company': 'fa-building',
            'school': 'fa-graduation-cap', 'clinic': 'fa-heartbeat',
            'restaurant': 'fa-utensils', 'cafe': 'fa-coffee', 'hotel': 'fa-hotel',
            'gym': 'fa-dumbbell', 'beauty': 'fa-spa', 'auto': 'fa-car',
            'realty': 'fa-home', 'it': 'fa-code', 'marketing': 'fa-chart-line',
            'legal': 'fa-gavel', 'finance': 'fa-coins', 'education': 'fa-graduation-cap',
            'medical': 'fa-heartbeat', 'sport': 'fa-running', 'art': 'fa-palette',
            'music': 'fa-music', 'photo': 'fa-camera', 'video': 'fa-video',
            'construction': 'fa-hard-hat', 'repair': 'fa-tools', 'cleaning': 'fa-broom',
            'delivery': 'fa-truck', 'logistics': 'fa-shipping-fast',
            'agriculture': 'fa-tractor', 'tourism': 'fa-plane', 'event': 'fa-calendar-check',
            'charity': 'fa-hand-holding-heart', 'government': 'fa-landmark',
            'gamedev': 'fa-gamepad', 'indie': 'fa-rocket', 'publishing': 'fa-newspaper',
            'animation': 'fa-film', 'vr': 'fa-vr-cardboard', 'esports': 'fa-trophy',
            'streaming': 'fa-broadcast', 'podcast': 'fa-microphone', 'blogging': 'fa-blog',
            'social': 'fa-share-alt', 'startup': 'fa-lightbulb', 'agency': 'fa-ad',
            'consulting': 'fa-handshake', 'freelance': 'fa-user-tie', 'remote': 'fa-globe',
            'coworking': 'fa-building', 'incubator': 'fa-seedling', 'accelerator': 'fa-rocket',
            'venture': 'fa-chart-pie', 'nonprofit': 'fa-heart', 'community': 'fa-users',
            'religious': 'fa-church', 'cultural': 'fa-landmark', 'research': 'fa-flask',
            'science': 'fa-atom', 'space': 'fa-rocket', 'robotics': 'fa-robot',
            'ai': 'fa-brain', 'blockchain': 'fa-link', 'crypto': 'fa-coins',
            'defi': 'fa-chart-line', 'nft': 'fa-image', 'metaverse': 'fa-vr-cardboard',
            'web3': 'fa-globe', 'other': 'fa-cubes'
        };
        
        orgs.forEach(function(org) {
            var iconClass = iconMap[org.type] || 'fa-cubes';
            var hash = 0;
            for (var i = 0; i < (org.type || 'other').length; i++) hash += org.type.charCodeAt(i);
            var accent = accentPalette[hash % accentPalette.length];
            var card = document.createElement('div');
            card.className = 'org-card';
            card.style.setProperty('--card-accent', accent);
            card.innerHTML =
                '<div class="org-top">' +
                    '<div class="org-icon"><i class="fas ' + iconClass + '"></i></div>' +
                    '<i class="fas fa-arrow-right org-arrow"></i>' +
                '</div>' +
                '<h3>' + (org.name || 'Без назви') + '</h3>' +
                '<p>' + (org.description || 'Без опису') + '</p>' +
                '<div class="org-meta">' +
                    '<span class="org-type">' + (typeLabels[org.type] || org.type || '—') + '</span>' +
                    '<div class="org-join-code"><i class="fas fa-key"></i> <span class="join-code">' + (org.join_code || '---') + '</span></div>' +
                '</div>';
            card.addEventListener('click', function() {
                window.location.href = '/org?id=' + org.id;
            });
            grid.appendChild(card);
        });
        
    } catch (error) {
        loading.style.display = 'none';
        console.error('loadOrganizations error:', error);
        showAlert('Помилка завантаження організацій: ' + error.message, 'error');
    }
}

// ============================================================
// ПІДТРИМКА
// ============================================================

var myTicketStatusWeight = { 'in_progress': 0, 'open': 1, 'closed': 2 };
var myTicketStatusLabels = { open: 'Відкрито', in_progress: 'В роботі', closed: 'Закрито' };
var myTicketStatusClasses = { open: 'badge-success', in_progress: 'badge-warning', closed: 'badge-secondary' };
var myTicketPriorityClasses = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-primary' };
var myTicketTypeLabels = { bug: '🐛 Помилка/Баг', question: '❓ Питання', suggestion: '💡 Пропозиція', complaint: '⚠️ Скарга', other: '📌 Інше' };

function openSupport() {
    document.getElementById('supportListModal').classList.add('active');
    loadMySupportTickets();
}

function openSupportCreate() {
    closeModal('supportListModal');
    document.getElementById('supportModal').classList.add('active');
}

function backToSupportList() {
    closeModal('supportTicketModal');
    openSupport();
}

async function loadMySupportTickets() {
    var container = document.getElementById('supportTicketsListBody');
    container.innerHTML = '<p class="text-muted">Завантаження...</p>';
    try {
        var user = auth.getCurrentUser();
        if (!user) {
            container.innerHTML = '<p class="text-danger">Користувач не авторизований</p>';
            return;
        }
        var tickets = await db.getSupportTickets({ userId: user.id });
        var sorted = (tickets || []).slice().sort(function(a, b) {
            var wa = myTicketStatusWeight[a.status] !== undefined ? myTicketStatusWeight[a.status] : 1;
            var wb = myTicketStatusWeight[b.status] !== undefined ? myTicketStatusWeight[b.status] : 1;
            if (wa !== wb) return wa - wb;
            return new Date(b.created_at) - new Date(a.created_at);
        });
        if (sorted.length === 0) {
            container.innerHTML = '<p class="text-muted" style="text-align:center;padding:1.5rem 0;">У вас ще немає звернень.<br>Натисніть «Створити», щоб написати нам.</p>';
            return;
        }
        var html = '';
        for (var i = 0; i < sorted.length; i++) {
            var t = sorted[i];
            var statusClass = myTicketStatusClasses[t.status] || 'badge-secondary';
            var statusLabel = myTicketStatusLabels[t.status] || t.status;
            var priorityClass = myTicketPriorityClasses[t.priority] || 'badge-primary';
            html += '<div class="ticket-card" onclick="viewMySupportTicket(\'' + t.id + '\')">';
            html += '<div class="ticket-card-top"><span class="ticket-card-subject">' + (t.subject || '—') + '</span><span class="badge ' + statusClass + '">' + statusLabel + '</span></div>';
            html += '<div class="ticket-card-meta">';
            html += '<span><span class="badge ' + priorityClass + '">' + (t.priority || '—') + '</span></span>';
            html += '<span>' + (myTicketTypeLabels[t.type] || t.type || '') + '</span>';
            html += '<span>' + formatDateKyiv(t.created_at) + '</span>';
            html += '</div></div>';
        }
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<p class="text-danger">Помилка: ' + error.message + '</p>';
    }
}

async function viewMySupportTicket(ticketId) {
    closeModal('supportListModal');
    document.getElementById('supportTicketModal').classList.add('active');
    var body = document.getElementById('supportTicketModalBody');
    body.innerHTML = '<p class="text-muted">Завантаження...</p>';
    try {
        var t = await db.getSupportTicket(ticketId);
        if (!t) {
            body.innerHTML = '<p class="text-danger">Тікет не знайдено</p>';
            return;
        }
        var messages = await db.getSupportMessages(ticketId);
        var statusLabel = myTicketStatusLabels[t.status] || t.status;
        document.getElementById('supportTicketModalTitle').textContent = t.subject || 'Тікет';
        var html = '<div class="ticket-card-meta" style="margin-bottom:0.8rem;">';
        html += '<span class="badge ' + (myTicketStatusClasses[t.status] || 'badge-secondary') + '">' + statusLabel + '</span> ';
        html += '<span class="badge ' + (myTicketPriorityClasses[t.priority] || 'badge-primary') + '">' + (t.priority || '—') + '</span> ';
        html += '<span>' + (myTicketTypeLabels[t.type] || t.type || '') + '</span>';
        html += '</div>';
        html += '<div class="support-msg"><div class="support-msg-top"><span>👤 Ви</span><span>' + formatDateTimeKyiv(t.created_at) + '</span></div><div class="support-msg-body">' + (t.message || '') + '</div></div>';
        if (messages && messages.length > 0) {
            for (var i = 0; i < messages.length; i++) {
                var msg = messages[i];
                var isStaff = isStaffRole(msg.sender_type);
                var senderLabel = isStaff ? getRoleBadgeHtml(msg.sender_type) : '👤 Ви';
                html += '<div class="support-msg' + (isStaff ? ' staff' : '') + '">';
                html += '<div class="support-msg-top"><span>' + senderLabel + '</span><span>' + formatDateTimeKyiv(msg.created_at) + '</span></div>';
                html += '<div class="support-msg-body">' + msg.message + '</div></div>';
            }
        }
        if (t.status !== 'closed') {
            html += '<div style="margin-top:1rem;display:flex;flex-direction:column;gap:0.6rem;">';
            html += '<textarea class="form-control" id="myTicketReply" rows="3" placeholder="Написати повідомлення..."></textarea>';
            html += '<button class="btn btn-gold" onclick="sendMySupportReply(\'' + ticketId + '\')"><i class="fas fa-paper-plane"></i> Надіслати</button>';
            html += '</div>';
        } else {
            html += '<p class="text-muted" style="margin-top:1rem;">✅ Тікет закрито</p>';
        }
        body.innerHTML = html;
    } catch (error) {
        body.innerHTML = '<p class="text-danger">Помилка: ' + error.message + '</p>';
    }
}

async function sendMySupportReply(ticketId) {
    var textarea = document.getElementById('myTicketReply');
    if (!textarea) return;
    var message = textarea.value.trim();
    if (!message) {
        showAlert('Введіть повідомлення', 'warning');
        return;
    }
    var user = auth.getCurrentUser();
    try {
        await db.sendSupportMessage({
            ticket_id: ticketId,
            sender_id: user.id,
            sender_type: 'user',
            message: message
        });
        await db.updateSupportTicket(ticketId, { updated_at: new Date().toISOString() });
        await viewMySupportTicket(ticketId);
    } catch (error) {
        showAlert('Помилка: ' + error.message, 'error');
    }
}

// ============================================================
// ФОРМИ
// ============================================================

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

var iconMap = {
    'shop': 'fa-store', 'library': 'fa-book', 'company': 'fa-building',
    'school': 'fa-graduation-cap', 'clinic': 'fa-heartbeat',
    'restaurant': 'fa-utensils', 'cafe': 'fa-coffee', 'hotel': 'fa-hotel',
    'gym': 'fa-dumbbell', 'beauty': 'fa-spa', 'auto': 'fa-car',
    'realty': 'fa-home', 'it': 'fa-code', 'marketing': 'fa-chart-line',
    'legal': 'fa-gavel', 'finance': 'fa-coins', 'education': 'fa-graduation-cap',
    'medical': 'fa-heartbeat', 'sport': 'fa-running', 'art': 'fa-palette',
    'music': 'fa-music', 'photo': 'fa-camera', 'video': 'fa-video',
    'construction': 'fa-hard-hat', 'repair': 'fa-tools', 'cleaning': 'fa-broom',
    'delivery': 'fa-truck', 'logistics': 'fa-shipping-fast',
    'agriculture': 'fa-tractor', 'tourism': 'fa-plane', 'event': 'fa-calendar-check',
    'charity': 'fa-hand-holding-heart', 'government': 'fa-landmark',
    'gamedev': 'fa-gamepad', 'indie': 'fa-rocket', 'publishing': 'fa-newspaper',
    'animation': 'fa-film', 'vr': 'fa-vr-cardboard', 'esports': 'fa-trophy',
    'streaming': 'fa-broadcast', 'podcast': 'fa-microphone', 'blogging': 'fa-blog',
    'social': 'fa-share-alt', 'startup': 'fa-lightbulb', 'agency': 'fa-ad',
    'consulting': 'fa-handshake', 'freelance': 'fa-user-tie', 'remote': 'fa-globe',
    'coworking': 'fa-building', 'incubator': 'fa-seedling', 'accelerator': 'fa-rocket',
    'venture': 'fa-chart-pie', 'nonprofit': 'fa-heart', 'community': 'fa-users',
    'religious': 'fa-church', 'cultural': 'fa-landmark', 'research': 'fa-flask',
    'science': 'fa-atom', 'space': 'fa-rocket', 'robotics': 'fa-robot',
    'ai': 'fa-brain', 'blockchain': 'fa-link', 'crypto': 'fa-coins',
    'defi': 'fa-chart-line', 'nft': 'fa-image', 'metaverse': 'fa-vr-cardboard',
    'web3': 'fa-globe', 'other': 'fa-cubes'
};

document.getElementById('createOrgForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var name = document.getElementById('orgName').value.trim();
    var type = document.getElementById('orgType').value;
    var description = document.getElementById('orgDesc').value.trim();
    
    if (!name) {
        showAlert('Введіть назву організації', 'warning');
        return;
    }
    if (!type) {
        showAlert('Оберіть тип організації', 'warning');
        return;
    }
    
    var submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Створення...';
    
    try {
        await db.createOrganization({
            name: name,
            type: type,
            description: description || '',
            is_active: true,
            settings: {}
        });
        showToast('Організацію створено!', 'success');
        closeModal('createOrgModal');
        document.getElementById('createOrgForm').reset();
        await loadOrganizations();
    } catch (error) {
        showAlert('Помилка: ' + error.message, 'error');
    }
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-rocket"></i> Створити організацію';
});

document.getElementById('joinOrgForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var code = document.getElementById('joinCode').value.trim().toLowerCase();
    var message = document.getElementById('joinMessage').value.trim();
    var user = auth.getCurrentUser();
    
    if (!code) {
        showAlert('Введіть код організації', 'warning');
        return;
    }
    
    var submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Відправка...';
    
    try {
        var org = await db.getOrganizationByJoinCode(code);
        if (!org) {
            showAlert('Організацію з таким кодом не знайдено. Перевірте код.', 'warning');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Відправити заявку';
            return;
        }
        var members = await db.getOrganizationMembers(org.id);
        var alreadyMember = members.some(function(m) { return m.user_id === user.id; });
        if (alreadyMember) {
            showAlert('Ви вже перебуваєте в цій організації', 'warning');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Відправити заявку';
            return;
        }
        await db.createJoinRequest(org.id, user.id, message);
        showToast('Заявку відправлено! Лідер організації розгляне її.', 'success');
        closeModal('joinOrgModal');
        document.getElementById('joinOrgForm').reset();
    } catch (error) {
        showAlert('Помилка: ' + error.message, 'error');
    }
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Відправити заявку';
});

document.getElementById('supportForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var subject = document.getElementById('supportSubject').value.trim();
    var type = document.getElementById('supportType').value;
    var message = document.getElementById('supportMessage').value.trim();
    var priority = document.getElementById('supportPriority').value;
    
    if (!subject) {
        showAlert('Введіть тему звернення', 'warning');
        return;
    }
    if (!type) {
        showAlert('Виберіть тип звернення', 'warning');
        return;
    }
    if (!message) {
        showAlert('Введіть опис проблеми', 'warning');
        return;
    }
    
    var submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Відправка...';
    
    try {
        var user = auth.getCurrentUser();
        await db.createSupportTicket({
            user_id: user.id,
            subject: subject,
            message: message,
            type: type,
            priority: priority,
            status: 'open',
            created_at: new Date().toISOString()
        });
        await db.addLog('Створено заявку в підтримку', 'support', null, { subject: subject, type: type });
        showToast('✅ Ваше звернення відправлено!', 'success');
        closeModal('supportModal');
        document.getElementById('supportForm').reset();
        openSupport();
    } catch (error) {
        showAlert('Помилка: ' + error.message, 'error');
    }
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Відправити звернення';
});

document.querySelectorAll('.modal').forEach(function(modal) {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

// ============================================================
// ТИПИ ОРГАНІЗАЦІЙ (кастомні)
// ============================================================

async function loadCustomOrgTypes() {
    try {
        var customTypes = await db.supabaseQuery('org_types?order=name.asc');
        if (!customTypes || customTypes.length === 0) return;
        var select = document.getElementById('orgType');
        if (!select) return;
        var existingValues = [];
        for (var i = 0; i < select.options.length; i++) {
            existingValues.push(select.options[i].value);
        }
        for (var j = 0; j < customTypes.length; j++) {
            var ct = customTypes[j];
            if (!ct.code || existingValues.indexOf(ct.code) !== -1) continue;
            var opt = document.createElement('option');
            opt.value = ct.code;
            opt.textContent = ct.name;
            select.appendChild(opt);
            typeLabels[ct.code] = ct.name;
        }
    } catch (e) {}
}

// ============================================================
// СПОВІЩЕННЯ
// ============================================================

async function loadNotifications() {
    var container = document.getElementById('orgsContainer');
    if (!container) return;
    
    var user = auth.getCurrentUser();
    if (!user) return;
    
    document.querySelectorAll('.nav-menu a').forEach(function(a) {
        a.classList.remove('active');
    });
    var notifLink = document.querySelector('.nav-menu a[onclick*="loadNotifications()"]');
    if (notifLink) notifLink.classList.add('active');

    document.getElementById('pageEyebrow').textContent = 'Сповіщення';
    document.getElementById('pageTitle').textContent = '📬 Сповіщення';
    document.getElementById('pageSubtitle').textContent = 'Всі ваші сповіщення';
    document.getElementById('pageActions').style.display = 'none';
    
    try {
        var notifications = await db.supabaseQuery('notifications?user_id=eq.' + user.id + '&order=created_at.desc&limit=100');
        var unread = notifications ? notifications.filter(function(n) { return !n.is_read; }) : [];
        
        var html = '<div class="card"><div class="card-header"><h3 class="card-title">📬 Сповіщення</h3>';
        if (unread.length > 0) {
            html += '<button class="btn btn-sm btn-teal" onclick="markAllNotificationsRead();loadNotifications();"><i class="fas fa-check-double"></i> Прочитати всі</button>';
        }
        html += '</div>';
        
        if (!notifications || notifications.length === 0) {
            html += '<p class="text-muted text-center" style="padding:2rem 0;">Немає сповіщень</p>';
        } else {
            html += '<div style="max-height:500px;overflow-y:auto;">';
            for (var i = 0; i < notifications.length; i++) {
                var n = notifications[i];
                var isUnread = !n.is_read;
                var iconMap = {
                    'chat_mention': 'fa-at',
                    'admin_form': 'fa-file-signature',
                    'support_reply': 'fa-reply',
                    'support_escalation': 'fa-flag',
                    'system_alert': 'fa-shield-alt',
                    'appeal_result': 'fa-gavel',
                    'default': 'fa-bell'
                };
                var icon = iconMap[n.type] || iconMap.default;
                var link = n.link || '#';
                
                if (n.type === 'chat_mention') {
                    if (n.organization_id) {
                        link = '/org?id=' + n.organization_id;
                    }
                }
                
                html += '<div class="notification-item' + (isUnread ? ' unread' : '') + '" onclick="' + (isUnread ? 'markNotificationRead(\'' + n.id + '\')' : '') + ';window.location.href=\'' + link + '\'">';
                html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
                html += '<div class="notif-title"><i class="fas ' + icon + '" style="color:var(--gold);margin-right:0.5rem;"></i>' + n.title + '</div>';
                html += '<span class="notif-time">' + formatDateTimeKyiv(n.created_at) + '</span>';
                html += '</div>';
                html += '<div class="notif-message">' + n.message + '</div>';
                if (isUnread) {
                    html += '<div class="notif-badge"><i class="fas fa-circle" style="font-size:0.4rem;"></i> Нове</div>';
                }
                html += '</div>';
            }
            html += '</div>';
        }
        html += '</div>';
        
        container.innerHTML = html;
        
        if (window.updateNotificationBadge) {
            updateNotificationBadge();
        }
        
    } catch (error) {
        container.innerHTML = '<div class="card"><p class="text-danger">Помилка завантаження сповіщень: ' + error.message + '</p></div>';
    }
}

// ============================================================
// ІНІЦІАЛІЗАЦІЯ
// ============================================================

(async function init() {
    try {
        var isAuth = await auth.requireAuth();
        if (!isAuth) return;
        var user = auth.getCurrentUser();
        if (user && user.is_banned === true) {
            window.location.href = '/banned';
            return;
        }
        await loadDashboard();
        loadCustomOrgTypes();
        if (window.renderGlobalAnnouncements) {
            renderGlobalAnnouncements();
        }
        if (window.setupNotificationsRealtime) {
            setupNotificationsRealtime();
        }
        if (window.updateNotificationBadge) {
            updateNotificationBadge();
        }
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        window.location.href = '/login';
    }
})();
