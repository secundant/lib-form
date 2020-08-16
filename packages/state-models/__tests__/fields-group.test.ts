import { Field } from '@lib-form/state-models/fields/field';
import { FieldsGroup } from '@lib-form/state-models/fields/group';
import { AbstractField } from '@lib-form/state-models/fields/abstract';

const createGroup = (children?: Record<string, AbstractField<any>>) => {
  const foo = new Field(1);
  const bar = new Field(2);
  const group = new FieldsGroup({ foo, bar, ...children });

  return { group, foo, bar };
};

// tslint:disable-next-line
describe('@lib-form/state-models : FieldsGroup', () => {
  test('Group updates self state when child was updated', () => {
    const { group, foo } = createGroup();
    const callback = jest.fn();

    group.subscribe(callback);

    foo.update({
      value: 12
    });

    expect(group.state).toEqual({
      value: {
        foo: 12,
        bar: 2
      }
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('Batch mode aggregates all updates', () => {
    const { group, foo, bar } = createGroup();
    const callback = jest.fn();

    group.subscribe(callback);

    group.batch(() => {
      foo.update({
        value: 6
      });
      bar.update({
        value: 66,
        name: 'bazz'
      });
    });

    expect(group.state).toEqual({
      value: {
        foo: 6,
        bazz: 66
      }
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('Batch mode works with nested children', () => {
    const { group, foo, bar } = createGroup();
    const callback = jest.fn();
    const fooCallback = jest.fn();
    const barCallback = jest.fn();
    const newFooName = 'foo-new-name';

    group.subscribe(callback);
    foo.subscribe(fooCallback);
    bar.subscribe(barCallback);

    group.batch(() => {
      group.update({
        value: {
          foo: 'value-foo',
          bar: 'value-bar'
        }
      });
      foo.update({
        name: newFooName
      });
    });

    expect(fooCallback).toHaveBeenCalledTimes(1);
    expect(barCallback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({
      prevState: {
        value: {
          foo: 1,
          bar: 2
        }
      },
      nextState: {
        value: {
          [newFooName]: 'value-foo',
          bar: 'value-bar'
        }
      }
    });
    expect(foo.state).toEqual({
      path: newFooName,
      name: newFooName,
      value: 'value-foo'
    });
    expect(bar.state).toEqual({
      path: 'bar',
      name: 'bar',
      value: 'value-bar'
    });
  });

  test('Nested children updates handled', () => {
    console.time('GROUP_TIME');
    const child1 = createGroup();
    const child2 = createGroup();
    const root = createGroup({ child1: child1.group, child2: child2.group });

    const rootCallback = jest.fn();

    root.group.subscribe(rootCallback);

    root.group.update({
      value: {
        child1: {
          foo: 3,
          bar: 6
        },
        child2: {
          foo: 0
        },
        bar: -1
      }
    });
    child1.group.update({
      name: 'child_1'
    });
    child2.bar.update({
      name: 'child_2_bar',
      value: -2
    });

    expect(root.group.state).toEqual({
      value: {
        child_1: {
          foo: 3,
          bar: 6
        },
        child2: {
          foo: 0,
          child_2_bar: -2
        },
        bar: -1,
        foo: 1
      }
    });
    expect(child1.group.state).toEqual({
      name: 'child_1',
      path: 'child_1',
      value: {
        foo: 3,
        bar: 6
      }
    });
    expect(child1.foo.state).toEqual({
      name: 'foo',
      path: 'child_1.foo',
      value: 3
    });
    expect(root.group.getOptionalField('child2.child_2_bar')).toBe(child2.bar);
    expect(root.group.getOptionalField('child_1.foo')).toBe(child1.foo);

    root.group.batch(() => {
      root.group.update({
        value: {
          child_1: {
            foo: -5,
            bar: -10
          },
          child2: {
            foo: 100
          },
          foo: 5,
          bar: 10
        }
      });
      child1.bar.update({
        name: 'barOfFirst'
      });
      child2.group.update({
        name: 'second'
      });
    });

    expect(root.group.state).toEqual({
      value: {
        child_1: {
          foo: -5,
          barOfFirst: -10
        },
        second: {
          foo: 100,
          child_2_bar: -2
        },
        foo: 5,
        bar: 10
      }
    });
  });

  test('Смена имени корректно эмитит события в batch-режиме', () => {
    const { group, foo, bar } = createGroup();
    const fooListener = jest.fn();
    const barListener = jest.fn();
    const groupListener = jest.fn();

    foo.subscribe(fooListener);
    bar.subscribe(barListener);
    group.subscribe(groupListener);
    group.batch(() => {
      foo.update({
        name: 'renamed'
      });
      group.update({
        value: {
          foo: 10,
          bar: 5
        }
      });
      foo.update({
        value: -10
      });
    });

    expect(groupListener).toHaveBeenCalledTimes(1);
    expect(barListener).toHaveBeenCalledTimes(1);
    expect(fooListener).toHaveBeenCalledTimes(1);
    expect(fooListener).toHaveBeenCalledWith({
      prevState: {
        path: 'foo',
        name: 'foo',
        value: 1
      },
      nextState: {
        path: 'renamed',
        name: 'renamed',
        value: -10
      }
    });
    expect(group.state).toEqual({
      value: {
        renamed: -10,
        bar: 5
      }
    });
  });
});
