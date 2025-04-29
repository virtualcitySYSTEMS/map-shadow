/* eslint-disable import/first */
import { vi } from 'vitest';

vi.hoisted(() => {
  globalThis.jest = vi;
});

import ResizeObserver from 'resize-observer-polyfill';

globalThis.ResizeObserver = ResizeObserver;

import 'jest-canvas-mock';

window.CESIUM_BASE_URL = '/node_modules/@vcmap-cesium/engine/Build/';
