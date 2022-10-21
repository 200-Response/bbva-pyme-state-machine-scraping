'use strict';
var AWS = require('aws-sdk');

const sqsService = require('../services/sqs');

//Generate the end user report
exports.fallback = (params) => {
    console.log('error alert');
    return new Promise(async (resolve, reject) => {
        AWS.config = new AWS.Config();
        AWS.config.update({
        region: 'us-east-1'
        });
        
        var d = new Date();
        // d.setDate(d.getDate() - 1);

        var month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        let date = [year, month, day].join('-');
        params.date = date;

        //Send to SQS service for report generation
      let messageParams = {
        "errorType": "Error on crmid upload",
        "client": params.client,
        "error_message": 'Error Alert:\n' + JSON.stringify(params),
        "url": 'error handler',
        "service": "DMC CRMID Upload"
      };

      console.log(messageParams);
      let messageParamsTransaction = {
        MessageAttributes: {
          "Client": {
            DataType: "String",
            StringValue: "crmid"
          },
          "Type": {
            DataType: "String",
            StringValue: 'errorHandler'
          }
        },
        MessageDeduplicationId: params.date,
        MessageGroupId: params.date,
        MessageBody: JSON.stringify(messageParams),
        QueueUrl: process.env.SQSURLE
      }
      console.log("---------------------------------------Sending to queue");
      sqsService.sendQueueMessage(messageParamsTransaction)
            .then((fromResolve) => {
                console.log('error alert sqs, has been sent');
                resolve(fromResolve);

            }).catch((error) => {
                console.log(error);
                reject({
                    status: 'error',
                    message: 'Error alert notification.',
                    error: error.message
                });
            });

    });
}
