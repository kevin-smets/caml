# CAML [![Build Status](https://travis-ci.org/kevin-smets/caml.svg?branch=master)](https://travis-ci.org/kevin-smets/caml) [![Dependency Status](https://david-dm.org/kevin-smets/caml.svg)](https://david-dm.org/kevin-smets/caml)

CAML means Cascading YAML config.

This is to overcome a few limitations of the YAML spec. You still write valid YAML, but the output is a bit different.

## Why cascading?

### Multiple files

CAML is built out of the need for YAML to handle multiple files, with anchors and aliases defined in other files.

So if `root.yml` defines the anchor `&from_root`, it can be used in files added after root.

The cascading concept is taken from CSS, so the last defined property wins, this means the order of the files added to CAML matters, a lot. 

### Deep merge

By default, Yaml only supports hash merging. There are some variations out there which support deep merging, but none in javascript.

This behaviour is not optional (at least not yet), meaning the output of Caml will be highly different than the default spec.

### Full path declarations to a property

In Caml, it's possible to define properties like `a.b.c: 1'. These will all be merged into a single Object literal.

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

The return will an Object literal.

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
    } 
  },
  b: { 
    c: 'fromB', 
    d: 'fromB' 
  } 
}
```

## Gotcha's

- Arrays are considered to be simple values, they are never merged, they will always simply be overwritten.
- Because `.` splits out into a path for a property, none of your keys can contain a `.` in the name.

## CLI

There's a CLI, but it's mainly there for running a quick test.

## Test

```
npm test
```
