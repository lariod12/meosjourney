import { TABLE_IDS, USE_STATIC_DATA, NOCODB_BASE_URL, NOCODB_TOKEN, fetchStaticData, nocoRequest, deduplicateRequest, isProductionMode, parseNocoDate } from './core.js';

export const fetchQuests = async () => {
  const cacheKey = 'quests';

  return deduplicateRequest(cacheKey, async () => {
    try {
      // Use static data in development
      if (USE_STATIC_DATA) {
        const staticData = await fetchStaticData();
        // Static data doesn't have quests yet
        return [];
      }

      // Use API in production
      const data = await nocoRequest(`${TABLE_IDS.QUESTS}/records?sort=-created_time`, {
        method: 'GET',
      });

      if (!data.list || data.list.length === 0) {
        console.warn('⚠️ No quest records found in NocoDB');
        return [];
      }

      // Fetched quests

      // Transform NocoDB quests to frontend format
      const quests = data.list.map(record => {
        // Parse quest_name JSON array to get localized names
        const questNameArray = Array.isArray(record.quest_name) ? record.quest_name : [];
        const nameTranslations = {};
        questNameArray.forEach(item => {
          Object.assign(nameTranslations, item);
        });

        // Parse desc JSON array to get localized descriptions
        const descArray = Array.isArray(record.desc) ? record.desc : [];
        const descTranslations = {};
        descArray.forEach(item => {
          Object.assign(descTranslations, item);
        });

        // Get English name as default
        const name = nameTranslations.en || nameTranslations.vi || record.title || 'Unnamed Quest';
        const desc = descTranslations.en || descTranslations.vi || '';

        // Get quest_confirm link ID (NocoDB returns this as quests_confirm_id)
        const questConfirmId = record.quests_confirm_id || null;

        return {
          id: record.Id,
          name: name,
          nameTranslations: nameTranslations,
          desc: desc,
          descTranslations: descTranslations,
          xp: record.xp || 0,
          questsConfirmId: questConfirmId, // Link to quest_confirm (ID of linked record)
          createdAt: parseNocoDate(record.created_time),
          completedAt: parseNocoDate(record.completed_time),
          updatedAt: record.UpdatedAt
        };
      });

      return quests;
    } catch (error) {
      console.error('❌ Error fetching quests from NocoDB:', error);
      throw error;
    }
  });
};

/**
 * Fetch quest confirmations data from NocoDB
 * Returns all quest confirmation records with image data from attachments_gallery
 */
export const fetchQuestConfirmations = async () => {
  const cacheKey = 'quest_confirmations';

  return deduplicateRequest(cacheKey, async () => {
    try {
      // Use static data in development
      if (USE_STATIC_DATA) {
        const staticData = await fetchStaticData();
        // Static data doesn't have quest confirmations yet
        return [];
      }

      // Step 1: Fetch quest confirmations
      const data = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records?sort=-created_time`, {
        method: 'GET',
      });

      if (!data.list || data.list.length === 0) {
        console.warn('⚠️ No quest confirmation records found in NocoDB');
        return [];
      }

      // Fetched quest confirmations

      // Step 2: Fetch all attachments_gallery records that link to these confirmations
      let attachmentsData;

      // Development mode: different schema (no quests_confirm_id field)
      if (!isProductionMode()) {
        // Debug: Log development mode quest confirmations (development only)
        if (!isProductionMode()) {
          console.log('🛠️ Development mode: fetching all attachments for quest confirmations');
        }
        attachmentsData = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records?limit=10`, {
          method: 'GET',
        });
      } else {
        // Production mode: original query with quests_confirm_id filtering
        attachmentsData = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records?fields=Id,title,img_bw,quests_confirm_id`, {
          method: 'GET',
        });
      }

      // Create a map of confirmationId -> attachment for quick lookup
      const attachmentMap = new Map();
      if (attachmentsData.list) {
        attachmentsData.list.forEach(attachment => {
          // Development mode: no quests_confirm_id field, use first attachment for first confirmation
          if (!isProductionMode()) {
            // In development, just use the first attachment for the first confirmation
            if (data.list.length > 0) {
              attachmentMap.set(data.list[0].Id, attachment);
            }
          } else {
            // Production mode: use quests_confirm_id field
            if (attachment.quests_confirm_id) {
              attachmentMap.set(attachment.quests_confirm_id, attachment);
            }
          }
        });
      }

      // Fetched attachments

      // Step 3: Transform and combine data
      const confirmations = data.list.map(record => {
        // Get linked attachment from map
        const attachment = attachmentMap.get(record.Id);

        let imgUrl = null;
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

              // Development mode: use signedPath, Production mode: use signedUrl
              if (!isProductionMode()) {
                imgUrl = imgBw.signedPath || imgBw.path || null;
                // Construct full URL for signedPath
                if (imgUrl) {
                  imgUrl = `${NOCODB_BASE_URL}/${imgUrl}`;
                }
              } else {
                imgUrl = imgBw.signedUrl || imgBw.url || null;
              }
            }
          } catch (parseError) {
            console.warn('⚠️ Failed to parse img_bw for confirmation:', record.Id, parseError);
          }
        }

        // Quest confirmation processed

        return {
          id: record.Id,
          questsId: record.quests_id || record.quest_id || record.quest || record.quests || null,
          name: record.quest_name || record.title || 'Unnamed Quest',
          desc: record.desc || '',
          imgUrl: imgUrl,
          status: record.status || 'pending',
          createdAt: parseNocoDate(record.created_time) || parseNocoDate(record.CreatedAt)
        };
      });

      return confirmations;
    } catch (error) {
      console.error('❌ Error fetching quest confirmations from NocoDB:', error);
      throw error;
    }
  });
};

/**
 * Update config auto_approve_tasks field in NocoDB
 * @param {boolean} enabled - Auto-approve enabled flag
 * @returns {Promise<Object>} Result object with success status
 */

export const createQuest = async (questData) => {
  try {
    const { nameEn, nameVi, descEn, descVi, xp, scheduleEnabled, scheduleTime } = questData;

    // Validate required fields
    if (!nameEn || !nameVi) {
      return { success: false, message: 'Quest name (EN and VI) is required' };
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

    // Generate title: quest_<year>-<month>-<day>_<hh>-<mm>
    const title = `quest_${year}-${month}-${day}_${hours}-${minutes}`;

    // Format created_time with timezone offset
    const createdTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;

    // Format quest_name and desc as array of objects
    const questName = [
      { "en": nameEn },
      { "vi": nameVi }
    ];

    const desc = [
      { "en": descEn || '' },
      { "vi": descVi || '' }
    ];

    const payload = {
      title: title,
      quest_name: questName,
      desc: desc,
      xp: xp || 0,
      created_time: createdTime,
      // Schedule fields
      schedule_enabled: scheduleEnabled || false,
      schedule_time: scheduleEnabled ? scheduleTime : null
    };

    // Debug: Log quest creation (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Quest POST to NocoDB:', payload);
    }

    const response = await nocoRequest(`${TABLE_IDS.QUESTS}/records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Debug: Log quest creation success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Quest created successfully in NocoDB:', response);
    }
    return { success: true, message: 'Quest created', data: response };
  } catch (error) {
    console.error('❌ Error creating quest in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Create achievement in NocoDB
 * @param {Object} achievementData - Achievement data
 * @param {string} achievementData.nameEn - English name
 * @param {string} achievementData.nameVi - Vietnamese name
 * @param {string} achievementData.descEn - English description
 * @param {string} achievementData.descVi - Vietnamese description
 * @param {string} achievementData.icon - Icon emoji
 * @param {number} achievementData.xp - XP value
 * @param {string} achievementData.specialRewardEn - English special reward (optional)
 * @param {string} achievementData.specialRewardVi - Vietnamese special reward (optional)
 * @param {string} achievementData.dueDate - Due date in YYYY-MM-DD format (optional)
 * @returns {Promise<Object>} Result object with success status
 */

export const deleteQuest = async (questId) => {
  try {
    if (!questId) {
      return { success: false, message: 'Quest ID is required' };
    }

    await nocoRequest(`${TABLE_IDS.QUESTS}/records`, {
      method: 'DELETE',
      body: JSON.stringify([{ Id: questId }])
    });

    // Debug: Log quest deletion (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Quest deleted successfully from NocoDB');
    }
    return { success: true, message: 'Quest deleted' };
  } catch (error) {
    console.error('❌ Error deleting quest from NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Delete achievement from NocoDB
 * @param {string} achievementId - Achievement ID to delete
 * @returns {Promise<Object>} Result object with success status
 */
export const deleteAchievement = async (achievementId) => {
  try {
    if (!achievementId) {
      return { success: false, message: 'Achievement ID is required' };
    }

    await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS}/records`, {
      method: 'DELETE',
      body: JSON.stringify([{ Id: achievementId }])
    });

    // Debug: Log achievement deletion (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Achievement deleted successfully from NocoDB');
    }
    return { success: true, message: 'Achievement deleted' };
  } catch (error) {
    console.error('❌ Error deleting achievement from NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Update quest confirmation status in NocoDB
 * @param {string} confirmationId - Quest confirmation ID to update
 * @param {string} status - Status value ('pending', 'completed', 'failed')
 * @returns {Promise<Object>} Result object with success status
 */
export const updateQuestConfirmationStatus = async (confirmationId, status) => {
  try {
    if (!confirmationId) {
      return { success: false, message: 'Quest confirmation ID is required' };
    }

    if (!['pending', 'completed', 'failed'].includes(status)) {
      return { success: false, message: 'Invalid status value' };
    }

    const updatePayload = [{
      Id: confirmationId,
      status: status
    }];

    // Debug: Log quest confirmation status update (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Quest Confirmation Status PATCH to NocoDB:', updatePayload);
    }

    const response = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    // Debug: Log quest confirmation status update success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Quest confirmation status updated successfully in NocoDB:', response);
    }
    return { success: true, message: 'Quest confirmation status updated' };
  } catch (error) {
    console.error('❌ Error updating quest confirmation status in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Update achievement confirmation status in NocoDB
 * @param {string} confirmationId - Achievement confirmation ID to update
 * @param {string} status - Status value ('pending', 'completed', 'failed')
 * @returns {Promise<Object>} Result object with success status
 */

export const batchUpdateQuestConfirmationStatus = async (updates) => {
  try {
    if (!updates || updates.length === 0) {
      return { success: true, message: 'No updates to apply' };
    }

    // Validate all updates
    for (const update of updates) {
      if (!update.id || !['pending', 'completed', 'failed'].includes(update.status)) {
        return { success: false, message: 'Invalid update data' };
      }
    }

    const updatePayload = updates.map(u => ({
      Id: u.id,
      status: u.status
    }));

    // Debug: Log batch quest confirmation status update (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Batch Quest Confirmation Status PATCH to NocoDB:', updatePayload);
    }

    const response = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    // Debug: Log batch update success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log(`✅ ${updates.length} quest confirmation statuses updated successfully in NocoDB`);
    }
    return { success: true, message: `${updates.length} quest confirmations updated` };
  } catch (error) {
    console.error('❌ Error batch updating quest confirmation statuses in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Unlink quest confirmation from quest in NocoDB
 * Removes the relationship between quest and quest_confirm
 * @param {string} questId - Quest ID to unlink from
 * @param {string} confirmationId - Confirmation ID to unlink (required for negative ID method)
 * @returns {Promise<Object>} Result object with success status
 */
export const unlinkQuestConfirmation = async (questId, confirmationId) => {
  try {
    if (!questId) {
      return { success: false, message: 'Quest ID is required' };
    }

    // NocoDB Link field unlink syntax for one-to-one relationship:
    // Need to unlink from BOTH sides of the relationship

    // 1. Unlink from quest side (quest.quest_confirm = null)
    const questUpdatePayload = [{
      Id: questId,
      quest_confirm: null
    }];

    // Debug: Log quest unlink (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Quest Unlink PATCH to NocoDB (quest side):', questUpdatePayload);
    }

    const questResponse = await nocoRequest(`${TABLE_IDS.QUESTS}/records`, {
      method: 'PATCH',
      body: JSON.stringify(questUpdatePayload)
    });

    // Debug: Log quest unlink success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Quest side unlinked:', questResponse);
    }

    // 2. Unlink from quest_confirm side (quest_confirm.quest = null)
    if (confirmationId) {
      const confirmUpdatePayload = [{
        Id: confirmationId,
        quest: null
      }];

      // Debug: Log quest confirmation unlink (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('🔍 Sending Quest Unlink PATCH to NocoDB (quest_confirm side):', confirmUpdatePayload);
      }

      const confirmResponse = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records`, {
        method: 'PATCH',
        body: JSON.stringify(confirmUpdatePayload)
      });

      // Debug: Log quest confirmation unlink success (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('✅ Quest_confirm side unlinked:', confirmResponse);
      }
    }

    return { success: true, message: 'Quest confirmation unlinked from both sides' };

  } catch (error) {
    console.error('❌ Error unlinking quest confirmation in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Update quest in NocoDB
 * @param {string} questId - Quest ID to update
 * @param {Object} updates - Fields to update
 * @param {Date} updates.completedAt - Completion timestamp (optional)
 * @returns {Promise<Object>} Result object with success status
 */
export const updateQuest = async (questId, updates) => {
  try {
    if (!questId) {
      return { success: false, message: 'Quest ID is required' };
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
      Id: questId,
      ...payload
    }];

    await nocoRequest(`${TABLE_IDS.QUESTS}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });
    return { success: true, message: 'Quest updated' };
  } catch (error) {
    console.error('❌ Error updating quest in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Update achievement in NocoDB
 * @param {string} achievementId - Achievement ID to update
 * @param {Object} updates - Fields to update
 * @param {Date} updates.completedAt - Completion timestamp (optional)
 * @returns {Promise<Object>} Result object with success status
 */

export const uploadQuestConfirmationImage = async (imageFile, title, questConfirmId) => {
  try {
    if (!imageFile || !title) {
      return { success: false, message: 'Image file and title are required' };
    }

    // Step 1: Create the attachment gallery record with only title
    const recordPayload = {
      title: title
    };

    // Debug: Log attachment creation (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Creating attachment gallery record:', recordPayload);
    }

    const recordResponse = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
      method: 'POST',
      body: JSON.stringify(recordPayload)
    });

    const attachmentId = recordResponse.Id || (recordResponse.list && recordResponse.list[0]?.Id);

    if (!attachmentId) {
      throw new Error('Failed to create attachment gallery record');
    }

    console.log('✅ Attachment gallery record created:', attachmentId);

    // Step 2: Upload the image to img_bw column using NocoDB storage API
    // NocoDB file upload endpoint: /api/v2/tables/{tableId}/columns/{columnId}
    const formData = new FormData();
    formData.append('file', imageFile);

    // Upload to NocoDB storage first
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
    // Debug: Log image upload success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Image uploaded to NocoDB storage:', storageResult);
    }

    // Step 3: Update the record with the uploaded file info
    const updatePayload = [{
      Id: attachmentId,
      img_bw: storageResult // NocoDB returns array of file objects
    }];

    // Debug: Log record update with image (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Updating record with image:', updatePayload);
    }

    await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    // Debug: Log record update success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Record updated with image');
    }

    // Step 4: Link the attachment to quest_confirm if ID provided
    if (questConfirmId) {
      // Try using the foreign key field directly instead of the link field
      const linkPayload = [{
        Id: attachmentId,
        quests_confirm_id: questConfirmId // Use foreign key field name
      }];

      // Debug: Log attachment linking (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('🔍 Linking attachment to quest_confirm (using FK):', linkPayload);
      }

      const linkResponse = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
        method: 'PATCH',
        body: JSON.stringify(linkPayload)
      });

      // Debug: Log attachment linking success (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('✅ Attachment linked to quest_confirm. Response:', linkResponse);
      }

      // Verify the link was created
      const verifyResponse = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records/${attachmentId}`, {
        method: 'GET'
      });
      // Debug: Log attachment verification (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('🔍 Verify attachment record after FK link:', verifyResponse);
      }
    }

    return {
      success: true,
      attachmentId: attachmentId,
      data: storageResult
    };
  } catch (error) {
    console.error('❌ Error uploading quest confirmation image:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Check if a quest is overdue (created before today in ICT timezone)
 * @param {Date} createdAt - Quest creation date
 * @returns {boolean} True if quest is overdue
 */
export const isQuestOverdue = (createdAt) => {
  if (!createdAt) return false;

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

  // Convert createdAt to ICT timezone
  const createdDate = new Date(createdAt);
  const createdICTStr = createdDate.toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  });
  const [cMonth, cDay, cYear] = createdICTStr.split(', ')[0].split('/');
  const createdICT = new Date(`${cYear}-${cMonth}-${cDay}T00:00:00+07:00`);

  // Quest is overdue if created before today
  return createdICT < todayICT;
};

/**
 * Check if an achievement is overdue (past due date in ICT timezone)
 * @param {Date} dueDate - Achievement due date
 * @returns {boolean} True if achievement is overdue
 */

export const saveQuestConfirmation = async (confirmData) => {
  try {
    const { questId, questName, desc, imageFile, imgUrl, questCreatedAt, autoApprove } = confirmData;

    if (!questId) {
      return { success: false, message: 'Quest ID is required' };
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

    // Generate title: quest_confirm_<year>-<month>-<day>_<hh>-<mm>
    const title = `quest_confirm_${year}-${month}-${day}_${hours}-${minutes}`;

    // Format created_time with timezone offset
    const createdTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;

    // Determine initial status based on auto-approve and overdue check
    let initialStatus = 'pending';
    let shouldAutoComplete = false;

    if (autoApprove) {
      // Check if quest is overdue (created before today)
      const isOverdue = isQuestOverdue(questCreatedAt);

      if (isOverdue) {
        // Quest is overdue - mark as failed, auto-approve is disabled
        initialStatus = 'failed';
        // Debug: Log overdue quest warning (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log('⚠️ Quest is overdue, marking as failed (auto-approve disabled)');
        }
      } else {
        // Quest is within deadline - auto-approve as completed
        initialStatus = 'completed';
        shouldAutoComplete = true;

      }
    }

    const payload = {
      title: title,
      quest_name: questName || '',
      desc: desc || '',
      created_time: createdTime,
      quest: questId, // Link to quest record (1-1 relationship)
      status: initialStatus
    };

    // Debug: Log quest confirmation creation (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Quest Confirmation POST to NocoDB:', payload);
    }

    const response = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Debug: Log quest confirmation creation success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Quest confirmation created successfully in NocoDB:', response);
    }

    // Extract the confirmation ID from response
    const confirmationId = response.Id || (response.list && response.list[0]?.Id);

    // Upload image to attachments_gallery if provided
    let attachmentId = null;
    if (imageFile && confirmationId) {
      try {
        const uploadResult = await uploadQuestConfirmationImage(imageFile, title, confirmationId);
        if (uploadResult.success) {
          attachmentId = uploadResult.attachmentId;
          // Debug: Log image upload success (development only)
          if (import.meta.env.MODE !== 'production') {
            console.log('✅ Image uploaded and linked to quest confirmation');
          }

          // Note: In NocoDB one-to-one relationship with belongs-to side,
          // we only need to update the belongs-to side (attachments_gallery.quest_confirm)
          // The other side (quests_confirm.quest_img) will be automatically linked
          // Debug: Log one-to-one link (development only)
          if (import.meta.env.MODE !== 'production') {
            console.log('ℹ️ One-to-one link established from belongs-to side (attachments_gallery)');
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
      message: 'Quest confirmation saved',
      id: confirmationId,
      attachmentId: attachmentId,
      shouldAutoComplete: shouldAutoComplete, // Flag to indicate if quest should be auto-completed
      autoApproved: shouldAutoComplete,
      data: response
    };
  } catch (error) {
    console.error('❌ Error saving quest confirmation to NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Delete quest confirmation from NocoDB
 * Also deletes linked attachment from attachments_gallery
 * @param {string} confirmationId - Quest confirmation ID to delete
 * @returns {Promise<Object>} Result object with success status
 */
export const deleteQuestConfirmation = async (confirmationId) => {
  try {
    if (!confirmationId) {
      return { success: false, message: 'Quest confirmation ID is required' };
    }

    // Debug: Log quest confirmation deletion (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Deleting Quest Confirmation:', confirmationId);
    }

    // Step 1: Find and delete linked attachment from attachments_gallery
    try {
      const attachmentsData = await nocoRequest(
        `${TABLE_IDS.ATTACHMENTS_GALLERY}/records?where=(quests_confirm_id,eq,${confirmationId})`,
        { method: 'GET' }
      );

      if (attachmentsData.list && attachmentsData.list.length > 0) {
        const attachmentIds = attachmentsData.list.map(att => ({ Id: att.Id }));

        // Debug: Log linked quest attachments deletion (development only)
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
        // Debug: Log no linked attachments (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log('ℹ️ No linked attachments found for this confirmation');
        }
      }
    } catch (attachmentError) {
      console.warn('⚠️ Failed to delete linked attachments:', attachmentError.message);
      // Continue with confirmation deletion even if attachment deletion fails
    }

    // Step 2: Delete the quest confirmation record
    // Debug: Log quest confirmation record deletion (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🗑️ Deleting quest confirmation record');
    }

    const response = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records`, {
      method: 'DELETE',
      body: JSON.stringify([{ Id: confirmationId }])
    });

    // Debug: Log quest confirmation deletion success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Quest confirmation deleted successfully in NocoDB:', response);
    }
    return { success: true, message: 'Quest confirmation and linked attachments deleted' };
  } catch (error) {
    console.error('❌ Error deleting quest confirmation in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Upload image to attachments_gallery and link to achievement_confirm
 * @param {File} imageFile - Image file to upload
 * @param {string} title - Title for the attachment record
 * @param {string} achievementConfirmId - Achievement confirmation ID to link to
 * @returns {Promise<Object>} Result with attachment gallery ID
 */
