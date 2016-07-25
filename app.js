var connector = require('./connector');
var express = require('express');
var bodyParser = require('body-parser')

//calling modsec connector's constructor
var modsec = new connector(null, './basic_rules.conf');

var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use(modsec.init());

app.get('/', function(req, res) {
	// console.log(listener.address());
	res.send('GET request to homepage');
});

app.post('/test', function(req,res){
	res.send('POST request to /test');
});

listener = app.listen(3000, function() {
	console.log('Example app listening on port 3000!');
});