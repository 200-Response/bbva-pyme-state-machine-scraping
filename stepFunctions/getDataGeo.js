'use strict'

const dynamoService = require('../services/dynamo')
const AWS = require('aws-sdk')
AWS.config.loadFromPath('./config.json')
const axios = require('axios');

//const API_URL = 'http://localhost:3088/geocoding-api';


const getDataGeo = (params) => {
  const API_URL = process.env.CURRENT_API + '/geocoding-api';

  const { Items, processId } = params;

  return new Promise(async (resolve, reject) => {

    let apiCalls = [];

    Items.forEach(async (pyme) => {
      var encodedAddress = encodeURI(
        pyme.Direccion1 +
        ' ' +
        pyme.Direccion2 +
        ' ' +
        pyme.MunicipioDel +
        ' ' +
        pyme.CP
      )

      let pymeItem = {
        processId,
        pymeUnique: pyme.unique,
        pymeType: pyme.type,
        direccion: encodedAddress
      }

      apiCalls.push( axios.post(API_URL, pymeItem) );

    })

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

      for(let index = 0; index < response.length; index++) {
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

    resolve(params);

  });
}

module.exports = {
  getDataGeo
}
