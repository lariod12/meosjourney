import { useState, useEffect } from 'react';
import './AdminPage.css';
import PasswordModal from '../../../components/PasswordModal/PasswordModal';
import DeleteConfirmModal from '../../../components/DeleteConfirmModal/DeleteConfirmModal';
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal';
import IconPicker from '../../../components/IconPicker/IconPicker';
import IconRenderer from '../../../components/IconRenderer/IconRenderer';
import { LoadingDialog } from '../../../components/common';
import AdminAutoApproveBar from './sections/AdminAutoApproveBar';
import AdminHeader from './sections/AdminHeader';
import AdminTabDropdown from './sections/AdminTabDropdown';

import { fetchConfig, fetchQuests, fetchQuestConfirmations, fetchAchievements, fetchAchievementConfirmations, createAchievement, createQuest, updateQuest, updateAchievement, deleteQuest, deleteAchievement, updateQuestConfirmationStatus, updateAchievementConfirmationStatus, unlinkQuestConfirmation, deleteQuestConfirmation, deleteAchievementConfirmation, updateAutoApproveTasks, clearNocoDBCache, updateProfileXP, saveJournal, CHARACTER_ID } from '../../../services/nocodb';
import { sendAdminAchievementCreatedNotification, sendAdminQuestCreatedNotification, sendAdminQuestCompletedNotification, sendAdminAchievementCompletedNotification, sendLevelUpNotification } from '../../../services/discord';
import { saveQuestCompletionJournal, saveAchievementCompletionJournal } from '../../../utils/questJournalUtils';
import { usePasswordGate } from '../../auth/hooks/usePasswordGate';
import { useAdminTabs } from '../hooks/useAdminTabs';

const SESSION_KEY = 'admin_meos05_access';

const AdminPage = ({ onBack }) => {
  const [correctPassword, setCorrectPassword] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataLoading, setDataLoading] = useState(false); // Loading state for data
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [quests, setQuests] = useState([]);
  const [questConfirmations, setQuestConfirmations] = useState([]);
  const [achievementConfirmations, setAchievementConfirmations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ id: null, name: '', type: '' });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null
  });

  const {
    isAuthenticated,
    showPasswordModal,
    handlePasswordSubmit,
    handlePasswordCancel
  } = usePasswordGate({
    correctPassword,
    sessionKey: SESSION_KEY,
    onBack,
    setConfirmModal,
    hidePromptOnFailure: true
  });

  const {
    activeTab,
    activeTabLabel,
    dropdownOpen,
    selectTab,
    toggleDropdown
  } = useAdminTabs('create-achievement');

  const [formData, setFormData] = useState({
    name: '',
    nameVi: '',
    desc: '',
    descVi: '',
    icon: '',
    xp: '',
    specialReward: '',
    specialRewardVi: '',
    dueDate: '',
    // Schedule fields for daily quest
    scheduleEnabled: false,
    scheduleTime: '08:00'
  });

  useEffect(() => {
    // Load config from NocoDB
    const loadConfig = async () => {
      try {
        const cfg = await fetchConfig();
        if (cfg) {
          setCorrectPassword(cfg.pwDailyUpdate || null);
          setAutoApprove(!!cfg.autoApproveTasks);
          console.log('✅ Admin config loaded from NocoDB');
        } else {
          setCorrectPassword(null);
          console.warn('⚠️ No config found in NocoDB');
        }
      } catch (error) {
        console.error('❌ Error loading config from NocoDB:', error);
        setCorrectPassword(null);
      }
    };
    
    loadConfig();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  const loadAllData = async () => {
    setDataLoading(true);
    
    try {
      console.log('📥 Loading all data from NocoDB...');
      // Load both quests and achievements in parallel
      await Promise.all([
        loadAchievements(),
        loadQuests()
      ]);
      console.log('✅ All admin data loaded');
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
    } finally {
      setDataLoading(false);
      setHasLoadedOnce(true);
    }
  };

  const loadAchievements = async () => {
    try {
      console.log('📥 Loading achievements from NocoDB...');
      const [achievementsData, confirmationsData] = await Promise.all([
        fetchAchievements(),
        fetchAchievementConfirmations()
      ]);
      
      // Map achievements with status based on confirmation and completion
      const achievementsWithStatus = achievementsData.map(achievement => {
        let status = 'pending';
        if (achievement.completedAt && achievement.hasConfirmation) {
          status = 'completed';
        } else if (achievement.hasConfirmation) {
          status = 'pending_review';
        }

        return {
          ...achievement,
          status
        };
      });

      setAchievements(achievementsWithStatus);
      setAchievementConfirmations(confirmationsData);
      console.log(`✅ Loaded ${achievementsWithStatus.length} achievements, ${confirmationsData.length} confirmations`);
    } catch (error) {
      console.error('❌ Error loading achievements:', error);
      setAchievements([]);
      setAchievementConfirmations([]);
    }
  };

  const loadQuests = async () => {
    try {
      console.log('📥 Loading quests from NocoDB...');
      const [questsData, confirmationsData] = await Promise.all([
        fetchQuests(),
        fetchQuestConfirmations()
      ]);
      
      setQuests(questsData);
      setQuestConfirmations(confirmationsData);
      console.log(`✅ Loaded ${questsData.length} quests, ${confirmationsData.length} confirmations`);
    } catch (error) {
      console.error('❌ Error loading quests:', error);
      setQuests([]);
      setQuestConfirmations([]);
    }
  };

  // Refresh all data from database
  const handleRefresh = async () => {
    if (isRefreshing || isSubmitting) return;

    console.log('🔄 Refreshing admin data from database...');
    setIsRefreshing(true);

    try {
      // Clear cache first to force fresh data
      clearNocoDBCache();

      // Reload all data (both quests and achievements)
      await Promise.all([
        loadAchievements(),
        loadQuests()
      ]);

      // Show success notification
      setConfirmModal({
        isOpen: true,
        type: 'success',
        title: 'Refreshed',
        message: 'Data updated successfully!',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        onCancel: null
      });

    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'Refresh Failed',
        message: `Failed to refresh data: ${error.message}`,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        onCancel: null
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper function to convert date
  const toDate = (dateValue) => {
    if (!dateValue) return null;
    
    // Already a Date object
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    // ISO string or other string format
    if (typeof dateValue === 'string') {
      return new Date(dateValue);
    }
    
    console.warn('Unknown date format:', dateValue);
    return null;
  };

  const handleToggleAutoApprove = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const next = !autoApprove;
      await updateAutoApproveTasks(next);
      setAutoApprove(next);
      setConfirmModal({
        isOpen: true,
        type: 'success',
        title: 'Config Updated',
        message: `Auto approve tasks is now ${next ? 'ON' : 'OFF'}.`,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
    } catch (e) {
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'Update Failed',
        message: e.message,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (activeTab === 'create-achievement') {
      const nameEn = formData.name.trim();
      const nameVi = formData.nameVi.trim();
      const descEn = formData.desc.trim();
      const descVi = formData.descVi.trim();

      if (!nameEn || !nameVi || !descEn || !descVi) {
        setConfirmModal({
          isOpen: true,
          type: 'warning',
          title: 'Validation Error',
          message: 'Please provide both English and Vietnamese names and descriptions.',
          confirmText: 'OK',
          cancelText: null,
          onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
          onCancel: null
        });
        return;
      }

      // Validate: must have either xp or specialReward
      const hasXP = formData.xp && Number(formData.xp) > 0;
      const specialRewardEn = formData.specialReward.trim();
      const specialRewardVi = formData.specialRewardVi.trim();
      const hasSpecialReward = specialRewardEn.length > 0 || specialRewardVi.length > 0;

      if (hasSpecialReward && (!specialRewardEn || !specialRewardVi)) {
        setConfirmModal({
          isOpen: true,
          type: 'warning',
          title: 'Validation Error',
          message: 'Please provide Special Reward in both English and Vietnamese.',
          confirmText: 'OK',
          cancelText: null,
          onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
          onCancel: null
        });
        return;
      }

      if (!hasXP && !hasSpecialReward) {
        setConfirmModal({
          isOpen: true,
          type: 'warning',
          title: 'Validation Error',
          message: 'Must provide either XP Reward or Special Reward',
          confirmText: 'OK',
          cancelText: null,
          onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
          onCancel: null
        });
        return;
      }

      // Show confirmation dialog
      setConfirmModal({
        isOpen: true,
        type: 'info',
        title: 'Confirm Creation',
        message: `Are you sure you want to create achievement "${nameEn}"?`,
        confirmText: 'Create',
        cancelText: 'Cancel',
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          handleCreateAchievement();
        },
        onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });

    } else if (activeTab === 'create-quest') {
      const nameEn = formData.name.trim();
      const nameVi = formData.nameVi.trim();
      const descEn = formData.desc.trim();
      const descVi = formData.descVi.trim();

      if (!nameEn || !nameVi) {
        setConfirmModal({
          isOpen: true,
          type: 'warning',
          title: 'Validation Error',
          message: 'Quest name is required in both English and Vietnamese.',
          confirmText: 'OK',
          cancelText: null,
          onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
          onCancel: null
        });
        return;
      }

      if (!descEn || !descVi) {
        setConfirmModal({
          isOpen: true,
          type: 'warning',
          title: 'Validation Error',
          message: 'Quest description is required in both English and Vietnamese.',
          confirmText: 'OK',
          cancelText: null,
          onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
          onCancel: null
        });
        return;
      }

      // Validate quest
      if (!nameEn) {
        setConfirmModal({
          isOpen: true,
          type: 'warning',
          title: 'Validation Error',
          message: 'Quest name is required',
          confirmText: 'OK',
          cancelText: null,
          onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
          onCancel: null
        });
        return;
      }

      if (!formData.xp || Number(formData.xp) <= 0) {
        setConfirmModal({
          isOpen: true,
          type: 'warning',
          title: 'Validation Error',
          message: 'XP reward must be greater than 0',
          confirmText: 'OK',
          cancelText: null,
          onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
          onCancel: null
        });
        return;
      }

      // Show confirmation dialog
      setConfirmModal({
        isOpen: true,
        type: 'info',
        title: 'Confirm Creation',
        message: `Are you sure you want to create quest "${nameEn}" with ${formData.xp} XP reward?`,
        confirmText: 'Create',
        cancelText: 'Cancel',
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          handleCreateQuest();
        },
        onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleCreateAchievement = async () => {
    setIsSubmitting(true);

    try {
      const achievementData = {
        nameEn: formData.name.trim(),
        nameVi: formData.nameVi.trim(),
        descEn: formData.desc.trim(),
        descVi: formData.descVi.trim(),
        icon: formData.icon.trim() || '🏆',
        xp: Number(formData.xp) || 0,
        specialRewardEn: formData.specialReward?.trim() || '',
        specialRewardVi: formData.specialRewardVi?.trim() || '',
        dueDate: formData.dueDate || null
      };

      console.log('🔍 Creating achievement with data:', achievementData);

      const result = await createAchievement(achievementData);

      if (result.success) {
        // Prepare data for Discord notification (using old format for compatibility)
        const notificationData = {
          name: { en: achievementData.nameEn, vi: achievementData.nameVi },
          desc: { en: achievementData.descEn, vi: achievementData.descVi },
          specialReward: { en: achievementData.specialRewardEn, vi: achievementData.specialRewardVi },
          icon: achievementData.icon,
          xp: achievementData.xp,
          id: result.data?.Id || result.data?.id
        };

        await sendAdminAchievementCreatedNotification(notificationData);

        setConfirmModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Achievement created successfully!',
          confirmText: 'OK',
          cancelText: null,
          onConfirm: () => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            handleReset();
            if (activeTab === 'manage-achievements') {
              loadAchievements();
            }
          },
          onCancel: null
        });
      } else {
        throw new Error(result.message || 'Failed to create achievement');
      }
    } catch (error) {
      console.error('❌ Error creating achievement:', error);
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Failed to create achievement: ${error.message}`,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        onCancel: null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateQuest = async () => {
    setIsSubmitting(true);

    try {
      const questData = {
        nameEn: formData.name.trim(),
        nameVi: formData.nameVi.trim(),
        descEn: formData.desc.trim(),
        descVi: formData.descVi.trim(),
        xp: Number(formData.xp) || 0,
        // Schedule fields
        scheduleEnabled: formData.scheduleEnabled,
        scheduleTime: formData.scheduleTime
      };

      console.log('🔍 Creating quest with data:', questData);

      const result = await createQuest(questData);

      if (result.success) {
        // Prepare data for Discord notification (using old format for compatibility)
        const notificationData = {
          name: { en: questData.nameEn, vi: questData.nameVi },
          desc: { en: questData.descEn, vi: questData.descVi },
          xp: questData.xp,
          id: result.data?.Id || result.data?.id,
          scheduleEnabled: questData.scheduleEnabled,
          scheduleTime: questData.scheduleTime
        };

        await sendAdminQuestCreatedNotification(notificationData);

        // Build success message based on schedule status
        const successMessage = questData.scheduleEnabled 
          ? `Quest created and scheduled daily at ${questData.scheduleTime} (ICT)!`
          : 'Quest created successfully!';

        setConfirmModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: successMessage,
          confirmText: 'OK',
          cancelText: null,
          onConfirm: () => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            handleReset();
            if (activeTab === 'manage-quests') {
              loadQuests();
            }
          },
          onCancel: null
        });
      } else {
        throw new Error(result.message || 'Failed to create quest');
      }
    } catch (error) {
      console.error('❌ Error creating quest:', error);
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Failed to create quest: ${error.message}`,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        onCancel: null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      nameVi: '',
      desc: '',
      descVi: '',
      icon: '',
      xp: '',
      specialReward: '',
      specialRewardVi: '',
      dueDate: '',
      // Reset schedule fields
      scheduleEnabled: false,
      scheduleTime: '08:00'
    });
  };

  if (showPasswordModal) {
    return (
      <PasswordModal
        onSubmit={handlePasswordSubmit}
        onCancel={handlePasswordCancel}
      />
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Show loading screen while data is being fetched
  if (!hasLoadedOnce && dataLoading) {
    return <LoadingDialog />;
  }

  const handleUpdate = async (achievementId) => {
    const nameEn = formData.name.trim();
    const nameVi = formData.nameVi.trim();
    const descEn = formData.desc.trim();
    const descVi = formData.descVi.trim();

    if (!nameEn || !nameVi || !descEn || !descVi) {
      setConfirmModal({
        isOpen: true,
        type: 'warning',
        title: 'Validation Error',
        message: 'Please provide both English and Vietnamese names and descriptions.',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        onCancel: null
      });
      return;
    }

    const hasXP = formData.xp && Number(formData.xp) > 0;
    const specialRewardEn = formData.specialReward.trim();
    const specialRewardVi = formData.specialRewardVi.trim();
    const hasSpecialReward = specialRewardEn.length > 0 || specialRewardVi.length > 0;

    if (hasSpecialReward && (!specialRewardEn || !specialRewardVi)) {
      setConfirmModal({
        isOpen: true,
        type: 'warning',
        title: 'Validation Error',
        message: 'Please provide Special Reward in both English and Vietnamese.',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        onCancel: null
      });
      return;
    }

    if (!hasXP && !hasSpecialReward) {
      setConfirmModal({
        isOpen: true,
        type: 'warning',
        title: 'Validation Error',
        message: 'Must provide either XP Reward or Special Reward',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        onCancel: null
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const specialRewardEnTrimmed = specialRewardEn;
      const specialRewardViTrimmed = specialRewardVi;
      const specialRewardTranslations = hasSpecialReward
        ? { en: specialRewardEnTrimmed, vi: specialRewardViTrimmed }
        : null;

      const achievementData = {
        name: { en: nameEn, vi: nameVi },
        desc: { en: descEn, vi: descVi },
        icon: formData.icon.trim(),
        xp: Number(formData.xp) || 0,
        specialReward: specialRewardTranslations,
        dueDate: formData.dueDate || null
      };

      const result = await updateAchievement(achievementId, achievementData, CHARACTER_ID);

      const successMessage = result.nameChanged
        ? 'Achievement updated successfully! Document ID changed due to name change.'
        : 'Achievement updated successfully!';

      setConfirmModal({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: successMessage,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          setEditingId(null);
          handleReset();
          loadAchievements();
        },
        onCancel: null
      });
    } catch (error) {
      console.error('❌ Error updating achievement:', error);
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Failed to update achievement: ${error.message}`,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        onCancel: null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateQuest = async (questId) => {
    const nameEn = formData.name.trim();
    const nameVi = formData.nameVi.trim();
    const descEn = formData.desc.trim();
    const descVi = formData.descVi.trim();

    if (!nameEn || !nameVi) {
      setConfirmModal({
        isOpen: true,
        type: 'warning',
        title: 'Validation Error',
        message: 'Quest name is required in both English and Vietnamese.',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        onCancel: null
      });
      return;
    }

    if (!descEn || !descVi) {
      setConfirmModal({
        isOpen: true,
        type: 'warning',
        title: 'Validation Error',
        message: 'Quest description is required in both English and Vietnamese.',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        onCancel: null
      });
      return;
    }

    if (!formData.xp || Number(formData.xp) <= 0) {
      setConfirmModal({
        isOpen: true,
        type: 'warning',
        title: 'Validation Error',
        message: 'XP reward must be greater than 0',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        onCancel: null
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const questData = {
        name: { en: nameEn, vi: nameVi },
        desc: { en: descEn, vi: descVi },
        xp: Number(formData.xp)
      };

      await updateQuest(questId, questData, CHARACTER_ID);
      setConfirmModal({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Quest updated successfully!',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          setEditingId(null);
          handleReset();
          loadQuests();
        },
        onCancel: null
      });
    } catch (error) {
      console.error('❌ Error updating quest:', error);
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Failed to update quest: ${error.message}`,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        onCancel: null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id, name, type = 'achievement') => {
    setDeleteTarget({ id, name, type });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    setShowDeleteModal(false);

    try {
      if (deleteTarget.type === 'quest') {
        const conf = questConfirmations.find(c => c.id === deleteTarget.id) || null;

        if (conf) {
          try {
            await deleteQuestConfirmation(conf.id);
          } catch (confError) {
            console.warn('⚠️ Could not delete confirmation:', confError.message);
          }
        }

        await deleteQuest(deleteTarget.id);

        setConfirmModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: `Quest deleted successfully! (${conf ? 1 : 0} confirmation removed)`,
          confirmText: 'OK',
          cancelText: null,
          onConfirm: () => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            loadQuests();
          },
          onCancel: null
        });
      } else {
        const conf = achievementConfirmations.find(c => c.id === deleteTarget.id) || null;

        if (conf) {
          try {
            await deleteAchievementConfirmation(conf.id);
          } catch (confError) {
            console.warn('⚠️ Could not delete confirmation:', confError.message);
          }
        }

        await deleteAchievement(deleteTarget.id);

        setConfirmModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: `Achievement deleted successfully! (${conf ? 1 : 0} confirmation removed)`,
          confirmText: 'OK',
          cancelText: null,
          onConfirm: () => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            loadAchievements();
          },
          onCancel: null
        });
      }
    } catch (error) {
      console.error('❌ Error deleting:', error);
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Failed to delete: ${error.message}`,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        onCancel: null
      });
    } finally {
      setIsSubmitting(false);
      setDeleteTarget({ id: null, name: '', type: '' });
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteTarget({ id: null, name: '', type: '' });
  };

  // Helper function to check if a daily quest is overdue (failed)
  // Daily quest chỉ có hạn trong ngày được tạo - same logic as UserPage
  const isQuestOverdue = (quest) => {
    if (!quest.createdAt) {
      return false;
    }

    // Get today's date at midnight (00:00:00) for accurate date comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const createdDate = new Date(quest.createdAt.seconds ? quest.createdAt.seconds * 1000 : quest.createdAt);
    createdDate.setHours(0, 0, 0, 0); // Reset to midnight for date-only comparison

    // If created before today, it's overdue
    return createdDate < today;
  };

  // Helper function to get quest confirmation for a quest
  // Get quest confirmation by quest ID (1-1 relationship in NocoDB)
  // Only returns confirmation if quest has questsConfirmId link
  const getQuestConfirmationByQuestId = (questId) => {
    // Find the quest to get its linked confirmation ID
    const quest = quests.find(q => q.id === questId);
    if (!quest) return null;
    
    // NocoDB: Only check by the linked confirmation ID from quest.questsConfirmId
    // If no link exists, return null (quest has no active confirmation)
    if (!quest.questsConfirmId) {
      return null;
    }
    
    return questConfirmations.find(c => c.id === quest.questsConfirmId) || null;
  };

  const getQuestConfirmation = (questName) => {
    // NocoDB: Match by quest name directly (case-insensitive)
    const normalizedQuestName = questName.trim().toLowerCase();
    return questConfirmations.find(c => 
      c.name && c.name.trim().toLowerCase() === normalizedQuestName
    );
  };

  // Get confirmation for a specific quest (1-1 relationship)
  const getQuestConfirmations = (questId) => {
    // NocoDB: Since it's 1-1 relationship, return array with single confirmation
    const confirmation = getQuestConfirmationByQuestId(questId);
    return confirmation ? [confirmation] : [];
  };

  // Get achievement confirmation by achievement ID (1-1 relationship in NocoDB)
  const getAchievementConfirmationByAchievementId = (achievementId) => {
    // NocoDB: Match by achievementsId field in confirmation record
    return achievementConfirmations.find(c => c.achievementsId === achievementId);
  };

  // Helper function to get achievement confirmation for an achievement
  const getAchievementConfirmation = (achievementName) => {
    // NocoDB: Match by achievement name directly (case-insensitive)
    const normalizedAchievementName = achievementName.trim().toLowerCase();
    return achievementConfirmations.find(c => 
      c.achievementName && c.achievementName.trim().toLowerCase() === normalizedAchievementName
    );
  };

  // Get confirmation for a specific achievement (1-1 relationship)
  const getAchievementConfirmations = (achievementId) => {
    // NocoDB: Since it's 1-1 relationship, return array with single confirmation
    const confirmation = getAchievementConfirmationByAchievementId(achievementId);
    return confirmation ? [confirmation] : [];
  };

  const handleReviewQuest = (quest) => {
    setReviewingId(quest.id);
    setEditingId(null);
    setViewingId(null);
  };

  const handleViewQuest = (quest) => {
    setViewingId(quest.id);
    setEditingId(null);
    setReviewingId(null);
  };

  const handleReviewAchievement = (achievement) => {
    setReviewingId(achievement.id);
    setEditingId(null);
    setViewingId(null);
  };

  const handleViewAchievement = (achievement) => {
    setViewingId(achievement.id);
    setEditingId(null);
    setReviewingId(null);
  };

  const handlePassQuestConfirmation = async (quest) => {
    setIsSubmitting(true);

    try {
      // Get confirmation by quest ID (checks quest_confirm link)
      const confirmation = getQuestConfirmationByQuestId(quest.id);

      if (!confirmation) {
        throw new Error('Quest confirmation not found');
      }

      // Pass: Update quest completedAt and create journal entry
      // Keep image and confirmation for record
      await updateQuest(quest.id, {
        completedAt: new Date()
      });

      // Update quest confirmation status to 'completed'
      if (confirmation?.id) {
        try {
          await updateQuestConfirmationStatus(confirmation.id, 'completed');
          console.log('✅ Quest confirmation status updated to completed');
        } catch (statusError) {
          console.warn('⚠️ Could not update quest confirmation status:', statusError.message);
          // Continue even if status update fails
        }
      }

      // Update profile XP
      let xpResult = null;
      try {
        xpResult = await updateProfileXP(quest.xp, CHARACTER_ID);
        console.log(`✅ Profile XP increased by ${quest.xp} for quest:`, quest.name);
      } catch (xpError) {
        console.warn('⚠️ Could not update profile XP:', xpError.message);
        // Continue even if XP update fails - quest is still marked as completed
      }

      // Create automatic journal entry for quest completion
      try {
        await saveQuestCompletionJournal({
          name: quest.name,
          desc: quest.desc,
          xp: quest.xp
        }, CHARACTER_ID);
        console.log('✅ Quest completion journal created for:', quest.name);
      } catch (journalError) {
        console.warn('⚠️ Could not create quest completion journal:', journalError.message);
        // Continue even if journal creation fails - quest is still marked as completed
      }

      // Save Level Up journal AFTER quest journal
      try {
        if (xpResult?.leveledUp) {
          const caption = `[Level Up] Level ${xpResult.oldLevel} → ${xpResult.newLevel}`;
          await saveJournal({ caption }, CHARACTER_ID);
        }
      } catch (e) {
        console.warn('⚠️ Could not create level up journal:', e?.message || e);
      }

      // Clear cache to force homepage refresh with new XP
      clearNocoDBCache();

      // Build success message with level up info if applicable
      let successMessage = `Quest "${quest.name}" has been marked as completed and added to journal!`;
      if (xpResult?.leveledUp) {
        successMessage += `\n\n🎉 LEVEL UP! You are now Level ${xpResult.newLevel}!`;
      }

      // Update local state immediately to change button from Edit to View
      setQuests(prevQuests => 
        prevQuests.map(q => 
          q.id === quest.id 
            ? { ...q, completedAt: new Date() }
            : q
        )
      );

      // Notify admin channel via Discord
      try {
        await sendAdminQuestCompletedNotification(
          { 
            name: quest.name, 
            nameTranslations: quest.nameTranslations,
            desc: quest.desc, 
            descTranslations: quest.descTranslations,
            xp: quest.xp 
          },
          { desc: confirmation?.desc || '', imgUrl: confirmation?.imgUrl || '' }
        );
      } catch (e) {
        console.warn('⚠️ Discord admin notification failed:', e);
      }

      // Ensure level-up notification comes AFTER quest completion message
      try {
        if (xpResult?.leveledUp) {
          await sendLevelUpNotification({ name: 'Admin' }, {
            oldLevel: xpResult.oldLevel,
            newLevel: xpResult.newLevel,
            newXP: xpResult.newXP,
            maxXP: xpResult.maxXP
          });
        }
      } catch (e) {
        console.warn('⚠️ Discord level-up notification failed:', e);
      }

      setConfirmModal({
        isOpen: true,
        type: 'success',
        title: 'Quest Passed',
        message: successMessage,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          setReviewingId(null);
          loadQuests(); // Still reload to ensure data consistency
        },
        onCancel: null
      });
    } catch (error) {
      console.error('❌ Error passing quest:', error);
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Failed to pass quest: ${error.message}`,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        onCancel: null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectQuestConfirmation = async (quest) => {
    setIsSubmitting(true);

    try {
      // Get confirmation by quest ID (checks quest_confirm link)
      const confirmation = getQuestConfirmationByQuestId(quest.id);

      if (!confirmation) {
        throw new Error('Quest confirmation not found');
      }

      // Simply delete the quest confirmation record
      // This will automatically unlink it from the quest
      const result = await deleteQuestConfirmation(confirmation.id);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete quest confirmation');
      }

      console.log('✅ Quest confirmation deleted');

      // Update local state immediately for instant UI update
      setQuestConfirmations(prevConfirmations => 
        prevConfirmations.filter(c => c.id !== confirmation.id)
      );

      setQuests(prevQuests => 
        prevQuests.map(q => 
          q.id === quest.id 
            ? { ...q, questsConfirmId: null }
            : q
        )
      );

      // Close review modal immediately after state update
      setReviewingId(null);

      // Show success message
      setConfirmModal({
        isOpen: true,
        type: 'success',
        title: 'Quest Rejected',
        message: `Quest confirmation for "${quest.name}" has been rejected and deleted.`,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        },
        onCancel: null
      });
    } catch (error) {
      console.error('❌ Error rejecting quest:', error);
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Failed to reject quest: ${error.message}`,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        onCancel: null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePassAchievementConfirmation = async (achievement) => {
    setIsSubmitting(true);

    try {
      // Get confirmation by achievement ID (checks achievement_confirm link)
      const confirmation = getAchievementConfirmationByAchievementId(achievement.id);

      if (!confirmation) {
        throw new Error('Achievement confirmation not found');
      }

      // Pass: Update achievement completedAt and create journal entry
      // Keep image and confirmation for record
      await updateAchievement(achievement.id, {
        completedAt: new Date()
      });

      // Update achievement confirmation status to 'completed'
      if (confirmation?.id) {
        try {
          await updateAchievementConfirmationStatus(confirmation.id, 'completed');
          console.log('✅ Achievement confirmation status updated to completed');
        } catch (statusError) {
          console.warn('⚠️ Could not update achievement confirmation status:', statusError.message);
          // Continue even if status update fails
        }
      }

      // Update profile XP
      let xpResult = null;
      try {
        xpResult = await updateProfileXP(achievement.xp, CHARACTER_ID);
        console.log(`✅ Profile XP increased by ${achievement.xp} for achievement:`, achievement.name);
      } catch (xpError) {
        console.warn('⚠️ Could not update profile XP:', xpError.message);
        // Continue even if XP update fails - achievement is still marked as completed
      }

      // Create automatic journal entry for achievement completion
      try {
        await saveAchievementCompletionJournal({
          name: achievement.name,
          desc: achievement.desc,
          xp: achievement.xp,
          specialReward: achievement.specialReward
        }, CHARACTER_ID);
        console.log('✅ Achievement completion journal created for:', achievement.name);
      } catch (journalError) {
        console.warn('⚠️ Could not create achievement completion journal:', journalError.message);
        // Continue even if journal creation fails - achievement is still marked as completed
      }

      // Save Level Up journal AFTER achievement journal
      try {
        if (xpResult?.leveledUp) {
          const caption = `[Level Up] Level ${xpResult.oldLevel} → ${xpResult.newLevel}`;
          await saveJournal({ caption }, CHARACTER_ID);
        }
      } catch (e) {
        console.warn('⚠️ Could not create level up journal:', e?.message || e);
      }

      // Clear cache to force homepage refresh with new XP
      clearNocoDBCache();

      // Build success message with level up info if applicable
      let successMessage = `Achievement "${achievement.name}" has been marked as completed and added to journal!`;
      if (xpResult?.leveledUp) {
        successMessage += `\n\n🎉 LEVEL UP! You are now Level ${xpResult.newLevel}!`;
      }

      // Update local state immediately to change button from Edit to View
      setAchievements(prevAchievements => 
        prevAchievements.map(a => 
          a.id === achievement.id 
            ? { ...a, completedAt: new Date() }
            : a
        )
      );

      // Notify admin channel via Discord
      try {
        await sendAdminAchievementCompletedNotification(
          { 
            name: achievement.name, 
            nameTranslations: achievement.nameTranslations,
            desc: achievement.desc, 
            descTranslations: achievement.descTranslations,
            xp: achievement.xp, 
            specialReward: achievement.specialReward,
            specialRewardTranslations: achievement.specialRewardTranslations
          },
          { desc: confirmation?.desc || '', imgUrl: confirmation?.imgUrl || '' }
        );
      } catch (e) {
        console.warn('⚠️ Discord admin notification failed:', e);
      }

      // Ensure level-up notification comes AFTER achievement completion message
      try {
        if (xpResult?.leveledUp) {
          await sendLevelUpNotification({ name: 'Admin' }, {
            oldLevel: xpResult.oldLevel,
            newLevel: xpResult.newLevel,
            newXP: xpResult.newXP,
            maxXP: xpResult.maxXP
          });
        }
      } catch (e) {
        console.warn('⚠️ Discord level-up notification failed:', e);
      }

      setConfirmModal({
        isOpen: true,
        type: 'success',
        title: 'Achievement Passed',
        message: successMessage,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          setReviewingId(null);
          loadAchievements(); // Still reload to ensure data consistency
        },
        onCancel: null
      });
    } catch (error) {
      console.error('❌ Error passing achievement:', error);
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Failed to pass achievement: ${error.message}`,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        onCancel: null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectAchievementConfirmation = async (achievement) => {
    setIsSubmitting(true);

    try {
      // Get confirmation by achievement ID (checks achievement_confirm link)
      const confirmation = getAchievementConfirmationByAchievementId(achievement.id);

      if (!confirmation) {
        throw new Error('Achievement confirmation not found');
      }

      // Simply delete the achievement confirmation record
      // This will automatically delete linked attachments from attachments_gallery
      const result = await deleteAchievementConfirmation(confirmation.id);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete achievement confirmation');
      }

      console.log('✅ Achievement confirmation deleted');

      // Update local state immediately for instant UI update
      setAchievementConfirmations(prevConfirmations => 
        prevConfirmations.filter(c => c.id !== confirmation.id)
      );

      setAchievements(prevAchievements => 
        prevAchievements.map(a => 
          a.id === achievement.id 
            ? { ...a, achievementConfirmId: null, hasConfirmation: false }
            : a
        )
      );

      // Close review modal immediately after state update
      setReviewingId(null);

      // Show success message
      setConfirmModal({
        isOpen: true,
        type: 'success',
        title: 'Achievement Rejected',
        message: `Achievement confirmation for "${achievement.name}" has been rejected and deleted.`,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        },
        onCancel: null
      });
    } catch (error) {
      console.error('❌ Error rejecting achievement:', error);
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Failed to reject achievement: ${error.message}`,
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        onCancel: null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-container">
      <AdminHeader
        onBack={onBack}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        isSubmitting={isSubmitting}
      />

      <AdminAutoApproveBar
        autoApprove={autoApprove}
        onToggle={handleToggleAutoApprove}
        disabled={isSubmitting}
      />

      <AdminTabDropdown
        activeTab={activeTab}
        activeTabLabel={activeTabLabel}
        dropdownOpen={dropdownOpen}
        onToggle={toggleDropdown}
        onSelect={selectTab}
      />

      <main className="admin-form">{activeTab === 'create-achievement' ? (
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>▸ Create Achievement</h2>

            <div className="form-group">
              <label>Achievement Name *</label>
              <div className="bilingual-field">
                <div className="language-field">
                  <span className="language-tag">English</span>
                  <input
                    type="text"
                    id="achievement-name-en"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., First Drawing"
                    required
                  />
                </div>
                <div className="language-field">
                  <span className="language-tag">Tiếng Việt</span>
                  <input
                    type="text"
                    id="achievement-name-vi"
                    name="nameVi"
                    value={formData.nameVi}
                    onChange={handleChange}
                    placeholder="ví dụ: Bức vẽ đầu tiên"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Achievement Description *</label>
              <div className="bilingual-field">
                <div className="language-field">
                  <span className="language-tag">English</span>
                  <textarea
                    id="achievement-desc-en"
                    name="desc"
                    rows="3"
                    value={formData.desc}
                    onChange={handleChange}
                    placeholder="Describe the achievement..."
                    required
                  />
                </div>
                <div className="language-field">
                  <span className="language-tag">Tiếng Việt</span>
                  <textarea
                    id="achievement-desc-vi"
                    name="descVi"
                    rows="3"
                    value={formData.descVi}
                    onChange={handleChange}
                    placeholder="Mô tả thành tựu..."
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="icon">Icon *</label>
              <IconPicker
                value={formData.icon}
                onChange={handleChange}
                placeholder="Search icons... (e.g., trophy, star, medal)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="xp">XP Reward (required if no Special Reward)</label>
              <input
                type="number"
                id="xp"
                name="xp"
                value={formData.xp}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Special Reward (required if no XP)</label>
              <div className="bilingual-field">
                <div className="language-field">
                  <span className="language-tag">English</span>
                  <input
                    type="text"
                    id="specialReward-en"
                    name="specialReward"
                    value={formData.specialReward}
                    onChange={handleChange}
                    placeholder="e.g., New badge"
                  />
                </div>
                <div className="language-field">
                  <span className="language-tag">Tiếng Việt</span>
                  <input
                    type="text"
                    id="specialReward-vi"
                    name="specialRewardVi"
                    value={formData.specialRewardVi}
                    onChange={handleChange}
                    placeholder="ví dụ: Huy hiệu mới"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Achievement'}
            </button>
            <button type="button" onClick={handleReset} className="btn-secondary" disabled={isSubmitting}>
              ✕ Reset
            </button>
          </div>
        </form>
      ) : activeTab === 'create-quest' ? (
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>▸ Create Daily Quest</h2>

            <div className="form-group">
              <label>Quest Name *</label>
              <div className="bilingual-field">
                <div className="language-field">
                  <span className="language-tag">English</span>
                  <input
                    type="text"
                    id="quest-name-en"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Complete 3 drawings today"
                    required
                  />
                </div>
                <div className="language-field">
                  <span className="language-tag">Tiếng Việt</span>
                  <input
                    type="text"
                    id="quest-name-vi"
                    name="nameVi"
                    value={formData.nameVi}
                    onChange={handleChange}
                    placeholder="ví dụ: Hoàn thành 3 bức vẽ hôm nay"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Quest Description *</label>
              <div className="bilingual-field">
                <div className="language-field">
                  <span className="language-tag">English</span>
                  <textarea
                    id="quest-desc-en"
                    name="desc"
                    rows="3"
                    value={formData.desc}
                    onChange={handleChange}
                    placeholder="Describe the quest..."
                    required
                  />
                </div>
                <div className="language-field">
                  <span className="language-tag">Tiếng Việt</span>
                  <textarea
                    id="quest-desc-vi"
                    name="descVi"
                    rows="3"
                    value={formData.descVi}
                    onChange={handleChange}
                    placeholder="Mô tả nhiệm vụ..."
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="xp">XP Reward *</label>
              <input
                type="number"
                id="xp"
                name="xp"
                value={formData.xp}
                onChange={handleChange}
                min="1"
                placeholder="e.g., 50"
                required
              />
            </div>

            {/* Schedule Section */}
            <div className="admin-schedule-section">
              <div className="admin-schedule-header">
                <label className="admin-schedule-toggle">
                  <span className="admin-schedule-label">Daily Schedule</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="scheduleEnabled"
                      checked={formData.scheduleEnabled}
                      onChange={handleChange}
                    />
                    <span className="slider"></span>
                  </label>
                </label>
              </div>
              
              {formData.scheduleEnabled && (
                <div className="admin-schedule-options">
                  <div className="admin-schedule-time-group">
                    <label htmlFor="scheduleTime">Send quest daily at:</label>
                    <input
                      type="time"
                      id="scheduleTime"
                      name="scheduleTime"
                      value={formData.scheduleTime}
                      onChange={handleChange}
                      className="admin-schedule-time-input"
                    />
                    <span className="admin-schedule-timezone">(ICT - UTC+7)</span>
                  </div>
                  <p className="admin-schedule-note">
                    This quest will be automatically sent every day at the specified time.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : (formData.scheduleEnabled ? 'Create & Schedule Quest' : 'Create Quest')}
            </button>
            <button type="button" onClick={handleReset} className="btn-secondary" disabled={isSubmitting}>
              ✕ Reset
            </button>
          </div>
        </form>
      ) : activeTab === 'manage-achievements' ? (
        <div className="achievements-list">
          <h2>▸ Manage Achievements</h2>
          {achievements.length === 0 ? (
            <p className="admin-empty-message">No achievements found</p>
          ) : (
            <div className="achievements-table">
              {achievements
                .sort((a, b) => {
                  // Get confirmation status for both achievements
                  const aConfirmation = getAchievementConfirmation(a.name);
                  const bConfirmation = getAchievementConfirmation(b.name);
                  const aHasReview = !!aConfirmation && !a.completedAt;
                  const bHasReview = !!bConfirmation && !b.completedAt;
                  
                  // Items with Review status go to top
                  if (aHasReview && !bHasReview) return -1;
                  if (!aHasReview && bHasReview) return 1;
                  
                  // Otherwise maintain original order
                  return 0;
                })
                .map(achievement => {
                const isEditing = editingId === achievement.id;
                const isReviewing = reviewingId === achievement.id;
                const isViewing = viewingId === achievement.id;
                // Use achievementConfirmId to check if has confirmation (more reliable than name matching)
                const hasConfirmation = achievement.achievementConfirmId !== null && achievement.achievementConfirmId !== undefined;
                const confirmation = hasConfirmation ? getAchievementConfirmationByAchievementId(achievement.id) : null;
                const isCompleted = achievement.completedAt !== null;
                const allConfirmations = getAchievementConfirmations(achievement.id); // Use achievement.id for 1-1 relationship
                
                // Debug log
                console.log('🔍 Achievement row:', {
                  id: achievement.id,
                  name: achievement.name,
                  completedAt: achievement.completedAt,
                  isCompleted,
                  hasConfirmation,
                  achievementConfirmId: achievement.achievementConfirmId,
                  confirmation
                });

                return (
                  <div key={achievement.id} className="achievement-row">
                    <div className="achievement-cell icon-cell">
                      <span className="achievement-icon">
                        <IconRenderer iconName={achievement.icon} size={32} />
                      </span>
                    </div>

                    <div className="achievement-cell main-cell">
                      {isViewing ? (
                        <div className="quest-view-history">
                          <h3 className="view-title">📖 Achievement History</h3>

                          {/* Achievement Info */}
                          <div className="view-quest-info">
                            <h4>{achievement.name}</h4>
                            {achievement.desc && <p className="quest-desc">{achievement.desc}</p>}
                            <div className="quest-details">
                              {achievement.xp > 0 && <span>XP: {achievement.xp}</span>}
                              {achievement.specialReward && <span>Reward: {achievement.specialReward}</span>}
                              <span>Status: {
                                isCompleted && hasConfirmation 
                                  ? '✅ Completed' 
                                  : hasConfirmation 
                                    ? '⏳ Pending Review' 
                                    : '⏳ Pending'
                              }</span>
                              {achievement.createdAt && (
                                <span>Created: {toDate(achievement.createdAt).toLocaleDateString('vi-VN')}</span>
                              )}
                              {achievement.completedAt && (
                                <span>Completed: {toDate(achievement.completedAt).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                              )}
                            </div>
                          </div>

                          {/* Confirmations History */}
                          <div className="view-confirmations">
                            <h4 className="confirmations-title">Submission History ({allConfirmations.length})</h4>
                            {allConfirmations.length === 0 ? (
                              <p className="no-confirmations">No submissions yet</p>
                            ) : (
                              <div className="confirmations-list">
                                {allConfirmations.map((conf, index) => {
                                  // Extract date from ID (format: name_YYMMDD)
                                  let dateStr = 'Unknown Date';
                                  if (conf.createdAt) {
                                    try {
                                      const createdDate = conf.createdAt.toDate ? conf.createdAt.toDate() : new Date(conf.createdAt);
                                      const day = String(createdDate.getDate()).padStart(2, '0');
                                      const month = String(createdDate.getMonth() + 1).padStart(2, '0');
                                      const year = createdDate.getFullYear();
                                      dateStr = `${day}/${month}/${year}`;
                                    } catch (e) { console.error('Error parsing date:', e); }
                                  }

                                  // Format createdAt timestamp
                                  let createdAtStr = '';
                                  if (conf.createdAt) {
                                    try {
                                      const createdDate = conf.createdAt.toDate ?
                                        conf.createdAt.toDate() :
                                        new Date(conf.createdAt);
                                      createdAtStr = createdDate.toLocaleString('vi-VN', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      });
                                    } catch (e) {
                                      console.error('Error parsing createdAt:', e);
                                    }
                                  }

                                  return (
                                    <div key={conf.id} className="confirmation-item">
                                      {createdAtStr && (
                                        <div className="confirmation-created">
                                          <span className="created-label">Submitted at:</span>
                                          <span className="created-time">{createdAtStr}</span>
                                        </div>
                                      )}
                                      {conf.desc && (
                                        <div className="confirmation-desc">
                                          <strong>Description:</strong>
                                          <p>{conf.desc}</p>
                                        </div>
                                      )}
                                      {conf.imageUrl && (
                                        <div className="confirmation-image">
                                          <img src={conf.imageUrl} alt="Confirmation" />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="view-actions">
                            <button
                              onClick={() => setViewingId(null)}
                              className="btn-secondary"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      ) : isReviewing ? (
                        <div className="quest-review-form">
                          <h3 className="review-title">📋 Review Achievement Confirmation</h3>
                          <div className="review-quest-info">
                            <h4>{achievement.name}</h4>
                            {achievement.desc && <p className="quest-desc">{achievement.desc}</p>}
                            {achievement.xp > 0 && <span className="quest-xp-badge">+{achievement.xp} XP</span>}
                            {achievement.specialReward && <span className="quest-xp-badge">🎁 {achievement.specialReward}</span>}
                          </div>

                          {confirmation && (
                            <div className="review-confirmation-content">
                              <div className="form-group">
                                <label>User Description:</label>
                                <p className="confirmation-desc">{confirmation.desc || 'No description provided'}</p>
                              </div>

                              {confirmation.imageUrl && (
                                <div className="form-group">
                                  <label>Attached Image:</label>
                                  <div className="confirmation-image-container">
                                    <img
                                      src={confirmation.imageUrl}
                                      alt="Achievement confirmation"
                                      className="confirmation-image"
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="review-actions">
                                <button
                                  onClick={() => handlePassAchievementConfirmation(achievement)}
                                  className="btn-pass"
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? 'Processing...' : '✓ Pass'}
                                </button>
                                <button
                                  onClick={() => handleRejectAchievementConfirmation(achievement)}
                                  className="btn-reject"
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? 'Processing...' : '✗ Reject'}
                                </button>
                                <button
                                  onClick={() => setReviewingId(null)}
                                  className="btn-secondary"
                                  disabled={isSubmitting}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : isEditing ? (
                        <div className="achievement-edit-form">
                          <div className="form-group">
                            <label>Achievement Name *</label>
                            <div className="bilingual-field">
                              <div className="language-field">
                                <span className="language-tag">English</span>
                                <input
                                  type="text"
                                  name="name"
                                  value={formData.name}
                                  onChange={handleChange}
                                  required
                                />
                              </div>
                              <div className="language-field">
                                <span className="language-tag">Tiếng Việt</span>
                                <input
                                  type="text"
                                  name="nameVi"
                                  value={formData.nameVi}
                                  onChange={handleChange}
                                  required
                                />
                              </div>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Achievement Description *</label>
                            <div className="bilingual-field">
                              <div className="language-field">
                                <span className="language-tag">English</span>
                                <textarea
                                  name="desc"
                                  rows="3"
                                  value={formData.desc}
                                  onChange={handleChange}
                                  required
                                />
                              </div>
                              <div className="language-field">
                                <span className="language-tag">Tiếng Việt</span>
                                <textarea
                                  name="descVi"
                                  rows="3"
                                  value={formData.descVi}
                                  onChange={handleChange}
                                  required
                                />
                              </div>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Icon *</label>
                            <IconPicker
                              value={formData.icon}
                              onChange={handleChange}
                              placeholder="Search icons..."
                            />
                          </div>
                          <div className="form-group">
                            <label>XP Reward</label>
                            <input
                              type="number"
                              name="xp"
                              value={formData.xp}
                              onChange={handleChange}
                              min="0"
                            />
                          </div>
                          <div className="form-group">
                            <label>Special Reward</label>
                            <div className="bilingual-field">
                              <div className="language-field">
                                <span className="language-tag">English</span>
                                <input
                                  type="text"
                                  name="specialReward"
                                  value={formData.specialReward}
                                  onChange={handleChange}
                                />
                              </div>
                              <div className="language-field">
                                <span className="language-tag">Tiếng Việt</span>
                                <input
                                  type="text"
                                  name="specialRewardVi"
                                  value={formData.specialRewardVi}
                                  onChange={handleChange}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Due Date</label>
                            <input
                              type="date"
                              name="dueDate"
                              value={formData.dueDate}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="achievement-actions">
                            <button
                              onClick={() => handleUpdate(achievement.id)}
                              className="btn-primary"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Updating...' : 'Update'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                handleReset();
                              }}
                              className="btn-secondary"
                              disabled={isSubmitting}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="achievement-view-row">
                          <div className="achievement-info">
                            <h3>{achievement.name}</h3>
                            <p className="achievement-desc">{achievement.desc}</p>
                            <div className="achievement-details">
                              {achievement.xp > 0 && <span>XP: {achievement.xp}</span>}
                              {achievement.specialReward && <span>Reward: {achievement.specialReward}</span>}
                              {achievement.dueDate && (
                                <span>Due: {new Date(achievement.dueDate).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                              )}
                              <span>Status: {
                                achievement.completedAt && hasConfirmation 
                                  ? '✅ Completed' 
                                  : hasConfirmation 
                                    ? '⏳ Pending Review' 
                                    : '⏳ Pending'
                              }</span>
                              {hasConfirmation && confirmation?.createdAt && (
                                <span className="submission-date">
                                  📅 Submitted: {toDate(confirmation.createdAt).toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                              {achievement.completedAt && (
                                <span>Completed: {toDate(achievement.completedAt).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                              )}
                            </div>
                          </div>
                          <div className="achievement-status-cell">
                            <div className="achievement-buttons">
                              {/* Show Review button if has confirmation and not completed */}
                              {hasConfirmation && !isCompleted && (
                                <button
                                  onClick={() => handleReviewAchievement(achievement)}
                                  className="btn-review"
                                  disabled={isSubmitting}
                                >
                                  ◆ Review
                                </button>
                              )}

                              {/* Show View button if completed OR no confirmation (default state) */}
                              {(isCompleted || !hasConfirmation) && (
                                <button
                                  onClick={() => handleViewAchievement(achievement)}
                                  className="btn-view"
                                  disabled={isSubmitting}
                                >
                                  📖 View
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteClick(achievement.id, achievement.name)}
                                className="btn-delete"
                                disabled={isSubmitting}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'manage-quests' ? (
        <div className="quests-list">
          <h2>▸ Manage Daily Quests</h2>
          {quests.length === 0 ? (
            <p className="admin-empty-message">No quests found</p>
          ) : (
            <div className="quests-table">
              {quests
                .sort((a, b) => {
                  // Get confirmation status for both quests using quest ID (checks quest_confirm link)
                  const aConfirmation = getQuestConfirmationByQuestId(a.id);
                  const bConfirmation = getQuestConfirmationByQuestId(b.id);
                  // Only show review if confirmation exists, not completed, and not failed
                  const aHasReview = !!aConfirmation && !a.completedAt && aConfirmation.status !== 'failed';
                  const bHasReview = !!bConfirmation && !b.completedAt && bConfirmation.status !== 'failed';
                  
                  // Items with Review status go to top
                  if (aHasReview && !bHasReview) return -1;
                  if (!aHasReview && bHasReview) return 1;
                  
                  // Otherwise maintain original order
                  return 0;
                })
                .map(quest => {
                const isEditing = editingId === quest.id;
                const isReviewing = reviewingId === quest.id;
                const isViewing = viewingId === quest.id;
                // Get confirmation by quest ID (checks quest_confirm link in quest table)
                const confirmation = getQuestConfirmationByQuestId(quest.id);
                // Only consider as having confirmation if linked and status is not 'failed'
                const hasConfirmation = !!confirmation && confirmation.status !== 'failed';
                const isCompleted = quest.completedAt !== null;
                const isFailed = !isCompleted && isQuestOverdue(quest); // Check if quest is overdue and not completed
                const allConfirmations = getQuestConfirmations(quest.id); // Use quest.id for 1-1 relationship

                return (
                  <div key={quest.id} className="quest-row">
                    <div className="quest-cell icon-cell">
                      <span className="quest-icon">⚔️</span>
                    </div>

                    <div className="quest-cell main-cell">
                      {isViewing ? (
                        <div className="quest-view-history">
                          <h3 className="view-title">📖 Quest History</h3>

                          {/* Quest Info */}
                          <div className="view-quest-info">
                            <h4>{quest.name}</h4>
                            {quest.desc && <p className="quest-desc">{quest.desc}</p>}
                            <div className="quest-details">
                              <span>XP: {quest.xp}</span>
                              <span>Status: {
                                isCompleted 
                                  ? '✅ Completed' 
                                  : isFailed 
                                    ? '❌ Failed' 
                                    : '⏳ Pending'
                              }</span>
                              {quest.createdAt && (
                                <span>Created: {toDate(quest.createdAt).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                              )}
                              {quest.completedAt && (
                                <span>Completed: {toDate(quest.completedAt).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                              )}
                            </div>
                          </div>

                          {/* Confirmations History */}
                          <div className="view-confirmations">
                            <h4 className="confirmations-title">Submission History ({allConfirmations.length})</h4>
                            {allConfirmations.length === 0 ? (
                              <p className="no-confirmations">No submissions yet</p>
                            ) : (
                              <div className="confirmations-list">
                                {allConfirmations.map((conf, index) => {
                                  // Extract date from ID (format: name_YYMMDD)
                                  let dateStr = 'Unknown Date';
                                  if (conf.createdAt) {
                                    try {
                                      const createdDate = conf.createdAt.toDate ? conf.createdAt.toDate() : new Date(conf.createdAt);
                                      const day = String(createdDate.getDate()).padStart(2, '0');
                                      const month = String(createdDate.getMonth() + 1).padStart(2, '0');
                                      const year = createdDate.getFullYear();
                                      dateStr = `${day}/${month}/${year}`;
                                    } catch (e) { console.error('Error parsing date:', e); }
                                  }

                                  // Format createdAt timestamp
                                  let createdAtStr = '';
                                  if (conf.createdAt) {
                                    try {
                                      const createdDate = conf.createdAt.toDate ?
                                        conf.createdAt.toDate() :
                                        new Date(conf.createdAt);
                                      createdAtStr = createdDate.toLocaleString('vi-VN', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      });
                                    } catch (e) {
                                      console.error('Error parsing createdAt:', e);
                                    }
                                  }

                                  return (
                                    <div key={conf.id} className="confirmation-item">
                                      {createdAtStr && (
                                        <div className="confirmation-created">
                                          <span className="created-label">Submitted at:</span>
                                          <span className="created-time">{createdAtStr}</span>
                                        </div>
                                      )}
                                      {conf.desc && (
                                        <div className="confirmation-desc">
                                          <strong>Description:</strong>
                                          <p>{conf.desc}</p>
                                        </div>
                                      )}
                                      {conf.imageUrl && (
                                        <div className="confirmation-image">
                                          <img src={conf.imageUrl} alt="Confirmation" />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="view-actions">
                            <button
                              onClick={() => setViewingId(null)}
                              className="btn-secondary"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      ) : isReviewing ? (
                        <div className="quest-review-form">
                          <h3 className="review-title">📋 Review Quest Confirmation</h3>
                          <div className="review-quest-info">
                            <h4>{quest.name}</h4>
                            {quest.desc && <p className="quest-desc">{quest.desc}</p>}
                            <span className="quest-xp-badge">+{quest.xp} XP</span>
                          </div>

                          {confirmation && (
                            <div className="review-confirmation-content">
                              <div className="form-group">
                                <label>User Description:</label>
                                <p className="confirmation-desc">{confirmation.desc || 'No description provided'}</p>
                              </div>

                              {confirmation.imgUrl && (
                                <div className="form-group">
                                  <label>Attached Image:</label>
                                  <div className="confirmation-image-container">
                                    <img
                                      src={confirmation.imgUrl}
                                      alt="Quest confirmation"
                                      className="confirmation-image"
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="review-actions">
                                <button
                                  onClick={() => handlePassQuestConfirmation(quest)}
                                  className="btn-pass"
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? 'Processing...' : '✓ Pass'}
                                </button>
                                <button
                                  onClick={() => handleRejectQuestConfirmation(quest)}
                                  className="btn-reject"
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? 'Processing...' : '✗ Reject'}
                                </button>
                                <button
                                  onClick={() => setReviewingId(null)}
                                  className="btn-secondary"
                                  disabled={isSubmitting}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : isEditing ? (
                        <div className="quest-edit-form">
                          <div className="form-group">
                            <label>Quest Name *</label>
                            <div className="bilingual-field">
                              <div className="language-field">
                                <span className="language-tag">English</span>
                                <input
                                  type="text"
                                  name="name"
                                  value={formData.name}
                                  onChange={handleChange}
                                  required
                                />
                              </div>
                              <div className="language-field">
                                <span className="language-tag">Tiếng Việt</span>
                                <input
                                  type="text"
                                  name="nameVi"
                                  value={formData.nameVi}
                                  onChange={handleChange}
                                  required
                                />
                              </div>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Quest Description *</label>
                            <div className="bilingual-field">
                              <div className="language-field">
                                <span className="language-tag">English</span>
                                <textarea
                                  name="desc"
                                  rows="3"
                                  value={formData.desc}
                                  onChange={handleChange}
                                  required
                                />
                              </div>
                              <div className="language-field">
                                <span className="language-tag">Tiếng Việt</span>
                                <textarea
                                  name="descVi"
                                  rows="3"
                                  value={formData.descVi}
                                  onChange={handleChange}
                                  required
                                />
                              </div>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>XP Reward *</label>
                            <input
                              type="number"
                              name="xp"
                              value={formData.xp}
                              onChange={handleChange}
                              min="1"
                              required
                            />
                          </div>
                          <div className="quest-actions">
                            <button
                              onClick={() => handleUpdateQuest(quest.id)}
                              className="btn-primary"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Updating...' : 'Update'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                handleReset();
                              }}
                              className="btn-secondary"
                              disabled={isSubmitting}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="quest-view-row">
                          <div className="quest-info">
                            <h3>{quest.name}</h3>
                            {quest.desc && <p className="quest-desc">{quest.desc}</p>}
                            <div className="quest-details">
                              <span>XP: {quest.xp}</span>
                              <span>Status: {
                                isCompleted 
                                  ? '✅ Completed' 
                                  : isFailed 
                                    ? '❌ Failed' 
                                    : hasConfirmation 
                                      ? '⏳ Pending Review' 
                                      : '⏳ Pending'
                              }</span>
                              {quest.createdAt && (
                                <span>Created: {toDate(quest.createdAt).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}</span>
                              )}
                              {hasConfirmation && confirmation?.createdAt && (
                                <span className="submission-date">
                                  📅 Submitted: {toDate(confirmation.createdAt).toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                              {quest.completedAt && (
                                <span>Completed: {toDate(quest.completedAt).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                              )}
                            </div>
                          </div>
                          <div className="quest-status-cell">
                            <div className="quest-buttons">
                              {/* Show Review button if has confirmation and not completed */}
                              {hasConfirmation && !isCompleted && (
                                <button
                                  onClick={() => handleReviewQuest(quest)}
                                  className="btn-review"
                                  disabled={isSubmitting}
                                >
                                  ◆ Review
                                </button>
                              )}

                              {/* Show View button if completed OR no confirmation (default state) */}
                              {(isCompleted || !hasConfirmation) && (
                                <button
                                  onClick={() => handleViewQuest(quest)}
                                  className="btn-view"
                                  disabled={isSubmitting}
                                >
                                  📖 View
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteClick(quest.id, quest.name, 'quest')}
                                className="btn-delete"
                                disabled={isSubmitting}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
      </main>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        achievementName={deleteTarget.name}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel || (() => setConfirmModal(prev => ({ ...prev, isOpen: false })))}
      />
    </div>
  );
};

export default AdminPage;



