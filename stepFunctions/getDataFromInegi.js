'use strict';
const {
    getQuery
  } = require('../controllers/utils');

const athenaService = require('../services/athena');

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