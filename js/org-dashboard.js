// ============================================
// TYPEBIZ - ДАШБОРД ОРГАНИЗАЦИИ (С ОТЛАДКОЙ)
// ============================================

let currentOrgId = null;
let currentOrg = null;
let currentUser = null;

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
    'other': 'Другое'
};

const statusLabels = {
    'pending': '⏳ Ожидает',
    'approved': '✅ Одобрено',
    'rejected': '❌ Отклонено'
};

// ===== ОТЛАДКА =====
function debugLog(message, data = null) {
    console.log(`[ORG-DASHBOARD] ${message}`, data || '');
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
async function init() {
    debugLog('🚀 Инициализация...');
    
    const isAuth = await auth.requireAuth();
    if (!isAuth) {
        debugLog('❌ Не авторизован');
        return;
    }

    currentUser = auth.getCurrentUser();
    debugLog('👤 Пользователь:', currentUser);
    
    await loadOrganization();
}

function getOrgIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    debugLog('📌 ID из URL:', id);
    return id;
}

async function loadOrganization() {
    const orgId = getOrgIdFromUrl();
    if (!orgId) {
        debugLog('❌ Нет ID организации');
        window.location.href = '/dashboard';
        return;
    }

    currentOrgId = orgId;
    debugLog('📡 Загрузка организации...');
    
    try {
        currentOrg = await db.getOrganization(orgId);
        debugLog('✅ Организация загружена:', currentOrg);
    } catch (error) {
        debugLog('❌ Ошибка загрузки организации:', error);
        await showAlert('Ошибка загрузки организации: ' + error.message, 'error');
        window.location.href = '/dashboard';
        return;
    }

    if (!currentOrg) {
        debugLog('❌ Организация не найдена');
        await showAlert('Организация не найдена', 'error');
        window.location.href = '/dashboard';
        return;
    }

    debugLog('✅ Заполняем информацию...');
    document.getElementById('orgName').textContent = currentOrg.name;
    document.getElementById('orgType').textContent = typeLabels[currentOrg.type] || currentOrg.type;
    document.getElementById('joinCode').textContent = currentOrg.join_code || '---';

    debugLog('📡 Загружаем раздел overview...');
    loadSection('overview');
}

function loadSection(section) {
    debugLog(`📂 Загрузка раздела: ${section}`);
    
    document.querySelectorAll('.nav-menu a').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-menu a').forEach(el => {
        const onclick = el.getAttribute('onclick') || '';
        if (onclick.includes(section)) {
            el.classList.add('active');
        }
    });

    try {
        switch (section) {
            case 'overview': loadOverview(); break;
            case 'members': loadMembers(); break;
            case 'requests': loadRequests(); break;
            case 'ranks': loadRanks(); break;
            case 'departments': loadDepartments(); break;
            case 'settings': loadSettings(); break;
            default: loadOverview();
        }
        debugLog(`✅ Раздел ${section} загружен`);
    } catch (error) {
        debugLog(`❌ Ошибка загрузки раздела ${section}:`, error);
        document.getElementById('sectionContent').innerHTML = `<div class="alert alert-danger">Ошибка: ${error.message}</div>`;
    }
}

// ===== ОБЗОР =====
async function loadOverview() {
    debugLog('📊 Загрузка обзора...');
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Обзор';
    document.getElementById('pageSubtitle').textContent = `Управление организацией "${currentOrg?.name}"`;

    try {
        debugLog('📡 Загрузка участников...');
        const members = await db.getOrganizationMembers(currentOrgId);
        debugLog(`📊 Участников: ${members?.length || 0}`);
        
        debugLog('📡 Загрузка должностей...');
        const ranks = await db.getOrganizationRanks(currentOrgId);
        debugLog(`📊 Должностей: ${ranks?.length || 0}`);
        
        debugLog('📡 Загрузка заявок...');
        const requests = await db.getJoinRequests(currentOrgId);
        debugLog(`📊 Заявок: ${requests?.length || 0}`);

        container.innerHTML = `
            <div class="grid-4">
                <div class="stat-card">
                    <div class="stat-value">${members?.length || 0}</div>
                    <div class="stat-label">Участников</div>
                </div>
                <div class="stat-card" style="border-color: var(--success);">
                    <div class="stat-value">${ranks?.length || 0}</div>
                    <div class="stat-label">Должностей</div>
                </div>
                <div class="stat-card" style="border-color: var(--warning);">
                    <div class="stat-value">${requests?.filter(r => r.status === 'pending').length || 0}</div>
                    <div class="stat-label">Ожидают заявки</div>
                </div>
                <div class="stat-card" style="border-color: var(--secondary);">
                    <div class="stat-value" style="font-family:monospace;font-size:1.5rem;letter-spacing:3px;">${currentOrg.join_code || '---'}</div>
                    <div class="stat-label">Код вступления</div>
                </div>
            </div>
            <div class="card mt-3">
                <div class="card-header">
                    <h3 class="card-title">Информация об организации</h3>
                </div>
                <div class="grid-2">
                    <div>
                        <p><strong>Название:</strong> ${currentOrg?.name}</p>
                        <p><strong>Тип:</strong> ${typeLabels[currentOrg?.type] || currentOrg?.type}</p>
                        <p><strong>Описание:</strong> ${currentOrg?.description || 'Нет описания'}</p>
                    </div>
                    <div>
                        <p><strong>Код вступления:</strong> <span style="font-family:monospace;font-size:1.2rem;letter-spacing:2px;background:var(--gray-100);padding:0.2rem 0.8rem;border-radius:var(--radius-sm);">${currentOrg?.join_code || '---'}</span></p>
                        <p><strong>Создана:</strong> ${new Date(currentOrg?.created_at).toLocaleDateString('ru-RU')}</p>
                    </div>
                </div>
            </div>
        `;
        debugLog('✅ Обзор загружен');
    } catch (error) {
        debugLog('❌ Ошибка загрузки обзора:', error);
        container.innerHTML = `<div class="alert alert-danger">Ошибка загрузки данных: ${error.message}</div>`;
    }
}

// ===== УЧАСТНИКИ =====
async function loadMembers() {
    debugLog('👥 Загрузка участников...');
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Участники';
    document.getElementById('pageSubtitle').textContent = 'Управление участниками организации';

    try {
        const members = await db.getOrganizationMembers(currentOrgId);
        debugLog(`👥 Участников: ${members?.length || 0}`);
        
        const ranks = await db.getOrganizationRanks(currentOrgId);
        debugLog(`📊 Должностей: ${ranks?.length || 0}`);

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Список участников (${members?.length || 0})</h3>
                </div>
                <div style="overflow-x:auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Пользователь</th>
                                <th>Должность</th>
                                <th>Дата вступления</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (members && members.length > 0) {
            for (const member of members) {
                try {
                    const user = await db.supabaseQuery(`users?id=eq.${member.user_id}`);
                    const userName = user && user.length > 0 ? (user[0].full_name || user[0].email) : 'Неизвестно';
                    const rank = ranks?.find(r => r.id === member.rank_id);
                    const isLeader = currentOrg.leader_id === member.user_id;

                    html += `
                        <tr>
                            <td><strong>${userName} ${isLeader ? '👑' : ''}</strong></td>
                            <td>${rank ? `<span style="color:${rank.color}">${rank.name}</span>` : 'Без должности'}</td>
                            <td>${new Date(member.joined_at).toLocaleDateString('ru-RU')}</td>
                            <td>
                                ${!isLeader && currentOrg.leader_id === currentUser?.id ? `
                                    <button class="btn btn-sm btn-outline" onclick="openAssignRank('${member.id}', '${userName}')">
                                        <i class="fas fa-crown"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="removeMember('${member.id}')">
                                        <i class="fas fa-times"></i>
                                    </button>
                                ` : '—'}
                            </td>
                        </tr>
                    `;
                } catch (e) {
                    debugLog('❌ Ошибка загрузки пользователя:', e);
                }
            }
        } else {
            html += `<tr><td colspan="4" class="text-center text-muted">Нет участников</td></tr>`;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
        debugLog('✅ Участники загружены');
    } catch (error) {
        debugLog('❌ Ошибка загрузки участников:', error);
        container.innerHTML = `<div class="alert alert-danger">Ошибка: ${error.message}</div>`;
    }
}

// ===== ЗАЯВКИ =====
async function loadRequests() {
    debugLog('📩 Загрузка заявок...');
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Заявки на вступление';
    document.getElementById('pageSubtitle').textContent = 'Управление заявками';

    try {
        const requests = await db.getJoinRequests(currentOrgId);
        debugLog(`📩 Заявок: ${requests?.length || 0}`);

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Заявки (${requests?.length || 0})</h3>
                </div>
                <div style="overflow-x:auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Пользователь</th>
                                <th>Сообщение</th>
                                <th>Статус</th>
                                <th>Дата</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (requests && requests.length > 0) {
            for (const req of requests) {
                try {
                    const user = await db.supabaseQuery(`users?id=eq.${req.user_id}`);
                    const userName = user && user.length > 0 ? (user[0].full_name || user[0].email) : 'Неизвестно';

                    const isPending = req.status === 'pending';
                    const isLeader = currentOrg.leader_id === currentUser?.id;

                    const statusClass = req.status === 'pending' ? 'badge-warning' : 
                                       req.status === 'approved' ? 'badge-success' : 'badge-danger';

                    html += `
                        <tr>
                            <td><strong>${userName}</strong></td>
                            <td>${req.message || 'Без сообщения'}</td>
                            <td><span class="badge ${statusClass}">${statusLabels[req.status] || req.status}</span></td>
                            <td>${new Date(req.created_at).toLocaleDateString('ru-RU')}</td>
                            <td>
                                ${isPending && isLeader ? `
                                    <button class="btn btn-sm btn-success" onclick="handleRequest('${req.id}', 'approved')">
                                        <i class="fas fa-check"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="handleRequest('${req.id}', 'rejected')">
                                        <i class="fas fa-times"></i>
                                    </button>
                                ` : (isPending ? '⏳' : '—')}
                            </td>
                        </tr>
                    `;
                } catch (e) {
                    debugLog('❌ Ошибка загрузки пользователя:', e);
                }
            }
        } else {
            html += `<tr><td colspan="5" class="text-center text-muted">Нет заявок</td></tr>`;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
        debugLog('✅ Заявки загружены');
    } catch (error) {
        debugLog('❌ Ошибка загрузки заявок:', error);
        container.innerHTML = `<div class="alert alert-danger">Ошибка: ${error.message}</div>`;
    }
}

// ===== ОБРАБОТКА ЗАЯВКИ =====
async function handleRequest(requestId, status) {
    debugLog(`📩 Обработка заявки ${requestId} -> ${status}`);
    try {
        await db.updateJoinRequest(requestId, status);

        if (status === 'approved') {
            const request = await db.supabaseQuery(`join_requests?id=eq.${requestId}`);
            if (request && request.length > 0) {
                await db.addMemberToOrganization(request[0].organization_id, request[0].user_id);
                await showToast('Заявка одобрена! Пользователь добавлен.', 'success');
            }
        } else {
            await showToast('Заявка отклонена.', 'warning');
        }

        loadRequests();
        loadOverview();
    } catch (error) {
        debugLog('❌ Ошибка обработки заявки:', error);
        await showAlert('Ошибка: ' + error.message, 'error');
    }
}

// ===== УДАЛЕНИЕ УЧАСТНИКА =====
async function removeMember(memberId) {
    debugLog(`🗑️ Удаление участника ${memberId}`);
    const confirmed = await showConfirm('Вы уверены, что хотите удалить этого участника?', 'Подтверждение');
    if (!confirmed) return;

    try {
        await db.removeMemberFromOrganization(memberId);
        await showToast('Участник удален', 'success');
        loadMembers();
        loadOverview();
    } catch (error) {
        debugLog('❌ Ошибка удаления участника:', error);
        await showAlert('Ошибка: ' + error.message, 'error');
    }
}

// ===== ДОЛЖНОСТИ =====
async function loadRanks() {
    debugLog('👑 Загрузка должностей...');
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Должности';
    document.getElementById('pageSubtitle').textContent = 'Управление должностями в организации';

    try {
        const ranks = await db.getOrganizationRanks(currentOrgId);
        debugLog(`👑 Должностей: ${ranks?.length || 0}`);

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Должности (${ranks?.length || 0})</h3>
                    ${currentOrg.leader_id === currentUser?.id ? `
                        <button class="btn btn-primary btn-sm" onclick="openCreateRank()">
                            <i class="fas fa-plus"></i> Создать должность
                        </button>
                    ` : ''}
                </div>
                <div style="overflow-x:auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Название</th>
                                <th>Цвет</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (ranks && ranks.length > 0) {
            for (const rank of ranks) {
                const isDefault = ['Основатель', 'Администратор', 'Модератор', 'Участник'].includes(rank.name);

                html += `
                    <tr>
                        <td><strong>${rank.name}</strong></td>
                        <td><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:${rank.color};"></span> ${rank.color}</td>
                        <td>
                            ${!isDefault && currentOrg.leader_id === currentUser?.id ? `
                                <button class="btn btn-sm btn-danger" onclick="deleteRank('${rank.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : '—'}
                        </td>
                    </tr>
                `;
            }
        } else {
            html += `<tr><td colspan="3" class="text-center text-muted">Нет должностей</td></tr>`;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
        debugLog('✅ Должности загружены');
    } catch (error) {
        debugLog('❌ Ошибка загрузки должностей:', error);
        container.innerHTML = `<div class="alert alert-danger">Ошибка: ${error.message}</div>`;
    }
}

// ===== СОЗДАНИЕ ДОЛЖНОСТИ =====
function openCreateRank(editData = null) {
    debugLog('➕ Открытие создания должности');
    document.getElementById('rankModal').classList.add('active');

    if (editData) {
        document.getElementById('rankModalTitle').textContent = 'Редактировать должность';
        document.getElementById('rankSubmitText').textContent = 'Сохранить';
        document.getElementById('rankEditId').value = editData.id;
        document.getElementById('rankName').value = editData.name;
        document.getElementById('rankColor').value = editData.color;
    } else {
        document.getElementById('rankModalTitle').textContent = 'Создать должность';
        document.getElementById('rankSubmitText').textContent = 'Создать';
        document.getElementById('rankEditId').value = '';
        document.getElementById('rankName').value = '';
        document.getElementById('rankColor').value = '#4f46e5';

        document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
        document.querySelector('.color-option')?.classList.add('selected');
    }
}

document.getElementById('rankForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    debugLog('📝 Сохранение должности');

    const editId = document.getElementById('rankEditId').value;
    const name = document.getElementById('rankName').value.trim();
    const color = document.getElementById('rankColor').value;

    if (!name) {
        await showAlert('Введите название должности', 'warning');
        return;
    }

    try {
        if (editId) {
            await db.supabaseQuery(`org_ranks?id=eq.${editId}`, {
                method: 'PATCH',
                body: JSON.stringify({ name, color })
            });
            await showToast('Должность обновлена!', 'success');
        } else {
            await db.createRank(currentOrgId, { name, color, permissions: {} });
            await showToast('Должность создана!', 'success');
        }

        closeModal('rankModal');
        loadRanks();
    } catch (error) {
        debugLog('❌ Ошибка сохранения должности:', error);
        await showAlert('Ошибка: ' + error.message, 'error');
    }
});

// ===== УДАЛЕНИЕ ДОЛЖНОСТИ =====
async function deleteRank(rankId) {
    debugLog(`🗑️ Удаление должности ${rankId}`);
    const confirmed = await showConfirm('Вы уверены, что хотите удалить эту должность?', 'Подтверждение');
    if (!confirmed) return;

    try {
        await db.deleteRank(rankId);
        await showToast('Должность удалена', 'success');
        loadRanks();
    } catch (error) {
        debugLog('❌ Ошибка удаления должности:', error);
        await showAlert('Ошибка: ' + error.message, 'error');
    }
}

// ===== НАЗНАЧЕНИЕ ДОЛЖНОСТИ =====
async function openAssignRank(memberId, userName) {
    debugLog(`👑 Назначение должности для ${userName}`);
    document.getElementById('assignMemberId').value = memberId;
    document.getElementById('assignUserName').value = userName;

    try {
        const ranks = await db.getOrganizationRanks(currentOrgId);
        const select = document.getElementById('assignRankSelect');
        select.innerHTML = '<option value="">Выберите должность...</option>';

        if (ranks && ranks.length > 0) {
            ranks.forEach(rank => {
                const option = document.createElement('option');
                option.value = rank.id;
                option.textContent = rank.name;
                select.appendChild(option);
            });
        }

        document.getElementById('assignRankModal').classList.add('active');
    } catch (error) {
        debugLog('❌ Ошибка загрузки должностей:', error);
        await showAlert('Ошибка загрузки должностей', 'error');
    }
}

document.getElementById('assignRankForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    debugLog('📝 Сохранение назначения должности');

    const memberId = document.getElementById('assignMemberId').value;
    const rankId = document.getElementById('assignRankSelect').value;

    if (!rankId) {
        await showAlert('Выберите должность', 'warning');
        return;
    }

    try {
        await db.updateMemberRank(memberId, rankId);
        await showToast('Должность назначена!', 'success');
        closeModal('assignRankModal');
        loadMembers();
    } catch (error) {
        debugLog('❌ Ошибка назначения должности:', error);
        await showAlert('Ошибка: ' + error.message, 'error');
    }
});

// ===== ОТДЕЛЫ =====
async function loadDepartments() {
    debugLog('🏢 Загрузка отделов...');
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Отделы';
    document.getElementById('pageSubtitle').textContent = 'Управление отделами организации';

    try {
        const depts = await db.getOrganizationDepartments(currentOrgId);
        debugLog(`🏢 Отделов: ${depts?.length || 0}`);

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Отделы (${depts?.length || 0})</h3>
                    ${currentOrg.leader_id === currentUser?.id ? `
                        <button class="btn btn-primary btn-sm" onclick="openCreateDepartment()">
                            <i class="fas fa-plus"></i> Создать отдел
                        </button>
                    ` : ''}
                </div>
                <div style="overflow-x:auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Название</th>
                                <th>Описание</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (depts && depts.length > 0) {
            depts.forEach(dept => {
                html += `
                    <tr>
                        <td><strong>${dept.name}</strong></td>
                        <td>${dept.description || '—'}</td>
                        <td>
                            ${currentOrg.leader_id === currentUser?.id ? `
                                <button class="btn btn-sm btn-danger" onclick="deleteDepartment('${dept.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : '—'}
                        </td>
                    </tr>
                `;
            });
        } else {
            html += `<tr><td colspan="3" class="text-center text-muted">Нет отделов</td></tr>`;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
        debugLog('✅ Отделы загружены');
    } catch (error) {
        debugLog('❌ Ошибка загрузки отделов:', error);
        container.innerHTML = `<div class="alert alert-danger">Ошибка: ${error.message}</div>`;
    }
}

function openCreateDepartment() {
    debugLog('➕ Открытие создания отдела');
    document.getElementById('departmentModal').classList.add('active');
}

document.getElementById('departmentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    debugLog('📝 Сохранение отдела');

    const name = document.getElementById('deptName').value.trim();
    const description = document.getElementById('deptDesc').value.trim();

    if (!name) {
        await showAlert('Введите название отдела', 'warning');
        return;
    }

    try {
        await db.createDepartment({
            organization_id: currentOrgId,
            name: name,
            description: description || ''
        });
        await showToast('Отдел создан!', 'success');
        closeModal('departmentModal');
        document.getElementById('departmentForm').reset();
        loadDepartments();
    } catch (error) {
        debugLog('❌ Ошибка создания отдела:', error);
        await showAlert('Ошибка: ' + error.message, 'error');
    }
});

async function deleteDepartment(deptId) {
    debugLog(`🗑️ Удаление отдела ${deptId}`);
    const confirmed = await showConfirm('Вы уверены, что хотите удалить этот отдел?', 'Подтверждение');
    if (!confirmed) return;

    try {
        await db.deleteDepartment(deptId);
        await showToast('Отдел удален', 'success');
        loadDepartments();
    } catch (error) {
        debugLog('❌ Ошибка удаления отдела:', error);
        await showAlert('Ошибка: ' + error.message, 'error');
    }
}

// ===== НАСТРОЙКИ =====
async function loadSettings() {
    debugLog('⚙️ Загрузка настроек...');
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Настройки';
    document.getElementById('pageSubtitle').textContent = 'Управление настройками организации';

    container.innerHTML = `
        <div class="card">
            <h3 class="card-title mb-2">Настройки организации</h3>
            <form id="settingsForm">
                <div class="form-group">
                    <label class="form-label">Название организации</label>
                    <input type="text" class="form-control" id="settingsName" value="${currentOrg?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Описание</label>
                    <textarea class="form-control" id="settingsDesc" rows="3">${currentOrg?.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Код вступления</label>
                    <div style="display:flex;gap:0.5rem;">
                        <input type="text" class="form-control" id="settingsCode" value="${currentOrg?.join_code || ''}" style="font-family:monospace;font-size:1.2rem;letter-spacing:2px;" readonly>
                        ${currentOrg.leader_id === currentUser?.id ? `
                            <button type="button" class="btn btn-outline" onclick="regenerateCode()">
                                <i class="fas fa-sync"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                ${currentOrg.leader_id === currentUser?.id ? `
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Сохранить настройки
                    </button>
                    <button type="button" class="btn btn-danger" onclick="deleteOrganization()" style="margin-left:0.5rem;">
                        <i class="fas fa-trash"></i> Удалить организацию
                    </button>
                ` : ''}
            </form>
        </div>
    `;
    debugLog('✅ Настройки загружены');

    document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        debugLog('📝 Сохранение настроек');

        const name = document.getElementById('settingsName').value.trim();
        const description = document.getElementById('settingsDesc').value.trim();

        if (!name) {
            await showAlert('Название обязательно', 'warning');
            return;
        }

        try {
            await db.updateOrganization(currentOrgId, { name, description });
            await showToast('Настройки сохранены!', 'success');
            currentOrg = await db.getOrganization(currentOrgId);
            document.getElementById('orgName').textContent = currentOrg.name;
        } catch (error) {
            debugLog('❌ Ошибка сохранения настроек:', error);
            await showAlert('Ошибка: ' + error.message, 'error');
        }
    });
}

async function regenerateCode() {
    debugLog('🔄 Генерация нового кода');
    const confirmed = await showConfirm('Вы уверены, что хотите изменить код вступления?', 'Подтверждение');
    if (!confirmed) return;

    try {
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await db.updateOrganization(currentOrgId, { join_code: newCode });
        await showToast('Код обновлен!', 'success');
        currentOrg = await db.getOrganization(currentOrgId);
        document.getElementById('settingsCode').value = currentOrg.join_code;
        document.getElementById('joinCode').textContent = currentOrg.join_code;
    } catch (error) {
        debugLog('❌ Ошибка генерации кода:', error);
        await showAlert('Ошибка: ' + error.message, 'error');
    }
}

async function deleteOrganization() {
    debugLog('🗑️ Удаление организации');
    const confirmed = await showConfirm('Вы уверены, что хотите удалить организацию? Это действие необратимо!', '⚠️ Внимание');
    if (!confirmed) return;

    try {
        await db.deleteOrganization(currentOrgId);
        await showToast('Организация удалена', 'success');
        window.location.href = '/dashboard';
    } catch (error) {
        debugLog('❌ Ошибка удаления организации:', error);
        await showAlert('Ошибка: ' + error.message, 'error');
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function closeModal(id) {
    debugLog(`❌ Закрытие модалки ${id}`);
    document.getElementById(id).classList.remove('active');
}

function selectColor(el) {
    document.querySelectorAll('.color-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('rankColor').value = el.style.backgroundColor;
}

// ===== ЗАКРЫТИЕ МОДАЛОК ПО КЛИКУ ВНЕ =====
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

// ===== ИНИЦИАЛИЗАЦИЯ =====
init();
console.log('✅ Organization dashboard loaded');
