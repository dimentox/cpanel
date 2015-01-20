# CPANEL LIVE API

Extra Live API Libs and such for CPANEL.

## What's here

* Python LiveAPI
* NodeJS LiveAPI
* NodeJS Install How To.

# Python
***
>CPANEL Supports Python out of the box but it is missing the actual LiveAPI library. 
### Installation
 - Copy the cpanel.py lib to your ui directory.
    - Example: /usr/local/cpanel/base/frontend/x3/mymodule
 - Create the index.live.py file or what ever as you would with LiveAPI PHP.

_Example index.live.py_
```sh
import sys, os, socket, cpanel, pprint,json, cgi, cgitb 

print "Content-type: text/plain\n\n"
form = cgi.FieldStorage()
pprint.pprint(form)
headers = form.headers
pprint.pprint(headers['content-type'])
pprint.pprint(json.loads(form.value))

api = cpanel.LiveAPI()

data = api.api2("CustInfo", "displaycontactinfo")
pprint.pprint(data)

pprint.pprint(api.api1("NVData", "set", ['bob','blahh2']))

pprint.pprint(api.cpanelprint("$NVDATA{'bob'}"))

pprint.pprint(api.api2("NVData", "set", {"names":"bob2", "bob2": "test"}))

pprint.pprint(api.cpanelprint("$NVDATA{'bob2'}"))
```

# NodeJS
***
> NodeJS is not supported by CPANEL for live api. However we can make use of LiveCGI
> to wrap NodeJS into working.
> I have created a LiveAPI library to use and a CGI module / wrapper. However installing this will require root permissions and some time.
> If you don't know command line I do not suggest using this.

### Installation

Install NodeJS binary from the main site.

_For example 64 bit centos http://nodejs.org/dist/v0.10.35/node-v0.10.35-linux-x64.tar.gz_

We need to install nodejs to `/usr/local/cpanel/3rdparty`
```sh
$ cd /usr/local/cpanel/3rdparty
$ wget http://nodejs.org/dist/v0.10.35/node-v0.10.35-linux-x64.tar.gz
$ tar -zxvf node-v0.10.35-linux-x64.tar.gz
$ mv node-v0.10.35-linux-x64 nodejs
```

Next we need to symlink the node_modules directory to the frontend base dir `/usr/local/cpanel/base`

```sh
$ ln -s /usr/local/cpanel/3rdparty/nodejs/lib/node_modules  /usr/local/cpanel/base/node_modules
```

Now we need a few modules installed
- q
- xml2js

```sh
$ /usr/local/cpanel/3rdparty/nodejs/bin/npm install -g xml2js
$ /usr/local/cpanel/3rdparty/nodejs/bin/npm install -g q
```
Now all we need to do is copy the LiveAPI library and the CGI library to your frontend module directory and create our live file as usual.
with *one* exception.  since we can not modify `cpsrvd` we will need to name the file example: `index.live.cgi` and modify the shebang line to use nodejs.

_Example nodejs live api file_

```js
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
```

# License
***

WGADDWYW License
> WGADDWYW - Who gives a damn do what ever you want.

# Liability

*DONT* come to me if these break stuff or what ever... 
# `Use at your own risk!`
***

# Other

Yeah the code could be better this was just a quick test and get these things done.

The Python LIVE api was ported line for line (and yeah the way they parse is *ewww*) to ensure it worked the exact same as the LivePHP script did.
	
The NodeJS one was a GitErDone thing also so feel free to make these production ready, modify or what ever.





