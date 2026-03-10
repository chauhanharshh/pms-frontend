const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        const token = json.data.token;
        console.log("Logged in");

        // Test GET /api/v1/restaurant/orders
        const getOrdersOpt = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/v1/restaurant/orders?hotelId=123',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
        http.request(getOrdersOpt, r => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => console.log("Orders Res:", d));
        }).end();

        // Test POST /api/v1/invoices (just empty body to trigger error)
        const postInvoiceOpt = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/v1/invoices',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        const invReq = http.request(postInvoiceOpt, r => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => console.log("Invoice Res:", d));
        });
        invReq.write(JSON.stringify({}));
        invReq.end();
    });
});

req.write(JSON.stringify({ username: 'admin', password: 'password123' }));
req.end();
