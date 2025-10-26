import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload image to Firebase Storage
 * @param {File} file - Image file to upload
 * @param {string} characterId - Character ID
 * @param {string} questId - Quest ID
 * @returns {Promise<{url: string, path: string}>} - Download URL and storage path
 */
export const uploadQuestImage = async (file, characterId, questId) => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Image size must be less than 5MB');
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}.${fileExtension}`;
    
    // Create storage path
    const storagePath = `quest-images/${characterId}/${questId}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    console.log('📤 Uploading image to:', storagePath);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    console.log('✅ Image uploaded successfully');

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('🔗 Download URL:', downloadURL);

    return {
      url: downloadURL,
      path: storagePath
    };

  } catch (error) {
    console.error('❌ Error uploading image:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Delete image from Firebase Storage
 * @param {string} storagePath - Storage path of the image
 * @returns {Promise<void>}
 */
export const deleteQuestImage = async (storagePath) => {
  try {
    if (!storagePath) {
      throw new Error('No storage path provided');
    }

    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    
    console.log('✅ Image deleted successfully:', storagePath);

  } catch (error) {
    // If file doesn't exist, don't throw error
    if (error.code === 'storage/object-not-found') {
      console.warn('⚠️ Image not found, may have been deleted already:', storagePath);
      return;
    }
    
    console.error('❌ Error deleting image:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Upload journal image to Firebase Storage
 * @param {File} file - Image file to upload
 * @param {string} characterId - Character ID
 * @param {string} journalId - Journal ID
 * @returns {Promise<{url: string, path: string}>} - Download URL and storage path
 */
export const uploadJournalImage = async (file, characterId, journalId) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Image size must be less than 5MB');
    }

    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}.${fileExtension}`;
    
    const storagePath = `journal-images/${characterId}/${journalId}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    console.log('📤 Uploading journal image to:', storagePath);

    const snapshot = await uploadBytes(storageRef, file);
    console.log('✅ Journal image uploaded successfully');

    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('🔗 Download URL:', downloadURL);

    return {
      url: downloadURL,
      path: storagePath
    };

  } catch (error) {
    console.error('❌ Error uploading journal image:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Upload avatar image to Firebase Storage
 * @param {File} file - Image file to upload
 * @param {string} characterId - Character ID
 * @returns {Promise<{url: string, path: string}>} - Download URL and storage path
 */
export const uploadAvatarImage = async (file, characterId) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    const maxSize = 2 * 1024 * 1024; // 2MB for avatar
    if (file.size > maxSize) {
      throw new Error('Avatar image size must be less than 2MB');
    }

    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `avatar_${timestamp}.${fileExtension}`;
    
    const storagePath = `avatars/${characterId}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    console.log('📤 Uploading avatar to:', storagePath);

    const snapshot = await uploadBytes(storageRef, file);
    console.log('✅ Avatar uploaded successfully');

    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('🔗 Download URL:', downloadURL);

    return {
      url: downloadURL,
      path: storagePath
    };

  } catch (error) {
    console.error('❌ Error uploading avatar:', error);
    throw new Error(`Failed to upload avatar: ${error.message}`);
  }
};

/**
 * Upload quest confirmation image to Firebase Storage
 * Images are stored in quests-confirm/ folder with quest name + date prefix
 * Format: name_YYMMDD_{timestamp}.jpg (e.g., newquest01_251016_1234567890.jpg)
 * 
 * @param {File} file - Image file to upload
 * @param {string} questName - Name of the quest (used as prefix)
 * @returns {Promise<{url: string, path: string, questNamePrefix: string}>}
 */
export const uploadQuestConfirmImage = async (file, questName) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Image size must be less than 5MB');
    }

    // Sanitize quest name for filename
    const sanitizedQuestName = questName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    // Generate date suffix in YYMMDD format using Vietnam timezone (UTC+7)
    const now = new Date();
    const dateSuffix = now.toLocaleString('sv-SE', { 
      timeZone: 'Asia/Ho_Chi_Minh',
      year: '2-digit',
      month: '2-digit', 
      day: '2-digit'
    }).replace(/-/g, ''); // Format: YYMMDD

    // Generate filename: name_YYMMDD_{timestamp}.ext
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${sanitizedQuestName}_${dateSuffix}_${timestamp}.${fileExtension}`;
    
    // Storage path: quests-confirm/{name_YYMMDD_{timestamp}.jpg}
    const storagePath = `quests-confirm/${fileName}`;
    const storageRef = ref(storage, storagePath);

    console.log('📤 Uploading quest confirmation image to:', storagePath);
    console.log('🎯 Quest name prefix:', `${sanitizedQuestName}_${dateSuffix}`);
    console.log('🕐 Vietnam time (UTC+7):', now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));

    const snapshot = await uploadBytes(storageRef, file);
    console.log('✅ Quest confirmation image uploaded successfully');

    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('🔗 Download URL:', downloadURL);

    return {
      url: downloadURL,
      path: storagePath,
      questNamePrefix: `${sanitizedQuestName}_${dateSuffix}`
    };

  } catch (error) {
    console.error('❌ Error uploading quest confirmation image:', error);
    throw new Error(`Failed to upload quest confirmation image: ${error.message}`);
  }
};

/**
 * Upload achievement confirmation image to Firebase Storage
 * Images are stored in achievements-confirm/ folder with achievement name prefix
 * 
 * @param {File} file - Image file to upload
 * @param {string} achievementName - Name of the achievement (used as prefix)
 * @returns {Promise<{url: string, path: string, achievementNamePrefix: string}>}
 */
export const uploadAchievementConfirmImage = async (file, achievementName) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Image size must be less than 5MB');
    }

    // Sanitize achievement name for filename
    const sanitizedAchievementName = achievementName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${sanitizedAchievementName}_${timestamp}.${fileExtension}`;
    
    // Storage path: achievements-confirm/{achievementName}_{timestamp}.jpg
    const storagePath = `achievements-confirm/${fileName}`;
    const storageRef = ref(storage, storagePath);

    console.log('📤 Uploading achievement confirmation image to:', storagePath);
    console.log('🏆 Achievement name prefix:', sanitizedAchievementName);

    const snapshot = await uploadBytes(storageRef, file);
    console.log('✅ Achievement confirmation image uploaded successfully');

    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('🔗 Download URL:', downloadURL);

    return {
      url: downloadURL,
      path: storagePath,
      achievementNamePrefix: sanitizedAchievementName
    };

  } catch (error) {
    console.error('❌ Error uploading achievement confirmation image:', error);
    throw new Error(`Failed to upload achievement confirmation image: ${error.message}`);
  }
};
