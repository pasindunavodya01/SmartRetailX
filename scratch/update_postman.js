const fs = require('fs');

const collectionPath = 'd:/2026_Projects/SmartRetailX/SmartRetailX_AWS.postman_collection.json';
const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// Helper to create basic request
function createReq(name, method, urlPath, requiresAuth = false, body = null) {
    const req = {
        name: name,
        request: {
            method: method,
            header: [],
            url: {
                raw: `{{ALB_URL}}${urlPath}`,
                host: ["{{ALB_URL}}"],
                path: urlPath.split('/').filter(p => p !== '')
            }
        }
    };
    
    if (requiresAuth) {
        req.request.header.push({
            key: "Authorization",
            value: "Bearer {{JWT_TOKEN}}"
        });
    }
    
    if (body) {
        req.request.header.push({
            key: "Content-Type",
            value: "application/json"
        });
        req.request.body = {
            mode: "raw",
            raw: JSON.stringify(body, null, 2)
        };
    }
    
    return req;
}

const userItems = [
    createReq('Health Check', 'GET', '/api/v1/health'),
    createReq('Swagger Docs', 'GET', '/api/v1/users/docs'),
    createReq('Register User', 'POST', '/api/v1/auth/register', false, { email: "clouduser@smartretailx.com", password: "Password123!", firstName: "Cloud", lastName: "User" }),
    createReq('Login', 'POST', '/api/v1/auth/login', false, { email: "clouduser@smartretailx.com", password: "Password123!" }),
    createReq('Get Current User', 'GET', '/api/v1/users/me', true),
    createReq('Get Admin Dashboard', 'GET', '/api/v1/admin/dashboard', true)
];

const productItems = [
    createReq('Health Check', 'GET', '/api/v1/health'),
    createReq('Swagger Docs', 'GET', '/api/v1/products/docs'),
    createReq('List Products', 'GET', '/api/v1/products', true),
    createReq('Create Product', 'POST', '/api/v1/products', true, { sku: "PROD-001", name: "Smart Watch", description: "A smart watch", price: 199.99, category: "Electronics" }),
    createReq('Get Product by ID', 'GET', '/api/v1/products/<PRODUCT_ID>', true),
    createReq('Get Product by SKU', 'GET', '/api/v1/products/sku/PROD-001', true),
    createReq('Update Product', 'PUT', '/api/v1/products/<PRODUCT_ID>', true, { price: 189.99 }),
    createReq('Delete Product', 'DELETE', '/api/v1/products/<PRODUCT_ID>', true),
    createReq('Get Inventory', 'GET', '/api/v1/inventory', true),
    createReq('Adjust Inventory', 'POST', '/api/v1/inventory/adjust', true, { productId: "<PRODUCT_ID>", quantity: 50, reason: "Restock" }),
    createReq('Apply Promotion', 'POST', '/api/v1/products/promotions', true, { discountPercentage: 10, reason: "Holiday Sale" }),
    createReq('End Promotion', 'DELETE', '/api/v1/products/promotions/<PROMOTION_ID>', true)
];

const orderItems = [
    createReq('Health Check', 'GET', '/api/v1/health'),
    createReq('Swagger Docs', 'GET', '/api/v1/orders/docs'),
    createReq('List Orders', 'GET', '/api/v1/orders', true),
    createReq('Create Order', 'POST', '/api/v1/orders', true, { items: [{ productId: "<PRODUCT_ID>", quantity: 2 }], shippingAddress: "123 Test St", billingAddress: "123 Test St", paymentMethod: "CREDIT_CARD" }),
    createReq('Get Order by ID', 'GET', '/api/v1/orders/<ORDER_ID>', true),
    createReq('Update Order', 'PUT', '/api/v1/orders/<ORDER_ID>', true, { customerId: "<NEW_CUSTOMER_ID>" }),
    createReq('Update Order Status', 'PATCH', '/api/v1/orders/<ORDER_ID>/status', true, { status: "CANCELLED" }),
    createReq('Simulate Delivery Tracking Update', 'POST', '/api/v1/orders/<ORDER_ID>/tracking', true, { status: "SHIPPED", location: "Distribution Center" })
];

const notificationItems = [
    createReq('Health Check', 'GET', '/api/v1/health'),
    createReq('Swagger Docs', 'GET', '/api/v1/notifications/docs'),
    createReq('Create Internal Notification', 'POST', '/api/v1/internal/notifications', false, { userId: "<USER_ID>", type: "SYSTEM_ALERT", message: "System restart initiated." }),
    createReq('Get Notifications by User', 'GET', '/api/v1/notifications/users/<USER_ID>', true),
    createReq('List All Notifications', 'GET', '/api/v1/notifications', true),
    createReq('Create Notification', 'POST', '/api/v1/notifications', true, { userId: "<USER_ID>", type: "PROMO", message: "50% off today!" }),
    createReq('Get Notification by ID', 'GET', '/api/v1/notifications/<NOTIFICATION_ID>', true),
    createReq('Mark Notification as Read', 'PATCH', '/api/v1/notifications/<NOTIFICATION_ID>/read', true),
    createReq('Update Notification', 'PUT', '/api/v1/notifications/<NOTIFICATION_ID>', true, { message: "Updated promo message" }),
    createReq('Delete Notification', 'DELETE', '/api/v1/notifications/<NOTIFICATION_ID>', true)
];

collection.item = [
    { name: "User Service", item: userItems },
    { name: "Product Inventory Service", item: productItems },
    { name: "Order Service", item: orderItems },
    { name: "Notification Service", item: notificationItems }
];

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, '\t'), 'utf8');
console.log('Postman collection updated successfully');
