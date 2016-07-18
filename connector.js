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

connector.prototype = {
	constructor: connector,
	init: function() {
		modsecConnector = this;
		return function(req, res, next) {
			modsecConnector.modsecTransaction = new modsecurity.Transaction(modsecConnector.modsec, modsecConnector.rules, null);
			modsecConnector.modsecIntervention = new modsecurity.ModSecurityIntervention();
			// console.log('Client ip' + req.connection.remoteAddress + ' port: ' + req.connection.remotePort + ' Server IP: ' + req.connection.localAddress + ' Port: ' + req.connection.localPort);

			//Process Connection
			ret = modsecConnector.modsecTransaction.processConnection(req.connection.remoteAddress, req.connection.remotePort, req.connection.localAddress, req.connection.localPort);
			if (ret) {
				modsecConnector.modsecTransaction.intervention(modsecConnector.modsecIntervention);
				if (modsecConnector.modsecIntervention.status !== 200) {
					res.status(modsecConnector.modsecIntervention.status).send();
				} else {
					next();
				}
			} else {
				res.status(500).send();
				return new Error("There are some unexpected error while running ModSecurity library");
			}
		}
	}
}