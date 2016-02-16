# Flow of CamlYaml

## File sources

`flow-first.yml`

```
base: &base
  baseProp: true
  baseObj:
    arr: [
    'one',
    'two'
    ]
```

`flow-second.yml`

```
baseExtend:
  <<: *base

baseOverride: &base
  baseProp: false
  baseProp: false
```

## Strip white lines, comments and anchors

The block content of the anchors has been stored.

```
base: 
  baseProp: true
  baseObj:
    arr: [
    'one',
    'two'
    ]
baseExtend:
  <<: *base
baseOverride: 
  baseProp: false
  baseProp: false
```

## Replace aliases by the anchor block

```
base: 
  baseProp: true
  baseObj:
    arr: [
    'one',
    'two'
    ]
baseExtend:
  baseProp: true
  baseObj:
    arr: [
    'one',
    'two'
    ]
  baseProp: false
  baseProp: false
baseOverride: 
  baseProp: false
  baseProp: false
```

## Blow up the hierarchy

```
base: 
base.baseProp: true
base.baseObj:
base.baseObj.arr: [
    'one',
    'two'
    ]
baseExtend:
baseExtend.baseProp: true
baseExtend.baseObj:
baseExtend.baseObj.arr: [
    'one',
    'two'
    ]
baseExtend.baseProp: false
baseExtend.baseProp: false
baseOverride: 
baseOverride.baseProp: false
baseOverride.baseProp: false
```

## Parse this to json

```
{
  "base": {
    "baseProp": true,
    "baseObj": {
      "arr": [
        "one",
        "two"
      ]
    }
  },
  "baseExtend": {
    "baseProp": false,
    "baseObj": {
      "arr": [
        "one",
        "two"
      ]
    }
  },
  "baseOverride": {
    "baseProp": false
  }
}
```

