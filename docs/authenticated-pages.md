# Running Lighthouse on Authenticated Pages

Default runs of Lighthouse load a page as a "new user", with no previous session or storage data. This means that pages requiring authenticated access do not work without additional setup.

## Option 1: Script the login with Puppeteer

[Puppeteer](https://pptr.dev) is the most flexible approach for auditing pages behind authentication with Lighthouse. See [recipes/auth](./recipes/auth) for more.

## Chrome DevTools

The Audits panel in Chrome DevTools will never clear your session cookies, so you can log in to the target site and run Lighthouse without being logged out. If `localStorage` or `indexedDB` is important for your authentication purposes, be sure to uncheck `Clear storage`.

## Option 3: Pass custom request headers with Lighthouse CLI

CLI:
```sh
lighthouse http://www.example.com --view --extra-headers="{\"Authorization\":\"...\"}"
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

## Chrome User Profile

TODO: pending [#8957](https://github.com/GoogleChrome/lighthouse/issues/8957).
