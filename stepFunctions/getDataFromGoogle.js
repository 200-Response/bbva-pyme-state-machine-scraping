'use strict';
const AWS = require('aws-sdk')
AWS.config.loadFromPath('./config.json');

const axios = require('axios');

const getDataFromGoogle = (params) => {

    //const SCRAPE_URL = 'http://localhost:3088/scrape-google';
    const SCRAPE_URL = process.env.CURRENT_API + '/scrape-google';
    // const SCRAPE_URL = 'http://estadiototal.com:3088/scrape-google';
//    params:{ Items: [{unique:'asfasdf'},{type:'asdfad'},{nombre:''}]}
    const { Items, processId } = params;

    let apiCalls = [];

    return new Promise(async (resolve, reject) => {
        Items.forEach((pyme) => {
            let pymeInfo ={
                processId,
                unique: pyme.unique,
                type: pyme.type,
                pyme: pyme.NombComp?.replaceAll(" ","+")?.replaceAll(",","")?.replaceAll("++","+"),
                nombre:  pyme.NombComp,
                direccion1: pyme.Direccion1,
                estado: pyme.Estado
            };
            console.log('peticion ',SCRAPE_URL, pyme.unique, pyme.type);
            apiCalls.push(axios.post(SCRAPE_URL,pymeInfo));
        });

        try {
            await Promise.all(apiCalls);

        }
        catch(err){
            console.log(err);
        }

        resolve({ status: 'success' });
    });
}

module.exports = {
    getDataFromGoogle
}
