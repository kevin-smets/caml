# CAML 

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

In CAML, it's possible to define properties like `a.b.c: 1'. These will all be merged into a single Object literal.

### Array handling

Arrays are considered to be simple values, they are never merged. They will always simply be overwritten if another value or another array has been declared.

## Usage

The following will cascade `a.yml`, `b.yml` and `c.yml` from the directory `test/fixtures`.

```
var caml = require('caml');

var options = {
    dir: 'test/fixtures', 
    files: ['a', 'b', 'c']
    separator: "_"
}

caml.camlize(options);
```

The return will be an Object literal.

The following parameters can be set:

- options.**dir**: the directory where CAML will look for files, default is the current working dir.
- options.**files**: the files to merge, order matters. Properties declared in `c.yml` will overrule those from `b.yml` and `a.yml`  
- options.**separator**: by default, full paths to properties will be separated by `.`. If your variable names include a dot in the name, make sure to define another separator.

If you define another separator, `a.b.c: "prop"` notation will no longer be valid. The dots will have to be replaced by the given separator. E.g. if the separator is `_` you'll have to define a full path like `a_b_c: "prop"` or

```
a:
  b:
    c: "prop"
```

### Example

a.yml

```
a:
  b: &b
    c: "fromA"
    d: [ "fromA" ]
    e: "fromA"
```

b.yml

```
b:
  <<: *b
  c: "fromB"
  d: "fromB"
a.b.d: "fromB"
```

Will result in the following:

```
{ 
  a: { 
    b: { 
      c: 'fromA',
      d: 'fromB'
      e: "fromA"
    } 
  },
  b: { 
    c: 'fromB', 
    d: 'fromB' 
    e: "fromA"
  } 
}
```

## CLI

There's a CLI, but it's mainly there for running a quick test.

## Testing CAML

```
npm test
```

## TODO

- handle circular anchor / alias references
