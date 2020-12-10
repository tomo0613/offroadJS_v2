// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VoidFnc = (...args: any[]) => void;

interface Window {
    aspectRatio: number;
 }

 interface ObjectConstructor {
    omit: <O, K extends keyof O = keyof O>(obj: O, ...keysToOmit: K[]) => Omit<O, K>;
    pick: <O, K extends keyof O = keyof O>(obj: O, ...keysToPick: K[]) => Pick<O, K>;
}
