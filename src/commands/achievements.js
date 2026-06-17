const db = require('../database');
const { getUser } = require('../utils/userManager');
const { generateSimpleImage, ar } = require('../utils/imageGenerator');
const { AttachmentBuilder } = require('discord.js');

async function sendImage(message, buffer, filename = 'result.png') {
  const att = new AttachmentBuilder(buffer, { name: filename });
  await message.reply({ files: [att] });
}

const ALL_ACHIEVEMENTS = [
  { id: 'first_deposit', name: 'أول إيداع', emoji: '🏦', description: 'أودع للمرة الأولى' },
  { id: 'rich_1k', name: 'ألفي', emoji: '💰', description: 'اجمع 1,000 عملة' },
  { id: 'rich_100k', name: 'مئة ألف', emoji: '💎', description: 'اجمع 100,000 عملة' },
  { id: 'rich_1m', name: 'مليونير', emoji: '👑', description: 'اجمع 1,000,000 عملة' },
  { id: 'level_10', name: 'متقدم', emoji: '⭐', description: 'بلغ المستوى 10' },
  { id: 'level_50', name: 'خبير', emoji: '🌟', description: 'بلغ المستوى 50' },
  { id: 'first_crime', name: 'مجرم مبتدئ', emoji: '🥷', description: 'ارتكب أول جريمة' },
  { id: 'gambler', name: 'مقامر', emoji: '🎰', description: 'العب 10 ألعاب' },
  { id: 'property_owner', name: 'ملاك عقارات', emoji: '🏠', description: 'امتلك عقاراً' },
  { id: 'pet_owner', name: 'صاحب حيوان', emoji: '🐾', description: 'امتلك حيواناً أليفاً' },
  { id: 'investor', name: 'مستثمر', emoji: '📈', description: 'استثمر لأول مرة' },
  { id: 'married', name: 'متزوج', emoji: '💑', description: 'تزوج من لاعب آخر' },
];

async function handleAchievements(message) {
  const earned = db.prepare('SELECT achievement FROM achievements WHERE user_id = ? AND guild_id = ?').all(message.author.id, message.guild.id).map(a => a.achievement);
  const lines = ALL_ACHIEVEMENTS.map(a => ({
    left: `${earned.includes(a.id) ? '✅' : '🔒'} ${a.emoji} ${a.name}`,
    right: a.description,
    rightColor: earned.includes(a.id) ? '#44ff88' : '#666666',
  }));
  lines.unshift({ text: `محصولة: ${earned.length}/${ALL_ACHIEVEMENTS.length}`, highlight: true });
  const img = await generateSimpleImage('الإنجازات 🏆', lines, '#ffd700', '🏆');
  await sendImage(message, img, 'achievements.png');
}

const TASKS = [
  { id: 'task_login', name: 'تسجيل حضور', description: 'احصل على مكافأة يومية', reward: 200 },
  { id: 'task_work', name: 'يوم عمل', description: 'اعمل 3 مرات اليوم', reward: 500 },
  { id: 'task_save', name: 'مدخر', description: 'أودع في البنك 1000 عملة', reward: 300 },
  { id: 'task_game', name: 'لاعب', description: 'العب 5 ألعاب', reward: 400 },
];

async function handleTasks(message) {
  const lines = TASKS.map(t => ({
    left: `📋 ${t.name}`,
    right: `+${ar(t.reward)} عملة`,
    rightColor: '#ffd700',
  }));
  lines.push({ divider: true });
  lines.push({ text: 'أكمل المهام واستلم مكافأتك!' });
  const img = await generateSimpleImage('المهام اليومية 📋', lines, '#4a9eff', '📋');
  await sendImage(message, img, 'tasks.png');
}

async function handleClaimTask(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const task = TASKS[Math.floor(Math.random() * TASKS.length)];
  const { updateUser, addXp } = require('../utils/userManager');
  updateUser(message.author.id, message.guild.id, { cash: user.cash + task.reward });
  addXp(message.author.id, message.guild.id, 30);
  const img = await generateSimpleImage('مهمة مكتملة! ✅', [
    { left: '📋 المهمة', right: task.name },
    { left: '💰 المكافأة', right: `${ar(task.reward)} عملة`, rightColor: '#44ff88' },
    { left: '💵 رصيدك', right: `${ar(user.cash + task.reward)} عملة`, rightColor: '#ffd700' },
  ], '#44ff88', '✅');
  await sendImage(message, img, 'task.png');
}

module.exports = { handleAchievements, handleTasks, handleClaimTask };
