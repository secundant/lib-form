import { AbstractField, FieldChangePayload } from '@lib-form/state-models/fields/abstract';
import { DuplicateChildNameError } from '@lib-form/state-models/errors/DuplicateChildNameError';
import { GroupValueStateProxy } from '@lib-form/state-models/state-proxies/group-value.state-proxy';
import { NotFoundGroupChildNameError } from '@lib-form/state-models/errors/NotFoundGroupChildNameError';
import { GroupChildStateProxy } from '@lib-form/state-models/state-proxies/group-child.state.proxy';
import { Subscription } from 'rxjs';
import { parseStringPath } from '@lib-form/state-models/utils/parseStringPath';
import { geAbstractFieldChild } from '@lib-form/state-models/utils/geAbstractFieldChild';
import { NotFoundFieldError } from '@lib-form/state-models/errors/NotFoundFieldError';

export class FieldsGroup extends AbstractField<any> {
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

  getOptionalChildField(name: string): AbstractField<any> | null {
    return this.children.get(name)?.field ?? null;
  }

  getField(path: string): AbstractField<any> {
    const model = this.getOptionalField(path);

    if (!model) throw new NotFoundFieldError(path, this.state.path);
    return model;
  }

  getOptionalField(path: string): AbstractField<any> | null {
    return parseStringPath(path).reduce<AbstractField<any> | null>(geAbstractFieldChild, this);
  }

  addField(name: string, field: AbstractField<any>, { emit }: FieldsGroupChildOptions = {}): void {
    this.assertHaveNotChildName(name);
    const child: ChildData = {
      field,
      proxy: new GroupChildStateProxy(name, this.getSelfPath),
      subscription: null as any
    };

    // Add "name" and "path" props
    field.addProxy(child.proxy);
    // Share self updates batching with child model
    field.batching = this.batching;
    this.children.set(name, child);

    // Subscribe to updates "name" and "value" props
    (child as any).subscription = field.subscribe(this.handleChildChange);
    this.updateChildProxy(emit);
  }

  removeField(name: string, { emit }: FieldsGroupChildOptions = {}): void {
    const child = this.getChild(name);

    child.subscription.unsubscribe();
    child.field.removeProxy(child.proxy);
    this.children.delete(name);
    this.updateChildProxy(emit);
  }

  getSelfPath = (): string | null => this.state.path ?? null;

  get batching(): boolean {
    return super.batching;
  }

  set batching(batching: boolean) {
    if (batching === this.batching) return;
    this.children.forEach(child => {
      child.field.batching = batching;
    });
    if (!batching) {
      this.children.forEach(child => {
        if (!child.updatedWhileBatch) return;
        child.updatedWhileBatch = false;
        this.applyChildChangedEvent({
          nextState: child.field.state,
          prevState: child.prevStateForBatch
        });
      });
      this.updateChildProxy();
      this.computeState();
    }
    super.batching = batching;
  }

  updateChildrenPath(): void {
    for (const child of this.children.values()) {
      if (child.field instanceof FieldsGroup) {
        child.field.updateChildrenPath();
      }
      child.field.updateProxy(child.proxy);
      child.field.computeState();
      child.field.emitNext();
    }
  }

  private getChild(name: string): ChildData {
    this.assertHaveChildName(name);
    return this.children.get(name)!;
  }

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
      // If child name changed - we should update all nested models, because only we know about name
      if (child.field instanceof FieldsGroup) {
        child.field.updateChildrenPath();
      }
    }
    if (changed && !this.batching) {
      this.updateChildProxy();
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

  private updateChildProxy(emit = true) {
    this.updateProxy(this.valueProxy);
    if (!this.batching) {
      this.computeState();
      emit && this.emitNext();
    }
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
