// Global type declarations for WebMSX

declare var wmsx: any;
declare var WMSX: any;
declare var WMSXFullScreenSetup: any;

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

// Custom Error property for WebMSX error handling
interface Error {
    wmsx?: boolean;
}

// Custom properties added to DOM elements for WebMSX UI functionality
// Extended on both Element and HTMLElement to cover all DOM element types
interface Element {
    wmsxBarElementType?: number;
    wmsxBX?: number;
    wmsxBY?: number;
    wmsxButton?: string;
    wmsxCommand?: any;
    wmsxControl?: any;
    wmsxControlItem?: any;
    wmsxDec?: boolean;
    wmsxDefaultItem?: any;
    wmsxDiskNum?: number;
    wmsxDropInfo?: any;
    wmsxDropTarget?: boolean;
    wmsxHidden?: boolean;
    wmsxIgnoreEnterFS?: boolean;
    wmsxIndex?: number;
    wmsxItemIndex?: number;
    wmsxItems?: any;
    wmsxKey?: any;
    wmsxKeyID?: string;
    wmsxLabel?: string;
    wmsxLastValidValue?: string;
    wmsxMachine?: any;
    wmsxMapping?: any;
    wmsxMappingIsKeys?: boolean;
    wmsxMenu?: any;
    wmsxMenuIndex?: number;
    wmsxMenuOption?: number;
    wmsxNeedsUIG?: boolean;
    wmsxOption?: any;
    wmsxPort?: any;
    wmsxRefElement?: Element;
    wmsxScroll?: number;
    wmsxSlot?: number;
    wmsxText?: Element;
    wmsxTitle?: string;
}

interface HTMLElement {
    wmsxBarElementType?: number;
    wmsxBX?: number;
    wmsxBY?: number;
    wmsxButton?: string;
    wmsxCommand?: any;
    wmsxControl?: any;
    wmsxControlItem?: any;
    wmsxDec?: boolean;
    wmsxDefaultItem?: any;
    wmsxDiskNum?: number;
    wmsxDropInfo?: any;
    wmsxDropTarget?: boolean;
    wmsxHidden?: boolean;
    wmsxIgnoreEnterFS?: boolean;
    wmsxIndex?: number;
    wmsxItemIndex?: number;
    wmsxItems?: any;
    wmsxKey?: any;
    wmsxKeyID?: string;
    wmsxLabel?: string;
    wmsxLastValidValue?: string;
    wmsxMachine?: any;
    wmsxMapping?: any;
    wmsxMappingIsKeys?: boolean;
    wmsxMenu?: any;
    wmsxMenuIndex?: number;
    wmsxMenuOption?: number;
    wmsxNeedsUIG?: boolean;
    wmsxOption?: any;
    wmsxPort?: any;
    wmsxRefElement?: HTMLElement;
    wmsxScroll?: number;
    wmsxSlot?: number;
    wmsxText?: HTMLElement;
    wmsxTitle?: string;
}

// Custom properties added to File objects for tracking multi-file read operations
interface File {
    wmsxSuccess?: boolean;
    wmsxError?: string;
}

// Custom properties on EventTarget for event handling
interface EventTarget {
    wmsxIgnoreEnterFS?: boolean;
    wmsxNeedsUIG?: boolean;
    parentElement?: Element | null;
}
