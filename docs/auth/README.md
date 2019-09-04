# Running Lighthouse on Authenticated Pages

Default runs of Lighthouse load a page as a "new user", with no previous session or storage data. This means that pages requiring authenticated access do not work. There are multiple ways to run Lighthouse on an authenticated page - this document focuses on the most flexible approach ([Puppeteer](https://pptr.dev)), but mentions other approaches briefly at the end.

If you just want to view the code, see [./example-lh-auth.js](example-lh-auth.js).

## The Example Site

There are two pages on the site:

1. `/` - the homepage
2. `/dashboard`

The homepage shows the login form, but only to users that are not signed in.

The dashboard shows a secret to users that are logged in, but shows an error to users that are not.

The server responds with different HTML for each of these pages and session states, so there are four different pages that must have passable Lighthouse SEO scores.

You can run this server locally if you like:

```sh
# be in root lighthouse directory
yarn # install global project deps
cd docs/auth
yarn # install deps related to just this documentation
yarn start # start the server on http://localhost:8000
```

## Puppeteer

We can use Puppeteer - a browser automation tool - to manipulate a setup a session programatically.

1. Launch a new browser.
1. Navigate to the login page.
1. Fill and submit the login form.
1. Run Lighthouse using the same browser.

First we launch Chrome:
```js
// This port will be used by Lighthouse later.
const PORT = 8041;
const browser = await puppeteer.launch({
  args: [`--remote-debugging-port=${PORT}`],
});
```

We navigate to the homepage, where the login form is:
```js
const page = await browser.newPage();
await page.goto('http://localhost:8000');
```

Given a login form that looks like this:
```html
<form action="/login" method="post">
  <label>
    Email:
    <input type="email" name="email">
  </label>
  <label>
    Password:
    <input type="password" name="password">
  </label>
  <input type="submit">
</form>
```

We direct Puppeteer to fill and submit it:
```js
const emailInput = await page.$('input[type="email"]');
await emailInput.type('admin@example.com');
const passwordInput = await page.$('input[type="password"]');
await passwordInput.type('password');
const submitInput = await page.$('input[type="submit"]');
await submitInput.press('Enter');
await page.waitForNavigation();
```

At this point, the session that Puppeteer is managing is now logged into our site.

We can close the page we used to login:
```js
await page.close();
// The page has been closed, but the browser still has the relevant session.
```

Now we run Lighthouse, using the same port as before:
```js
const result = await lighthouse('http://localhost:8000/dashboard', { port: PORT });
await browser.close();
const lhr = result.lhr;
```

## Puppetter in Your Integration Tests


See [./example-lh-auth.test.js](example-lh-auth.test.js) for an example of how to run Lighthouse in your Jest tests on pages in both an authenticated and non-authenticated session.

## Other Approaches

### Chrome DevTools

The Audits panel in Chrome DevTools will never clear your session cookies, so you can log in to the target site and run Lighthouse without being logged out. If local storage or IndexDB is important for your authentication purposes, be sure to uncheck `Clear storage`.

### Headers

CLI:
```sh
lighthouse http://www.example.com --view --extra-headers="{\"Authorization\":\"...\"}"
# or
lighthouse http://www.example.com --view --extra-headers=./path/to/secret/headers.json
```

Node:
```js
const result = await lighthouse('http://www.example.com', {
  extraHeaders: {
    Authorization: '...',
  },
});
```

You could also set the `Cookie` header, but beware: it will [override any other Cookies you expect to be there](https://github.com/GoogleChrome/lighthouse/pull/9170). A workaround is to use Puppeteer's [`page.setCookie`](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagesetcookiecookies).

### Chrome User Profile

TODO: pending [#8957](https://github.com/GoogleChrome/lighthouse/issues/8957).
