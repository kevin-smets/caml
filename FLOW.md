# Flow of CamlYaml

## File sources

`flow-first.yml`

```
baseUnoverridable: &base
  baseProp: true
  baseObj:
    arr: [
    'one',
    'two'
    ]
baseOverridable: &base
  <<: *base
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
baseUnoverridable: 
  baseProp: true
  baseObj:
    arr: [
    'one',
    'two'
    ]
baseOverridable: 
  <<: *base
baseExtend:
  <<: *base
baseOverride: 
  baseProp: false
  baseProp: false
```

## Replace aliases by the anchor block

```
baseUnoverridable: 
  baseProp: true
  baseObj:
    arr: [
    'one',
    'two'
    ]
baseOverridable: 
  baseProp: true
  baseObj:
    arr: [
    'one',
    'two'
    ]
  baseProp: false
  baseProp: false
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
baseUnoverridable: 
baseUnoverridable.baseProp: true
baseUnoverridable.baseObj:
baseUnoverridable.baseObj.arr: [
    'one',
    'two'
    ]
baseOverridable: 
baseOverridable.baseProp: true
baseOverridable.baseObj:
baseOverridable.baseObj.arr: [
    'one',
    'two'
    ]
baseOverridable.baseProp: false
baseOverridable.baseProp: false
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
  "baseUnoverridable": {
    "baseProp": true,
    "baseObj": {
      "arr": [
        "one",
        "two"
      ]
    }
  },
  "baseOverridable": {
    "baseProp": false,
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

