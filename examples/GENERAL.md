# General flow of CAML

## File sources

`general/1st.yml`

```
baseUnoverridable: &base
  baseProp: 1
  boolProp: false
  baseObj:
    arr: [
    'one',
    'two'
    ]
another."base.overridable": &base
  <<: *base
```

`general/2nd.yml`

```
baseExtend:
  <<: *base

baseOverride: &base
  baseProp: 1
  baseProp: 3
  baseBoolProp: true
```

## Sanitize all keys

```
baseUnoverridable: &base
  baseProp: 1
  boolProp: false
  baseObj:
    arr: [
    'one',
    'two'
    ]
another_DOT__DOT_base_DOT_overridable: &base
  <<: *base
baseExtend:
  <<: *base

baseOverride: &base
  baseProp: 1
  baseProp: 3
  baseBoolProp: true

```

## Strip white lines, comments and anchors

The block content of the anchors will be stored for future use.

```
baseUnoverridable: 
  baseProp: 1
  boolProp: false
  baseObj:
    arr: [
    'one',
    'two'
    ]
another_DOT__DOT_base_DOT_overridable: 
  <<: *base
baseExtend:
  <<: *base
baseOverride: 
  baseProp: 1
  baseProp: 3
  baseBoolProp: true
```

## Replace aliases by the anchor block

```
baseUnoverridable: 
  baseProp: 1
  boolProp: false
  baseObj:
    arr: [
    'one',
    'two'
    ]
another_DOT__DOT_base_DOT_overridable: 
  baseProp: 1
  boolProp: false
  baseObj:
    arr: [
    'one',
    'two'
    ]
  baseProp: 1
  baseProp: 3
  baseBoolProp: true
baseExtend:
  baseProp: 1
  boolProp: false
  baseObj:
    arr: [
    'one',
    'two'
    ]
  baseProp: 1
  baseProp: 3
  baseBoolProp: true
baseOverride: 
  baseProp: 1
  baseProp: 3
  baseBoolProp: true
```

## Blow up the hierarchy

```
baseUnoverridable: 
baseUnoverridable.baseProp: 1
baseUnoverridable.boolProp: false
baseUnoverridable.baseObj:
baseUnoverridable.baseObj.arr: [
    'one',
    'two'
    ]
another_DOT__DOT_base_DOT_overridable: 
another_DOT__DOT_base_DOT_overridable.baseProp: 1
another_DOT__DOT_base_DOT_overridable.boolProp: false
another_DOT__DOT_base_DOT_overridable.baseObj:
another_DOT__DOT_base_DOT_overridable.baseObj.arr: [
    'one',
    'two'
    ]
another_DOT__DOT_base_DOT_overridable.baseProp: 1
another_DOT__DOT_base_DOT_overridable.baseProp: 3
another_DOT__DOT_base_DOT_overridable.baseBoolProp: true
baseExtend:
baseExtend.baseProp: 1
baseExtend.boolProp: false
baseExtend.baseObj:
baseExtend.baseObj.arr: [
    'one',
    'two'
    ]
baseExtend.baseProp: 1
baseExtend.baseProp: 3
baseExtend.baseBoolProp: true
baseOverride: 
baseOverride.baseProp: 1
baseOverride.baseProp: 3
baseOverride.baseBoolProp: true
```

## Parse this to json

```
{
  "baseUnoverridable": {
    "baseProp": 1,
    "boolProp": false,
    "baseObj": {
      "arr": [
        "one",
        "two"
      ]
    }
  },
  "another..base.overridable": {
    "baseProp": 3,
    "boolProp": false,
    "baseObj": {
      "arr": [
        "one",
        "two"
      ]
    },
    "baseBoolProp": true
  },
  "baseExtend": {
    "baseProp": 3,
    "boolProp": false,
    "baseObj": {
      "arr": [
        "one",
        "two"
      ]
    },
    "baseBoolProp": true
  },
  "baseOverride": {
    "baseProp": 3,
    "baseBoolProp": true
  }
}
```

