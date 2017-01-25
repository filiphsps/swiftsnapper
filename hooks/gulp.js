'use strict';
let fs 				= require('fs'),
    path 			= require('path'),
    child_process   = require('child_process');

var rootdir = process.argv[2];
let os = process.platform;

//Run gulp
module.exports = function (context) {
	let Q = context.requireCordovaModule("q");
	var deferred = Q.defer();
	
	const process = child_process.spawn(/^win/.test(os) ? 'gulp.cmd' : 'gulp', [], {
		stdio: 'inherit',
		shell: true
	});

	process.on('close', (code) => {
		if(code == 0)
			return deferred.resolve();
		else
			return deferred.reject(code);
	});

	return deferred.promise;
}