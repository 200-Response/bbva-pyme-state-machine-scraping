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

// Data Mexico API
const dataMexicoHost = 'https://api.datamexico.org'

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

    await axios(config)
        .then(async function (response) {
            let lat = response?.data?.results[0]?.geometry?.location?.lat
            let long = response?.data?.results[0]?.geometry?.location?.lng

            Item.geocoding_lat = lat
            Item.geocoding_long = long

            params = {
                TableName: "pyme-dataset",
                Item
            };

            await dynamoService.addItem(params)
            await dynamoService.addProcessCounter(processId, 'geocodingStep');
        })
        .catch(function (error) {
            console.log(error)
        })
    res.send({ status: "success"});
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

    await axios(config)
        .then(async function (response) {
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

                                await dynamoService.addItem(params)
                                await dynamoService.addProcessCounter(processId, 'inegiStep');
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

exports.dataMexico = async (req, res) => {
    var { processId, unique, type, CLEE, estado } = req.body

    if (!CLEE == '') {
        // Extraer el Industry Group
        let industryGroup = String(CLEE).substring(5, 9)

        var formattedURL = `${dataMexicoHost}/tesseract/data.jsonrecords?Industry+Group=${industryGroup}&cube=inegi_economic_census&drilldowns=Industry+Group%2CState&locale=es&measures=Economic+Unit%2CTotal+Gross+Production%2CIntermediate+Consumption%2CTotal+Investment%2CTotal+Expenses%2CTotal+Income%2CTotal+Employees+Depends+on+the+Economic+Unit%2CTotal+Remuneration%2CTotal+Salary+of+Production%3B+Sales+and+Services+Employees%2CTotal+Salary+of+Administrative%3B+Accounting+and+Management+Salaried+Employees%2CTotal+Expenses+for+Consumption+of+Goods+and+Services%2CConsumption+of+Fuels%3B+Lubricants+and+Energy+for+the+Operation+of+Machinery%3B+Equipment+and+Vehicles%2CElectricity+Consumption%2CRent+and+Lease+of+Movable+and+Immovable+Property%2CExpenses+for+Consumption+of+Stationery+and+Office+Supplies%2CAdvertising+Expenses%2CWater+Consumption%2CTotal+Income+for+Supplying+Goods+and+Services%2CRevenue+from+Commercialization+of+goods%2CRevenue+from+the+Provision+of+Professional%3B+Scientific+and+Technical+Services%2CRevenue+from+Sales+of+Processed%3B+Generated+or+Extracted+Products%2COther+Revenue+for+Providing+Goods+and+Services%2CRevenue+from+the+Processing+or+Transformation+of+Raw+Materials+Owned+by+Third+Parties&parents=false&sparse=false`

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
        // console.log(`CONSULTANDO DATA MEXICO ----- ${formattedURL}`)
        axios(config)
            .then(function (response) {
                if (response.status == 200) {
                    let dataMexico = response.data.data
                    if (estado != '') {
                        if (estado == 'CDMX') {
                            estado = 'CIUDAD DE MEXICO'
                        }
                        dataMexico.forEach(dmPyme => {
                            // console.log(`Estado from dataset ${cleanText(estado)}`)
                            // console.log(`Estado from Data Mexico ${cleanText(dmPyme.State)}`)
                            // console.log(similarity(cleanText(dmPyme.State), cleanText(estado)))

                            if (similarity(cleanText(dmPyme.State), cleanText(estado)) > 0.75) {
                                Item.data_mexico_idEstado = dmPyme['State ID']
                                Item.data_mexico_unidades_economicas_por_estado = dmPyme['Economic Unit']
                                Item.data_mexico_produccion_bruta_de_rama_economica_por_estado_MDP = dmPyme['Total Gross Production']
                                Item.data_mexico_consumo_promedio_de_rama_economica_por_estado_MDP = dmPyme['Intermediate Consumption']
                                Item.data_mexico_inversion_total_en_rama_economica_por_estado_MDP = dmPyme['Total Investment']
                                Item.data_mexico_gasto_total_en_rama_economica_por_estado_MDP = dmPyme['Total Expenses']
                                Item.data_mexico_ingreso_total_en_rama_economica_por_estado_MDP = dmPyme['Total Income']
                                Item.data_mexico_empleados_en_rama_economica_por_estado = dmPyme['Total Employees Depends on the Economic Unit']
                                Item.data_mexico_remuneraciones_totales_en_rama_economica_por_estado = dmPyme['Total Remuneration']
                                Item.data_mexico_gasto_total_por_consumo_de_bienes_y_servicios_en_rama_economica_por_estado_MDP = dmPyme['Total Expenses for Consumption of Goods and Services']
                                Item.data_mexico_gasto_total_por_consumo_de_combustible_en_rama_economica_por_estado_MDP = dmPyme['Consumption of Fuels; Lubricants and Energy for the Operation of Machinery; Equipment and Vehicles']
                                Item.data_mexico_gasto_total_por_consumo_de_electricidad_en_rama_economica_por_estado_MDP = dmPyme['Electricity Consumption']
                                Item.data_mexico_gasto_total_por_renta_en_rama_economica_por_estado_MDP = dmPyme['Rent and Lease of Movable and Immovable Property']
                                Item.data_mexico_gasto_total_en_papeleria_en_rama_economica_por_estado_MDP = dmPyme['Expenses for Consumption of Stationery and Office Supplies']
                                Item.data_mexico_gasto_total_en_publicidad_en_rama_economica_por_estado_MDP = dmPyme['Advertising Expenses']
                                Item.data_mexico_gasto_total_por_consumo_de_agua_en_rama_economica_por_estado_MDP = dmPyme['Water Consumption']
                                Item.data_mexico_total_ingresos_por_provision_de_bienes_y_servicios_en_rama_economica_por_estado_MDP = dmPyme['Total Income for Supplying Goods and Services']
                                Item.data_mexico_total_ingresos_por_comercializacion_de_bienes_en_rama_economica_por_estado_MDP = dmPyme['Revenue from Commercialization of goods']
                                Item.data_mexico_total_ingresos_por_prestacion_de_servicios_en_rama_economica_por_estado_MDP = dmPyme['Revenue from the Provision of Professional; Scientific and Technical Services']
                                Item.data_mexico_total_ingresos_por_venta_de_productos_procesados_generados_extraidos_en_rama_economica_por_estado_MDP = dmPyme['Revenue from Sales of Processed; Generated or Extracted Products']
                                Item.data_mexico_total_ingresos_por_otros_bienes_y_servicios_en_rama_economica_por_estado_MDP = dmPyme['Other Revenue for Providing Goods and Services']
                                Item.data_mexico_total_ingresos_por_procesamiento_transformacion_materia_prima_propiedad_terceros_en_rama_economica_por_estado_MDP = dmPyme['Revenue from the Processing or Transformation of Raw Materials Owned by Third Parties']

                                params = {
                                    TableName: "pyme-dataset",
                                    Item
                                };

                                dynamoService.addItem(params)
                                dynamoService.addProcessCounter(processId, 'dataMexicoStep');
                            }
                        })
                    }
                }
            })
            .catch(function (error) {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    // console.log(error.response.data);
                    // console.log(error.response.status);
                    // console.log(error.response.headers);
                    return
                } else if (error.request) {
                    // The request was made but no response was received
                    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                    // http.ClientRequest in node.js
                    console.log(`Error request ${error.request}`);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.log('Error', error.message);
                }
            })

    }

}