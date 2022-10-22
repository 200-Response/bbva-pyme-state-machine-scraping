
const s3 = require('../services/s3');

const uniqid = require('uniqid');
//const moment = require('moment');
const AWS = require('aws-sdk');
const fs = require('fs');
const csv = require('csvtojson');

let stepfunctions;

exports.s3Trigger = async (key) => {
    stepfunctions = new AWS.StepFunctions();
  
    return new Promise(async (resolve, reject) => {
      console.log("*********************** Paramsbucket - Key ", key);
      console.log("*********************** Paramsbucket - Bucket ", process.env.s3Bucket);
      
      // client = client[0] + '/transactions/status.json';
      const s3_params = {
        Bucket: process.env.DonorPortalBucket,
        Key: statusKey
      };
      console.log("-----------------------Params", s3_params);
      // resolve("");
      return s3.getS3Object(process.env.DonorPortalBucket, statusKey)
        .then((fromResolve) => {
          // return createDynamoItem(fromResolve.Body.toString());
          let statusJson = JSON.parse(fromResolve.Body.toString());
          console.log(statusJson);
          
          // let DMCCRMCIUPLOAD_STATE_MACHINE_ARN = "arn:aws:states:us-east-1:425231278465:stateMachine:CRMCIUploadStateMachine-prod"; //process.env.reportingStateMachine;
          //let DMCCRMIDUPLOAD_STATE_MACHINE_ARN = process.env.crmIDUploadStateMachine;
  
          /*let params = {
            stateMachineArn: DMCCRMIDUPLOAD_STATE_MACHINE_ARN,
            input: JSON.stringify(statusJson.input),
            // input: statusJson,
            name: uniqid(client[0] + '-' + moment().unix() + '-')
          }
          */

          //console.log(params);
  
          //execute the stepfunctions
          console.log('starting execution **********************************************');
          // return stepfunctions.startExecution(params).promise();
          return "";
        }).then((fromResolve) => {
          console.log("stepfunctions start success");
          console.log("success ", fromResolve);
          resolve(fromResolve);
        }).catch((error) => {
          console.log("file does not exist ", error);
          reject(error);
        });
    });
  }
  