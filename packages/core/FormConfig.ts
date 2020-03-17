export class FormConfig {

}

export interface FormConfigOptions<Types> {
  fieldTypes: Types;
}

export interface FieldConfig {
  validations: any[];
  restrictions: any[];
}
