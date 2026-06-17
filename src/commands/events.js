const db = require('../database');
const { getUser, updateUser, addXp } = require('../utils/userManager');
const { generateSimpleImage, ar } = require('../utils/imageGenerator');
const { AttachmentBuilder } = require('discord.js');

async function sendImage(message, buffer, filename = 'result.png') {
  const att = new AttachmentBuilder(buffer, { name: filename });
  await message.reply({ files: [att] });
}

async function handleEvent(message) {
  const events = [
    { name: 'مضاعفة الأرباح', desc: 'كل أرباح العمل مضاعفة لساعة!', reward: 1000 },
    { name: 'نزول الذهب', desc: 'ذهب ينزل من السماء!', reward: 500 },
    { name: 'عيد التجار', desc: 'خصم 20% على المتجر لفترة محدودة!', reward: 300 },
    { name: 'ليلة الحظ', desc: 'نسبة الفوز في الألعاب مرتفعة!', reward: 0 },
  ];
  const event = events[Math.floor(Date.now() / 86400000) % events.length];
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (event.reward > 0) {
    updateUser(message.author.id, message.guild.id, { cash: user.cash + event.reward });
  }
  const img = await generateSimpleImage(`🎉 حدث اليوم!`, [
    { text: event.name, highlight: true },
    { text: event.desc },
    event.reward > 0 ? { left: '🎁 مكافأة المشاركة', right: `${ar(event.reward)} عملة`, rightColor: '#44ff88' } : { text: 'لا يوجد مكافأة مباشرة' },
  ], '#ff88aa', '🎉');
  await sendImage(message, img, 'event.png');
}

async function handleLottery(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const ticketCost = 500;
  if (user.cash < ticketCost) {
    const img = await generateSimpleImage('رصيد غير كافٍ', [{ text: `تكلفة التذكرة: ${ar(ticketCost)} عملة` }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  updateUser(message.author.id, message.guild.id, { cash: user.cash - ticketCost });
  const isWin = Math.random() < 0.1;
  const prize = isWin ? 10000 + Math.floor(Math.random() * 40000) : 0;
  if (isWin) {
    updateUser(message.author.id, message.guild.id, { cash: user.cash - ticketCost + prize });
  }
  const img = await generateSimpleImage('اليانصيب 🎟️', [
    { left: '🎟️ ثمن التذكرة', right: `${ar(ticketCost)} عملة` },
    { left: isWin ? '🏆 نتيجة' : '💔 نتيجة', right: isWin ? `ربحت ${ar(prize)} عملة!` : 'لم تفز هذه المرة', rightColor: isWin ? '#ffd700' : '#888888' },
    { text: 'نسبة الفوز: 10% | جائزة: 10,000-50,000' },
  ], isWin ? '#ffd700' : '#888888', '🎟️');
  await sendImage(message, img, 'lottery.png');
}

async function handleRandomDraw(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const prizes = [
    { name: 'لا شيء 😅', value: 0 },
    { name: '50 عملة 💰', value: 50 },
    { name: '200 عملة 💰', value: 200 },
    { name: '500 عملة 🎉', value: 500 },
    { name: '1000 عملة 🤩', value: 1000 },
    { name: '5000 عملة 🎊', value: 5000 },
    { name: 'ذهبة واحدة 🥇', value: 0, gold: 1 },
  ];
  const weights = [30, 25, 20, 12, 8, 4, 1];
  let rand = Math.random() * 100, cumulative = 0, prize = prizes[0];
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (rand <= cumulative) { prize = prizes[i]; break; }
  }
  const updateData = {};
  if (prize.value > 0) updateData.cash = user.cash + prize.value;
  if (prize.gold) updateData.gold = (user.gold || 0) + 1;
  if (Object.keys(updateData).length) updateUser(message.author.id, message.guild.id, updateData);

  const img = await generateSimpleImage('السحب العشوائي 🎲', [
    { text: `🎁 جائزتك: ${prize.name}`, highlight: true },
    { text: 'جرب مرة أخرى غداً!' },
  ], '#a044ff', '🎲');
  await sendImage(message, img, 'draw.png');
}

async function handleRace(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const entryFee = 1000;
  if (user.cash < entryFee) {
    const img = await generateSimpleImage('رصيد غير كافٍ', [{ text: `رسوم الدخول: ${ar(entryFee)} عملة` }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  updateUser(message.author.id, message.guild.id, { cash: user.cash - entryFee });
  const position = Math.floor(Math.random() * 5) + 1;
  const prizes = [5000, 2500, 1000, 500, 0];
  const prize = prizes[position - 1];
  const emojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  if (prize > 0) updateUser(message.author.id, message.guild.id, { cash: user.cash - entryFee + prize });
  const img = await generateSimpleImage('نتيجة السباق 🏎️', [
    { left: '🏁 مركزك', right: `${emojis[position - 1]} المركز ${position}`, rightColor: position <= 3 ? '#ffd700' : '#888888' },
    { left: prize > 0 ? '🏆 جائزة' : '💔 جائزة', right: prize > 0 ? `${ar(prize)} عملة` : 'لا شيء', rightColor: prize > 0 ? '#44ff88' : '#888888' },
    { left: '💰 رسوم الدخول', right: `${ar(entryFee)} عملة` },
  ], position <= 3 ? '#ffd700' : '#888888', '🏎️');
  await sendImage(message, img, 'race.png');
}

async function handleAuction(message) {
  const items = ['سيارة فارهة 🏎️', 'لوحة فنية نادرة 🖼️', 'قطعة ذهب 🥇', 'تمثال أثري 🏺'];
  const item = items[Math.floor(Math.random() * items.length)];
  const price = 5000 + Math.floor(Math.random() * 20000);
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const won = Math.random() < 0.4;
  if (won && user.cash >= price) {
    updateUser(message.author.id, message.guild.id, { cash: user.cash - price });
    const img = await generateSimpleImage('فزت بالمزاد! 🎉', [
      { left: '🏆 العنصر', right: item },
      { left: '💰 السعر النهائي', right: `${ar(price)} عملة`, rightColor: '#ffd700' },
      { text: 'أضيف العنصر لحقيبتك!' },
    ], '#ffd700', '🎉');
    return sendImage(message, img, 'auction.png');
  }
  const img = await generateSimpleImage('المزاد 🔨', [
    { left: '📦 العنصر المعروض', right: item },
    { left: '💰 السعر الحالي', right: `${ar(price)} عملة` },
    { text: won ? 'لا يكفي رصيدك!' : 'تجاوزك أحد بسعر أعلى!' },
  ], '#ff8844', '🔨');
  await sendImage(message, img, 'auction.png');
}

module.exports = { handleEvent, handleLottery, handleRandomDraw, handleRace, handleAuction };
