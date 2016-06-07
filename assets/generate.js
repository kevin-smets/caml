#!/usr/bin/env node
"use strict";

var fs = require('fs');
var path = require('path');

var caml = require('../lib/caml');
var camlUtil = require('../lib/camlUtil');

generate('general', 'General flow of CAML');

function generate(name, title){
  var out = "";

  function add(string) {
    out += string + '\n\n';
  }

  function addCodeBlock(string) {
    out += '```\n';
    out += string + '\n';
    out += '```\n\n';
  }

  add('# ' + title);

  add('## File sources');

  var yaml = "";

  fs.readdirSync(path.join(__dirname, 'examples', name)).forEach(function(file){
    add('`' + name + '/' + file + '`');

    var fileYaml = fs.readFileSync(path.join(__dirname, 'examples', name, file), 'utf8');
    yaml += fileYaml + '\n';

    addCodeBlock(fileYaml);
  });

  // var fileYaml = fs.readFileSync(path.join(__dirname, '../test/fixtures/multiDots.yml'), 'utf8');
  // yaml += fileYaml + '\n';
  // addCodeBlock(fileYaml);

  yaml = caml.sanitize(yaml.split(/\r?\n/));

  add('## Sanitize all keys');

  addCodeBlock(yaml.join('\n'));

  var anchors = camlUtil.retrieveAnchors(yaml);
  yaml = camlUtil.stripEmptyLinesAndComments(yaml);
  yaml = camlUtil.stripAnchors(yaml);

  add('## Strip white lines, comments and anchors');

  add('The block content of the anchors will be stored for future use.');

  addCodeBlock(yaml.join('\n'));

  add('## Replace aliases by the anchor block');

  var yamlReplaced = camlUtil.replaceAliases(yaml, anchors);

  addCodeBlock(yamlReplaced.join('\n'));

  add('## Blow up the hierarchy');

  var yamlBlownUp = caml.blowUpHierarchy(yamlReplaced).join('\n');

  addCodeBlock(yamlBlownUp);

  add('## Parse this to json');

  var json = caml.parse(yamlBlownUp.split(/\r?\n/));

  addCodeBlock(JSON.stringify(json, null, 2));

  fs.writeFile(path.join(__dirname, '../examples', name.toUpperCase() + '.md'), out);
}
