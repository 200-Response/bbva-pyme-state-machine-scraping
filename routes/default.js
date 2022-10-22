 "use strict";

//Import Controller
const mainController = require('../controllers/mainController');
const scrape = require('../controllers/scrape');

module.exports = (app) =>{
	app.get('/test', mainController.run);
	app.post('/generate-signed-url', mainController.createS3URLForUpload);
	app.post('/scrape-google',scrape.run)
	app.post('/process-chunks', mainController.processChunks);
};

