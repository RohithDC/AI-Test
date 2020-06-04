const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const axios = require('axios');
const asyncMiddleware = require('./helper/asyncMiddleware');
const fs = require('fs').promises;
const apiKEY = 'dict.1.1.20170610T055246Z.0f11bdc42e7b693a.eefbde961e10106a4efa7d852287caa49ecc68cf';
let endPoint = 'https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key='+apiKEY+'&lang=en-en&text='
//let endPoint = 'https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=dict.1.1.20170610T055246Z.0f11bdc42e7b693a.eefbde961e10106a4efa7d852287caa49ecc68cf&lang=en-en&text=time'
const fetchData = 'http://norvig.com/big.txt';

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', asyncMiddleware(async(req, res)=> {
        let content = ''
        if (req.query.online !== undefined && req.query.online == 'true') {
        	let fileData = await axios.get(fetchData);
        	content = fileData.data;
        } else {
        	content =  await fs.readFile('big.txt', 'utf8');
    	}

    	let endStr = content.indexOf('Retrieved from');
        content = content.substring(0, endStr);
        let wordsCount = countWords(content);
        let data = [];
        let error = '';
		for(let word in wordsCount) {
			let url = endPoint + word;
			try{
				let wordResult = await axios.get(url);
				wordResult = wordResult.data.def;
				if (wordResult.length) {
					let node = {};
					let synPos = getSynPos(wordResult);
					node['Word'] = word;
					node['Count of Occurrence in that Particular Document'] = wordsCount[word];
          node['Synonyms'] = synPos.synonyms;
					node['Pos'] =  synPos.pos;
					data.push(node);
				}
			} catch(e) {
				error =  e.response.data.message;
				break;
		 	}
		}
		res.render('index', {data: data, wordsCount: wordsCount, error: error});

}));

function countWords(str) {
   str = str.replace(/(^\s*)|(\s*$)|(\*)/gi,"");
   str = str.replace(/[ ]{2,}/gi," ");
   str = str.replace(/\n/g," ").replace(/!/g,"").replace(/-/g," ").replace(/,/g," ").replace(/{/g," ").replace(/}/g," ").replace(/}/g," ");

   let strArray = str.split(' ');
   let filterArray = [];
   let result = {};
   	for(let element of strArray) {
   		element = element.replace(/"/g, '');
   		let len = element.toString().trim().length;
   		if ( len > 0) {
   			filterArray.push(element);
   		}
   	}
   	let counts = {};
	for (let i = 0; i < filterArray.length; i++) {
	    counts[filterArray[i]] = 1 + (counts[filterArray[i]] || 0);
	}

	let sortable = [];
	for (let txt in counts) {
	    sortable.push([txt, counts[txt]]);
	}

	sortable.sort(function(a, b) {
	    return b[1] - a[1];
	});

	let results = {};
    let top_10_words = sortable.slice(0, 10);
    for (let tp of top_10_words) {
    	results[tp[0]] = tp[1];
    }
	return results;
}


function getSynPos(data) {
	let resultText = [];
	let resultPos = [];
	let txtData = data[0].tr;
	if (txtData.length) {
		for (let txt of txtData) {
			if (txt.syn !== undefined) {
				for (let node of txt.syn) {
					resultText.push(node.text);
					resultPos.push(node.pos);
				}
			}
			if(txt.mean !== undefined) {
				for (let node of txt.mean) {
					resultText.push(node.text);
				}
			}
			if (txt.text !== undefined) {
				resultText.push(txt.text);
				resultPos.push(txt.pos);
			}

		}
	}
	let result = {
		synonyms: resultText.length ? resultText.filter(getUniqueOnly).join(', ') : '',
		pos: resultPos.length ? resultPos.filter(getUniqueOnly).join(', ') : ''
	}
	return result;
}

function getUniqueOnly(value, index, self) {
    return self.indexOf(value) === index;
}

app.listen(port, function() {
    console.log('Node app listening on port '+ port);
});
