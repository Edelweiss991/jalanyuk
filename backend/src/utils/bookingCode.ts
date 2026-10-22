import crypto from 'crypto';

// Set karakter tanpa ambigu: hapus 0, O, 1, I, L
const CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export const generateBookingCode = (): string => {
  let code = 'JY-';
  for (let i = 0; i < 8; i++) {
    const randomIndex = crypto.randomInt(0, CHARSET.length);
    code += CHARSET[randomIndex];
  }
  return code;
};
