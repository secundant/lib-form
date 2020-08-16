# @lib-form/state-models

Base models for constructing your state.
Provides 2 features:

1. Fully observable state - you can subscribe to any part of state without any additional logic
2. Atomic dynamic state - every part of state can be extended by specific bit of state,
   it will be handled and stored as you want

## Examples

### Basics

```javascript
const user = new FieldsGroup({
  firstName: new Field('John'),
  lastName: new Field('Smith')
});

function logUser({ firstName, lastName, age }) {
  console.log(`User is ${firstName} ${lastName}${age ? ` ${age} old` : ''}`);
}

logUser(user.state); // logs "User is John Smith"
user.subscribe(() => logUser(user.state));

user.addField('age', new Field(20)); // logs "User is John Smith 20 old"
user.update({
  age: 12,
  firstName: 'Barbara'
}); // logs "User is Barbara Smith 12 old"
```

### Computed properties (validation for example)

```javascript
const createValidationState = validationFn => {
  let prevValue = null; // Run validation only on new values
  let error = null;

  return {
    get() {
      return { error };
    },
    handle({ value }) {
      error = validationFn(value);
    },
    shouldBeHandled(updates) {
      // Update error only wneh value changed
      return hasOwnProp('value', updates) && updates.value !== prevValue;
    }
  };
};

const max = maxValue =>
  createValidationState(value => (value > maxValue ? `${value} > ${maxValue}` : null));

const age = new Field(10);

age.addProxy(max(20));
age.state; // { value: 10, error: null }
age.update({ value: 30 });
age.state; // { value: 30, error: '30 > 20' }
```
