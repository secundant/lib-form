export class NotFoundFieldError extends Error {
  constructor(path: string, parentPath?: string) {
    super(`Not found field "${path}" at ${parentPath ? `"${parentPath}"` : 'unnamed'} parent`);
    this.name = 'NotFoundFieldError';
  }
}
