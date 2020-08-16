import { StateProxy } from '@lib-form/state-models/interfaces/state-proxy';
import { hasOwnProp } from '@lib-form/shared/utils/Object/hasOwnProp';

export class StaticValueStateProxy<Value> implements StateProxy<StaticValueStatePart<Value>, {}> {
  protected value: Value;

  constructor(initialValue: Value) {
    this.value = initialValue;
  }

  get(): StaticValueStatePart<Value> {
    return {
      value: this.value
    };
  }

  handle<State extends StaticValueStatePart<Value>>(updates: Partial<State>): void {
    this.value = updates.value!;
  }

  shouldBeHandled<State extends StaticValueStatePart<Value>>(updates: Partial<State>): boolean {
    return hasOwnProp('value', updates) && updates.value !== this.value;
  }
}

export interface StaticValueStatePart<Value> {
  value: Value;
}
