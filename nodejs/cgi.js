
http = require('http');
util = require('util');

Object.defineProperty(global, '__stack', {
  get: function(){
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack){ return stack; };
    var err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
  }
});

Object.defineProperty(global, '__line', {
  get: function(){
    return __stack[1].getLineNumber();
  }
})

process.on('uncaughtException', function(error)
{
	var htmlError = '<br/><div style="color:red"><b>EXCEPTION</b>: ' + error.message + '<i><pre>' + error.stack + '</pre></i></div></br>';
	process.stdout.write(htmlError);
	process.stderr.write(error.message + "\n" + error.stack);
	process.exit(1);

});
var Request = function() {
	this.method = process.env['REQUEST_METHOD'];
	this.headers = {
		'host': process.env['HTTP_HOST'],
		'user-agent': process.env['HTTP_USER_AGENT']
	};
	this.url = process.env['REQUEST_URI'];
};

var Response = function() {
	this.buffered = true;
	this.headerBuffer = "";
	this.buffer = "";
	this.wroteHeaders = false;
	this.complete = false;
};
Response.prototype.writeHead = function(status, reason, headers) {
	var self = this;

	if (typeof reason != 'string') {
		headers = reason;
		reason = http.STATUS_CODES[status] || 'unknown';
	}

	self.headerBuffer += 'Status: ' + status + ' ' + reason + "\n";

	var field, value;
	var keys = Object.keys(headers);
	var isArray = (headers instanceof Array);

	for (var i = 0, l = keys.length; i < l; i++) {
		var key = keys[i];

		if (isArray) {
			field = headers[key][0];
			value = headers[key][1];
		} else {
			field = key;
			value = headers[key];
		}

		self.headerBuffer += field + ": " + value + "\n";
	}
};
Response.prototype.write = function(message) {
	var self = this;
	
	if (message) {
		self.buffer += message;
	} 
	if (!self.buffered)
	{
		
		self.flush();
	}
};
Response.prototype.writeLine = function(message) {
	var self = this;
	
	if (message) {
		self.write(message);
	} 
	self.write("\n");
};

Response.prototype.flush = function() {
	var self = this;
	
	if (!self.headerBuffer.length && !self.wroteHeaders)
	{
		console.log("adding html default header");
		self.writeHead(200, {'Content-Type': 'text/html'});
	}
	if(!self.wroteHeaders)
	{
		console.log("Sending headers..")
		process.stdout.write(self.headerBuffer);
		process.stdout.write("\n");
		self.wroteHeaders = true;
		console.log("headers sent");
	}
	process.stdout.write(self.buffer);
	self.buffer = "";
	if(self.complete)
	{
		process.exit(0);
	}
};

Response.prototype.end = function() {
	var self = this;
	
	self.complete = true;
	self.flush();
};
	


var Server = function() {
	this.request = new Request();
	this.response = new Response();

	this.listen = function(listener) {
		listener(this.request, this.response);
	};
};


global.console = console;
global.console.log = function(){};

var CGI = {
	server : Server,
	cs: function(text, arr){ 
		/*
		{ bold: [ 1, 22, [length]: 2 ],
		  italic: [ 3, 23, [length]: 2 ],
		  underline: [ 4, 24, [length]: 2 ],
		  inverse: [ 7, 27, [length]: 2 ],
		  white: [ 37, 39, [length]: 2 ],
		  grey: [ 90, 39, [length]: 2 ],
		  black: [ 30, 39, [length]: 2 ],
		  blue: [ 34, 39, [length]: 2 ],
		  cyan: [ 36, 39, [length]: 2 ],
		  green: [ 32, 39, [length]: 2 ],
		  magenta: [ 35, 39, [length]: 2 ],
		  red: [ 31, 39, [length]: 2 ],
		  yellow: [ 33, 39, [length]: 2 ] }
		*/


		if (!arr)
	{
		arr = "white";
	}
			var start = "";
			var end = "";
			var esc = function(s) { return "\033[" + s +"m" ;}
			
			if(typeof(arr) == 'object') { //Array/Hashes/Objects 
				for(var item in arr) {
					var value = arr[item];
						start += esc(util.inspect.colors[value][0]);
						end += esc(util.inspect.colors[value][1]);
					}
			}else {
				start += esc(util.inspect.colors[arr][0]);
				end += esc(util.inspect.colors[arr][1]);
			}
			return start + text + end;
		},
	dumper : function (d, depth) {
		var self = this;
		return util.inspect(d, { showHidden: true, depth: depth, colors:true });
		
	},
	util: {
		sLength: function(str) {
			var self = this;
			
			return self.strip(str).length;
		},
		strip: function (str) {
			return str.replace(/(?:(?:\u001b\[)|\u009b)(?:(?:[0-9]{1,3})?(?:(?:;[0-9]{0,3})*)?[A-M|f-m])|\u001b[A-M]/g, '');
		},
		lenToChar: function(len, ch) 
		{
			
			var ob = "";
			for(i = 0; i < len;i++)
			{
				ob += ch;
			}
			return ob;
		}
	},
	dumpHeader : function() {
		var self = this;
		
		var date =  new Date();
		date.toLocaleDateString();
		var left = self.cs("---(", "white") + self.cs("*", "blue") +  self.cs(")", "white");
		var leftMid = self.cs('[', "blue") + self.cs(date.toLocaleDateString(), ["bold", "cyan"] )+ self.cs(']', "blue");
		var mid =  self.cs(__stack[0], ["yellow", "inverse", "bold", "underline", "italic"]);
		var rightMid = self.cs('[', "blue") + self.cs( date.toLocaleTimeString() , ["bold", "cyan"] )+ self.cs(']', "blue");
		var right = self.cs("(", "white") + self.cs("*", "blue") +  self.cs(")---", "white");
		return left + leftMid + mid + rightMid + right + "\n";
	},
	dumpFooter : function() {
		var self = this;
		var header = self.dumpHeader();
		var len = self.util.sLength(header);
		return "\n"+ self.util.lenToChar(len, "-") + "\n";
	},

	__debug: false,
	__console: console,
	debug: function(enable) {
		var self = this;
		if (enable == undefined)
		{
			return self.__debug;
		}
		if (enable && !self.__debug)
		{
			self.__console = console;
			global.console = console;
			global.console.log = function(d) {
				var header = self.dumpHeader().toString();
				var footer = self.dumpFooter().toString();
				process.stderr.write(header);
				process.stderr.write(self.dumper(d));
				process.stderr.write(footer);
			};
			console.log("Debug enabled!");
			self.__debug = true;
		} 
		
		if (!enable && self__debug)
		{
			console.log("Debug disabled!");	
			global.console = self.__console;
			self.__debug = false;
		}
		
		return self.__debug;
	}, 
	json: {
	   replacer: function(match, pIndent, pKey, pVal, pEnd) {
		var self = this;
		  var key = '<span class=json-key>';
		  var val = '<span class=json-value>';
		  var str = '<span class=json-string>';
		  var r = pIndent || '';
		  if (pKey)
			 r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
		  if (pVal)
			 r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
		  return r + (pEnd || '');
		  },
		prettyPrint: function(obj) {
		  var self = this;
		  var ob = "";
		  if (typeof(obj) == 'string')
		  {
			
			obj = JSON.parse(obj);
			ob = JSON.stringify(obj, null, 3);
		  } else {
			ob = JSON.stringify(obj, null, 3);
		  }
		  var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
			ob
			 .replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
			 .replace(/</g, '&lt;').replace(/>/g, '&gt;')
			 .replace(jsonLine, self.replacer);
			return '<pre><code>' + ob + '</pre></code>';
			 
		  },
		style: function() {
			var ob = "";
			ob ='<style>'+ 
				'pre {'+
				'   background-color: ghostwhite;'+
				'   border: 1px solid silver;'+
				'   padding: 10px 20px;'+
				'   margin: 20px; '+
				'   }'+
				'.json-key {'+
				'   color: brown;'+
				'   }'+
				'.json-value {'+
				'  color: navy;'+
				'  }'+
				'.json-string {'+
				'   color: olive;'+
				'   }'+
				'</style>'
			return ob;
			
		}
	  }
	
	
	
	
};

module.exports = CGI;



