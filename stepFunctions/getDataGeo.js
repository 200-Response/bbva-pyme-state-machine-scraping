'use strict'

// const { google } = require('googleapis')
// const scopes = 'https://www.googleapis.com/auth/analytics.readonly'
// const snsService = require('../services/sns')
// const { sendSNS } = require('../controllers/utils')
// let service_account = {}

const dynamoService = require('../services/dynamo')

const AWS = require('aws-sdk')
AWS.config.loadFromPath('./config.json')

// Google Geocoding API
const geocodingAPIURL = 'https://maps.googleapis.com'
const geocodingAPIKey = 'AIzaSyCzTiY7xVDePozKZL0lx9YTNXEaZHMk15k'

// HTTP Request
const https = require('https')

const getDataFromGeocoding = async (pyme) => {
  var encodedAddress = encodeURI(
    pyme.Direccion1 +
      ' ' +
      pyme.Direccion2 +
      ' ' +
      pyme.MunicipioDel +
      ' ' +
      pyme.CP
  )

  https
    .get(
      `${geocodingAPIURL}/maps/api/geocode/json?address=${encodedAddress}&key=${geocodingAPIKey}`,
      (resp) => {
        let data = ''
        // A chunk of data has been received.
        resp.on('data', (chunk) => {
          data += chunk
        })

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
          var jsonPymes = JSON.parse(data)
          console.log(jsonPymes.results[0].geometry.location)
        })
      }
    )
    .on('error', (err) => {
      console.log('Error: ' + err.message)
    })
}

const getDataFromDynamoDB = async () => {
  await dynamoService
    .getAll('pyme-dataset')
    .then(async (result) => {
      //   console.log(result.Items)
      result.Items.forEach((pyme) => {
        getDataFromGeocoding(pyme)
      })
      //   return result
    })
    .catch((error) => {
      console.log('error on getAll: ', error)
    })
}

getDataFromDynamoDB()

// const getDataGeo = (params) => {
//   return new Promise(async (resolve, reject) => {
//     // la lògica va aquì
//     const pymes = dataset.getDataFromDynamoDB()
//     pymes.forEach((pyme) => {
//       console.log(pyme)
//     })
//     resolve(params)
//   })
// }

// module.exports = {
//   getDataGeo,
// }
