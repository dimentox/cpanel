#!/usr/local/cpanel/3rdparty/nodejs/bin/node

//require the cgi lib.
var cgi = require('./cgi');
var Q = require('q');

var liveApi = require('./cpanel.js'); 
var server;
var request;
var response;
	
function doWork(api)
{

	return Q.allSettled([
		api.exec('<cpanel Branding="file(local.css)">')
		.then(function(data)  
		{
			response.writeLine(cgi.json.prettyPrint(data)); 
		}),
		api.exec('<cpanel print="cow">')
		.then(function(data) 
		{ 
			response.writeLine(cgi.json.prettyPrint(data)); 
		}),
		api.api1('print', '', ['hog'])
		.then(function(data) 
		{
			response.writeLine(cgi.json.prettyPrint(data)); 
		}),
		api.api2('Email','listpopswithdisk', [{'api2_paginate' :1, 'api2_paginate_start' : 1, 'api2_paginate_size': 10, "acct":1}])
		.then(function(data) 
		{
			response.writeLine(cgi.json.prettyPrint(data)); 
		}),
		//fail
		api.api2('Emailsad','listpopswithdisksad', [{'api2_paginate' :1, 'api2_paginate_start' : 1, 'api2_paginate_size': 10, "acct":1}])
		.then(function(data) 
		{
			response.writeLine(cgi.json.prettyPrint(data)); 
		})
	
	]);

	
}
cgi.debug(true);
server = new cgi.server();

server.listen(function(req, res) {
	var api = new liveApi();
	request = req;
	response = res;
	response.buffered = false;
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.writeLine("<html><head></head><body>");
	response.writeLine(cgi.json.style());

	
	doWork(api).then(function() {
		console.log("work done");
		response.writeLine("</body></html>");
		api.end();
		response.end();
	});
	
});

 
