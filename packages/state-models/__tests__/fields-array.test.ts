import { Field, FieldsGroup } from '@lib-form/state-models';
import { FieldsArray } from '@lib-form/state-models/fields/array';

describe('@lib-form/state-models : FieldsArray', () => {
  const createModels = () => {
    const foo = new Field(1);
    const bar = new Field(2);
    const group = new FieldsGroup({
      first: new Field(3),
      second: new Field(4)
    });
    const array = new FieldsArray([foo, bar, group] as any);

    return { array, group, foo, bar };
  };

  test('Should correctly set initial value', () => {
    const { array } = createModels();

    expect(array.state).toEqual({
      value: [
        1,
        2,
        {
          first: 3,
          second: 4
        }
      ]
    });
  });

  test('Should correctly apply children update', () => {
    const { array, foo, bar, group } = createModels();

    array.apply(() => [bar, group]);
    expect(array.state).toEqual({
      value: [
        2,
        {
          first: 3,
          second: 4
        }
      ]
    });

    // Because duplicates
    expect(() => array.apply(() => [group, foo, foo, foo])).toThrow();
  });

  test('Should update child model on update array model value', () => {
    const { group, array, foo, bar } = createModels();

    array.update({
      value: [
        10,
        20,
        {
          first: -1,
          second: -2
        }
      ]
    });

    expect(foo.state.value).toEqual(10);
    expect(bar.state.value).toEqual(20);
    expect(group.state.value).toEqual({
      first: -1,
      second: -2
    });
  });

  test('Children have index and path', () => {
    const { group, bar } = createModels();

    expect(group.getField('first').state).toEqual({
      path: '[2].first',
      name: 'first',
      value: 3
    });
    expect(group.state).toEqual({
      index: 2,
      path: '[2]',
      value: { first: 3, second: 4 }
    });
    expect(bar.state).toEqual({
      index: 1,
      path: '[1]',
      value: 2
    });
  });

  test('Should correctly works with batch', () => {
    const { group, array, foo, bar } = createModels();
    const arrayListener = jest.fn();

    array.subscribe(arrayListener);
    array.batch(() => {
      array.update({
        value: [100, 200, { first: 0, second: 1 }]
      });
      foo.update({
        value: 20
      });
      array.apply(() => [group, foo, bar]);
    });

    expect(arrayListener).toHaveBeenCalledTimes(1);
    expect(arrayListener).toHaveBeenCalledWith({
      prevState: {
        value: [1, 2, { first: 3, second: 4 }]
      },
      nextState: {
        value: [{ first: 0, second: 1 }, 20, 200]
      }
    });
    expect(group.getField('first').state).toEqual({
      path: '[0].first',
      name: 'first',
      value: 0
    });
  });
});
