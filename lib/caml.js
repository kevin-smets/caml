var assert = require('assert');
var deepExtend = require('deep-extend');
var dot = require('dot-object');
var fs = require('fs');
var path = require('path');
var util = require('util');
var yamlJs = require('yaml-js');

// Replaces aliases by the block content of the anchors
function replaceAliases(yamlString) {
  var yamlLines = yamlString.split("\n");
  var newYamlLines = [];

  // Strip empty lines
  yamlLines.forEach(function (line) {
    if (line.length > 0) {
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
        me.block.push(newYamlLines[i]);
      }
    }
  });

  var finalYamlLines = [];

  // Find aliases and add anchor content
  newYamlLines.forEach(function (line, index) {
    if (line.match(/<<: \*/)) {
      // TODO make * consuming in some way instead of replace
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
  var key = "";
  var indent = 0;
  var currentIndent = 0;
  var indentSteps = [];
  var postLines = [];

  for (var index = 0; index < yamlLines.length; index++) {
    var line = yamlLines[index];
    // Skip empty lines
    if (line.trim().length === 0) {
      continue;
    }

    var match = line.trim().match(".*:");
    currentIndent = yamlLines[index].search(/\S|$/);

    // Down the tree
    if (match && (currentIndent > indent)) {
      if (currentIndent !== 0) {
        key += '.';
      }
      key += match[0].replace(/:.*/, "");
      if ((currentIndent - indent) > 0) {
        indentSteps.push(currentIndent - indent);
      }
    }

    // Up the tree or peer property
    if (match && (currentIndent <= indent)) {
      var keyArr = key.split('.');
      keyArr.pop();

      var steps = 0;
      // Get the number of steps to travel up the hierarchy tree
      while (indent > currentIndent) {
        indent -= indentSteps.pop();
        keyArr.pop();
        steps++;
      }

      key = keyArr.join('.');
      if (currentIndent !== 0) {
        key += '.';
      }
      key += match[0].replace(/:.*/, "");
    }

    if (line.match(/.*:/)) {
      postLines.push(line.replace(/.*:/, key + ':'));
    } else {
      postLines.push(line);
    }

    indent = currentIndent;
  }
  return postLines;
}

function parse(yamlLines) {
  var yaml = yamlJs.load(yamlLines.join('\n'));
  var result = [{}];

  Object.keys(yaml).forEach(function (key) {
    var value = yaml[key];

    if (value) {
      result.push(dot.str(key, value, {}));
    }
  });

  deepExtend.apply(null, result);
  return result[0];
}

function camlize(options) {
  if (!options) {
    return;
  }
  // Default dir is the current working dir
  options.dir = options.dir || path.join(process.cwd());
  var yamlString = "";

  options.files.forEach(function (fileName) {
    if(path.isAbsolute(fileName)) {
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
