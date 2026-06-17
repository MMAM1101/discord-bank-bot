const db = require('../database');
const { getUser, updateUser, addXp, getCooldownLeft, formatCooldown } = require('../utils/userManager');
const { generateSimpleImage, ar } = require('../utils/imageGenerator');
const { AttachmentBuilder } = require('discord.js');
const { PETS } = require('../data/shopItems');

async function sendImage(message, buffer, filename = 'result.png') {
  const att = new AttachmentBuilder(buffer, { name: filename });
  await message.reply({ files: [att] });
}

async function handlePetsList(message) {
  const lines = Object.values(PETS).map(p => ({
    left: `${p.emoji} ${p.name}`,
    right: `${ar(p.price)} 💰 | ${p.description}`,
    rightColor: '#44ff88',
  }));
  const img = await generateSimpleImage('الحيوانات المتاحة 🐾', lines, '#ff88aa', '🐾');
  await sendImage(message, img, 'pets.png');
}

async function handleBuyPet(message, args) {
  const petName = args.join(' ');
  const pet = PETS[petName];
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (!pet) {
    const img = await generateSimpleImage('حيوان غير موجود', [{ text: 'استخدم: حيوانات لرؤية القائمة' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const owned = db.prepare('SELECT * FROM pets WHERE user_id = ? AND guild_id = ?').get(message.author.id, message.guild.id);
  if (owned) {
    const img = await generateSimpleImage('لديك حيوان!', [{ text: `لديك ${owned.pet_type} مسبقاً!` }, { text: 'لا يمكنك امتلاك أكثر من حيوان' }], '#ff8800', '⚠️');
    return sendImage(message, img);
  }
  if (user.cash < pet.price) {
    const img = await generateSimpleImage('رصيد غير كافٍ', [{ left: '💰 نقدك', right: `${ar(user.cash)} عملة` }, { left: '🏷️ السعر', right: `${ar(pet.price)} عملة` }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const petPetName = `${pet.name}_${message.author.username.slice(0, 5)}`;
  db.prepare('INSERT INTO pets (user_id, guild_id, pet_name, pet_type) VALUES (?, ?, ?, ?)').run(message.author.id, message.guild.id, petPetName, petName);
  updateUser(message.author.id, message.guild.id, { cash: user.cash - pet.price });
  addXp(message.author.id, message.guild.id, 30);
  const img = await generateSimpleImage('تم شراء الحيوان! 🎉', [
    { left: `${pet.emoji} الحيوان`, right: pet.name },
    { left: '✨ الميزة', right: pet.description, rightColor: '#44ff88' },
    { left: '💰 رصيدك', right: `${ar(user.cash - pet.price)} عملة`, rightColor: '#ffd700' },
  ], '#ff88aa', '🐾');
  await sendImage(message, img, 'buypet.png');
}

async function handleMyPet(message) {
  const pet = db.prepare('SELECT * FROM pets WHERE user_id = ? AND guild_id = ?').get(message.author.id, message.guild.id);
  if (!pet) {
    const img = await generateSimpleImage('لا يوجد حيوان', [{ text: 'ليس لديك حيوان أليف' }, { text: 'استخدم: شراء_حيوان [اسم]' }], '#888888', '🐾');
    return sendImage(message, img);
  }
  const info = PETS[pet.pet_type];
  const img = await generateSimpleImage(`حيواني ${info?.emoji || '🐾'}`, [
    { left: '🐾 النوع', right: pet.pet_type },
    { left: '📛 الاسم', right: pet.pet_name },
    { left: '⭐ المستوى', right: String(pet.level) },
    { left: '🍖 الجوع', right: `${pet.hunger}%`, rightColor: pet.hunger > 50 ? '#44ff88' : '#ff4444' },
    { left: '😊 السعادة', right: `${pet.happiness}%`, rightColor: pet.happiness > 50 ? '#44ff88' : '#ff4444' },
    { left: '✨ الميزة', right: info?.description || '؟', rightColor: '#ffd700' },
  ], '#ff88aa', '🐾');
  await sendImage(message, img, 'mypet.png');
}

async function handleFeedPet(message) {
  const pet = db.prepare('SELECT * FROM pets WHERE user_id = ? AND guild_id = ?').get(message.author.id, message.guild.id);
  if (!pet) {
    const img = await generateSimpleImage('لا يوجد حيوان', [{ text: 'ليس لديك حيوان أليف!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const left = getCooldownLeft(pet.last_feed, 2 * 60 * 60 * 1000);
  if (left > 0) {
    const img = await generateSimpleImage('انتظر!', [{ text: `⏳ الإطعام القادم بعد: ${formatCooldown(left)}` }], '#ff8800', '⏰');
    return sendImage(message, img);
  }
  const newHunger = Math.min(100, pet.hunger + 30);
  db.prepare('UPDATE pets SET hunger = ?, last_feed = ? WHERE user_id = ? AND guild_id = ?').run(newHunger, Math.floor(Date.now() / 1000), message.author.id, message.guild.id);
  const info = PETS[pet.pet_type];
  const img = await generateSimpleImage(`إطعام ${info?.emoji || '🐾'}`, [
    { left: '🍖 الجوع قبل', right: `${pet.hunger}%` },
    { left: '🍖 الجوع بعد', right: `${newHunger}%`, rightColor: '#44ff88' },
    { text: 'شكراً! حيوانك سعيد الآن 😊' },
  ], '#ff88aa', '🍖');
  await sendImage(message, img, 'feed.png');
}

async function handlePlayPet(message) {
  const pet = db.prepare('SELECT * FROM pets WHERE user_id = ? AND guild_id = ?').get(message.author.id, message.guild.id);
  if (!pet) {
    const img = await generateSimpleImage('لا يوجد حيوان', [{ text: 'ليس لديك حيوان أليف!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const left = getCooldownLeft(pet.last_play, 3 * 60 * 60 * 1000);
  if (left > 0) {
    const img = await generateSimpleImage('انتظر!', [{ text: `⏳ اللعب القادم بعد: ${formatCooldown(left)}` }], '#ff8800', '⏰');
    return sendImage(message, img);
  }
  const newHappiness = Math.min(100, pet.happiness + 25);
  db.prepare('UPDATE pets SET happiness = ?, last_play = ? WHERE user_id = ? AND guild_id = ?').run(newHappiness, Math.floor(Date.now() / 1000), message.author.id, message.guild.id);
  addXp(message.author.id, message.guild.id, 10);
  const info = PETS[pet.pet_type];
  const img = await generateSimpleImage(`لعب مع ${info?.emoji || '🐾'}`, [
    { left: '😊 السعادة قبل', right: `${pet.happiness}%` },
    { left: '😊 السعادة بعد', right: `${newHappiness}%`, rightColor: '#44ff88' },
    { text: 'حيوانك يحبك! 💕' },
  ], '#ff88aa', '🎾');
  await sendImage(message, img, 'play.png');
}

async function handleUpgradePet(message) {
  const pet = db.prepare('SELECT * FROM pets WHERE user_id = ? AND guild_id = ?').get(message.author.id, message.guild.id);
  if (!pet) {
    const img = await generateSimpleImage('لا يوجد حيوان', [{ text: 'ليس لديك حيوان أليف!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const cost = pet.level * 3000;
  if (user.cash < cost) {
    const img = await generateSimpleImage('رصيد غير كافٍ', [{ left: '💰 التكلفة', right: `${ar(cost)} عملة` }, { left: '💵 نقدك', right: `${ar(user.cash)} عملة` }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  db.prepare('UPDATE pets SET level = level + 1 WHERE user_id = ? AND guild_id = ?').run(message.author.id, message.guild.id);
  updateUser(message.author.id, message.guild.id, { cash: user.cash - cost });
  addXp(message.author.id, message.guild.id, 30);
  const info = PETS[pet.pet_type];
  const img = await generateSimpleImage(`ترقية ${info?.emoji || '🐾'}`, [
    { left: '⭐ المستوى الجديد', right: String(pet.level + 1), rightColor: '#ffd700' },
    { left: '💰 التكلفة', right: `${ar(cost)} عملة` },
  ], '#ff88aa', '⭐');
  await sendImage(message, img, 'upgradepet.png');
}

module.exports = { handlePetsList, handleBuyPet, handleMyPet, handleFeedPet, handlePlayPet, handleUpgradePet };
