const db = require('../database');
const { getUser, updateUser, addXp } = require('../utils/userManager');
const { generateSimpleImage, ar } = require('../utils/imageGenerator');
const { AttachmentBuilder } = require('discord.js');
const { PROPERTIES } = require('../data/shopItems');

async function sendImage(message, buffer, filename = 'result.png') {
  const att = new AttachmentBuilder(buffer, { name: filename });
  await message.reply({ files: [att] });
}

async function handleProperties(message) {
  const lines = Object.values(PROPERTIES).map(p => ({
    left: `${p.emoji} ${p.name}`,
    right: `${ar(p.price)} 💰 | إيجار: ${ar(p.rent)}`,
    rightColor: '#ffd700',
  }));
  const img = await generateSimpleImage('قائمة العقارات 🏠', lines, '#ff8844', '🏠');
  await sendImage(message, img, 'properties.png');
}

async function handleBuyProperty(message, args) {
  const propName = args.join(' ');
  const prop = PROPERTIES[propName];
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (!prop) {
    const img = await generateSimpleImage('عقار غير موجود', [{ text: 'استخدم: عقارات لرؤية القائمة' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const owned = db.prepare('SELECT * FROM properties WHERE user_id = ? AND guild_id = ? AND property_name = ?').get(message.author.id, message.guild.id, propName);
  if (owned) {
    const img = await generateSimpleImage('تملكه بالفعل!', [{ text: `أنت تملك ${prop.emoji} ${prop.name} مسبقاً!` }], '#ff8800', '⚠️');
    return sendImage(message, img);
  }
  if (user.cash < prop.price) {
    const img = await generateSimpleImage('رصيد غير كافٍ', [
      { left: '💰 نقدك', right: `${ar(user.cash)} عملة` },
      { left: '🏷️ السعر', right: `${ar(prop.price)} عملة` },
    ], '#ff4444', '❌');
    return sendImage(message, img);
  }
  db.prepare('INSERT INTO properties (user_id, guild_id, property_name) VALUES (?, ?, ?)').run(message.author.id, message.guild.id, propName);
  updateUser(message.author.id, message.guild.id, { cash: user.cash - prop.price });
  addXp(message.author.id, message.guild.id, 50);
  const img = await generateSimpleImage('تم الشراء! 🎉', [
    { left: `${prop.emoji} العقار`, right: prop.name },
    { left: '💰 السعر المدفوع', right: `${ar(prop.price)} عملة` },
    { left: '💵 إيجار دوري', right: `${ar(prop.rent)} عملة`, rightColor: '#44ff88' },
    { left: '💰 رصيدك المتبقي', right: `${ar(user.cash - prop.price)} عملة`, rightColor: '#ffd700' },
  ], '#44ff88', '🏠');
  await sendImage(message, img, 'buyprop.png');
}

async function handleSellProperty(message, args) {
  const propName = args.join(' ');
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const owned = db.prepare('SELECT * FROM properties WHERE user_id = ? AND guild_id = ? AND property_name = ?').get(message.author.id, message.guild.id, propName);
  if (!owned) {
    const img = await generateSimpleImage('لا تملكه', [{ text: `لا تملك "${propName}"` }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const prop = PROPERTIES[propName];
  const sellPrice = prop ? Math.floor(prop.price * 0.7) : 1000;
  db.prepare('DELETE FROM properties WHERE user_id = ? AND guild_id = ? AND property_name = ?').run(message.author.id, message.guild.id, propName);
  updateUser(message.author.id, message.guild.id, { cash: user.cash + sellPrice });
  const img = await generateSimpleImage('تم البيع! 💰', [
    { left: `${prop?.emoji || '🏠'} العقار`, right: propName },
    { left: '💰 سعر البيع (70%)', right: `${ar(sellPrice)} عملة`, rightColor: '#44ff88' },
    { left: '💵 رصيدك الآن', right: `${ar(user.cash + sellPrice)} عملة`, rightColor: '#ffd700' },
  ], '#ffd700', '💰');
  await sendImage(message, img, 'sellprop.png');
}

async function handleMyProperties(message) {
  const props = db.prepare('SELECT * FROM properties WHERE user_id = ? AND guild_id = ?').all(message.author.id, message.guild.id);
  if (!props.length) {
    const img = await generateSimpleImage('لا توجد عقارات', [{ text: 'ليس لديك أي عقارات!' }, { text: 'استخدم: عقارات لرؤية القائمة' }], '#888888', '🏠');
    return sendImage(message, img);
  }
  const lines = props.map(p => {
    const info = PROPERTIES[p.property_name];
    return { left: `${info?.emoji || '🏠'} ${p.property_name}`, right: `إيجار: ${ar(info?.rent || 0)}`, rightColor: '#44ff88' };
  });
  const totalRent = props.reduce((sum, p) => sum + (PROPERTIES[p.property_name]?.rent || 0), 0);
  lines.push({ divider: true });
  lines.push({ left: '💰 إجمالي الإيجار', right: `${ar(totalRent)} عملة`, rightColor: '#ffd700' });
  const img = await generateSimpleImage('عقاراتي 🏠', lines, '#ff8844', '🏠');
  await sendImage(message, img, 'myprops.png');
}

async function handleCollectRent(message) {
  const props = db.prepare('SELECT * FROM properties WHERE user_id = ? AND guild_id = ?').all(message.author.id, message.guild.id);
  if (!props.length) {
    const img = await generateSimpleImage('لا توجد عقارات', [{ text: 'ليس لديك عقارات للإيجار!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const now = Math.floor(Date.now() / 1000);
  const RENT_COOLDOWN = 6 * 60 * 60;
  let totalCollected = 0;
  let readyCount = 0;
  for (const p of props) {
    if (now - p.last_rent >= RENT_COOLDOWN) {
      const info = PROPERTIES[p.property_name];
      totalCollected += info?.rent || 0;
      readyCount++;
      db.prepare('UPDATE properties SET last_rent = ? WHERE id = ?').run(now, p.id);
    }
  }
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (totalCollected === 0) {
    const nextRent = props.reduce((min, p) => Math.min(min, (RENT_COOLDOWN - (now - p.last_rent)) * 1000), Infinity);
    const { formatCooldown } = require('../utils/userManager');
    const img = await generateSimpleImage('ليس بعد!', [
      { text: `⏳ الإيجار القادم بعد: ${formatCooldown(nextRent)}` },
    ], '#ff8800', '⏰');
    return sendImage(message, img);
  }
  updateUser(message.author.id, message.guild.id, { cash: user.cash + totalCollected });
  addXp(message.author.id, message.guild.id, 30);
  const img = await generateSimpleImage('تم تحصيل الإيجار! 💰', [
    { left: '🏠 عقارات جاهزة', right: String(readyCount) },
    { left: '💰 إجمالي الإيجار', right: `${ar(totalCollected)} عملة`, rightColor: '#44ff88' },
    { left: '💵 رصيدك الآن', right: `${ar(user.cash + totalCollected)} عملة`, rightColor: '#ffd700' },
    { text: '⏰ الإيجار القادم بعد 6 ساعات' },
  ], '#44ff88', '🏠');
  await sendImage(message, img, 'rent.png');
}

module.exports = { handleProperties, handleBuyProperty, handleSellProperty, handleMyProperties, handleCollectRent };
