// ============================================
// ORGSPACE - АДМИН-ПАНЕЛЬ
// ============================================

// ===== ПРОВЕРКА ПРАВ =====

/**
 * Проверяет, является ли пользователь администратором
 */
async function checkAdminAccess() {
    const isAuth = await auth.requireAuth();
    if (!isAuth) return false;

    if (!auth.isAdmin()) {
        alert('Доступ запрещен. Требуются права администратора.');
        window.location.href = '/dashboard.html';
        return false;
    }

    return true;
}

// ===== ЗАГРУЗКА СТАТИСТИКИ =====

/**
 * Загружает общую статистику
 */
async function loadStats() {
    try {
        // Получаем всех пользователей (через админский доступ)
        // В реальном проекте нужны специальные эндпоинты с RLS политиками
        const users = await db.supabaseQuery('users?select=*');
        const orgs = await db.supabaseQuery('organizations?select=*');
        const employees = await db.supabaseQuery('employees?select=*');
        const documents = await db.supabaseQuery('documents?select=*');

        document.getElementById('totalUsers').textContent = users?.length || 0;
        document.getElementById('totalOrgs').textContent = orgs?.length || 0;
        document.getElementById('totalEmployees').textContent = employees?.length || 0;
        document.getElementById('totalDocuments').textContent = documents?.length || 0;
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

// ===== ЗАГРУЗКА ЛОГОВ =====

/**
 * Загружает последние логи
 */
async function loadRecentLogs() {
    try {
        const logs = await db.supabaseQuery('activity_logs?order=created_at.desc&limit=20');
        const container = document.getElementById('recentLogs');

        if (!logs || logs.length === 0) {
            container.innerHTML = '<p class="text-muted">Логов пока нет</p>';
            return;
        }

        let html = '<div style="overflow-x: auto;"><table class="table"><thead><tr><th>Время</th><th>Действие</th><th>Тип</th><th>ID</th></tr></thead><tbody>';
        
        logs.forEach(log => {
            const date = new Date(log.created_at).toLocaleString('ru-RU');
            html += `
                <tr>
                    <td style="font-size: 0.85rem;">${date}</td>
                    <td><span class="badge badge-primary">${log.action}</span></td>
                    <td>${log.entity_type}</td>
                    <td style="font-size: 0.8rem; color: var(--gray-500);">${log.entity_id?.slice(0, 8) || '-'}</td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;
    } catch (error) {
        console.error('Load logs error:', error);
        document.getElementById('recentLogs').innerHTML = '<p class="text-danger">Ошибка загрузки логов</p>';
    }
}

// ===== ЗАГРУЗКА ПОЛЬЗОВАТЕЛЕЙ =====

/**
 * Загружает список всех пользователей
 */
async function loadUsersSection() {
    const container = document.getElementById('adminContent');
    
    try {
        const users = await db.supabaseQuery('users?select=*,organizations(name)');
        
        let html = `
            <div class="admin-section">
                <div class="section-header">
                    <h2>Все пользователи</h2>
                    <span class="badge badge-primary">${users?.length || 0}</span>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Имя</th>
                                <th>Email</th>
                                <th>Роль</th>
                                <th>Организация</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (users && users.length > 0) {
            users.forEach(user => {
                html += `
                    <tr>
                        <td><strong>${user.full_name || 'Без имени'}</strong></td>
                        <td>${user.email}</td>
                        <td><span class="badge ${user.role === 'admin' ? 'badge-danger' : 'badge-primary'}">${user.role || 'user'}</span></td>
                        <td>${user.organizations?.name || '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline" onclick="editUser('${user.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${user.role !== 'admin' ? `<button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')">
                                <i class="fas fa-trash"></i>
                            </button>` : ''}
                        </td>
                    </tr>
                `;
            });
        } else {
            html += `<tr><td colspan="5" class="text-center text-muted">Пользователей нет</td></tr>`;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    } catch (error) {
        console.error('Load users error:', error);
        container.innerHTML = '<div class="admin-section"><p class="text-danger">Ошибка загрузки пользователей</p></div>';
    }
}

// ===== ЗАГРУЗКА ОРГАНИЗАЦИЙ =====

/**
 * Загружает список всех организаций
 */
async function loadOrgsSection() {
    const container = document.getElementById('adminContent');
    
    try {
        const orgs = await db.supabaseQuery('organizations?select=*,users(full_name)');
        
        let html = `
            <div class="admin-section">
                <div class="section-header">
                    <h2>Все организации</h2>
                    <span class="badge badge-primary">${orgs?.length || 0}</span>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Название</th>
                                <th>Тип</th>
                                <th>Создатель</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (orgs && orgs.length > 0) {
            const typeLabels = {
                'shop': 'Магазин',
                'library': 'Библиотека',
                'company': 'Компания',
                'school': 'Школа',
                'clinic': 'Клиника',
                'other': 'Другое'
            };

            orgs.forEach(org => {
                html += `
                    <tr>
                        <td><strong>${org.name}</strong></td>
                        <td><span class="badge badge-primary">${typeLabels[org.type] || org.type}</span></td>
                        <td>${org.users?.full_name || '-'}</td>
                        <td><span class="badge ${org.is_active ? 'badge-success' : 'badge-danger'}">${org.is_active ? 'Активна' : 'Неактивна'}</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline" onclick="toggleOrgStatus('${org.id}', ${!org.is_active})">
                                <i class="fas ${org.is_active ? 'fa-pause' : 'fa-play'}"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteOrg('${org.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            html += `<tr><td colspan="5" class="text-center text-muted">Организаций нет</td></tr>`;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    } catch (error) {
        console.error('Load orgs error:', error);
        container.innerHTML = '<div class="admin-section"><p class="text-danger">Ошибка загрузки организаций</p></div>';
    }
}

// ===== ЗАГРУЗКА ЛОГОВ (админ) =====

/**
 * Загружает все логи системы
 */
async function loadLogsSection() {
    const container = document.getElementById('adminContent');
    
    try {
        const logs = await db.supabaseQuery('activity_logs?order=created_at.desc&limit=100');
        
        let html = `
            <div class="admin-section">
                <div class="section-header">
                    <h2>Все логи системы</h2>
                    <span class="badge badge-primary">${logs?.length || 0}</span>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Время</th>
                                <th>Пользователь</th>
                                <th>Действие</th>
                                <th>Тип</th>
                                <th>ID</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (logs && logs.length > 0) {
            logs.forEach(log => {
                const date = new Date(log.created_at).toLocaleString('ru-RU');
                html += `
                    <tr>
                        <td style="font-size: 0.85rem;">${date}</td>
                        <td>${log.user_id?.slice(0, 8) || '-'}</td>
                        <td><span class="badge badge-primary">${log.action}</span></td>
                        <td>${log.entity_type}</td>
                        <td style="font-size: 0.8rem; color: var(--gray-500);">${log.entity_id?.slice(0, 8) || '-'}</td>
                    </tr>
                `;
            });
        } else {
            html += `<tr><td colspan="5" class="text-center text-muted">Логов нет</td></tr>`;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    } catch (error) {
        console.error('Load logs error:', error);
        container.innerHTML = '<div class="admin-section"><p class="text-danger">Ошибка загрузки логов</p></div>';
    }
}

// ===== ЗАГРУЗКА РАЗДЕЛА =====

/**
 * Загружает выбранный раздел
 */
function loadSection(section) {
    switch(section) {
        case 'users':
            loadUsersSection();
            break;
        case 'orgs':
            loadOrgsSection();
            break;
        case 'logs':
            loadLogsSection();
            break;
        default:
            loadDefaultSection();
    }
}

/**
 * Загружает раздел по умолчанию (главный)
 */
async function loadDefaultSection() {
    const container = document.getElementById('adminContent');
    container.innerHTML = `
        <div class="admin-section">
            <div class="section-header">
                <h2>Последние действия</h2>
            </div>
            <div id="recentLogs">
                <p class="text-muted">Загрузка...</p>
            </div>
        </div>
    `;
    await loadRecentLogs();
}

// ===== ДЕЙСТВИЯ С ПОЛЬЗОВАТЕЛЯМИ =====

/**
 * Редактирует пользователя
 */
async function editUser(id) {
    const newRole = prompt('Введите роль (user/admin):', 'user');
    if (newRole === null) return;
    
    if (!['user', 'admin'].includes(newRole)) {
        alert('Роль должна быть user или admin');
        return;
    }

    try {
        await db.supabaseQuery(`users?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ role: newRole })
        });
        alert('Роль обновлена!');
        loadUsersSection();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

/**
 * Удаляет пользователя
 */
async function deleteUser(id) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    
    try {
        await db.supabaseQuery(`users?id=eq.${id}`, {
            method: 'DELETE'
        });
        alert('Пользователь удален!');
        loadUsersSection();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// ===== ДЕЙСТВИЯ С ОРГАНИЗАЦИЯМИ =====

/**
 * Переключает статус организации
 */
async function toggleOrgStatus(id, newStatus) {
    try {
        await db.supabaseQuery(`organizations?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ is_active: newStatus })
        });
        alert('Статус обновлен!');
        loadOrgsSection();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

/**
 * Удаляет организацию
 */
async function deleteOrg(id) {
    if (!confirm('Вы уверены, что хотите удалить эту организацию? Это действие необратимо!')) return;
    
    try {
        await db.supabaseQuery(`organizations?id=eq.${id}`, {
            method: 'DELETE'
        });
        alert('Организация удалена!');
        loadOrgsSection();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// ===== ЗАГРУЗКА ПРОФИЛЯ АДМИНА =====

/**
 * Загружает информацию об администраторе
 */
async function loadAdminInfo() {
    const user = auth.getCurrentUser();
    if (!user) return;

    const profile = user.profile || await db.getUserProfile(user.id);

    document.getElementById('userName').textContent = profile?.full_name || user.email;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userAvatar').textContent = (profile?.full_name || 'A')[0].toUpperCase();
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

// ===== ИНИЦИАЛИЗАЦИЯ =====

(async function init() {
    // Проверяем права администратора
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) return;

    // Загружаем данные
    await loadAdminInfo();
    await loadStats();
    await loadDefaultSection();

    console.log('✅ Admin panel loaded');
})();