import { FormControl } from '@angular/forms';
import { lettersAndNumbers } from './password.validators';

describe('lettersAndNumbers', () => {
  it('accepts letters+digits and empty values, rejects single-class input', () => {
    expect(lettersAndNumbers(new FormControl('abc12345'))).toBeNull();
    expect(lettersAndNumbers(new FormControl(''))).toBeNull();
    expect(lettersAndNumbers(new FormControl('abcdefgh'))).toEqual({ lettersAndNumbers: true });
    expect(lettersAndNumbers(new FormControl('12345678'))).toEqual({ lettersAndNumbers: true });
  });
});
