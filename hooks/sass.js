var fs = require('fs');
var path = require('path');
var sass = require('node-sass');
var postcss = require('postcss');

var rootdir = process.argv[2];

module.exports = function (context) {
	Q = context.requireCordovaModule("q");
	var deferred = Q.defer();

	sass.render({
		file: 'scss/base.scss',
		outFile: 'www/css/app.css',
		outputStyle: 'compressed',

	}, function (err, result) {
		if (err)
			return deferred.reject(err);
			
		fs.writeFile('www/css/app.css', result.css, function (err) {
		    if (err)
		        return deferred.reject(err);
			
		    return deferred.resolve();

		    /*postcss([require('autoprefixer'), require('cssnano')])
				.process(result.css)
				.then(function (res) {
				    fs.writeFileSync('www/css/app.css', res.css, function (err) {
				        if (err)
				            return deferred.reject(err);

				        return deferred.resolve();
				    });
				});*/
		});
	});

	return deferred.promise;
}