export const hasOwnProp = <K extends string | number | symbol, T extends Record<K, any>>(
  key: K,
  record: unknown
): record is T => nativeObjectHasOwnProperty.call(record, key);

const nativeObjectHasOwnProperty = Object.prototype.hasOwnProperty;
