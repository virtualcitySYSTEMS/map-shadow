# @vcmap/shadow

> Part of the [VC Map Project](https://github.com/virtualcitySYSTEMS/map-ui)

The Shadow tool can be used to control the time and date settings of the 3D Cesium map for shadow calculations.

## Configuration

The `ShadowConfig` contains the following options:

| property        | type    | default | description                                                                                     |
| --------------- | ------- | ------- | ----------------------------------------------------------------------------------------------- |
| activeOnStartup | boolean | false   | Whether the shadow tool is activated automatically on startup when no initial state is present. |

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
Accepts either `ShadowState` format or the URL-compressed `ShadowUrlState` format.
All date/time values are ISO 8601 strings.

| property     | URL key | type      | description                                                                                                                       |
| ------------ | ------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| originalTime | `ot`    | string    | Baseline ISO 8601 time captured when the shadow simulation is first activated. Used to restore the original map time on teardown. |
| timeOnClose  | `toc`   | string    | Last ISO 8601 clock time when the tool was closed/deactivated. Used to resume from the previous position on the next activation.  |
| animate      | `a`     | boolean   | Whether the automatic shadow animation should start immediately after activation.                                                 |
| duration     | `d`     | number    | Total duration of one animation cycle in the currently selected time unit.                                                        |
| timeUnit     | `tu`    | TimeUnits | Time unit used for animation and duration interpretation (for example day or year).                                               |
| endDate      | `ed`    | string    | Optional ISO 8601 target time at which the animation stops and the state is reset.                                                |

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
