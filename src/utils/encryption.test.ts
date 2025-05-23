// src/utils/encryption.test.ts
import { generateSalt, deriveKey, encryptString, decryptString } from './encryption';

async function testGenerateSalt() {
    console.log("Running test: testGenerateSalt");
    const salt1 = await generateSalt();
    console.assert(typeof salt1 === 'string', "Test Failed: salt1 should be a string");
    console.assert(salt1.length > 0, "Test Failed: salt1 should not be empty");

    const salt2 = await generateSalt();
    console.assert(typeof salt2 === 'string', "Test Failed: salt2 should be a string");
    console.assert(salt2.length > 0, "Test Failed: salt2 should not be empty");

    console.assert(salt1 !== salt2, "Test Failed: salt1 and salt2 should be different");
    console.log("testGenerateSalt: PASSED");
}

async function testDeriveKey() {
    console.log("Running test: testDeriveKey");
    const password = "testPassword123";
    const salt = await generateSalt();
    const key = await deriveKey(password, salt);

    // Check if the key is a CryptoKey. In Node.js, its specific type might be less direct to check
    // but we can check for presence of algorithm and type properties.
    console.assert(!!key, "Test Failed: key should not be null or undefined");
    console.assert(typeof key === 'object' && key !== null, "Test Failed: key should be an object");
    // @ts-ignore
    console.assert(key.type === 'secret', "Test Failed: key.type should be 'secret'");
    // @ts-ignore
    console.assert(key.algorithm.name === 'AES-GCM', "Test Failed: key.algorithm.name should be 'AES-GCM'");
    console.log("testDeriveKey: PASSED");
}

async function testEncryptDecryptRoundTrip() {
    console.log("Running test: testEncryptDecryptRoundTrip");
    const password = "superSecretPassword";
    const originalData = "This is some highly confidential data!";
    
    const salt = await generateSalt();
    const key = await deriveKey(password, salt);
    
    const encryptedData = await encryptString(originalData, key);
    console.assert(typeof encryptedData === 'string', "Test Failed: encryptedData should be a string");
    console.assert(encryptedData !== originalData, "Test Failed: encryptedData should not be the same as originalData");

    const decryptedData = await decryptString(encryptedData, key);
    console.assert(decryptedData === originalData, `Test Failed: decryptedData ("${decryptedData}") should be identical to originalData ("${originalData}")`);
    console.log("testEncryptDecryptRoundTrip: PASSED");
}

async function testDecryptWithWrongKey() {
    console.log("Running test: testDecryptWithWrongKey");
    const passwordA = "passwordOne";
    const passwordB = "passwordTwo"; // Different password
    const originalData = "Sensitive information here.";

    const saltA = await generateSalt();
    const keyA = await deriveKey(passwordA, saltA);

    const saltB = await generateSalt(); // Could also use the same salt, different password is key
    const keyB = await deriveKey(passwordB, saltB);

    const encryptedData = await encryptString(originalData, keyA);

    let decryptionFailedAsExpected = false;
    try {
        await decryptString(encryptedData, keyB);
    } catch (error) {
        console.log("Decryption with wrong key failed as expected:", error.message);
        decryptionFailedAsExpected = true;
    }
    console.assert(decryptionFailedAsExpected, "Test Failed: Decryption with wrong key should have failed (thrown an error).");
    console.log("testDecryptWithWrongKey: PASSED");
}

async function runAllEncryptionTests() {
    try {
        await testGenerateSalt();
        await testDeriveKey();
        await testEncryptDecryptRoundTrip();
        await testDecryptWithWrongKey();
        console.log("\nAll encryption tests completed successfully!");
    } catch (error) {
        console.error("\nAn error occurred during testing:", error);
    }
}

// To run these tests:
// 1. Ensure you have Node.js installed.
// 2. Save this file as `encryption.test.ts` in the `src/utils/` directory.
// 3. Save the `encryption.ts` file in the `src/utils/` directory.
// 4. You'll need `ts-node` to run TypeScript files directly, or compile it to JavaScript first.
//    Install ts-node globally or locally: `npm install -g ts-node` or `npm install --save-dev ts-node`
// 5. If you don't have `Buffer` (used in encryption.ts) available in your environment
//    (e.g. browser without polyfills), these tests might need adjustments or a Node.js environment.
//    The `crypto.subtle` API is typically available in modern browsers and Node.js >= 15.
//
// Execute from the root of your project:
// `ts-node src/utils/encryption.test.ts`
//
// If you compile to JS first (e.g., using `tsc`):
// `tsc src/utils/encryption.ts src/utils/encryption.test.ts --outDir dist_test --module commonjs --target es2020 --esModuleInterop`
// `node dist_test/utils/encryption.test.js`

runAllEncryptionTests();
