import { AbstractField } from '@lib-form/state-models/fields/abstract';
import { FieldsArray } from '@lib-form/state-models/fields/array';
import { is } from 'ramda';
import { FieldsGroup } from '@lib-form/state-models/fields/group';
import { Field } from '@lib-form/state-models/fields/field';

export function createField(value: unknown): AbstractField<any> {
  if (value instanceof AbstractField) return value;
  if (Array.isArray(value)) {
    return new FieldsArray(value.map(createField));
  }
  if (is(Object, value)) {
    return new FieldsGroup(
      Object.entries(value).reduce<Record<string, AbstractField<any>>>(
        (children, [name, childValue]) => {
          children[name] = createField(childValue);
          return children;
        },
        {}
      )
    );
  }
  return new Field(value);
}
