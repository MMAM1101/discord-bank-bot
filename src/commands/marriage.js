const db = require('../database');
const { getUser, updateUser, addXp } = require('../utils/userManager');
const { generateSimpleImage, ar } = require('../utils/imageGenerator');
const { AttachmentBuilder } = require('discord.js');

async function sendImage(message, buffer, filename = 'result.png') {
  const att = new AttachmentBuilder(buffer, { name: filename });
  await message.reply({ files: [att] });
}

async function handleMarry(message, args) {
  const target = message.mentions.users.first();
  if (!target) {
    const img = await generateSimpleImage('خطأ', [{ text: 'الاستخدام: زواج @عضو' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  if (target.id === message.author.id) {
    const img = await generateSimpleImage('خطأ', [{ text: 'لا يمكنك الزواج من نفسك!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const targetUser = getUser(target.id, message.guild.id, target.username);
  if (user.married_to) {
    const img = await generateSimpleImage('متزوج مسبقاً!', [{ text: `أنت متزوج من ${user.married_to}` }, { text: 'استخدم: طلاق للطلاق أولاً' }], '#ff8800', '⚠️');
    return sendImage(message, img);
  }
  if (targetUser.married_to) {
    const img = await generateSimpleImage('متزوج مسبقاً!', [{ text: `${target.username} متزوج/ة بالفعل!` }], '#ff8800', '⚠️');
    return sendImage(message, img);
  }
  const ringCost = 5000;
  if (user.cash < ringCost) {
    const img = await generateSimpleImage('رصيد غير كافٍ', [{ text: 'تحتاج 5,000 عملة لشراء خاتم!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  updateUser(message.author.id, message.guild.id, { married_to: target.username, cash: user.cash - ringCost });
  updateUser(target.id, message.guild.id, { married_to: message.author.username });
  addXp(message.author.id, message.guild.id, 100);
  const img = await generateSimpleImage('زواج مبارك! 💒', [
    { text: `💑 ${message.author.username} × ${target.username}`, highlight: true },
    { left: '💍 تكلفة الخاتم', right: `${ar(ringCost)} عملة` },
    { text: 'مبروك! عقبال الباقين 🎊' },
    { text: 'ستحصل زوجتك على مصروف منتظم!' },
  ], '#ff88aa', '💒');
  await sendImage(message, img, 'marry.png');
}

async function handleDivorce(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (!user.married_to) {
    const img = await generateSimpleImage('لست متزوجاً', [{ text: 'ليس لديك شريك حياة!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const divorceCost = 2000;
  const exName = user.married_to;
  const exUser = db.prepare(`SELECT * FROM users WHERE username = ? AND guild_id = ?`).get(exName, message.guild.id);
  updateUser(message.author.id, message.guild.id, { married_to: null, cash: Math.max(0, user.cash - divorceCost) });
  if (exUser) updateUser(exUser.id, message.guild.id, { married_to: null });
  const img = await generateSimpleImage('تم الطلاق 💔', [
    { left: '💔 مطلق من', right: exName },
    { left: '💸 رسوم الطلاق', right: `${ar(divorceCost)} عملة` },
  ], '#888888', '💔');
  await sendImage(message, img, 'divorce.png');
}

async function handleFamily(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (!user.married_to) {
    const img = await generateSimpleImage('عائلتي 👨‍👩‍👧', [{ text: 'أنت لست متزوجاً بعد!' }, { text: 'استخدم: زواج @عضو' }], '#888888', '👨‍👩‍👧');
    return sendImage(message, img);
  }
  const img = await generateSimpleImage('عائلتي 👨‍👩‍👧', [
    { left: '👤 أنا', right: message.author.username },
    { left: '💑 الشريك', right: user.married_to, rightColor: '#ff88aa' },
    { text: 'عائلة سعيدة! 🏠' },
  ], '#ff88aa', '👨‍👩‍👧');
  await sendImage(message, img, 'family.png');
}

async function handleAllowance(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (!user.married_to) {
    const img = await generateSimpleImage('خطأ', [{ text: 'تزوج أولاً!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const allowance = 300;
  const exUser = db.prepare(`SELECT * FROM users WHERE username = ? AND guild_id = ?`).get(user.married_to, message.guild.id);
  if (exUser && user.cash >= allowance) {
    updateUser(message.author.id, message.guild.id, { cash: user.cash - allowance });
    updateUser(exUser.id, message.guild.id, { cash: exUser.cash + allowance });
  }
  const img = await generateSimpleImage('المصروف 💝', [
    { left: '💝 المصروف', right: `${ar(allowance)} عملة` },
    { left: '👤 المستلم', right: user.married_to, rightColor: '#ff88aa' },
  ], '#ff88aa', '💝');
  await sendImage(message, img, 'allowance.png');
}

module.exports = { handleMarry, handleDivorce, handleFamily, handleAllowance };
