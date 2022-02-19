import { homedir } from 'os';

export const storage = () => {
  return homedir() + '/.slash';
};
