import { StateProxy } from '@lib-form/state-models';
import { AbstractField } from '@lib-form/state-models/fields/abstract';
import { ArrayChildStatePart } from '@lib-form/state-models/state-proxies/array-child.state.proxy';
import { hasOwnProp } from '@lib-form/shared/utils/Object/hasOwnProp';
import { equals } from 'ramda';

export class ArrayValueStateProxy<ChildValue>
  implements StateProxy<ArrayValueStatePart<ChildValue>, {}> {
  constructor(
    private getChildren: () => Array<AbstractField<ComputedExpectedChildState<ChildValue>>>,
    private handleUpdate: (nextValue: ChildValue[]) => unknown
  ) {}

  get(): ArrayValueStatePart<ChildValue> {
    const children = this.getChildren();
    const value = children.reduce<ArrayValueStatePart<ChildValue>['value']>(
      (accValue, { state: { index, value } }) => {
        accValue[index] = value;
        return accValue;
      },
      Array.from({ length: children.length })
    );

    return {
      value
    };
  }

  handle<State extends ArrayValueStatePart<ChildValue>>(updates: Partial<State>): void {
    this.handleUpdate(updates.value!);
  }

  shouldBeHandled<State extends ArrayValueStatePart<ChildValue>>(
    updates: Partial<State>,
    prevState: State
  ): boolean {
    return hasOwnProp('value', updates) && !equals(updates.value, prevState.value);
  }
}

interface ComputedExpectedChildState<ChildValue>
  extends ArrayValueExpectedChildState<ChildValue>,
    ArrayChildStatePart {}

export interface ArrayValueExpectedChildState<ChildValue> {
  value: ChildValue;
}

export interface ArrayValueStatePart<ChildValue> {
  value: ChildValue[];
}
