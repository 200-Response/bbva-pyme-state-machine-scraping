'use strict';
const AWS = require('aws-sdk')
//AWS.config.loadFromPath('./config.json');

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

    let response

    try {
      response = await Promise.all(apiCalls);
      console.log(response);
    }
    catch(err) {
      console.log(err);
    }

    try {
      let updatedItemms = [];

      for(let index = 0; index < response?.length; index++) {
        const element = response[index];
        if (element?.data?.Item) {
          updatedItemms.push(element?.data?.Item);
        }
      }

      params.Items = updatedItemms?.length ? updatedItemms : params.Items;
    }
    catch(err) {
      console.log(err);
    }

        resolve({ status: 'success' });
    });
}

module.exports = {
    getDataFromGoogle
}
