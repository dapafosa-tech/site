// ============================================
// TYPEBIZ - ДАШБОРД (З КАСТОМНИМИ МОДАЛКАМИ)
// ============================================

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

    if (user.role === 'admin') {
        document.getElementById('adminLink').style.display = 'block';
    }

    await loadOrganizations();
}

async function loadOrganizations() {
    try {
        var orgs = await db.getUserAllOrganizations();
        var grid = document.getElementById('orgGrid');
        var emptyState = document.getElementById('emptyState');

        grid.innerHTML = '';

        if (!orgs || orgs.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        var iconMap = {
            'shop': 'fa-store',
            'library': 'fa-book',
            'company': 'fa-building',
            'school': 'fa-graduation-cap',
            'clinic': 'fa-heartbeat',
            'restaurant': 'fa-utensils',
            'cafe': 'fa-coffee',
            'hotel': 'fa-hotel',
            'gym': 'fa-dumbbell',
            'beauty': 'fa-spa',
            'auto': 'fa-car',
            'realty': 'fa-home',
            'it': 'fa-code',
            'marketing': 'fa-chart-line',
            'legal': 'fa-gavel',
            'finance': 'fa-coins',
            'education': 'fa-graduation-cap',
            'medical': 'fa-heartbeat',
            'sport': 'fa-running',
            'art': 'fa-palette',
            'music': 'fa-music',
            'photo': 'fa-camera',
            'video': 'fa-video',
            'construction': 'fa-hard-hat',
            'repair': 'fa-tools',
            'cleaning': 'fa-broom',
            'delivery': 'fa-truck',
            'logistics': 'fa-shipping-fast',
            'agriculture': 'fa-tractor',
            'tourism': 'fa-plane',
            'event': 'fa-calendar-check',
            'charity': 'fa-hand-holding-heart',
            'government': 'fa-landmark',
            'gamedev': 'fa-gamepad',
            'indie': 'fa-rocket',
            'publishing': 'fa-newspaper',
            'animation': 'fa-film',
            'vr': 'fa-vr-cardboard',
            'esports': 'fa-trophy',
            'streaming': 'fa-broadcast',
            'podcast': 'fa-microphone',
            'blogging': 'fa-blog',
            'social': 'fa-share-alt',
            'startup': 'fa-lightbulb',
            'agency': 'fa-ad',
            'consulting': 'fa-handshake',
            'freelance': 'fa-user-tie',
            'remote': 'fa-globe',
            'coworking': 'fa-building',
            'incubator': 'fa-seedling',
            'accelerator': 'fa-rocket',
            'venture': 'fa-chart-pie',
            'nonprofit': 'fa-heart',
            'community': 'fa-users',
            'religious': 'fa-church',
            'cultural': 'fa-landmark',
            'research': 'fa-flask',
            'science': 'fa-atom',
            'space': 'fa-rocket',
            'robotics': 'fa-robot',
            'ai': 'fa-brain',
            'blockchain': 'fa-link',
            'crypto': 'fa-coins',
            'defi': 'fa-chart-line',
            'nft': 'fa-image',
            'metaverse': 'fa-vr-cardboard',
            'web3': 'fa-globe',
            'other': 'fa-cubes'
        };

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

        orgs.forEach(function(org) {
            var iconClass = iconMap[org.type] || 'fa-cubes';
            var card = document.createElement('div');
            card.className = 'org-card';
            card.innerHTML = 
                '<div class="org-icon">' +
                    '<i class="fas ' + iconClass + '"></i>' +
                '</div>' +
                '<h3>' + org.name + '</h3>' +
                '<p>' + (org.description || 'Немає опису') + '</p>' +
                '<span class="org-type">' + (typeLabels[org.type] || org.type) + '</span>' +
                '<div class="org-join-code">' +
                    '<i class="fas fa-key"></i> Код: <span class="join-code">' + (org.join_code || '---') + '</span>' +
                '</div>';
            card.addEventListener('click', function() {
                window.location.href = '/org?id=' + org.id;
            });
            grid.appendChild(card);
        });

    } catch (error) {
        console.error('Load organizations error:', error);
        showAlert('Помилка завантаження організацій: ' + error.message, 'error');
    }
}

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
        var result = await db.createOrganization({
            name: name,
            type: type,
            description: description || '',
            is_active: true,
            settings: {}
        });

        showToast('Організацію створено! 🎉', 'success');
        closeModal('createOrgModal');
        document.getElementById('createOrgForm').reset();
        await loadOrganizations();

    } catch (error) {
        console.error('Create organization error:', error);
        showAlert('Помилка: ' + error.message, 'error');
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-rocket"></i> Створити організацію';
});

document.getElementById('joinOrgForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    var code = document.getElementById('joinCode').value.trim().toUpperCase();
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
            showAlert('Організацію з таким кодом не знайдено', 'warning');
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
        console.error('Join organization error:', error);
        showAlert('Помилка: ' + error.message, 'error');
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Відправити заявку';
});

document.querySelectorAll('.modal').forEach(function(modal) {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

(async function init() {
    var isAuth = await auth.requireAuth();
    if (!isAuth) return;

    await loadDashboard();
    console.log('✅ Dashboard loaded');
})();
