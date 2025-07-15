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
    
    return btoa(String.fromCharCode(...encrypted));
  }
  
  // Simple XOR decryption
  static decrypt(encryptedData: string, secretCode: string): string {
    try {
      const key = this.generateKey(secretCode);
      const decoded = atob(encryptedData);
      const decrypted: string[] = [];
      
      for (let i = 0; i < decoded.length; i++) {
        decrypted.push(String.fromCharCode(decoded.charCodeAt(i) ^ key[i % key.length]));
      }
      
      return decrypted.join('');
    } catch (error) {
      throw new Error('Failed to decrypt data');
    }
  }
}

export default SimpleEncryption;