import { AbstractControl, ValidatorFn } from '@angular/forms';

/** Requires at least one letter and one digit (mirrors the API rule). Empty is allowed. */
export const lettersAndNumbers: ValidatorFn = (control: AbstractControl) => {
  const value = String(control.value ?? '');
  if (!value) return null;
  return /[A-Za-z]/.test(value) && /\d/.test(value) ? null : { lettersAndNumbers: true };
};
