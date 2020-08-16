export class NotFoundGroupChildNameError extends Error {
  constructor(name: string, parentPath: string | null) {
    super(`Not found "${name}" child at ${parentPath ? `"${parentPath}"` : 'unnamed'} group`);
    this.name = 'NotFoundGroupChildNameError';
  }
}
