'use strict';
var json2csv = require('json2csv').parse;
var fs = require('fs');
const dynamoService = require('../services/dynamo')
const s3 = require('../services/s3')
const generateReport = (params) => {

    
    return new Promise(async (resolve, reject) => {

        const { totalRows, processId, Items, key } = params;

        const result = await dynamoService.getAll('pyme-dataset')

        const schema = [
            "unique",
"type",
"Colonia",
"CP",
"data_inegi_centro_comercial",
"data_inegi_CLEE",
"data_inegi_email",
"data_inegi_id",
"data_inegi_numero_de_local",
"data_inegi_numero_empleados",
"data_inegi_razon_social",
"data_inegi_sitio_web",
"data_inegi_telefono",
"data_inegi_tipo_centro_comercial",
"data_inegi_tipo_empresa",
"data_inegi_tipo_establecimiento",
"data_inegi_tipo_vialidad",
"data_mexico_consumo_promedio_de_rama_economica_por_estado_MDP",
"data_mexico_empleados_en_rama_economica_por_estado",
"data_mexico_gasto_total_en_papeleria_en_rama_economica_por_estado_MDP",
"data_mexico_gasto_total_en_publicidad_en_rama_economica_por_estado_MDP",
"data_mexico_gasto_total_en_rama_economica_por_estado_MDP",
"data_mexico_gasto_total_por_consumo_de_agua_en_rama_economica_por_estado_MDP",
"data_mexico_gasto_total_por_consumo_de_bienes_y_servicios_en_rama_economica_por_estado_MDP",
"data_mexico_gasto_total_por_consumo_de_combustible_en_rama_economica_por_estado_MDP",
"data_mexico_gasto_total_por_consumo_de_electricidad_en_rama_economica_por_estado_MDP",
"data_mexico_gasto_total_por_renta_en_rama_economica_por_estado_MDP",
"data_mexico_idEstado",
"data_mexico_ingreso_total_en_rama_economica_por_estado_MDP",
"data_mexico_inversion_total_en_rama_economica_por_estado_MDP",
"data_mexico_produccion_bruta_de_rama_economica_por_estado_MDP",
"data_mexico_remuneraciones_totales_en_rama_economica_por_estado",
"data_mexico_total_ingresos_por_comercializacion_de_bienes_en_rama_economica_por_estado_MDP",
"data_mexico_total_ingresos_por_otros_bienes_y_servicios_en_rama_economica_por_estado_MDP",
"data_mexico_total_ingresos_por_prestacion_de_servicios_en_rama_economica_por_estado_MDP",
"data_mexico_total_ingresos_por_procesamiento_transformacion_materia_prima_propiedad_terceros_en_rama_economica_por_estado_MDP",
"data_mexico_total_ingresos_por_provision_de_bienes_y_servicios_en_rama_economica_por_estado_MDP",
"data_mexico_total_ingresos_por_venta_de_productos_procesados_generados_extraidos_en_rama_economica_por_estado_MDP",
"data_mexico_unidades_economicas_por_estado",
"Direccion1",
"Direccion2",
"Direccion3",
"EntreCalle1",
"EntreCalle2",
"Estado",
"geocoding_lat",
"geocoding_long",
"Index",
"MunicipioDel",
"NombComp",
"Nombre1",
"Nombre2",
"Nombre3",
];

        const resultCSV = await JSON2CSV(result?.Items, schema, 'report.csv');
        
        const csvUrl = await uploadCSVToS3('/tmp/report.csv' , params.bucket, params.client + '/reports/report.csv', params);
         
        const itemProcess = {
            "processId": processId,
            "geocodingStep": 0,
            "googleStep": 0,
            "inegiStep": 0,
            "total": totalRows,
            "fileName": key,
            "status": "finish",
            "csv": csvUrl
        }
        const dynamoParams = {
               TableName: 'process',
               Item: itemProcess
             };
        await dynamoService.addItem( dynamoParams);

        resolve(params);
    });

}

//Functión to create the csv file
function JSON2CSV(data, cliSchema, fileName) {
    var csv = json2csv(data, { fields: cliSchema });
    return new Promise((resolve, reject) => {
        fs.writeFile('/tmp/' + fileName, csv, error => {
            if (error) {
                reject(error);
            }
            // console.log("file created successfully!: "+ fileName +".csv");
            // resolve( uploadSFTP(fileName) );
            resolve(fileName);
        });
    });
};

let uploadCSVToS3 = (filePath, bucket, key, params) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, function (err, file_buffer) {
            if (err) {
                console.log("error");
                reject(err);
            }
            const params_s3 = {
                Bucket: bucket, // pass your bucket name
                Key: key, // file will be saved as testBucket/contacts.csv
                ContentDisposition: 'attachment',
                Body: file_buffer,
                ACL: 'public-read-write'
            };
            s3.upload(params_s3)
                .then((fromRes) => {
                    // let url = "https://"+
                    // bucket+".s3.amazonaws.com/"+
                    // key;
                    let url = "https://s3.amazonaws.com/" +
                        bucket + "/" +
                        key;
                    params.invalidRecordsUrl = url;
                    resolve(url);
                });
        });
    });
}

module.exports = {
    generateReport
}