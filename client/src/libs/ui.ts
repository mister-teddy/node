/**
 * This is a safe wrapper around the `document.startViewTransition` method.
 * To make sure that it won't crash on browsers that do not support it.
 */
export function startViewTransition(
  callback: Parameters<typeof document.startViewTransition>[0]
) {
  if (document.startViewTransition) {
    return document.startViewTransition(callback);
  } else {
    if (typeof callback === "function") {
      return callback();
    }
    // If callback is not a function, do nothing or handle accordingly
    return;
  }
}
