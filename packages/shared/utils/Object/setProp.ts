export const setProp = <Key extends string, Value>(
  target: Record<Key, Value>,
  key: Key,
  value: Value
) => {
  target[key] = value;
  return target;
};
