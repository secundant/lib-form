import { StateProxy } from '@lib-form/state-models/interfaces/state-proxy';

export class DuplicateProxyError extends Error {
  constructor(proxy: StateProxy<any, any>) {
    console.debug({
      proxy
    });
    const name = proxy.constructor?.name;

    super('Cannot override proxy ' + (name ? `"${name}"` : proxy));
    this.name = 'DuplicateProxyError';
  }
}
