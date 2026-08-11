// ============================================================
// TYPEBIZ - ДАШБОРД (ПОВНА ВЕРСІЯ З ВИПРАВЛЕННЯМИ)
// ============================================================

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

function getShortTicketId(id) {
    if (!id) return '---';
    return id.slice(0, 8);
}

function isStaffRole(type) {
    return type === 'admin' || type === 'moderator' || type === 'owner' || type === 'bot' || type === 'ai';
}

function getRoleBadgeHtml(type) {
    var labels = { 'admin': '🛡️ Адмін', 'support': '🛟 Підтримка', 'moderator': '⚖️ Модератор', 'owner': '👑 Власник', 'bot': '🤖 Бот', 'ai': '🤖 Typebiz Bot' };
    return labels[type] || type;
}

// ============================================================
// ЗБЕРІГАННЯ АКТИВНОЇ ВКЛАДКИ (ДЛЯ ВИПРАВЛЕННЯ БАГУ)
// ============================================================

function saveActiveSection(section) {
    try {
        sessionStorage.setItem('dashboardActiveSection', section);
    } catch (e) {}
}

function getActiveSection() {
    try {
        return sessionStorage.getItem('dashboardActiveSection') || 'organizations';
    } catch (e) {
        return 'organizations';
    }
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

    // Очищаємо флаги сторінок
    sessionStorage.removeItem('onNotificationsPage');
    sessionStorage.removeItem('onDmPage');
    saveActiveSection('organizations');

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

    // Активуємо правильне посилання в навігації
    document.querySelectorAll('.nav-menu a').forEach(function(a) {
        a.classList.remove('active');
    });
    var dashLink = document.getElementById('dashboardLink');
    if (dashLink) dashLink.classList.add('active');

    // Відновлюємо заголовок
    var pageEyebrow = document.getElementById('pageEyebrow');
    var pageTitle = document.getElementById('pageTitle');
    var pageSubtitle = document.getElementById('pageSubtitle');
    var pageActions = document.getElementById('pageActions');
    
    if (pageEyebrow) pageEyebrow.textContent = 'Картотека організацій';
    if (pageTitle) pageTitle.textContent = 'Мої організації';
    if (pageSubtitle) pageSubtitle.textContent = 'Керуйте своїми організаціями та створюйте нові';
    if (pageActions) pageActions.style.display = 'flex';

    await loadOrganizations();
}

function loadDashboardView() {
    loadDashboard();
}

async function loadOrganizations() {
    var loading = document.getElementById('orgLoading');
    var grid = document.getElementById('orgGrid');
    var emptyState = document.getElementById('emptyState');
    var container = document.getElementById('orgsContainer');
    
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
// СПОВІЩЕННЯ (З ВИПРАВЛЕНИМ БАГОМ ПЕРЕХОДУ)
// ============================================================

async function loadNotifications() {
    var container = document.getElementById('orgsContainer');
    if (!container) return;
    
    var user = auth.getCurrentUser();
    if (!user) return;
    
    // Зберігаємо флаг і активну секцію
    sessionStorage.setItem('onNotificationsPage', 'true');
    saveActiveSection('notifications');
    
    // Активуємо посилання на сповіщення
    document.querySelectorAll('.nav-menu a').forEach(function(a) {
        a.classList.remove('active');
    });
    var notifLink = document.querySelector('.nav-menu a[onclick*="loadNotifications()"]');
    if (notifLink) notifLink.classList.add('active');

    // Оновлюємо заголовок
    var pageEyebrow = document.getElementById('pageEyebrow');
    var pageTitle = document.getElementById('pageTitle');
    var pageSubtitle = document.getElementById('pageSubtitle');
    var pageActions = document.getElementById('pageActions');
    
    if (pageEyebrow) pageEyebrow.textContent = 'Сповіщення';
    if (pageTitle) pageTitle.textContent = '📬 Сповіщення';
    if (pageSubtitle) pageSubtitle.textContent = 'Всі ваші сповіщення';
    if (pageActions) pageActions.style.display = 'none';
    
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
                
                if (n.type === 'chat_mention' && n.organization_id) {
                    link = '/org?id=' + n.organization_id;
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
// ПЕРЕПИСКИ (ВИПРАВЛЕНА ВЕРСІЯ)
// ============================================================

var dmChannel = null;
var currentDmUserId = null;

async function loadDirectMessages() {
    sessionStorage.setItem('onDmPage', 'true');
    saveActiveSection('directmessages');
    
    var container = document.getElementById('orgsContainer');
    if (!container) return;
    
    var user = auth.getCurrentUser();
    if (!user) return;
    
    document.querySelectorAll('.nav-menu a').forEach(function(a) {
        a.classList.remove('active');
    });
    var dmLink = document.querySelector('.nav-menu a[onclick*="loadDirectMessages()"]');
    if (dmLink) dmLink.classList.add('active');

    document.getElementById('pageEyebrow').textContent = 'Особисті переписки';
    document.getElementById('pageTitle').textContent = '💬 Переписки';
    document.getElementById('pageSubtitle').textContent = 'Всі ваші особисті повідомлення';
    document.getElementById('pageActions').style.display = 'none';
    
    try {
        // Отримуємо всіх користувачів з якими є переписка
        var userIds = new Set();
        
        // Отримуємо повідомлення де ми відправник
        var { data: sent, error: sentError } = await window.sb
            .from('direct_messages')
            .select('recipient_id')
            .eq('sender_id', user.id);
            
        if (sentError) console.warn('Помилка отримання відправлених:', sentError);
        if (sent && sent.length > 0) {
            sent.forEach(function(m) {
                if (m.recipient_id) userIds.add(m.recipient_id);
            });
        }
        
        // Отримуємо повідомлення де ми отримувач
        var { data: received, error: receivedError } = await window.sb
            .from('direct_messages')
            .select('sender_id')
            .eq('recipient_id', user.id);
            
        if (receivedError) console.warn('Помилка отримання отриманих:', receivedError);
        if (received && received.length > 0) {
            received.forEach(function(m) {
                if (m.sender_id) userIds.add(m.sender_id);
            });
        }
        
        if (userIds.size === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-envelope"></i></div>
                    <h3>Немає переписок</h3>
                    <p>У вас ще немає особистих повідомлень. Почніть спілкуватися з учасниками ваших організацій!</p>
                </div>
            `;
            return;
        }
        
        var ids = Array.from(userIds);
        var profiles = [];
        
        // Отримуємо профілі користувачів
        if (ids.length > 0) {
            var { data: profilesData, error: profilesError } = await window.sb
                .from('users')
                .select('id, full_name, email, avatar_url, role')
                .in('id', ids);
                
            if (profilesError) {
                console.warn('Помилка отримання профілів:', profilesError);
                // Fallback - отримуємо по одному
                for (var i = 0; i < ids.length; i++) {
                    var { data: singleUser } = await window.sb
                        .from('users')
                        .select('id, full_name, email, avatar_url, role')
                        .eq('id', ids[i]);
                    if (singleUser && singleUser.length > 0) {
                        profiles.push(singleUser[0]);
                    }
                }
            } else {
                profiles = profilesData || [];
            }
        }
        
        var userMap = {};
        profiles.forEach(function(p) { userMap[p.id] = p; });
        
        // Отримуємо останнє повідомлення для кожного та кількість непрочитаних
        var conversations = [];
        for (var uid of userIds) {
            try {
                // Останнє повідомлення між двома користувачами
                var { data: lastMsgData } = await window.sb
                    .from('direct_messages')
                    .select('*')
                    .or('sender_id.eq.' + user.id + ',recipient_id.eq.' + user.id)
                    .or('sender_id.eq.' + uid + ',recipient_id.eq.' + uid)
                    .order('created_at', { ascending: false })
                    .limit(1);
                    
                var lastMsg = lastMsgData && lastMsgData.length > 0 ? lastMsgData[0] : null;
                
                // Непрочитані повідомлення від цього користувача
                var { data: unreadData } = await window.sb
                    .from('direct_messages')
                    .select('id')
                    .eq('recipient_id', user.id)
                    .eq('sender_id', uid)
                    .eq('is_read', false);
                    
                var unreadCount = unreadData ? unreadData.length : 0;
                
                var profile = userMap[uid] || { full_name: 'Користувач', avatar_url: null };
                conversations.push({
                    user_id: uid,
                    full_name: profile.full_name || 'Користувач',
                    avatar_url: profile.avatar_url,
                    last_message: lastMsg ? lastMsg.message : '...',
                    last_time: lastMsg ? lastMsg.created_at : null,
                    unread: unreadCount
                });
            } catch (e) {
                console.warn('Помилка обробки користувача', uid, e);
            }
        }
        
        // Сортуємо за часом останнього повідомлення
        conversations.sort(function(a, b) {
            return new Date(b.last_time || 0) - new Date(a.last_time || 0);
        });
        
        var html = '<div style="max-height:600px;overflow-y:auto;">';
        for (var i = 0; i < conversations.length; i++) {
            var conv = conversations[i];
            var isUnread = conv.unread > 0;
            var initial = (conv.full_name || 'U')[0].toUpperCase();
            var safeName = conv.full_name.replace(/'/g, "\\'");
            html += '<div class="dm-item' + (isUnread ? ' unread' : '') + '" onclick="openDmChat(\'' + conv.user_id + '\', \'' + safeName + '\')">';
            html += '<div class="dm-top">';
            html += '<div style="display:flex;align-items:center;gap:0.6rem;">';
            html += '<div style="width:32px;height:32px;border-radius:50%;background:var(--teal);display:flex;align-items:center;justify-content:center;color:var(--ink);font-weight:600;font-size:0.8rem;overflow:hidden;flex-shrink:0;">';
            if (conv.avatar_url) {
                html += '<img src="' + conv.avatar_url + '" style="width:100%;height:100%;object-fit:cover;">';
            } else {
                html += initial;
            }
            html += '</div>';
            html += '<span class="dm-user">' + conv.full_name + '</span>';
            if (isUnread) {
                html += '<span class="dm-badge">' + conv.unread + '</span>';
            }
            html += '</div>';
            html += '<span class="dm-time">' + (conv.last_time ? formatDateTimeKyiv(conv.last_time) : '') + '</span>';
            html += '</div>';
            html += '<div class="dm-preview">' + (conv.last_message || '') + '</div>';
            html += '</div>';
        }
        html += '</div>';
        container.innerHTML = html;
        
        // Оновлюємо бейдж
        await updateDmBadge();
        
        // Налаштовуємо реальний час для нових повідомлень
        setupRealtimeDm();
        
    } catch (error) {
        console.error('loadDirectMessages error:', error);
        container.innerHTML = '<div class="card"><p class="text-danger">Помилка завантаження переписок: ' + error.message + '</p></div>';
    }
}

// Відкрити чат з користувачем
async function openDmChat(userId, userName) {
    currentDmUserId = userId;
    document.getElementById('dmChatModal').classList.add('active');
    document.getElementById('dmChatTitle').textContent = '💬 Чат з ' + (userName || 'Користувачем');
    
    var body = document.getElementById('dmChatBody');
    body.innerHTML = '<p class="text-muted">Завантаження...</p>';
    
    try {
        var user = auth.getCurrentUser();
        if (!user) return;
        
        // Позначаємо всі повідомлення від цього користувача як прочитані
        await window.sb
            .from('direct_messages')
            .update({ is_read: true })
            .eq('recipient_id', user.id)
            .eq('sender_id', userId);
            
        await updateDmBadge();
        
        // Отримуємо історію повідомлень
        var { data: msgs, error: msgsError } = await window.sb
            .from('direct_messages')
            .select('*')
            .or('sender_id.eq.' + user.id + ',recipient_id.eq.' + user.id)
            .or('sender_id.eq.' + userId + ',recipient_id.eq.' + userId)
            .order('created_at', { ascending: true })
            .limit(100);
            
        if (msgsError) throw new Error(msgsError.message);
        
        if (!msgs || msgs.length === 0) {
            body.innerHTML = '<p class="text-muted text-center" style="padding:2rem 0;">Немає повідомлень. Почніть спілкування!</p>';
        } else {
            var html = '';
            for (var i = 0; i < msgs.length; i++) {
                var msg = msgs[i];
                var isOwn = msg.sender_id === user.id;
                html += '<div class="dm-chat-message' + (isOwn ? ' own' : '') + '">';
                html += '<div class="dm-msg-top"><span>' + (isOwn ? 'Ви' : (userName || 'Користувач')) + '</span><span>' + formatDateTimeKyiv(msg.created_at) + '</span></div>';
                html += '<div class="dm-msg-body">' + msg.message + '</div>';
                html += '</div>';
            }
            body.innerHTML = html;
            body.scrollTop = body.scrollHeight;
        }
        
        // Підписуємося на нові повідомлення в реальному часі
        setupRealtimeDmChat(userId);
        
    } catch (error) {
        body.innerHTML = '<p class="text-danger">Помилка: ' + error.message + '</p>';
    }
}

// Відправити повідомлення
async function sendDmMessage() {
    var input = document.getElementById('dmMessageInput');
    var message = input.value.trim();
    if (!message || !currentDmUserId) return;
    
    var user = auth.getCurrentUser();
    if (!user) return;
    
    var btn = document.querySelector('#dmChatModal .btn-gold');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }
    
    try {
        await window.sb
            .from('direct_messages')
            .insert({
                sender_id: user.id,
                recipient_id: currentDmUserId,
                message: message,
                is_read: false,
                created_at: new Date().toISOString()
            });
        
        input.value = '';
        
        // Додаємо повідомлення в чат
        var body = document.getElementById('dmChatBody');
        var html = '<div class="dm-chat-message own">';
        html += '<div class="dm-msg-top"><span>Ви</span><span>' + formatDateTimeKyiv(new Date().toISOString()) + '</span></div>';
        html += '<div class="dm-msg-body">' + message + '</div>';
        html += '</div>';
        body.insertAdjacentHTML('beforeend', html);
        body.scrollTop = body.scrollHeight;
        
        // Оновлюємо список переписок
        if (sessionStorage.getItem('onDmPage') === 'true') {
            setTimeout(loadDirectMessages, 500);
        }
        
    } catch (error) {
        showAlert('Помилка: ' + error.message, 'error');
    }
    
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
}

// Натискання Enter для відправки
document.addEventListener('DOMContentLoaded', function() {
    var input = document.getElementById('dmMessageInput');
    if (input) {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendDmMessage();
            }
        });
    }
});

// Real-time для нових повідомлень в чаті
function setupRealtimeDmChat(otherUserId) {
    if (dmChannel) {
        try { window.sb.removeChannel(dmChannel); } catch(e) {}
        dmChannel = null;
    }
    
    var user = auth.getCurrentUser();
    if (!user) return;
    
    dmChannel = window.sb
        .channel('dm-chat-realtime-' + user.id + '-' + otherUserId)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: 'sender_id=eq.' + otherUserId + ',recipient_id=eq.' + user.id
        }, function(payload) {
            var msg = payload.new;
            var body = document.getElementById('dmChatBody');
            if (!body) return;
            
            // Якщо це відкритий чат з цим користувачем
            if (currentDmUserId === msg.sender_id) {
                var html = '<div class="dm-chat-message">';
                html += '<div class="dm-msg-top"><span>' + (otherUserId === msg.sender_id ? 'Користувач' : 'Ви') + '</span><span>' + formatDateTimeKyiv(msg.created_at) + '</span></div>';
                html += '<div class="dm-msg-body">' + msg.message + '</div>';
                html += '</div>';
                body.insertAdjacentHTML('beforeend', html);
                body.scrollTop = body.scrollHeight;
                
                // Позначаємо як прочитане
                window.sb
                    .from('direct_messages')
                    .update({ is_read: true })
                    .eq('id', msg.id);
                updateDmBadge();
            }
        })
        .subscribe();
}

// Real-time для оновлення списку переписок
function setupRealtimeDm() {
    var user = auth.getCurrentUser();
    if (!user) return;
    // Вже є інтервал в init
}

// Оновлюємо badge для непрочитаних особистих повідомлень
async function updateDmBadge() {
    var user = auth.getCurrentUser();
    if (!user) return;
    try {
        var { data: unread, error } = await window.sb
            .from('direct_messages')
            .select('id')
            .eq('recipient_id', user.id)
            .eq('is_read', false);
            
        var count = unread ? unread.length : 0;
        var badge = document.getElementById('dmBadge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (e) {}
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
            var shortId = getShortTicketId(t.id);
            var statusClass = myTicketStatusClasses[t.status] || 'badge-secondary';
            var statusLabel = myTicketStatusLabels[t.status] || t.status;
            var priorityClass = myTicketPriorityClasses[t.priority] || 'badge-primary';
            html += '<div class="ticket-card" onclick="viewMySupportTicket(\'' + t.id + '\')">';
            html += '<div class="ticket-card-top">';
            html += '<span style="font-family:monospace;font-size:0.7rem;color:var(--muted);margin-right:0.5rem;">' + shortId + '</span>';
            html += '<span class="ticket-card-subject">' + (t.subject || '—') + '</span>';
            html += '<span class="badge ' + statusClass + '">' + statusLabel + '</span>';
            html += '</div>';
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
        var shortId = getShortTicketId(ticketId);
        var statusLabel = myTicketStatusLabels[t.status] || t.status;
        document.getElementById('supportTicketModalTitle').textContent = 'Тікет ' + shortId + ' — ' + (t.subject || '');
        var html = '<div class="ticket-card-meta" style="margin-bottom:0.8rem;">';
        html += '<span style="font-family:monospace;font-size:0.8rem;color:var(--muted);margin-right:0.5rem;">' + shortId + '</span>';
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
                if (msg.sender_type === 'ai') senderLabel = '🤖 Typebiz Bot';
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
        
        // Налаштовуємо реальний час для чату підтримки
        setupRealtimeSupportChat(ticketId);
        
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
    var submitBtn = document.querySelector('#myTicketReply + .btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Відправка...';
    }
    try {
        await db.sendSupportMessage({
            ticket_id: ticketId,
            sender_id: user.id,
            sender_type: 'user',
            message: message
        });
        await db.updateSupportTicket(ticketId, { updated_at: new Date().toISOString() });
        textarea.value = '';
        await viewMySupportTicket(ticketId);
        showToast('✅ Повідомлення відправлено!', 'success');
    } catch (error) {
        showAlert('Помилка: ' + error.message, 'error');
    }
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Надіслати';
    }
}

// ============================================================
// ДИНАМІЧНИЙ ЧАТ ПІДТРИМКИ (REALTIME)
// ============================================================

var _supportChatChannel = null;

function setupRealtimeSupportChat(ticketId) {
    if (!window.sb) return;
    
    if (_supportChatChannel) {
        try { window.sb.removeChannel(_supportChatChannel); } catch(e) {}
        _supportChatChannel = null;
    }
    
    _supportChatChannel = window.sb
        .channel('support-chat-realtime-' + ticketId)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: 'ticket_id=eq.' + ticketId
        }, function(payload) {
            var msg = payload.new;
            var user = auth.getCurrentUser();
            
            // Якщо це наше повідомлення - ігноруємо
            if (msg.sender_id === user.id && msg.sender_type === 'user') return;
            
            var container = document.getElementById('supportTicketModalBody');
            if (!container) return;

            if (window.playNotificationSound) playNotificationSound();
            
            // Додаємо повідомлення
            var isStaff = isStaffRole(msg.sender_type);
            var senderLabel = isStaff ? getRoleBadgeHtml(msg.sender_type) : '👤 Ви';
            if (msg.sender_type === 'ai') senderLabel = '🤖 Typebiz Bot';
            
            var html = '<div class="support-msg' + (isStaff ? ' staff' : '') + '">';
            html += '<div class="support-msg-top"><span>' + senderLabel + '</span><span>' + formatDateTimeKyiv(msg.created_at) + '</span></div>';
            html += '<div class="support-msg-body">' + msg.message + '</div></div>';
            
            // Вставляємо перед формою відповіді
            var form = container.querySelector('hr');
            if (form) {
                form.insertAdjacentHTML('beforebegin', html);
            } else {
                container.insertAdjacentHTML('beforeend', html);
            }
            
            container.scrollTop = container.scrollHeight;
            
            // Якщо тікет закрито - оновлюємо статус
            if (msg.sender_type === 'ai' && msg.message.includes('закрито')) {
                // Оновлюємо статус в заголовку
                var statusBadge = container.querySelector('.ticket-card-meta .badge:first-child');
                if (statusBadge) {
                    statusBadge.textContent = 'Закрито';
                    statusBadge.className = 'badge badge-secondary';
                }
                // Додаємо повідомлення про закриття
                var closeMsg = document.createElement('p');
                closeMsg.className = 'text-muted';
                closeMsg.style.marginTop = '1rem';
                closeMsg.textContent = '✅ Тікет закрито';
                container.appendChild(closeMsg);
                // Видаляємо форму
                var formToRemove = container.querySelector('hr');
                if (formToRemove) {
                    formToRemove.remove();
                    var textarea = container.querySelector('#myTicketReply');
                    if (textarea) textarea.remove();
                    var btn = container.querySelector('.btn-gold[onclick*="sendMySupportReply"]');
                    if (btn) btn.remove();
                }
            }
        })
        .subscribe();
}

// ============================================================
// ІНІЦІАЛІЗАЦІЯ (З ВИПРАВЛЕННЯМ БАГУ ЗБЕРЕЖЕННЯ ВКЛАДОК)
// ============================================================

// Функція для відновлення збереженої вкладки
function restoreActiveSection() {
    var section = getActiveSection();
    switch(section) {
        case 'notifications':
            if (typeof loadNotifications === 'function') {
                loadNotifications();
                return true;
            }
            break;
        case 'directmessages':
            if (typeof loadDirectMessages === 'function') {
                loadDirectMessages();
                return true;
            }
            break;
        case 'organizations':
        default:
            if (typeof loadDashboard === 'function') {
                loadDashboard();
                return true;
            }
            break;
    }
    return false;
}

(async function init() {
    try {
        var isAuth = await auth.requireAuth();
        if (!isAuth) return;
        var user = auth.getCurrentUser();
        if (user && user.is_banned === true) {
            window.location.href = '/banned';
            return;
        }
        
        // Відновлюємо збережену вкладку
        var restored = restoreActiveSection();
        if (!restored) {
            // Якщо не вдалося відновити - завантажуємо дашборд
            await loadDashboard();
        }
        
        // Завантажуємо кастомні типи
        loadCustomOrgTypes();
        
        // Глобальні оголошення
        if (window.renderGlobalAnnouncements) {
            renderGlobalAnnouncements();
        }
        
        // Налаштовуємо реальний час для сповіщень
        if (window.setupNotificationsRealtime) {
            setupNotificationsRealtime();
        }
        if (window.updateNotificationBadge) {
            updateNotificationBadge();
        }
        
        // Оновлюємо бейдж переписок
        await updateDmBadge();
        
        // Періодичне оновлення бейджів
        setInterval(updateDmBadge, 30000);
        
        // Зберігаємо поточну вкладку при переході
        document.querySelectorAll('.nav-menu a').forEach(function(link) {
            link.addEventListener('click', function() {
                var onclick = this.getAttribute('onclick') || '';
                if (onclick.includes('loadNotifications()')) {
                    saveActiveSection('notifications');
                } else if (onclick.includes('loadDirectMessages()')) {
                    saveActiveSection('directmessages');
                } else if (onclick.includes('loadDashboardView()') || onclick.includes('loadDashboard()')) {
                    saveActiveSection('organizations');
                }
            });
        });
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        window.location.href = '/login';
    }
})();
