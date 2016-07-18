var connector = require('./connector');
var express = require('express');

//calling modsec connector's constructor
var modsec = new connector(null, './basic_rules.conf');

var app = express();

app.use(modsec.init());

app.get('/', function(req, res) {
	// console.log(listener.address());
	res.send('GET request to homepage');
});

listener = app.listen(3000, function() {
	console.log('Example app listening on port 3000!');
});