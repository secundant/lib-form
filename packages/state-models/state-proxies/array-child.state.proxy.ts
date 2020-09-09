import { StateProxy } from '@lib-form/state-models/interfaces/state-proxy';

export class ArrayChildStateProxy implements StateProxy<ArrayChildStatePart, {}> {
  static formatPath: FormatArrayChildPath = (index, parentPath) =>
    parentPath ? `${parentPath}[${index}]` : `[${index}]`;

  constructor(private getIndex: () => number, private getParentPath: () => string | null) {}

  get(): ArrayChildStatePart {
    return {
      index: this.getIndex(),
      path: ArrayChildStateProxy.formatPath(this.getIndex(), this.getParentPath())
    };
  }

  handle(): void {
    // All updates by parent
  }

  shouldBeHandled(): boolean {
    return false;
  }
}

export interface FormatArrayChildPath {
  (index: number, parentPath: string | null): string;
}

export interface ArrayChildStatePart {
  index: number;
  path: string;
}
