#!/usr/bin/env node
var cordovaServer = require("./index");

if (process.argv[2])
	process.chdir(process.argv[2]);

cordovaServer.start(process.env.PORT);
