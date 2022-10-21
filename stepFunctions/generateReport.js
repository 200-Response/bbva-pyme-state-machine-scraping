'use strict';

const snsService = require('../services/sns');

const {
    sendSNSThreshold
} = require('../controllers/utils');

const generateReport = (params) => {

    return new Promise(async (resolve, reject) => {
        
        // lògica aquì

        resolve(params);
    });
}

module.exports = {
    generateReport
}