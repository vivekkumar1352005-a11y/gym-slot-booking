import crypto from 'crypto';

const CODE_CHARACTERS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 characters, no ambiguous 0/O/1/I

/**
 * Generates an unguessable 6-character alphanumeric check-in code.
 * Example: '7XKP2Q'
 */
export const generateCheckInCode = () => {
  let code = '';
  const bytes = crypto.randomBytes(6);  //[163, 31, 124, 9, 178, 229]
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARACTERS[bytes[i] % CODE_CHARACTERS.length];
  }
  return code;
};
