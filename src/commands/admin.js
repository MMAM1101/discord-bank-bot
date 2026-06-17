const db = require('../database');
const { getUser, updateUser } = require('../utils/userManager');
const { generateSimpleImage, ar } = require('../utils/imageGenerator');
const { AttachmentBuilder, PermissionFlagsBits } = require('discord.js');

async function sendImage(message, buffer, filename = 'result.png') {
  const att = new AttachmentBuilder(buffer, { name: filename });
  await message.reply({ files: [att] });
}

function isAdmin(member) {
  return member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild);
}

async function handleAddMoney(message, args) {
  if (!isAdmin(message.member)) {
    const img = await generateSimpleImage('بدون صلاحية', [{ text: 'هذا الأمر للمشرفين فقط!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const target = message.mentions.users.first();
  const amount = parseInt(args[1]);
  if (!target || isNaN(amount) || amount <= 0) {
    const img = await generateSimpleImage('خطأ', [{ text: 'الاستخدام: اضافة_فلوس @عضو 1000' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const user = getUser(target.id, message.guild.id, target.username);
  updateUser(target.id, message.guild.id, { cash: user.cash + amount });
  const img = await generateSimpleImage('تم الإضافة ✅', [
    { left: '👤 العضو', right: target.username },
    { left: '💰 المضاف', right: `${ar(amount)} عملة`, rightColor: '#44ff88' },
    { left: '💵 الرصيد الجديد', right: `${ar(user.cash + amount)} عملة`, rightColor: '#ffd700' },
  ], '#44ff88', '💰');
  await sendImage(message, img, 'addmoney.png');
}

async function handleRemoveMoney(message, args) {
  if (!isAdmin(message.member)) {
    const img = await generateSimpleImage('بدون صلاحية', [{ text: 'هذا الأمر للمشرفين فقط!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const target = message.mentions.users.first();
  const amount = parseInt(args[1]);
  if (!target || isNaN(amount) || amount <= 0) {
    const img = await generateSimpleImage('خطأ', [{ text: 'الاستخدام: خصم_فلوس @عضو 1000' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const user = getUser(target.id, message.guild.id, target.username);
  const newCash = Math.max(0, user.cash - amount);
  updateUser(target.id, message.guild.id, { cash: newCash });
  const img = await generateSimpleImage('تم الخصم ✅', [
    { left: '👤 العضو', right: target.username },
    { left: '💸 المخصوم', right: `${ar(amount)} عملة`, rightColor: '#ff4444' },
    { left: '💵 الرصيد الجديد', right: `${ar(newCash)} عملة`, rightColor: '#ffd700' },
  ], '#ff4444', '💸');
  await sendImage(message, img, 'removemoney.png');
}

async function handleReset(message, args) {
  if (!isAdmin(message.member)) {
    const img = await generateSimpleImage('بدون صلاحية', [{ text: 'هذا الأمر للمشرفين فقط!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const target = message.mentions.users.first();
  if (!target) {
    const img = await generateSimpleImage('خطأ', [{ text: 'الاستخدام: تصفير @عضو' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  updateUser(target.id, message.guild.id, { cash: 1000, bank: 0, gold: 0, gems: 0, xp: 0, level: 1 });
  const img = await generateSimpleImage('تم التصفير ✅', [
    { left: '👤 العضو', right: target.username },
    { text: 'تم تصفير الرصيد والخبرة!' },
    { text: 'رصيد ابتدائي: 1,000 عملة' },
  ], '#ff4444', '🔄');
  await sendImage(message, img, 'reset.png');
}

async function handleGiveItem(message, args) {
  if (!isAdmin(message.member)) {
    const img = await generateSimpleImage('بدون صلاحية', [{ text: 'هذا الأمر للمشرفين فقط!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const target = message.mentions.users.first();
  const itemName = args.slice(1).join(' ');
  if (!target || !itemName) {
    const img = await generateSimpleImage('خطأ', [{ text: 'الاستخدام: اعطاء_غرض @عضو [غرض]' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const existing = db.prepare('SELECT * FROM inventory WHERE user_id = ? AND guild_id = ? AND item_name = ?').get(target.id, message.guild.id, itemName);
  if (existing) {
    db.prepare('UPDATE inventory SET quantity = quantity + 1 WHERE user_id = ? AND guild_id = ? AND item_name = ?').run(target.id, message.guild.id, itemName);
  } else {
    db.prepare('INSERT INTO inventory (user_id, guild_id, item_name, quantity) VALUES (?, ?, ?, 1)').run(target.id, message.guild.id, itemName);
  }
  const img = await generateSimpleImage('تم الإعطاء ✅', [
    { left: '👤 العضو', right: target.username },
    { left: '📦 الغرض', right: itemName, rightColor: '#ffd700' },
  ], '#44ff88', '🎁');
  await sendImage(message, img, 'giveitem.png');
}

async function handleRemoveItem(message, args) {
  if (!isAdmin(message.member)) {
    const img = await generateSimpleImage('بدون صلاحية', [{ text: 'هذا الأمر للمشرفين فقط!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const target = message.mentions.users.first();
  const itemName = args.slice(1).join(' ');
  if (!target || !itemName) {
    const img = await generateSimpleImage('خطأ', [{ text: 'الاستخدام: سحب_غرض @عضو [غرض]' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  db.prepare('DELETE FROM inventory WHERE user_id = ? AND guild_id = ? AND item_name = ?').run(target.id, message.guild.id, itemName);
  const img = await generateSimpleImage('تم السحب ✅', [
    { left: '👤 العضو', right: target.username },
    { left: '📦 الغرض المسحوب', right: itemName },
  ], '#ff4444', '🗑️');
  await sendImage(message, img, 'removeitem.png');
}

module.exports = { handleAddMoney, handleRemoveMoney, handleReset, handleGiveItem, handleRemoveItem };
