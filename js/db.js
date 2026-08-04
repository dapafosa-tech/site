// ============================================
// ORGSPACE - РАБОТА С БАЗОЙ ДАННЫХ
// ============================================

// Конфигурация Supabase
const SUPABASE_URL = 'https://iazzgxacdwhaxujoxtaz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhenpneGFjZHdoYXh1am94dGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTY3MDIsImV4cCI6MjEwMTM3MjcwMn0.quXjQ6575ACSjxnfa-hKkD6u3KMYE_5ZLdtqS4JKXI0';

// ===== БАЗОВЫЕ ФУНКЦИИ ЗАПРОСОВ =====

/**
 * Выполняет запрос к Supabase
 */
async function supabaseQuery(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Supabase query error:', error);
        throw error;
    }
}

// ===== ОРГАНИЗАЦИИ =====

/**
 * Создает новую организацию
 */
async function createOrganization(data) {
    return supabaseQuery('organizations', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * Получает все организации пользователя
 */
async function getUserOrganizations(userId) {
    return supabaseQuery(`organizations?created_by=eq.${userId}`);
}

/**
 * Получает организацию по ID
 */
async function getOrganization(id) {
    const result = await supabaseQuery(`organizations?id=eq.${id}`);
    return result[0] || null;
}

/**
 * Обновляет организацию
 */
async function updateOrganization(id, data) {
    return supabaseQuery(`organizations?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

/**
 * Удаляет организацию
 */
async function deleteOrganization(id) {
    return supabaseQuery(`organizations?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== ПОЛЬЗОВАТЕЛИ =====

/**
 * Создает профиль пользователя
 */
async function createUserProfile(data) {
    return supabaseQuery('users', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * Получает профиль пользователя по auth_id
 */
async function getUserProfile(authId) {
    const result = await supabaseQuery(`users?auth_id=eq.${authId}`);
    return result[0] || null;
}

/**
 * Обновляет профиль пользователя
 */
async function updateUserProfile(id, data) {
    return supabaseQuery(`users?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

// ===== СОТРУДНИКИ =====

/**
 * Создает сотрудника
 */
async function createEmployee(data) {
    return supabaseQuery('employees', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * Получает сотрудников организации
 */
async function getOrganizationEmployees(orgId) {
    return supabaseQuery(`employees?organization_id=eq.${orgId}`);
}

/**
 * Обновляет сотрудника
 */
async function updateEmployee(id, data) {
    return supabaseQuery(`employees?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

/**
 * Удаляет сотрудника
 */
async function deleteEmployee(id) {
    return supabaseQuery(`employees?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== ОТДЕЛЫ =====

/**
 * Создает отдел
 */
async function createDepartment(data) {
    return supabaseQuery('departments', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * Получает отделы организации
 */
async function getOrganizationDepartments(orgId) {
    return supabaseQuery(`departments?organization_id=eq.${orgId}`);
}

/**
 * Обновляет отдел
 */
async function updateDepartment(id, data) {
    return supabaseQuery(`departments?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

/**
 * Удаляет отдел
 */
async function deleteDepartment(id) {
    return supabaseQuery(`departments?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== ДОКУМЕНТЫ =====

/**
 * Создает документ
 */
async function createDocument(data) {
    return supabaseQuery('documents', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * Получает документы организации
 */
async function getOrganizationDocuments(orgId) {
    return supabaseQuery(`documents?organization_id=eq.${orgId}`);
}

/**
 * Обновляет документ
 */
async function updateDocument(id, data) {
    return supabaseQuery(`documents?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

/**
 * Удаляет документ
 */
async function deleteDocument(id) {
    return supabaseQuery(`documents?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== ТОВАРЫ (для магазинов) =====

/**
 * Создает товар
 */
async function createProduct(data) {
    return supabaseQuery('products', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * Получает товары организации
 */
async function getOrganizationProducts(orgId) {
    return supabaseQuery(`products?organization_id=eq.${orgId}`);
}

/**
 * Обновляет товар
 */
async function updateProduct(id, data) {
    return supabaseQuery(`products?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

/**
 * Удаляет товар
 */
async function deleteProduct(id) {
    return supabaseQuery(`products?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== ЗАЯВЛЕНИЯ =====

/**
 * Создает заявление
 */
async function createApplication(data) {
    return supabaseQuery('applications', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * Получает заявления организации
 */
async function getOrganizationApplications(orgId) {
    return supabaseQuery(`applications?organization_id=eq.${orgId}`);
}

/**
 * Обновляет заявление
 */
async function updateApplication(id, data) {
    return supabaseQuery(`applications?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

// ===== АУДИТ =====

/**
 * Логирует действие пользователя
 */
async function logActivity(data) {
    return supabaseQuery('activity_logs', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * Получает логи организации
 */
async function getOrganizationLogs(orgId, limit = 50) {
    return supabaseQuery(`activity_logs?organization_id=eq.${orgId}&order=created_at.desc&limit=${limit}`);
}

// ===== КНИГИ (для библиотек) =====

/**
 * Создает книгу
 */
async function createBook(data) {
    return supabaseQuery('books', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * Получает книги организации
 */
async function getOrganizationBooks(orgId) {
    return supabaseQuery(`books?organization_id=eq.${orgId}`);
}

/**
 * Обновляет книгу
 */
async function updateBook(id, data) {
    return supabaseQuery(`books?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

/**
 * Удаляет книгу
 */
async function deleteBook(id) {
    return supabaseQuery(`books?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// Экспортируем для использования
window.db = {
    // Organizations
    createOrganization,
    getUserOrganizations,
    getOrganization,
    updateOrganization,
    deleteOrganization,
    
    // Users
    createUserProfile,
    getUserProfile,
    updateUserProfile,
    
    // Employees
    createEmployee,
    getOrganizationEmployees,
    updateEmployee,
    deleteEmployee,
    
    // Departments
    createDepartment,
    getOrganizationDepartments,
    updateDepartment,
    deleteDepartment,
    
    // Documents
    createDocument,
    getOrganizationDocuments,
    updateDocument,
    deleteDocument,
    
    // Products
    createProduct,
    getOrganizationProducts,
    updateProduct,
    deleteProduct,
    
    // Books
    createBook,
    getOrganizationBooks,
    updateBook,
    deleteBook,
    
    // Applications
    createApplication,
    getOrganizationApplications,
    updateApplication,
    
    // Logs
    logActivity,
    getOrganizationLogs
};

console.log('✅ Database module loaded');