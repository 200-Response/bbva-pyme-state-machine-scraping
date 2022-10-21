'use strict';

const {
  delay
} = require('./controllers/utils');

exports.cronTrigger = async (event, context, callback) => {
  
  const controller = require('./controllers/mainController.js');
  console.log("start:cronTrigger()");
  const response = {
    send(){ callback() }
  }
  await controller.run({}, response);
  console.log("end:cronTrigger()");
  
  return {};
};

exports.getDataGeo = (event) => {
  console.log('method:getDataGeo()');
  return new Promise((resolve, reject) => {
    console.log('method:getDataGeo():step:executing:getDataGeo');
    
    const { getDataGeo } = require(`./stepFunctions/getDataGeo`);
    
    return getDataGeo(event)
      .then(async (fromResolve) => {
        console.log('method:getDataGeo():finish');
        //await delay(5000);
        resolve(event);
      })
      .catch(err => {
        console.log('method:getDataGeo():error:', err);
        console.error(err);
        reject(err);
      });
  });
}

exports.getDataFromInegi = (event) => {
  console.log('method:getDataFromInegi()');
  return new Promise((resolve, reject) => {
    console.log('method:getDataFromInegi():step:executing:getDataFromInegi');
    
    const { getDataFromInegi } = require(`./stepFunctions/getDataFromInegi`);
    
    return getDataFromInegi(event)
      .then(async (fromResolve) => {
        console.log('method:getDataFromInegi():finish');
        //await delay(5000);
        resolve(event);
      })
      .catch(err => {
        console.log('method:getDataFromInegi():error:', err);
        console.error(err);
        reject(err);
      });
  });
}

exports.getDataFromGoogle = (event) => {
  console.log('method:getDataFromGoogle()');
  return new Promise((resolve, reject) => {
    console.log('method:getDataFromGoogle():step:executing:getDataFromGoogle');
    
    const { getDataFromGoogle } = require(`./stepFunctions/getDataFromGoogle`);
    
    return getDataFromGoogle(event)
      .then(async fromResolve => {
        console.log('method:getDataFromGoogle():finish');
        //await delay(5000);
        resolve(event);
      })
      .catch(err => {
        console.log('method:getDataFromGoogle():error:', err);
        console.error(err);
        reject(err);
      });
  });
}

exports.generateReport = (event) => {
  console.log('method:generateReport()');
  return new Promise((resolve, reject) => {
    console.log('method:generateReport():step:executing:generateReport');
    
    const { generateReport } = require(`./stepFunctions/getDataFromGoogle`);
    
    return generateReport(event)
      .then(async fromResolve => {
        console.log('method:generateReport():finish');
        //await delay(5000);
        resolve(event);
      })
      .catch(err => {
        console.log('method:generateReport():error:', err);
        console.error(err);
        reject(err);
      });
  });
}

exports.fallback = (event) => {
  console.log('method fallback');
  console.log(event);
  return new Promise((resolve, reject) => {
    console.log('step fallback executing');
    let stepFunctionErrorAlert = null;
    stepFunctionErrorAlert = require(`./stepFunctions/fallback`);

    //return the promise
    return stepFunctionErrorAlert.fallback(event)
      .then(fromResolve => {
        console.log('finish error alert');
        resolve(event);
      })
      .catch(err => {
        console.error(err);
        reject(err);
      });

  });
}

