const API_URL = 'http://smartretailx-alb-882710877.us-east-1.elb.amazonaws.com/api/v1';
const crypto = require('crypto');

async function main() {
    const random = crypto.randomBytes(4).toString('hex');
    const email = `admin_${random}@example.com`; // starts with 'admin' to be ADMIN role
    const password = 'password123';
    
    // Register
    const regRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: 'Test', lastName: 'Admin', email, password })
    });
    
    // Login
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    const token = (await loginRes.json()).token;
    
    // Create promotion
    const promRes = await fetch(`${API_URL}/products/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ discountPercentage: 20 })
    });
    console.log("Promotion creation:", await promRes.text());

    // get products
    const prodRes = await fetch(`${API_URL}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await prodRes.json();
    console.log("Products response keys:", Object.keys(data));
    console.log("Promotion data in products:", data.promotion);
}

main();
