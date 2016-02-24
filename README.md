# CAML

**NOTICE**

Caml is undergoing a complete overhaul to work properly with parsed events instead of being string / regex based. This will make it a lot more stable.

[![Build Status](https://travis-ci.org/kevin-smets/caml.svg?branch=master)](https://travis-ci.org/kevin-smets/caml) [![Dependency Status](https://david-dm.org/kevin-smets/caml.svg)](https://david-dm.org/kevin-smets/caml) [![devDependency Status](https://david-dm.org/kevin-smets/caml/dev-status.svg)](https://david-dm.org/kevin-smets/caml#info=devDependencies)

Cascading YAML config, a YAML preprocessor.

You still write valid YAML, but the output is quite a bit different.

## Why cascading?

### Multiple files

CAML is built out of the need for YAML to handle multiple files, with anchors and aliases defined in other files.

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

### Variables

Caml has variable support. Variables used in the caml configuration needs to be in the following form:

```
a:
  b: "${myVariable}"
```

To replace the variable by actual content, pass a `variables` object to the caml options:

```
var options = {
    variables: {
        'myVariable': 'MyReplacement'
    }
}
```

## Usage

The following will cascade `a.yml`, `b.yml` and `c.yml` from the directory `test/fixtures`.

```
var caml = require('caml');

var options = {
    dir: 'test/fixtures', 
    files: ['a', 'b', 'c']
}

caml.camlize(options);
```

The return will be an Object literal.

The following parameters can be set:

- options.**dir**: the directory where CAML will look for files, default is the current working dir.
- options.**files**: the files to merge, order matters. Properties declared in `c.yml` will overrule those from `b.yml` and `a.yml`
- options.**variables**: variables to be replaced by their replacements.

### Examples 

More elaborate examples can be found in `/examples`.

## CLI

There's a CLI, but it's mainly there for running a quick test.

## Testing CAML

```
npm test
```
