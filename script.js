// ========================================
// RPG CHARACTER SHEET - JAVASCRIPT
// Dynamic Content & Interactions
// ========================================

// === CHARACTER DATA ===
const characterData = {
    name: "SHADOW KNIGHT",
    title: "The Code Warrior",
    level: 25,
    currentXP: 6500,
    maxXP: 10000,
    
    // Skills - grid items like hobbies
    skills: [
        { name: "JavaScript", icon: "{ }" },
        { name: "React", icon: "⚛" },
        { name: "Node.js", icon: "◆" },
        { name: "Python", icon: "⟨/⟩" },
        { name: "Database", icon: "▣" },
        { name: "Git", icon: "⎇" },
        { name: "Docker", icon: "◈" },
        { name: "AWS", icon: "△" }
    ],

    // Interests/Hobbies - with icons (no emoji)
    interests: [
        { name: "Gaming", icon: "▲" },
        { name: "Music", icon: "♪" },
        { name: "Reading", icon: "■" },
        { name: "Art", icon: "✎" },
        { name: "Coffee", icon: "◉" },
        { name: "Code", icon: "</>" },
        { name: "Design", icon: "◐" },
        { name: "Travel", icon: "✈" }
    ],
    
    // Current Status
    status: {
        text: "Coding a new adventure",
        timestamp: new Date()
    },

    // Daily Quests
    quests: [
        { id: 1, text: "Complete 3 coding challenges", completed: false },
        { id: 2, text: "Review 5 pull requests", completed: true },
        { id: 3, text: "Write documentation for new feature", completed: false },
        { id: 4, text: "Learn a new algorithm", completed: false },
        { id: 5, text: "Exercise for 30 minutes", completed: true },
        { id: 6, text: "Read 1 chapter of tech book", completed: false }
    ],
    
    // Daily Journal Entries
    journal: [
        {
            time: "09:30 AM",
            entry: "Started working on the new RPG character sheet project. Excited to combine my love for gaming and coding."
        },
        {
            time: "02:15 PM",
            entry: "Had a productive team meeting. Discussed new features for the upcoming sprint. Team morale is high."
        },
        {
            time: "05:45 PM",
            entry: "Learned about advanced CSS animations today. Looking forward to implementing them in future projects."
        }
    ]
};

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 RPG Character Sheet Initialized!');
    
    // Populate all sections
    populateCharacterInfo();
    populateSkills();
    populateInterests();
    populateStatus();
    populateQuests();
    populateJournal();
    updateLastUpdated();
    
    // Update XP bar animation
    animateXPBar();
    
    // Set up quest interactions
    setupQuestInteractions();
    
    // Update time every minute
    setInterval(updateLastUpdated, 60000);
});

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
    updateStatusTime();
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
        questDiv.dataset.questId = quest.id;
        questDiv.innerHTML = `
            <div class="quest-checkbox ${quest.completed ? 'checked' : ''}"></div>
            <div class="quest-text">${quest.text}</div>
        `;
        container.appendChild(questDiv);
    });
    
    updateQuestProgress();
}

function populateJournal() {
    const dateDiv = document.getElementById('journalDate');
    const contentDiv = document.getElementById('journalContent');

    // Set current date
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDiv.textContent = today.toLocaleDateString('vi-VN', options);

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

// === QUEST INTERACTIONS ===

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

function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    const dateString = now.toLocaleDateString('vi-VN');
    document.getElementById('lastUpdated').textContent = `${dateString} ${timeString}`;
}

// === TOGGLE FUNCTIONS === (Removed - no longer needed for tag-based layout)

// === EASTER EGGS & ANIMATIONS ===

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Press 'L' to add 500 XP
    if (e.key === 'l' || e.key === 'L') {
        addXP(500);
        showNotification('Cheat Code Activated! +500 XP');
    }

    // Press 'R' to reset quests
    if (e.key === 'r' || e.key === 'R') {
        characterData.quests.forEach(q => q.completed = false);
        populateQuests();
        setupQuestInteractions();
        showNotification('Daily Quests Reset!');
    }
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
}

// Initialize tabs when DOM is loaded
initializeTabs();

