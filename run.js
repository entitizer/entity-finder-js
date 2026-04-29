'use strict';

const finder = require('./lib');

const argv = process.argv.slice(2);

if (argv.length < 2) {
  console.error('Usage: node run.js <lang> <name> [optionsJson]');
  process.exit(1);
}

const lang = argv[0];
let name = argv[1];
let options = {};

if (argv.length > 2) {
  options = JSON.parse(argv[2]);
}

if (name.startsWith('"') && name.endsWith('"')) {
  name = name.slice(1, -1);
}

console.log('Finding for', name);

finder
  .findTitles(name, lang, options)
  .then((titles) => {
    console.log(titles.map((item) => item.title));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
