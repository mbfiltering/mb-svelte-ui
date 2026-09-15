// A named import, so a consumer's bundle carries the version string and not the whole manifest.
import { version as packageVersion } from '../package.json';

/** Installed version of @mbsmart/ui */
export const version = packageVersion;

// Announce the loaded library version once (ES modules evaluate a single time,
// so importing this from multiple entry barrels still logs only once).
// package.json lists this file under `sideEffects`, which is what keeps the log
// from being tree-shaken away now that every other module is side-effect free.
console.log('@mbsmart/ui version:', version);
