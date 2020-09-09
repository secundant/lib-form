import { identity } from 'ramda';

export interface FirstArrayDuplicateInfo {
  firstIndex: number;
  lastIndex: number;
}

/**
 * If duplicate found, - returns first and last index of duplicated items
 */
export const tryFindFirstArrayDuplicate = <T, Value>(
  array: T[],
  getValue: (item: T) => Value = identity as any
): FirstArrayDuplicateInfo | null => {
  const passedKeys: Value[] = [];

  for (let index = 0; index < array.length; index++) {
    const item = array[index];
    const value = getValue(item);
    const firstDuplicateIndex = passedKeys.indexOf(value);

    if (firstDuplicateIndex > 0) {
      return {
        firstIndex: firstDuplicateIndex,
        lastIndex: index
      };
    }
    passedKeys.push(value);
  }
  return null;
};
