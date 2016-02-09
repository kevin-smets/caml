var assert = require('assert');
var deepExtend = require('deep-extend');
var DotObject = require('dot-object');
var fs = require('fs');
var path = require('path');
var util = require('util');
var yamlJs = require('yaml-js');

var DOT = '.';
var dotObject = new DotObject(DOT);

// Replaces aliases by the block content of the anchors
function replaceAliases(yamlString) {
  var yamlLines = yamlString.split("\n");
  var newYamlLines = [];

  // Strip empty lines and comments
  yamlLines.forEach(function (line) {
    if (line.length > 0 && line.trim().indexOf("#") === -1) {
      newYamlLines.push(line);
    }
  });

  var anchors = [];

  // Find anchors, with their indentation and block content
  newYamlLines.forEach(function (line, index) {
    if (line.indexOf("&") > -1) {
      var anchorName = line.match("&(.*)")[1];

      var me = anchors[anchorName] = {
        indent: line.search(/\S|$/),
        block: []
      };

      // Store the block content
      for (var i = index + 1; i < newYamlLines.length; i++) {
        // when encountering an equal or lower indentation, the block ends
        if (newYamlLines[i].search(/\S|$/) <= me.indent) {
          break;
        }
        me.block.push(newYamlLines[i].replace(/&.*/, ""));
      }
    }
  });

  var finalYamlLines = [];

  // Find aliases and add anchor content
  newYamlLines.forEach(function (line, index) {
    if (line.trim().indexOf("<<: *") == 0) {
      var aliasName = line.trim().replace("<<: *", "");

      /* istanbul ignore else */
      if (anchors[aliasName]) {
        var indentDiff = line.search(/\S|$/) - anchors[aliasName].indent - 2;

        anchors[aliasName].block.forEach(function (blockLine) {
          var str;
          // Shift indentations of the block content
          if (indentDiff > 0) {
            str = new Array(indentDiff + 1).join(' ') + blockLine;
          } else {
            str = blockLine;
            for (var i = 0; i > indentDiff; i--) {
              str = str.replace('  ', ' ');
            }
          }

          finalYamlLines.push(str);
        });
      }
    } else {
      finalYamlLines.push(line);
    }
  });

  return finalYamlLines;
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

    // Down the tree
    if (match && (currentIndent > indent)) {
      if (currentIndent !== 0) {
        fullKey += DOT;
      }
      fullKey += match[0].replace(/:.*/, "");
      if ((currentIndent - indent) > 0) {
        indentSteps.push(currentIndent - indent);
      }
    }

    // Up the tree or peer property
    if (match && (currentIndent <= indent)) {
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

    // We're in a list, simply push the content
    if (line.trim().indexOf("- ") === 0) {
      while (index < yamlLines.length && (yamlLines[index].trim().indexOf("- ") === 0 || yamlLines[index].search(/\S|$/) >= currentIndent)) {
        postLines.push(yamlLines[index]);
        index++;
      }
    } else if (line.trim().match(/.*:/)) {
      postLines.push(line.replace(line.split(":")[0], fullKey));
      indent = currentIndent;
      index++;
    } else {
      postLines.push(line);
      indent = currentIndent;
      index++;
    }
  }
  return postLines;
}

function parse(yamlLines) {
  var yaml = yamlJs.load(yamlLines.join('\n'));
  var result = [{}];

  Object.keys(yaml).forEach(function (key) {
    var value = yaml[key];

    if (value !== null) {
      result.push(dotObject.str(key, value, {}));
    }
  });

  deepExtend.apply(null, result);
  return result[0];
}

function camlize(options) {
  if (!options) {
    return;
  }

  if (options.separator) {
    DOT = options.separator;
    dotObject = new DotObject(DOT);
  }

  // Default dir is the current working dir
  options.dir = options.dir || path.join(process.cwd());
  var yamlString = "";

  options.files.forEach(function (fileName) {
    if (path.isAbsolute(fileName)) {
      yamlString += fs.readFileSync(fileName + ".yml", 'UTF8');
    } else {
      yamlString += fs.readFileSync(path.join(options.dir, fileName + ".yml"), 'UTF8');
    }
  });

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
  replaceAliases: replaceAliases
};
