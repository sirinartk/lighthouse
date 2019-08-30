const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');

const PORT = 8041;

/**
 * @param {import('puppeteer').Browser} browser
 */
async function login(browser) {
  const page = await browser.newPage();
  await page.goto('http://localhost:8000');
  await page.waitForSelector('input[type="email"]', { visible: true });

  // Fill in and submit login form.
  const emailInput = await page.$('input[type="email"]');
  await emailInput.type('admin@example.com');
  const passwordInput = await page.$('input[type="password"]');
  await passwordInput.type('password');
  const submitInput = await page.$('input[type="submit"]');
  await submitInput.press('Enter');
  await page.waitForNavigation();

  await page.close();
}

async function main() {
  // Direct Puppeteer to open Chrome with a specific debugging port.
  const browser = await puppeteer.launch({
    args: [`--remote-debugging-port=${PORT}`],
  });

  // Setup the browser session to be logged into our site.
  await login(browser);

  // Direct Lighthouse to use the same port.
  const result = await lighthouse('http://localhost:8000/dashboard', { port: PORT });
  await browser.close();

  // Output the result.
  console.log(JSON.stringify(result.lhr, null, 2));
}

main();
