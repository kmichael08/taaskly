'use strict';

const basicAuth = require('express-basic-auth');
const bcrypt = require('bcrypt');
const express = require('express');
const logger = require('heroku-logger');
const passport = require('passport');

const admin = require('./admin');
const api = require('./api');
const authenticated = require('./authenticated');
const db = require('../db');
const loggedout = require('./loggedout');

function loginRedirect(req, res, next) {
  if (req.user) {
    next();
  } else {
    req.session.loginReferrer = req.originalUrl;
    res.redirect('/login');
  }
}

function forceAdmin(req, res, next) {
  console.log('yolo', req.isAdmin);
  if (req.isAdmin) {
    next();
  } else {
    res.status(403).render('error', {message: 'You are not an admin.'});
  }
}

function errorHandler(err, req, res, next) {
  logger.error(err);
  res.status(500).render('error', {message: err.message, details: err.stack});
}

const router = express.Router();

router.use((req, res, next) => {
  req.isAdmin = req.user && req.user.id === 1;
  next();
})

router.use((req, res, next) => {
  const navigation = [];
  if (req.user) {
    navigation.push({name: 'Documents', path: '/documents'});
    navigation.push({name: 'Tasks', path: '/tasks'});
    navigation.push({name: 'Messages', path: '/messages'});
    if (req.isAdmin) {
      navigation.push({name: 'Admin', path: '/admin'});
    }
  }
  res.locals.navigation = navigation;
  next();
});

const auth = basicAuth({
  authorizer: (username, password) => password === process.env.MASTER_PASSWORD,
  challenge: true,
  realm: 'taaskly',
});

router.use('/api', api);
router.use(auth);
router.use(loggedout);
router.use(loginRedirect);
router.use(authenticated);
router.use('/admin', forceAdmin, admin);
router.use(errorHandler);

module.exports = router;
