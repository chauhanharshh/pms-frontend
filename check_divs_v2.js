const fs = require('fs');
const content = fs.readFileSync('h:/4ubilling/pms/src/app/pages/RestaurantPOS.tsx', 'utf8');

const lines = content.split('\n');
let balance = 0;

lines.forEach((line, index) => {
    // Crude way to handle strings: remove everything between quotes
    let processedLine = line.replace(/`[\s\S]*?`/g, '');
    processedLine = processedLine.replace(/"[\s\S]*?"/g, '');
    processedLine = processedLine.replace(/'[\s\S]*?'/g, '');

    const opens = (processedLine.match(/<div/g) || []).length;
    const closes = (processedLine.match(/<\/div/g) || []).length;

    if (opens > 0 || closes > 0) {
        balance += opens;
        balance -= closes;
        console.log(`Line ${index + 1}: Opens: ${opens}, Closes: ${closes}, Current Balance: ${balance}`);
    }
});

console.log('Final Balance:', balance);
if (balance > 0) {
    console.log(`ERROR: Missing ${balance} closing </div> tags.`);
} else if (balance < 0) {
    console.log(`ERROR: Extra ${-balance} closing </div> tags.`);
}
