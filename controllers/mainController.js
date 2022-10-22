const dynamoService = require('../services/dynamo');
const AWS = require('aws-sdk');

const s3Service = require('../services/s3');
const {
  calculateDateRange,
  getClientConfig
} = require('./utils');

const uniqid = require('uniqid');
const nthline = require('nthline');
const fs = require('fs');

exports.run = async (req, res) => {

  
  let paramsDate = {};

  if ( req?.query?.date ) {
    paramsDate = {
      date: req.query.date,
      diffDias: 0
    };
  }
  else {
    paramsDate = {
      date: new Date(),
      diffDias: 1
    };
  }
  
  const dateToProcess = calculateDateRange(paramsDate);
  
  let response = {};
  
  // get client configs
  const { currentClient, pendingClients, count } = getClientConfig([config]);
  
  const stepFunctionParams = {
    client: currentClient[0]?.client,
    dateToProcess,
    tables: currentClient[0]?.tables,
    pendingClients,
    count,
    config,
    output_query_prefix: 'temp.crm.upload/clients/data-lake/dis-ga/results/'
  }

  console.log("stepFunctionParams", stepFunctionParams);

  response = JSON.parse(JSON.stringify(stepFunctionParams));

  response.config[0].ga_credentials = undefined;

  const params = {
    stateMachineArn: process.env.STATE_MACHINE,
    input: JSON.stringify( stepFunctionParams ),
    name: uniqid(dateToProcess[0][0]+'-'+stepFunctionParams?.client+'-')
  }
  console.log(params);

  const stepfunctions = new AWS.StepFunctions();
  
  // execute the stepfunctions
  await stepfunctions.startExecution(params).promise()
  console.log("stepfunctions start success");

  res.send(response);
    
}

exports.createS3URLForUpload = (req,res) => {
  
  let urlSigned = null;
  
  let reqSF = {
    fileName: req.body.fileName,
    Bucket: 'pyme-raw-dataset',
    Key: ""
  };

  reqSF.Key = "raw/" + req.body.fileName;
  
  console.log(reqSF);
  
  reqSF.totalRows = 0;
  reqSF.processedRows = 0;
  reqSF.blockRows = 1000;
  reqSF.complete = 'none';
  reqSF.newRecords = 0;
  reqSF.updatedRecords = 0;
  reqSF.validRecords = 0;
  reqSF.invalidRecords = 0;
  reqSF.errors = [];
  
  let paramsS3getSignedUrl = {
    Bucket: reqSF.Bucket,
    Key: reqSF.Key,
    ACL:'public-read',
    Expires: 60 * 5,
    ContentType: 'text/csv'
  };

  s3Service.getSignedUrl(paramsS3getSignedUrl)
  .then(data=>{
    console.log(data);
    urlSigned = data;
    /*
    //write to s3 status
    let paramsS3 = {
      Key: globalParams.input.client+'/donors/status.json',
      Bucket: globalParams.input.Bucket,
      Body: JSON.stringify(globalParams),
      ContentType: "application/json"
    };
    */

    //console.log(paramsS3);
    return ""; //s3.create(paramsS3);
  })
  .then(data=>{
    res.json({status:"success", url: urlSigned});
  })
  .catch((error) =>{
    console.log("+++++++++++++++++++++++error");
    console.log(error);
    res.json({status:"error"});

  });
}

exports.processChunks = async (req, res) => {
  
  const {
    bucket,
    key,
    temporalFilePath,
    headersIndex,
    indexRange
  } = req.body;

  let response = [];

  let file = fs.createWriteStream(temporalFilePath);
        
  s3Service.getS3ObjectAndcreateReadStream(process.env.s3Bucket, key, file);

  return endStreamFile(file)
    .then(async (fromResolve) => {
        console.log("***********************getcsvFileFromS3 - count rows");
        //get total rows
        for (let index = indexRange.startAt; index <= (indexRange.startAt+4); index++) {
          const line = await readLineAndGetJson(temporalFilePath, index, "", "");
          response.push(line);
        }
        res.json({status:"success", data: response});
        return;
    })
    .catch((error) => {
        console.log("file does not exist ", error);
        res.json({status:"error"});
        return;
    });

      

};

const getConfig = async ( client ) => {
  const type = 'config#' + client;

  const dynamoParams = {
    TableName: process.env.DIS_GA_TABLE,
    KeyConditionExpression: "client = :cl and #tp = :yyyy",
    ExpressionAttributeNames: {
        "#tp": "type"
    },
    ExpressionAttributeValues: {
        ":cl": client,
        ":yyyy": type
    }
  };
  
  console.log("getconfig():dynamoService.dynamoParams", dynamoParams);
  const results = await dynamoService.queryItem(dynamoParams);
  console.log("getconfig():dynamoService.queryItem():results", results);

  return results?.Items;
};


function endStreamFile(file) {
  return new Promise(function (resolve, reject) {
      file.on('close', function () {
          console.log('done');
          resolve();
      });
      file.on('error', reject);
  });
}
  
const readLineAndGetJson = (filePath, rowIndex, email, crmid) => {
  return new Promise((resolve, reject) => {
      nthline(rowIndex, filePath)
      .then((line) => {
          let arrayLine = [];
          // console.log(line);
          // arrayLine = line.split(',');
          line = line.replace(/,,/g, ", ,");
          arrayLine = line.match(/("[^"]+"|[^,]+)/g);
  
          console.log(arrayLine);
          resolve(arrayLine);
  
      });
  });
  }
