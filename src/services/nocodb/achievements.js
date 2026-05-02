import { TABLE_IDS, USE_STATIC_DATA, NOCODB_BASE_URL, NOCODB_TOKEN, fetchStaticData, nocoRequest, deduplicateRequest, parseNocoDate } from './core.js';

export const fetchAchievements = async () => {
  const cacheKey = 'achievements';

  return deduplicateRequest(cacheKey, async () => {
    try {
      // Use static data in development
      if (USE_STATIC_DATA) {
        const staticData = await fetchStaticData();
        // Static data doesn't have achievements yet
        return [];
      }

      // Use API in production
      const data = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS}/records?sort=-created_time`, {
        method: 'GET',
      });

      if (!data.list || data.list.length === 0) {
        console.warn('⚠️ No achievement records found in NocoDB');
        return [];
      }

      // Fetched achievements

      // Transform NocoDB achievements to frontend format
      const achievements = data.list.map(record => {
        // Parse achievement_name JSON array to get localized names
        const achievementNameArray = Array.isArray(record.achievement_name) ? record.achievement_name : [];
        const nameTranslations = {};
        achievementNameArray.forEach(item => {
          Object.assign(nameTranslations, item);
        });

        // Parse desc JSON array to get localized descriptions
        const descArray = Array.isArray(record.desc) ? record.desc : [];
        const descTranslations = {};
        descArray.forEach(item => {
          Object.assign(descTranslations, item);
        });

        // Parse special_reward JSON array to get localized special rewards
        const specialRewardArray = Array.isArray(record.special_reward) ? record.special_reward : [];
        const specialRewardTranslations = {};
        specialRewardArray.forEach(item => {
          Object.assign(specialRewardTranslations, item);
        });

        // Get English name as default
        const name = nameTranslations.en || nameTranslations.vi || record.title || 'Unnamed Achievement';
        const desc = descTranslations.en || descTranslations.vi || '';
        const specialReward = specialRewardTranslations.en || specialRewardTranslations.vi || '';

        // Determine status based on achievement_confirm
        // If achievement_confirm has value (linked record), it's pending review
        // If no value, it's available (pending)
        const hasConfirmation = record.achievement_confirm !== null && record.achievement_confirm !== undefined;

        // Parse due_date to ICT timezone if exists
        let dueDate = null;
        if (record.due_date) {
          try {
            // NocoDB returns date in UTC format: "2025-12-06 00:00:00+00:00"
            // Convert to ICT (UTC+7) for display
            const utcDate = new Date(record.due_date);
            // Convert to ICT by using toLocaleString
            const ictDateStr = utcDate.toLocaleString('en-US', {
              timeZone: 'Asia/Bangkok',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            });
            dueDate = new Date(ictDateStr);
          } catch (e) {
            console.warn('⚠️ Failed to parse due_date:', record.due_date, e);
            dueDate = record.due_date;
          }
        }

        return {
          id: record.Id,
          name: name,
          nameTranslations: nameTranslations,
          desc: desc,
          descTranslations: descTranslations,
          specialReward: specialReward,
          specialRewardTranslations: specialRewardTranslations,
          icon: record.icon || '🏆',
          xp: record.xp || 0,
          dueDate: dueDate,
          achievementConfirmId: record.achievement_confirm || null, // Link to achievement_confirm
          hasConfirmation: hasConfirmation, // Helper flag
          createdAt: parseNocoDate(record.created_time),
          completedAt: parseNocoDate(record.completed_time), // Completed timestamp
          updatedAt: record.UpdatedAt
        };
      });

      return achievements;
    } catch (error) {
      console.error('❌ Error fetching achievements from NocoDB:', error);
      throw error;
    }
  });
};

/**
 * Fetch achievement confirmations data from NocoDB
 * Returns all achievement confirmation records with image data from attachments_gallery
 */
export const fetchAchievementConfirmations = async () => {
  const cacheKey = 'achievement_confirmations';

  return deduplicateRequest(cacheKey, async () => {
    try {
      // Use static data in development
      if (USE_STATIC_DATA) {
        const staticData = await fetchStaticData();
        // Static data doesn't have achievement confirmations yet
        return [];
      }

      // Step 1: Fetch achievement confirmations
      const data = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS_CONFIRM}/records?sort=-created_time`, {
        method: 'GET',
      });

      if (!data.list || data.list.length === 0) {
        console.warn('⚠️ No achievement confirmation records found in NocoDB');
        return [];
      }

      // Fetched achievement confirmations

      // Step 2: Fetch all attachments_gallery records that link to these confirmations
      const attachmentsData = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records?fields=Id,title,img_bw,achievements_confirm_id`, {
        method: 'GET',
      });

      // Create a map of confirmationId -> attachment for quick lookup
      const attachmentMap = new Map();
      if (attachmentsData.list) {
        attachmentsData.list.forEach(attachment => {
          if (attachment.achievements_confirm_id) {
            attachmentMap.set(attachment.achievements_confirm_id, attachment);
          }
        });
      }

      // Fetched achievement attachments

      // Step 3: Transform and combine data
      const confirmations = data.list.map(record => {
        // Get linked attachment from map
        const attachment = attachmentMap.get(record.Id);

        let imageUrl = null;
        if (attachment && attachment.img_bw) {
          try {
            // Parse img_bw if it's a string (NocoDB returns it as JSON string)
            let imgBwArray = attachment.img_bw;
            if (typeof imgBwArray === 'string') {
              imgBwArray = JSON.parse(imgBwArray);
            }

            // Get first image from array
            if (Array.isArray(imgBwArray) && imgBwArray.length > 0) {
              const imgBw = imgBwArray[0];
              // Prefer signedUrl for S3 access, fallback to url
              imageUrl = imgBw.signedUrl || imgBw.url || null;
            }
          } catch (parseError) {
            console.warn('⚠️ Failed to parse img_bw for achievement confirmation:', record.Id, parseError);
          }
        }

        // Achievement confirmation processed

        return {
          id: record.Id,
          title: record.title || '',
          achievementName: record.achievement_name || '',
          desc: record.desc || '',
          achievementsId: record.achievements_id || null,
          imgUrl: imageUrl,
          imageUrl: imageUrl,
          status: record.status || 'pending',
          createdAt: parseNocoDate(record.created_time),
          updatedAt: record.UpdatedAt
        };
      });

      return confirmations;
    } catch (error) {
      console.error('❌ Error fetching achievement confirmations from NocoDB:', error);
      throw error;
    }
  });
};

/**
 * Create quest in NocoDB
 * @param {Object} questData - Quest data
 * @param {string} questData.nameEn - English name
 * @param {string} questData.nameVi - Vietnamese name
 * @param {string} questData.descEn - English description
 * @param {string} questData.descVi - Vietnamese description
 * @param {number} questData.xp - XP value
 * @param {boolean} questData.scheduleEnabled - Whether schedule is enabled
 * @param {string} questData.scheduleTime - Schedule time in HH:mm format
 * @returns {Promise<Object>} Result object with success status
 */

export const createAchievement = async (achievementData) => {
  try {
    const { nameEn, nameVi, descEn, descVi, icon, xp, specialRewardEn, specialRewardVi, dueDate } = achievementData;

    // Validate required fields
    if (!nameEn || !nameVi) {
      return { success: false, message: 'Achievement name (EN and VI) is required' };
    }

    // Get current ICT time
    const now = new Date();
    const ictDateStr = now.toLocaleString('en-US', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Parse the ICT date string (format: "MM/DD/YYYY, HH:mm:ss")
    const [datePart, timePart] = ictDateStr.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes, seconds] = timePart.split(':');

    // Generate title: achievement_<year>-<month>-<day>_<hh>-<mm>
    const title = `achievement_${year}-${month}-${day}_${hours}-${minutes}`;

    // Format created_time with timezone offset
    const createdTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;

    // Format achievement_name and desc as array of objects
    const achievementName = [
      { "en": nameEn },
      { "vi": nameVi }
    ];

    const desc = [
      { "en": descEn || '' },
      { "vi": descVi || '' }
    ];

    // Format special_reward as array of objects (only if provided)
    const specialReward = (specialRewardEn || specialRewardVi) ? [
      { "en": specialRewardEn || '' },
      { "vi": specialRewardVi || '' }
    ] : null;

    const payload = {
      title: title,
      achievement_name: achievementName,
      desc: desc,
      icon: icon || '🏆',
      xp: xp || 0,
      created_time: createdTime
    };

    // Add optional fields if provided
    if (specialReward) {
      payload.special_reward = specialReward;
      // Debug: Log special reward added (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('✅ Added special_reward to payload:', payload.special_reward);
      }
    } else {
      // Debug: Log no special reward (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('⚠️ No special_reward provided');
      }
    }

    if (dueDate) {
      payload.due_date = dueDate;
    }

    // Debug: Log achievement creation (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Achievement POST to NocoDB:', JSON.stringify(payload, null, 2));
    }

    const response = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS}/records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Debug: Log achievement creation success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Achievement created successfully in NocoDB:', response);
    }
    return { success: true, message: 'Achievement created', data: response };
  } catch (error) {
    console.error('❌ Error creating achievement in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Delete quest from NocoDB
 * @param {string} questId - Quest ID to delete
 * @returns {Promise<Object>} Result object with success status
 */

export const updateAchievementConfirmationStatus = async (confirmationId, status) => {
  try {
    if (!confirmationId) {
      return { success: false, message: 'Achievement confirmation ID is required' };
    }

    if (!['pending', 'completed', 'failed'].includes(status)) {
      return { success: false, message: 'Invalid status value' };
    }

    const updatePayload = [{
      Id: confirmationId,
      status: status
    }];

    // Debug: Log achievement confirmation status update (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Achievement Confirmation Status PATCH to NocoDB:', updatePayload);
    }

    const response = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS_CONFIRM}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    // Debug: Log achievement confirmation status update success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Achievement confirmation status updated successfully in NocoDB:', response);
    }
    return { success: true, message: 'Achievement confirmation status updated' };
  } catch (error) {
    console.error('❌ Error updating achievement confirmation status in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Batch update multiple quest confirmation statuses in NocoDB
 * @param {Array<{id: string, status: string}>} updates - Array of updates with id and status
 * @returns {Promise<Object>} Result object with success status
 */

export const updateAchievement = async (achievementId, updates) => {
  try {
    if (!achievementId) {
      return { success: false, message: 'Achievement ID is required' };
    }

    const payload = {};

    // Handle completedAt field
    if (updates.completedAt) {
      // Get current ICT time
      const completedDate = updates.completedAt instanceof Date ? updates.completedAt : new Date(updates.completedAt);

      const ictDateStr = completedDate.toLocaleString('en-US', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      // Parse the ICT date string (format: "MM/DD/YYYY, HH:mm:ss")
      const [datePart, timePart] = ictDateStr.split(', ');
      const [month, day, year] = datePart.split('/');
      const [hours, minutes, seconds] = timePart.split(':');

      // Format completed_time with timezone offset
      payload.completed_time = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;
    }

    // If no updates, return success
    if (Object.keys(payload).length === 0) {
      return { success: true, message: 'No updates to apply' };
    }

    const updatePayload = [{
      Id: achievementId,
      ...payload
    }];

    // Debug: Log achievement update (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Achievement PATCH to NocoDB:', updatePayload);
    }

    const response = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    // Debug: Log achievement update success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Achievement updated successfully in NocoDB:', response);
    }
    return { success: true, message: 'Achievement updated' };
  } catch (error) {
    console.error('❌ Error updating achievement in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Upload image to attachments_gallery and link to quest_confirm
 * @param {File} imageFile - Image file to upload
 * @param {string} title - Title for the attachment record
 * @param {string} questConfirmId - Quest confirmation ID to link to
 * @returns {Promise<Object>} Result with attachment gallery ID
 */

export const isAchievementOverdue = (dueDate) => {
  if (!dueDate) return false;

  // Get today's date in ICT timezone (UTC+7)
  const now = new Date();
  const ictDateStr = now.toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  });
  const [month, day, year] = ictDateStr.split(', ')[0].split('/');
  const todayICT = new Date(`${year}-${month}-${day}T00:00:00+07:00`);

  // Convert dueDate to ICT timezone
  const dueDateObj = new Date(dueDate);
  const dueICTStr = dueDateObj.toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  });
  const [dMonth, dDay, dYear] = dueICTStr.split(', ')[0].split('/');
  const dueICT = new Date(`${dYear}-${dMonth}-${dDay}T00:00:00+07:00`);

  // Achievement is overdue if due date is before today
  return dueICT < todayICT;
};

/**
 * Save quest confirmation to NocoDB
 * Creates a new quest confirmation record and links it to the quest
 * If image is provided, uploads to attachments_gallery
 * @param {Object} confirmData - Confirmation data
 * @param {string} confirmData.questId - Quest ID to link to
 * @param {string} confirmData.questName - Quest name
 * @param {string} confirmData.desc - Description
 * @param {File} confirmData.imageFile - Image file to upload (optional)
 * @param {string} confirmData.imgUrl - Legacy image URL (optional, for backward compatibility)
 * @param {Date} confirmData.questCreatedAt - Quest creation date (for overdue check)
 * @param {boolean} confirmData.autoApprove - Auto-approve flag from config
 * @returns {Promise<Object>} Result object with success status and confirmation ID
 */

export const uploadAchievementConfirmationImage = async (imageFile, title, achievementConfirmId) => {
  try {
    if (!imageFile || !title) {
      return { success: false, message: 'Image file and title are required' };
    }

    // Step 1: Create the attachment gallery record with only title
    const recordPayload = {
      title: title
    };

    console.log('🔍 Creating attachment gallery record for achievement:', recordPayload);

    const recordResponse = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
      method: 'POST',
      body: JSON.stringify(recordPayload)
    });

    const attachmentId = recordResponse.Id || (recordResponse.list && recordResponse.list[0]?.Id);

    if (!attachmentId) {
      throw new Error('Failed to create attachment gallery record');
    }

    console.log('✅ Attachment gallery record created:', attachmentId);

    // Step 2: Upload the image to NocoDB storage
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
    // Debug: Log image upload success for achievement (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Image uploaded to NocoDB storage for achievement');
    }

    // Step 3: Update the record with the uploaded file info
    const updatePayload = [{
      Id: attachmentId,
      img_bw: storageResult
    }];

    // Debug: Log record update with image (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Updating record with image');
    }

    await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    // Debug: Log record update success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Record updated with image');
    }

    // Step 4: Link the attachment to achievement_confirm if ID provided
    if (achievementConfirmId) {
      const linkPayload = [{
        Id: attachmentId,
        achievements_confirm_id: achievementConfirmId // Use foreign key field name
      }];

      // Debug: Log attachment linking to achievement (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('🔍 Linking attachment to achievement_confirm (using FK):', linkPayload);
      }

      const linkResponse = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
        method: 'PATCH',
        body: JSON.stringify(linkPayload)
      });

      // Debug: Log attachment linking success to achievement (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('✅ Attachment linked to achievement_confirm. Response:', linkResponse);
      }
    }

    return {
      success: true,
      attachmentId: attachmentId,
      data: storageResult
    };
  } catch (error) {
    console.error('❌ Error uploading achievement confirmation image:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Save achievement confirmation to NocoDB
 * Creates a new achievement confirmation record and links it to the achievement
 * If image is provided, uploads to attachments_gallery
 * @param {Object} confirmData - Confirmation data
 * @param {string} confirmData.achievementId - Achievement ID to link to
 * @param {string} confirmData.achievementName - Achievement name
 * @param {string} confirmData.desc - Description
 * @param {File} confirmData.imageFile - Image file to upload (optional)
 * @param {Date} confirmData.achievementDueDate - Achievement due date (for overdue check)
 * @param {boolean} confirmData.autoApprove - Auto-approve flag from config
 * @returns {Promise<Object>} Result object with success status and confirmation ID
 */

/**
 * Generate gallery title for profile images
 * Format: journal_<year>-<month>-<day>_<hh>-<mm>-<random3digits>
 */

export const saveAchievementConfirmation = async (confirmData) => {
  try {
    const { achievementId, achievementName, desc, imageFile, achievementDueDate, autoApprove } = confirmData;

    if (!achievementId) {
      return { success: false, message: 'Achievement ID is required' };
    }

    // Get current ICT time
    const now = new Date();
    const ictDateStr = now.toLocaleString('en-US', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Parse the ICT date string (format: "MM/DD/YYYY, HH:mm:ss")
    const [datePart, timePart] = ictDateStr.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes, seconds] = timePart.split(':');

    // Generate title: achievement_confirm_<year>-<month>-<day>_<hh>-<mm>
    const title = `achievement_confirm_${year}-${month}-${day}_${hours}-${minutes}`;

    // Format created_time with timezone offset
    const createdTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;

    // Determine initial status based on auto-approve and overdue check
    let initialStatus = 'pending';
    let shouldAutoComplete = false;

    if (autoApprove) {
      // Check if achievement has due date and is overdue
      if (achievementDueDate) {
        const isOverdue = isAchievementOverdue(achievementDueDate);

        if (isOverdue) {
          // Achievement is overdue - mark as failed, auto-approve is disabled
          initialStatus = 'failed';
          // Debug: Log achievement overdue warning (development only)
          if (import.meta.env.MODE !== 'production') {
            console.log('⚠️ Achievement is overdue, marking as failed (auto-approve disabled)');
          }
        } else {
          // Achievement is within deadline - auto-approve as completed
          initialStatus = 'completed';
          shouldAutoComplete = true;
          // Debug: Log achievement auto-approve (development only)
          if (import.meta.env.MODE !== 'production') {
            console.log('✅ Achievement is within deadline, auto-approving as completed');
          }
        }
      } else {
        // No due date - auto-approve as completed
        initialStatus = 'completed';
        shouldAutoComplete = true;
        // Debug: Log achievement no due date (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log('✅ Achievement has no due date, auto-approving as completed');
        }
      }
    }

    const payload = {
      title: title,
      achievement_name: achievementName || '',
      desc: desc || '',
      created_time: createdTime,
      achievements_id: achievementId, // Link to achievement record using FK field (1-1 relationship)
      status: initialStatus
    };

    // Debug: Log achievement confirmation creation (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Achievement Confirmation POST to NocoDB:', payload);
    }

    const response = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS_CONFIRM}/records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Debug: Log achievement confirmation creation success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Achievement confirmation created successfully in NocoDB:', response);
    }

    // Extract the confirmation ID from response
    const confirmationId = response.Id || (response.list && response.list[0]?.Id);

    // Upload image to attachments_gallery if provided
    let attachmentId = null;
    if (imageFile && confirmationId) {
      try {
        const uploadResult = await uploadAchievementConfirmationImage(imageFile, title, confirmationId);
        if (uploadResult.success) {
          attachmentId = uploadResult.attachmentId;
          // Debug: Log achievement image upload success (development only)
          if (import.meta.env.MODE !== 'production') {
            console.log('✅ Image uploaded and linked to achievement confirmation');
          }
        } else {
          console.warn('⚠️ Image upload failed:', uploadResult.message);
        }
      } catch (uploadError) {
        console.warn('⚠️ Image upload failed:', uploadError.message);
        // Continue without image
      }
    }

    return {
      success: true,
      message: 'Achievement confirmation saved',
      id: confirmationId,
      attachmentId: attachmentId,
      shouldAutoComplete: shouldAutoComplete, // Flag to indicate if achievement should be auto-completed
      autoApproved: shouldAutoComplete,
      data: response
    };
  } catch (error) {
    console.error('❌ Error saving achievement confirmation to NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Delete achievement confirmation from NocoDB
 * Also deletes linked attachment from attachments_gallery
 * @param {string} confirmationId - Achievement confirmation ID to delete
 * @returns {Promise<Object>} Result object with success status
 */
export const deleteAchievementConfirmation = async (confirmationId) => {
  try {
    if (!confirmationId) {
      return { success: false, message: 'Achievement confirmation ID is required' };
    }

    // Debug: Log achievement confirmation deletion (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Deleting Achievement Confirmation:', confirmationId);
    }

    // Step 1: Find and delete linked attachment from attachments_gallery
    try {
      const attachmentsData = await nocoRequest(
        `${TABLE_IDS.ATTACHMENTS_GALLERY}/records?where=(achievements_confirm_id,eq,${confirmationId})`,
        { method: 'GET' }
      );

      if (attachmentsData.list && attachmentsData.list.length > 0) {
        const attachmentIds = attachmentsData.list.map(att => ({ Id: att.Id }));

        // Debug: Log linked achievement attachments deletion (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log(`🗑️ Deleting ${attachmentIds.length} linked attachment(s) from attachments_gallery`);
        }

        await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
          method: 'DELETE',
          body: JSON.stringify(attachmentIds)
        });

        // Debug: Log attachments deletion success (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log('✅ Linked attachments deleted successfully');
        }
      } else {
        // Debug: Log no achievement attachments (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log('ℹ️ No linked attachments found for this achievement confirmation');
        }
      }
    } catch (attachmentError) {
      console.warn('⚠️ Failed to delete linked attachments:', attachmentError.message);
      // Continue with confirmation deletion even if attachment deletion fails
    }

    // Step 2: Delete the achievement confirmation record
    // Debug: Log achievement confirmation record deletion (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🗑️ Deleting achievement confirmation record');
    }

    const response = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS_CONFIRM}/records`, {
      method: 'DELETE',
      body: JSON.stringify([{ Id: confirmationId }])
    });

    // Debug: Log achievement confirmation deletion success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Achievement confirmation deleted successfully in NocoDB:', response);
    }
    return { success: true, message: 'Achievement confirmation and linked attachments deleted' };
  } catch (error) {
    console.error('❌ Error deleting achievement confirmation in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Upload photo album to NocoDB attachments_album table
 * Uploads multiple images and creates a record with description
 * @param {Object} albumData - Album data
 * @param {string} albumData.description - Album description
 * @param {File[]} albumData.imageFiles - Array of image files to upload
 * @returns {Promise<Object>} Result object with success status and album ID
 */
