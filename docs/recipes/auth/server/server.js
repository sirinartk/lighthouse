const createError = require('http-errors');
const express = require('express');
const morgan = require('morgan');
const session = require('express-session');
const http = require('http');
const path = require('path');
const PUBLIC_DIR = path.join(__dirname, 'public');

const app = express();

app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));

app.use(session({
  secret: 'notverysecret',
  resave: true,
  saveUninitialized: false,
}));

app.get('/dashboard', (req, res) => {
  if (req.session.user) {
    res.sendFile('./dashboard.html', { root: PUBLIC_DIR });
  } else {
    res.status(401).sendFile('./unauthenticated.html', { root: PUBLIC_DIR });
  }
});

app.get('/', (req, res) => {
  if (req.session.user) {
    res.send('<span>You are logged in. Go to <a href="/dashboard">the dashboard</a>.</span>')
  } else {
    res.send(`
      <form class="login-form" action="/login" method="post">
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
    `);
  }
});

app.post('/login', (req, res, next) => {
  const {email, password} = req.body;
  if (email !== 'admin@example.com' || password !== 'password') {
    return next(createError(401));
  }

  req.session.user = {
    email,
  };
  res.redirect('/dashboard');
});

app.get('/logout', (req, res, next) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Error handlers
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = err;

  res.status(err.status || 500);
  res.json({err});
});

const server = http.createServer(app);
if (require.main === module) {
  server.listen(8000);
} else {
  module.exports = server;
}
