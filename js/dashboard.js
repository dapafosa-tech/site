// ============================================
// ORGSPACE - ЛОГИКА ДАШБОРДА
// ============================================

// ===== ЗАГРУЗКА ДАННЫХ =====

/**
 * Загружает организации пользователя
 */
async function loadOrganizations() {
    const user = auth.getCurrentUser();
    if (!user) return;

    const orgs = await db.getUserOrganizations(user.id);
    const grid = document.getElementById('orgGrid');
    const emptyState = document.getElementById('emptyState');

    grid.innerHTML = '';

    if (!orgs || orgs.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    // Создаем карточки организаций
    orgs.forEach(org => {
        const iconMap = {
            'shop': { icon: 'fa-store', class: 'shop' },
            'library': { icon: 'fa-book', class: 'library' },
            'company': { icon: 'fa-building', class: 'company' },
            'school': { icon: 'fa-graduation-cap', class: 'other' },
            'clinic': { icon: 'fa-heartbeat', class: 'other' },
            'other': { icon: 'fa-cubes', class: 'other' }
        };

        const iconData = iconMap[org.type] || iconMap['other'];
        const typeLabels = {
            'shop': 'Магазин',
            'library': 'Библиотека',
            'company': 'Компания',
            'school': 'Школа',
            'clinic': 'Клиника',
            'other': 'Другое'
        };

        const card = document.createElement('div');
        card.className = 'org-card';
        card.innerHTML = `
            <div class="org-icon ${iconData.class}">
                <i class="fas ${iconData.icon}"></i>
            </div>
            <h3>${org.name}</h3>
            <p>${org.description || 'Нет описания'}</p>
            <span class="org-type">${typeLabels[org.type] || org.type}</span>
        `;
        card.addEventListener('click', () => {
            window.location.href = `/org-dashboard.html?id=${org.id}`;
        });
        grid.appendChild(card);
    });

    // Добавляем карточку создания
    const createCard = document.createElement('div');
    createCard.className = 'org-card create-org-card';
    createCard.innerHTML = `
        <i class="fas fa-plus-circle"></i>
        <h4>Создать организацию</h4>
    `;
    createCard.addEventListener('click', openCreateOrg);
    grid.appendChild(createCard);
}

// ===== МОДАЛЬНОЕ ОКНО =====

/**
 * Открывает модалку создания организации
 */
function openCreateOrg() {
    document.getElementById('createOrgModal').classList.add('active');
}

/**
 * Закрывает модалку
 */
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// ===== СОЗДАНИЕ ОРГАНИЗАЦИИ =====

/**
 * Обработчик создания организации
 */
document.getElementById('createOrgForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('orgName').value.trim();
    const type = document.getElementById('orgType').value;
    const description = document.getElementById('orgDesc').value.trim();
    const user = auth.getCurrentUser();

    if (!user) {
        alert('Пожалуйста, войдите в систему');
        return;
    }

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
        const data = {
            name: name,
            type: type,
            description: description || '',
            created_by: user.id,
            settings: {},
            is_active: true
        };

        const result = await db.createOrganization(data);

        if (result && result.length > 0) {
            // Логируем действие
            await db.logActivity({
                organization_id: result[0].id,
                user_id: user.id,
                action: 'create',
                entity_type: 'organization',
                entity_id: result[0].id,
                changes: data
            });

            alert('Организация создана!');
            closeModal('createOrgModal');
            document.getElementById('createOrgForm').reset();
            loadOrganizations();
        } else {
            alert('Ошибка при создании организации');
        }
    } catch (error) {
        console.error('Create organization error:', error);
        alert('Ошибка: ' + error.message);
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-rocket"></i> Создать организацию';
});

// ===== ЗАГРУЗКА ПРОФИЛЯ =====

/**
 * Загружает информацию о пользователе
 */
async function loadUserInfo() {
    const user = auth.getCurrentUser();
    if (!user) return;

    const profile = user.profile || await db.getUserProfile(user.id);

    document.getElementById('userName').textContent = profile?.full_name || user.email;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userAvatar').textContent = (profile?.full_name || 'U')[0].toUpperCase();

    // Показываем ссылку на админку если админ
    if (auth.isAdmin()) {
        document.getElementById('adminLink').style.display = 'block';
    }
}

// ===== ВЫХОД =====

/**
 * Обработчик выхода
 */
async function handleLogout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        await auth.logoutUser();
    }
}

// ===== ЗАКРЫТИЕ МОДАЛКИ ПО КЛИКУ СНАРУЖИ =====

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// ===== ИНИЦИАЛИЗАЦИЯ =====

(async function init() {
    // Проверяем авторизацию
    const isAuth = await auth.requireAuth();
    if (!isAuth) return;

    // Загружаем данные
    await loadUserInfo();
    await loadOrganizations();

    console.log('✅ Dashboard loaded');
})();