'use strict';

var finder = require('./lib');

var argv = process.argv.splice(2);
var lang = argv[0];
var name = argv[1];
if (name[0] === '"') {
	name = name.substr(1);
	name = name.substr(0, name.length - 1);
}

console.log('name', name);

return finder.find(name, lang).then(function(entities) {
	console.log(entities);
});
