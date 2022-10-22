// 
const dynamoService = require('../services/dynamo')
const AWS = require('aws-sdk')
AWS.config.loadFromPath('./config.json')

// Google Geocoding API
const geocodingAPIURL = 'https://maps.googleapis.com'
const geocodingAPIKey = 'AIzaSyCzTiY7xVDePozKZL0lx9YTNXEaZHMk15k'


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

exports.geocoding = async (req, res) => {
    let { direccion, pymeUnique, pymeType, processId } = req.body

    var formattedURL = `${geocodingAPIURL}/maps/api/geocode/json?address=${direccion}&key=${geocodingAPIKey}`

    var config = {
        method: 'get',
        url: formattedURL,
    }

    let params = {
        TableName: "pyme-dataset",
        Key: {
            unique: pymeUnique,
            type: pymeType
        }
    }

    let { Item } = await dynamoService.getItem(params);

    axios(config)
        .then(function (response) {
            let lat = response.data.results[0].geometry.location.lat
            let long = response.data.results[0].geometry.location.lng

            Item.geocoding_lat = lat
            Item.geocoding_long = long

            params = {
                TableName: "pyme-dataset",
                Item
            };

            dynamoService.addItem(params)
            dynamoService.addProcessCounter(processId, 'geocodingStep');
        })
        .catch(function (error) {
            console.log(error)
        })
}

exports.denue = async (req, res) => {
    var { processId, unique, type, NombComp, Direccion1, Colonia, MunicipioDel, geocoding_lat, geocoding_long } = req.body    
    var formattedURL = `${denueHost}/app/api/denue/v1/consulta/Buscar/todos/${geocoding_lat},${geocoding_long}/100/${denueKey}`
    console.log(`FETCHING DATA FROM: ${formattedURL}`)

    var config = {
        method: 'get',
        url: formattedURL,
    }

    let params = {
        TableName: "pyme-dataset",
        Key: {
            unique,
            type
        }
    }

    let { Item } = await dynamoService.getItem(params);

    axios(config)
        .then(function (response) {
            for (let index = 0; index < response.data.length; index++) {

                const company = response.data[index]
                // Limpiar dataset
                var datasetNombre = cleanText(NombComp)
                var datasetCalle = cleanText(Direccion1)
                var datasetColonia = cleanText(Colonia)
                var datasetMunicipio = cleanText(MunicipioDel)

                // Limpiar respuesta de INEGI
                var inegiNombre = cleanText(company.Nombre)
                var inegiRazon = cleanText(company.Razon_social)
                var inegiCalle = cleanText(company.Calle)
                var inegiColonia = cleanText(company.Colonia)
                var inegiEstadoMunicipio = cleanText(company.Ubicacion)

                // Municipio        
                if (inegiEstadoMunicipio.includes(datasetMunicipio)) {
                    // Colonia          
                    if (inegiColonia == datasetColonia) {
                        // Calle            
                        if (inegiCalle == datasetCalle) {
                            // Nombre o razón social               
                            if (similarity(datasetNombre, inegiNombre) > 0.75 || similarity(datasetNombre, inegiRazon) > 0.75) {

                                Item.data_inegi_CLEE = company.CLEE
                                Item.data_inegi_id = company.Id
                                Item.data_inegi_razon_social = inegiRazon
                                Item.data_inegi_tipo_empresa = company.Clase_actividad
                                Item.data_inegi_numero_empleados = company.Estrato
                                Item.data_inegi_tipo_vialidad = company.Tipo_vialidad
                                Item.data_inegi_telefono = company.Telefono
                                Item.data_inegi_tipo_establecimiento = company.Tipo
                                Item.data_inegi_email = company.Correo_e
                                Item.data_inegi_sitio_web = company.Sitio_internet
                                Item.data_inegi_centro_comercial = company.CentroComercial
                                Item.data_inegi_tipo_centro_comercial = company.TipoCentroComercial
                                Item.data_inegi_numero_de_local = company.NumLocal

                                params = {
                                    TableName: "pyme-dataset",
                                    Item
                                };

                                dynamoService.addItem(params)
                                dynamoService.addProcessCounter(processId, 'inegiStep');
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