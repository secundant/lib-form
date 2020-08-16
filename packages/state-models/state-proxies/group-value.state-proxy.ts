import { StateProxy } from '@lib-form/state-models/interfaces/state-proxy';
import { setProp } from '@lib-form/shared/utils/Object/setProp';
import { hasOwnProp } from '@lib-form/shared/utils/Object/hasOwnProp';

export class GroupValueStateProxy implements StateProxy<GroupValueStatePart, {}> {
  constructor(private options: GroupValueStateProxyOptions) {}

  get(): GroupValueStatePart {
    const { getChildNames, getChildValue } = this.options;

    return {
      value: getChildNames().reduce(
        (record, name) => setProp(record, name, getChildValue(name)),
        {} as Record<string, any>
      )
    };
  }

  handle<State extends GroupValueStatePart>(updates: Partial<State>): void {
    // eslint-disable-next-line
    for (const [name, value] of Object.entries(updates.value!)) {
      this.options.setChildValue(name, value);
    }
  }

  shouldBeHandled<State extends GroupValueStatePart>(updates: Partial<State>): boolean {
    return hasOwnProp('value', updates);
  }
}

export interface GroupValueStatePart {
  value: Record<string, any>;
}

export interface GroupValueStateProxyOptions {
  getChildNames(): string[];
  getChildValue(name: string): any;
  setChildValue(name: string, value: any): any;
}
