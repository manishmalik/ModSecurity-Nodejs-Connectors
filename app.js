var modsecurity = require('./Modsecurity-nodejs/build/Release/modsecurity');
console.log(modsecurity.ModSecurity.whoAmI());