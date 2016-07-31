var connector = require('./connector');
var express = require('express');
var bodyParser = require('body-parser')

//calling modsec connector's constructor
var modsec = new connector(null, './basic_rules.conf');

var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
	extended: false
}));
// parse application/json
app.use(bodyParser.json());

app.use(modsec.reqProcess());
app.use(modsec.resProcess());

app.get('/', function(req, res) {
	res.set({
		'Random': Math.random(),
		'ETag': '12345'
	});
	res.body = {
		a:12,
		b:"WFM",
		c:"random1"
	}
	res.send('GET request to homepage');
});

app.post('/test', function(req, res) {
	res.send('POST request to /test');
});

listener = app.listen(3000, function() {
	console.log('Example app listening on port 3000!');
});