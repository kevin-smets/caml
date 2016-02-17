var assert = require('assert');
var deepExtend = require('deep-extend');
var DotObject = require('dot-object');
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
function replaceAliases(yamlString) {
  yamlString = camlUtil.stripEmptyLinesAndComments(yamlString);
  yamlString = sanitize(yamlString);

  var anchors = camlUtil.retrieveAnchors(yamlString);

  Object.keys(anchors).forEach(function (key) {
    anchors[key].block = camlUtil.replaceAliases(anchors[key].block.join('\n'), anchors).split('\n');
  });

  yamlString = camlUtil.stripAnchors(yamlString);
  yamlString = camlUtil.replaceAliases(yamlString, anchors);

  return yamlString.split('\n');
}

/**
 * Sanitize yaml keys (remove "" or '' and replace dots by the surrogate)
 *
 * @param yamlString
 * @returns {*}
 */
function sanitize(yamlString) {
  var yaml = yamlString.split('\n');
  var yamlLinesSanitized = [];

  yaml.forEach(function (line) {
    var match = line.trim().match(/[",'].*\..*[",']:/);
    if (match) {
      var substituted = line.replace(match[0],
        match[0]
          .replace(/[",']/g, '')          // Strip " or ' from the keys
          .replace(/\./g, DOT_SUBSTITUTE) // Replace . by DOT_SUBSTITUTE in "" keys
      );

      yamlLinesSanitized.push(substituted);
    } else {
      yamlLinesSanitized.push(line)
    }
  });

  return yamlLinesSanitized.join('\n');
}

/** Write out the entire hierarchy in YAML
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
    // Skip empty lines and comments
    if (line.trim().length === 0 || line.trim().indexOf("#") > -1) {
      continue;
    }

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
    blowUpHierarchy(
      replaceAliases(yamlString)
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
