const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NAME_MAX_LENGTH = 80;
export const PASSWORD_MIN_LENGTH = 8;

/**
 * Validate a customer payload.
 * @param {unknown} body request body
 * @param {{ passwordRequired: boolean }} options password is optional on update
 * @returns {{ value: {name: string, email: string, password: string}, errors: Record<string,string> }}
 */
export function validateCustomer(body, { passwordRequired }) {
  const input = body && typeof body === 'object' ? body : {};
  const errors = {};

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';

  if (!name) errors.name = 'Name is required.';
  else if (name.length > NAME_MAX_LENGTH)
    errors.name = `Name must be at most ${NAME_MAX_LENGTH} characters.`;

  if (!email) errors.email = 'Email is required.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Email is not valid.';

  if (!password) {
    if (passwordRequired) errors.password = 'Password is required.';
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Password must contain at least one letter and one number.';
  }

  return { value: { name, email, password }, errors };
}

/** Parse a route `:id` into a positive integer, or `null`. */
export function parseId(raw) {
  if (!/^\d+$/.test(String(raw))) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
