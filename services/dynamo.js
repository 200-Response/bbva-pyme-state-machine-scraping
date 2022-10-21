//Configure AWS
const AWS = require('aws-sdk');

var docClient; // = new AWS.DynamoDB.DocumentClient();
var dynamodb; // = new AWS.DynamoDB();

var currentRegion;
var assumeRoleArn = null;

//Add am Item to a database
exports.addItem = (params) => {
  loadKeys();
  return new Promise((resolve, reject) => {

    docClient.put(params, (err, data) => {

      if (err) {
        reject(err);
      }

      resolve(data);

    });

  });

};

//Query a specific item from a database
exports.queryItem = (params) => {
  loadKeys();
  return new Promise((resolve, reject) => {
    // console.log("query...............................");
    docClient.query(params, (err, data) => {
      // console.log("query done...............................");
      if (err) {
        console.log("error query", err);
        reject(err);
      }
      // console.log("success---------------");
      resolve(data);

    });

  });

}

//Get a specific item from a database
exports.getItem = (params) => {
  loadKeys();
  return new Promise((resolve, reject) => {

    docClient.get(params, (err, data) => {

      if (err) {
        console.log(err);
        reject(err);
      }

      resolve(data);

    });


  });

}

//Scan all items in a database TableName
/*
*/
exports.scan = (params) => {
  loadKeys();

  return new Promise((resolve, reject) => {
    docClient.scan(params, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}

//Get all items in a database TableName without params
exports.getAll = (table) => {
  loadKeys();
  let params = {
    TableName: table
  };

  return new Promise((resolve, reject) => {

    docClient.scan(params, (err, data) => {

      if (err) {
        reject(err);
      }

      resolve(data);

    });


  });

};

//Update an Item
exports.updateItem = (params) => {
  loadKeys();
  return new Promise((resolve, reject) => {

    docClient.update(params, (err, data) => {

      if (err) {
        reject(err);
      }

      resolve(data);

    });

  });

};

async function loadKeys() {
/*  AWS.config = new AWS.Config();

  AWS.config.update({
    region: 'us-east-1'
  });
*/
  docClient = new AWS.DynamoDB.DocumentClient();
  dynamodb = new AWS.DynamoDB();
}
