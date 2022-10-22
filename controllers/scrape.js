



const puppeteer = require("puppeteer");


exports.run = async (req, res) => {
    console.log(req.body);
    let {pyme, nombre, unique } = req.body;
    if(!pyme || !nombre){
        return res.status(400).json("error en los datos proporcionados");
    }
    let urlTest = `https://www.google.com.mx/maps/search/${pyme}`;
    let urlTest2 = `https://www.google.com/search?q=${pyme}`;
    let result = await executePuppeteer(urlTest, urlTest2);
    result = {...result,pyme,nombre, unique};
    console.log(result);
    res.json(result);
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
        let score = document.querySelector('.fontDisplayLarge')?.innerText??'no score';
        let reviewsCount = document.querySelector('.rqjGif')?.innerText?? 'no reviews count';
        let reviews =  Array.from( document.querySelectorAll('.jJc9Ad')).map( el=>{
            return {
                stars: el.querySelector('.kvMYJc')?.getAttribute('aria-label')?.toString() ?? 'empty',
                review: el.querySelector('.wiI7pd').innerHTML.toString()
            }
        } );

        return  {
            score,
            reviewsCount,
            reviews,
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
            phone: phone.filter( item => item ).join()
        }
    })
    await browser.close()
    return {...googleMaps,...googleSearch};
}