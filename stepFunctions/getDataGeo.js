'use strict'

const dynamoService = require('../services/dynamo')
const AWS = require('aws-sdk')
AWS.config.loadFromPath('./config.json')
const axios = require('axios');

//const API_URL = 'http://localhost:3088/geocoding-api';
const API_URL = process.env.SCRAPE_URL + '/geocoding-api';

const processId = 'asdfioweqro2341'

const getDataFromDynamoDB = async () => {
  await dynamoService
    .getAll('pyme-dataset')
    .then(async (result) => {
      result.Items.forEach((pyme) => {
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
        axios.post(API_URL, pymeItem)
      })
    })
    .catch((error) => {
      console.log('error on getAll: ', error)
    })
}

getDataFromDynamoDB()
