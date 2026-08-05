// ============================================
// TYPEBIZ - ДАШБОРД ОРГАНІЗАЦІЇ
// ============================================

let currentOrgId = null;
let currentOrg = null;

const typeLabels = {
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

const statusLabels = {
    'pending': '⏳ Очікує',
    'approved': '✅ Схвалено',
    'rejected': '❌ Відхилено'
};

const vacationStatusLabels = {
    'pending': '⏳ Очікує',
    'approved': '✅ Схвалено',
    'rejected': '❌ Відхилено',
    'cancelled': '🚫 Скасовано'
};

const vacationTypeLabels = {
    'annual': 'Щорічна',
    'sick': 'Лікарняний',
    'unpaid': 'Без збереження',
    'maternity': 'Декретна',
    'other': 'Інша'
};

function debugLog(message, data = null) {
    console.log(`[ORG] ${message}`, data || '');
}

async function init() {
    const isAuth = await auth.requireAuth();
    if (!isAuth) return;
    await loadOrganization();
}

function getOrgIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function loadOrganization() {
    const orgId = getOrgIdFromUrl();
    if (!orgId) {
        window.location.href = '/dashboard';
        return;
    }

    currentOrgId = orgId;
    
    try {
        currentOrg = await db.getOrganization(orgId);
    } catch (error) {
        debugLog('❌ Помилка завантаження:', error);
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

    loadSection('overview');
}

function loadSection(section) {
    document.querySelectorAll('.nav-menu a').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-menu a').forEach(el => {
        const onclick = el.getAttribute('onclick') || '';
        if (onclick.includes(section)) {
            el.classList.add('active');
        }
    });

    switch (section) {
        case 'overview': loadOverview(); break;
        case 'members': loadMembers(); break;
        case 'requests': loadRequests(); break;
        case 'ranks': loadRanks(); break;
        case 'departments': loadDepartments(); break;
        case 'chat': loadChat(); break;
        case 'vacations': loadVacations(); break;
        case 'settings': loadSettings(); break;
        default: loadOverview();
    }
}

// ===== ОГЛЯД =====
async function loadOverview() {
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Огляд';
    document.getElementById('pageSubtitle').textContent = `Управління організацією "${currentOrg?.name}"`;

    try {
        const members = await db.getOrganizationMembers(currentOrgId);
        const ranks = await db.getOrganizationRanks(currentOrgId);
        const requests = await db.getJoinRequests(currentOrgId);

        container.innerHTML = `
            <div class="grid-4">
                <div class="stat-card">
                    <div class="stat-value">${members?.length || 0}</div>
                    <div class="stat-label">Учасників</div>
                </div>
                <div class="stat-card" style="border-color: var(--teal);">
                    <div class="stat-value">${ranks?.length || 0}</div>
                    <div class="stat-label">Посад</div>
                </div>
                <div class="stat-card" style="border-color: #F59E0B;">
                    <div class="stat-value">${requests?.filter(r => r.status === 'pending').length || 0}</div>
                    <div class="stat-label">Очікують заявки</div>
                </div>
                <div class="stat-card" style="border-color: var(--muted);">
                    <div class="stat-value" style="font-family:'IBM Plex Mono',monospace;font-size:1.5rem;letter-spacing:3px;text-transform:lowercase;">${currentOrg.join_code || '---'}</div>
                    <div class="stat-label">Код вступу</div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Інформація про організацію</h3>
                </div>
                <div class="grid-2">
                    <div>
                        <p><strong>Назва:</strong> ${currentOrg?.name}</p>
                        <p><strong>Тип:</strong> ${typeLabels[currentOrg?.type] || currentOrg?.type}</p>
                        <p><strong>Опис:</strong> ${currentOrg?.description || 'Немає опису'}</p>
                    </div>
                    <div>
                        <p><strong>Код вступу:</strong> <span style="font-family:'IBM Plex Mono',monospace;font-size:1.2rem;letter-spacing:2px;background:var(--ink);padding:0.2rem 0.8rem;border-radius:var(--radius-sm);color:var(--gold);text-transform:lowercase;">${currentOrg?.join_code || '---'}</span></p>
                        <p><strong>Створено:</strong> ${new Date(currentOrg?.created_at).toLocaleDateString('uk-UA')}</p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        debugLog('❌ Помилка:', error);
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

// ===== УЧАСНИКИ =====
async function loadMembers() {
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Учасники';
    document.getElementById('pageSubtitle').textContent = 'Управління учасниками організації';

    try {
        const members = await db.getOrganizationMembers(currentOrgId);
        const ranks = await db.getOrganizationRanks(currentOrgId);
        const user = auth.getCurrentUser();
        const userRank = ranks?.find(r => r.id === members?.find(m => m.user_id === user.id)?.rank_id);
        const canManage = userRank?.permissions?.manage_members || userRank?.permissions?.all || currentOrg.leader_id === user.id;

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Список учасників (${members?.length || 0})</h3>
                </div>
                <div style="overflow-x:auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Користувач</th>
                                <th>Посада</th>
                                <th>Дата вступу</th>
                                <th>Дії</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (members && members.length > 0) {
            for (const member of members) {
                try {
                    const userData = await db.supabaseQuery(`users?id=eq.${member.user_id}`);
                    const userName = userData && userData.length > 0 ? (userData[0].full_name || userData[0].email) : 'Невідомо';
                    const rank = ranks?.find(r => r.id === member.rank_id);
                    const isLeader = currentOrg.leader_id === member.user_id;

                    html += `
                        <tr>
                            <td><strong>${userName} ${isLeader ? '👑' : ''}</strong></td>
                            <td>${rank ? `<span style="color:${rank.color}">${rank.name}</span>` : 'Без посади'}</td>
                            <td>${new Date(member.joined_at).toLocaleDateString('uk-UA')}</td>
                            <td>
                                ${!isLeader && canManage ? `
                                    <button class="btn btn-sm btn-teal" onclick="openAssignRank('${member.id}', '${userName}')">
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
                    debugLog('❌ Помилка завантаження користувача:', e);
                }
            }
        } else {
            html += `<tr><td colspan="4" class="text-center text-muted">Немає учасників</td></tr>`;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    } catch (error) {
        debugLog('❌ Помилка:', error);
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

// ===== ЗАЯВКИ =====
async function loadRequests() {
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Заявки на вступ';
    document.getElementById('pageSubtitle').textContent = 'Управління заявками';

    try {
        const requests = await db.getJoinRequests(currentOrgId);
        const user = auth.getCurrentUser();
        const ranks = await db.getOrganizationRanks(currentOrgId);
        const userRank = ranks?.find(r => r.id === (await db.getOrganizationMembers(currentOrgId))?.find(m => m.user_id === user.id)?.rank_id);
        const canManage = userRank?.permissions?.manage_requests || userRank?.permissions?.all || currentOrg.leader_id === user.id;

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Заявки (${requests?.length || 0})</h3>
                </div>
                <div style="overflow-x:auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Користувач</th>
                                <th>Повідомлення</th>
                                <th>Статус</th>
                                <th>Дата</th>
                                <th>Дії</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (requests && requests.length > 0) {
            for (const req of requests) {
                try {
                    const userData = await db.supabaseQuery(`users?id=eq.${req.user_id}`);
                    const userName = userData && userData.length > 0 ? (userData[0].full_name || userData[0].email) : 'Невідомо';

                    const isPending = req.status === 'pending';
                    const statusClass = req.status === 'pending' ? 'badge-warning' : 
                                       req.status === 'approved' ? 'badge-success' : 'badge-danger';

                    html += `
                        <tr>
                            <td><strong>${userName}</strong></td>
                            <td>${req.message || 'Без повідомлення'}</td>
                            <td><span class="badge ${statusClass}">${statusLabels[req.status] || req.status}</span></td>
                            <td>${new Date(req.created_at).toLocaleDateString('uk-UA')}</td>
                            <td>
                                ${isPending && canManage ? `
                                    <button class="btn btn-sm btn-teal" onclick="handleRequest('${req.id}', 'approved')">
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
                    debugLog('❌ Помилка завантаження користувача:', e);
                }
            }
        } else {
            html += `<tr><td colspan="5" class="text-center text-muted">Немає заявок</td></tr>`;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    } catch (error) {
        debugLog('❌ Помилка:', error);
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

// ===== ОБРОБКА ЗАЯВКИ =====
async function handleRequest(requestId, status) {
    try {
        await db.updateJoinRequest(requestId, status);

        if (status === 'approved') {
            const request = await db.supabaseQuery(`join_requests?id=eq.${requestId}`);
            if (request && request.length > 0) {
                await db.addMemberToOrganization(request[0].organization_id, request[0].user_id);
                
                // Сповіщення
                await db.createNotification({
                    user_id: request[0].user_id,
                    organization_id: request[0].organization_id,
                    type: 'join_approved',
                    title: 'Заявку схвалено',
                    message: `Вашу заявку на вступ до "${currentOrg.name}" схвалено!`,
                    link: `/org?id=${currentOrgId}`
                });
                
                await showToast('Заявку схвалено! Користувача додано.', 'success');
            }
        } else {
            const request = await db.supabaseQuery(`join_requests?id=eq.${requestId}`);
            if (request && request.length > 0) {
                await db.createNotification({
                    user_id: request[0].user_id,
                    organization_id: request[0].organization_id,
                    type: 'join_rejected',
                    title: 'Заявку відхилено',
                    message: `Вашу заявку на вступ до "${currentOrg.name}" відхилено.`,
                    link: `/org?id=${currentOrgId}`
                });
            }
            await showToast('Заявку відхилено.', 'warning');
        }

        loadRequests();
        loadOverview();
    } catch (error) {
        debugLog('❌ Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ===== ВИДАЛЕННЯ УЧАСНИКА =====
async function removeMember(memberId) {
    const confirmed = await showConfirm('Ви впевнені, що хочете видалити цього учасника?', 'Підтвердження');
    if (!confirmed) return;

    try {
        const member = await db.supabaseQuery(`org_members?id=eq.${memberId}`);
        if (member && member.length > 0) {
            await db.createNotification({
                user_id: member[0].user_id,
                organization_id: member[0].organization_id,
                type: 'removed',
                title: 'Вас видалено з організації',
                message: `Вас видалено з організації "${currentOrg.name}".`,
                link: `/dashboard`
            });
        }
        await db.removeMemberFromOrganization(memberId);
        await showToast('Учасника видалено', 'success');
        loadMembers();
        loadOverview();
    } catch (error) {
        debugLog('❌ Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ===== ПОСАДИ (З ПРАВАМИ) =====
async function loadRanks() {
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Посади';
    document.getElementById('pageSubtitle').textContent = 'Управління посадами в організації';

    try {
        const ranks = await db.getOrganizationRanks(currentOrgId);
        const user = auth.getCurrentUser();
        const userRank = ranks?.find(r => r.id === (await db.getOrganizationMembers(currentOrgId))?.find(m => m.user_id === user.id)?.rank_id);
        const canManage = userRank?.permissions?.manage_ranks || userRank?.permissions?.all || currentOrg.leader_id === user.id;

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Посади (${ranks?.length || 0})</h3>
                    ${canManage ? `
                        <button class="btn btn-gold btn-sm" onclick="openCreateRank()">
                            <i class="fas fa-plus"></i> Створити посаду
                        </button>
                    ` : ''}
                </div>
                <div style="overflow-x:auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Назва</th>
                                <th>Колір</th>
                                <th>Права</th>
                                <th>Дії</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (ranks && ranks.length > 0) {
            for (const rank of ranks) {
                const isDefault = ['Директор', 'Адміністратор', 'Менеджер', 'Старший учасник', 'Учасник'].includes(rank.name);
                const permLabels = [];
                if (rank.permissions?.all) permLabels.push('🔑 Всі');
                if (rank.permissions?.manage_members) permLabels.push('👥 Учасники');
                if (rank.permissions?.manage_ranks) permLabels.push('👑 Посади');
                if (rank.permissions?.manage_departments) permLabels.push('🏢 Відділи');
                if (rank.permissions?.manage_settings) permLabels.push('⚙️ Налаштування');
                if (rank.permissions?.manage_requests) permLabels.push('📩 Заявки');
                if (rank.permissions?.manage_vacations) permLabels.push('🏖️ Відпустки');
                if (rank.permissions?.manage_chat) permLabels.push('💬 Чат');
                if (rank.permissions?.view) permLabels.push('👀 Перегляд');

                html += `
                    <tr>
                        <td><strong>${rank.name}</strong></td>
                        <td><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:${rank.color};"></span> ${rank.color}</td>
                        <td style="font-size:0.75rem;">${permLabels.join(', ') || '—'}</td>
                        <td>
                            ${canManage && !isDefault ? `
                                <button class="btn btn-sm btn-teal" onclick="openEditRank('${rank.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteRank('${rank.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                            ${canManage && isDefault && rank.name === 'Директор' ? `
                                <button class="btn btn-sm btn-teal" onclick="openEditRank('${rank.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            }
        } else {
            html += `<tr><td colspan="4" class="text-center text-muted">Немає посад</td></tr>`;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    } catch (error) {
        debugLog('❌ Помилка:', error);
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

// ===== СТВОРЕННЯ/РЕДАГУВАННЯ ПОСАДИ =====
async function openCreateRank() {
    document.getElementById('rankModalTitle').textContent = 'Створити посаду';
    document.getElementById('rankSubmitText').textContent = 'Створити';
    document.getElementById('rankEditId').value = '';
    document.getElementById('rankName').value = '';
    document.getElementById('rankColor').value = '#F2A93B';
    document.querySelectorAll('.rank-permission').forEach(cb => cb.checked = false);
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
    document.querySelector('.color-option')?.classList.add('selected');
    document.getElementById('rankModal').classList.add('active');
}

async function openEditRank(rankId) {
    try {
        const ranks = await db.getOrganizationRanks(currentOrgId);
        const rank = ranks.find(r => r.id === rankId);
        if (!rank) return;

        document.getElementById('rankModalTitle').textContent = 'Редагувати посаду';
        document.getElementById('rankSubmitText').textContent = 'Зберегти';
        document.getElementById('rankEditId').value = rank.id;
        document.getElementById('rankName').value = rank.name;
        document.getElementById('rankColor').value = rank.color;
        
        const permissions = rank.permissions || {};
        document.querySelectorAll('.rank-permission').forEach(cb => {
            cb.checked = permissions[cb.value] === true;
        });
        
        document.querySelectorAll('.color-option').forEach(el => {
            el.classList.toggle('selected', el.style.backgroundColor === rank.color);
        });
        
        document.getElementById('rankModal').classList.add('active');
    } catch (error) {
        debugLog('❌ Помилка:', error);
        await showAlert('Помилка завантаження посади', 'error');
    }
}

document.getElementById('rankForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const editId = document.getElementById('rankEditId').value;
    const name = document.getElementById('rankName').value.trim();
    const color = document.getElementById('rankColor').value;

    const permissions = {};
    document.querySelectorAll('.rank-permission:checked').forEach(cb => {
        permissions[cb.value] = true;
    });

    if (!name) {
        await showAlert('Введіть назву посади', 'warning');
        return;
    }

    try {
        if (editId) {
            await db.updateRank(editId, { name, color, permissions });
            await showToast('Посаду оновлено!', 'success');
        } else {
            await db.createRank(currentOrgId, { name, color, permissions });
            await showToast('Посаду створено!', 'success');
        }

        closeModal('rankModal');
        loadRanks();
    } catch (error) {
        debugLog('❌ Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

// ===== ВИДАЛЕННЯ ПОСАДИ =====
async function deleteRank(rankId) {
    const confirmed = await showConfirm('Ви впевнені, що хочете видалити цю посаду?', 'Підтвердження');
    if (!confirmed) return;

    try {
        await db.deleteRank(rankId);
        await showToast('Посаду видалено', 'success');
        loadRanks();
    } catch (error) {
        debugLog('❌ Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ===== ПРИЗНАЧЕННЯ ПОСАДИ =====
async function openAssignRank(memberId, userName) {
    document.getElementById('assignMemberId').value = memberId;
    document.getElementById('assignUserName').value = userName;

    try {
        const ranks = await db.getOrganizationRanks(currentOrgId);
        const select = document.getElementById('assignRankSelect');
        select.innerHTML = '<option value="">Оберіть посаду...</option>';

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
        debugLog('❌ Помилка:', error);
        await showAlert('Помилка завантаження посад', 'error');
    }
}

document.getElementById('assignRankForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const memberId = document.getElementById('assignMemberId').value;
    const rankId = document.getElementById('assignRankSelect').value;

    if (!rankId) {
        await showAlert('Оберіть посаду', 'warning');
        return;
    }

    try {
        await db.updateMemberRank(memberId, rankId);
        
        // Сповіщення
        const member = await db.supabaseQuery(`org_members?id=eq.${memberId}`);
        if (member && member.length > 0) {
            const rank = await db.getOrganizationRanks(currentOrgId);
            const rankName = rank.find(r => r.id === rankId)?.name || 'посаду';
            await db.createNotification({
                user_id: member[0].user_id,
                organization_id: currentOrgId,
                type: 'rank_changed',
                title: 'Посаду змінено',
                message: `Вам призначено посаду "${rankName}" в "${currentOrg.name}".`,
                link: `/org?id=${currentOrgId}`
            });
        }
        
        await showToast('Посаду призначено!', 'success');
        closeModal('assignRankModal');
        loadMembers();
    } catch (error) {
        debugLog('❌ Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

// ===== ВІДДІЛИ =====
async function loadDepartments() {
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Відділи';
    document.getElementById('pageSubtitle').textContent = 'Управління відділами організації';

    try {
        const depts = await db.getOrganizationDepartments(currentOrgId);
        const user = auth.getCurrentUser();
        const ranks = await db.getOrganizationRanks(currentOrgId);
        const userRank = ranks?.find(r => r.id === (await db.getOrganizationMembers(currentOrgId))?.find(m => m.user_id === user.id)?.rank_id);
        const canManage = userRank?.permissions?.manage_departments || userRank?.permissions?.all || currentOrg.leader_id === user.id;

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Відділи (${depts?.length || 0})</h3>
                    ${canManage ? `
                        <button class="btn btn-gold btn-sm" onclick="openCreateDepartment()">
                            <i class="fas fa-plus"></i> Створити відділ
                        </button>
                    ` : ''}
                </div>
                <div style="overflow-x:auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Назва</th>
                                <th>Опис</th>
                                <th>Співробітники</th>
                                <th>Дії</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (depts && depts.length > 0) {
            for (const dept of depts) {
                const employees = await db.getEmployeesByDepartment(dept.id);
                const employeeNames = employees && employees.length > 0
                    ? employees.map(e => [e.first_name, e.last_name].filter(Boolean).join(' ')).join(', ')
                    : 'Немає співробітників';

                html += `
                    <tr>
                        <td><strong>${dept.name}</strong></td>
                        <td>${dept.description || '—'}</td>
                        <td><small>${employeeNames}</small></td>
                        <td>
                            ${canManage ? `
                                <button class="btn btn-sm btn-teal" onclick="openAssignEmployee('${dept.id}', '${dept.name}')">
                                    <i class="fas fa-user-plus"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteDepartment('${dept.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : '—'}
                        </td>
                    </tr>
                `;
            }
        } else {
            html += `<tr><td colspan="4" class="text-center text-muted">Немає відділів</td></tr>`;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    } catch (error) {
        debugLog('❌ Помилка:', error);
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

function openCreateDepartment() {
    document.getElementById('departmentModal').classList.add('active');
}

document.getElementById('departmentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('deptName').value.trim();
    const description = document.getElementById('deptDesc').value.trim();

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
        debugLog('❌ Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

// ===== ПРИЗНАЧЕННЯ У ВІДДІЛ =====
async function openAssignEmployee(departmentId, departmentName) {
    document.getElementById('assignDeptId').value = departmentId;
    document.getElementById('assignDeptName').value = departmentName;

    const employees = await db.getOrganizationEmployees(currentOrgId);
    const select = document.getElementById('assignEmployeeSelect');
    select.innerHTML = '<option value="">Оберіть співробітника...</option>';

    if (employees && employees.length > 0) {
        const deptEmployees = await db.getEmployeesByDepartment(departmentId);
        const deptEmployeeIds = deptEmployees.map(e => e.id);

        employees.forEach(emp => {
            if (!deptEmployeeIds.includes(emp.id)) {
                const option = document.createElement('option');
                option.value = emp.id;
                const fullName = [emp.first_name, emp.last_name, emp.middle_name].filter(Boolean).join(' ');
                option.textContent = fullName || 'Без імені';
                select.appendChild(option);
            }
        });
    }

    if (select.options.length <= 1) {
        select.innerHTML = '<option value="">Немає доступних співробітників</option>';
    }

    document.getElementById('assignEmployeeModal').classList.add('active');
}

document.getElementById('assignEmployeeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const departmentId = document.getElementById('assignDeptId').value;
    const employeeId = document.getElementById('assignEmployeeSelect').value;

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
        debugLog('❌ Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

async function deleteDepartment(deptId) {
    const confirmed = await showConfirm('Ви впевнені, що хочете видалити цей відділ?', 'Підтвердження');
    if (!confirmed) return;

    try {
        await db.deleteDepartment(deptId);
        await showToast('Відділ видалено', 'success');
        loadDepartments();
    } catch (error) {
        debugLog('❌ Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ===== ЧАТ =====
async function loadChat() {
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Чат';
    document.getElementById('pageSubtitle').textContent = 'Спілкування в організації';

    try {
        const messages = await db.getChatMessages(currentOrgId);
        const user = auth.getCurrentUser();
        const members = await db.getOrganizationMembers(currentOrgId);
        const ranks = await db.getOrganizationRanks(currentOrgId);
        const userRank = ranks?.find(r => r.id === members?.find(m => m.user_id === user.id)?.rank_id);
        const canManage = userRank?.permissions?.manage_chat || userRank?.permissions?.all || currentOrg.leader_id === user.id;

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Чат організації</h3>
                    <small style="color:var(--muted);font-size:0.7rem;">Використовуйте @ для згадування</small>
                </div>
                <div id="chatMessages" style="max-height:400px;overflow-y:auto;margin-bottom:1rem;padding:0.5rem;">
        `;

        if (messages && messages.length > 0) {
            for (const msg of messages.reverse()) {
                const userData = await db.supabaseQuery(`users?id=eq.${msg.user_id}`);
                const userName = userData && userData.length > 0 
                    ? (userData[0].full_name || userData[0].email || 'Невідомо') 
                    : 'Невідомо';
                const isOwn = msg.user_id === user?.id;
                const hasMention = msg.mentions?.includes(user?.id);

                html += `
                    <div style="display:flex;justify-content:${isOwn ? 'flex-end' : 'flex-start'};margin-bottom:0.5rem;">
                        <div style="max-width:70%;background:${isOwn ? 'var(--gold)' : 'var(--ink)'};color:${isOwn ? 'var(--ink)' : 'var(--text-onink)'};padding:0.5rem 1rem;border-radius:12px;border-bottom-${isOwn ? 'right' : 'left'}-radius:4px;border:${isOwn ? 'none' : '1px solid var(--ink-line)'};${hasMention && !isOwn ? 'border-left:3px solid var(--teal);' : ''}">
                            <div style="font-size:0.7rem;opacity:0.7;margin-bottom:0.2rem;">
                                ${userName} · ${new Date(msg.created_at).toLocaleTimeString('uk-UA')}
                                ${hasMention ? ' <span style="color:var(--teal);">@згадування</span>' : ''}
                            </div>
                            <div>${msg.message}</div>
                            ${isOwn || canManage ? `
                                <button class="btn btn-sm btn-danger" onclick="deleteChatMessage('${msg.id}')" style="margin-top:0.25rem;padding:0.1rem 0.5rem;font-size:0.6rem;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
        } else {
            html += `<div class="text-center text-muted">Немає повідомлень. Напишіть першим!</div>`;
        }

        html += `
                </div>
                <form id="chatForm" style="display:flex;gap:0.5rem;">
                    <input type="text" class="form-control" id="chatInput" placeholder="Введіть повідомлення... (використовуйте @ для згадування)" required>
                    <button type="submit" class="btn btn-gold">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        `;

        container.innerHTML = html;

        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        document.getElementById('chatForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('chatInput');
            const message = input.value.trim();

            if (!message) return;

            // Знаходимо згадування (@username)
            const mentionRegex = /@(\S+)/g;
            const mentions = [];
            let match;
            const allMembers = await db.getOrganizationMembers(currentOrgId);
            
            while ((match = mentionRegex.exec(message)) !== null) {
                const username = match[1];
                for (const member of allMembers) {
                    const userData = await db.supabaseQuery(`users?id=eq.${member.user_id}`);
                    if (userData && userData.length > 0 && 
                        (userData[0].full_name?.toLowerCase().includes(username.toLowerCase()) || 
                         userData[0].email?.toLowerCase().includes(username.toLowerCase()))) {
                        mentions.push(member.user_id);
                        // Сповіщення про згадування
                        await db.createNotification({
                            user_id: member.user_id,
                            organization_id: currentOrgId,
                            type: 'chat_mention',
                            title: 'Вас згадали в чаті',
                            message: `${user.full_name || 'Хтось'} згадав вас у чаті: "${message}"`,
                            link: `/org?id=${currentOrgId}`
                        });
                        break;
                    }
                }
            }

            try {
                await db.sendChatMessage(currentOrgId, auth.getCurrentUser().id, message, mentions);
                input.value = '';
                await loadChat();
            } catch (error) {
                await showAlert('Помилка відправки: ' + error.message, 'error');
            }
        });

    } catch (error) {
        console.error('Load chat error:', error);
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження чату</div>';
    }
}

async function deleteChatMessage(messageId) {
    const confirmed = await showConfirm('Видалити повідомлення?', 'Підтвердження');
    if (!confirmed) return;

    try {
        await db.deleteChatMessage(messageId);
        await showToast('Повідомлення видалено', 'success');
        await loadChat();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ===== ВІДПУСТКИ =====
async function loadVacations() {
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Відпустки';
    document.getElementById('pageSubtitle').textContent = 'Управління відпустками співробітників';

    try {
        const vacations = await db.getVacations(currentOrgId);
        const user = auth.getCurrentUser();
        const members = await db.getOrganizationMembers(currentOrgId);
        const ranks = await db.getOrganizationRanks(currentOrgId);
        const userRank = ranks?.find(r => r.id === members?.find(m => m.user_id === user.id)?.rank_id);
        const canManage = userRank?.permissions?.manage_vacations || userRank?.permissions?.all || currentOrg.leader_id === user.id;

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Відпустки (${vacations?.length || 0})</h3>
                    <button class="btn btn-gold btn-sm" onclick="openCreateVacation()">
                        <i class="fas fa-plus"></i> Створити заявку
                    </button>
                </div>
                <div style="overflow-x:auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Співробітник</th>
                                <th>Період</th>
                                <th>Тип</th>
                                <th>Статус</th>
                                <th>Дії</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (vacations && vacations.length > 0) {
            for (const vac of vacations) {
                const userData = await db.supabaseQuery(`users?id=eq.${vac.user_id}`);
                const userName = userData && userData.length > 0 
                    ? (userData[0].full_name || userData[0].email || 'Невідомо') 
                    : 'Невідомо';

                const isPending = vac.status === 'pending';
                const statusClass = vac.status === 'pending' ? 'badge-warning' : 
                                   vac.status === 'approved' ? 'badge-success' : 
                                   vac.status === 'rejected' ? 'badge-danger' : 'badge-secondary';

                html += `
                    <tr>
                        <td><strong>${userName}</strong></td>
                        <td>${new Date(vac.start_date).toLocaleDateString('uk-UA')} - ${new Date(vac.end_date).toLocaleDateString('uk-UA')}</td>
                        <td>${vacationTypeLabels[vac.type] || vac.type}</td>
                        <td><span class="badge ${statusClass}">${vacationStatusLabels[vac.status] || vac.status}</span></td>
                        <td>
                            ${isPending && canManage ? `
                                <button class="btn btn-sm btn-teal" onclick="approveVacation('${vac.id}')">
                                    <i class="fas fa-check"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="rejectVacation('${vac.id}')">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                            ${vac.user_id === user?.id && vac.status === 'pending' ? `
                                <button class="btn btn-sm btn-danger" onclick="cancelVacation('${vac.id}')">
                                    <i class="fas fa-ban"></i>
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            }
        } else {
            html += `<tr><td colspan="5" class="text-center text-muted">Немає заявок на відпустку</td></tr>`;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    } catch (error) {
        console.error('Load vacations error:', error);
        container.innerHTML = '<div class="alert alert-danger">Помилка завантаження даних</div>';
    }
}

// ===== СТВОРЕННЯ ЗАЯВКИ НА ВІДПУСТКУ =====
function openCreateVacation() {
    document.getElementById('vacationModal').classList.add('active');
}

document.getElementById('vacationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const startDate = document.getElementById('vacStart').value;
    const endDate = document.getElementById('vacEnd').value;
    const type = document.getElementById('vacType').value;
    const reason = document.getElementById('vacReason').value.trim();

    if (!startDate || !endDate) {
        await showAlert('Оберіть дати', 'warning');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        await showAlert('Дата початку не може бути пізнішою за дату закінчення', 'warning');
        return;
    }

    try {
        await db.createVacation({
            organization_id: currentOrgId,
            user_id: auth.getCurrentUser().id,
            start_date: startDate,
            end_date: endDate,
            type: type,
            reason: reason || '',
            status: 'pending'
        });

        // Сповіщення для керівника
        const leader = await db.supabaseQuery(`users?id=eq.${currentOrg.leader_id}`);
        if (leader && leader.length > 0) {
            await db.createNotification({
                user_id: currentOrg.leader_id,
                organization_id: currentOrgId,
                type: 'vacation_request',
                title: 'Нова заявка на відпустку',
                message: `${auth.getCurrentUser().full_name || 'Користувач'} подав заявку на відпустку.`,
                link: `/org?id=${currentOrgId}`
            });
        }

        await showToast('Заявку на відпустку відправлено!', 'success');
        closeModal('vacationModal');
        document.getElementById('vacationForm').reset();
        loadVacations();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
});

// ===== ОБРОБКА ЗАЯВОК НА ВІДПУСТКУ =====
async function approveVacation(vacationId) {
    const confirmed = await showConfirm('Схвалити заявку на відпустку?', 'Підтвердження');
    if (!confirmed) return;

    try {
        const vacation = await db.supabaseQuery(`org_vacations?id=eq.${vacationId}`);
        await db.updateVacationStatus(vacationId, 'approved', auth.getCurrentUser().id);
        
        if (vacation && vacation.length > 0) {
            await db.createNotification({
                user_id: vacation[0].user_id,
                organization_id: currentOrgId,
                type: 'vacation_approved',
                title: 'Заявку на відпустку схвалено',
                message: `Вашу заявку на відпустку (${new Date(vacation[0].start_date).toLocaleDateString('uk-UA')} - ${new Date(vacation[0].end_date).toLocaleDateString('uk-UA')}) схвалено!`,
                link: `/org?id=${currentOrgId}`
            });
        }
        
        await showToast('Заявку схвалено!', 'success');
        loadVacations();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function rejectVacation(vacationId) {
    const confirmed = await showConfirm('Відхилити заявку на відпустку?', 'Підтвердження');
    if (!confirmed) return;

    try {
        const vacation = await db.supabaseQuery(`org_vacations?id=eq.${vacationId}`);
        await db.updateVacationStatus(vacationId, 'rejected', auth.getCurrentUser().id);
        
        if (vacation && vacation.length > 0) {
            await db.createNotification({
                user_id: vacation[0].user_id,
                organization_id: currentOrgId,
                type: 'vacation_rejected',
                title: 'Заявку на відпустку відхилено',
                message: `Вашу заявку на відпустку відхилено.`,
                link: `/org?id=${currentOrgId}`
            });
        }
        
        await showToast('Заявку відхилено', 'warning');
        loadVacations();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function cancelVacation(vacationId) {
    const confirmed = await showConfirm('Скасувати заявку на відпустку?', 'Підтвердження');
    if (!confirmed) return;

    try {
        await db.updateVacationStatus(vacationId, 'cancelled');
        await showToast('Заявку скасовано', 'success');
        loadVacations();
    } catch (error) {
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

// ===== НАЛАШТУВАННЯ =====
async function loadSettings() {
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Налаштування';
    document.getElementById('pageSubtitle').textContent = 'Управління налаштуваннями організації';

    container.innerHTML = `
        <div class="card">
            <h3 class="card-title mb-2">Налаштування організації</h3>
            <form id="settingsForm">
                <div class="form-group">
                    <label class="form-label">Назва організації</label>
                    <input type="text" class="form-control" id="settingsName" value="${currentOrg?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Опис</label>
                    <textarea class="form-control" id="settingsDesc" rows="3" placeholder="Короткий опис організації">${currentOrg?.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Код вступу</label>
                    <div style="display:flex;gap:0.5rem;align-items:center;">
                        <input type="text" class="form-control" id="settingsCode" value="${currentOrg?.join_code || ''}" style="font-family:'IBM Plex Mono',monospace;font-size:1.2rem;letter-spacing:2px;text-transform:lowercase;" readonly>
                        ${currentOrg.leader_id === auth.getCurrentUser()?.id ? `
                            <button type="button" class="btn btn-teal" onclick="regenerateCode()" title="Згенерувати новий код">
                                <i class="fas fa-sync"></i>
                            </button>
                        ` : ''}
                    </div>
                    <small style="color:var(--muted);">Код формату: abcd-abcd-abcd-abcd (латиниця, малі літери)</small>
                </div>
                <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:1rem;">
                    ${currentOrg.leader_id === auth.getCurrentUser()?.id ? `
                        <button type="submit" class="btn btn-gold">
                            <i class="fas fa-save"></i> Зберегти налаштування
                        </button>
                        <button type="button" class="btn btn-danger" onclick="deleteOrganization()">
                            <i class="fas fa-trash"></i> Видалити організацію
                        </button>
                    ` : `
                        <button type="submit" class="btn btn-gold">
                            <i class="fas fa-save"></i> Зберегти налаштування
                        </button>
                    `}
                </div>
            </form>
        </div>
    `;

    document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('settingsName').value.trim();
        const description = document.getElementById('settingsDesc').value.trim();

        if (!name) {
            await showAlert('Назва обов\'язкова', 'warning');
            return;
        }

        try {
            await db.updateOrganization(currentOrgId, { name, description });
            await showToast('Налаштування збережено!', 'success');
            currentOrg = await db.getOrganization(currentOrgId);
            document.getElementById('orgName').textContent = currentOrg.name;
        } catch (error) {
            debugLog('❌ Помилка:', error);
            await showAlert('Помилка: ' + error.message, 'error');
        }
    });
}

async function regenerateCode() {
    const confirmed = await showConfirm('Ви впевнені, що хочете змінити код вступу?', 'Підтвердження');
    if (!confirmed) return;

    try {
        const newCode = generateJoinCode();
        await db.updateOrganization(currentOrgId, { join_code: newCode });
        await showToast('Код оновлено!', 'success');
        currentOrg = await db.getOrganization(currentOrgId);
        document.getElementById('settingsCode').value = currentOrg.join_code;
        document.getElementById('joinCode').textContent = currentOrg.join_code;
    } catch (error) {
        debugLog('❌ Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

async function deleteOrganization() {
    const confirmed = await showConfirm('Ви впевнені, що хочете видалити організацію? Це незворотна дія!', '⚠️ Увага');
    if (!confirmed) return;

    try {
        await db.deleteOrganization(currentOrgId);
        await showToast('Організацію видалено', 'success');
        window.location.href = '/dashboard';
    } catch (error) {
        debugLog('❌ Помилка:', error);
        await showAlert('Помилка: ' + error.message, 'error');
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function selectColor(el) {
    document.querySelectorAll('.color-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('rankColor').value = el.style.backgroundColor;
}

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

init();
console.log('✅ Organization dashboard loaded');
