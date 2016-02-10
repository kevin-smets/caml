var assert = require('assert');
var fs = require('fs');
var caml = require('../../lib/caml');

var a = fs.readFileSync('test/fixtures/a.yml', 'utf-8');
var b = fs.readFileSync('test/fixtures/b.yml', 'utf-8');
var c = fs.readFileSync('test/fixtures/c.yml', 'utf-8');
var deep = fs.readFileSync('test/fixtures/deep.yml', 'utf-8');
var empty = fs.readFileSync('test/fixtures/empty.yml', 'utf-8');
var lists = fs.readFileSync('test/fixtures/lists.yml', 'utf-8');
var listsJson = fs.readFileSync('test/fixtures/lists.json', 'utf-8');
var merge = fs.readFileSync('test/fixtures/merge.yml', 'utf-8');

describe('Caml', function () {
  describe('#replaceAliases()', function () {
    it('should return an array of prepocessed yaml lines', function () {
      var yamlLines = caml.replaceAliases(a);
      assert.equal(17, yamlLines.length);
    });

    it('should replace aliases by the block content of an anchor', function () {
      var yamlLines = caml.replaceAliases(a);
      assert.equal(17, yamlLines.length);
    });

    it('should be able to handle concatenated files (as string)', function () {
      var yamlLines = caml.replaceAliases(a + b);
      assert.equal(49, yamlLines.length);
    });
  });

  describe('#parse()', function () {
    it('should be able to cascade and parse multiple yaml files', function () {
      var yamlLines = caml.replaceAliases(a + b);
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
      var yamlLines = caml.replaceAliases(a + b + c);

      yamlLines.forEach(function (line) {
        assert(line.indexOf("<<: *") === -1);
      });
    });

    it('should be able to cascade and parse multiple yaml files', function () {
      var yamlLines = caml.replaceAliases(a + b + c);

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
  });
});
