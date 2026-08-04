// ============================================
// TYPEBIZ - РАБОТА С БАЗОЙ ДАННЫХ
// ============================================

const SUPABASE_URL = 'https://iazzgxacdwhaxujoxtaz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhenpneGFjZHdoYXh1am94dGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTY3MDIsImV4cCI6MjEwMTM3MjcwMn0.quXjQ6575ACSjxnfa-hKkD6u3KMYE_5ZLdtqS4JKXI0';

function getCurrentUser() {
    try {
        const userData = localStorage.getItem('userData');
        if (userData) {
            return JSON.parse(userData);
        }
        return null;
    } catch {
        return null;
    }
}

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

        // Если статус 204 (No Content) или 201 (Created) без тела
        if (response.status === 204) {
            return [];
        }

        // Если статус не OK
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        // Пытаемся прочитать ответ
        const text = await response.text();
        
        // Если ответ пустой
        if (!text || text.trim() === '') {
            return [];
        }

        // Парсим JSON
        try {
            return JSON.parse(text);
        } catch (parseError) {
            // Если не JSON, но похоже на массив
            if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
                try {
                    return eval('(' + text + ')');
                } catch {
                    return [];
                }
            }
            return [];
        }

    } catch (error) {
        console.error('Supabase query error:', error);
        throw error;
    }
}

// ===== ОРГАНИЗАЦИИ =====
async function createOrganization(data) {
    const user = getCurrentUser();
    if (!user) throw new Error('Не авторизован');
    
    const orgData = {
        name: data.name,
        type: data.type,
        description: data.description || '',
        created_by: user.id,
        is_active: true,
        settings: data.settings || {},
        created_at: new Date().toISOString()
    };

    return supabaseQuery('organizations', {
        method: 'POST',
        body: JSON.stringify(orgData),
        headers: {
            'Prefer': 'return=representation'  // 👈 ЭТО ГЛАВНОЕ!
        }
    });
}

async function getUserOrganizations() {
    const user = getCurrentUser();
    if (!user) throw new Error('Не авторизован');
    
    try {
        const result = await supabaseQuery(`organizations?created_by=eq.${user.id}`);
        return result || [];
    } catch (error) {
        console.error('Load orgs error:', error);
        return [];
    }
}

async function getOrganization(id) {
    const result = await supabaseQuery(`organizations?id=eq.${id}`);
    return result[0] || null;
}

async function updateOrganization(id, data) {
    return supabaseQuery(`organizations?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteOrganization(id) {
    return supabaseQuery(`organizations?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== ПОЛЬЗОВАТЕЛИ =====
async function updateUser(id, data) {
    return supabaseQuery(`users?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

// ===== СОТРУДНИКИ =====
async function createEmployee(data) {
    return supabaseQuery('employees', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

async function getOrganizationEmployees(orgId) {
    return supabaseQuery(`employees?organization_id=eq.${orgId}`);
}

async function deleteEmployee(id) {
    return supabaseQuery(`employees?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== ОТДЕЛЫ =====
async function createDepartment(data) {
    return supabaseQuery('departments', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

async function getOrganizationDepartments(orgId) {
    return supabaseQuery(`departments?organization_id=eq.${orgId}`);
}

async function deleteDepartment(id) {
    return supabaseQuery(`departments?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== ДОКУМЕНТЫ =====
async function createDocument(data) {
    return supabaseQuery('documents', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

async function getOrganizationDocuments(orgId) {
    return supabaseQuery(`documents?organization_id=eq.${orgId}`);
}

async function deleteDocument(id) {
    return supabaseQuery(`documents?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== ТОВАРЫ =====
async function createProduct(data) {
    return supabaseQuery('products', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

async function getOrganizationProducts(orgId) {
    return supabaseQuery(`products?organization_id=eq.${orgId}`);
}

async function deleteProduct(id) {
    return supabaseQuery(`products?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== КНИГИ =====
async function createBook(data) {
    return supabaseQuery('books', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

async function getOrganizationBooks(orgId) {
    return supabaseQuery(`books?organization_id=eq.${orgId}`);
}

async function deleteBook(id) {
    return supabaseQuery(`books?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ===== ЗАЯВЛЕНИЯ =====
async function createApplication(data) {
    return supabaseQuery('applications', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

async function getOrganizationApplications(orgId) {
    return supabaseQuery(`applications?organization_id=eq.${orgId}`);
}

async function updateApplication(id, data) {
    return supabaseQuery(`applications?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

// ===== ЛОГИ =====
async function logActivity(data) {
    return supabaseQuery('activity_logs', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Prefer': 'return=representation'
        }
    });
}

// ===== ЭКСПОРТ =====
window.db = {
    supabaseQuery,
    createOrganization,
    getUserOrganizations,
    getOrganization,
    updateOrganization,
    deleteOrganization,
    updateUser,
    createEmployee,
    getOrganizationEmployees,
    deleteEmployee,
    createDepartment,
    getOrganizationDepartments,
    deleteDepartment,
    createDocument,
    getOrganizationDocuments,
    deleteDocument,
    createProduct,
    getOrganizationProducts,
    deleteProduct,
    createBook,
    getOrganizationBooks,
    deleteBook,
    createApplication,
    getOrganizationApplications,
    updateApplication,
    logActivity
};

console.log('✅ DB module loaded');
