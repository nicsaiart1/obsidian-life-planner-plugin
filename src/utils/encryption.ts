// src/utils/encryption.ts

/**
 * Generates a random salt for key derivation.
 * @returns A promise that resolves to a base64 encoded salt string.
 */
export async function generateSalt(): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return Buffer.from(salt).toString('base64');
}

/**
 * Derives a cryptographic key from a password and salt using PBKDF2 and SHA-256.
 * @param password - The user's password.
 * @param salt - The base64 encoded salt.
 * @returns A promise that resolves to a CryptoKey.
 */
export async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    const saltBytes = Buffer.from(salt, 'base64');
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: saltBytes,
            iterations: 100000, // NIST recommendation: >= 10,000
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true, // exportable: false for more security if key isn't needed outside deriveKey
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts a string using AES-GCM.
 * @param data - The plaintext string to encrypt.
 * @param key - The CryptoKey to use for encryption.
 * @returns A promise that resolves to a base64 encoded string (IV + ciphertext).
 */
export async function encryptString(data: string, key: CryptoKey): Promise<string> {
    try {
        const enc = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM is recommended
        const ciphertext = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            enc.encode(data)
        );
        // Prepend IV to ciphertext and base64 encode
        const ivAndCiphertext = new Uint8Array(iv.length + ciphertext.byteLength);
        ivAndCiphertext.set(iv);
        ivAndCiphertext.set(new Uint8Array(ciphertext), iv.length);
        return Buffer.from(ivAndCiphertext).toString('base64');
    } catch (error) {
        console.error("Encryption error:", error);
        throw new Error("Encryption failed.");
    }
}

/**
 * Decrypts a string using AES-GCM.
 * @param encryptedData - The base64 encoded string (IV + ciphertext).
 * @param key - The CryptoKey to use for decryption.
 * @returns A promise that resolves to the plaintext string.
 */
export async function decryptString(encryptedData: string, key: CryptoKey): Promise<string> {
    try {
        const ivAndCiphertext = Buffer.from(encryptedData, 'base64');
        const iv = ivAndCiphertext.slice(0, 12); // Extract 12-byte IV
        const ciphertext = ivAndCiphertext.slice(12); // Extract ciphertext

        if (iv.length !== 12) {
            throw new Error("Invalid IV length during decryption. Expected 12 bytes.");
        }

        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            ciphertext
        );
        const dec = new TextDecoder();
        return dec.decode(decryptedBuffer);
    } catch (error) {
        console.error("Decryption error:", error);
        // It's common for decryption to fail if the key is wrong or data is corrupt
        throw new Error("Decryption failed. Invalid key or corrupted data.");
    }
}
