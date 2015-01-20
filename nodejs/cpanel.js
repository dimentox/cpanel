
var net = require('net'); 
var Q = require('q');
var xml2js = require('xml2js');

var liveApi = function() {
	var self = this;
	this.isConnected = false;
	this.sockfile = process.env.CPANEL_PHPCONNECT_SOCKET;
	this.queue = [];
	console.log("init");
	this.def = Q.defer();
	this.def.resolve(true);

};


liveApi.prototype.end = function(callback) {
	var self = this;
	console.log("end called");
	self.isConnected = false;
	var deferred = Q.defer();
	deferred.promise.nodeify(callback);
		self.send('<cpanelxml shutdown="1" />').then(function(){
			self.client.once('data', function(data) { 
					deferred.resolve(true);
					process.exit(0);
				});
			
		});
	
    return deferred.promise;

}
liveApi.prototype.connect = function(callback) {
	console.log("connect called");
	var self = this;
	var deferred = Q.defer();
	deferred.promise.nodeify(callback);
	if (!self.isConnected)
	{
		self.client = net.createConnection({path: self.sockfile, allowHalfOpen: false}, function() {
			console.log("connected");
			self.client.setNoDelay(true);
			self.isConnected = true;
		
			self.send('<cpaneljson enable="1">').then(function(){
				console.log("setup data sent");
				self.client.once('data', function(data) { 
					deferred.resolve(true);
				});
				
			});
		});
	} else {
		deferred.resolve(true);
	}
	
	
    return deferred.promise;
};
liveApi.prototype.send = function(code, callback) {
	var self = this;
	var deferred = Q.defer();
	deferred.promise.nodeify(callback);
	self.client.write((code.length) + "\n" + code, function() {
		deferred.resolve(true);
	});
	return deferred.promise;
};


liveApi.prototype.execWork = function(code, callback) {
	var self = this;
	console.log("exec called: " + code);
	
	var deferred = Q.defer();
	deferred.promise.nodeify(callback);

	self.connect().then(function() {

	self.client.once('data', function(data) {
			console.log("rec data callback:" + data.toString());
			var parser = new xml2js.Parser({charsAsChildren: true, ignoreAttrs: true, charkey: 'data'});
			parser.parseString(data, function (err, result) {
				if (err != undefined)
				{
					console.log("parse fail");

					deferred.reject(err);
					

				} else {
					console.log("parse ok");
					var ob = result.cpanelresult;
					if(typeof(ob) == "string")
					{
						ob = JSON.parse(result.cpanelresult);
					}
					
					if (ob.cpanelresult != undefined)
					{
						ob = ob.cpanelresult;
					}
					if(ob.error != undefined && ob.data != undefined)
					{
						ob.data = JSON.parse(ob.data);
						if(ob.data.cpanelresult != undefined)
						{
							ob = ob.data.cpanelresult;
						}
					}
					
					deferred.resolve(ob);
					
				}
			});

		});

		self.client.write((code.length) + "\n" + code, function() {
		console.log("wrote data: "+ code);
		

	});
});


	return deferred.promise;
};


liveApi.prototype.run = function() {
	var self = this;
	
	var next = self.queue.pop();
			if(next)
			{
						
					
			var deferred = next[1];
			var code = next[0];
			var task = Q.defer();
			self.def = task;
			self.execWork(code).then(function(data) {
					deferred.resolve(data);
					self.run();
				});
		} else {
			self.def.resolve(true);
		}
};
liveApi.prototype.exec = function(code) {
	var self = this;
	console.log("Exec request: " + code);
	var deferred = Q.defer();

	if (self.def.promise.isFulfilled())
	{
		
		console.log("no que");
		self.queue.push([code, deferred]);
		self.run();
		
	} else {
		console.log("que");
		self.queue.push([code, deferred]);
	}
	
	return deferred.promise;
	
};


liveApi.prototype.fetch = function(input, callback) {

	var self = this;
	var deferred = Q.defer();
	deferred.promise.nodeify(callback);
	var query = self.exec('<cpanel print="' + input + '">');
	deferred.resolve(query);
	return deferred.promise;
};

liveApi.prototype.api = function(reqtype, version, module, func, apiargs, callback)
{
	var self = this;
	var deferred = Q.defer();
	
	
	var input = {"module": module, "reqtype" : reqtype, "func": func, "apiversion":version};
	
	if (Array.isArray(apiargs)) {
		input.args = apiargs;
	}
	
	var code = "<cpanelaction>\n" + JSON.stringify(input) + "\n</cpanelaction>";
	
	
	var query = self.exec(code);
	deferred.resolve(query);
	return deferred.promise;
}

liveApi.prototype.api1 = function(module, func, apiargs, callback) {

	var self = this;
	var deferred = Q.defer();
	deferred.promise.nodeify(callback);
	var query = self.api('exec', 1, module, func, apiargs);
	deferred.resolve(query);
	return deferred.promise;
};

liveApi.prototype.api2 = function(module, func, apiargs, callback) {

	var self = this;
	var deferred = Q.defer();
	deferred.promise.nodeify(callback);
	var query = self.api('exec', 2, module, func, apiargs);
	deferred.resolve(query);
	return deferred.promise;
};

liveApi.prototype.api3 = function(module, func, apiargs, callback) {

	var self = this;
	var deferred = Q.defer();
	deferred.promise.nodeify(callback);
	var query = self.api('exec', 3, module, func, apiargs);
	deferred.resolve(query);
	return deferred.promise;
};

liveApi.prototype.uapi = function(module, func, apiargs, callback) {

	var self = this;
	var deferred = Q.defer();
	deferred.promise.nodeify(callback);
	var query = self.api('exec', 'uapi', module, func, apiargs);
	deferred.resolve(query);
	return deferred.promise;
};






module.exports = liveApi;