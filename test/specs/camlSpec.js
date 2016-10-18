var assert = require('assert');
var fs = require('fs');
var caml = require('../../lib/caml');

function readFixture(name, extension) {
  return fs.readFileSync('test/fixtures/' + name + '.' + (extension || 'yml'), 'utf-8');
}

var a = readFixture('a');
var b = readFixture('b');
var c = readFixture('c');
var deep = readFixture('deep');
var huge = readFixture('huge');
var empty = readFixture('empty');
var lists = readFixture('lists');
var listsJson = readFixture('lists', 'json');
var merge = readFixture('merge');
var noEOL = readFixture('noEOL');

describe('Caml', function () {
  describe('#replaceAliases()', function () {
    it('should return an array of prepocessed yaml lines', function () {
      var yamlLines = caml.replaceAliases(a.split(/\r?\n/));
      assert.equal(17, yamlLines.length);
    });

    it('should replace aliases by the block content of an anchor', function () {
      var yamlLines = caml.replaceAliases(a.split(/\r?\n/));
      assert.equal(17, yamlLines.length);
    });

    it('should be able to handle concatenated files (as string)', function () {
      var yamlLines = caml.replaceAliases((a + b).split(/\r?\n/));
      assert.equal(49, yamlLines.length);
    });
  });

  describe('#sanitize()', function () {
    var sanitize = readFixture('sanitize');

    it('should return an array of prepocessed yaml lines', function () {
      var obj = caml.camlize({
        dir: 'test/fixtures',
        files: [
          'sanitize'
        ]
      });

      assert.equal("name", obj['variable.name']);
      assert.equal('test."variable.name"', obj.test['variable.name']);
      assert.equal("test.'other.variable.name'", obj.test['other.variable.name'])
    });

    it('should fail for uneven quoting in keys', function () {
      var fixture = readFixture('dot-with-unended-quote').split(/\r?\n/);
      assert.throws(function () {
        caml.sanitize(fixture);
      }, /Key contains incomplete quoted section/);
    });

    it('should fail when nesting quotes in keys', function () {
      var fixture = readFixture('dot-with-nested-quotes').split(/\r?\n/);
      assert.throws(function () {
        caml.sanitize(fixture);
      }, /Key cannot contain nested quotes/);
    });

    it('should handle partly quoted keys correctly', function () {
      var json = caml.camlize({
        dir: 'test/fixtures',
        files: [
          'dot-with-partly-quoted-key'
        ]
      });

      assert.equal(json.foo['bar.baz'].qux, 'Lorem ipsum');
    });
  });

  describe('#parse()', function () {
    it('should be able to cascade and parse multiple yaml files', function () {
      var yamlLines = caml.replaceAliases((a + b).split(/\r?\n/));
      var fullYamlLines = caml.blowUpHierarchy(yamlLines);
      var json = caml.parse(fullYamlLines);

      assert.equal(json.a.z.zz.zzz.d, "shouldBeFromA");
      assert.equal(json.a.b.c.ccc.cccc, "shouldBeFromB");
      assert.equal(json.a.b.c.ccc.ccccc, "shouldBeFromA");
      assert.equal(json.a.b.d, "shouldBeOverwrittenInB");
      assert.equal(json.a.b.e.length, 2); // Overwrite arrays fully
      assert.equal(json.a.b.f.length, 3); // Overwrite arrays fully
    });

    it('should have no aliases in the output', function () {
      var yamlLines = caml.replaceAliases((a + b + c).split(/\r?\n/));

      yamlLines.forEach(function (line) {
        assert(line.indexOf("<<: *") === -1);
      });
    });

    it('should be able to cascade and parse multiple yaml files', function () {
      var yamlLines = caml.replaceAliases((a + b + c).split(/\r?\n/));

      var fullYamlLines = caml.blowUpHierarchy(yamlLines);
      var json = caml.parse(fullYamlLines);

      assert.equal(json.a.b.z.zz, "shouldBeFromC");
      assert.equal(json.a.b.c.ccc.cccc, "shouldBeFromB");
      assert.equal(json.a.b.c.ccc.ccccc, "shouldBeFromA");
      assert.equal(json.a.b.e.length, 2); // Overwrite arrays fully
      assert.equal(json.a.b.f.length, 3); // Overwrite arrays fully

      assert.equal(json.a.z.zz.zzz.d, "shouldBeFromA");

      assert(json.deep.merge.iHope); // Overwrite array fully by property
      assert(json.deep.merge.iHope); // Overwrite array fully by property
    });
  });

  describe('#camlize()', function () {
    it('should not crash on non-existing files', function () {
      caml.camlize({
        dir: "test/fixtures",
        files: [
          "iDoNotExist",
          'a'
        ]
      });

      assert(true);
    });

    it('should be able to cascade and parse multiple yaml files', function () {
      var json = caml.camlize({
        dir: "test/fixtures",
        files: [
          "a",
          "b"
        ]
      });

      assert.equal(json.a.b.c.ccc.cccc, "shouldBeFromB");
      assert.equal(json.a.b.c.ccc.ccccc, "shouldBeFromA");
      assert.equal(json.a.b.e.length, 2); // Overwrite arrays fully
      assert.equal(json.a.b.f.length, 3); // Overwrite arrays fully

      assert.equal(json.a.z.zz.zzz.d, "shouldBeFromA");
    });

    it('should handle @include statements', function () {
      var json = caml.camlize({
        dir: "test/fixtures/includes",
        files: [
          "includer"
        ]
      });

      assert.equal(json.included, true, "Expected json.included to be true");
      assert.equal(json.includedSpecific, true, "Expected json.includedSpecific to be true");
      assert.equal(json.relativeIncluded, true, "Expected json.relativeIncluded to be true");
      assert.equal(json.relativeIncludedSpecific, true, "Expected json.relativeIncludedSpecific to be true");
    });

    it('should be able to cascade and parse multiple yaml files', function () {
      var json = caml.camlize({
        dir: "test/fixtures",
        files: [
          "a",
          "b",
          "c"
        ]
      });

      assert.equal(json.a.b.z.zz, "shouldBeFromC");
      assert.equal(json.a.b.c.ccc.cccc, "shouldBeFromB");
      assert.equal(json.a.b.c.ccc.ccccc, "shouldBeFromA");

      assert.equal(json.a.b.e.length, 2); // Overwrite arrays fully
      assert.equal(json.a.b.f.length, 3); // Overwrite arrays fully

      assert.equal(json.a.z.zz.zzz.d, "shouldBeFromA");

      assert(json.deep.merge.iHope); // Overwrite array fully by property
      assert(json.deep.merge.iHope); // Overwrite array fully by property
    });

    it('should handle nested anchors', function () {
      var json = caml.camlize({
        dir: "test/fixtures",
        files: [
          "nested"
        ]
      });

      assert.equal(json.test.utils.nested.offline, false);
      assert.equal(json.test.testNest.offline, false);
    });

    it('should handle aliases nested inside anchors', function () {
      var json = caml.camlize({
        dir: "test/fixtures",
        files: [
          "nested"
        ]
      });

      assert.equal(json.nest.utils.nested.nestedAlias.iAm, "nested");
      assert.equal(json.nest.utils.nested.nestedAlias.amI, "there");
    });

    it('should handle lists like a champ', function () {
      var json = caml.camlize({
        dir: "test/fixtures",
        files: [
          "lists"
        ]
      });

      assert.equal(JSON.stringify(json, null, 2) + "\n", listsJson);
      assert.equal(json.z.y, "prop");
    });

    it('should handle another seperator', function () {
      var json = caml.camlize({
        dir: "test/fixtures",
        files: [
          "separator"
        ],
        separator: '_'
      });

      assert.equal(json.this['is.a.test'], "for.the.separator");
    });

    it('shouldn\'t break on files without a EOL char at the end', function () {
      caml.camlize({
        dir: "test/fixtures",
        files: [
          "noEOL", "lists"
        ]
      });
    });

    it('should handle duplicate anchors', function () {
      var json = caml.camlize({
        dir: "test/fixtures",
        files: [
          "dupe"
        ]
      });

      assert.equal(json.extend.from, "baseOverride");
      assert.equal(json.extend.success.fail, false);
      assert.equal(json.extend.iAm, "original")
    });

    it('should handle large files quickly', function () {
      var json = caml.camlize({
        dir: "test/fixtures",
        files: [
          "a", "b", "c", "deep", "huge"
        ]
      });
    });
  });
  describe('Variables', function () {
    it('should be handled properly when they\'re on the same indentation', function () {
      var json = caml.camlize({
        dir: "test/fixtures",
        files: [
          "multiDots"
        ]
      });
      assert.equal(json.test.for.indented.dots, 'yes');
      assert.equal(json.test.and.another.one, 'aw.yes');
    });
    it('should be properly replaced', function () {
      var json = caml.camlize({
        dir: "test/fixtures",
        files: [
          "variables1", "variables2"
        ],
        overrides: ["var.i.able.two: able too"]
      });
      assert.equal(json.variables.should, 'i should be the able one');
      assert.equal(json.variables.be.replaced, 'able too');
      assert.equal(json.times.and, 'able one');
      assert.equal(json.variables.var, 'var');
    });
    it('should be left untouched', function () {
      var json = caml.camlize({
        dir: "test/fixtures",
        files: [
          "variables1", "variables2"
        ]
      });
      assert.equal(json.variables.be.replaced, '${var.i.able.two}');
    });
    it('should be able to handle multiple entries', function () {
      var json = caml.camlize({
        dir: "test/fixtures",
        files: [
          "variables3"
        ]
      });
      assert.equal(json.variables.multi[0], 'i should be 1 and 2');
    });
  });
});
