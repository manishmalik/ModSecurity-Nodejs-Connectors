/*
 * ModSecurity, http://www.modsecurity.org/
 * Copyright (c) 2015 Trustwave Holdings, Inc. (http://www.trustwave.com/)
 *
 * You may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * If any of the files related to licensing are missing or if you have any
 * other questions related to licensing please contact Trustwave Holdings, Inc.
 * directly using the email address security@modsecurity.org.
 *
 * Author: Manish Malik <manishmalikkvs at gmail dot com>
 */

module.exports = connector;
var modsecurity = require('./Modsecurity-nodejs/build/Release/modsecurity');

//For synchronous execution of asynchronous modsec functions
function series(callbacks, last) {
	function next() {
		var callback = callbacks.shift();
		if (callback) {
			callback(function() {
				// results.push(Array.prototype.slice.call(arguments));
				next();
			});
		} else {
			last();
		}
	}
	next();
}

/*
	Constructor for Connector
	@rulesPath : Path to the rules files
	@key : Client key
*/
function connector(key, rulesPath) {

	//Initialize modsecurity APIs
	this.modsec = new modsecurity.ModSecurity();

	//Sets information about the connector utilizing the ModSec.
	this.modsec.setConnectorInformation("ModSecurity-Nodejs-Connectors v0.0.1-alpha (ModSecurity Node.js connector for Express.js)");

	//Instantiate new rules object
	this.rules = new modsecurity.Rules();

	this.debugLog = new modsecurity.DebugLog();

	if ((rulesPath.indexOf('http://') !== -1) || (rulesPath.indexOf('www.') !== -1)) {
		if (key) {
			retVal = this.rules.loadRemote(key, rulesPath);
		} else {
			retVal = this.rules.loadRemote(null, rulesPath);
		}
	} else {
		retVal = this.rules.loadFromUri(rulesPath);
	}
	if (retVal < 0) {
		console.log('Failed to parse the rules : ' + this.rules.getParserError());
	} else {
		console.log('All rules loaded ' + retVal);
	}
}

function processConnection(modsecConnector, req, res, syncNext) {
	//Process Connection
	ret = modsecConnector.modsecTransaction.processConnection(req.connection.remoteAddress, req.connection.remotePort, req.connection.localAddress, req.connection.localPort);
	if (ret) {
		modsecConnector.modsecTransaction.intervention(modsecConnector.modsecIntervention);
		// console.log(modsecConnector.modsecIntervention);
		if (modsecConnector.modsecIntervention.status !== 200) {
			res.status(modsecConnector.modsecIntervention.status).send();
		} else {
			syncNext();
		}
	} else {
		res.status(500).send();
		return new Error("There are some unexpected error while running ModSecurity library");
	}
}

function processURI(modsecConnector, req, res, syncNext) {
	//fetch request URI
	var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	// Process uri
	ret = modsecConnector.modsecTransaction.processURI(fullUrl, req.method, req.httpVersion);
	if (ret) {
		modsecConnector.modsecTransaction.intervention(modsecConnector.modsecIntervention);
		// console.log(modsecConnector.modsecIntervention);
		if (modsecConnector.modsecIntervention.status !== 200) {
			res.status(modsecConnector.modsecIntervention.status).send();
		} else {
			syncNext();
		}
	} else {
		res.status(500).send();
		return new Error("There are some unexpected error while running ModSecurity library");
	}
}

function processRequestHeaders(modsecConnector, req, res, syncNext) {
	// console.log(req.headers);

	Object.keys(req.headers).forEach(function(requestHeader) {
		modsecConnector.modsecTransaction.addRequestHeader(requestHeader, req.headers[requestHeader]);
		// console.log(req.headers[requestHeader]);
	});

	ret = modsecConnector.modsecTransaction.processRequestHeaders();

	if (ret) {
		modsecConnector.modsecTransaction.intervention(modsecConnector.modsecIntervention);
		// console.log(modsecConnector.modsecIntervention);
		if (modsecConnector.modsecIntervention.status !== 200) {
			res.status(modsecConnector.modsecIntervention.status).send();
		} else {
			syncNext();
		}
	} else {
		res.status(500).send();
		return new Error("There are some unexpected error while running ModSecurity library");
	}
}

function processRequestBody(modsecConnector, req, res, syncNext) {
	console.log(JSON.stringify(req.body), JSON.stringify(req.body).length)
	//TODO: Should parse body of non-json type
	modsecConnector.modsecTransaction.appendRequestBody(JSON.stringify(req.body), JSON.stringify(req.body).length);
	ret = modsecConnector.modsecTransaction.processRequestBody();
	if (ret) {
		modsecConnector.modsecTransaction.intervention(modsecConnector.modsecIntervention);
		console.log(modsecConnector.modsecIntervention);
		if (modsecConnector.modsecIntervention.status !== 200) {
			res.status(modsecConnector.modsecIntervention.status).send();
		} else {
			syncNext();
		}
	} else {
		res.status(500).send();
		return new Error("There are some unexpected error while running ModSecurity library");
	}
}

function processResponseHeaders(modsecConnector, req, res, syncNext) {
	// console.log(res.header()._headers);
	Object.keys(res.header()._headers).forEach(function(responseHeader) {
		modsecConnector.modsecTransaction.addResponseHeader(responseHeader, res.header()._headers[responseHeader]);
	});
	console.log(modsecConnector.modsecIntervention.status);
	ret = modsecConnector.modsecTransaction.processResponseHeaders(modsecConnector.modsecIntervention.status, "HTTP " + req.httpVersion);

	if (ret) {
		modsecConnector.modsecTransaction.intervention(modsecConnector.modsecIntervention);
		// console.log(modsecConnector.modsecIntervention);
		if (modsecConnector.modsecIntervention.status !== 200) {
			res.status(modsecConnector.modsecIntervention.status).send();
		} else {
			syncNext();
		}
	} else {
		res.status(500).send();
		return new Error("There are some unexpected error while running ModSecurity library");
	}
}

function processResponseBody(modsecConnector, req, res, syncNext) {
	// console.log(res.body)
	//TODO: Should parse body of non-json type
	modsecConnector.modsecTransaction.appendRequestBody(JSON.stringify(res.body), JSON.stringify(res.body).length);
	
	ret = modsecConnector.modsecTransaction.processResponseBody();
	if (ret) {
		modsecConnector.modsecTransaction.intervention(modsecConnector.modsecIntervention);
		// console.log(modsecConnector.modsecIntervention);
		if (modsecConnector.modsecIntervention.status !== 200) {
			res.status(modsecConnector.modsecIntervention.status).send();
		} else {
			syncNext();
		}	
	} else {
		res.status(500).send();
		return new Error("There are some unexpected error while running ModSecurity library");
	}
}

connector.prototype = {
	constructor: connector,
	reqProcess: function() {
		modsecConnector = this;
		return function(req, res, next) {
			modsecConnector.modsecTransaction = new modsecurity.Transaction(modsecConnector.modsec, modsecConnector.rules, null);
			modsecConnector.modsecIntervention = new modsecurity.ModSecurityIntervention();
			// Request processing		
			series([
				function(syncNext) {
					processConnection(modsecConnector, req, res, syncNext);
				},
				function(syncNext) {
					processURI(modsecConnector, req, res, syncNext);
				},
				function(syncNext) {
					processRequestHeaders(modsecConnector, req, res, syncNext);
				},
				function(syncNext) {
					//check if body exists
					if (Object.keys(req.body).length !== 0) {
						processRequestBody(modsecConnector, req, res, syncNext);
					} else {
						//skip process Body request.
						syncNext();
					}
				}
			], next);
		}
	},
	resProcess: function() {
		modsecConnector = this;
		return function(req, res, next) {
			//Response Processing
			res.on('finish', function() {
				series([
					function(syncNext) {
						/*
						TODO: check before sending the real response.
						if (!res.headersSent) {
							processResponseHeaders(modsecConnector, req, res, syncNext);
						} else {
							syncNext();
						}*/
						processResponseHeaders(modsecConnector, req, res, syncNext);
					},
					function(syncNext) {
						processResponseBody(modsecConnector, req, res, syncNext);
					}
				], next);
				res.status(404);
			});
			next();
		}
	}
}