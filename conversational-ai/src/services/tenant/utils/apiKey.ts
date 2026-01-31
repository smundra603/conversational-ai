import { encryptor } from '../../../utils/encrypt.js';
import { uuid } from '../../../utils/idGenerator.js';

export async function generateApiKey(apiKey?: string): Promise<{ encryptedKey: string; plainKey: string }> {
  const API_KEY = apiKey ?? uuid();
  const encryptedApiKey = await encryptor.encrypt(API_KEY);
  return { encryptedKey: encryptedApiKey, plainKey: API_KEY };
}
