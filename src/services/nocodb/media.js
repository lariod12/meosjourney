import { TABLE_IDS, NOCODB_BASE_URL, NOCODB_TOKEN, nocoRequest, deduplicateRequest, isProductionMode, getUTC7Timestamp } from './core.js';
import { createMediaUploadJournal } from './journals.js';

const generateProfileGalleryTitle = () => {
  const now = new Date();
  const ictDateStr = now.toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const [datePart, timePart] = ictDateStr.split(', ');
  const [month, day, year] = datePart.split('/');
  const [hours, minutes] = timePart.split(':');

  const random = Math.floor(100 + Math.random() * 900); // 100-999
  return `journal_${year}-${month}-${day}_${hours}-${minutes}-${random}`;
};

const generateGalleryRecordTitle = (customTitle = '') => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const randomDigits = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const safeTitle = String(customTitle || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const titlePart = safeTitle ? `${safeTitle}-` : '';

  return `gallery-${titlePart}${year}-${month}-${day}-${hours}${minutes}${seconds}-${randomDigits}`;
};

/**
 * Upload a single profile gallery image to attachments_gallery and link to profile
 * Uses img_bw column and profile_id foreign key (production)
 * In development, only attachment record and file are created (no FK field)
 */
export const uploadProfileGalleryImage = async (imageFile, profileId) => {
  try {
    if (!imageFile) {
      return { success: false, message: 'Image file is required' };
    }

    const debugEnabled = import.meta.env.MODE !== 'production' || import.meta.env.MODE === 'staging';

    const title = generateProfileGalleryTitle();

    // Step 1: Create the attachment gallery record with only title
    const recordPayload = { title };

    if (debugEnabled) {
      console.log('🔍 Creating profile gallery attachment record:', recordPayload);
    }

    const recordResponse = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
      method: 'POST',
      body: JSON.stringify(recordPayload)
    });

    const attachmentId = recordResponse.Id || (recordResponse.list && recordResponse.list[0]?.Id);

    if (!attachmentId) {
      throw new Error('Failed to create profile gallery attachment record');
    }

    if (debugEnabled) {
      console.log('✅ Profile gallery attachment record created:', attachmentId);
    }

    // Step 2: Upload the image file to NocoDB storage
    const formData = new FormData();
    formData.append('file', imageFile);

    const storageUploadUrl = `${NOCODB_BASE_URL}/api/v2/storage/upload`;

    const storageResponse = await fetch(storageUploadUrl, {
      method: 'POST',
      headers: {
        'xc-token': NOCODB_TOKEN,
      },
      body: formData
    });

    if (!storageResponse.ok) {
      const errorText = await storageResponse.text();
      throw new Error(`Storage upload failed: ${storageResponse.status} - ${errorText}`);
    }

    const storageResult = await storageResponse.json();

    if (debugEnabled) {
      console.log('✅ Profile gallery image uploaded to NocoDB storage:', storageResult);
    }

    // Step 3: Update the attachment record with img_bw
    const updatePayload = [{
      Id: attachmentId,
      img_bw: storageResult
    }];

    if (debugEnabled) {
      console.log('🔍 Updating profile gallery attachment with image data:', updatePayload);
    }

    await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    // Step 4: Link to profile via foreign key in production (profile_id)
    if (profileId && import.meta.env.MODE === 'production') {
      const linkPayload = [{
        Id: attachmentId,
        profile_id: profileId
      }];

      if (debugEnabled) {
        console.log('🔍 Linking profile gallery attachment to profile_id:', linkPayload);
      }

      await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
        method: 'PATCH',
        body: JSON.stringify(linkPayload)
      });
    }

    return {
      success: true,
      attachmentId,
      data: storageResult
    };
  } catch (error) {
    console.error('❌ Error uploading profile gallery image:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Upload profile gallery images to NocoDB
 * @param {string} profileId - Profile ID to link images to (production)
 * @param {File[]} imageFiles - Array of image files
 * @param {string} description - Gallery description
 * @param {string} customTitle - Optional user-facing title seed. Stored title still includes "gallery" for gallery discovery.
 */
export const uploadProfileGalleryImages = async (profileId, imageFiles, description = '', customTitle = '') => {
  if (!imageFiles || imageFiles.length === 0) {
    return { success: false, message: 'No images to upload', uploadedCount: 0, totalCount: 0 };
  }

  try {
    // Debug: Log profile gallery upload start (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Starting profile gallery upload:', { profileId, imageCount: imageFiles.length });
    }

    // Step 1: Upload all images to NocoDB storage
    const uploadedImages = [];

    // Debug: Log image upload start (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log(`📤 Starting upload of ${imageFiles.length} gallery images`);
    }

    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i];

      // Debug: Log individual image upload (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log(`📸 Uploading gallery image ${i + 1}/${imageFiles.length}:`, imageFile.name);
      }

      const formData = new FormData();
      formData.append('file', imageFile);

      const storageUploadUrl = `${NOCODB_BASE_URL}/api/v2/storage/upload`;

      const storageResponse = await fetch(storageUploadUrl, {
        method: 'POST',
        headers: {
          'xc-token': NOCODB_TOKEN,
        },
        body: formData
      });

      if (!storageResponse.ok) {
        const errorText = await storageResponse.text();
        // Debug: Log storage upload error (development only)
        if (import.meta.env.MODE !== 'production') {
          console.warn(`⚠️ Failed to upload gallery image ${i + 1}: ${errorText}`);
          console.warn(`⚠️ Storage response status: ${storageResponse.status}`);
        }
        continue; // Skip failed uploads
      }

      const storageResult = await storageResponse.json();
      // NocoDB storage upload returns an array, we need the first element
      const imageData = Array.isArray(storageResult) ? storageResult[0] : storageResult;

      // Debug: Log storage upload result (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log(`✅ Gallery image ${i + 1} uploaded successfully:`, imageData);
      }

      uploadedImages.push(imageData);
    }

    if (uploadedImages.length === 0) {
      return { success: false, message: 'Failed to upload any gallery images', uploadedCount: 0, totalCount: imageFiles.length };
    }

    // Step 2: Create single gallery record with all images
    const galleryTitle = generateGalleryRecordTitle(customTitle || description);

    const payload = {
      title: galleryTitle,
      img_bw: uploadedImages,
      created_time: getUTC7Timestamp()
    };

    // Add description if provided
    if (description && description.trim()) {
      payload.desc = description.trim();
    }

    // NOTE: Gallery records are standalone and NOT linked to profiles
    // Each submission creates a new gallery record with unique timestamp-based title

    // Create new gallery record
    console.log('🔍 Creating new gallery record with payload:', {
      ...payload,
      img_bw: `[${uploadedImages.length} images]`,
      mode: import.meta.env.MODE,
      tableId: TABLE_IDS.ATTACHMENTS_GALLERY
    });

    let response;
    try {
      response = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      console.log('✅ Gallery created successfully:', response);
    } catch (error) {
      console.error('❌ Failed to create gallery record:', {
        error: error.message,
        payload: {
          ...payload,
          img_bw: uploadedImages.length > 0 ? uploadedImages[0] : null
        },
        tableId: TABLE_IDS.ATTACHMENTS_GALLERY
      });
      throw error;
    }

    const galleryId = response.Id || (response.list && response.list[0]?.Id);

    // Create journal entry for gallery upload
    try {
      await createMediaUploadJournal('gallery', description);
    } catch (journalError) {
      console.warn('⚠️ Failed to create journal entry for gallery upload:', journalError);
    }

    return {
      success: true,
      galleryId,
      uploadedCount: uploadedImages.length,
      totalCount: imageFiles.length,
      message: `Successfully uploaded ${uploadedImages.length} gallery images`
    };

  } catch (error) {
    console.error('❌ Error uploading profile gallery images:', error);
    return {
      success: false,
      message: error.message || 'Failed to upload gallery images',
      uploadedCount: 0,
      totalCount: imageFiles.length
    };
  }
};

/**
 * Fetch profile gallery images from attachments_gallery
 * In development: fetch limited recent records
 */
export const fetchProfileGallery = async (profileId) => {
  const cacheKey = `profileGallery_${profileId || 'dev'}`;

  return deduplicateRequest(cacheKey, async () => {
    try {
      let response;

      if (import.meta.env.MODE !== 'production') {
        // Development/Staging: schema may not have profile_id, so just fetch recent records
        response = await nocoRequest(
          `${TABLE_IDS.ATTACHMENTS_GALLERY}/records?limit=20&sort=-CreatedAt`,
          { method: 'GET' }
        );
      } else {
        if (!profileId) {
          return [];
        }
        response = await nocoRequest(
          `${TABLE_IDS.ATTACHMENTS_GALLERY}/records?fields=Id,title,img_bw,profile_id&where=(profile_id,eq,${profileId})&sort=-CreatedAt`,
          { method: 'GET' }
        );
      }

      const list = response.list || [];

      const galleryItems = list.map(item => {
        let imgUrl = null;

        if (item.img_bw) {
          let imgBwArray = item.img_bw;
          if (typeof imgBwArray === 'string') {
            try {
              imgBwArray = JSON.parse(imgBwArray);
            } catch (parseError) {
              if (import.meta.env.MODE !== 'production') {
                console.warn('⚠️ Failed to parse img_bw JSON for profile gallery:', parseError);
              }
            }
          }

          if (Array.isArray(imgBwArray) && imgBwArray.length > 0) {
            const imgObj = imgBwArray[0];

            if (import.meta.env.MODE === 'development') {
              imgUrl = imgObj.signedPath || imgObj.path || null;
              if (imgUrl) {
                imgUrl = `${NOCODB_BASE_URL}/${imgUrl}`;
              }
            } else {
              imgUrl = imgObj.signedUrl || imgObj.url || null;
            }
          }
        }

        return {
          id: item.Id,
          title: item.title,
          imgUrl,
          raw: item
        };
      });

      return galleryItems;
    } catch (error) {
      console.error('❌ Error fetching profile gallery from NocoDB:', error);
      return [];
    }
  });
};

export const savePhotoAlbum = async (albumData) => {
  try {
    // Debug: Log photo album save start (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Starting photo album save:', albumData);
    }

    const { description, imageFiles } = albumData;

    if (!imageFiles || imageFiles.length === 0) {
      return { success: false, message: 'At least one image is required' };
    }

    // Step 1: Upload all images to NocoDB storage
    const uploadedImages = [];

    // Debug: Log image upload start (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log(`📤 Starting upload of ${imageFiles.length} images`);
    }

    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i];

      // Debug: Log individual image upload (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log(`📸 Uploading image ${i + 1}/${imageFiles.length}:`, imageFile.name);
      }

      const formData = new FormData();
      formData.append('file', imageFile);

      const storageUploadUrl = `${NOCODB_BASE_URL}/api/v2/storage/upload`;

      const storageResponse = await fetch(storageUploadUrl, {
        method: 'POST',
        headers: {
          'xc-token': NOCODB_TOKEN,
        },
        body: formData
      });

      if (!storageResponse.ok) {
        const errorText = await storageResponse.text();
        // Debug: Log storage upload error (development only)
        if (import.meta.env.MODE !== 'production') {
          console.warn(`⚠️ Failed to upload image ${i + 1}: ${errorText}`);
          console.warn(`⚠️ Storage response status: ${storageResponse.status}`);
        }
        continue; // Skip failed uploads
      }

      const storageResult = await storageResponse.json();
      // NocoDB storage upload returns an array, we need the first element
      const imageData = Array.isArray(storageResult) ? storageResult[0] : storageResult;

      // Debug: Log storage upload result (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log(`✅ Image ${i + 1} uploaded successfully:`, imageData);
      }

      uploadedImages.push(imageData);
    }

    if (uploadedImages.length === 0) {
      return { success: false, message: 'Failed to upload any images' };
    }

    // Step 2: Create the album record with description and images
    const payload = {
      desc: description || '',
      img: uploadedImages,
      created_time: getUTC7Timestamp()
    };

    // Debug: Log album creation (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Creating album record with payload:', payload);
      console.log('🔍 Using ATTACHMENTS_ALBUM table ID:', TABLE_IDS.ATTACHMENTS_ALBUM);
    }

    const response = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_ALBUM}/records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Debug: Log album creation success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Album created successfully:', response);
    }

    const albumId = response.Id || (response.list && response.list[0]?.Id);

    // Create journal entry for album upload
    try {
      await createMediaUploadJournal('album', description);
    } catch (journalError) {
      console.warn('⚠️ Failed to create journal entry for album upload:', journalError);
    }

    return {
      success: true,
      message: `Photo album saved with ${uploadedImages.length} images`,
      id: albumId,
      uploadedCount: uploadedImages.length,
      totalCount: imageFiles.length,
      data: response
    };
  } catch (error) {
    console.error('❌ Error saving photo album to NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Fetch photo albums from NocoDB attachments_album table
 * @returns {Promise<Array>} Array of photo album records
 */
export const fetchPhotoAlbums = async () => {
  const cacheKey = 'photoAlbums';

  return deduplicateRequest(cacheKey, async () => {
    try {
      // Debug: Log photo albums fetch start (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('🔍 Fetching photo albums from NocoDB...');
      }

      const response = await nocoRequest(
        `${TABLE_IDS.ATTACHMENTS_ALBUM}/records?sort=-created_time&limit=50`,
        { method: 'GET' }
      );

      const albums = response.list || [];

      // Process image URLs for each album
      const processedAlbums = albums.map(album => {
        if (album.img && Array.isArray(album.img)) {
          const processedImages = album.img.map(imageObj => {
            // Handle different image URL formats
            let imageUrl = null;

            // Development mode: construct URL from path
            // Production/Staging mode: use signedUrl directly
            if (import.meta.env.MODE === 'development') {
              // Debug: Log development mode URL handling (development only)
              if (!isProductionMode()) {
                console.log('🛠️ PhotoAlbum Development mode: resolving local path');
              }
              const rawPath = imageObj.path || imageObj.signedPath || imageObj.url || null;
              if (rawPath) {
                const normalizedPath = rawPath.replace(/\\/g, '/');
                const trimmedPath = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;
                imageUrl = `${NOCODB_BASE_URL}/${trimmedPath}`;
              } else {
                imageUrl = null;
              }
            } else {
              // Production/Staging mode: use signedUrl directly
              if (!isProductionMode()) {
                console.log('🏭 PhotoAlbum Production/Staging mode: using signedUrl');
              }
              imageUrl = imageObj.signedUrl || imageObj.url || null;
            }

            // Debug: Log image URL processing (development only)
            if (!isProductionMode()) {
              console.log('🖼️ Processing photo album image:', {
                original: imageObj,
                finalUrl: imageUrl
              });
            }

            return {
              ...imageObj,
              signedUrl: imageUrl,
              url: imageUrl
            };
          });

          return {
            ...album,
            img: processedImages
          };
        }

        return album;
      });

      return processedAlbums;
    } catch (error) {
      console.error('❌ Error fetching photo albums from NocoDB:', error);
      return [];
    }
  });
};

/**
 * Fetch gallery items from NocoDB attachments_gallery table
 * Filters records with title containing "gallery"
 * Each record can contain multiple images (like photo albums)
 * @returns {Promise<Array>} Array of gallery records with processed image URLs
 */
export const fetchHomePageGallery = async () => {
  const cacheKey = 'homePageGallery';

  return deduplicateRequest(cacheKey, async () => {
    try {

      const response = await nocoRequest(
        `${TABLE_IDS.ATTACHMENTS_GALLERY}/records?sort=-CreatedAt&limit=100`,
        { method: 'GET' }
      );

      const allRecords = response.list || [];

      // Filter records where title contains "gallery" (case-insensitive)
      const galleryRecords = allRecords.filter(record => {
        const title = typeof record.title === 'string' ? record.title : '';
        return title.toLowerCase().includes('gallery');
      });

      // Process image URLs for each gallery record (like photo albums)
      const processedGallery = galleryRecords.map(record => {
        // Parse img_bw field (it's usually a JSON string)
        let imgBwArray = [];
        if (record.img_bw) {
          try {
            imgBwArray = typeof record.img_bw === 'string'
              ? JSON.parse(record.img_bw)
              : Array.isArray(record.img_bw)
                ? record.img_bw
                : [];
          } catch (e) {
            console.warn('⚠️ Failed to parse img_bw for gallery record:', record.Id, e);
            imgBwArray = [];
          }
        }

        // Process all images in the array
        const processedImages = imgBwArray.map(imageObj => {
          let imageUrl = null;

          // Development mode: construct URL from path
          // Production/Staging mode: use signedUrl directly
          if (import.meta.env.MODE === 'development') {
            const rawPath = imageObj.path || imageObj.signedPath || imageObj.url || null;
            if (rawPath) {
              const normalizedPath = rawPath.replace(/\\/g, '/');
              const trimmedPath = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;
              imageUrl = `${NOCODB_BASE_URL}/${trimmedPath}`;
            } else {
              imageUrl = null;
            }
          } else {
            // Production/Staging mode: use signedUrl directly
            imageUrl = imageObj.signedUrl || imageObj.url || null;
          }

          return {
            ...imageObj,
            signedUrl: imageUrl,
            url: imageUrl
          };
        });

        return {
          Id: record.Id,
          title: typeof record.title === 'string' ? record.title : '',
          desc: typeof record.desc === 'string' ? record.desc : '',
          img: processedImages,
          created_time: record.created_time || record.CreatedAt
        };
      });

      return processedGallery;
    } catch (error) {
      console.error('❌ Error fetching home page gallery from NocoDB:', error);
      return [];
    }
  });
};
