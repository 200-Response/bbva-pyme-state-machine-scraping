const dynamoService = require('../services/dynamo');
const AWS = require('aws-sdk');

const s3Service = require('../services/s3');

const uniqid = require('uniqid');
const nthline = require('nthline');
const fs = require('fs');

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
    indexRange,
    processId
  } = req.body;

  let response = [];

  let file = fs.createWriteStream(temporalFilePath);
        
  s3Service.getS3ObjectAndcreateReadStream(process.env.s3Bucket, key, file);

  return endStreamFile(file)
    .then(async (fromResolve) => {

        let storeToDynamoDb = [];

        const currentIndexes = indexRange.startAt + '-' + indexRange.endAt;

        console.log("***********************getcsvFileFromS3 - count rows");
        //get total rows
        for (let index = indexRange.startAt; index <= (indexRange.startAt+4); index++) {
          const line = await readLineAndGetJson(temporalFilePath, index, "", "");
          // create jsonObject 
          let  currentObject = Object.assign( ...headersIndex.map((element, index)=>({[element]: line[index]}) )); 
          
          currentObject.unique = processId;
          currentObject.type = 'record#' + currentIndexes + '#' + currentObject.Index;

          response.push(currentObject);

          const dynamoParams = {
            TableName: 'pyme-dataset',
            Item: currentObject
          };

          storeToDynamoDb.push( dynamoService.addItem( dynamoParams) );
        }

        await Promise.all( storeToDynamoDb );


        // start the state machine
        const stepfunctions = new AWS.StepFunctions();
        let BBVA_PYME_STATE_MACHINE_SCRAPING = process.env.BBVA_PYME_STATE_MACHINE_SCRAPING;

        const paramsStepFunctions = {
          bucket,
          key,
          temporalFilePath,
          headersIndex,
          indexRange,
          processId,
          Items: response
        };

        const paramsStateMachine = {
          stateMachineArn: BBVA_PYME_STATE_MACHINE_SCRAPING,
          input:JSON.stringify( paramsStepFunctions ),
          name: uniqid( processId + '-' + currentIndexes + '-' )
        }
        console.log(paramsStateMachine);
        
        await stepfunctions.startExecution(paramsStateMachine).promise();

        console.log("data", response);
        res.json({status:"success", data: response});
        return;
    })
    .catch((error) => {
        console.log("file does not exist ", error);
        res.json({status:"error"});
        return;
    });

      

};

exports.status = async (req, res) => {
  
  const {
    fileName
  } = req.body;

  const result = await dynamoService.getAll('process')
  res.send(result);

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
