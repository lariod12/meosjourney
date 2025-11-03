import { useState, useEffect } from 'react';
import './AdminPage.css';
import PasswordModal from '../../components/PasswordModal/PasswordModal';
import DeleteConfirmModal from '../../components/DeleteConfirmModal/DeleteConfirmModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import IconPicker from '../../components/IconPicker/IconPicker';
import IconRenderer from '../../components/IconRenderer/IconRenderer';
import { fetchConfig, setAutoApproveTasks, saveAchievement, fetchAchievements, updateAchievement, deleteAchievement, saveQuest, fetchQuests, updateQuest, deleteQuest, fetchQuestConfirmations, deleteQuestConfirmation, deleteQuestConfirmationById, fetchAchievementConfirmations, deleteAchievementConfirmation, deleteAchievementConfirmationById, updateProfileXP, saveJournal, CHARACTER_ID } from '../../services/firestore';
import { sendAdminAchievementCreatedNotification, sendAdminQuestCreatedNotification, sendAdminQuestCompletedNotification, sendAdminAchievementCompletedNotification, sendLevelUpNotification } from '../../services/discord';
import { saveQuestCompletionJournal, saveAchievementCompletionJournal } from '../../utils/questJournalUtils';
import { deleteImageByUrl } from '../../services/storage';
import { clearCache } from '../../utils/cacheManager';

const SESSION_KEY = 'admin_meos05_access';

const AdminPage = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [correctPassword, setCorrectPassword] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('create-achievement');
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  const [formData, setFormData] = useState({
    name: '',
    nameVi: '',
    desc: '',
    descVi: '',
    icon: '',
    xp: '',
    specialReward: '',
    specialRewardVi: '',
    dueDate: ''
  });

  useEffect(() => {
    fetchConfig(CHARACTER_ID)
      .then(cfg => {
        setCorrectPassword(cfg?.pwDailyUpdate || null);
        setAutoApprove(!!cfg?.auto_approve_tasks);
      })
      .catch(() => setCorrectPassword(null));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.admin-dropdown')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'manage-achievements') {
        loadAchievements();
      } else if (activeTab === 'manage-quests') {
        loadQuests();
      }
    }
  }, [isAuthenticated, activeTab]);

  const loadAchievements = async () => {
    try {
      const [achievementsData, confirmationsData] = await Promise.all([
        fetchAchievements(CHARACTER_ID),
        fetchAchievementConfirmations(CHARACTER_ID)
      ]);
      setAchievements(achievementsData);
      setAchievementConfirmations(confirmationsData);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const loadQuests = async () => {
    try {
      const [questsData, confirmationsData] = await Promise.all([
        fetchQuests(CHARACTER_ID),
        fetchQuestConfirmations(CHARACTER_ID)
      ]);
      setQuests(questsData);
      setQuestConfirmations(confirmationsData);
    } catch (error) {
      console.error('Error loading quests:', error);
    }
  };

  // Refresh all data from database
  const handleRefresh = async () => {
    if (isRefreshing || isSubmitting) return;

    console.log('🔄 Refreshing admin data from database...');
    setIsRefreshing(true);

    try {
      if (activeTab === 'manage-achievements' || activeTab === 'create-achievement') {
        await loadAchievements();
      }

      if (activeTab === 'manage-quests' || activeTab === 'create-quest') {
        await loadQuests();
      }

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

  useEffect(() => {
    if (correctPassword === null) return;

    if (sessionStorage.getItem(SESSION_KEY) === 'granted') {
      setIsAuthenticated(true);
      return;
    }

    setShowPasswordModal(true);
  }, [correctPassword]);

  const handlePasswordSubmit = (password) => {
    if (password === correctPassword) {
      sessionStorage.setItem(SESSION_KEY, 'granted');
      setIsAuthenticated(true);
      setShowPasswordModal(false);
    } else {
      setShowPasswordModal(false);
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'Access Denied',
        message: 'Incorrect password. Please try again.',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          if (onBack) onBack();
        },
        onCancel: null
      });
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    if (onBack) onBack();
  };

  const handleToggleAutoApprove = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const next = !autoApprove;
      await setAutoApproveTasks(next, CHARACTER_ID);
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      const specialRewardEn = formData.specialReward.trim();
      const specialRewardVi = formData.specialRewardVi.trim();
      const hasSpecialReward = specialRewardEn.length > 0 || specialRewardVi.length > 0;
      const specialRewardTranslations = hasSpecialReward
        ? { en: specialRewardEn, vi: specialRewardVi }
        : null;

      const achievementData = {
        name: { en: formData.name.trim(), vi: formData.nameVi.trim() },
        desc: { en: formData.desc.trim(), vi: formData.descVi.trim() },
        icon: formData.icon.trim(),
        xp: Number(formData.xp) || 0,
        specialReward: specialRewardTranslations,
        dueDate: formData.dueDate || null
      };

      const result = await saveAchievement(achievementData, CHARACTER_ID);

      if (result.success) {
        await sendAdminAchievementCreatedNotification({ ...achievementData, id: result.id });
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
        name: { en: formData.name.trim(), vi: formData.nameVi.trim() },
        desc: { en: formData.desc.trim(), vi: formData.descVi.trim() },
        xp: Number(formData.xp)
      };

      const result = await saveQuest(questData, CHARACTER_ID);

      if (result.success) {
        await sendAdminQuestCreatedNotification({ ...questData, id: result.id });
        setConfirmModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Quest created successfully!',
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
      dueDate: ''
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

        if (conf?.imgUrl) {
          try {
            await deleteImageByUrl(conf.imgUrl);
          } catch (imgError) {
            console.warn('⚠️ Could not delete image:', imgError.message);
          }
        }

        if (conf) {
          try {
            await deleteQuestConfirmationById(conf.id, CHARACTER_ID);
          } catch (confError) {
            console.warn('⚠️ Could not delete confirmation:', confError.message);
          }
        }

        await deleteQuest(deleteTarget.id, CHARACTER_ID);

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

        if (conf?.imgUrl) {
          try {
            await deleteImageByUrl(conf.imgUrl);
          } catch (imgError) {
            console.warn('⚠️ Could not delete image:', imgError.message);
          }
        }

        if (conf) {
          try {
            await deleteAchievementConfirmationById(conf.id, CHARACTER_ID);
          } catch (confError) {
            console.warn('⚠️ Could not delete confirmation:', confError.message);
          }
        }

        await deleteAchievement(deleteTarget.id, CHARACTER_ID);

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

  // Helper function to get quest confirmation for a quest
  const getQuestConfirmation = (questName) => {
    // Sanitize quest name to match confirmation ID format
    const sanitizedName = questName.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    // Look for ANY confirmation that starts with the sanitized name (not just today's)
    return questConfirmations.find(c => c.id.startsWith(`${sanitizedName}_`));
  };

  // Get all confirmations for a quest (all dates)
  const getQuestConfirmations = (questName) => {
    const sanitizedName = questName.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    // Find all confirmations that start with the sanitized quest name
    return questConfirmations
      .filter(c => c.id.startsWith(`${sanitizedName}_`))
      .sort((a, b) => {
        // Sort by date (newest first) - extract date from ID
        const dateA = a.id.split('_').pop();
        const dateB = b.id.split('_').pop();
        return dateB.localeCompare(dateA);
      });
  };

  // Helper function to get achievement confirmation for an achievement
  const getAchievementConfirmation = (achievementName) => {
    // Sanitize achievement name to match confirmation ID format
    const sanitizedName = achievementName.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    // Look for ANY confirmation that starts with the sanitized name (not just today's)
    return achievementConfirmations.find(c => c.id.startsWith(`${sanitizedName}_`));
  };

  // Get all confirmations for an achievement (all dates)
  const getAchievementConfirmations = (achievementName) => {
    const sanitizedName = achievementName.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    // Find all confirmations that start with the sanitized achievement name
    return achievementConfirmations
      .filter(c => c.id.startsWith(`${sanitizedName}_`))
      .sort((a, b) => {
        // Sort by date (newest first) - extract date from ID
        const dateA = a.id.split('_').pop();
        const dateB = b.id.split('_').pop();
        return dateB.localeCompare(dateA);
      });
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
      const confirmation = getQuestConfirmation(quest.name);

      if (!confirmation) {
        throw new Error('Quest confirmation not found');
      }

      // Pass: Update quest completedAt and create journal entry
      // Keep image and confirmation for record
      await updateQuest(quest.id, {
        completedAt: new Date()
      }, CHARACTER_ID);

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
      clearCache();

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
      const confirmation = getQuestConfirmation(quest.name);

      if (!confirmation) {
        throw new Error('Quest confirmation not found');
      }

      // 1. Delete image from Storage if exists
      if (confirmation.imgUrl) {
        try {
          await deleteImageByUrl(confirmation.imgUrl);
          console.log('✅ Image deleted from Storage');
        } catch (imgError) {
          console.warn('⚠️ Could not delete image, continuing anyway:', imgError.message);
          // Continue even if image deletion fails
        }
      }

      // 2. Delete quest confirmation from Firestore using the actual confirmation ID
      await deleteQuestConfirmationById(confirmation.id, CHARACTER_ID);

      // Update local state immediately to remove confirmation and change button to Edit
      setQuestConfirmations(prevConfirmations => 
        prevConfirmations.filter(c => !c.id.startsWith(
          quest.name.trim()
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 50) + '_'
        ))
      );

      setConfirmModal({
        isOpen: true,
        type: 'success',
        title: 'Quest Rejected',
        message: `Quest confirmation for "${quest.name}" has been rejected and removed.`,
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
      const confirmation = getAchievementConfirmation(achievement.name);

      if (!confirmation) {
        throw new Error('Achievement confirmation not found');
      }

      // Pass: Update achievement completedAt and create journal entry
      // Keep image and confirmation for record
      await updateAchievement(achievement.id, {
        completedAt: new Date()
      }, CHARACTER_ID);

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
      clearCache();

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
      const confirmation = getAchievementConfirmation(achievement.name);

      if (!confirmation) {
        throw new Error('Achievement confirmation not found');
      }

      // 1. Delete image from Storage if exists
      if (confirmation.imgUrl) {
        try {
          console.log('🗑️ Deleting achievement confirmation image...');
          await deleteImageByUrl(confirmation.imgUrl);
          console.log('✅ Image deleted from Storage');
        } catch (imgError) {
          console.warn('⚠️ Could not delete image, continuing anyway:', imgError.message);
          // Continue even if image deletion fails
        }
      }

      // 2. Delete achievement confirmation from Firestore using the actual confirmation ID
      console.log('🗑️ Deleting achievement confirmation with ID:', confirmation.id);
      await deleteAchievementConfirmationById(confirmation.id, CHARACTER_ID);

      // Update local state immediately to remove confirmation and change button to Edit
      setAchievementConfirmations(prevConfirmations => 
        prevConfirmations.filter(c => !c.id.startsWith(
          achievement.name.trim()
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 50) + '_'
        ))
      );

      setConfirmModal({
        isOpen: true,
        type: 'success',
        title: 'Achievement Rejected',
        message: `Achievement confirmation for "${achievement.name}" has been rejected and removed.`,
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
      <header className="admin-header">
        <button onClick={onBack} className="back-link">◄ Back</button>
        <h1>⚙️ Admin - Meos05</h1>
        <button
          onClick={handleRefresh}
          className="refresh-button"
          disabled={isRefreshing || isSubmitting}
          title="Refresh data from database"
        >
          {isRefreshing ? '⟳' : '↻'}
        </button>
      </header>

      <div className="auto-approve-bar">
        <div className="auto-approve-toggle">
          <label className="switch">
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={handleToggleAutoApprove}
              disabled={isSubmitting}
            />
            <span className="slider" />
          </label>
          <span className="toggle-text">Auto approve tasks</span>
        </div>
      </div>

      <nav className="admin-dropdown">
        <button
          className="dropdown-toggle"
          onClick={() => {
            setDropdownOpen(!dropdownOpen);
          }}
        >
          <span className="dropdown-current">
            {activeTab === 'create-achievement' && '🏆 Create Achievement'}
            {activeTab === 'create-quest' && '📜 Create Quest'}
            {activeTab === 'manage-achievements' && '📋 Manage Achievements'}
            {activeTab === 'manage-quests' && '📝 Manage Quests'}
          </span>
          <span className="dropdown-arrow">{dropdownOpen ? '▲' : '▼'}</span>
        </button>

        {dropdownOpen && (
          <div className="dropdown-menu">
            <button
              className={`dropdown-item ${activeTab === 'create-achievement' ? 'active' : ''}`}
              onClick={() => {
                console.log('Switched to Create Achievement');
                setActiveTab('create-achievement');
                setDropdownOpen(false);
              }}
            >
              🏆 Create Achievement
            </button>
            <button
              className={`dropdown-item ${activeTab === 'create-quest' ? 'active' : ''}`}
              onClick={() => {
                console.log('Switched to Create Quest');
                setActiveTab('create-quest');
                setDropdownOpen(false);
              }}
            >
              📜 Create Quest
            </button>
            <button
              className={`dropdown-item ${activeTab === 'manage-achievements' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('manage-achievements');
                setDropdownOpen(false);
              }}
            >
              📋 Manage Achievements
            </button>
            <button
              className={`dropdown-item ${activeTab === 'manage-quests' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('manage-quests');
                setDropdownOpen(false);
              }}
            >
              📝 Manage Quests
            </button>
          </div>
        )}
      </nav>

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
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Quest'}
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
                const confirmation = getAchievementConfirmation(achievement.name);
                const hasConfirmation = !!confirmation;
                const isCompleted = achievement.completedAt !== null;
                const allConfirmations = getAchievementConfirmations(achievement.name);

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
                              <span>Status: {isCompleted ? '✅ Completed' : '⏳ Pending'}</span>
                              {achievement.createdAt && (
                                <span>Created: {new Date(achievement.createdAt.seconds * 1000).toLocaleDateString('vi-VN')}</span>
                              )}
                              {achievement.completedAt && (
                                <span>Completed: {new Date(achievement.completedAt.seconds * 1000).toLocaleDateString('vi-VN', {
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
                                  const datePart = conf.id.split('_').pop();
                                  const year = '20' + datePart.substring(0, 2);
                                  const month = datePart.substring(2, 4);
                                  const day = datePart.substring(4, 6);
                                  const dateStr = `${day}/${month}/${year}`;

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
                                      <div className="confirmation-header">
                                        <span className="confirmation-date">📅 {dateStr}</span>
                                        <span className="confirmation-id">{conf.id}</span>
                                      </div>
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
                                      {conf.imgUrl && (
                                        <div className="confirmation-image">
                                          <img src={conf.imgUrl} alt="Confirmation" />
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

                              {confirmation.imgUrl && (
                                <div className="form-group">
                                  <label>Attached Image:</label>
                                  <div className="confirmation-image-container">
                                    <img
                                      src={confirmation.imgUrl}
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
                              {achievement.dueDate && <span>Due: {achievement.dueDate}</span>}
                              <span>Status: {achievement.completedAt !== null ? '✅ Completed' : (hasConfirmation ? '⏳ Pending' : '⏳ Pending')}</span>
                              {hasConfirmation && confirmation?.createdAt && (
                                <span className="submission-date">
                                  📅 Submitted: {new Date(confirmation.createdAt.seconds * 1000).toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                              {achievement.completedAt && (
                                <span>Completed: {new Date(achievement.completedAt.seconds * 1000).toLocaleDateString('vi-VN', {
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
                  // Get confirmation status for both quests
                  const aConfirmation = getQuestConfirmation(a.name);
                  const bConfirmation = getQuestConfirmation(b.name);
                  const aHasReview = !!aConfirmation && !a.completedAt;
                  const bHasReview = !!bConfirmation && !b.completedAt;
                  
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
                const confirmation = getQuestConfirmation(quest.name);
                const hasConfirmation = !!confirmation;
                const isCompleted = quest.completedAt !== null;
                const allConfirmations = getQuestConfirmations(quest.name);

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
                              <span>Status: {isCompleted ? '✅ Completed' : '⏳ Pending'}</span>
                              {quest.createdAt && (
                                <span>Created: {new Date(quest.createdAt.seconds * 1000).toLocaleDateString('vi-VN')}</span>
                              )}
                              {quest.completedAt && (
                                <span>Completed: {new Date(quest.completedAt.seconds * 1000).toLocaleDateString('vi-VN', {
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
                                  const datePart = conf.id.split('_').pop();
                                  const year = '20' + datePart.substring(0, 2);
                                  const month = datePart.substring(2, 4);
                                  const day = datePart.substring(4, 6);
                                  const dateStr = `${day}/${month}/${year}`;

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
                                      <div className="confirmation-header">
                                        <span className="confirmation-date">📅 {dateStr}</span>
                                        <span className="confirmation-id">{conf.id}</span>
                                      </div>
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
                                      {conf.imgUrl && (
                                        <div className="confirmation-image">
                                          <img src={conf.imgUrl} alt="Confirmation" />
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
                              <span>Status: {quest.completedAt !== null ? '✅ Completed' : (hasConfirmation ? '⏳ Pending' : '⏳ Pending')}</span>
                              {hasConfirmation && confirmation?.createdAt && (
                                <span className="submission-date">
                                  📅 Submitted: {new Date(confirmation.createdAt.seconds * 1000).toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                              {quest.completedAt && (
                                <span>Completed: {new Date(quest.completedAt.seconds * 1000).toLocaleDateString('vi-VN', {
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
