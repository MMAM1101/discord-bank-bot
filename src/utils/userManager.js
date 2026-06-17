const db = require('../database');

function getUser(userId, guildId, username) {
  let user = db.prepare('SELECT * FROM users WHERE id = ? AND guild_id = ?').get(userId, guildId);
  if (!user) {
    db.prepare('INSERT INTO users (id, guild_id, username) VALUES (?, ?, ?)').run(userId, guildId, username || 'مجهول');
    user = db.prepare('SELECT * FROM users WHERE id = ? AND guild_id = ?').get(userId, guildId);
  }
  return user;
}

function updateUser(userId, guildId, data) {
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(data), userId, guildId];
  db.prepare(`UPDATE users SET ${fields} WHERE id = ? AND guild_id = ?`).run(...values);
}

function getRank(totalWealth) {
  if (totalWealth < 1000) return { rank: 'مفلس', emoji: '💸', color: '#808080' };
  if (totalWealth < 10000) return { rank: 'مواطن', emoji: '👤', color: '#a0a0a0' };
  if (totalWealth < 50000) return { rank: 'عامل', emoji: '⚒️', color: '#4a9eff' };
  if (totalWealth < 200000) return { rank: 'تاجر', emoji: '🏪', color: '#44cc44' };
  if (totalWealth < 1000000) return { rank: 'رجل أعمال', emoji: '💼', color: '#ffa500' };
  if (totalWealth < 10000000) return { rank: 'مليونير', emoji: '💰', color: '#ffd700' };
  if (totalWealth < 100000000) return { rank: 'ملياردير', emoji: '🏦', color: '#ff6600' };
  return { rank: 'أسطورة اقتصادية', emoji: '👑', color: '#ff0066' };
}

function getLevelInfo(xp) {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const progress = Math.floor(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100);
  return { level, nextLevelXp, progress: Math.min(progress, 100) };
}

function addXp(userId, guildId, amount) {
  const user = db.prepare('SELECT xp FROM users WHERE id = ? AND guild_id = ?').get(userId, guildId);
  if (!user) return;
  const newXp = (user.xp || 0) + amount;
  const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
  db.prepare('UPDATE users SET xp = ?, level = ? WHERE id = ? AND guild_id = ?').run(newXp, newLevel, userId, guildId);
}

function formatNumber(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString('ar-SA');
}

function getCooldownLeft(lastTime, cooldownMs) {
  const now = Date.now();
  const elapsed = now - lastTime * 1000;
  if (elapsed >= cooldownMs) return 0;
  return cooldownMs - elapsed;
}

function formatCooldown(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d} يوم و ${h % 24} ساعة`;
  if (h > 0) return `${h} ساعة و ${m % 60} دقيقة`;
  if (m > 0) return `${m} دقيقة و ${s % 60} ثانية`;
  return `${s} ثانية`;
}

module.exports = { getUser, updateUser, getRank, getLevelInfo, addXp, formatNumber, getCooldownLeft, formatCooldown };
