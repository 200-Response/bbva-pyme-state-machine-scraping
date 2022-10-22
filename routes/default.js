 "use strict";

//Import Controller
const mainController = require('../controllers/mainController');

module.exports = (app) =>{
	app.get('/test', mainController.run);
	app.post('/generate-signed-url', mainController.createS3URLForUpload);
	app.post('/process-chunks', mainController.processChunks);
};

