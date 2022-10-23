'use strict';

//=================== Modules
const express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  cors = require('cors');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Main Status message for server
app.get('/app/status', (req, res) => {

  let responseMessage = "";
  responseMessage = "BBVA-PyME-Scraping Server. Version 1.0.1";

  res.status(200).send(responseMessage);
});

////////********Require My Routes***************////////
require('./routes/default')(app);

module.exports = app;
