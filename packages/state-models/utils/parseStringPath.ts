import { filter, ifElse, isEmpty, pipe, split } from 'ramda';

/**
 * a.b.c => ['a', 'b', 'c']
 * a[1].b => ['a', '1', 'b']
 * a..c => ['a', 'c']
 * TODO memoize
 */
export const parseStringPath = ifElse<string, string[], string[]>(
  isEmpty,
  () => [],
  pipe<string, string[], string[]>(
    split(/[.[\]]+/),
    filter(part => !!part)
  )
);
