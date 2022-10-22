'use strict';
const dynamoService = require('../services/dynamo')
const AWS = require('aws-sdk')
AWS.config.loadFromPath('./config.json');

const axios = require('axios');
const SCRAPE_URL = 'http://localhost:3088/scrape-google';

const getDataFromGoogle = (params) => {
//    params:{ Items: [{unique:'asfasdf'},{type:'asdfad'},{nombre:''}]}
    const { Items, processId } = params;

    return new Promise(async (resolve, reject) => {
        Items.forEach((pyme) => {
            let pymeInfo ={
                processId,
                unique: pyme.unique,
                type: pyme.type,
                pyme: pyme.NombComp.replaceAll(" ","+").replaceAll(",","").replaceAll("++","+"),
                nombre:  pyme.NombComp,
                direccion1: pyme.Direccion1,
                estado: pyme.Estado
            };
            console.log('peticion ',SCRAPE_URL, pyme.unique);
            axios.post(SCRAPE_URL,pymeInfo);
        });
        resolve({ status: 'success' });
    });
}

module.exports = {
    getDataFromGoogle
}
const getDataFromDynamoDB = async () => {
    await dynamoService
        .getAll('pyme-dataset')
        .then(async (result) => {
            result.Items.forEach((pyme) => {
                let pymeInfo ={
                    processId:'aaaaejemplo1',
                    unique: pyme.unique,
                    type: pyme.type,
                    pyme: pyme.NombComp.replaceAll(" ","+").replaceAll(",","").replaceAll("++","+"),
                    nombre:  pyme.NombComp,
                    direccion1: pyme.Direccion1,
                    estado: pyme.Estado
                };
                console.log('peticion ',SCRAPE_URL, pyme.unique);
                axios.post(SCRAPE_URL,pymeInfo);
            });
        })
        .catch((error) => {
            console.log('error on getAll: ', error)
        })
}

//getDataFromDynamoDB();
//getDataFromGoogle();