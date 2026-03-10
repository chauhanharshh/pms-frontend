import http from 'http';

function request(method, path, data, token, hotelId) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(hotelId ? { 'X-Hotel-ID': hotelId } : {})
            }
        }, res => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}
function post(path, data, token, hotelId) { return request('POST', path, data, token, hotelId); }
function get(path, token, hotelId) { return request('GET', path, null, token, hotelId); }

async function run() {
    try {
        console.log("Logging in...");
        const loginRes = await post('/api/v1/auth/login', { username: "admin", password: "admin123" });
        const loginData = JSON.parse(loginRes.body);
        const token = loginData.data.token;

        const hotelsRes = await get('/api/v1/hotels', token);
        const hotelId = JSON.parse(hotelsRes.body).data[0].id;

        console.log("Fetching bookings...");
        const bookingsRes = await get('/api/v1/bookings', token, hotelId);
        const bookingsData = JSON.parse(bookingsRes.body);

        const checkedIn = bookingsData.data.find(b => b.status === "checked_in");
        if (!checkedIn) {
            console.log("No checked_in booking found.");
            return;
        }

        console.log("Check-out booking", checkedIn.id);
        const checkoutRes = await post(`/api/v1/bookings/${checkedIn.id}/checkout`, {
            finalPayment: 0,
            paymentMode: "cash"
        }, token, hotelId);

        console.log("Checkout status:", checkoutRes.status);
        console.log("Checkout body:", checkoutRes.body);
    } catch (e) {
        console.error("Script error:", e);
    }
}
run();
