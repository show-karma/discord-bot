import { createHash, createDecipheriv, createCipheriv } from 'crypto';
import 'dotenv/config';

class CryptoJsHandler {
  private secret: string;
  private resizedIV: Buffer;

  constructor(secret = process.env.DISCORD_BOT_AES256_SECRET) {
    this.secret = secret;
    this.setup();
  }

  setup() {
    this.createIV();
  }

  createIV() {
    this.resizedIV = Buffer.allocUnsafe(16);
    const iv = createHash('sha256').update('hashediv').digest();
    iv.copy(this.resizedIV);
  }

  _(str, fn, secret) {
    if (['createCipheriv', 'createDecipheriv'].includes(fn.name)) {
      const _a = fn.name === 'createCipheriv' ? 'hex' : 'binary';
      const _c = _a === 'hex' ? 'binary' : 'hex';

      const _k = createHash('sha256')
        .update(secret ?? this.secret)
        .digest();

      const _$e = fn('aes256', _k, this.resizedIV);
      const _r = [_$e.update(str, _c, _a)];

      _r.push(_$e.final(_a));
      return _r.join('');
    }
    throw new TypeError("Crypher IV function doens't match the action.");
  }

  encrypt(str: string, secret?: string) {
    return this._(str, createCipheriv, secret);
  }

  decrypt(str: string, secret?: string) {
    return this._(str, createDecipheriv, secret);
  }
}

export default new CryptoJsHandler();
