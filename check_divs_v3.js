const fs = require('fs');
const content = fs.readFileSync('h:/4ubilling/pms/src/app/pages/RestaurantPOS.tsx', 'utf8');

const lines = content.split('\n');
let balance = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Ignore template strings (crude)
    if (line.includes('`')) continue;

    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div/g) || []).length;

    balance += opens;
    balance -= closes;

    if (balance < 0) {
        console.log(`Mismatch found at line ${i + 1}: Negative balance ${balance}`);
        process.exit(0);
    }
}
console.log('Final Balance:', balance);
if (balance !== 0) {
    console.log('Balance remains non-zero.');
}
