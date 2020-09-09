import { AbstractField } from '@lib-form/state-models/fields/abstract';
import { ChildAccessor } from '@lib-form/state-models/interfaces/child-accessor';

export function geAbstractFieldChild(
  model: AbstractField<any> | null,
  name: string
): AbstractField<any> | null {
  return isChildAccessor(model) ? model.tryGetChild(name) : null;
}

const isChildAccessor = (model: any): model is ChildAccessor =>
  !!model.tryGetChild && model instanceof AbstractField;
