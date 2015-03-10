var path = require("path"),
	fs = require("fs"),
	globalNpmInstallsPath = path.join(process.env.npm_config_prefix, "node_modules"),
	cordovaSrcNpmInstallPath = path.join(globalNpmInstallsPath, "cordova/node_modules/cordova-lib/src/cordova");

if (!fs.existsSync(globalNpmInstallsPath) ||
	!fs.existsSync(cordovaSrcNpmInstallPath)) {
	console.log("Ensure that you have installed cordova globally ('npm install cordova -g')\n" +
				"After that try to re-install cordova-server ('npm install cordova-server -g')\n");
	process.exit(0);
}

// set module path and require funcionalities
module.paths.push(globalNpmInstallsPath);
module.paths.push(cordovaSrcNpmInstallPath);

var cordova = require("cordova"),
	lazy_load = require("lazy_load"), // cordovaSrcNpmInstallPath
	platforms = require("platforms"); // cordovaSrcNpmInstallPath


print("grabbing tempate cordova.js...");
var promise = lazy_load.based_on_config("", "android", {});
promise.then(function(lib){
	// TODO replace cordovajs_path with a better approach
	// it is now copied from android_parser.js
	// var parserConttructor = new platforms["android"].parser;
	// Used for creating platform_www in projects created by older versions.
	// android_parser.prototype.cordovajs_path = function(libDir) {
	var cordovajs_path = function(libDir) {
	     var jsPath = path.join(libDir, 'framework', 'assets', 'www', 'cordova.js');
	     return path.resolve(jsPath);
	};
	var templateCordovaJsFile = cordovajs_path(lib);
	print("found cordova.js template file: " + templateCordovaJsFile);
	fs.mkdirSync("www");
	fs.createReadStream(templateCordovaJsFile).pipe(fs.createWriteStream('www/cordova.js'));
	print("done");
});

function print(msg){
	console.log("[cordova-server] " + msg);
}