const createError = require('http-errors');
const express = require('express');
const morgan = require('morgan')
const mustacheExpress = require('mustache-express');
const session = require('express-session');
const http = require('http');

const app = express();

app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: 'notverysecret',
  resave: true,
  saveUninitialized: false
}));

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

function loginRequired(req, res, next) {
  if (!req.session.user) {
    return res.status(401).render('unauthenticated');
  }

  next();
}

app.get('/dashboard', loginRequired, (req, res) => {
  res.render('dashboard');
});

app.get('/', (req, res) => {
  if (req.user) {
    return res.redirect('/dashboard');
  }

  res.render('index');
});

app.post('/login', (req, res, next) => {
  const { email, password } = req.body;
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
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = err;

  res.status(err.status || 500);
  res.json({ err });
});

const server = http.createServer(app);
if (require.main === module) {
  server.listen(8000);
} else {
  module.exports = server;
}
