// ============================================
// ORGSPACE - РАБОТА С БАЗОЙ ДАННЫХ
// ============================================

const SUPABASE_URL = 'https://iazzgxacdwhaxujoxtaz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhenpneGFjZHdoYXh1am94dGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTY3MDIsImV4cCI6MjEwMTM3MjcwMn0.quXjQ6575ACSjxnfa-hKkD6u3KMYE_5ZLdtqS4JKXI0';

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

// Organizations
async function createOrganization(data) {
    return supabaseQuery('organizations', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function getUserOrganizations(userId) {
    return supabaseQuery(`organizations?created_by=eq.${userId}`);
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

// Users
async function createUserProfile(data) {
    return supabaseQuery('users', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function getUserProfile(authId) {
    const result = await supabaseQuery(`users?auth_id=eq.${authId}`);
    return result[0] || null;
}

async function updateUserProfile(id, data) {
    return supabaseQuery(`users?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

// Employees
async function createEmployee(data) {
    return supabaseQuery('employees', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function getOrganizationEmployees(orgId) {
    return supabaseQuery(`employees?organization_id=eq.${orgId}`);
}

async function updateEmployee(id, data) {
    return supabaseQuery(`employees?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteEmployee(id) {
    return supabaseQuery(`employees?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// Departments
async function createDepartment(data) {
    return supabaseQuery('departments', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function getOrganizationDepartments(orgId) {
    return supabaseQuery(`departments?organization_id=eq.${orgId}`);
}

async function updateDepartment(id, data) {
    return supabaseQuery(`departments?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteDepartment(id) {
    return supabaseQuery(`departments?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// Documents
async function createDocument(data) {
    return supabaseQuery('documents', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function getOrganizationDocuments(orgId) {
    return supabaseQuery(`documents?organization_id=eq.${orgId}`);
}

async function updateDocument(id, data) {
    return supabaseQuery(`documents?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteDocument(id) {
    return supabaseQuery(`documents?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// Products
async function createProduct(data) {
    return supabaseQuery('products', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function getOrganizationProducts(orgId) {
    return supabaseQuery(`products?organization_id=eq.${orgId}`);
}

async function updateProduct(id, data) {
    return supabaseQuery(`products?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteProduct(id) {
    return supabaseQuery(`products?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// Books
async function createBook(data) {
    return supabaseQuery('books', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function getOrganizationBooks(orgId) {
    return supabaseQuery(`books?organization_id=eq.${orgId}`);
}

async function updateBook(id, data) {
    return supabaseQuery(`books?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteBook(id) {
    return supabaseQuery(`books?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// Applications
async function createApplication(data) {
    return supabaseQuery('applications', {
        method: 'POST',
        body: JSON.stringify(data)
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

// Logs
async function logActivity(data) {
    return supabaseQuery('activity_logs', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function getOrganizationLogs(orgId, limit = 50) {
    return supabaseQuery(`activity_logs?organization_id=eq.${orgId}&order=created_at.desc&limit=${limit}`);
}

window.db = {
    createOrganization,
    getUserOrganizations,
    getOrganization,
    updateOrganization,
    deleteOrganization,
    createUserProfile,
    getUserProfile,
    updateUserProfile,
    createEmployee,
    getOrganizationEmployees,
    updateEmployee,
    deleteEmployee,
    createDepartment,
    getOrganizationDepartments,
    updateDepartment,
    deleteDepartment,
    createDocument,
    getOrganizationDocuments,
    updateDocument,
    deleteDocument,
    createProduct,
    getOrganizationProducts,
    updateProduct,
    deleteProduct,
    createBook,
    getOrganizationBooks,
    updateBook,
    deleteBook,
    createApplication,
    getOrganizationApplications,
    updateApplication,
    logActivity,
    getOrganizationLogs,
    supabaseQuery
};

console.log('✅ DB module loaded');
