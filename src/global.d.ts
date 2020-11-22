// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VoidFnc = (...args: any[]) => void;

interface Window {
    aspectRatio: number;
    importMap: (mapData: any) => void;
    exportMap: () => void;
 }
