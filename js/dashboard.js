// ============================================
// TYPEBIZ - ДАШБОРД
// ============================================

let currentUser = null;
let organizations = [];

async function loadDashboard() {
    currentUser = auth.getCurrentUser();
    if (!currentUser) return;

    await loadOrganizations();
    
    document.getElementById('userName').textContent = currentUser.full_name || 'Пользователь';
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userAvatar').textContent = (currentUser.full_name || 'U')[0].toUpperCase();
    
    if (currentUser.role === 'admin') {
        document.getElementById('adminLink').style.display = 'block';
    }
}

async function loadOrganizations() {
    try {
        organizations = await db.getUserOrganizations();
        const grid = document.getElementById('orgGrid');
        const emptyState = document.getElementById('emptyState');

        grid.innerHTML = '';

        if (!organizations || organizations.length === 0) {
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

        organizations.forEach(org => {
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
                window.location.href = `/org?id=${org.id}`;
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

    } catch (error) {
        console.error('Load organizations error:', error);
        await showAlert('Ошибка загрузки организаций: ' + error.message, 'error');
    }
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
        const result = await db.createOrganization({
            name,
            type,
            description: description || '',
            is_active: true,
            settings: {}
        });

        console.log('✅ Организация создана:', result);

        await showToast('Организация создана! 🎉', 'success');
        closeModal('createOrgModal');
        document.getElementById('createOrgForm').reset();
        await loadOrganizations();

    } catch (error) {
        console.error('❌ Create organization error:', error);
        await showAlert('Ошибка: ' + error.message, 'error');
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-rocket"></i> Создать организацию';
});

// ===== ВЫХОД (ПРЯМОЙ ВЫЗОВ) =====
function handleLogout() {
    auth.logoutUser();
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
(async function init() {
    const isAuth = await auth.requireAuth();
    if (!isAuth) return;

    await loadDashboard();
    console.log('✅ Dashboard loaded');
})();
