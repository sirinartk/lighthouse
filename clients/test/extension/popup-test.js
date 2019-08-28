/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const path = require('path');
const puppeteer = require('../../../node_modules/puppeteer/index.js');

const lighthouseExtensionPath = path.resolve(__dirname, '../../../dist/extension');

const defaultCategoriesStub = [{
  id: 'performance',
  title: 'Performance',
}, {
  id: 'accessibility',
  title: 'Accessibility',
}];

describe('Lighthouse chrome popup', function() {
  // eslint-disable-next-line no-console
  console.log('\n✨ Be sure to have recently run this: yarn build-extension');

  let browser;
  let page;
  const pageErrors = [];

  beforeAll(async function() {
    // start puppeteer
    browser = await puppeteer.launch({
      headless: false,
      executablePath: process.env.CHROME_PATH,
    });

    page = await browser.newPage();
    await page.evaluateOnNewDocument((defaultCategoriesStub) => {
      const controllerMock = {
        loadSettings: () => Promise.resolve({
          selectedCategories: [],
          useDevTools: false,
          device: 'mobile',
        }),
        DEFAULT_CATEGORIES: defaultCategoriesStub,
      };

      Object.defineProperty(chrome, 'tabs', {
        get: () => ({
          query: (args, cb) => {
            cb([{
              url: 'http://example.com',
            }]);
          },
        }),
      });
      Object.defineProperty(chrome, 'runtime', {
        get: () => ({
          getManifest: () => ({}),
        }),
      });
      Object.defineProperty(window, 'ControllerMock', {
        get: () => controllerMock,
      });
    }, defaultCategoriesStub);

    page.on('pageerror', err => {
      pageErrors.push(err);
    });

    await page.goto('file://' + path.join(lighthouseExtensionPath, 'popup.html'), {waitUntil: 'networkidle2'});
  }, 90 * 1000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it('should load without errors', async function() {
    expect(pageErrors).toHaveLength(0);
  });

  it('should populate the category checkboxes correctly', async function() {
    const checkboxTitles = await page.$$eval('li label span', els => els.map(e => e.textContent));
    const checkboxValues = await page.$$eval('li label input', els => els.map(e => e.value));

    for (const {title, id} of defaultCategoriesStub) {
      expect(checkboxTitles).toContain(title);
      expect(checkboxValues).toContain(id);
    }
  });
});
