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
another."base.overridable": &base
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

## Sanitize all keys

```
baseUnoverridable: &base
  baseProp: true
  baseObj:
    arr: [
    'one',
    'two'
    ]
another.base_DOT_overridable: &base
  <<: *base
baseExtend:
  <<: *base

baseOverride: &base
  baseProp: false
  baseProp: false
```

## Strip white lines, comments and anchors

The block content of the anchors will be stored for future use.

```
baseUnoverridable: 
  baseProp: true
  baseObj:
    arr: [
    'one',
    'two'
    ]
another.base_DOT_overridable: 
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
another.base_DOT_overridable: 
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
another.base_DOT_overridable: 
another.base_DOT_overridable.baseProp: true
another.base_DOT_overridable.baseObj:
another.base_DOT_overridable.baseObj.arr: [
    'one',
    'two'
    ]
another.base_DOT_overridable.baseProp: false
another.base_DOT_overridable.baseProp: false
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
  "another": {
    "base.overridable": {
      "baseProp": false,
      "baseObj": {
        "arr": [
          "one",
          "two"
        ]
      }
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

