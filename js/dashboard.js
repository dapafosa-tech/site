// ============================================
// TYPEBIZ - ДАШБОРД
// ============================================

function logoutUser() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('userData');
        localStorage.removeItem('isGuest');
        window.location.href = '/login';
    }
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

// ===== ЗАГРУЗКА =====
async function loadDashboard() {
    const user = auth.getCurrentUser();
    if (!user) {
        window.location.href = '/login';
        return;
    }

    document.getElementById('userName').textContent = user.full_name || 'Пользователь';
    document.getElementById('userEmail').textContent = user.email;

    // Аватарка
    const avatarEl = document.getElementById('userAvatar');
    if (user.avatar_url) {
        avatarEl.innerHTML = `<img src="${user.avatar_url}" alt="Avatar">`;
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
        const orgs = await db.getUserAllOrganizations();
        const grid = document.getElementById('orgGrid');
        const emptyState = document.getElementById('emptyState');

        grid.innerHTML = '';

        if (!orgs || orgs.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        const iconMap = {
            'shop': { icon: 'fa-store', class: 'shop' },
            'library': { icon: 'fa-book', class: 'library' },
            'company': { icon: 'fa-building', class: 'company' },
            'school': { icon: 'fa-graduation-cap', class: 'other' },
            'clinic': { icon: 'fa-heartbeat', class: 'other' },
            'restaurant': { icon: 'fa-utensils', class: 'other' },
            'cafe': { icon: 'fa-coffee', class: 'other' },
            'hotel': { icon: 'fa-hotel', class: 'other' },
            'gym': { icon: 'fa-dumbbell', class: 'other' },
            'beauty': { icon: 'fa-spa', class: 'other' },
            'auto': { icon: 'fa-car', class: 'other' },
            'realty': { icon: 'fa-home', class: 'other' },
            'it': { icon: 'fa-code', class: 'other' },
            'marketing': { icon: 'fa-chart-line', class: 'other' },
            'legal': { icon: 'fa-gavel', class: 'other' },
            'finance': { icon: 'fa-coins', class: 'other' },
            'education': { icon: 'fa-graduation-cap', class: 'other' },
            'medical': { icon: 'fa-heartbeat', class: 'other' },
            'sport': { icon: 'fa-running', class: 'other' },
            'art': { icon: 'fa-palette', class: 'other' },
            'music': { icon: 'fa-music', class: 'other' },
            'photo': { icon: 'fa-camera', class: 'other' },
            'video': { icon: 'fa-video', class: 'other' },
            'construction': { icon: 'fa-hard-hat', class: 'other' },
            'repair': { icon: 'fa-tools', class: 'other' },
            'cleaning': { icon: 'fa-broom', class: 'other' },
            'delivery': { icon: 'fa-truck', class: 'other' },
            'logistics': { icon: 'fa-shipping-fast', class: 'other' },
            'agriculture': { icon: 'fa-tractor', class: 'other' },
            'tourism': { icon: 'fa-plane', class: 'other' },
            'event': { icon: 'fa-calendar-check', class: 'other' },
            'charity': { icon: 'fa-hand-holding-heart', class: 'other' },
            'government': { icon: 'fa-landmark', class: 'other' },
            'gamedev': { icon: 'fa-gamepad', class: 'other' },
            'indie': { icon: 'fa-rocket', class: 'other' },
            'publishing': { icon: 'fa-newspaper', class: 'other' },
            'animation': { icon: 'fa-film', class: 'other' },
            'vr': { icon: 'fa-vr-cardboard', class: 'other' },
            'esports': { icon: 'fa-trophy', class: 'other' },
            'streaming': { icon: 'fa-broadcast', class: 'other' },
            'podcast': { icon: 'fa-microphone', class: 'other' },
            'blogging': { icon: 'fa-blog', class: 'other' },
            'social': { icon: 'fa-share-alt', class: 'other' },
            'startup': { icon: 'fa-lightbulb', class: 'other' },
            'agency': { icon: 'fa-ad', class: 'other' },
            'consulting': { icon: 'fa-handshake', class: 'other' },
            'freelance': { icon: 'fa-user-tie', class: 'other' },
            'remote': { icon: 'fa-globe', class: 'other' },
            'coworking': { icon: 'fa-building', class: 'other' },
            'incubator': { icon: 'fa-seedling', class: 'other' },
            'accelerator': { icon: 'fa-rocket', class: 'other' },
            'venture': { icon: 'fa-chart-pie', class: 'other' },
            'nonprofit': { icon: 'fa-heart', class: 'other' },
            'community': { icon: 'fa-users', class: 'other' },
            'religious': { icon: 'fa-church', class: 'other' },
            'cultural': { icon: 'fa-landmark', class: 'other' },
            'research': { icon: 'fa-flask', class: 'other' },
            'science': { icon: 'fa-atom', class: 'other' },
            'space': { icon: 'fa-rocket', class: 'other' },
            'robotics': { icon: 'fa-robot', class: 'other' },
            'ai': { icon: 'fa-brain', class: 'other' },
            'blockchain': { icon: 'fa-link', class: 'other' },
            'crypto': { icon: 'fa-coins', class: 'other' },
            'defi': { icon: 'fa-chart-line', class: 'other' },
            'nft': { icon: 'fa-image', class: 'other' },
            'metaverse': { icon: 'fa-vr-cardboard', class: 'other' },
            'web3': { icon: 'fa-globe', class: 'other' },
            'other': { icon: 'fa-cubes', class: 'other' }
        };

        const typeLabels = {
            'shop': 'Магазин',
            'library': 'Библиотека',
            'company': 'Компания',
            'school': 'Школа',
            'clinic': 'Клиника',
            'restaurant': 'Ресторан',
            'cafe': 'Кафе',
            'hotel': 'Отель',
            'gym': 'Спортзал',
            'beauty': 'Салон красоты',
            'auto': 'Автосервис',
            'realty': 'Недвижимость',
            'it': 'IT-компания',
            'marketing': 'Маркетинг',
            'legal': 'Юридическая',
            'finance': 'Финансы',
            'education': 'Образование',
            'medical': 'Медицина',
            'sport': 'Спорт',
            'art': 'Искусство',
            'music': 'Музыка',
            'photo': 'Фото',
            'video': 'Видео',
            'construction': 'Строительство',
            'repair': 'Ремонт',
            'cleaning': 'Клининг',
            'delivery': 'Доставка',
            'logistics': 'Логистика',
            'agriculture': 'Сельское хозяйство',
            'tourism': 'Туризм',
            'event': 'Ивент',
            'charity': 'Благотворительность',
            'government': 'Государственная',
            'gamedev': 'GameDev',
            'indie': 'Инди-разработка',
            'publishing': 'Издательство',
            'animation': 'Анимация',
            'vr': 'VR/AR',
            'esports': 'Киберспорт',
            'streaming': 'Стриминг',
            'podcast': 'Подкаст',
            'blogging': 'Блоггинг',
            'social': 'Соцсети',
            'startup': 'Стартап',
            'agency': 'Агентство',
            'consulting': 'Консалтинг',
            'freelance': 'Фриланс',
            'remote': 'Удалённая работа',
            'coworking': 'Коворкинг',
            'incubator': 'Инкубатор',
            'accelerator': 'Акселератор',
            'venture': 'Венчур',
            'nonprofit': 'Некоммерческая',
            'community': 'Сообщество',
            'religious': 'Религиозная',
            'cultural': 'Культурная',
            'research': 'Исследования',
            'science': 'Наука',
            'space': 'Космос',
            'robotics': 'Робототехника',
            'ai': 'ИИ',
            'blockchain': 'Блокчейн',
            'crypto': 'Криптовалюта',
            'defi': 'DeFi',
            'nft': 'NFT',
            'metaverse': 'Метавселенная',
            'web3': 'Web3',
            'other': 'Другое'
        };

        orgs.forEach(org => {
            const iconData = iconMap[org.type] || iconMap['other'];
            const card = document.createElement('div');
            card.className = 'org-card';
            card.innerHTML = `
                <div class="org-icon ${iconData.class}">
                    <i class="fas ${iconData.icon}"></i>
                </div>
                <h3>${org.name}</h3>
                <p>${org.description || 'Нет описания'}</p>
                <span class="org-type">${typeLabels[org.type] || org.type}</span>
                <div class="org-join-code">
                    <i class="fas fa-key"></i> Код: <span class="join-code">${org.join_code || '---'}</span>
                </div>
            `;
            card.addEventListener('click', () => {
                window.location.href = `/org?id=${org.id}`;
            });
            grid.appendChild(card);
        });

    } catch (error) {
        console.error('Load organizations error:', error);
        alert('Ошибка загрузки организаций: ' + error.message);
    }
}

// ===== СОЗДАНИЕ ОРГАНИЗАЦИИ =====
document.getElementById('createOrgForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('orgName').value.trim();
    const type = document.getElementById('orgType').value;
    const description = document.getElementById('orgDesc').value.trim();

    if (!name) {
        alert('Введите название организации');
        return;
    }

    if (!type) {
        alert('Выберите тип организации');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Создание...';

    try {
        await db.createOrganization({
            name,
            type,
            description: description || '',
            is_active: true,
            settings: {}
        });

        alert('Организация создана! 🎉');
        closeModal('createOrgModal');
        document.getElementById('createOrgForm').reset();
        await loadOrganizations();

    } catch (error) {
        console.error('Create organization error:', error);
        alert('Ошибка: ' + error.message);
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-rocket"></i> Создать организацию';
});

// ===== ВСТУПЛЕНИЕ ПО КОДУ =====
document.getElementById('joinOrgForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const code = document.getElementById('joinCode').value.trim().toUpperCase();
    const message = document.getElementById('joinMessage').value.trim();
    const user = auth.getCurrentUser();

    if (!code) {
        alert('Введите код организации');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';

    try {
        const org = await db.getOrganizationByJoinCode(code);
        
        if (!org) {
            alert('Организация с таким кодом не найдена');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Отправить заявку';
            return;
        }

        const members = await db.getOrganizationMembers(org.id);
        const alreadyMember = members.some(m => m.user_id === user.id);
        
        if (alreadyMember) {
            alert('Вы уже состоите в этой организации');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Отправить заявку';
            return;
        }

        await db.createJoinRequest(org.id, user.id, message);

        alert('Заявка отправлена! Лидер организации рассмотрит её.');
        closeModal('joinOrgModal');
        document.getElementById('joinOrgForm').reset();

    } catch (error) {
        console.error('Join organization error:', error);
        alert('Ошибка: ' + error.message);
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Отправить заявку';
});

// Закрытие модалок по клику вне
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

// ===== ИНИЦИАЛИЗАЦИЯ =====
(async function init() {
    const isAuth = await auth.requireAuth();
    if (!isAuth) return;

    await loadDashboard();
    console.log('✅ Dashboard loaded');
})();
