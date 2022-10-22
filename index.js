'use strict';

const serverless = require('serverless-http');
const app = require('./app');

const controller = require('./controllers/s3TriggerController.js');

module.exports.server = serverless(app);

module.exports.s3Trigger = async (event, context, callback) => {
  console.log("start s3 event v: 0.0.3");
  console.log("");

  console.log(event.Records[0].s3.object);
  console.log(event.Records[0].s3.object.key);
  await controller.s3Trigger(event.Records[0].s3.object.key);
  console.log("end s3 event");
  return {};
};
