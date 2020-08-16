import { AbstractField } from '@lib-form/state-models/fields/abstract';
import { FieldsGroup } from '@lib-form/state-models/fields/group';

export function geAbstractFieldChild(
  model: AbstractField<any> | null,
  name: string
): AbstractField<any> | null {
  if (model instanceof FieldsGroup) {
    return model.getOptionalChildField(name);
  }
  return null;
}
