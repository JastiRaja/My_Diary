// Simple encryption utility for local storage
class SimpleEncryption {
  private static readonly KEY_LENGTH = 32;
  
  // Generate a simple key from the secret code
  private static generateKey(secretCode: string): number[] {
    const key: number[] = [];
    for (let i = 0; i < this.KEY_LENGTH; i++) {
      key.push(secretCode.charCodeAt(i % secretCode.length));
    }
    return key;
  }
  
  // Simple XOR encryption
  static encrypt(data: string, secretCode: string): string {
    const key = this.generateKey(secretCode);
    const encrypted: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      encrypted.push(data.charCodeAt(i) ^ key[i % key.length]);
    }
    
    // Process in chunks to avoid stack overflow with large arrays
    const CHUNK_SIZE = 8192; // Safe chunk size for String.fromCharCode
    let result = '';
    
    for (let i = 0; i < encrypted.length; i += CHUNK_SIZE) {
      const chunk = encrypted.slice(i, i + CHUNK_SIZE);
      result += String.fromCharCode(...chunk);
    }
    
    return btoa(result);
  }
  
  // Simple XOR decryption
  static decrypt(encryptedData: string, secretCode: string): string {
    try {
      const key = this.generateKey(secretCode);
      const decoded = atob(encryptedData);
      const decrypted: number[] = [];
      
      for (let i = 0; i < decoded.length; i++) {
        decrypted.push(decoded.charCodeAt(i) ^ key[i % key.length]);
      }
      
      // Process in chunks to avoid stack overflow with large arrays
      const CHUNK_SIZE = 8192; // Safe chunk size for String.fromCharCode
      let result = '';
      
      for (let i = 0; i < decrypted.length; i += CHUNK_SIZE) {
        const chunk = decrypted.slice(i, i + CHUNK_SIZE);
        result += String.fromCharCode(...chunk);
      }
      
      return result;
    } catch (error) {
      throw new Error('Failed to decrypt data');
    }
  }
}

export default SimpleEncryption;