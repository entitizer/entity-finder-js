'use strict';

var finder = require('./lib');

var argv = process.argv.splice(2);
var lang = argv[0];
var name = argv[1];
var options = {};
if (argv.length > 2) {
	options = JSON.parse(argv[2]);
}
if (name[0] === '"') {
	name = name.substr(1);
	name = name.substr(0, name.length - 1);
}

console.log('Finding for', name);

finder.findTitles(name, lang, options)
	.then(function (titles) {
		console.log(titles.map(item => item.title));
	});
