# Running Lighthouse on Authenticated Pages

Standard usages of Lighthouse audit a page as a new user, with no previous session or storage data. This means that pages behind authenticated access do not work without some additional setup. There a multiple ways to run Lighthouse on an authenticated page - this document focuses on the most flexible approach (Puppeteer), but makes mention of all approached briefly at the end.

## Our Site

There are two pages on our site:

1. `/` - the homepage
2. `/dashboard`

The homepage shows the login form, but only to users that are not signed in.

The dashboard shows a secret if the user is logged in, but shows an error if the user is not.

Our server responds with different HTML for each of these pages and session states, so we have four different pages that we want to assert have passable Lighthouse SEO scores.

You can run this server locally if you like:

```sh
# be in root lighthouse directory
yarn # install global project deps
cd docs/auth
yarn # install deps related to just this documentation
yarn start # start the server on http://localhost:8000
```

## Puppeteer



## Other Approaches

