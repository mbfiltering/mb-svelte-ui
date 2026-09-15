import '../version.js';

// Utils barrel export
export * from './categoryColors.js';
export * from './dateTime.js';
export * from './dismiss.js';
export * from './fieldError.js';
export * from './fonts.js';
export * from './legal.js';
export * from './preferences.js';
export * from './stringUtils.js';
export * from './theme.js';
export * from './urlUtils.js';
export * from './i18n/index.js';

// Minimized-modal stack (default and named exports)
export { default as minimizedModals, registerMinimized, unregisterMinimized } from './minimizedModals.js';

// Toast store (default and named exports)
export { default as toasts, toast, showToast, removeToast } from './toastStore.js';
