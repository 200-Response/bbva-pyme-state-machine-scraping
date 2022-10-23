'use strict'

const dynamoService = require('../services/dynamo')
const AWS = require('aws-sdk')
AWS.config.loadFromPath('./config.json')

const API_URL = 'http://localhost:3088/data-mexico-api';


// HTTP Request
var axios = require('axios')

// const getDataFromDynamoDB = async () => {
//     await dynamoService
//         .getAll('pyme-dataset')
//         .then(async (result) => {
//             result.Items.forEach((pyme) => {
//                 let pymeClee = pyme.data_inegi_CLEE || ''
//                 let pymeEstado = (String(pyme.Estado)) || ''
//                 let pymeItem = {
//                     processId,
//                     unique: pyme.unique,
//                     type: pyme.type,
//                     CLEE: pymeClee,
//                     estado: pymeEstado
//                 }
//                 axios.post(API_URL, pymeItem)
//             })
//         })
//         .catch((error) => {
//             console.log('error on getAll: ', error)
//         })
// }

// getDataFromDynamoDB()

const getDataFromDataMexico = (params) => {

    return new Promise(async (resolve, reject) => {

        const { Items, processId } = params;

        let apiCalls = [];

        Items.forEach(async (pyme) => {
            let pymeClee = pyme.data_inegi_CLEE || ''
            let pymeEstado = (String(pyme.Estado)) || ''
            let pymeItem = {
                processId,
                unique: pyme.unique,
                type: pyme.type,
                CLEE: pymeClee,
                estado: pymeEstado
            }

            apiCalls.push(axios.post(API_URL, pymeItem));

        })

        await Promise.all(apiCalls);

        resolve(params);
    });
}

module.exports = {
    getDataFromDataMexico
}
