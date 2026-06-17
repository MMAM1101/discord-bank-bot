const db = require('../database');
const { getUser, updateUser, addXp } = require('../utils/userManager');
const { generateShopImage, generateSimpleImage, ar } = require('../utils/imageGenerator');
const { AttachmentBuilder } = require('discord.js');
const { SHOP_ITEMS } = require('../data/shopItems');

async function sendImage(message, buffer, filename = 'result.png') {
  const att = new AttachmentBuilder(buffer, { name: filename });
  await message.reply({ files: [att] });
}

async function handleShop(message) {
  const items = Object.values(SHOP_ITEMS);
  const img = await generateShopImage(items);
  await sendImage(message, img, 'shop.png');
}

async function handleBuy(message, args) {
  const itemName = args.join('_');
  const item = SHOP_ITEMS[itemName] || SHOP_ITEMS[args.join(' ')];
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (!item) {
    const img = await generateSimpleImage('غرض غير موجود', [
      { text: 'هذا الغرض غير موجود في المتجر' },
      { text: 'استخدم: متجر لرؤية الأغراض' },
    ], '#ff4444', '❌');
    return sendImage(message, img);
  }
  if (user.cash < item.price) {
    const img = await generateSimpleImage('رصيد غير كافٍ', [
      { left: '💰 نقدك', right: `${ar(user.cash)} عملة` },
      { left: '🏷️ السعر', right: `${ar(item.price)} عملة` },
    ], '#ff4444', '❌');
    return sendImage(message, img);
  }
  if (item.type === 'consumable' && item.name === 'كتاب خبرة') {
    addXp(message.author.id, message.guild.id, 500);
    updateUser(message.author.id, message.guild.id, { cash: user.cash - item.price });
    const img = await generateSimpleImage('تم الشراء! ✅', [
      { left: `${item.emoji} الغرض`, right: item.name },
      { left: '✨ استخدم', right: '+500 XP' },
      { left: '💰 رصيدك', right: `${ar(user.cash - item.price)} عملة`, rightColor: '#ffd700' },
    ], '#44ff88', '🛒');
    return sendImage(message, img, 'buy.png');
  }
  const existing = db.prepare('SELECT * FROM inventory WHERE user_id = ? AND guild_id = ? AND item_name = ?').get(message.author.id, message.guild.id, item.name);
  if (existing) {
    db.prepare('UPDATE inventory SET quantity = quantity + 1 WHERE user_id = ? AND guild_id = ? AND item_name = ?').run(message.author.id, message.guild.id, item.name);
  } else {
    db.prepare('INSERT INTO inventory (user_id, guild_id, item_name, quantity) VALUES (?, ?, ?, 1)').run(message.author.id, message.guild.id, item.name);
  }
  updateUser(message.author.id, message.guild.id, { cash: user.cash - item.price });
  addXp(message.author.id, message.guild.id, 10);
  const img = await generateSimpleImage('تم الشراء! ✅', [
    { left: `${item.emoji} الغرض`, right: item.name },
    { left: '🏷️ السعر', right: `${ar(item.price)} عملة` },
    { left: '✨ التأثير', right: item.effect || 'يضاف للحقيبة' },
    { left: '💰 رصيدك', right: `${ar(user.cash - item.price)} عملة`, rightColor: '#ffd700' },
  ], '#44ff88', '🛒');
  await sendImage(message, img, 'buy.png');
}

async function handleSell(message, args) {
  const itemName = args.join(' ');
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const inv = db.prepare('SELECT * FROM inventory WHERE user_id = ? AND guild_id = ? AND item_name = ? AND quantity > 0').get(message.author.id, message.guild.id, itemName);
  if (!inv) {
    const img = await generateSimpleImage('لا يوجد', [{ text: `ليس لديك "${itemName}"` }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const itemKey = Object.keys(SHOP_ITEMS).find(k => SHOP_ITEMS[k].name === itemName);
  const item = itemKey ? SHOP_ITEMS[itemKey] : null;
  const sellPrice = item ? Math.floor(item.price * 0.5) : 100;
  if (inv.quantity <= 1) {
    db.prepare('DELETE FROM inventory WHERE user_id = ? AND guild_id = ? AND item_name = ?').run(message.author.id, message.guild.id, itemName);
  } else {
    db.prepare('UPDATE inventory SET quantity = quantity - 1 WHERE user_id = ? AND guild_id = ? AND item_name = ?').run(message.author.id, message.guild.id, itemName);
  }
  updateUser(message.author.id, message.guild.id, { cash: user.cash + sellPrice });
  const img = await generateSimpleImage('تم البيع! 💰', [
    { left: '📦 الغرض', right: itemName },
    { left: '💰 سعر البيع', right: `${ar(sellPrice)} عملة`, rightColor: '#44ff88' },
    { left: '💵 رصيدك الآن', right: `${ar(user.cash + sellPrice)} عملة`, rightColor: '#ffd700' },
  ], '#ffd700', '💰');
  await sendImage(message, img, 'sell.png');
}

async function handleBag(message) {
  const inv = db.prepare('SELECT * FROM inventory WHERE user_id = ? AND guild_id = ? AND quantity > 0').all(message.author.id, message.guild.id);
  if (!inv.length) {
    const img = await generateSimpleImage('الحقيبة فارغة', [{ text: 'ليس لديك أي أغراض!' }, { text: 'استخدم: متجر لشراء أغراض' }], '#888888', '🎒');
    return sendImage(message, img);
  }
  const lines = inv.map(i => ({ left: `📦 ${i.item_name}`, right: `x${i.quantity}`, rightColor: '#ffd700' }));
  const img = await generateSimpleImage('حقيبتي 🎒', lines, '#4a9eff', '🎒');
  await sendImage(message, img, 'bag.png');
}

async function handleUse(message, args) {
  const itemName = args.join(' ');
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const inv = db.prepare('SELECT * FROM inventory WHERE user_id = ? AND guild_id = ? AND item_name = ? AND quantity > 0').get(message.author.id, message.guild.id, itemName);
  if (!inv) {
    const img = await generateSimpleImage('لا يوجد', [{ text: `ليس لديك "${itemName}" في حقيبتك` }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const itemKey = Object.keys(SHOP_ITEMS).find(k => SHOP_ITEMS[k].name === itemName);
  const item = itemKey ? SHOP_ITEMS[itemKey] : null;
  let result = 'تم استخدام الغرض!';
  if (item?.type === 'consumable') {
    if (item.name === 'كتاب خبرة') {
      addXp(message.author.id, message.guild.id, 500);
      result = 'حصلت على +500 XP!';
    } else if (item.name === 'صندوق غامض') {
      const reward = Math.floor(Math.random() * 5000) + 500;
      updateUser(message.author.id, message.guild.id, { cash: user.cash + reward });
      result = `وجدت ${ar(reward)} عملة في الصندوق!`;
    } else if (item.name === 'تعويذة الحظ') {
      result = 'تعويذة الحظ نشطة لمدة ساعة!';
    }
    if (inv.quantity <= 1) {
      db.prepare('DELETE FROM inventory WHERE user_id = ? AND guild_id = ? AND item_name = ?').run(message.author.id, message.guild.id, itemName);
    } else {
      db.prepare('UPDATE inventory SET quantity = quantity - 1 WHERE user_id = ? AND guild_id = ? AND item_name = ?').run(message.author.id, message.guild.id, itemName);
    }
  }
  const img = await generateSimpleImage('استخدام الغرض ✨', [
    { left: '📦 الغرض', right: itemName },
    { text: result, highlight: true },
  ], '#44ff88', '✨');
  await sendImage(message, img, 'use.png');
}

async function handleItems(message) {
  return handleBag(message);
}

module.exports = { handleShop, handleBuy, handleSell, handleBag, handleUse, handleItems };
