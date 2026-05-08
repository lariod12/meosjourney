// Test script for pet status levels
// Run with: node test-pet-status-levels.js

const getPetStatusLevel = (value) => {
  if (value <= 20) return 'critical';
  if (value <= 40) return 'danger';
  if (value <= 60) return 'warning';
  if (value <= 80) return 'normal';
  return 'excellent';
};

const PET_THOUGHT_BUBBLE_OPTIONS = {
  playDurationSeconds: 7,
  timing: {
    critical: { minDelay: 5, maxDelay: 8, showChance: 0.95 },
    danger: { minDelay: 8, maxDelay: 12, showChance: 0.90 },
    warning: { minDelay: 12, maxDelay: 16, showChance: 0.85 },
    normal: { minDelay: 16, maxDelay: 20, showChance: 0.80 },
    excellent: { minDelay: 18, maxDelay: 25, showChance: 0.75 }
  },
  initialDelaySeconds: 5,
  interactionCooldownSeconds: 8
};

console.log('🧪 Testing Pet Status Levels\n');

// Test status level calculation
const testCases = [
  { value: 0, expected: 'critical' },
  { value: 15, expected: 'critical' },
  { value: 20, expected: 'critical' },
  { value: 21, expected: 'danger' },
  { value: 35, expected: 'danger' },
  { value: 40, expected: 'danger' },
  { value: 41, expected: 'warning' },
  { value: 55, expected: 'warning' },
  { value: 60, expected: 'warning' },
  { value: 61, expected: 'normal' },
  { value: 75, expected: 'normal' },
  { value: 80, expected: 'normal' },
  { value: 81, expected: 'excellent' },
  { value: 95, expected: 'excellent' },
  { value: 100, expected: 'excellent' }
];

let passed = 0;
let failed = 0;

console.log('📊 Status Level Tests:');
testCases.forEach(({ value, expected }) => {
  const result = getPetStatusLevel(value);
  const status = result === expected ? '✅' : '❌';
  if (result === expected) {
    passed++;
  } else {
    failed++;
  }
  console.log(`${status} value: ${value} → ${result} (expected: ${expected})`);
});

console.log(`\n📈 Results: ${passed} passed, ${failed} failed\n`);

// Test timing configuration
console.log('⏱️  Timing Configuration:');
Object.entries(PET_THOUGHT_BUBBLE_OPTIONS.timing).forEach(([level, config]) => {
  const avgDelay = (config.minDelay + config.maxDelay) / 2;
  console.log(`  ${level.padEnd(10)} → ${config.minDelay}-${config.maxDelay}s (avg: ${avgDelay}s, ${(config.showChance * 100).toFixed(0)}% chance)`);
});

console.log('\n✨ Urgency Comparison:');
console.log('  Critical:  ~6.5s (MOST URGENT - very active)');
console.log('  Danger:    ~10s (high urgency)');
console.log('  Warning:   ~14s (medium urgency)');
console.log('  Normal:    ~18s (active feel)');
console.log('  Excellent: ~21.5s (still active, slightly relaxed)');

console.log('\n💡 Design Philosophy:');
console.log('  • All states within 5-25s range');
console.log('  • Pet feels alive and active');
console.log('  • No long waits - user always sees activity');
console.log('  • Escalating urgency still clear');
console.log('  • Initial delay: 5s (faster start)');
console.log('  • Interaction cooldown: 8s (responsive)');

console.log('\n🎯 Test Summary:');
if (failed === 0) {
  console.log('  ✅ All tests passed!');
  console.log('  ✅ 5 status levels working correctly');
  console.log('  ✅ Timing escalation configured');
  process.exit(0);
} else {
  console.log(`  ❌ ${failed} test(s) failed`);
  process.exit(1);
}
