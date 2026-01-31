import bcrypt from 'bcrypt';

export interface Encrypt {
  encrypt: (plainText: string) => Promise<string>;
  compare: (plainText: string, encryptedText: string) => Promise<boolean>;
}

export class BcryptEncryptor implements Encrypt {
  private readonly saltRounds: number;

  constructor(saltRounds = 10) {
    this.saltRounds = saltRounds;
  }

  async encrypt(plainText: string): Promise<string> {
    const hash = await bcrypt.hash(plainText, this.saltRounds);
    return hash;
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    const isMatch = await bcrypt.compare(plainText, hash);
    return isMatch;
  }
}

const bcryptEncryptor = new BcryptEncryptor();

export class Ecryptor {
  private encryptor: Encrypt;
  constructor(encryptor: Encrypt) {
    this.encryptor = encryptor;
  }

  async encrypt(plainText: string): Promise<string> {
    return this.encryptor.encrypt(plainText);
  }

  async compare(plainText: string, encryptedText: string): Promise<boolean> {
    return this.encryptor.compare(plainText, encryptedText);
  }
}

export const encryptor = new Ecryptor(bcryptEncryptor);
