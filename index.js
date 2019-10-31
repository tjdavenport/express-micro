require('dotenv').config();
const express = require('express');
const passport = require('passport');
const {sql, models} = require('./db');
const bodyParser = require('body-parser');
const session = require('express-session');
const log = require('debug')(process.env.DEBUG);
const MemoryStore = require('memorystore')(session);
const {Strategy: LocalStrategy} = require('passport-local');

const app = express();

passport.serializeUser((user, cb) => {
  try {
    cb(null, JSON.stringify(user));
  } catch (err) {
    cb(err);
  }
});
passport.deserializeUser((json, cb) => {
  try {
    cb(null, JSON.parse(json));
  } catch (err) {
    cb(err);
  }
});
passport.use(new LocalStrategy({
  usernameField: 'email',
  session: true,
}, async (email, password, done) => {
  try {
    log(`attempting authentication for ${email}`);
    const user = await models.User.findOne({
      where: {email}
    });

    if (user === null) {
      log(`user was not found for ${email}`);
      return done(null, false);
    }

    if (await user.checkPassword(password))  {
      return done(null, user.toJSON());
    }

    log(`password for ${email} did not match`);
    return done(null, false);
  } catch (err) {
    done(err);
  }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: new MemoryStore(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: (1000 * 60 * 60 * 24 * 7),
  },
}));
app.use(passport.initialize());
app.use(passport.session());

const handle = handler => (req, res, next) => {
  handler.call(null, req, res, next).catch(err => next(err));
};

app.post('/api/auth/login', passport.authenticate('local'), handle(async (req, res) => {
  return res.json('authenticated!');
}))

sql.authenticate({logging: false})
  .then(() => {
    log('database connection working!');
    app.listen(process.env.PORT, () => log(`listening on ${process.env.PORT}`));
  })
  .catch(err => {
    log('database connection failed');
    console.err(err);
    process.exit(1);
  });
