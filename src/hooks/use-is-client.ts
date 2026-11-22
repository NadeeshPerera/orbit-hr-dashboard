import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** true in the browser after hydration, false during SSR, without setState-in-effect. */
export const useIsClient = () => useSyncExternalStore(noop, () => true, () => false);
