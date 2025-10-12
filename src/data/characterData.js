export const characterData = {
    name: "MÉO",
    caption: "Forever Curious",
    level: 25,
    currentXP: 6500,
    maxXP: 10000,
    
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

    interests: [
        { name: "Gaming" },
        { name: "Music" },
        { name: "Reading" },
        { name: "Art" },
        { name: "Food" },
        { name: "Design" },
        { name: "Travel" }
    ],
    
    status: {
        doing: "Studying character design",
        location: "Home",
        mood: "Focused",
        timestamp: new Date()
    },

    introduce: "A creative artist who brings imagination to life through drawing. Passionate about exploring the world, discovering new cultures, and savoring delicious food. Every sketch tells a story, every journey sparks inspiration, and every meal brings pure happiness.",

    quests: [
        { id: 1, title: "Complete 3 coding challenges", completed: false, xp: 150 },
        { id: 2, title: "Review 5 pull requests", completed: true, xp: 100 },
        { id: 3, title: "Write documentation for new feature", completed: false, xp: 120 },
        { id: 4, title: "Learn a new algorithm", completed: false, xp: 200 },
        { id: 5, title: "Exercise for 30 minutes", completed: true, xp: 80 },
        { id: 6, title: "Read 1 chapter of tech book", completed: false, xp: 100 }
    ],
    
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

    history: [
        {
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
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
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
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
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
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
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
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
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
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
            date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
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
    ],

    social: {
        facebook: "https://facebook.com/yourprofile",
        instagram: "https://instagram.com/yourprofile",
        tiktok: "https://tiktok.com/@yourprofile",
        youtube: "https://youtube.com/@yourprofile",
        gmail: "your.email@gmail.com"
    }
};
