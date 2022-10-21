const dynamoService = require('./services/dynamo');

const getDataFromDynamoDB = () => {

    await dynamoService.getAll('pyme-dataset')
        .then(async result => {
            console.log(result);
        })
        .catch(error => {
            console.log(error);
        });
};