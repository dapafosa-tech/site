// ============================================
// ORGSPACE - ЛОГИКА ДАШБОРДА
// ============================================

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

    const iconMap = {
        'shop': { icon: 'fa-store', class: 'shop' },
        'library': { icon: 'fa-book', class: 'library' },
        'company': { icon: 'fa-building', class: 'company' },
        'school': { icon: 'fa-graduation-cap', class: 'other' },
        'clinic': { icon: 'fa-heartbeat', class: 'other' },
        'other': { icon: 'fa-cubes', class: 'other' }
    };

    const typeLabels = {
        'shop': 'Магазин',
        'library': 'Библиотека',
        'company': 'Компания',
        'school': 'Школа',
        'clinic': 'Клиника',
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
        `;
        card.addEventListener('click', () => {
            window.location.href = `/org-dashboard.html?id=${org.id}`;
        });
        grid.appendChild(card);
    });

    const createCard = document.createElement('div');
    createCard.className = 'org-card create-org-card';
    createCard.innerHTML = `
        <i class="fas fa-plus-circle"></i>
        <h4>Создать организацию</h4>
    `;
    createCard.addEventListener('click', openCreateOrg);
    grid.appendChild(createCard);
}

function openCreateOrg() {
    document.getElementById('createOrgModal').classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

document.getElementById('createOrgForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('orgName').value.trim();
    const type = document.getElementById('orgType').value;
    const description = document.getElementById('orgDesc').value.trim();
    const user = auth.getCurrentUser();

    if (!user) {
        await showAlert('Пожалуйста, войдите в систему', 'warning');
        return;
    }

    if (!name) {
        await showAlert('Введите название организации', 'warning');
        return;
    }

    if (!type) {
        await showAlert('Выберите тип организации', 'warning');
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
            await db.logActivity({
                organization_id: result[0].id,
                user_id: user.id,
                action: 'create',
                entity_type: 'organization',
                entity_id: result[0].id,
                changes: data
            });

            await showToast('Организация создана! 🎉', 'success');
            closeModal('createOrgModal');
            document.getElementById('createOrgForm').reset();
            loadOrganizations();
        } else {
            await showAlert('Ошибка при создании организации', 'error');
        }
    } catch (error) {
        console.error('Create organization error:', error);
        await showAlert('Ошибка: ' + error.message, 'error');
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-rocket"></i> Создать организацию';
});

async function loadUserInfo() {
    const user = auth.getCurrentUser();
    if (!user) return;

    const profile = user.profile || await db.getUserProfile(user.id);

    document.getElementById('userName').textContent = profile?.full_name || user.email;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userAvatar').textContent = (profile?.full_name || 'U')[0].toUpperCase();

    if (auth.isAdmin()) {
        document.getElementById('adminLink').style.display = 'block';
    }
}

async function handleLogout() {
    const confirmed = await showConfirm('Вы уверены, что хотите выйти?', 'Выход');
    if (confirmed) {
        await auth.logoutUser();
    }
}

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

(async function init() {
    const isAuth = await auth.requireAuth();
    if (!isAuth) return;

    await loadUserInfo();
    await loadOrganizations();

    console.log('✅ Dashboard loaded');
})();
