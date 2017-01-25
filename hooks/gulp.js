/*

    	 Se almighty gulp hook!
	================================
	   Ge can thank this hook fore
	   brengan freod to se galaxy
	   be handling se mierce force
	   that is opening an terminal
	   ac flowan se gulp command.
	
				^
	That is supposeed to be old english,
	the translator didn't work that well..
	shhh...
*/

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