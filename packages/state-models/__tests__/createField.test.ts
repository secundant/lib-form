import { createField } from '@lib-form/state-models/createField';

describe('@lib-form/state-models - createField', () => {
  test('Should create record', () => {
    expect(
      createField({
        foo: 1
      }).getField('foo').state.value
    ).toBe(1);
  });

  test('Should create value fields', () => {
    expect(createField(1).state).toEqual({
      value: 1
    });

    expect(createField('foo').state).toEqual({
      value: 'foo'
    });
  });

  test('Should create array', () => {
    expect(createField([1, 2, 3]).state).toEqual({
      value: [1, 2, 3]
    });

    expect(createField([1, 2, 3]).getField('[1]').state).toEqual({
      value: 2,
      index: 1,
      path: '[1]'
    });
  });

  test('Should create nested tree', () => {
    expect(
      createField({
        foo: {
          bar: [
            1,
            {
              baz: 'foo'
            }
          ]
        }
      }).getField('foo.bar[1].baz').state
    ).toEqual({
      name: 'baz',
      path: 'foo.bar[1].baz',
      value: 'foo'
    });
  });
});
