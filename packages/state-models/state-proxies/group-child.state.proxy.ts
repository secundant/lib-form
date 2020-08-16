import { StateProxy } from '@lib-form/state-models/interfaces/state-proxy';
import { hasOwnProp } from '@lib-form/shared/utils/Object/hasOwnProp';

export class GroupChildStateProxy implements StateProxy<GroupChildStatePart, {}> {
  static formatPath: FormatGroupChildPath = (name, parentPath) =>
    parentPath ? `${parentPath}.${name}` : name;

  constructor(private name: string, private getParentPath: () => string | null) {}

  get(): GroupChildStatePart {
    return {
      name: this.name,
      path: GroupChildStateProxy.formatPath(this.name, this.getParentPath())
    };
  }

  handle<State extends GroupChildStatePart>(updates: Partial<State>): void {
    // eslint-disable-next-line
    this.name = updates.name!;
  }

  shouldBeHandled<State extends GroupChildStatePart>(updates: Partial<State>): boolean {
    return hasOwnProp('name', updates) && updates.name !== this.name;
  }
}

export interface FormatGroupChildPath {
  (name: string, parentPath: string | null): string;
}

export interface GroupChildStatePart {
  name: string;
  path: string;
}
