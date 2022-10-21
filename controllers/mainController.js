const dynamoService = require('../services/dynamo');
const AWS = require('aws-sdk');

const {
  calculateDateRange,
  getClientConfig
} = require('./utils');

const uniqid = require('uniqid');

exports.run = async (req, res) => {

  // get dis-ga config
  const config = await getConfig( 'drmco' );
  
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
