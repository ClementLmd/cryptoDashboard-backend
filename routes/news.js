var express = require('express');
var router = express.Router();

const fetch = require('node-fetch');
const NEWS_API_KEY = process.env.NEWS_API_KEY;

router.get("/", (req, res) => {
    console.log(NEWS_API_KEY);
    fetch(`https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&q=crypto&country=fr&language=en`)

    .then(response => response.json())
    .then(data =>{
        if (data){  console.log(data)
            res.json({result:true,news:data})
        }else {
            res.json({result:false})
        }
        
      
    //     if(data.status === 'ok') {

    //     }
    })
})

module.exports = router;
