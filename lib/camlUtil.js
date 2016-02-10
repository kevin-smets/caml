/**
 * Strips empty lines and comment from aa given YAML string.
 *
 * @param yaml
 * @returns {string}
 */
module.exports.stripEmptyLinesAndComments = function (yaml) {
  var lines = yaml.split('\n');
  var strippedLines = [];

  lines.forEach(function (line) {
    if (line.length > 0 && line.trim().indexOf("#") === -1) {
      strippedLines.push(line);
    }
  });

  return strippedLines.join('\n');
};

/**
 * Retrieves the anchors from a given YAML string.
 *
 * @param yaml
 * @returns {Object}
 */
module.exports.retrieveAnchors = function (yaml) {
  var lines = yaml.split('\n');
  var anchors = {};

  // Find anchors, with their indentation and block content
  lines.forEach(function (line, index) {
    if (line.indexOf("&") > -1) {
      var anchorName = line.match("&(.*)")[1];

      var me = anchors[anchorName] = {
        indent: line.search(/\S|$/),
        block: []
      };

      // Store the block content
      for (var i = index + 1; i < lines.length; i++) {
        // when encountering an equal or lower indentation, the block ends
        if (lines[i].search(/\S|$/) <= me.indent) {
          break;
        }
        me.block.push(lines[i].replace(/&.*/, ""));
      }
    }
  });

  return anchors;
};

/**
 * Adds block content from the anchors to the aliases
 *
 * @param yaml
 * @param anchors
 * @returns {string}
 */
module.exports.replaceAliases = function (yaml, anchors) {
  var lines = yaml.split('\n');
  var replacedLines = [];

  // Find aliases and add anchor content
  lines.forEach(function (line, index) {
    // << :* alias
    if (line.trim().indexOf("<<: *") === 0 || line.trim().indexOf(": *") > -1) {
      var anchor = line.trim().replace("<<: *", "");
      var indentUp = -2;

      if (line.trim().indexOf("<<: *") === -1 && line.trim().indexOf(": *") > -1) {
        anchor = line.trim().replace(/.*: \*/, "");
        replacedLines.push(line);
        indentUp = 0;
      }

      /* istanbul ignore else */
      if (anchors[anchor]) {
        var indentDiff = line.search(/\S|$/) - anchors[anchor].indent + indentUp;

        anchors[anchor].block.forEach(function (blockLine) {
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
        throw new Error("Undefined anchor " + anchor + ". Line content = '" + line + "'");
      }
    } else {
      replacedLines.push(line);
    }
  });

  return replacedLines.join('\n');
};
