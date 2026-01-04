// Image compression utility to reduce file sizes for localStorage
class ImageCompression {
  // Compress image to reduce size
  static async compressImage(
    dataUrl: string,
    maxWidth: number = 1920,
    maxHeight: number = 1920,
    quality: number = 0.8
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels if needed
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // If still too large (>1MB), reduce quality further
        if (compressedDataUrl.length > 1024 * 1024) {
          compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
        }
        if (compressedDataUrl.length > 1024 * 1024) {
          compressedDataUrl = canvas.toDataURL('image/jpeg', 0.4);
        }

        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  }

  // Get approximate size in MB
  static getSizeInMB(dataUrl: string): number {
    // Base64 is about 33% larger than binary
    const base64Length = dataUrl.length;
    const padding = (dataUrl.match(/=/g) || []).length;
    const actualLength = (base64Length * 3) / 4 - padding;
    return actualLength / (1024 * 1024);
  }
}

export default ImageCompression;

