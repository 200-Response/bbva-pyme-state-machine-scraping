 "use strict";

//Import Controller
const mainController = require('../controllers/mainController');

module.exports = (app) =>{
	app.get('/test', mainController.run);
	app.get('/generate-record', mainController.run);
};

