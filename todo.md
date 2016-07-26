#TODO:
The following are the known issues with this connectors:
 - [ ] Only `json` based `req.body` supported:
 		Currently only those request with the header `"Content-Type":"application/json"` are supported. All the `req.body` other than `json` format are discarded or have unstable/unexpected behaviour.