const db = require('../database');
const { getUser, updateUser, addXp } = require('../utils/userManager');
const { generateSimpleImage, generateLeaderboardImage, ar } = require('../utils/imageGenerator');
const { AttachmentBuilder } = require('discord.js');

async function sendImage(message, buffer, filename = 'result.png') {
  const att = new AttachmentBuilder(buffer, { name: filename });
  await message.reply({ files: [att] });
}

async function handleCreateGuild(message, args) {
  const name = args.join(' ');
  if (!name) {
    const img = await generateSimpleImage('خطأ', [{ text: 'الاستخدام: انشاء_نقابة [اسم]' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (user.guild_name) {
    const img = await generateSimpleImage('لديك نقابة!', [{ text: `أنت في نقابة: ${user.guild_name}` }], '#ff8800', '⚠️');
    return sendImage(message, img);
  }
  const cost = 10000;
  if (user.cash < cost) {
    const img = await generateSimpleImage('رصيد غير كافٍ', [{ text: 'تحتاج 10,000 عملة لإنشاء نقابة' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const existing = db.prepare('SELECT * FROM game_guilds WHERE name = ? AND guild_id = ?').get(name, message.guild.id);
  if (existing) {
    const img = await generateSimpleImage('الاسم مأخوذ', [{ text: `نقابة "${name}" موجودة مسبقاً!` }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  db.prepare('INSERT INTO game_guilds (name, leader_id, guild_id, members) VALUES (?, ?, ?, ?)').run(name, message.author.id, message.guild.id, JSON.stringify([message.author.id]));
  updateUser(message.author.id, message.guild.id, { guild_name: name, cash: user.cash - cost });
  addXp(message.author.id, message.guild.id, 100);
  const img = await generateSimpleImage('تم إنشاء النقابة! ⚔️', [
    { left: '⚔️ اسم النقابة', right: name },
    { left: '👑 القائد', right: message.author.username },
    { left: '💰 رسوم الإنشاء', right: `${ar(cost)} عملة` },
    { text: 'ادع أعضاء بأمر: دعوة_نقابة @عضو' },
  ], '#ff8844', '⚔️');
  await sendImage(message, img, 'createguild.png');
}

async function handleMyGuild(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (!user.guild_name) {
    const img = await generateSimpleImage('لا توجد نقابة', [{ text: 'لست في نقابة!' }, { text: 'استخدم: انشاء_نقابة [اسم]' }], '#888888', '⚔️');
    return sendImage(message, img);
  }
  const guild = db.prepare('SELECT * FROM game_guilds WHERE name = ? AND guild_id = ?').get(user.guild_name, message.guild.id);
  if (!guild) {
    updateUser(message.author.id, message.guild.id, { guild_name: null });
    const img = await generateSimpleImage('لا توجد نقابة', [{ text: 'نقابتك لم تعد موجودة!' }], '#888888', '⚔️');
    return sendImage(message, img);
  }
  const members = JSON.parse(guild.members || '[]');
  const img = await generateSimpleImage(`نقابة ${guild.name} ⚔️`, [
    { left: '⚔️ الاسم', right: guild.name },
    { left: '👥 الأعضاء', right: String(members.length) },
    { left: '💰 خزينة النقابة', right: `${ar(guild.treasury)} عملة`, rightColor: '#ffd700' },
    { text: `أنت ${guild.leader_id === message.author.id ? '👑 القائد' : '⚔️ عضو'}` },
  ], '#ff8844', '⚔️');
  await sendImage(message, img, 'myguild.png');
}

async function handleInviteGuild(message, args) {
  const target = message.mentions.users.first();
  if (!target) {
    const img = await generateSimpleImage('خطأ', [{ text: 'الاستخدام: دعوة_نقابة @عضو' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (!user.guild_name) {
    const img = await generateSimpleImage('لا توجد نقابة', [{ text: 'أنشئ نقابة أولاً!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const guild = db.prepare('SELECT * FROM game_guilds WHERE name = ? AND guild_id = ? AND leader_id = ?').get(user.guild_name, message.guild.id, message.author.id);
  if (!guild) {
    const img = await generateSimpleImage('ليس قائداً', [{ text: 'فقط قائد النقابة يمكنه الدعوة!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const targetUser = getUser(target.id, message.guild.id, target.username);
  if (targetUser.guild_name) {
    const img = await generateSimpleImage('في نقابة!', [{ text: `${target.username} في نقابة بالفعل!` }], '#ff8800', '⚠️');
    return sendImage(message, img);
  }
  const members = JSON.parse(guild.members || '[]');
  members.push(target.id);
  db.prepare('UPDATE game_guilds SET members = ? WHERE name = ? AND guild_id = ?').run(JSON.stringify(members), guild.name, message.guild.id);
  updateUser(target.id, message.guild.id, { guild_name: guild.name });
  const img = await generateSimpleImage('تمت الدعوة! ⚔️', [
    { left: '✅ انضم', right: target.username },
    { left: '⚔️ النقابة', right: guild.name },
    { left: '👥 إجمالي الأعضاء', right: String(members.length) },
  ], '#44ff88', '⚔️');
  await sendImage(message, img, 'inviteguild.png');
}

async function handleKickGuild(message, args) {
  const target = message.mentions.users.first();
  if (!target) {
    const img = await generateSimpleImage('خطأ', [{ text: 'الاستخدام: طرد_نقابة @عضو' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const guild = db.prepare('SELECT * FROM game_guilds WHERE name = ? AND guild_id = ? AND leader_id = ?').get(user.guild_name, message.guild.id, message.author.id);
  if (!guild) {
    const img = await generateSimpleImage('ليس قائداً', [{ text: 'فقط قائد النقابة يمكنه الطرد!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const members = JSON.parse(guild.members || '[]').filter(id => id !== target.id);
  db.prepare('UPDATE game_guilds SET members = ? WHERE name = ? AND guild_id = ?').run(JSON.stringify(members), guild.name, message.guild.id);
  updateUser(target.id, message.guild.id, { guild_name: null });
  const img = await generateSimpleImage('تم الطرد! 🚪', [
    { left: '🚪 طُرد', right: target.username },
    { left: '⚔️ من النقابة', right: guild.name },
  ], '#ff4444', '🚪');
  await sendImage(message, img, 'kickguild.png');
}

async function handleGuildWar(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (!user.guild_name) {
    const img = await generateSimpleImage('لا توجد نقابة', [{ text: 'انضم لنقابة أولاً!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const guilds = db.prepare('SELECT * FROM game_guilds WHERE guild_id = ? AND name != ?').all(message.guild.id, user.guild_name);
  if (guilds.length === 0) {
    const img = await generateSimpleImage('لا يوجد منافسون', [{ text: 'لا توجد نقابات أخرى للحرب!' }], '#ff8800', '⚠️');
    return sendImage(message, img);
  }
  const enemy = guilds[Math.floor(Math.random() * guilds.length)];
  const myGuild = db.prepare('SELECT * FROM game_guilds WHERE name = ? AND guild_id = ?').get(user.guild_name, message.guild.id);
  const myPower = JSON.parse(myGuild.members || '[]').length;
  const enemyPower = JSON.parse(enemy.members || '[]').length;
  const isWin = myPower >= enemyPower ? Math.random() < 0.6 : Math.random() < 0.4;
  const prize = isWin ? 5000 : 0;
  if (isWin && prize > 0) {
    db.prepare('UPDATE game_guilds SET treasury = treasury + ? WHERE name = ? AND guild_id = ?').run(prize, user.guild_name, message.guild.id);
  }
  const img = await generateSimpleImage(`حرب النقابات ⚔️`, [
    { left: '⚔️ نقابتك', right: user.guild_name },
    { left: '🏴 العدو', right: enemy.name },
    { left: isWin ? '🏆 النتيجة' : '💔 النتيجة', right: isWin ? 'انتصار!' : 'هزيمة!', rightColor: isWin ? '#44ff88' : '#ff4444' },
    isWin ? { left: '💰 الغنيمة', right: `${ar(prize)} عملة`, rightColor: '#ffd700' } : { text: 'حظ أوفر المرة القادمة!' },
  ], isWin ? '#44ff88' : '#ff4444', '⚔️');
  await sendImage(message, img, 'guildwar.png');
}

module.exports = { handleCreateGuild, handleMyGuild, handleInviteGuild, handleKickGuild, handleGuildWar };
