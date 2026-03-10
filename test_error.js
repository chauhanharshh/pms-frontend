const http = require('http');

function post(path, data, token) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        }, res => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        req.write(JSON.stringify(data));
        req.end();
    });
}

function get(path, token) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        }, res => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        req.end();
    });
}

async function run() {
    try {
        console.log("Logging in...");
        const loginRes = await post('/api/v1/auth/login', { username: "admin", password: "admin123" });
        const loginData = JSON.parse(loginRes.body);
        if (!loginData.data || !loginData.data.token) {
            console.log("Login failed", loginData);
            return;
        }
        const token = loginData.data.token;
        console.log("Logged in!");

        console.log("Fetching bills...");
        const billsRes = await get('/api/v1/bills', token);
        const billsData = JSON.parse(billsRes.body);
        const bills = billsData.data || [];
        if (bills.length === 0) {
            console.log("No bills found.");
            return;
        }
        console.log(`Found ${bills.length} bills. Using bill ${bills[0].id}`);

        console.log("Generating invoice...");
        const genRes = await post('/api/v1/invoices/generate', {
            billId: bills[0].id,
            guestAddress: "Test Address"
        }, token);

        console.log("Status:", genRes.status);
        console.log("Generate Invoice Error Response:", JSON.stringify(JSON.parse(genRes.body), null, 2));

    } catch (e) {
        console.error(e);
    }
}

run();
