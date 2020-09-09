import { AbstractField, FieldChangePayload } from '@lib-form/state-models/fields/abstract';
import { ArrayChildStateProxy } from '@lib-form/state-models/state-proxies/array-child.state.proxy';
import {
  ArrayValueExpectedChildState,
  ArrayValueStateProxy
} from '@lib-form/state-models/state-proxies/array-value.state.proxy';
import { Subscription } from 'rxjs';
import { ChildAccessor } from '@lib-form/state-models/interfaces/child-accessor';
import { sortBy } from 'ramda';
import { tryFindFirstArrayDuplicate } from '@lib-form/state-models/utils/tryFindFirstArrayDuplicate';
import { DuplicateArrayMemberError } from '@lib-form/state-models/errors/DuplicateArrayMemberError';

export class FieldsArray<ChildValue> extends AbstractField<any> implements ChildAccessor {
  private dataByField = new Map<AbstractField<any>, ChildData>();
  private computedChildren: Array<AbstractField<any>> = [];

  private valueProxy = new ArrayValueStateProxy<ChildValue>(
    () => this.children,
    nextValue => this.updateValue(nextValue)
  );

  constructor(initialChildren: Array<AbstractField<ArrayValueExpectedChildState<ChildValue>>>) {
    super();
    // TODO fix types
    this.addProxy(this.valueProxy as any);
    this.apply(() => initialChildren);
  }

  tryGetChild(index: string): AbstractField<any> | null {
    return this.children[+index] ?? null;
  }

  indexOf = (child: AbstractField<any>): number => this.dataByField.get(child)!.index;

  get children(): Array<AbstractField<any>> {
    return this.computedChildren;
  }

  get batching(): boolean {
    return super.batching;
  }

  set batching(batching: boolean) {
    this.children.forEach(child => {
      child.batching = batching;
    });
    super.batching = batching;
  }

  apply(fn: (list: Array<AbstractField<any>>) => Array<AbstractField<any>>): void {
    const prevChildren = this.children;
    const nextChildren = fn([...prevChildren]);

    const duplicate = tryFindFirstArrayDuplicate(nextChildren);

    if (duplicate) {
      throw new DuplicateArrayMemberError(duplicate.lastIndex, duplicate.firstIndex);
    }
    this.batch(() => {
      for (const child of prevChildren) {
        if (!nextChildren.includes(child)) this.removeChild(child);
      }
      nextChildren.forEach((child, index) => {
        const method = this.dataByField.has(child) ? this.updateChild : this.addChild;

        method.call(this, child, { index });
      });

      this.computedChildren = nextChildren;
      this.updateSelfValue();
    });
  }

  protected beforeBatchingEnd(): void {
    if (Array.from(this.dataByField.values()).some(data => !!data.updatesUntilBatched)) {
      this.updateSelfValue();
    }
  }

  protected afterComputingState(prevState: { path?: string }): void {
    if (prevState.path !== this.state.path) {
      this.children.forEach(child => this.updateChildState(child));
    }
  }

  // == Internal methods for manipulating children ==

  private addChild(field: AbstractField<any>, { index }: ChildInfo) {
    const proxy = new ArrayChildStateProxy(
      () => this.dataByField.get(field)!.index,
      () => (this.state as any).path ?? null
    );

    field.addProxy(proxy);
    field.computeAndEmitNextState(true);
    this.dataByField.set(field, {
      index,
      proxy,
      subscription: field.subscribe(e => {
        if (this.batching) {
          this.handleChildUpdateWithBatch(field, e);
        } else {
          this.applyChildUpdate(e);
        }
      })
    });
    this.computeChildren();
  }

  private removeChild(field: AbstractField<any>) {
    if (!this.dataByField.has(field)) {
      // TODO Add custom error
      throw new Error();
    }
    const { proxy, subscription } = this.dataByField.get(field)!;

    subscription.unsubscribe();
    this.dataByField.delete(field);
    this.computeChildren();
    field.removeProxy(proxy);
    field.computeAndEmitNextState(true);
  }

  private updateChild(field: AbstractField<any>, { index }: ChildInfo) {
    const data = this.dataByField.get(field)!;

    if (data.index !== index) {
      data.index = index;
      this.computeChildren();
      field.getStateFromProxy(data.proxy);
      field.computeAndEmitNextState(true);
    }
  }

  // ======

  /**
   * Applies updates of children values
   * Ex. myArray.update({ value: [1, 2, 3] }) = calls > updateValue([1, 2, 3])
   */
  private updateValue(nextValue: ChildValue[]) {
    this.batch(() => {
      nextValue.forEach((value, index) => {
        this.children[index].update({ value });
      });
      this.updateSelfValue();
    });
  }

  private updateSelfValue() {
    this.getStateFromProxy(this.valueProxy as any);
    this.computeState();
  }

  private computeChildren() {
    this.computedChildren = sortBy(this.indexOf, Array.from(this.dataByField.keys()));
  }

  // TODO Add optimization for batch mode (rework children observing to more reactive)
  private applyChildUpdate({ prevState, nextState }: FieldChangePayload<any>) {
    if (prevState.value !== nextState.value) this.updateSelfValue();
  }

  private handleChildUpdateWithBatch(
    field: AbstractField<any>,
    { prevState, nextState }: FieldChangePayload<any>
  ) {
    const childData = this.dataByField.get(field)!;

    childData.updatesUntilBatched = {
      nextState,
      prevState: childData.updatesUntilBatched?.prevState ?? prevState
    };
  }

  private updateChildState(field: AbstractField<any>) {
    field.getStateFromProxy(this.dataByField.get(field)!.proxy);
    field.computeAndEmitNextState(true);
  }
}

interface ChildData {
  index: number;
  proxy: ArrayChildStateProxy;
  subscription: Subscription;

  updatesUntilBatched?: FieldChangePayload<any>;
}

interface ChildInfo {
  index: number;
}
