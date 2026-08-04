// ============================================
// ORGSPACE - ДАШБОРД ОРГАНИЗАЦИИ
// ============================================

let currentOrgId = null;
let currentOrg = null;

// ===== ИНИЦИАЛИЗАЦИЯ =====

/**
 * Получает ID организации из URL
 */
function getOrgIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

/**
 * Загружает информацию об организации
 */
async function loadOrganization() {
    const orgId = getOrgIdFromUrl();
    if (!orgId) {
        window.location.href = '/dashboard.html';
        return;
    }

    currentOrgId = orgId;
    currentOrg = await db.getOrganization(orgId);

    if (!currentOrg) {
        alert('Организация не найдена');
        window.location.href = '/dashboard.html';
        return;
    }

    // Обновляем информацию в сайдбаре
    document.getElementById('orgName').textContent = currentOrg.name;
    
    const typeLabels = {
        'shop': 'Магазин',
        'library': 'Библиотека',
        'company': 'Компания',
        'school': 'Школа',
        'clinic': 'Клиника',
        'other': 'Другое'
    };
    document.getElementById('orgType').textContent = typeLabels[currentOrg.type] || currentOrg.type;

    // Показываем специфичные разделы
    if (currentOrg.type === 'shop') {
        document.getElementById('productsNav').style.display = 'block';
    }
    if (currentOrg.type === 'library') {
        document.getElementById('booksNav').style.display = 'block';
    }

    // Загружаем раздел по умолчанию
    loadSection('overview');
}

// ===== ЗАГРУЗКА РАЗДЕЛОВ =====

/**
 * Загружает выбранный раздел
 */
function loadSection(section) {
    // Обновляем активный пункт меню
    document.querySelectorAll('.nav-menu a').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-menu a').forEach(el => {
        if (el.textContent.trim().toLowerCase() === section || 
            el.getAttribute('onclick')?.includes(section)) {
            el.classList.add('active');
        }
    });

    // Загружаем контент
    switch(section) {
        case 'overview':
            loadOverview();
            break;
        case 'employees':
            loadEmployees();
            break;
        case 'departments':
            loadDepartments();
            break;
        case 'documents':
            loadDocuments();
            break;
        case 'products':
            loadProducts();
            break;
        case 'books':
            loadBooks();
            break;
        case 'applications':
            loadApplications();
            break;
        case 'settings':
            loadSettings();
            break;
        default:
            loadOverview();
    }
}

// ===== ОБЗОР =====

/**
 * Загружает обзорную страницу
 */
async function loadOverview() {
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Обзор';
    document.getElementById('pageSubtitle').textContent = `Управление организацией "${currentOrg?.name}"`;

    try {
        const employees = await db.getOrganizationEmployees(currentOrgId);
        const departments = await db.getOrganizationDepartments(currentOrgId);
        const documents = await db.getOrganizationDocuments(currentOrgId);

        container.innerHTML = `
            <div class="grid-4">
                <div class="stat-card">
                    <div class="stat-value">${employees?.length || 0}</div>
                    <div class="stat-label">Сотрудников</div>
                </div>
                <div class="stat-card" style="border-color: var(--success);">
                    <div class="stat-value">${departments?.length || 0}</div>
                    <div class="stat-label">Отделов</div>
                </div>
                <div class="stat-card" style="border-color: var(--warning);">
                    <div class="stat-value">${documents?.length || 0}</div>
                    <div class="stat-label">Документов</div>
                </div>
                <div class="stat-card" style="border-color: var(--secondary);">
                    <div class="stat-value">0</div>
                    <div class="stat-label">Активностей</div>
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
                        <p><strong>Статус:</strong> <span class="badge ${currentOrg?.is_active ? 'badge-success' : 'badge-danger'}">${currentOrg?.is_active ? 'Активна' : 'Неактивна'}</span></p>
                        <p><strong>Создана:</strong> ${new Date(currentOrg?.created_at).toLocaleDateString('ru-RU')}</p>
                        <p><strong>ID:</strong> <span style="font-size: 0.8rem; color: var(--gray-500);">${currentOrgId}</span></p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Load overview error:', error);
        container.innerHTML = '<div class="alert alert-danger">Ошибка загрузки данных</div>';
    }
}

// ===== СОТРУДНИКИ =====

/**
 * Загружает список сотрудников
 */
async function loadEmployees() {
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Сотрудники';
    document.getElementById('pageSubtitle').textContent = 'Управление персоналом';

    try {
        const employees = await db.getOrganizationEmployees(currentOrgId);

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Список сотрудников</h3>
                    <button class="btn btn-primary btn-sm" onclick="openAddEmployee()">
                        <i class="fas fa-plus"></i> Добавить
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Имя</th>
                                <th>Должность</th>
                                <th>Email</th>
                                <th>Телефон</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (employees && employees.length > 0) {
            employees.forEach(emp => {
                const fullName = [emp.first_name, emp.last_name, emp.middle_name].filter(Boolean).join(' ');
                html += `
                    <tr>
                        <td><strong>${fullName}</strong></td>
                        <td>${emp.position || '-'}</td>
                        <td>${emp.email || '-'}</td>
                        <td>${emp.phone || '-'}</td>
                        <td><span class="badge ${emp.status === 'active' ? 'badge-success' : 'badge-danger'}">${emp.status === 'active' ? 'Активен' : 'Неактивен'}</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline" onclick="editEmployee('${emp.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${emp.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            html += `<tr><td colspan="6" class="text-center text-muted">Нет сотрудников</td></tr>`;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    } catch (error) {
        console.error('Load employees error:', error);
        container.innerHTML = '<div class="alert alert-danger">Ошибка загрузки данных</div>';
    }
}

// ===== ОТДЕЛЫ =====

/**
 * Загружает список отделов
 */
async function loadDepartments() {
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Отделы';
    document.getElementById('pageSubtitle').textContent = 'Структура организации';

    try {
        const departments = await db.getOrganizationDepartments(currentOrgId);

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Список отделов</h3>
                    <button class="btn btn-primary btn-sm" onclick="openAddDepartment()">
                        <i class="fas fa-plus"></i> Добавить
                    </button>
                </div>
                <div style="overflow-x: auto;">
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

        if (departments && departments.length > 0) {
            departments.forEach(dept => {
                html += `
                    <tr>
                        <td><strong>${dept.name}</strong></td>
                        <td>${dept.description || '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline" onclick="editDepartment('${dept.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteDepartment('${dept.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
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
    } catch (error) {
        console.error('Load departments error:', error);
        container.innerHTML = '<div class="alert alert-danger">Ошибка загрузки данных</div>';
    }
}

// ===== ДОКУМЕНТЫ =====

/**
 * Загружает список документов
 */
async function loadDocuments() {
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Документы';
    document.getElementById('pageSubtitle').textContent = 'Управление документами';

    try {
        const documents = await db.getOrganizationDocuments(currentOrgId);

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Список документов</h3>
                    <button class="btn btn-primary btn-sm" onclick="openAddDocument()">
                        <i class="fas fa-plus"></i> Добавить
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Название</th>
                                <th>Тип</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (documents && documents.length > 0) {
            documents.forEach(doc => {
                html += `
                    <tr>
                        <td><strong>${doc.title}</strong></td>
                        <td>${doc.type || 'Без типа'}</td>
                        <td><span class="badge ${doc.status === 'active' ? 'badge-success' : 'badge-warning'}">${doc.status || 'draft'}</span></td>
                        <td>
                            ${doc.file_url ? `<a href="${doc.file_url}" target="_blank" class="btn btn-sm btn-outline"><i class="fas fa-download"></i></a>` : ''}
                            <button class="btn btn-sm btn-outline" onclick="editDocument('${doc.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteDocument('${doc.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            html += `<tr><td colspan="4" class="text-center text-muted">Нет документов</td></tr>`;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    } catch (error) {
        console.error('Load documents error:', error);
        container.innerHTML = '<div class="alert alert-danger">Ошибка загрузки данных</div>';
    }
}

// ===== ТОВАРЫ (для магазинов) =====

/**
 * Загружает список товаров
 */
async function loadProducts() {
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Товары';
    document.getElementById('pageSubtitle').textContent = 'Управление товарами';

    try {
        const products = await db.getOrganizationProducts(currentOrgId);

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Список товаров</h3>
                    <button class="btn btn-primary btn-sm" onclick="openAddProduct()">
                        <i class="fas fa-plus"></i> Добавить
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Название</th>
                                <th>Артикул</th>
                                <th>Цена</th>
                                <th>Количество</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (products && products.length > 0) {
            products.forEach(product => {
                html += `
                    <tr>
                        <td><strong>${product.name}</strong></td>
                        <td>${product.sku || '-'}</td>
                        <td>${product.price ? product.price + ' ₽' : '-'}</td>
                        <td>${product.quantity || 0}</td>
                        <td><span class="badge ${product.status === 'active' ? 'badge-success' : 'badge-warning'}">${product.status || 'active'}</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline" onclick="editProduct('${product.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            html += `<tr><td colspan="6" class="text-center text-muted">Нет товаров</td></tr>`;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    } catch (error) {
        console.error('Load products error:', error);
        container.innerHTML = '<div class="alert alert-danger">Ошибка загрузки данных</div>';
    }
}

// ===== КНИГИ (для библиотек) =====

/**
 * Загружает список книг
 */
async function loadBooks() {
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Книги';
    document.getElementById('pageSubtitle').textContent = 'Библиотечный каталог';

    try {
        const books = await db.getOrganizationBooks(currentOrgId);

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Библиотечный каталог</h3>
                    <button class="btn btn-primary btn-sm" onclick="openAddBook()">
                        <i class="fas fa-plus"></i> Добавить
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Название</th>
                                <th>Автор</th>
                                <th>ISBN</th>
                                <th>Всего</th>
                                <th>Доступно</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (books && books.length > 0) {
            books.forEach(book => {
                html += `
                    <tr>
                        <td><strong>${book.title}</strong></td>
                        <td>${book.author || '-'}</td>
                        <td>${book.isbn || '-'}</td>
                        <td>${book.quantity || 0}</td>
                        <td>${book.available || 0}</td>
                        <td>
                            <button class="btn btn-sm btn-outline" onclick="editBook('${book.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteBook('${book.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            html += `<tr><td colspan="6" class="text-center text-muted">Нет книг</td></tr>`;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    } catch (error) {
        console.error('Load books error:', error);
        container.innerHTML = '<div class="alert alert-danger">Ошибка загрузки данных</div>';
    }
}

// ===== ЗАЯВЛЕНИЯ =====

/**
 * Загружает список заявлений
 */
async function loadApplications() {
    const container = document.getElementById('sectionContent');
    document.getElementById('pageTitle').textContent = 'Заявления';
    document.getElementById('pageSubtitle').textContent = 'Внутренние обращения';

    try {
        const applications = await db.getOrganizationApplications(currentOrgId);

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Список заявлений</h3>
                    <button class="btn btn-primary btn-sm" onclick="openAddApplication()">
                        <i class="fas fa-plus"></i> Создать
                    </button>
                </div>
                <div style="overflow-x: auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Заголовок</th>
                                <th>Тип</th>
                                <th>Статус</th>
                                <th>Дата</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (applications && applications.length > 0) {
            const statusLabels = {
                'new': 'Новое',
                'in_progress': 'В работе',
                'approved': 'Одобрено',
                'rejected': 'Отклонено',
                'closed': 'Закрыто'
            };
            const statusColors = {
                'new': 'badge-primary',
                'in_progress': 'badge-warning',
                'approved': 'badge-success',
                'rejected': 'badge-danger',
                'closed': 'badge-secondary'
            };

            applications.forEach(app => {
                html += `
                    <tr>
                        <td><strong>${app.title}</strong></td>
                        <td>${app.type || 'Другое'}</td>
                        <td><span class="badge ${statusColors[app.status] || 'badge-primary'}">${statusLabels[app.status] || app.status}</span></td>
                        <td style="font-size: 0.85rem;">${new Date(app.created_at).toLocaleDateString('ru-RU')}</td>
                        <td>
                            <button class="btn btn-sm btn-outline" onclick="editApplication('${app.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteApplication('${app.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            html += `<tr><td colspan="5" class="text-center text-muted">Нет заявлений</td></tr>`;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    } catch (error) {
        console.error('Load applications error:', error);
        container.innerHTML = '<div class="alert alert-danger">Ошибка загрузки данных</div>';
    }
}

// ===== НАСТРОЙКИ =====

/**
 * Загружает настройки организации
 */
async function loadSettings() {
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
                    <label class="form-label">Статус</label>
                    <select class="form-control" id="settingsStatus">
                        <option value="true" ${currentOrg?.is_active ? 'selected' : ''}>Активна</option>
                        <option value="false" ${!currentOrg?.is_active ? 'selected' : ''}>Неактивна</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> Сохранить настройки
                </button>
                <button type="button" class="btn btn-danger" onclick="deleteOrgConfirm()" style="margin-left: 0.5rem;">
                    <i class="fas fa-trash"></i> Удалить организацию
                </button>
            </form>
        </div>
    `;

    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('settingsName').value.trim();
        const description = document.getElementById('settingsDesc').value.trim();
        const is_active = document.getElementById('settingsStatus').value === 'true';

        if (!name) {
            alert('Название обязательно');
            return;
        }

        try {
            await db.updateOrganization(currentOrgId, {
                name,
                description,
                is_active
            });
            
            // Логируем
            await db.logActivity({
                organization_id: currentOrgId,
                user_id: auth.getCurrentUser()?.id,
                action: 'update',
                entity_type: 'organization',
                entity_id: currentOrgId,
                changes: { name, description, is_active }
            });

            alert('Настройки сохранены!');
            currentOrg = await db.getOrganization(currentOrgId);
            document.getElementById('orgName').textContent = currentOrg.name;
        } catch (error) {
            console.error('Update settings error:', error);
            alert('Ошибка: ' + error.message);
        }
    });
}

// ===== ДЕЙСТВИЯ С СОТРУДНИКАМИ =====

/**
 * Открывает форму добавления сотрудника
 */
function openAddEmployee() {
    const name = prompt('Введите имя сотрудника:');
    if (!name) return;
    
    const position = prompt('Введите должность:') || '';
    const email = prompt('Введите email:') || '';
    const phone = prompt('Введите телефон:') || '';

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    db.createEmployee({
        organization_id: currentOrgId,
        first_name: firstName,
        last_name: lastName,
        position: position,
        email: email,
        phone: phone,
        status: 'active'
    }).then(() => {
        alert('Сотрудник добавлен!');
        loadEmployees();
    }).catch(error => {
        alert('Ошибка: ' + error.message);
    });
}

/**
 * Удаляет сотрудника
 */
async function deleteEmployee(id) {
    if (!confirm('Вы уверены?')) return;
    try {
        await db.deleteEmployee(id);
        alert('Сотрудник удален!');
        loadEmployees();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// ===== ДЕЙСТВИЯ С ОТДЕЛАМИ =====

/**
 * Открывает форму добавления отдела
 */
function openAddDepartment() {
    const name = prompt('Введите название отдела:');
    if (!name) return;
    
    const description = prompt('Введите описание:') || '';

    db.createDepartment({
        organization_id: currentOrgId,
        name: name,
        description: description
    }).then(() => {
        alert('Отдел создан!');
        loadDepartments();
    }).catch(error => {
        alert('Ошибка: ' + error.message);
    });
}

/**
 * Удаляет отдел
 */
async function deleteDepartment(id) {
    if (!confirm('Вы уверены?')) return;
    try {
        await db.deleteDepartment(id);
        alert('Отдел удален!');
        loadDepartments();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// ===== ДЕЙСТВИЯ С ДОКУМЕНТАМИ =====

/**
 * Открывает форму добавления документа
 */
function openAddDocument() {
    const title = prompt('Введите название документа:');
    if (!title) return;

    const type = prompt('Введите тип документа:') || 'other';

    db.createDocument({
        organization_id: currentOrgId,
        title: title,
        type: type,
        status: 'draft'
    }).then(() => {
        alert('Документ создан!');
        loadDocuments();
    }).catch(error => {
        alert('Ошибка: ' + error.message);
    });
}

/**
 * Удаляет документ
 */
async function deleteDocument(id) {
    if (!confirm('Вы уверены?')) return;
    try {
        await db.deleteDocument(id);
        alert('Документ удален!');
        loadDocuments();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// ===== ДЕЙСТВИЯ С ТОВАРАМИ =====

/**
 * Открывает форму добавления товара
 */
function openAddProduct() {
    const name = prompt('Введите название товара:');
    if (!name) return;

    const price = parseFloat(prompt('Введите цену:') || '0');
    const quantity = parseInt(prompt('Введите количество:') || '0');

    db.createProduct({
        organization_id: currentOrgId,
        name: name,
        price: price,
        quantity: quantity,
        status: 'active'
    }).then(() => {
        alert('Товар добавлен!');
        loadProducts();
    }).catch(error => {
        alert('Ошибка: ' + error.message);
    });
}

/**
 * Удаляет товар
 */
async function deleteProduct(id) {
    if (!confirm('Вы уверены?')) return;
    try {
        await db.deleteProduct(id);
        alert('Товар удален!');
        loadProducts();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// ===== ДЕЙСТВИЯ С КНИГАМИ =====

/**
 * Открывает форму добавления книги
 */
function openAddBook() {
    const title = prompt('Введите название книги:');
    if (!title) return;

    const author = prompt('Введите автора:') || '';
    const isbn = prompt('Введите ISBN:') || '';
    const quantity = parseInt(prompt('Введите количество:') || '1');

    db.createBook({
        organization_id: currentOrgId,
        title: title,
        author: author,
        isbn: isbn,
        quantity: quantity,
        available: quantity
    }).then(() => {
        alert('Книга добавлена!');
        loadBooks();
    }).catch(error => {
        alert('Ошибка: ' + error.message);
    });
}

/**
 * Удаляет книгу
 */
async function deleteBook(id) {
    if (!confirm('Вы уверены?')) return;
    try {
        await db.deleteBook(id);
        alert('Книга удалена!');
        loadBooks();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// ===== УДАЛЕНИЕ ОРГАНИЗАЦИИ =====

/**
 * Подтверждение удаления организации
 */
async function deleteOrgConfirm() {
    if (!confirm('Вы уверены, что хотите удалить организацию? Это действие необратимо!')) return;
    if (!confirm('Все данные будут потеряны. Продолжить?')) return;

    try {
        await db.deleteOrganization(currentOrgId);
        alert('Организация удалена!');
        window.location.href = '/dashboard.html';
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

/**
 * Словарь типов организаций (глобальный)
 */
const typeLabels = {
    'shop': 'Магазин',
    'library': 'Библиотека',
    'company': 'Компания',
    'school': 'Школа',
    'clinic': 'Клиника',
    'other': 'Другое'
};

// Запуск
(async function init() {
    const isAuth = await auth.requireAuth();
    if (!isAuth) return;

    await loadOrganization();

    // Обработка навигации для мобильных устройств
    console.log('✅ Organization dashboard loaded');
})();