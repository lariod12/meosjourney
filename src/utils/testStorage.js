/**
 * Test Firebase Storage connection
 * Run this in browser console to verify Storage is working
 */

import { storage } from '../services/firebase';
import { ref, listAll } from 'firebase/storage';

export const testStorageConnection = async () => {
  try {
    console.log('🧪 Testing Firebase Storage connection...');
    console.log('📦 Storage bucket:', storage.app.options.storageBucket);
    
    // Try to list root directory (should work even if empty)
    const rootRef = ref(storage, '/');
    const result = await listAll(rootRef);
    
    console.log('✅ Firebase Storage is working!');
    console.log('📁 Root folders:', result.prefixes.length);
    console.log('📄 Root files:', result.items.length);
    
    return {
      success: true,
      bucket: storage.app.options.storageBucket,
      folders: result.prefixes.length,
      files: result.items.length
    };
    
  } catch (error) {
    console.error('❌ Firebase Storage test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'storage/unauthorized') {
      console.warn('⚠️ Storage not enabled or security rules blocking access');
      console.warn('👉 Go to Firebase Console > Storage > Get Started');
    }
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

// Auto-run test when imported in dev mode
if (import.meta.env.DEV) {
  console.log('🔧 Dev mode: Storage test available');
  console.log('💡 Run: testStorageConnection() in console');
}
