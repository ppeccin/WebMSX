// Global type declarations for WebMSX

declare var wmsx: any;
declare var WMSX: any;

// Deprecated ApplicationCache API (removed from browsers but used for legacy support)
interface ApplicationCache extends EventTarget {
    readonly status: number;
    readonly UNCACHED: number;
    readonly IDLE: number;
    readonly CHECKING: number;
    readonly DOWNLOADING: number;
    readonly UPDATEREADY: number;
    readonly OBSOLETE: number;
    swapCache(): void;
    update(): void;
}

interface Window {
    applicationCache?: ApplicationCache;
    onhelp?: ((this: Window, ev: Event) => any) | null;
}

// Vendor-prefixed Pointer Lock API (legacy browser support)
interface Document {
    onmozpointerlockchange?: ((this: Document, ev: Event) => any) | null;
    mozExitPointerLock?: () => void;
    webkitExitPointerLock?: () => void;
    readonly mozPointerLockElement?: Element | null;
    readonly webkitPointerLockElement?: Element | null;
}
