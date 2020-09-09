import { AbstractField } from '@lib-form/state-models/fields/abstract';

export interface ChildAccessor {
  tryGetChild(key: string): AbstractField<any> | null;
}
