const data = require('./speech-to-text.json');


let text = ``
console.log(data);
data.results.forEach(result => {

    text = text + result.alternatives?.[0].transcript + "\n";
});

console.log('Fulltext: ', text);