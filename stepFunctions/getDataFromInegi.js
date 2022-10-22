'use strict'
// const { getQuery } = require('../controllers/utils')

const dynamoService = require('../services/dynamo')
const AWS = require('aws-sdk')
AWS.config.loadFromPath('./config.json')

// DENUE API
const denueHost = 'https://www.inegi.org.mx'
const denueKey = '7dee5796-392e-4760-a332-1a389661817c'

// HTTP Request
var axios = require('axios')

// Comparar nombres
function similarity(s1, s2) {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

function cleanText(str) {
  return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/gi, '').replace('  ', ' ').toUpperCase()
}

const getDataFromInegi = async (pyme) => {
  var formattedURL = `${denueHost}/app/api/denue/v1/consulta/Buscar/todos/${pyme.lat},${pyme.lng}/100/${denueKey}`
  console.log(`FETCHING DATA FROM: ${formattedURL}`)

  var config = {
    method: 'get',
    url: formattedURL,
  }

  axios(config)
    .then(function (response) {
      for (let index = 0; index < response.data.length; index++) {
        const company = response.data[index]
        // Limpiar dataset
        var datasetNombre = cleanText(pyme.NombComp)
        var datasetCalle = cleanText(pyme.Direccion1)
        var datasetColonia = cleanText(pyme.Colonia)
        var datasetColonia = cleanText(pyme.Colonia)
        var datasetMunicipio = cleanText(pyme.MunicipioDel)

        // Limpiar respuesta de INEGI
        var inegiNombre = cleanText(company.Nombre)
        var inegiRazon = cleanText(company.Razon_social)
        var inegiCalle = cleanText(company.Calle)
        var inegiColonia = cleanText(company.Colonia)
        var inegiEstadoMunicipio = cleanText(company.Ubicacion)

        // console.log(`${response.data.length} datos extraidos del INEGI para la PyME: ${datasetNombre}`)
        // Municipio
        // console.log(`Comparando localidad del dataset: ${datasetMunicipio} VS localidad registrada en INEGI: ${inegiEstadoMunicipio}`)
        if (inegiEstadoMunicipio.includes(datasetMunicipio)) {
          // Colonia
          // console.log(`Comparando colonia del dataset: ${datasetColonia} VS colonia registrada en INEGI: ${inegiColonia}`)
          if (inegiColonia == datasetColonia) {
            // Calle
            // console.log(`Comparando calle del dataset: ${datasetCalle} VS calle registrada en INEGI: ${inegiCalle}`)
            if (inegiCalle == datasetCalle) {
              // Nombre o razón social               
              if (similarity(datasetNombre, inegiNombre) > 0.5) {
                console.log(company)
              } else if (similarity(datasetNombre, inegiRazon) > 0.5) {
                console.log(company)
              }
            }
          }
        }
      }
    })
    .catch(function (error) {
      console.log(error)
    })
}

const getDataFromDynamoDB = async () => {
  await dynamoService
    .getAll('pyme-dataset')
    .then(async (result) => {
      result.Items.forEach((pyme) => {
        // console.log(pyme)
        getDataFromInegi(pyme)
      })
    })
    .catch((error) => {
      console.log('error on getAll: ', error)
    })
}

getDataFromDynamoDB()

module.exports = {
  getDataFromInegi,
}
