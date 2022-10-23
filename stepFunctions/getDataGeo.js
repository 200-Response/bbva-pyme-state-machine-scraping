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

      //apiCalls.push(
        try {
          axios.post(API_URL, pymeItem)
        } catch (error) {
          console.log(error);
        }
        //);

    })

    /*try {
      await Promise.all(apiCalls);
    }
    catch(err) {
      console.log(err);
    }
    */

    resolve(params);

  });
}

module.exports = {
  getDataGeo
}
