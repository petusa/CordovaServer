#!/usr/bin/env node

exportLiveServerStaticServer(); // ugly hack as for temp solution to export live-server's staticServer

var liveServer = require('live-server'),
	xmlParser = require('xml2js'),
	fs = require("fs"),
	path = require("path"),
	url = require('url'),
	send = require('send');

var originalStaticServer = liveServer.staticServer; // save original static server function
liveServer.staticServer = function(root) { 
	if (!isCordova(root)) {
		// use original static server always if not cordova
		return originalStaticServer(root);
	} else { 
		// replace static server to cordova capable server that may fallback to original static server:
		return cordovaCapableServer(root, originalStaticServer);
	}
}; 

/**
 * Start a cordova-server at the given port and directory
 * It uses the same parameters as live-server, as it actually launches
 * the live-server start function, with the extended/replaced static server
 * functionality
 * @param port {number} Port number (default 8080)
 * @param directory {string} Path to root directory (default to cwd)
 * @param suppressBrowserLaunch
 */
module.exports.start = liveServer.start; // delegate to live-server start



var INJECTABLES = {}; // per module/per source files
var INJECTED_CORDOVA_HELPERS_CODE = require('fs').readFileSync(__dirname + "/injected-cordova.js", "utf8"); // helper methods addition into cordova.js

// cordova capable server serves files depending wheteher it is cordova related JS or other regular e.g. html, css, js files
// it is a senchalabs.connect middleware
function cordovaCapableServer(root, fallbackServer){

	traversePlugins(root); // find all plugins for cordova project -> intitiates INJECTABLES associative array

	return function(req, res, next) {
		if ('GET' != req.method && 'HEAD' != req.method) return next();

		var reqpath = url.parse(req.url).pathname,
			x = path.extname(reqpath),
			name = path.basename(reqpath),
			injectable = INJECTABLES[path.normalize(reqpath.substr(1))];
		
		// extend cordova.js with helpers
		if (name === "cordova.js") {
			// console.log("The main cordova.js file served with helpers and latest plugins modules.");
			send(req, reqpath, { root: root })
				.on('stream', function(stream){
					// generate cordova_plugins.js content and inject it into cordova.js				
					var cordovaPluginsJS = generateCordovaPluginsModuleDefinitionCode();

					// we need to modify the length given to browser
					var len = INJECTED_CORDOVA_HELPERS_CODE.length + cordovaPluginsJS.length + res.getHeader('Content-Length');
					res.setHeader('Content-Length', len);
					
					// Write the injected code
					// -> write the helpers to the start of the response
					res.write(INJECTED_CORDOVA_HELPERS_CODE);	
					// -> write the cordova_plugins.js content to the end of the response
					stream.on("end", function(){
						res.write(cordovaPluginsJS);
					});
				})
				.pipe(res);
		} 
		
		// inject cordova module definition block parts for cordova plugin js files
		else if (x === ".js" && injectable){ //  && path.normalize(reqpath).toString().startsWith("/plugins")
			console.log("Cordova plugin js source file (" + name + ") served as a Cordova module.");
			send(req, reqpath, { root: root })
				.on('stream', function(stream){
					// We need to modify the length given to browser
					var len = injectable.firstLine.length + injectable.lastLine.length + res.getHeader('Content-Length');
					res.setHeader('Content-Length', len);
					// Write the injected code
					// -> to the start of the response
					res.write(injectable.firstLine);
					// -> to the end of the response
					stream.on("end", function(){
						res.write(injectable.lastLine);
					});
				})
				.pipe(res);

		// use fallback server for all other files
		} else {
			return fallbackServer(root)(req, res, next);
		}
	};
}

// traverses the plugins folder to extract js-module information and saves them per corresponding source files
// in the INJECTABLES associative array which information will be used later while serving those files
function traversePlugins(root){
	
	INJECTABLES = {};

	var pluginsFolderPath = path.join(root, "plugins");
	
	walk(   pluginsFolderPath, 
			function(file){ return file.endsWith("plugin.xml"); }, 
			function(err, results) {
				if (err) return;
				// console.dir(results);
				results.forEach(function(pluginFile){
					console.log("Processing plugin: " + path.dirname(path.relative(pluginsFolderPath, pluginFile)).blue);
					fs.readFile(pluginFile, function(err, data) {
						xmlParser.parseString(data, function (err, result) {
							
							var pluginId = result["plugin"]["$"]["id"],
								jsModules = result["plugin"]["js-module"]; // its an array
							
							jsModules.forEach(function(module){
								
								var moduleSrc = module["$"]["src"],
									moduleName = pluginId + "." + module["$"]["name"],
									fileName = path.join("plugins", pluginId, moduleSrc),
									clobbersTargets = (module["clobbers"]!==undefined)?module["clobbers"].map(function(clobber){
										return clobber["$"]["target"];
									}):[];
								
								INJECTABLES[fileName] = {
							 		"firstLine": "//injected by cordova-server\ncordova.define('" + moduleName + "', function(require, exports, module) {\n//end of injection\n\n",
							 		"lastLine":"\n\n//injected by cordova-server\n});\n//end of injection\n",
									"moduleExports": function(){
										var info = {
											file: "../" + fileName,
											id: moduleName,
											clobbers: clobbersTargets
										};
										return info.join("\n"); // JSON.stringify(info);
									}
								};
								// INJECTABLES[path.join("www", fileName)] = INJECTABLES[fileName];
								// cordova.define("<MODULE NAME>", function(require, exports, module) {
								// 		<ORIGINAL CODE>
								// });		
			
							});
						}); // end of> xmlParser.parseString
					});
				}); // end of> results.forEach
			}
	); // end of> walk

}

// helper that walks through a directory recursively and reports the set of files mathcing the includedFn conditon
// matched file entries are returned asynchronously via the 'done' callback.
function walk(dir, includedFn, done) {
	var results = [];
	fs.readdir(dir, function(err, list) {
		if (err)
			return done(err);
		var i = 0;
		(function next() {
			var file = list[i++];
			if (!file)
				return done(null, results);
			file = path.resolve(dir + "/" + file);
			fs.stat(file, function(err, stat) {
				if (stat && stat.isDirectory()) {
					walk(file, includedFn, function(err, res) {
						results = results.concat(res);
						next();
					});
				} else if (includedFn(file)) {
					results.push(file);
					next();
				} else {
					next();
				}
			});
		})();
	});
}

// code for generating cordova_plugins.js content based on the available plugins
var INJECTED_CORDOVA_PLUGINS_CODE = require('fs').readFileSync(__dirname + "/injected-cordova_plugins.js", "utf8"); // cordova_plugins.js content generation into cordova.js
function generateCordovaPluginsModuleDefinitionCode(){
	var moduleExports = [];
	INJECTABLES.forEach(function(o, a){
		moduleExports.push(o.moduleExports());
	});

	// adding cordova_plugins.js content	
	var returnString = INJECTED_CORDOVA_PLUGINS_CODE.replace("module.exports = [];","module.exports = [" + moduleExports.join(",\n") + "];\n");

	// TODO
	// INJECTED_CORDOVA_PLUGINS_CODE.replace("module.exports.metadata = {};","use(LiveServer.staticServer");    
	return returnString;
}

// hack to export live-server's staticServer object in the corresponding index.js files
function exportLiveServerStaticServer(){
	var path = require('path');
	_oldLoader = require.extensions['.js'];
	require.extensions['.js'] = function(mod, filename) {
		if (filename == path.resolve(path.dirname(module.filename), 'node_modules/live-server/index.js')) {
			var content = require('fs').readFileSync(filename, 'utf8');
			content = content.replace("use(staticServer","use(LiveServer.staticServer");
			content += "LiveServer.staticServer = staticServer;\n";
			mod._compile(content, filename);
		} else {
			_oldLoader(mod, filename);
		}
	};
}

//****************//
// HELPER METHODS //
//****************//

// adding endsWith to String
if (typeof String.prototype.endsWith != 'function') {
	String.prototype.endsWith = function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
}

// adding startsWith to String
if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function (str){
		return this.indexOf(str) == 0;
	};
}

// helper for iterating through an associative array
if (typeof Object.prototype.forEach != 'function') {
	Object.prototype.forEach = function (cb){
		for(var index in this) { 
			if (this.hasOwnProperty(index)) {
				var attr = this[index];
				if (cb!==undefined) cb(attr, index);
			}
		}
	};
}

// helper to format an associative array similarly to Array.prototype.join
if (typeof Object.prototype.join != 'function') {
	Object.prototype.join = function (str){
		var result = "{";
		result += str;
		this.forEach(function(o, a){
			result += "\t" + a + " : " + JSON.stringify(o) + "," + str;
		});
		result += "}";
		return result;
	};
}

// helper to check whether the directory contains a cordova project
function isCordova(directory){
	if (fs.existsSync(path.join(directory, "config.xml"))){
		// TODO, check config XML, is it a cordova project
		console.log("Found Cordova project config file.");
		return true;
	} else {
		return false;
	}
}