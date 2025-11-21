export const characterData = {
    name: "MÉO",
    caption: "Forever Curious",
    level: 0,
    currentXP: 0,
    maxXP: 1000,
    avatarUrl: null, // Will be loaded from NocoDB (profile -> avatar_img -> img_bw)
    
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

    hobbies: [
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

    introduce: "",

    quests: [],
    
    journal: [],

    achievements: [],

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
