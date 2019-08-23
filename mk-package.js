var p = require('./package.json');
delete p.scripts;
delete p.devDependencies;
p.main='index.js';
p.types='index.d.ts';
console.log(JSON.stringify(p,undefined,2));
