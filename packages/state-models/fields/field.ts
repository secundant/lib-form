import { AbstractField } from '@lib-form/state-models/fields/abstract';
import { StaticValueStateProxy } from '@lib-form/state-models/state-proxies/static-value.state-proxy';

export class Field<Value> extends AbstractField<any> {
  constructor(initialValue: Value) {
    super();
    this.addProxy(new StaticValueStateProxy(initialValue), {
      emit: false
    });
    this.resetPrevState();
  }

  protected beforeBatchingEnd(): void {
    // ...
  }

  protected afterComputingState(): void {
    // ...
  }
}
