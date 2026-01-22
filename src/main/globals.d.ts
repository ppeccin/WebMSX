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
}
