# @vcmap/shadow

> Part of the [VC Map Project](https://github.com/virtualcitySYSTEMS/map-ui)

The Shadow tool can be used to control the time and date settings of the 3D Cesium map for shadow calculations.

## API

The Shadow plugin can be accessed via the `VcsUiApp`:

```js
const shadow = vcsUiApp.plugins.getByKey('@vcmap/shadow');
```

### Activation and deactivation

To activate the Shadow plugin via API call:

```js
shadow.activate();
```

To deactivate the Shadow plugin via API call:

```js
shadow.deactivate();
```

## Callbacks

The Shadow plugin registers two [VcsCallbacks](https://github.com/virtualcitySYSTEMS/map-ui/blob/main/documentation/CALLBACKS.md) that can be used in story, splash screens, or any other callback-driven feature.

### ActivateShadowCallback

Activates the shadow tool and optionally applies shadow time and animation settings before activation.
Accepts either ShadowState format (JulianDate values) or ShadowUrlState format (the same keys, with ISO date strings for date fields).

| property     | type                 | description                                                                 |
| ------------ | -------------------- | --------------------------------------------------------------------------- |
| originalTime | JulianDate \| string | Baseline clock time used as the original time for full tool teardown reset. |
| timeOnClose  | JulianDate \| string | Clock time to resume from when the shadow tool activates again.             |
| animate      | boolean              | Whether animation should start immediately after activation.                |
| duration     | number               | Duration of one animation cycle in the selected timeUnit.                   |
| timeUnit     | TimeUnits            | Unit used to interpret duration (for example day or year).                  |
| endDate      | JulianDate \| string | Optional animation stop time target.                                        |

```json
{
  "type": "ActivateShadowCallback",
  "timeOnClose": "2026-06-19T18:00:13.000Z",
  "duration": 5,
  "animate": false
}
```

A full example with all supported properties:

```json
{
  "type": "ActivateShadowCallback",
  "originalTime": "2026-06-19T06:00:00.000Z",
  "timeOnClose": "2026-06-19T18:00:13.000Z",
  "animate": true,
  "duration": 10,
  "timeUnit": "days",
  "endDate": "2027-06-19T18:00:13.000Z"
}
```

### DeactivateShadowCallback

Deactivates the shadow tool and restores the original clock time captured before activation.

```json
{
  "type": "DeactivateShadowCallback"
}
```
