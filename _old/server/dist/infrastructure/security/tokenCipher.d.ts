export declare class TokenCipher {
    private readonly key;
    constructor(rawKey: string);
    encrypt(plaintext: string): string;
    decrypt(payload: string): string;
    sign(value: string): string;
    verify(value: string, signature: string): boolean;
}
//# sourceMappingURL=tokenCipher.d.ts.map