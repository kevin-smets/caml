#!/usr/bin/env node
var fs = require('fs');
var caml = require('../lib/caml');
var camlUtil = require('../lib/camlUtil');

var first = fs.readFileSync('assets/flow-first.yml', 'utf8');
var second = fs.readFileSync('assets/flow-second.yml', 'utf8');

var out = "";

function add(string) {
  out += string + '\n\n';
}

function addCodeBlock(string) {
  out += '```\n';
  out += string + '\n';
  out += '```\n\n';
}

add('# Flow of CamlYaml');

add('## File sources');

add('`flow-first.yml`');
addCodeBlock(first);

add('`flow-second.yml`');
addCodeBlock(second);

var yaml = first + '\n' + second;
var anchors = camlUtil.retrieveAnchors(yaml);
yaml = camlUtil.stripEmptyLinesAndComments(yaml);
yaml = camlUtil.stripAnchors(yaml);

add('## Strip white lines, comments and anchors');

add('The block content of the anchors has been stored.');

addCodeBlock(yaml);

add('## Replace aliases by the anchor block');

var yamlReplaced = camlUtil.replaceAliases(yaml, anchors);

addCodeBlock(yamlReplaced);

add('## Blow up the hierarchy');

var yamlBlownUp = caml.blowUpHierarchy(yamlReplaced.split('\n')).join('\n');

addCodeBlock(yamlBlownUp);

add('## Parse this to json');

var json = caml.parse(yamlBlownUp.split('\n'));

addCodeBlock(JSON.stringify(json, null, 2));

fs.writeFile('FLOW.md', out);
