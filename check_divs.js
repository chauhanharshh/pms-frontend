const fs = require('fs');
const content = fs.readFileSync('h:/4ubilling/pms/src/app/pages/RestaurantPOS.tsx', 'utf8');

let balance = 0;
let stack = [];
const lines = content.split('\n');

lines.forEach((line, index) => {
    const openMatches = line.matchAll(/<div/g);
    for (const match of openMatches) {
        stack.push({ line: index + 1, type: 'open' });
        balance++;
    }
    const closeMatches = line.matchAll(/<\/div/g);
    for (const match of closeMatches) {
        stack.push({ line: index + 1, type: 'close' });
        balance--;
    }
});

console.log('Balance:', balance);
if (balance !== 0) {
    console.log('Nesting issues found.');
    let currentLevel = 0;
    lines.forEach((line, index) => {
        const matches = line.matchAll(/<(div|<\/div)/g);
        for (const match of matches) {
            if (match[0] === '<div') {
                currentLevel++;
            } else {
                currentLevel--;
            }
            if (currentLevel < 0) {
                console.log(`ERROR: Extra closing tag at ${index + 1}`);
                currentLevel = 0;
            }
        }
    });
    console.log('Final Level:', currentLevel);
}
