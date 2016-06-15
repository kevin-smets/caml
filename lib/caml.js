var _ = require('lodash');
var assert = require('assert');
var deepExtend = require('deep-extend');
var DotObject = require('dot-object');
var escape = require('escape-string-regexp');
var fs = require('fs');
var os = require('os');
var path = require('path');
var util = require('util');
var yamlJs = require('yaml-js');

var camlUtil = require('./camlUtil');

var DOT = '.';
var DOT_SUBSTITUTE = '_DOT_';
var dotObject = new DotObject(DOT);

// Replaces aliases by the block content of the anchors
function replaceAliases(yamlLines) {
  yamlLines = camlUtil.stripEmptyLinesAndComments(yamlLines);
  yamlLines = sanitize(yamlLines);

  var anchors = camlUtil.retrieveAnchors(yamlLines);

  Object.keys(anchors).forEach(function (key) {
    anchors[key].block = camlUtil.replaceAliases(anchors[key].block, anchors);
  });

  yamlLines = camlUtil.stripAnchors(yamlLines);
  return camlUtil.replaceAliases(yamlLines, anchors);
}

/**
 * Replaces variables in the Object literal. A variable is in the form ${var.i.able}
 *
 * The following yaml
 *
 * var:
 *   i:
 *     able: 'i am able'
 *
 * will make that ${var.i.able} will be replaced by the value 'i am able'
 *
 * @param yamlLines
 */
function replaceVariables(yamlLines) {
  var regexp = /\${(.*?)}/g;
  var yamlString = yamlLines
    .join('\n')
    .replace(new RegExp(DOT_SUBSTITUTE + DOT_SUBSTITUTE, 'g'), '.'); // Fix raw.dotted.variables

  var match = yamlString.match(regexp);

  if (match) {
    match = _.uniq(match);

    match.forEach(function (key) {
      var objPath = key.replace(regexp, '$1') + ': ';
      var value;

      yamlString.split(/\r?\n/).forEach(function (line) {
        if (line.indexOf(objPath) == 0) {
          value = line.replace(objPath, '');
        }
      });

      if (value) {
        yamlString = yamlString.replace(new RegExp(escape(key), 'g'), value);
      } else {
        console.log("No substitution value found for " + key + ", nothing was replaced.");
      }
    });
  }

  return yamlString.split(/\r?\n/);
}

/**
 * Sanitize yaml keys (remove "" or '' and replace dots by the surrogate)
 *
 * @param yamlLines
 * @returns {Array}
 */
function sanitize(yamlLines) {
  return yamlLines
    .map(function (line) {
      var colonIdx = line.indexOf(':');

      // not an object -> no escaping needed
      if (colonIdx === -1) {
        return line;
      }

      var key = line.slice(0, colonIdx);
      var value = line.slice(colonIdx + 1);
      var quoteMatch;

      while (quoteMatch = key.match(/["']/)) {
        var quote = quoteMatch[0];
        var startIdx = quoteMatch.index;

        var endIdx = key.indexOf(quote, startIdx + 1);

        if (endIdx === -1) {
          throw new Error('Key contains incomplete quoted section: "' + line + '"');
        }

        var quoted = key.slice(startIdx + 1, endIdx);

        if (quoted.match(/['"]/)) {
          throw new Error('Key cannot contain nested quotes: "' + line + '"');
        }

        key = key.slice(0, startIdx)
          + quoted.replace(/\./g, DOT_SUBSTITUTE)
          + key.slice(endIdx + 1);
      }

      key = key.replace(/\./g, DOT_SUBSTITUTE + DOT_SUBSTITUTE);

      return key + ':' + value;
    })
}

/** Writes out the entire hierarchy in YAML
 * a:
 *  b:
 *   c:
 *
 * Becomes:
 *
 * a:
 * a.b:
 * a.b.c:
 *
 * @param yamlLines
 */
function blowUpHierarchy(yamlLines) {
  var fullKey = "";
  var indent = 0;
  var currentIndent = 0;
  var indentSteps = [];
  var postLines = [];

  for (var index = 0; index < yamlLines.length; null) {
    var line = yamlLines[index];

    var match = line.trim().match(".*:");
    currentIndent = yamlLines[index].search(/\S|$/);

    // We're in a list, simply push the content
    if (line.trim().indexOf("- ") === 0) {
      while (index < yamlLines.length && (yamlLines[index].trim().indexOf("- ") === 0 || yamlLines[index].search(/\S|$/) > currentIndent)) {
        postLines.push(yamlLines[index]);
        index++;
      }
      continue;
    }

    // Down the tree
    if (match && (currentIndent > indent)) {
      if (currentIndent !== 0) {
        fullKey += DOT;
      } else {
        fullKey = "";
      }
      fullKey += match[0].replace(/:.*/, "");
      if ((currentIndent - indent) > 0) {
        indentSteps.push(currentIndent - indent);
      }
    }

    // Up the tree or peer property
    if (match && (currentIndent <= indent)) {
      if (currentIndent === 0) {
        fullKey = "";
      }

      var keyArr = fullKey.split(DOT);
      keyArr.pop();

      var steps = 0;
      // Get the number of steps to travel up the hierarchy tree
      while (indent > currentIndent) {
        indent -= indentSteps.pop();
        keyArr.pop();
        steps++;
      }

      fullKey = keyArr.join(DOT);
      if (currentIndent !== 0) {
        fullKey += DOT;
      }
      fullKey += match[0].replace(/:.*/, "");
    }

    if (line.trim().match(/.*:/)) {
      postLines.push(line.replace(line.split(":")[0], fullKey));
    } else {
      postLines.push(line);
    }

    indent = currentIndent;
    index++;
  }
  return postLines;
}

function parse(yamlLines) {
  var yaml = yamlJs.load(yamlLines.join('\n'));
  var result = [{}];

  Object.keys(yaml).forEach(function (key) {
    if (yaml[key] !== null) {
      var obj = {};
      obj[key] = yaml[key];
      result.push(dotObject.object(obj));
    }
  });

  deepExtend.apply(null, result);

  var jsonString = JSON.stringify(result[0]);
  // Fix "enclosed.dotted.variables"
  jsonString = jsonString.replace(new RegExp(DOT_SUBSTITUTE, 'g'), '.');

  return JSON.parse(jsonString);
}

function camlize(options) {
  if (!options) {
    return;
  }

  if (options.separator) {
    dotObject = new DotObject(DOT);
  }

  // Default dir is the current working dir
  options.dir = options.dir || path.join(process.cwd());
  var yamlString = "";

  options.files.forEach(function (fileName) {
    var filePath;

    if (path.isAbsolute(fileName)) {
      filePath = fileName + ".yml";
    } else {
      filePath = path.join(options.dir, fileName + ".yml");
    }

    try {
      yamlString += fs.readFileSync(filePath, 'UTF8');
      yamlString += os.EOL;
    }
    catch (err) {
      console.warn("File " + path.relative(process.cwd(), filePath) + ' not found, ignoring it.');
    }
  });

  // Add overrides to the end of the yaml string
  if (options.overrides) {
    yamlString += options.overrides.join('\n');
  }

  return parse(
    replaceVariables(
      blowUpHierarchy(
        replaceAliases(yamlString.split(/\r?\n/))
      )
    )
  );
}

module.exports = {
  camlize: camlize,
  blowUpHierarchy: blowUpHierarchy,
  parse: parse,
  replaceAliases: replaceAliases,
  sanitize: sanitize
};
