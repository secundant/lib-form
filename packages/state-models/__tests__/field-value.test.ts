import { StateProxy } from '@lib-form/state-models/interfaces/state-proxy';
import { hasOwnProp } from '@lib-form/shared/utils/Object/hasOwnProp';
import { Field } from '@lib-form/state-models/fields/field';

describe('@mlr-form-engine/state : FieldValue и проксирование состояния', () => {
  describe('Расширение состояния через написание прокси', () => {
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

    test('Данные из прокси расширили состояние', () => {
      expect(field.state).toEqual({
        value: 10,
        age: 0
      });
      expect(getStateSpy).toHaveBeenCalledTimes(1);
      expect(listener).not.toHaveBeenCalled();
    });

    test('Апдейт состояния передался оповестил прокси', () => {
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

    test('Апдейт состояния, не относящегося к прокси, будет ею проигнорирован', () => {
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

  describe('Верхнеуровневое апи', () => {
    test('Верхнеуровневое обновление и получение состояния', () => {
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
});
