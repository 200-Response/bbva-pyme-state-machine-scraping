'use strict';

//=================== Modules
const express = require('express'),
  app = express(),
  fs = require('fs'),
  path = require('path'),
  bodyParser = require('body-parser'),
  cors = require('cors');

let router = express.Router();

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
let recursiveRoutes = (folderName) => {

  fs.readdirSync(folderName).forEach((file) => {

    let fullName = path.join(folderName, file);
    let stat = fs.lstatSync(fullName);

    if (stat.isDirectory()) {
      recursiveRoutes(fullName);
    } else if (file.toLowerCase().indexOf('.js')) {
      require('./' + fullName)(app);
    }
  });

};

recursiveRoutes('routes');

module.exports = app;
