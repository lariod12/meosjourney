import { useState, useEffect } from 'react';
import './AdminAchievementsPage.css';
import PasswordModal from '../../components/PasswordModal/PasswordModal';
import DeleteConfirmModal from '../../components/DeleteConfirmModal/DeleteConfirmModal';
import { fetchConfig, saveAchievement, fetchAchievements, updateAchievement, deleteAchievement, saveQuest, fetchQuests, updateQuest, deleteQuest, CHARACTER_ID } from '../../services/firestore';

const SESSION_KEY = 'admin_meos05_access';

const AdminAchievementsPage = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [correctPassword, setCorrectPassword] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('create-achievement');
  const [achievements, setAchievements] = useState([]);
  const [quests, setQuests] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ id: null, name: '', type: '' });

  const [formData, setFormData] = useState({
    name: '',
    desc: '',
    icon: '',
    xp: '',
    specialReward: '',
    dueDate: '',
    // Quest fields
    title: ''
  });

  useEffect(() => {
    fetchConfig(CHARACTER_ID)
      .then(cfg => setCorrectPassword(cfg?.pwDailyUpdate || null))
      .catch(() => setCorrectPassword(null));
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
      const data = await fetchAchievements(CHARACTER_ID);
      setAchievements(data);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const loadQuests = async () => {
    try {
      const data = await fetchQuests(CHARACTER_ID);
      setQuests(data);
    } catch (error) {
      console.error('Error loading quests:', error);
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
      alert('❌ Incorrect password. Access denied.');
      setShowPasswordModal(false);
      if (onBack) onBack();
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    if (onBack) onBack();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (activeTab === 'create-achievement') {
        // Validate: must have either xp or specialReward
        const hasXP = formData.xp && Number(formData.xp) > 0;
        const hasSpecialReward = formData.specialReward.trim().length > 0;

        if (!hasXP && !hasSpecialReward) {
          alert('❌ Must provide either XP Reward or Special Reward');
          return;
        }

        const achievementData = {
          name: formData.name.trim(),
          desc: formData.desc.trim(),
          icon: formData.icon.trim(),
          xp: Number(formData.xp) || 0,
          specialReward: formData.specialReward.trim(),
          dueDate: formData.dueDate || null
        };

        const result = await saveAchievement(achievementData, CHARACTER_ID);

        if (result.success) {
          alert('✓ Achievement created successfully!');
          handleReset();
          if (activeTab === 'manage-achievements') {
            loadAchievements();
          }
        }
      } else if (activeTab === 'create-quest') {
        // Validate quest
        if (!formData.title.trim()) {
          alert('❌ Quest title is required');
          return;
        }

        if (!formData.xp || Number(formData.xp) <= 0) {
          alert('❌ XP reward must be greater than 0');
          return;
        }

        const questData = {
          title: formData.title.trim(),
          xp: Number(formData.xp)
        };

        const result = await saveQuest(questData, CHARACTER_ID);

        if (result.success) {
          alert('✓ Quest created successfully!');
          handleReset();
          if (activeTab === 'manage-quests') {
            loadQuests();
          }
        }
      }
    } catch (error) {
      console.error('❌ Error creating:', error);
      alert('✕ Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      desc: '',
      icon: '',
      xp: '',
      specialReward: '',
      dueDate: '',
      title: ''
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
    const hasXP = formData.xp && Number(formData.xp) > 0;
    const hasSpecialReward = formData.specialReward.trim().length > 0;

    if (!hasXP && !hasSpecialReward) {
      alert('❌ Must provide either XP Reward or Special Reward');
      return;
    }

    setIsSubmitting(true);

    try {
      const achievementData = {
        name: formData.name.trim(),
        desc: formData.desc.trim(),
        icon: formData.icon.trim(),
        xp: Number(formData.xp) || 0,
        specialReward: formData.specialReward.trim(),
        dueDate: formData.dueDate || null
      };

      await updateAchievement(achievementId, achievementData, CHARACTER_ID);
      alert('✓ Achievement updated successfully!');
      setEditingId(null);
      handleReset();
      loadAchievements();
    } catch (error) {
      console.error('❌ Error updating achievement:', error);
      alert('✕ Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateQuest = async (questId) => {
    if (!formData.title.trim()) {
      alert('❌ Quest title is required');
      return;
    }

    if (!formData.xp || Number(formData.xp) <= 0) {
      alert('❌ XP reward must be greater than 0');
      return;
    }

    setIsSubmitting(true);

    try {
      const questData = {
        title: formData.title.trim(),
        xp: Number(formData.xp)
      };

      await updateQuest(questId, questData, CHARACTER_ID);
      alert('✓ Quest updated successfully!');
      setEditingId(null);
      handleReset();
      loadQuests();
    } catch (error) {
      console.error('❌ Error updating quest:', error);
      alert('✕ Error: ' + error.message);
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
        await deleteQuest(deleteTarget.id, CHARACTER_ID);
        alert('✓ Quest deleted successfully!');
        loadQuests();
      } else {
        await deleteAchievement(deleteTarget.id, CHARACTER_ID);
        alert('✓ Achievement deleted successfully!');
        loadAchievements();
      }
    } catch (error) {
      console.error('❌ Error deleting:', error);
      alert('✕ Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
      setDeleteTarget({ id: null, name: '', type: '' });
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteTarget({ id: null, name: '', type: '' });
  };





  return (
    <div className="admin-container">
      <header className="admin-header">
        <button onClick={onBack} className="back-link">◄ Back</button>
        <h1>⚙️ Admin - Meos05</h1>
      </header>

      <nav className="admin-tabs">
        <button
          className={`tab ${activeTab === 'create-achievement' ? 'active' : ''}`}
          onClick={() => {
            console.log('Switched to Create Achievement tab');
            setActiveTab('create-achievement');
          }}
        >
          🏆 Create Achievement
        </button>
        <button
          className={`tab ${activeTab === 'create-quest' ? 'active' : ''}`}
          onClick={() => {
            console.log('Switched to Create Quest tab');
            setActiveTab('create-quest');
          }}
        >
          ⚔️ Create Quest
        </button>
        <button
          className={`tab ${activeTab === 'manage-achievements' ? 'active' : ''}`}
          onClick={() => {
            console.log('Switched to Manage Achievements tab');
            setActiveTab('manage-achievements');
          }}
        >
          📋 Manage Achievements
        </button>
        <button
          className={`tab ${activeTab === 'manage-quests' ? 'active' : ''}`}
          onClick={() => {
            console.log('Switched to Manage Quests tab');
            setActiveTab('manage-quests');
          }}
        >
          📝 Manage Quests
        </button>
      </nav>

      <main className="admin-form">{activeTab === 'create-achievement' ? (
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>▸ Create Achievement</h2>

            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., First Drawing"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="desc">Description *</label>
              <textarea
                id="desc"
                name="desc"
                rows="3"
                value={formData.desc}
                onChange={handleChange}
                placeholder="Describe the achievement..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="icon">Icon *</label>
              <input
                type="text"
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                placeholder="e.g., 🎨"
                required
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
              <label htmlFor="specialReward">Special Reward (required if no XP)</label>
              <input
                type="text"
                id="specialReward"
                name="specialReward"
                value={formData.specialReward}
                onChange={handleChange}
                placeholder="e.g., New badge"
              />
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
              <label htmlFor="title">Quest Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Complete 3 drawings today"
                required
              />
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
            <p className="empty-message">No achievements found</p>
          ) : (
            <div className="achievements-table">
              {achievements.map(achievement => {
                const isEditing = editingId === achievement.id;

                return (
                  <div key={achievement.id} className="achievement-row">
                    <div className="achievement-cell icon-cell">
                      <span className="achievement-icon">{achievement.icon}</span>
                    </div>

                    <div className="achievement-cell main-cell">
                      {isEditing ? (
                        <div className="achievement-edit-form">
                          <div className="form-group">
                            <label>Name *</label>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Description *</label>
                            <textarea
                              name="desc"
                              rows="3"
                              value={formData.desc}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Icon *</label>
                            <input
                              type="text"
                              name="icon"
                              value={formData.icon}
                              onChange={handleChange}
                              required
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
                            <input
                              type="text"
                              name="specialReward"
                              value={formData.specialReward}
                              onChange={handleChange}
                            />
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
                            </div>
                          </div>
                          <div className="achievement-status-cell">
                            <div className="achievement-buttons">
                              <button
                                onClick={() => {
                                  setEditingId(achievement.id);
                                  setFormData({
                                    name: achievement.name,
                                    desc: achievement.desc,
                                    icon: achievement.icon,
                                    xp: achievement.xp || '',
                                    specialReward: achievement.specialReward || '',
                                    dueDate: achievement.dueDate || ''
                                  });
                                }}
                                className="btn-edit"
                                disabled={isSubmitting}
                              >
                                ✎ Edit
                              </button>
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
            <p className="empty-message">No quests found</p>
          ) : (
            <div className="quests-table">
              {quests.map(quest => {
                const isEditing = editingId === quest.id;

                return (
                  <div key={quest.id} className="quest-row">
                    <div className="quest-cell icon-cell">
                      <span className="quest-icon">⚔️</span>
                    </div>

                    <div className="quest-cell main-cell">
                      {isEditing ? (
                        <div className="quest-edit-form">
                          <div className="form-group">
                            <label>Quest Title *</label>
                            <input
                              type="text"
                              name="title"
                              value={formData.title}
                              onChange={handleChange}
                              required
                            />
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
                            <h3>{quest.title}</h3>
                            <div className="quest-details">
                              <span>XP: {quest.xp}</span>
                              <span>Status: {quest.completed ? '✅ Completed' : '⏳ Pending'}</span>
                              {quest.completedAt && (
                                <span>Completed: {new Date(quest.completedAt.seconds * 1000).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="quest-status-cell">
                            <div className="quest-buttons">
                              <button
                                onClick={() => {
                                  setEditingId(quest.id);
                                  setFormData({
                                    ...formData,
                                    title: quest.title,
                                    xp: quest.xp || ''
                                  });
                                }}
                                className="btn-edit"
                                disabled={isSubmitting}
                              >
                                ✎ Edit
                              </button>
                              <button
                                onClick={() => handleDeleteClick(quest.id, quest.title, 'quest')}
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
    </div>
  );
};

export default AdminAchievementsPage;
