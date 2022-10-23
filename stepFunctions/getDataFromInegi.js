'use strict'

const dynamoService = require('../services/dynamo')
const AWS = require('aws-sdk')
AWS.config.loadFromPath('./config.json')

//const API_URL = 'http://localhost:3088/inegi-api';
const API_URL = process.env.SCRAPE_URL + '/inegi-api';

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

const processId = 'asdfioweqro2341'

const getDataFromInegi = async (params) => {
  const { Items, processId } = params;

  return new Promise(async (resolve, reject) => {

    Items.forEach((pyme) => {
      let pymeItem = {
        processId,
        unique: pyme.unique,
        type: pyme.type,
        NombComp: pyme.NombComp,
        Direccion1: pyme.Direccion1,
        Colonia: pyme.Colonia,
        MunicipioDel: pyme.MunicipioDel,
        geocoding_lat: pyme.geocoding_lat,
        geocoding_long: pyme.geocoding_long
      }
      axios.post(API_URL, pymeItem)
    });

    resolve({ status: 'success' });
  });
}

module.exports = {
  getDataFromInegi,
}
