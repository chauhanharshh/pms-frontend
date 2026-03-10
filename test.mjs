import { chromium } from 'playwright';

async function run() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message || err));

    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(3000);

    await browser.close();
}
run().catch(console.error);
