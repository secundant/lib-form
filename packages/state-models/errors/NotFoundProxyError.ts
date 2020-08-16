import { StateProxy } from '@lib-form/state-models/interfaces/state-proxy';

export class NotFoundProxyError extends Error {
  constructor(proxy: StateProxy<any, any>) {
    console.debug({
      proxy
    });
    const name = proxy.constructor?.name;

    super('Not found proxy ' + (name ? `"${name}"` : proxy));
    this.name = 'NotFoundProxyError';
  }
}
