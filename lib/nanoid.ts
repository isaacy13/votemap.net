import { customAlphabet } from 'nanoid';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
const generate = customAlphabet(alphabet, 12);

export function newBountyId(): string {
  return `bnt_${generate()}`;
}
