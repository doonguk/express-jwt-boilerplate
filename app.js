const express = require('express');
const logger = require('morgan');
const helmet = require('helmet');
const router = require('./routes/index');

const app = express();


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('helmet')

router(app);

module.exports = app;

