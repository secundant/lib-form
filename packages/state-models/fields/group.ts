import { AbstractField, FieldChangePayload } from '@lib-form/state-models/fields/abstract';
import { DuplicateChildNameError } from '@lib-form/state-models/errors/DuplicateChildNameError';
import { GroupValueStateProxy } from '@lib-form/state-models/state-proxies/group-value.state-proxy';
import { NotFoundGroupChildNameError } from '@lib-form/state-models/errors/NotFoundGroupChildNameError';
import { GroupChildStateProxy } from '@lib-form/state-models/state-proxies/group-child.state.proxy';
import { Subscription } from 'rxjs';
import { ChildAccessor } from '@lib-form/state-models/interfaces/child-accessor';

export class FieldsGroup extends AbstractField<any> implements ChildAccessor {
  private children = new Map<string, ChildData>();
  private valueProxy = new GroupValueStateProxy({
    getChildNames: () => Array.from(this.children.keys()),
    getChildValue: name => this.getChild(name).field.state.value,
    setChildValue: (name, value) => {
      this.getChild(name).field.update({
        value
      });
    }
  });

  constructor(initialGroup?: Record<string, AbstractField<any>>) {
    super();
    this.addProxy(this.valueProxy);

    if (initialGroup) {
      for (const [name, field] of Object.entries(initialGroup)) {
        this.addField(name, field, {
          emit: false
        });
      }
    }
    this.resetPrevState();
  }

  tryGetChild(name: string): AbstractField<any> | null {
    return this.children.get(name)?.field ?? null;
  }

  addField(name: string, field: AbstractField<any>, { emit }: FieldsGroupChildOptions = {}): void {
    this.assertHaveNotChildName(name);
    const nameAndPathProxy = new GroupChildStateProxy(name, this.getSelfPath);

    field.addProxy(nameAndPathProxy);
    field.batching = this.batching;
    this.children.set(name, {
      field,
      proxy: nameAndPathProxy,
      subscription: field.subscribe(this.handleChildChange)
    });
    this.updateSelfValue(emit);
  }

  removeField(name: string, { emit }: FieldsGroupChildOptions = {}): void {
    const child = this.getChild(name);

    child.subscription.unsubscribe();
    child.field.removeProxy(child.proxy);
    this.children.delete(name);
    this.updateSelfValue(emit);
  }

  get batching(): boolean {
    return super.batching;
  }

  set batching(batching: boolean) {
    this.children.forEach(child => {
      child.field.batching = batching;
    });
    super.batching = batching;
  }

  // Internal methods

  protected beforeBatchingEnd(): void {
    this.children.forEach(child => {
      if (!child.updatedWhileBatch) return;
      child.updatedWhileBatch = false;
      this.applyChildChangedEvent({
        nextState: child.field.state,
        prevState: child.prevStateForBatch
      });
    });
    this.updateSelfValue();
  }

  /**
   * Internal watcher for "path" state.
   * If path changed - group recalc all paths of children
   */
  protected afterComputingState(prevState: { path?: string }): void {
    if (prevState.path !== this.state.path) {
      this.children.forEach((_, name) => this.updateChildStateByName(name));
    }
  }

  private getChild(name: string): ChildData {
    this.assertHaveChildName(name);
    return this.children.get(name)!;
  }

  private getSelfPath = (): string | null => this.state.path ?? null;

  /**
   * Handle any next event from child
   */
  private handleChildChange = (event: FieldChangePayload<any>) => {
    if (this.batching) {
      const child = this.getChild(event.prevState.name);

      if (!child.updatedWhileBatch) {
        child.updatedWhileBatch = true;
        child.prevStateForBatch = event.prevState;
      }
    } else {
      this.applyChildChangedEvent(event);
    }
  };

  /**
   * Apply child change event
   */
  private applyChildChangedEvent({ nextState, prevState }: FieldChangePayload<any>): boolean {
    const nameChanged = nextState.name !== prevState.name;
    const valueChanged = nextState.value !== prevState.value;
    const changed = nameChanged || valueChanged;

    if (nameChanged) {
      this.assertHaveNotChildName(nextState.name);
      const child = this.getChild(prevState.name);

      this.children.delete(prevState.name);
      this.children.set(nextState.name, child);
    }
    if (changed) {
      this.updateSelfValue();
    }
    return changed;
  }

  private assertHaveChildName(name: string) {
    if (!this.children.has(name)) {
      throw new NotFoundGroupChildNameError(name, this.getSelfPath());
    }
  }

  private assertHaveNotChildName(name: string) {
    if (this.children.has(name)) {
      throw new DuplicateChildNameError(name, this.getSelfPath());
    }
  }

  private updateChildStateByName(name: string) {
    const { field, proxy } = this.children.get(name)!;

    field.getStateFromProxy(proxy);
    field.computeState();
    field.emitNext();
  }

  private updateSelfValue(emit = true) {
    this.getStateFromProxy(this.valueProxy);
    this.computeState();
    emit && this.emitNext();
  }
}

export interface FieldsGroupChildOptions {
  emit?: boolean;
}

interface ChildData {
  field: AbstractField<any>;
  proxy: GroupChildStateProxy;
  updatedWhileBatch?: boolean;
  prevStateForBatch?: any;

  readonly subscription: Subscription;
}
