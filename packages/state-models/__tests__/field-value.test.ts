import { StateProxy } from '@lib-form/state-models/interfaces/state-proxy';
import { hasOwnProp } from '@lib-form/shared/utils/Object/hasOwnProp';
import { Field } from '@lib-form/state-models/fields/field';

describe('@lib-form/state-models - FieldValue', () => {
  test('Should pass state and updates', () => {
    const field = new Field(10);
    const listener = jest.fn();

    field.subscribe(listener);
    expect(field.state).toEqual({
      value: 10
    });
    field.update({
      value: 11
    });
    expect(field.state).toEqual({
      value: 11
    });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      prevState: {
        value: 10
      },
      nextState: {
        value: 11
      }
    });
  });
});

describe('@lib-form/state-models - concatenated state logic', () => {
  const setStateSpy = jest.fn();
  const getStateSpy = jest.fn();

  interface MyProxyState {
    age: number;
  }

  class MyProxy implements StateProxy<MyProxyState, {}> {
    age = 0;

    get = getStateSpy.mockImplementation(() => ({
      age: this.age
    }));

    handle = setStateSpy.mockImplementation(updates => {
      this.age = updates.age!;
    });

    shouldBeHandled(updates: Partial<MyProxyState>) {
      return hasOwnProp('age', updates);
    }
  }

  const proxy = new MyProxy();
  const field = new Field<number>(10);
  const listener = jest.fn();

  field.subscribe(listener);
  field.addProxy(proxy, {
    emit: false
  });
  field.resetPrevState();

  test('Should extend state', () => {
    expect(field.state).toEqual({
      value: 10,
      age: 0
    });
    expect(getStateSpy).toHaveBeenCalledTimes(1);
    expect(listener).not.toHaveBeenCalled();
  });

  test('Should handle state update', () => {
    field.update({
      age: 100
    });

    expect(field.state).toEqual({
      age: 100,
      value: 10
    });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getStateSpy).toHaveBeenCalledTimes(2);
    expect(setStateSpy).toHaveBeenCalledTimes(1);
    expect(setStateSpy).toHaveBeenCalledWith(
      {
        age: 100
      },
      {
        age: 0,
        value: 10
      }
    );
  });

  test('Should ignore updates of other state parts', () => {
    field.update({
      value: 1000
    });
    expect(field.state).toEqual({
      age: 100,
      value: 1000
    });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(setStateSpy).toHaveBeenCalledTimes(1);
    expect(getStateSpy).toHaveBeenCalledTimes(2);
  });
});
