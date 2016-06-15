/**
 * Strips empty lines and comments from a given array of YAML lines.
 *
 * @param yamlLines
 * @returns {Array}
 */
module.exports.stripEmptyLinesAndComments = function (yamlLines) {
  var strippedLines = [];

  yamlLines.forEach(function (line) {
    if (line.trim().length > 0 && line.trim().indexOf("#") === -1) {
      strippedLines.push(line);
    }
  });

  return strippedLines;
};

/**
 * Strips anchors from a given array of YAML lines.
 *
 * @param yamlLines
 * @returns {Array}
 */
module.exports.stripAnchors = function (yamlLines) {
  var strippedLines = [];

  yamlLines.forEach(function (line) {
    if (line.indexOf(": &") > -1) {
      strippedLines.push(line.replace(line.match(/&.*/)[0], ""));
    } else {
      strippedLines.push(line);
    }
  });

  return strippedLines;
};

/**
 * Retrieves the anchors from a given array of YAML lines.
 *
 * @param yamlLines (yaml as an array of lines)
 * @returns {Object}
 */
module.exports.retrieveAnchors = function (yamlLines) {
  var anchors = {};

  // Find anchors, with their indentation and block content
  yamlLines.forEach(function (line, index) {
    if (line.indexOf("&") > -1) {
      var anchorName = line.match("&(.*)")[1];
      var me = anchors[anchorName];
      var indentDiff = 0;

      // If the anchor already exists, push additional content
      if (me) {
        indentDiff = me.indent - line.search(/\S|$/);
      } else {
        me = anchors[anchorName] = {
          indent: line.search(/\S|$/),
          block: []
        };
      }

      // Store the block content
      for (var i = index + 1; i < yamlLines.length; i++) {
        // when encountering an equal or lower indentation, the block ends
        if (yamlLines[i].search(/\S|$/) <= me.indent - indentDiff) {
          break;
        }

        // check for circular references
        if (yamlLines[i].match(new RegExp("<<: \\*" + anchorName + "$"))) {
          break;
        }

        var str = yamlLines[i];

        // Fix the indentation levels for the original block content
        if (indentDiff !== 0) {

          // Shift indentations of the block content
          if (indentDiff > 0) {
            str = new Array(indentDiff + 1).join(' ') + yamlLines[i];
          } else {
            for (var j = 0; j > indentDiff; j--) {
              str = str.replace('  ', ' ');
            }
          }
        }

        me.block.push(str.replace(/&.*/, ""));
      }
    }
  });

  return anchors;
};

/**
 * Adds block content from the anchors to the aliases
 *
 * @param yamlLines (yaml as an array of lines)
 * @param anchors
 * @returns {Array}
 */
module.exports.replaceAliases = function (yamlLines, anchors) {
  var replacedLines = [];

  // Find aliases, strip them and add anchor content
  yamlLines.forEach(function (line) {
    // << :* alias
    if (line.trim().indexOf("<<: *") === 0 || line.trim().indexOf(": *") > -1) {
      var alias = line.trim().replace("<<: *", "");
      var indentUp = -2;

      if (line.trim().indexOf("<<: *") === -1 && line.trim().indexOf(": *") > -1) {
        alias = line.trim().replace(/.*: \*/, "");
        replacedLines.push(line.replace(" *" + alias, ""));

        indentUp = 0;
      }

      /* istanbul ignore else */
      if (anchors[alias]) {
        var indentDiff = line.search(/\S|$/) - anchors[alias].indent + indentUp;

        anchors[alias].block.forEach(function (blockLine) {
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

          replacedLines.push(str);
        });
      } else {
        throw new Error("Alias " + alias + " does not have an anchor reference. Line content = '" + line + "'");
      }
    } else {
      replacedLines.push(line);
    }
  });

  return replacedLines;
};
