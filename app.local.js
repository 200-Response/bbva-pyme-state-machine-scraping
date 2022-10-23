const AWS = require('aws-sdk');
const homedir = require('os').homedir();

const app = require('./app')
const port = 3088

//set env variable to identify local running
process.env.LOCAL_AWSPROFILE = 'bbva2022';
process.env.LOCAL_AWSFILENAME = homedir+'/.aws/credentials';

process.env.CURRENT_API = 'http://localhost:3088';

AWS.config.loadFromPath('./config.json');

app.listen(port);
console.log(`listening on http://localhost:${port}`);

const dynamoService = require('./services/dynamo');

const getDataFromDynamoDB = async () => {

    await dynamoService.getAll('pyme-dataset')
        .then(async result => {
            console.log(result);
        })
        .catch(error => {
            console.log("error on getAll: ",error);
        });
};

getDataFromDynamoDB();