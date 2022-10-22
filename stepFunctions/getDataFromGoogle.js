'use strict';
const dynamoService = require('../services/dynamo')
const AWS = require('aws-sdk')
AWS.config.loadFromPath('./config.json');

const axios = require('axios');
const SCRAPE_URL = 'http://localhost:3088/scrape-google';

const getDataFromGoogle = (params) => {
    return new Promise(async (resolve, reject) => {
        let resultados = [];
        params.map( async pyme =>{
            //let result = await executePuppeteer(urlTest,urlTest2);
            //console.log({...result,nombre:pyme});
            //resultados.push(result);
            axios.post(SCRAPE_URL,pyme);
        });
        console.log(resultados);
        resolve(params);
    });
}

module.exports = {
    getDataFromGoogle
}
const getDataFromDynamoDB = async () => {
    await dynamoService
        .getAll('pyme-dataset')
        .then(async (result) => {
            let arregloPymes = [];
            result.Items.forEach((pyme) => {
                let pymeInfo ={
                    unique: pyme.unique,
                    type: pyme.type,
                    pyme: pyme.NombComp.replaceAll(" ","+").replaceAll(",","").replaceAll("++","+"),
                    nombre:  pyme.NombComp,
                    direccion1: pyme.Direccion1,
                    estado: pyme.Estado
                };
                arregloPymes.push(pymeInfo);
                console.log('peticion ',SCRAPE_URL, pyme.unique);
                axios.post(SCRAPE_URL,pymeInfo);
            });
        })
        .catch((error) => {
            console.log('error on getAll: ', error)
        })
}

getDataFromDynamoDB();
//getDataFromGoogle();