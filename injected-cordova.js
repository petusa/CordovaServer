// injected by cordova-server
(function() {
	window.navigator = {};
	window.navigator.notification = {};
	window.navigator.notification.alert = function(msg){ console.log("cordova-server (navigator): " + msg); }
	window.prompt = function(argsJson, msg){ console.log("cordova-server (prompt): " + msg + "   |   argsJson: " + JSON.stringify(argsJson)); }
})();
// end of injection
