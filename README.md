# CAML

[![Build Status](https://travis-ci.org/kevin-smets/caml.svg?branch=master)](https://travis-ci.org/kevin-smets/caml) [![Dependency Status](https://david-dm.org/kevin-smets/caml.svg)](https://david-dm.org/kevin-smets/caml) [![devDependency Status](https://david-dm.org/kevin-smets/caml/dev-status.svg)](https://david-dm.org/kevin-smets/caml#info=devDependencies)

CAML offers you a Cascading YAML config. It's a YAML preprocessor which converts YAML to Json.

You still write valid YAML, but the output is quite a bit different.

## Why cascading?

### Multiple files

CAML is built out of the need for YAML to handle multiple files, with anchors and aliases defined in separate files.

So if `root.yml` defines the anchor `&from_root`, it can be used in files added after root.

The cascading concept is taken from CSS, so the last defined property wins, this means the order of the files added to CAML matters, a lot. 

### Deep merge

By default, YAML only supports hash merging. There are some variations out there which support deep merging, but none in JavaScript.

This behaviour is not optional (at least not yet), meaning the output of CAML will be highly different than the default spec.

### Full path declarations to a property

In CAML, it's possible to define properties with full paths like `a.b.c: 1'. These will all be merged into a single Object literal. If you need variable names with dots in them, surround them by "" or '', e.g.

```
a:
  b:
    d: 'indented'
a.b.d: "path to a.b.d"
a."b.d": "path to a['b.d']"
```

Result:

```
{
  "a": {
    "b": {
      "d": "path to a.b.d"
    },
    "b.d": {
      "path to a['b.d']"
    }
  }
}
```

**Gotcha:** CAML substitutes dots in variable names by `_DOT_`, so this cannot be used anywhere (not in keys or values).

### Array handling

Arrays are considered to be simple values, they are never merged. They will always simply be overwritten if another value or another array has been declared.

### Variable substitution

CAML can substitute variables. Variables used in the CAML configuration need to be in the following form:

```
a:
  b: "I am a ${var.i.able}"
```

This will be replaced by the value of this path, e.g the following

```
var:
  i:
    able: 'very able one'
```

Will result in the following:

```
a:
  b: "I am a very able one"
var:
  i:
    able: 'very able one'
```

This means overrides will also work, so `--overrides "var.i.able: very able one"` will have the same effect as described above. 

## Usage

The following will cascade `a.yml`, `b.yml` and `c.yml` from the directory `test/fixtures`.

```
var caml = require('caml');

var options = {
    dir: 'test/fixtures', 
    files: ['a', 'b', 'c']
}

var result = caml.camlize(options);
```

Result will be the composed Object literal.

The following parameters can be set:

- options.**dir**: the directory where CAML will look for files, default is the current working dir.
- options.**files**: the files to merge, order matters. Properties declared in `c.yml` will overrule those from `b.yml` and `a.yml`
- options.**variables**: variables to be replaced by their replacements.

### Examples 

The entire flow of CAML can be found in `/examples/GENERAL.md`.

## CLI

There's a CLI, but it's mainly there for running a quick test. Run `caml -h` to check the usage.

## Testing CAML

```
npm i
npm test
```

## Node version compatibility

Check `.travis.yml` for the node versions CAML is tested against

## Changelog

- v0.9.3
    - Updated npm packages
    - Handle multiple substitutions in a single line
    - Simplified `.travis.yml`

- v0.9.0
    - Removed a lot of unnecessary splitting and joining to improve performance drastically (sliced parsing times in half).
    - Updated the readme
    - Improved cross platform newline splitting by using `/\r?\n/` instead of `"\n"`

**NOTICE**

CAML is string / regex based. While this is not rock solid, it serves the purposes I need it for. I tried to use a proper parser but the documentation on it is [very sparse](https://github.com/connec/yaml-js/issues/12), blocking this for now.
