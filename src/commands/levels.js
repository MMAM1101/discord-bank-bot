const db = require('../database');
const { getUser, getLevelInfo } = require('../utils/userManager');
const { generateSimpleImage, generateLeaderboardImage, ar } = require('../utils/imageGenerator');
const { AttachmentBuilder } = require('discord.js');

async function sendImage(message, buffer, filename = 'result.png') {
  const att = new AttachmentBuilder(buffer, { name: filename });
  await message.reply({ files: [att] });
}

async function handleLevel(message) {
  const target = message.mentions.users.first() || message.author;
  const user = getUser(target.id, message.guild.id, target.username);
  const { level, nextLevelXp, progress } = getLevelInfo(user.xp || 0);
  const curXp = Math.pow(level - 1, 2) * 100;
  const img = await generateSimpleImage(`مستوى ${target.username} ⭐`, [
    { left: '⭐ المستوى الحالي', right: String(level), rightColor: '#ffd700' },
    { left: '✨ الخبرة الكلية', right: `${ar(user.xp || 0)} XP` },
    { left: '🎯 تقدم المستوى', right: `${progress}%`, rightColor: progress > 70 ? '#44ff88' : '#ffa500' },
    { left: '📊 المطلوب للمستوى القادم', right: `${ar(nextLevelXp - (user.xp || 0))} XP` },
  ], '#ffd700', '⭐');
  await sendImage(message, img, 'level.png');
}

async function handleMyXp(message) {
  return handleLevel(message);
}

async function handleTopLevels(message) {
  const users = db.prepare('SELECT * FROM users WHERE guild_id = ? ORDER BY xp DESC LIMIT 10').all(message.guild.id);
  const img = await generateLeaderboardImage(users, 'أعلى المستويات');
  await sendImage(message, img, 'toplevels.png');
}

module.exports = { handleLevel, handleMyXp, handleTopLevels };
