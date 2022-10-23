const puppeteer = require("puppeteer");
const dynamoService = require('../services/dynamo')
const AWS = require('aws-sdk')
AWS.config.loadFromPath('./config.json');


exports.run = async (req, res) => {
    console.log('********************** SCRAPE GOOGLE ********************');
    let {pyme, nombre, unique, type, processId } = req.body;

    if(!pyme || !nombre ||!type){
        return res.status(400).json("error en los datos proporcionados pyme, nombre, type");
    }
    let urlTest = `https://www.google.com.mx/maps/search/${pyme}`;
    let urlTest2 = `https://www.google.com/search?q=${pyme}`;
    
    let result;
    try {
        result = await executePuppeteer(urlTest, urlTest2);
    }
    catch(err) {
        console.log(err);
    }
    let params = {
        TableName: "pyme-dataset",
        Key:{
            unique,
            type
        }
    }

    let {Item} = await dynamoService.getItem(params);
    Item.google_score =  result?.google_score;
    Item.google_reviews = result?.google_reviews;
    Item.google_phone = result?.google_phone;

    params ={
        TableName: "pyme-dataset",
        Item
    };
    await dynamoService.addItem(params);
    console.log(Item);
    await dynamoService.addProcessCounter(processId,'googleStep');
    res.json("successfully recorded");
}

const executePuppeteer = async(urlTest,urlTest2)=>{
    const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disabled-setuid-sandbox","--lang=es-MX"],
    });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);
    await page.goto(urlTest);
    await page.waitForTimeout(2000);
    const googleMaps = await page.evaluate(async() => {
        let google_score = document.querySelector('.fontDisplayLarge')?.innerText??'no score';
        let google_reviews = document.querySelector('.rqjGif')?.innerText?? 'no reviews count';
        // let reviews =  Array.from( document.querySelectorAll('.jJc9Ad')).map( el=>{
        //     return {
        //         stars: el.querySelector('.kvMYJc')?.getAttribute('aria-label')?.toString() ?? 'empty',
        //         review: el.querySelector('.wiI7pd').innerHTML.toString()
        //     }
        // } );

        return  {
            google_score,
            google_reviews,
        };
    });

    await page.goto(urlTest2);
    await page.waitForTimeout(2000);
    const googleSearch = await page.evaluate( async() => {
        let phone = Array.from(document.querySelectorAll('.PZPZlf')).map( el =>{
            if( el.innerText.toString().includes('Teléfono')){
                return el.innerText.toString().replace('Teléfono:','').replaceAll(' ','')
            }
        });
        return {
            google_phone: phone.filter( item => item ).join()
        }
    })
    await browser.close()
    return {...googleMaps,...googleSearch};
}