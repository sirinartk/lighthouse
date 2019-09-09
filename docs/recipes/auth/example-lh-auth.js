/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');

const PORT = 8041;

/**
 * @param {import('puppeteer').Browser} browser
 */
async function login(browser) {
  const page = await browser.newPage();
  await page.goto('http://localhost:8000');
  await page.waitForSelector('input[type="email"]', {visible: true});

  // Fill in and submit login form.
  const emailInput = await page.$('input[type="email"]');
  await emailInput.type('admin@example.com');
  const passwordInput = await page.$('input[type="password"]');
  await passwordInput.type('password');
  await Promise.all([
    page.$eval('.login-form', form => form.submit()),
    page.waitForNavigation(),
  ]);

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
  const result = await lighthouse('http://localhost:8000/dashboard', {port: PORT});
  await browser.close();

  // Output the result.
  console.log(JSON.stringify(result.lhr, null, 2));
}

main();
