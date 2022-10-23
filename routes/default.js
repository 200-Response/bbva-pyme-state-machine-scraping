"use strict";

//Import Controller
const mainController = require('../controllers/mainController');
const scrape = require('../controllers/scrape');
const apis = require('../controllers/apiCalls');
const { generateReport } = require(`../stepFunctions/generateReport`);

module.exports = (app) => {
	app.get('/status', mainController.status);
	app.post('/generate-report', generateReport);
	app.post('/generate-signed-url', mainController.createS3URLForUpload);
	app.post('/scrape-google', scrape.run)
	app.post('/process-chunks', mainController.processChunks);
	app.post('/geocoding-api', apis.geocoding)
	app.post('/inegi-api', apis.denue)
	app.post('/data-mexico-api', apis.dataMexico)
};
