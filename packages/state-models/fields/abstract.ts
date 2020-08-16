import { Observable, Subject } from 'rxjs';
import { StateProxy } from '@lib-form/state-models/interfaces/state-proxy';
import { DuplicateProxyError } from '@lib-form/state-models/errors/DuplicateProxyError';
import { NotFoundProxyError } from '@lib-form/state-models/errors/NotFoundProxyError';
import { getProxyStateOrNull, isHandledProxy } from '@lib-form/state-models/utils/state-proxy';
import { equals } from 'ramda';

export class AbstractField<ComputedState extends {}> extends Observable<
  FieldChangePayload<ComputedState>
> {
  private subject$ = new Subject<FieldChangePayload<ComputedState>>();
  private proxyToStatePart = new Map<StateProxy<any, any>, StateProxyData<any>>();
  private currentState: ComputedState = {} as ComputedState;
  private prevState: ComputedState = {} as ComputedState;
  private _batching = false;

  constructor() {
    super(observer => this.subject$.subscribe(observer));
  }

  get state(): Readonly<ComputedState> {
    return this.currentState;
  }

  get batching(): boolean {
    return this._batching;
  }

  set batching(batching: boolean) {
    if (batching === this._batching) return;
    this._batching = batching;
    if (!batching) this.emitNext();
  }

  batch(fn: () => any): void {
    this.batching = true;
    fn();
    this.batching = false;
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

  update(updates: Partial<ComputedState>, { emit = true }: FieldUpdateOptions = {}): boolean {
    let updated = false;

    for (const [proxy, data] of this.proxyToStatePart) {
      if (!isHandledProxy(proxy, updates, this.currentState)) continue;
      proxy.handle(updates, this.currentState);
      data.changed = this.updateProxy(proxy) || data.changed;
      updated = data.changed || updated;
    }
    if (updated) {
      this.computeState();
      emit && this.emitNext();
    }
    return updated;
  }

  addProxy(proxy: StateProxy<any, any>, { emit = true }: FieldStateProxyOptions = {}): void {
    if (this.proxyToStatePart.has(proxy)) throw new DuplicateProxyError(proxy);
    this.proxyToStatePart.set(proxy, {
      changed: false,
      prevState: null
    });
    this.updateProxy(proxy);
    this.computeState();
    emit && this.emitNext();
  }

  removeProxy(proxy: StateProxy<any, any>, { emit = true }: FieldStateProxyOptions = {}): void {
    if (!this.proxyToStatePart.has(proxy)) throw new DuplicateProxyError(proxy);
    this.proxyToStatePart.set(proxy, {
      prevState: null,
      changed: true
    });
    this.computeState();
    this.proxyToStatePart.delete(proxy);
    emit && this.emitNext();
  }

  updateProxy(proxy: StateProxy<any, any>): boolean {
    if (!this.proxyToStatePart.has(proxy)) throw new NotFoundProxyError(proxy);
    // eslint-disable-next-line
    const data = this.proxyToStatePart.get(proxy)!;
    const state = getProxyStateOrNull(proxy, this.currentState);

    data.changed = data.changed || !equals(data.prevState, state);
    data.prevState = state;
    return data.changed;
  }

  computeState(): void {
    const proxiesDataList = Array.from(this.proxyToStatePart.values());

    if (!proxiesDataList.some(({ changed }) => changed)) return;
    this.currentState = proxiesDataList.reduce(
      (currentState, { prevState }) => Object.assign(currentState, prevState ?? {}),
      {} as ComputedState
    );
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

interface StateProxyData<ProvidedState extends {}> {
  changed: boolean;
  prevState: ProvidedState | null;
}
