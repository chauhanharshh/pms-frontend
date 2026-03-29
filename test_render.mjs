import https from 'https';

// Old Render URL: https://pms-backend-1j4y.onrender.com
// New VPS URL: http://148.230.97.88
// Updated: API URL changed from Render to VPS
const url = 'http://148.230.97.88/api/v1/health';

https.get(url, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Response:', data);
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
