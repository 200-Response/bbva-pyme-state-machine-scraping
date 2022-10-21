'use strict';
const {
    getQuery
  } = require('../controllers/utils');

const dynamoService = require('../services/dynamo');

const getDataFromInegi = (params) => {
    console.log("getDataFromInegi():params", params);
  
    return new Promise(async (resolve, reject) => {
        // la lògica va aquì

        resolve(params);
    });
}

  
module.exports = {
    getDataFromInegi
}