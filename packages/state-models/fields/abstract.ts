import { Observable, Subject } from 'rxjs';
import { StateProxy } from '@lib-form/state-models/interfaces/state-proxy';
import { DuplicateProxyError } from '@lib-form/state-models/errors/DuplicateProxyError';
import { NotFoundProxyError } from '@lib-form/state-models/errors/NotFoundProxyError';
import { getProxyStateOrNull, isHandledProxy } from '@lib-form/state-models/utils/state-proxy';
import { NotFoundFieldError } from '@lib-form/state-models/errors/NotFoundFieldError';
import { parseStringPath } from '@lib-form/state-models/utils/parseStringPath';
import { geAbstractFieldChild } from '@lib-form/state-models/utils/geAbstractFieldChild';

export abstract class AbstractField<ComputedState extends {}> extends Observable<
  FieldChangePayload<ComputedState>
> {
  private subject$ = new Subject<FieldChangePayload<ComputedState>>();
  private stateByProxy = new Map<StateProxy<any, any>, any>();
  private changedProxies = new Set<StateProxy<any, any>>();
  private currentState: ComputedState = {} as ComputedState;
  private prevState: ComputedState = {} as ComputedState;
  /**
   * Count of "model.batch(() => model.batch(() => model.batch(() => ...)))" calls
   * We want emit events only after requested batches ends
   */
  private batchCount = 0;

  protected constructor() {
    super(observer => this.subject$.subscribe(observer));
  }

  get state(): Readonly<ComputedState> {
    return this.currentState;
  }

  get batching(): boolean {
    return this.batchCount > 0;
  }

  set batching(batching: boolean) {
    if (batching) {
      this.batchCount++;
    } else if (this.batchCount > 0) {
      if (this.batchCount === 1) {
        this.beforeBatchingEnd();
      }
      this.batchCount--;
      if (this.batchCount === 0) {
        this.emitNext();
      }
    }
  }

  protected abstract beforeBatchingEnd(): void;
  protected abstract afterComputingState(prevState: ComputedState): void;

  getField(path: string): AbstractField<any> {
    const model = this.tryGetField(path);

    if (!model) {
      throw new NotFoundFieldError(path, (this.state as any).path);
    }
    return model;
  }

  tryGetField(path: string): AbstractField<any> | null {
    return parseStringPath(path).reduce<AbstractField<any> | null>(geAbstractFieldChild, this);
  }

  batch(fn: () => any): void {
    this.batching = true;
    fn();
    this.batching = false;
  }

  /**
   * @return {Boolean} - true if something updated
   */
  update(updates: Partial<ComputedState>, { emit = true }: FieldUpdateOptions = {}): boolean {
    const proxiesToUpdate = Array.from(this.stateByProxy.keys()).filter(proxy =>
      isHandledProxy(proxy, updates, this.currentState)
    );

    if (!proxiesToUpdate.length) {
      return false;
    }
    proxiesToUpdate.forEach(proxy => {
      proxy.handle(updates, this.currentState);
      this.getStateFromProxy(proxy);
    });
    this.computeAndEmitNextState(emit);
    return true;
  }

  addProxy(proxy: StateProxy<any, any>, { emit = true }: FieldStateProxyOptions = {}): void {
    this.assertHaveNotProxy(proxy);
    this.stateByProxy.set(proxy, getProxyStateOrNull(proxy, this.currentState));
    this.changedProxies.add(proxy);
    this.computeAndEmitNextState(emit);
  }

  removeProxy(proxy: StateProxy<any, any>, { emit = true }: FieldStateProxyOptions = {}): void {
    this.assertHaveProxy(proxy);
    this.stateByProxy.delete(proxy);
    this.changedProxies.delete(proxy);
    this.computeAndEmitNextState(emit);
  }

  getStateFromProxy(proxy: StateProxy<any, any>): void {
    this.assertHaveProxy(proxy);
    this.stateByProxy.set(proxy, getProxyStateOrNull(proxy, this.currentState));
    this.changedProxies.add(proxy);
  }

  computeState(): void {
    if (!this.changedProxies.size) return;
    this.currentState = Array.from(this.stateByProxy.values()).reduce(
      (currentState, proxyState) => Object.assign(currentState, proxyState),
      {} as ComputedState
    );
    this.changedProxies.clear();
    this.afterComputingState(this.prevState);
  }

  resetPrevState(): void {
    this.prevState = this.currentState;
  }

  emitNext(): void {
    const { prevState, currentState: nextState } = this;

    if (this.batching || nextState === prevState) return;
    this.prevState = nextState;
    this.subject$.next({
      nextState,
      prevState
    });
  }

  computeAndEmitNextState(emit?: boolean): void {
    this.computeState();
    if (emit) {
      this.emitNext();
    }
  }

  // Asserts

  private assertHaveNotProxy(proxy: StateProxy<any, any>): void {
    if (this.stateByProxy.has(proxy)) {
      throw new DuplicateProxyError(proxy);
    }
  }

  private assertHaveProxy(proxy: StateProxy<any, any>): void {
    if (!this.stateByProxy.has(proxy)) {
      throw new NotFoundProxyError(proxy);
    }
  }
}

export interface FieldStateProxyOptions {
  emit?: boolean;
}

export interface FieldUpdateOptions {
  emit?: boolean;
}

export interface FieldChangePayload<ComputedState extends {}> {
  prevState: ComputedState;
  nextState: ComputedState;
}
