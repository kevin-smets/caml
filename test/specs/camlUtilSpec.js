var assert = require('assert');
var fs = require('fs');
var camlUtil = require('../../lib/camlUtil');

var a = fs.readFileSync('test/fixtures/a.yml', 'utf-8');
var b = fs.readFileSync('test/fixtures/b.yml', 'utf-8');
var c = fs.readFileSync('test/fixtures/c.yml', 'utf-8');
var circular = fs.readFileSync('test/fixtures/circular.yml', 'utf-8');
var comments = fs.readFileSync('test/fixtures/comments.yml', 'utf-8');
var empty = fs.readFileSync('test/fixtures/empty.yml', 'utf-8');

function read(fileName) {
  return fs.readFileSync('test/fixtures/' + fileName + '.yml', 'utf-8');
}

describe('camlUtil', function () {
  describe('#stripEmptyLinesAndComments()', function () {
    it('should return "" for empty lines', function () {
      var yamlLines = camlUtil.stripEmptyLinesAndComments(empty);
      assert.equal(yamlLines.length, 0);
    });

    it('should return "" for comments', function () {
      var yamlLines = camlUtil.stripEmptyLinesAndComments(comments);
      assert.equal(yamlLines.length, 0);
    });

    it('should return all lines when there are no empty lines or comments', function () {
      var yamlLines = camlUtil.stripEmptyLinesAndComments(a);
      assert.equal(yamlLines.split('\n').length, 17);
    });
  });

  describe('#retrieveAnchors()', function () {
    it('should find the anchor c_from_a in a with the proper block content', function () {
      var anchors = camlUtil.retrieveAnchors(a);
      Object.keys(anchors).forEach(function (anchor) {
        assert.equal(anchor, 'c_from_a');
        assert.equal(anchors[anchor].indent, 4);
        assert.equal(anchors[anchor].block[0], '      d: "shouldBeFromA"');
        assert.equal(anchors[anchor].block[1], '      ccc:');
        assert.equal(anchors[anchor].block[2], '        cccc: "shouldBeFromA"');
        assert.equal(anchors[anchor].block[3], '        ccccc: "shouldBeFromA"');
      });
    });

    it('should handle duplicate anchor declarations', function () {
      var anchors = camlUtil.retrieveAnchors(read('dupe'));
      assert.equal(Object.keys(anchors).length, 1);

      assert.equal(anchors.base.block.length, 4);
      assert.equal(anchors.base.block[0], '  from: "base"');
      assert.equal(anchors.base.block[1], '  from: "baseOverride"');
      assert.equal(anchors.base.block[2], '  success:');
      assert.equal(anchors.base.block[3], '    fail: false');
    });
  });

  describe('#stripAnchors()', function () {
    it('should properly strip anchors', function () {
      var dupeClean = camlUtil.stripAnchors(read('dupe'));

      assert.equal(dupeClean.match(/: &/), null);
    });
  });

  describe('#replaceAliases()', function () {
    var anchors, result, resultLines;

    beforeEach(function () {
      anchors = camlUtil.retrieveAnchors(a + b + c);
      result = camlUtil.replaceAliases(a + b + c, anchors);
      resultLines = result.split('\n');
    });

    it('should set the block with correct indentation (less indentation)', function () {
      assert.equal(resultLines[19], '    c:');
      assert.equal(resultLines[20], '      d: "shouldBeFromA"');
      assert.equal(resultLines[21], '      ccc:');
      assert.equal(resultLines[22], '        cccc: "shouldBeFromA"');
      assert.equal(resultLines[23], '        ccccc: "shouldBeFromA"');
    });

    it('should respect content after the block replacement', function () {
      assert.equal(resultLines[24], '      cc: "shouldBeFromB"');
      assert.equal(resultLines[38], 'otherLevel:');
    });

    it('should set the block with correct indentation (more indentation)', function () {
      assert.equal(resultLines[33], '      zzz:');
      assert.equal(resultLines[34], '        d: "shouldBeFromA"');
      assert.equal(resultLines[35], '        ccc:');
      assert.equal(resultLines[36], '          cccc: "shouldBeFromA"');
      assert.equal(resultLines[37], '          ccccc: "shouldBeFromA"');
    });

    it('should also add block content for an * alias', function () {
      assert.equal(resultLines[48], '  fake: true');
    });

    it('should have no aliases in the output', function () {
      resultLines.forEach(function (line) {
        assert(line.indexOf("<<: *") === -1);
      });
    });
  });
});
