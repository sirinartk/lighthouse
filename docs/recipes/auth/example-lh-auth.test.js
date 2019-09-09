/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * @fileoverview Example Jest tests for demonstrating how to run Lighthouse on an authenticated
 * page as integration tests. See docs/recipes/auth/README.md for more.
 */

/** @typedef {import('./node_modules/lighthouse/types/lhr')} LH */

const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const server = require('./server/server.js');

const CHROME_DEBUG_PORT = 8042;
const SERVER_PORT = 8000;

jest.setTimeout(30000);

/**
 * @param {string} url
 * @return {Promise<LH.Result>}
 */
async function runLighthouse(url) {
  const result = await lighthouse(url, {
    port: CHROME_DEBUG_PORT,
    onlyCategories: ['seo'],
  });
  return result.lhr;
}

/**
 * @param {puppeteer.Browser} browser
 */
async function login(browser) {
  const page = await browser.newPage();
  await page.goto('http://localhost:8000/');
  await page.waitForSelector('input[type="email"]', {visible: true});

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

/**
 * @param {puppeteer.Browser} browser
 */
async function logout(browser) {
  const page = await browser.newPage();
  await page.goto('http://localhost:8000/logout');
  await page.close();
}

describe('my site', () => {
  /** @type {import('puppeteer').Browser} */
  let browser;
  /** @type {import('puppeteer').Page} */
  let page;

  beforeAll(async () => {
    await new Promise(resolve => server.listen(SERVER_PORT, resolve));
    browser = await puppeteer.launch({
      args: [`--remote-debugging-port=${CHROME_DEBUG_PORT}`],
      headless: !process.env.DEBUG,
      slowMo: process.env.DEBUG ? 50 : undefined,
    });
  });

  afterAll(async () => {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
    await logout(browser);
  });

  describe('/ logged out', () => {
    it('lighthouse', async () => {
      await page.goto('http://localhost:8000/');
      const lhr = await runLighthouse(page.url());
      expect(lhr.categories.seo.score).toBeGreaterThanOrEqual(0.9);
    });

    it('login form should exist', async () => {
      await page.goto('http://localhost:8000/');
      const emailInput = await page.$('input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');
      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
    });
  });

  describe('/ logged in', () => {
    it('lighthouse', async () => {
      await login(browser);
      await page.goto('http://localhost:8000/');
      const lhr = await runLighthouse(page.url());
      expect(lhr.categories.seo.score).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe('/dashboard logged out', () => {
    it('lighthouse', async () => {
      await page.goto('http://localhost:8000/dashboard');
      const lhr = await runLighthouse(page.url());
      expect(lhr.categories.seo.score).toBeGreaterThanOrEqual(0.9);
    });

    it('has no secrets', async () => {
      await page.goto('http://localhost:8000/dashboard');
      expect(await page.content()).not.toContain('secrets');
    });
  });

  describe('/dashboard logged in', () => {
    it('lighthouse', async () => {
      await login(browser);
      await page.goto('http://localhost:8000/dashboard');
      const lhr = await runLighthouse(page.url());
      expect(lhr.categories.seo.score).toBeGreaterThanOrEqual(0.9);
    });

    it('has secrets', async () => {
      await login(browser);
      await page.goto('http://localhost:8000/dashboard');
      expect(await page.content()).toContain('secrets');
    });
  });
});
