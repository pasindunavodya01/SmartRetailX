const API_URLS = {
    USER: 'http://localhost:3001/api/v1',
    NOTIF: 'http://localhost:3002/api/v1',
    ORDER: 'http://localhost:3003/api/v1',
    PROD: 'http://localhost:3004/api/v1'
};

let currentUser = null;
let token = localStorage.getItem('jwt_token');

// Utility: API Fetch wrapper
async function apiCall(url, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
        const res = await fetch(url, config);
        const data = await res.json().catch(() => ({}));
        
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                // handle unauthorized
                if (url.includes('/auth/login') || url.includes('/auth/register')) {
                    throw new Error(data.error || 'Authentication failed');
                } else {
                    logout();
                    throw new Error('Session expired or unauthorized');
                }
            }
            throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
        }
        return data;
    } catch (err) {
        showToast(err.message, 'error');
        throw err;
    }
}

// Utility: Toasts
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        if(container.contains(toast)) container.removeChild(toast);
    }, 3300);
}

// Utility: Modals
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
window.closeModal = function(id) { document.getElementById(id).classList.add('hidden'); }

// Navigation
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active-view'));
    document.getElementById(`view-${viewId}`).classList.add('active-view');
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.nav-item[data-target="${viewId}"]`).classList.add('active');
    
    // update title
    const titles = { dashboard: 'Dashboard', products: 'Products', orders: 'Orders', notifications: 'Notifications', profile: 'Profile' };
    document.getElementById('page-title').innerText = titles[viewId];

    // Load data based on view
    if (viewId === 'dashboard') loadDashboard();
    if (viewId === 'products') loadProducts();
    if (viewId === 'orders') loadOrders();
    if (viewId === 'notifications') loadNotifications();
    if (viewId === 'profile') loadProfile();
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
    // Auth switching
    document.getElementById('show-register').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('login-form').style.display='none'; document.getElementById('register-form').style.display='block'; });
    document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('register-form').style.display='none'; document.getElementById('login-form').style.display='block'; });

    // Forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    document.getElementById('product-form').addEventListener('submit', handleProductSave);
    document.getElementById('order-form').addEventListener('submit', handleCreateOrder);
    document.getElementById('inventory-form').addEventListener('submit', handleAdjustInventory);

    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(item.dataset.target);
        });
    });
    
    // Buttons
    document.getElementById('btn-add-product').addEventListener('click', () => {
        document.getElementById('product-form').reset();
        document.getElementById('prod-id').value = '';
        document.getElementById('modal-product-title').innerText = 'Add Product';
        openModal('modal-product');
    });
    document.getElementById('btn-create-order').addEventListener('click', openOrderModal);
    document.getElementById('btn-read-all').addEventListener('click', markAllNotificationsRead);
    document.getElementById('btn-admin-dashboard').addEventListener('click', loadAdminMetrics);

    // Check auth
    if (token) {
        try {
            currentUser = await apiCall(`${API_URLS.USER}/users/me`);
            showApp();
        } catch (e) {
            logout();
        }
    }
});

function showApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('user-name-display').innerText = `${currentUser.firstName} ${currentUser.lastName}`;
    
    // Apply admin rules
    if (currentUser.role === 'ADMIN') {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
        document.getElementById('admin-panel').classList.remove('hidden');
    } else {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
        document.getElementById('admin-panel').classList.add('hidden');
    }
    
    switchView('dashboard');
}

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('jwt_token');
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('app-section').classList.add('hidden');
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const res = await apiCall(`${API_URLS.USER}/auth/login`, 'POST', { email, password });
        token = res.token;
        localStorage.setItem('jwt_token', token);
        currentUser = await apiCall(`${API_URLS.USER}/users/me`);
        showToast('Login successful!');
        showApp();
    } catch (err) { }
}

async function handleRegister(e) {
    e.preventDefault();
    const firstName = document.getElementById('reg-firstName').value;
    const lastName = document.getElementById('reg-lastName').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    try {
        const res = await apiCall(`${API_URLS.USER}/auth/register`, 'POST', { firstName, lastName, email, password });
        token = res.token;
        localStorage.setItem('jwt_token', token);
        currentUser = await apiCall(`${API_URLS.USER}/users/me`);
        showToast('Registration successful!');
        showApp();
    } catch (err) { }
}

// Views Loaders
async function loadDashboard() {
    try {
        const [productsRes, ordersRes, notifsRes] = await Promise.all([
            apiCall(`${API_URLS.PROD}/products`),
            apiCall(`${API_URLS.ORDER}/orders`),
            apiCall(`${API_URLS.NOTIF}/notifications`)
        ]);
        
        const products = productsRes.items || [];
        const orders = ordersRes.items || [];
        const notifs = notifsRes.items || [];
        
        document.getElementById('stat-products').innerText = products.length;
        document.getElementById('stat-orders').innerText = orders.length;
        const unread = notifs.filter(n => !n.isRead).length;
        document.getElementById('stat-notifs').innerText = unread;
    } catch (e) { console.error(e); }
}

async function loadProducts() {
    try {
        const productsRes = await apiCall(`${API_URLS.PROD}/products`);
        let products = productsRes.items || [];
        let inventory = [];
        
        // Try fetching inventory if admin
        if(currentUser.role === 'ADMIN') {
            const invRes = await apiCall(`${API_URLS.PROD}/inventory`).catch(()=>({ items: [] }));
            inventory = invRes.items || [];
        }
        
        const tbody = document.getElementById('products-table-body');
        tbody.innerHTML = '';
        
        products.forEach(p => {
            const tr = document.createElement('tr');
            
            // match inventory if available, otherwise just show --
            let stock = '--';
            if (p.inventory && typeof p.inventory.stock !== 'undefined') {
                stock = p.inventory.stock;
            } else if (currentUser.role === 'ADMIN') {
                const invItem = inventory.find(i => i.productId === p.id);
                if (invItem) stock = invItem.stock;
            }

            let actions = '';
            if (currentUser.role === 'ADMIN') {
                actions = `
                    <button class="btn-secondary btn-small" onclick="editProduct('${p.id}')">Edit</button>
                    <button class="btn-secondary btn-small" onclick="openAdjustInventory('${p.sku}', '${p.name.replace(/'/g, "\\'")}')">Stock</button>
                    <button class="btn-danger btn-small" onclick="deleteProduct('${p.id}')">Del</button>
                `;
            } else {
                 actions = `<button class="btn-primary btn-small" onclick="openOrderModal('${p.id}')">Order</button>`;
            }
            
            tr.innerHTML = `
                <td>${p.sku}</td>
                <td>${p.name}</td>
                <td>${p.category || 'N/A'}</td>
                <td>$${p.price}</td>
                <td>${stock}</td>
                <td>${actions}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) { console.error(e); }
}

async function loadOrders() {
    try {
        const res = await apiCall(`${API_URLS.ORDER}/orders`);
        const orders = res.items || [];
        const tbody = document.getElementById('orders-table-body');
        tbody.innerHTML = '';
        
        orders.forEach(o => {
            const tr = document.createElement('tr');
            const total = o.totalAmount || o.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            let statusBadge = `badge-status`;
            if(o.status === 'PENDING') statusBadge = 'badge-pending';
            if(o.status === 'COMPLETED') statusBadge = 'badge-completed';
            if(o.status === 'CANCELLED') statusBadge = 'badge-cancelled';

            let actions = '';
            if (o.status !== 'CANCELLED') {
                actions = `<button class="btn-danger btn-small" onclick="cancelOrder('${o.id}')">Cancel</button>`;
            }
            if (currentUser.role === 'ADMIN' && o.status === 'PENDING') {
                 actions += ` <button class="btn-secondary btn-small" onclick="completeOrder('${o.id}')">Complete</button>`;
            }
            if(!actions) actions = 'N/A';

            tr.innerHTML = `
                <td>${o.id.substring(0,8)}...</td>
                <td><span class="badge ${statusBadge}">${o.status}</span></td>
                <td>$${Number(total).toFixed(2)}</td>
                <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                <td>${actions}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {}
}

async function loadNotifications() {
    try {
        const res = await apiCall(`${API_URLS.NOTIF}/notifications`);
        const notifs = res.items || [];
        const list = document.getElementById('notifications-list');
        list.innerHTML = '';
        
        if (notifs.length === 0) {
            list.innerHTML = '<p class="glass" style="padding: 1rem">No notifications found.</p>';
            return;
        }

        notifs.forEach(n => {
            const el = document.createElement('div');
            el.className = `notif-item glass ${n.isRead ? '' : 'unread'}`;
            el.innerHTML = `
                <div class="notif-content">
                    <div style="margin-bottom:0.2rem">
                        <span class="badge badge-status">${n.type}</span> 
                    </div>
                    <p>${n.message}</p>
                </div>
                <div class="time">${new Date(n.createdAt).toLocaleString()}</div>
            `;
            if (!n.isRead) {
                el.style.cursor = 'pointer';
                el.onclick = () => markRead(n.id);
            }
            list.appendChild(el);
        });
    } catch(e) {}
}

function loadProfile() {
    document.getElementById('profile-name').innerText = `${currentUser.firstName} ${currentUser.lastName}`;
    document.getElementById('profile-email').innerText = currentUser.email;
    
    const roleBadge = document.getElementById('profile-role');
    roleBadge.innerText = currentUser.role;
    roleBadge.className = `badge ${currentUser.role === 'ADMIN' ? 'badge-admin' : 'badge-customer'}`;
    
    document.getElementById('profile-id').innerText = currentUser.id;
}

// Product Actions
async function handleProductSave(e) {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const body = {
        name: document.getElementById('prod-name').value,
        sku: document.getElementById('prod-sku').value,
        description: document.getElementById('prod-desc').value,
        price: parseFloat(document.getElementById('prod-price').value),
        category: document.getElementById('prod-cat').value
    };
    
    try {
        if (id) {
            await apiCall(`${API_URLS.PROD}/products/${id}`, 'PUT', body);
            showToast('Product updated');
        } else {
            await apiCall(`${API_URLS.PROD}/products`, 'POST', body);
            showToast('Product created');
        }
        closeModal('modal-product');
        loadProducts();
    } catch(err) {}
}

window.editProduct = async function(id) {
    try {
        const p = await apiCall(`${API_URLS.PROD}/products/${id}`);
        document.getElementById('prod-id').value = p.id;
        document.getElementById('prod-name').value = p.name;
        document.getElementById('prod-sku').value = p.sku;
        document.getElementById('prod-desc').value = p.description;
        document.getElementById('prod-price').value = p.price;
        document.getElementById('prod-cat').value = p.category || '';
        document.getElementById('modal-product-title').innerText = 'Edit Product';
        openModal('modal-product');
    } catch(e) {}
}

window.deleteProduct = async function(id) {
    if(confirm('Delete this product?')) {
        try {
            await apiCall(`${API_URLS.PROD}/products/${id}`, 'DELETE');
            showToast('Product deleted');
            loadProducts();
        } catch(e) {}
    }
}

window.openAdjustInventory = function(sku, name) {
    document.getElementById('inventory-form').reset();
    document.getElementById('inv-prod-id').value = sku;
    document.getElementById('inv-prod-name').innerText = name;
    openModal('modal-inventory');
}

async function handleAdjustInventory(e) {
    e.preventDefault();
    const sku = document.getElementById('inv-prod-id').value;
    const quantity = parseInt(document.getElementById('inv-qty').value);
    const reason = document.getElementById('inv-reason').value;
    
    try {
        await apiCall(`${API_URLS.PROD}/inventory/adjust`, 'POST', { sku, quantity, reason });
        showToast('Inventory adjusted');
        closeModal('modal-inventory');
        loadProducts(); // to refresh inventory view
    } catch(e) {}
}

// Order Actions
window.openOrderModal = async function(preselectId) {
    try {
        const res = await apiCall(`${API_URLS.PROD}/products`);
        const products = res.items || [];
        const select = document.getElementById('order-product-select');
        select.innerHTML = '<option value="">Select Product...</option>';
        products.forEach(p => {
            const opt = document.createElement('option');
            opt.value = JSON.stringify({ id: p.id, sku: p.sku, price: p.price });
            opt.innerText = `${p.name} ($${p.price})`;
            select.appendChild(opt);
        });
        document.getElementById('order-form').reset();
        
        if (typeof preselectId === 'string' && preselectId.trim() !== '') {
             const matchingOpt = Array.from(select.options).find(opt => opt.value && JSON.parse(opt.value).id === preselectId);
             if (matchingOpt) select.value = matchingOpt.value;
        }
        
        openModal('modal-order');
    } catch(e) {}
}

async function handleCreateOrder(e) {
    e.preventDefault();
    const prodDataStr = document.getElementById('order-product-select').value;
    if(!prodDataStr) return;
    const prodData = JSON.parse(prodDataStr);
    const quantity = parseInt(document.getElementById('order-qty').value);
    const shippingAddress = document.getElementById('order-shipping').value;
    const billingAddress = document.getElementById('order-billing').value;
    
    const payload = {
        items: [{ sku: prodData.sku, quantity, price: prodData.price, productId: prodData.id }],
        shippingAddress,
        billingAddress,
        paymentMethod: 'CREDIT_CARD'
    };
    
    try {
        await apiCall(`${API_URLS.ORDER}/orders`, 'POST', payload);
        showToast('Order placed successfully');
        closeModal('modal-order');
        loadOrders();
    } catch(e) {}
}

window.cancelOrder = async function(id) {
    if(confirm('Cancel this order?')) {
        try {
            await apiCall(`${API_URLS.ORDER}/orders/${id}/status`, 'PATCH', { status: 'CANCELLED' });
            showToast('Order cancelled');
            loadOrders();
        } catch(e) {}
    }
}
window.completeOrder = async function(id) {
    if(confirm('Mark this order as COMPLETED?')) {
        try {
            await apiCall(`${API_URLS.ORDER}/orders/${id}/status`, 'PATCH', { status: 'COMPLETED' });
            showToast('Order completed');
            loadOrders();
        } catch(e) {}
    }
}


// Notification Actions
async function markRead(id) {
    try {
        await apiCall(`${API_URLS.NOTIF}/notifications/${id}/read`, 'PATCH');
        loadNotifications();
    } catch(e) {}
}

async function markAllNotificationsRead() {
    try {
        const res = await apiCall(`${API_URLS.NOTIF}/notifications`);
        const notifs = res.items || [];
        const unread = notifs.filter(n => !n.isRead);
        await Promise.all(unread.map(n => apiCall(`${API_URLS.NOTIF}/notifications/${n.id}/read`, 'PATCH')));
        showToast('All marked as read');
        loadNotifications();
    } catch(e) {}
}

// Admin metrics
async function loadAdminMetrics() {
    try {
        const data = await apiCall(`${API_URLS.USER}/admin/dashboard`);
        document.getElementById('admin-metrics-output').innerText = JSON.stringify(data, null, 2);
    } catch(e) {}
}
