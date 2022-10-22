const AWS = require('aws-sdk')

AWS.config.loadFromPath('./config.json')

const dynamoService = require('./services/dynamo')

const getDataFromDynamoDB = async () => {
  await dynamoService
    .getAll('pyme-dataset')
    .then(async (result) => {
      console.log(result)
      return result
    })
    .catch((error) => {
      console.log('error on getAll: ', error)
    })
}

getDataFromDynamoDB()
