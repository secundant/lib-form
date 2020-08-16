export class DuplicateChildNameError extends Error {
  constructor(name: string, parentPath: string | null) {
    super(`Duplicates child "${name}" at ${parentPath ? `"${parentPath}"` : 'unnamed'} group`);
    this.name = 'DuplicateChildNameError';
  }
}
