"use strict";

//Import Controller
const mainController = require('../controllers/mainController');
const scrape = require('../controllers/scrape');
const apis = require('../controllers/apiCalls');

module.exports = (app) => {
	app.get('/test', mainController.run);
	app.post('/generate-signed-url', mainController.createS3URLForUpload);
	app.post('/scrape-google', scrape.run)
	app.post('/process-chunks', mainController.processChunks);
	app.post('/geocoding-api', apis.geocoding)
	app.post('/inegi-api', apis.denue)
};

