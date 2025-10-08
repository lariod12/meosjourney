// ========================================
// RPG CHARACTER SHEET - JAVASCRIPT
// Dynamic Content & Interactions
// ========================================

// === CHARACTER DATA ===
const characterData = {
    name: "MÉO",
    title: "Forever Curious",
    level: 25,
    currentXP: 6500,
    maxXP: 10000,
    
    // Skills - grid items (no icons)
    skills: [
        { name: "Photoshop" },
        { name: "Illustrator" },
        { name: "Drawing" },
        { name: "Video Editing" },
        { name: "Animation" },
        { name: "Clip Studio Paint" },
        { name: "CapCut" },
        { name: "Motion Graphics" }
    ],

    // Interests/Hobbies (no icons)
    interests: [
        { name: "Gaming" },
        { name: "Music" },
        { name: "Reading" },
        { name: "Art" },
        { name: "Food" },
        { name: "Design" },
        { name: "Travel" }
    ],
    
    // Current Status
    status: {
        text: "Studying character design",
        location: "Home",
        mood: "Focused",
        timestamp: new Date()
    },

    // Character Introduce
    introduce: "A creative artist who brings imagination to life through drawing. Passionate about exploring the world, discovering new cultures, and savoring delicious food. Every sketch tells a story, every journey sparks inspiration, and every meal brings pure happiness.",

    // Daily Quests
    quests: [
        { id: 1, text: "Complete 3 coding challenges", completed: false, xp: 150 },
        { id: 2, text: "Review 5 pull requests", completed: true, xp: 100 },
        { id: 3, text: "Write documentation for new feature", completed: false, xp: 120 },
        { id: 4, text: "Learn a new algorithm", completed: false, xp: 200 },
        { id: 5, text: "Exercise for 30 minutes", completed: true, xp: 80 },
        { id: 6, text: "Read 1 chapter of tech book", completed: false, xp: 100 }
    ],
    
    // Daily Journal Entries
    journal: [
        {
            time: "07:00 AM",
            entry: "Woke up early feeling energized. Morning coffee and planning out today's tasks."
        },
        {
            time: "08:30 AM",
            entry: "Quest Completed: Exercise for 30 minutes (+80 XP)"
        },
        {
            time: "09:30 AM",
            entry: "Started working on coding challenges. Currently on challenge 1 of 3. Focus mode activated!"
        },
        {
            time: "11:00 AM",
            entry: "Quest Completed: Review 5 pull requests (+100 XP)"
        },
        {
            time: "12:30 PM",
            entry: "Lunch break! Tried a new recipe today. Cooking is just another form of creativity."
        },
        {
            time: "02:15 PM",
            entry: "Working on coding challenge #2. This one is tricky but I'm making progress. Learning a lot about optimization."
        },
        {
            time: "03:45 PM",
            entry: "Took a break to sketch some character designs. Playing around with different styles and expressions for inspiration."
        },
        {
            time: "05:00 PM",
            entry: "Started researching new algorithms for today's learning quest. Binary search trees are fascinating!"
        },
        {
            time: "06:30 PM",
            entry: "Attempted to write documentation for the new feature. Need more clarity on requirements before finishing this quest."
        },
        {
            time: "08:00 PM",
            entry: "Taking a breather with some gaming. Nothing beats unwinding after a productive day of coding and learning."
        },
        {
            time: "09:30 PM",
            entry: "Planning to finish that tech book chapter before bed. Almost done with today's reading goal!"
        }
    ],

    // Achievements - Bảng Thành Tựu
    achievements: [
        {
            id: 1,
            name: "First Steps",
            icon: "★",
            description: "Complete your first daily quest and begin your journey",
            specialReward: "Unlock 'Beginner' title",
            exp: 50,
            completed: true
        },
        {
            id: 2,
            name: "Code Master",
            icon: "⚛",
            description: "Successfully complete 100 coding challenges",
            specialReward: "Unlock 'Code Wizard' badge",
            exp: 200,
            completed: true
        },
        {
            id: 3,
            name: "Team Player",
            icon: "◆",
            description: "Review 50 pull requests and help your teammates grow",
            specialReward: "Unlock 'Mentor' role",
            exp: 150,
            completed: false
        },
        {
            id: 4,
            name: "Knowledge Seeker",
            icon: "✎",
            description: "Read 10 technical books from cover to cover",
            specialReward: "Unlock 'Scholar' title + Reading List feature",
            exp: 300,
            completed: true
        },
        {
            id: 5,
            name: "Health Warrior",
            icon: "⚔",
            description: "Exercise for 30 consecutive days without missing a day",
            exp: 250,
            completed: false
        },
        {
            id: 6,
            name: "Creative Mind",
            icon: "♪",
            description: "Create 20 unique character designs or artworks",
            specialReward: "Unlock 'Artist' badge + Gallery feature",
            exp: 180,
            completed: false
        },
        {
            id: 7,
            name: "Level Up",
            icon: "▲",
            description: "Reach Level 25 through dedication and hard work",
            specialReward: "Unlock 'Veteran' title + Special avatar frame",
            exp: 500,
            completed: false
        },
        {
            id: 8,
            name: "Night Owl",
            icon: "◐",
            description: "Complete 5 quests after midnight while the world sleeps",
            exp: 100,
            completed: false
        },
        {
            id: 9,
            name: "Early Bird",
            icon: "◑",
            description: "Complete 10 quests before 6 AM and start your day right",
            exp: 120,
            completed: true
        },
        {
            id: 10,
            name: "Perfectionist",
            icon: "◈",
            description: "Complete 20 quests with 100% accuracy and zero mistakes",
            specialReward: "Unlock 'Flawless' badge + Accuracy tracker",
            exp: 350,
            completed: false
        }
    ],

    // Historical Journal Data (Previous Days)
    history: [
        {
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
            entries: [
                { time: "07:30 AM", entry: "Morning run to start the day fresh. The weather was perfect!" },
                { time: "09:00 AM", entry: "Quest Completed: Complete 3 coding challenges (+150 XP)" },
                { time: "11:30 AM", entry: "Pair programming session with team member. Learned some cool new tricks!" },
                { time: "01:00 PM", entry: "Quest Completed: Write documentation for new feature (+120 XP)" },
                { time: "03:00 PM", entry: "Debugging session. Fixed a tricky bug that's been bothering me for days." },
                { time: "05:30 PM", entry: "Quest Completed: Learn a new algorithm (+200 XP)" },
                { time: "07:00 PM", entry: "Relaxing with some music and sketching." },
                { time: "09:00 PM", entry: "Quest Completed: Read 1 chapter of tech book (+100 XP)" }
            ]
        },
        {
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            entries: [
                { time: "08:00 AM", entry: "Started the day with meditation and planning." },
                { time: "10:00 AM", entry: "Quest Completed: Exercise for 30 minutes (+80 XP)" },
                { time: "12:00 PM", entry: "Working on UI designs for the new project. Loving the creative flow!" },
                { time: "02:30 PM", entry: "Quest Completed: Review 5 pull requests (+100 XP)" },
                { time: "04:00 PM", entry: "Attended a virtual tech conference. Great insights on modern web development." },
                { time: "06:00 PM", entry: "Experimented with new animation techniques in After Effects." },
                { time: "08:30 PM", entry: "Gaming night with friends. Teamwork makes the dream work!" }
            ]
        },
        {
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            entries: [
                { time: "07:00 AM", entry: "Early morning yoga session. Feeling centered and focused." },
                { time: "09:30 AM", entry: "Quest Completed: Complete 3 coding challenges (+150 XP)" },
                { time: "11:00 AM", entry: "Code review session. Providing feedback on team's work." },
                { time: "01:30 PM", entry: "Lunch with colleagues. Great conversations about upcoming projects." },
                { time: "03:00 PM", entry: "Quest Completed: Exercise for 30 minutes (+80 XP)" },
                { time: "05:00 PM", entry: "Working on character illustrations. Trying out new brush styles." },
                { time: "07:30 PM", entry: "Quest Completed: Read 1 chapter of tech book (+100 XP)" },
                { time: "09:00 PM", entry: "Watching tutorials on advanced JavaScript patterns." }
            ]
        },
        {
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
            entries: [
                { time: "08:00 AM", entry: "Morning coffee and goal setting for the day." },
                { time: "10:00 AM", entry: "Quest Completed: Review 5 pull requests (+100 XP)" },
                { time: "12:30 PM", entry: "Working on database optimization. Performance improvements are looking good!" },
                { time: "02:00 PM", entry: "Quest Completed: Write documentation for new feature (+120 XP)" },
                { time: "04:30 PM", entry: "Attended team standup. Everyone's making great progress." },
                { time: "06:00 PM", entry: "Sketching new character designs for personal project." },
                { time: "08:00 PM", entry: "Quest Completed: Learn a new algorithm (+200 XP)" },
                { time: "10:00 PM", entry: "Relaxing with some light reading before bed." }
            ]
        },
        {
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            entries: [
                { time: "07:30 AM", entry: "Quest Completed: Exercise for 30 minutes (+80 XP)" },
                { time: "09:00 AM", entry: "Sprint planning meeting. Exciting new features on the roadmap!" },
                { time: "11:30 AM", entry: "Quest Completed: Complete 3 coding challenges (+150 XP)" },
                { time: "01:00 PM", entry: "Working on responsive design improvements. Mobile-first approach!" },
                { time: "03:30 PM", entry: "Experimenting with new color palettes for the design system." },
                { time: "05:00 PM", entry: "Quest Completed: Review 5 pull requests (+100 XP)" },
                { time: "07:00 PM", entry: "Video editing session. Creating content for social media." },
                { time: "09:00 PM", entry: "Quest Completed: Read 1 chapter of tech book (+100 XP)" }
            ]
        },
        {
            date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
            entries: [
                { time: "08:00 AM", entry: "Morning routine: coffee, stretching, and planning the day." },
                { time: "10:30 AM", entry: "Quest Completed: Learn a new algorithm (+200 XP)" },
                { time: "12:00 PM", entry: "Working on API integration. Making good progress on the backend." },
                { time: "02:30 PM", entry: "Quest Completed: Write documentation for new feature (+120 XP)" },
                { time: "04:00 PM", entry: "Design brainstorming session. So many creative ideas flowing!" },
                { time: "06:30 PM", entry: "Quest Completed: Exercise for 30 minutes (+80 XP)" },
                { time: "08:00 PM", entry: "Playing around with motion graphics. Loving the new effects!" },
                { time: "10:00 PM", entry: "Wrapped up the day reviewing tomorrow's tasks." }
            ]
        }
    ]
};

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 RPG Character Sheet Initialized!');

    // Load avatar first
    loadAvatar();

    // Populate all sections
    populateCharacterInfo();
    populateSkills();
    populateInterests();
    populateStatus();
    populateIntroduce();
    populateQuests();
    populateJournal();
    populateHistory();
    populateAchievements();

    // Update XP bar animation
    animateXPBar();

    // REMOVED: setupQuestInteractions() - Quest list is now read-only
});

// === AVATAR LOADER ===

async function loadAvatar() {
    const avatarImg = document.getElementById('characterAvatar');
    const defaultAvatar = "https://api.dicebear.com/7.x/pixel-art/svg?seed=RPGCharacter&backgroundColor=ffffff&size=300";

    try {
        // Try to load avatar.png, avatar.jpg, or avatar.jpeg from ./public/avatars/
        const extensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
        let avatarFound = false;

        for (const ext of extensions) {
            try {
                const response = await fetch(`./public/avatars/avatar.${ext}`);
                if (response.ok) {
                    avatarImg.src = `./public/avatars/avatar.${ext}`;
                    avatarFound = true;
                    console.log(`✅ Avatar loaded: avatar.${ext}`);
                    break;
                }
            } catch (err) {
                // Continue to next extension
            }
        }

        if (!avatarFound) {
            // Use default template avatar
            avatarImg.src = defaultAvatar;
            console.log('ℹ️ No custom avatar found, using template avatar');
        }
    } catch (error) {
        // Fallback to default template
        avatarImg.src = defaultAvatar;
        console.log('ℹ️ Using template avatar');
    }
}

// === POPULATE FUNCTIONS ===

function populateCharacterInfo() {
    document.getElementById('characterName').textContent = characterData.name;
    document.getElementById('characterTitle').textContent = characterData.title;
    document.getElementById('levelLabel').textContent = `LEVEL ${characterData.level}`;

    // Update XP
    const xpPercentage = (characterData.currentXP / characterData.maxXP) * 100;
    document.getElementById('xpFill').style.width = xpPercentage + '%';
    document.getElementById('xpText').textContent =
        `${characterData.currentXP.toLocaleString()} / ${characterData.maxXP.toLocaleString()} XP`;
}

function populateSkills() {
    const container = document.getElementById('skillsContainer');
    container.innerHTML = '';

    characterData.skills.forEach(skill => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = skill.name;
        container.appendChild(tag);
    });
}

function populateInterests() {
    const container = document.getElementById('interestsContainer');
    container.innerHTML = '';

    characterData.interests.forEach(interest => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = interest.name;
        container.appendChild(tag);
    });
}

function populateStatus() {
    document.getElementById('currentStatus').textContent = characterData.status.text;
    document.getElementById('currentLocation').textContent = characterData.status.location;
    document.getElementById('currentMood').textContent = characterData.status.mood;
    updateStatusTime();
}

function populateIntroduce() {
    document.getElementById('characterIntroduce').textContent = characterData.introduce;
}

function updateStatusTime() {
    const now = new Date();
    const diff = now - characterData.status.timestamp;
    const minutes = Math.floor(diff / 60000);

    let timeText;
    if (minutes < 1) {
        timeText = 'Just now';
    } else if (minutes < 60) {
        timeText = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
        const hours = Math.floor(minutes / 60);
        timeText = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    document.getElementById('statusTime').textContent = `Updated: ${timeText}`;
}

function populateQuests() {
    const container = document.getElementById('questsContainer');
    container.innerHTML = '';

    characterData.quests.forEach(quest => {
        const questDiv = document.createElement('div');
        questDiv.className = `quest-item ${quest.completed ? 'completed' : ''}`;
        // Loại bỏ dataset.questId vì không cần tương tác nữa
        // Loại bỏ checkbox, chỉ hiển thị text (read-only)
        questDiv.innerHTML = `
            <div class="quest-text">${quest.text}</div>
            <div class="quest-xp">+${quest.xp} XP</div>
        `;
        container.appendChild(questDiv);
    });

    updateQuestProgress();
}

function populateJournal() {
    const dateDiv = document.getElementById('journalDate');
    const contentDiv = document.getElementById('journalContent');

    // Set current date (always uses current day, in English)
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDiv.textContent = today.toLocaleDateString('en-US', options);

    // Populate journal entries
    contentDiv.innerHTML = '';
    characterData.journal.forEach(entry => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'journal-entry';
        entryDiv.innerHTML = `
            <div class="journal-time">${entry.time}</div>
            <div class="journal-text">${entry.entry}</div>
        `;
        contentDiv.appendChild(entryDiv);
    });
}

function populateHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    characterData.history.forEach((day, index) => {
        // Create history item container
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        // Create date header - clickable
        const dateHeader = document.createElement('div');
        dateHeader.className = 'history-date-header';

        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateText = day.date.toLocaleDateString('en-US', dateOptions);

        dateHeader.innerHTML = `
            <span class="history-date-text">${dateText}</span>
            <span class="history-arrow">▼</span>
        `;

        // Create entries wrapper - hidden by default
        const entriesWrapper = document.createElement('div');
        entriesWrapper.className = 'history-entries-wrapper';

        day.entries.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'journal-entry';
            entryDiv.innerHTML = `
                <div class="journal-time">${entry.time}</div>
                <div class="journal-text">${entry.entry}</div>
            `;
            entriesWrapper.appendChild(entryDiv);
        });

        // Add click event to toggle content
        dateHeader.addEventListener('click', function() {
            const isExpanded = historyItem.classList.contains('expanded');

            // Close all other items
            document.querySelectorAll('.history-item').forEach(item => {
                item.classList.remove('expanded');
                const arrow = item.querySelector('.history-arrow');
                if (arrow) arrow.textContent = '▼';
            });

            // Toggle current item
            if (!isExpanded) {
                historyItem.classList.add('expanded');
                dateHeader.querySelector('.history-arrow').textContent = '▲';
            }
        });

        // Append header and entries to item
        historyItem.appendChild(dateHeader);
        historyItem.appendChild(entriesWrapper);

        // Append item to list
        historyList.appendChild(historyItem);
    });
}

function populateAchievements() {
    const container = document.getElementById('achievementsContainer');
    if (!container) return;

    container.innerHTML = '';

    characterData.achievements.forEach(achievement => {
        const achievementItem = document.createElement('div');
        achievementItem.className = 'achievement-item';

        // Add completed class if achievement is completed
        if (achievement.completed) {
            achievementItem.classList.add('completed');
        }

        achievementItem.innerHTML = `
            ${achievement.completed ? '<div class="achievement-check">✓</div>' : ''}
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-name">${achievement.name}</div>
        `;

        // Add click event to show modal
        achievementItem.addEventListener('click', () => {
            showAchievementModal(achievement);
        });

        container.appendChild(achievementItem);
    });
}

// === ACHIEVEMENT MODAL ===
function showAchievementModal(achievement) {
    const modal = document.getElementById('achievementModal');
    const modalStatus = document.getElementById('modalStatus');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalRewardsList = document.getElementById('modalRewardsList');

    // Populate modal content
    modalIcon.textContent = achievement.icon;
    modalTitle.textContent = achievement.name;
    modalDescription.textContent = achievement.description;

    // Build rewards list - 2 rows layout (Special Unlock on top / EXP on bottom)
    let rewardsHTML = '';

    if (achievement.specialReward) {
        // Two rows: Special Unlock (top) + EXP (bottom)
        rewardsHTML = `
            <div class="reward-special">${achievement.specialReward}</div>
            <div class="reward-exp">+${achievement.exp} EXP</div>
        `;
    } else {
        // Only EXP - centered
        rewardsHTML = `<div class="reward-exp-only">+${achievement.exp} EXP</div>`;
    }

    modalRewardsList.innerHTML = rewardsHTML;

    // Set status badge - only show if completed
    if (achievement.completed) {
        modalStatus.textContent = '✓ COMPLETED';
        modalStatus.className = 'achievement-modal-status completed';
        modalStatus.style.display = 'inline-block';
    } else {
        modalStatus.style.display = 'none';
    }

    // Show modal
    modal.classList.add('active');
}

function closeAchievementModal() {
    const modal = document.getElementById('achievementModal');
    modal.classList.remove('active');
}

// Setup modal close events
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('achievementModal');
    const closeBtn = document.getElementById('modalClose');

    // Close on X button click
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAchievementModal);
    }

    // Close on background click
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAchievementModal();
            }
        });
    }

    // Close on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAchievementModal();
        }
    });
});

// === QUEST INTERACTIONS ===
// LOẠI BỎ - Quest list chỉ để xem (read-only), không cho phép tương tác
// Hệ thống sẽ tự động cập nhật quest status

/* REMOVED - No longer needed for read-only quest list
function setupQuestInteractions() {
    const questItems = document.querySelectorAll('.quest-item');

    questItems.forEach(item => {
        item.addEventListener('click', function() {
            const questId = parseInt(this.dataset.questId);
            toggleQuest(questId);
        });
    });
}

function toggleQuest(questId) {
    const quest = characterData.quests.find(q => q.id === questId);
    if (quest) {
        quest.completed = !quest.completed;

        // Re-render quests
        populateQuests();
        setupQuestInteractions();

        // Add XP if quest completed
        if (quest.completed) {
            addXP(100);
            showNotification('Quest Completed! +100 XP');
        } else {
            removeXP(100);
        }
    }
}
*/

function updateQuestProgress() {
    const completed = characterData.quests.filter(q => q.completed).length;
    const total = characterData.quests.length;
    document.getElementById('questProgress').textContent = `${completed}/${total}`;
}

// === XP SYSTEM ===

function animateXPBar() {
    const xpFill = document.getElementById('xpFill');
    xpFill.style.transition = 'width 1s ease-out';
}

function addXP(amount) {
    characterData.currentXP += amount;
    
    // Check for level up
    if (characterData.currentXP >= characterData.maxXP) {
        levelUp();
    }
    
    updateXPDisplay();
}

function removeXP(amount) {
    characterData.currentXP = Math.max(0, characterData.currentXP - amount);
    updateXPDisplay();
}

function updateXPDisplay() {
    const xpPercentage = (characterData.currentXP / characterData.maxXP) * 100;
    document.getElementById('xpFill').style.width = xpPercentage + '%';
    document.getElementById('xpText').textContent = 
        `${characterData.currentXP.toLocaleString()} / ${characterData.maxXP.toLocaleString()} XP`;
}

function levelUp() {
    characterData.level++;
    characterData.currentXP = characterData.currentXP - characterData.maxXP;
    characterData.maxXP = Math.floor(characterData.maxXP * 1.5);

    document.getElementById('levelLabel').textContent = `LEVEL ${characterData.level}`;
    showNotification(`LEVEL UP! You are now Level ${characterData.level}!`);
}

// === NOTIFICATIONS ===

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: black;
        color: white;
        padding: 20px 30px;
        border: 3px solid white;
        font-family: 'Press Start 2P', cursive;
        font-size: 0.9rem;
        z-index: 9999;
        animation: slideInRight 0.5s ease-out;
        box-shadow: 5px 5px 0 rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease-out';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// === UTILITY FUNCTIONS ===
// (Removed updateLastUpdated - element doesn't exist in current HTML)

// === TOGGLE FUNCTIONS === (Removed - no longer needed for tag-based layout)

// === EASTER EGGS & ANIMATIONS ===

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Press 'L' to add 500 XP
    if (e.key === 'l' || e.key === 'L') {
        addXP(500);
        showNotification('Cheat Code Activated! +500 XP');
    }

    // REMOVED: 'R' shortcut - Quest list is now read-only, no manual reset
    /*
    if (e.key === 'r' || e.key === 'R') {
        characterData.quests.forEach(q => q.completed = false);
        populateQuests();
        showNotification('Daily Quests Reset!');
    }
    */
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('💡 Tip: Press "L" to gain XP, "R" to reset quests!');

// === TAB SWITCHING FUNCTIONALITY ===
function initializeTabs() {
    // Get all tab sections
    const tabSections = document.querySelectorAll('.tabbed-section, .daily-activities-section');

    tabSections.forEach(section => {
        const tabButtons = section.querySelectorAll('.tab-btn');
        const tabContents = section.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');

                // Remove active class from all buttons in this section
                tabButtons.forEach(btn => btn.classList.remove('active'));

                // Remove active class from all content in this section
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to clicked button
                this.classList.add('active');

                // Show corresponding content
                const targetContent = section.querySelector('#' + targetTab + 'Tab');
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    });

    // Initialize Status Tabs
    const statusTabButtons = document.querySelectorAll('.status-tab-btn');
    const statusTabContents = document.querySelectorAll('.status-tab-content');

    statusTabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');

            // Remove active class from all status tab buttons
            statusTabButtons.forEach(btn => btn.classList.remove('active'));

            // Remove active class from all status tab contents
            statusTabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button
            this.classList.add('active');

            // Show corresponding content
            const targetContent = document.querySelector('#' + targetTab + 'Tab');
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Initialize tabs when DOM is loaded
initializeTabs();

