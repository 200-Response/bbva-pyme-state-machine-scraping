'use strict';

const { google } = require('googleapis');
const scopes = 'https://www.googleapis.com/auth/analytics.readonly';

const dynamoService = require('../services/dynamo');
const snsService = require('../services/sns');

const {
    sendSNS
} = require('../controllers/utils');
  
let service_account = {};

const getDataFromGoogle = (params) => {
    
    return new Promise(async (resolve, reject) => {
        // la lògica va aquì

        resolve(params);
    });
}

module.exports = {
    getDataFromGoogle
}