const db = require('../database');
const { getUser, updateUser, getRank, addXp, formatNumber, getCooldownLeft, formatCooldown } = require('../utils/userManager');
const {
  generateBalanceImage, generateLeaderboardImage,
  generateSimpleImage, generateProfileImage, ar
} = require('../utils/imageGenerator');
const { AttachmentBuilder } = require('discord.js');

async function sendImage(message, buffer, filename = 'result.png') {
  const att = new AttachmentBuilder(buffer, { name: filename });
  await message.reply({ files: [att] });
}

async function handleBalance(message, args, isSelf = true) {
  const target = isSelf ? message.author : (message.mentions.users.first() || message.author);
  const user = getUser(target.id, message.guild.id, target.username);
  const img = await generateBalanceImage(user);
  await sendImage(message, img, 'balance.png');
}

async function handleDeposit(message, args) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const amount = args[0] === 'كل' ? user.cash : parseInt(args[0]);
  if (isNaN(amount) || amount <= 0) {
    const img = await generateSimpleImage('خطأ', [{ text: 'اكتب مبلغاً صحيحاً مثلاً: ايداع 1000' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  if (user.cash < amount) {
    const img = await generateSimpleImage('رصيد غير كافٍ', [{ text: `💵 نقدك: ${ar(user.cash)}`, highlight: true }, { text: `المبلغ المطلوب: ${ar(amount)}` }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  updateUser(message.author.id, message.guild.id, { cash: user.cash - amount, bank: user.bank + amount });
  addXp(message.author.id, message.guild.id, 5);
  const img = await generateSimpleImage('تم الإيداع ✅', [
    { left: '💵 تم إيداع', right: `${ar(amount)} عملة`, rightColor: '#44ff88' },
    { left: '🏦 رصيد البنك الجديد', right: `${ar(user.bank + amount)} عملة`, rightColor: '#7aadff' },
    { left: '💰 النقد المتبقي', right: `${ar(user.cash - amount)} عملة`, rightColor: '#ffd700' },
  ], '#44ff88', '🏦');
  await sendImage(message, img, 'deposit.png');
}

async function handleWithdraw(message, args) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const amount = args[0] === 'كل' ? user.bank : parseInt(args[0]);
  if (isNaN(amount) || amount <= 0) {
    const img = await generateSimpleImage('خطأ', [{ text: 'اكتب مبلغاً صحيحاً مثلاً: سحب 1000' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  if (user.bank < amount) {
    const img = await generateSimpleImage('رصيد غير كافٍ', [{ text: `🏦 بنكك: ${ar(user.bank)}` }, { text: `المبلغ: ${ar(amount)}` }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  updateUser(message.author.id, message.guild.id, { cash: user.cash + amount, bank: user.bank - amount });
  addXp(message.author.id, message.guild.id, 5);
  const img = await generateSimpleImage('تم السحب ✅', [
    { left: '💵 تم سحب', right: `${ar(amount)} عملة`, rightColor: '#44ff88' },
    { left: '💰 نقدك الجديد', right: `${ar(user.cash + amount)} عملة`, rightColor: '#ffd700' },
    { left: '🏦 رصيد البنك المتبقي', right: `${ar(user.bank - amount)} عملة`, rightColor: '#7aadff' },
  ], '#44ff88', '💵');
  await sendImage(message, img, 'withdraw.png');
}

async function handleTransfer(message, args) {
  const target = message.mentions.users.first();
  const amount = parseInt(args[1]);
  if (!target || isNaN(amount) || amount <= 0) {
    const img = await generateSimpleImage('خطأ', [{ text: 'الاستخدام: تحويل @عضو 1000' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  if (target.id === message.author.id) {
    const img = await generateSimpleImage('خطأ', [{ text: 'لا يمكنك تحويل لنفسك!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const sender = getUser(message.author.id, message.guild.id, message.author.username);
  if (sender.cash < amount) {
    const img = await generateSimpleImage('رصيد غير كافٍ', [{ text: `💵 نقدك: ${ar(sender.cash)}` }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const receiver = getUser(target.id, message.guild.id, target.username);
  updateUser(message.author.id, message.guild.id, { cash: sender.cash - amount });
  updateUser(target.id, message.guild.id, { cash: receiver.cash + amount });
  addXp(message.author.id, message.guild.id, 10);
  const img = await generateSimpleImage('تم التحويل 💸', [
    { left: '📤 من', right: message.author.username },
    { left: '📥 إلى', right: target.username },
    { left: '💰 المبلغ', right: `${ar(amount)} عملة`, rightColor: '#44ff88' },
    { left: '💵 رصيدك المتبقي', right: `${ar(sender.cash - amount)} عملة`, rightColor: '#ffd700' },
  ], '#a044ff', '💸');
  await sendImage(message, img, 'transfer.png');
}

async function handleSalary(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (!user.job) {
    const img = await generateSimpleImage('لا توجد وظيفة', [{ text: 'احصل على وظيفة أولاً!' }, { text: 'استخدم: توظف [وظيفة]' }], '#ff8800', '⚠️');
    return sendImage(message, img);
  }
  const cooldown = 3 * 60 * 60 * 1000;
  const left = getCooldownLeft(user.last_salary, cooldown);
  if (left > 0) {
    const img = await generateSimpleImage('انتظر!', [{ text: `⏳ الراتب القادم بعد: ${formatCooldown(left)}` }], '#ff8800', '⏰');
    return sendImage(message, img);
  }
  const { JOBS } = require('../data/shopItems');
  const job = JOBS[user.job];
  const salary = job ? job.salary * user.job_level : 200;
  updateUser(message.author.id, message.guild.id, { cash: user.cash + salary, last_salary: Math.floor(Date.now() / 1000) });
  addXp(message.author.id, message.guild.id, 20);
  const img = await generateSimpleImage('راتب! 💰', [
    { left: '👔 الوظيفة', right: user.job },
    { left: '💵 الراتب', right: `${ar(salary)} عملة`, rightColor: '#44ff88' },
    { left: '💰 رصيدك الآن', right: `${ar(user.cash + salary)} عملة`, rightColor: '#ffd700' },
    { text: '⏰ الراتب القادم بعد 3 ساعات' },
  ], '#44ff88', '💼');
  await sendImage(message, img, 'salary.png');
}

async function handleWeekly(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const cooldown = 7 * 24 * 60 * 60 * 1000;
  const left = getCooldownLeft(user.last_weekly, cooldown);
  if (left > 0) {
    const img = await generateSimpleImage('انتظر!', [{ text: `⏳ المكافأة الأسبوعية بعد: ${formatCooldown(left)}` }], '#ff8800', '⏰');
    return sendImage(message, img);
  }
  const amount = 5000 + Math.floor(Math.random() * 5000);
  updateUser(message.author.id, message.guild.id, { cash: user.cash + amount, last_weekly: Math.floor(Date.now() / 1000) });
  addXp(message.author.id, message.guild.id, 100);
  const img = await generateSimpleImage('مكافأة أسبوعية! 🎁', [
    { left: '🎁 المبلغ', right: `${ar(amount)} عملة`, rightColor: '#44ff88' },
    { left: '💰 رصيدك الآن', right: `${ar(user.cash + amount)} عملة`, rightColor: '#ffd700' },
    { text: '⏰ القادمة بعد أسبوع' },
  ], '#a044ff', '🎁');
  await sendImage(message, img, 'weekly.png');
}

async function handleMonthly(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const cooldown = 30 * 24 * 60 * 60 * 1000;
  const left = getCooldownLeft(user.last_monthly, cooldown);
  if (left > 0) {
    const img = await generateSimpleImage('انتظر!', [{ text: `⏳ المكافأة الشهرية بعد: ${formatCooldown(left)}` }], '#ff8800', '⏰');
    return sendImage(message, img);
  }
  const amount = 50000 + Math.floor(Math.random() * 50000);
  updateUser(message.author.id, message.guild.id, { cash: user.cash + amount, last_monthly: Math.floor(Date.now() / 1000) });
  addXp(message.author.id, message.guild.id, 500);
  const img = await generateSimpleImage('مكافأة شهرية! 🏆', [
    { left: '🏆 المبلغ', right: `${ar(amount)} عملة`, rightColor: '#ffd700' },
    { left: '💰 رصيدك الآن', right: `${ar(user.cash + amount)} عملة`, rightColor: '#44ff88' },
    { text: '⏰ القادمة بعد شهر' },
  ], '#ffd700', '🏆');
  await sendImage(message, img, 'monthly.png');
}

async function handleBonus(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const cooldown = 24 * 60 * 60 * 1000;
  const left = getCooldownLeft(user.last_bonus, cooldown);
  if (left > 0) {
    const img = await generateSimpleImage('انتظر!', [{ text: `⏳ المكافأة اليومية بعد: ${formatCooldown(left)}` }], '#ff8800', '⏰');
    return sendImage(message, img);
  }
  const amount = 500 + Math.floor(Math.random() * 1500);
  updateUser(message.author.id, message.guild.id, { cash: user.cash + amount, last_bonus: Math.floor(Date.now() / 1000) });
  addXp(message.author.id, message.guild.id, 50);
  const img = await generateSimpleImage('مكافأة يومية! ✨', [
    { left: '✨ المبلغ', right: `${ar(amount)} عملة`, rightColor: '#44ff88' },
    { left: '💰 رصيدك الآن', right: `${ar(user.cash + amount)} عملة`, rightColor: '#ffd700' },
    { text: '⏰ القادمة بعد 24 ساعة' },
  ], '#44aaff', '🎁');
  await sendImage(message, img, 'bonus.png');
}

async function handleWealth(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const total = (user.cash || 0) + (user.bank || 0);
  const props = db.prepare('SELECT * FROM properties WHERE user_id = ? AND guild_id = ?').all(message.author.id, message.guild.id);
  const { PROPERTIES } = require('../data/shopItems');
  const propValue = props.reduce((sum, p) => sum + (PROPERTIES[p.property_name]?.price || 0), 0);
  const stocks = db.prepare('SELECT us.*, s.price FROM user_stocks us JOIN stocks s ON us.symbol = s.symbol WHERE us.user_id = ? AND us.guild_id = ?').all(message.author.id, message.guild.id);
  const stockValue = stocks.reduce((sum, s) => sum + (s.quantity * s.price), 0);
  const grandTotal = total + propValue + stockValue;
  const { rank, emoji } = getRank(grandTotal);
  const img = await generateSimpleImage('ثروتي الإجمالية', [
    { left: '💵 نقد', right: `${ar(user.cash)} عملة`, rightColor: '#7aadff' },
    { left: '🏦 بنك', right: `${ar(user.bank)} عملة`, rightColor: '#7aadff' },
    { left: '🥇 ذهب', right: `${ar(user.gold)} قطعة`, rightColor: '#ffd700' },
    { left: '💎 جواهر', right: `${ar(user.gems)} قطعة`, rightColor: '#88aaff' },
    { divider: true },
    { left: '🏠 قيمة العقارات', right: `${ar(propValue)} عملة`, rightColor: '#ff8844' },
    { left: '📈 قيمة الأسهم', right: `${ar(stockValue)} عملة`, rightColor: '#44ff88' },
    { divider: true },
    { left: `${emoji} الإجمالي`, right: `${ar(grandTotal)} عملة`, rightColor: '#ffd700', highlight: true },
    { text: `الرتبة: ${rank}`, highlight: true },
  ], '#ffd700', '💎');
  await sendImage(message, img, 'wealth.png');
}

async function handleTop(message) {
  const users = db.prepare(`SELECT *, (cash + bank) as total FROM users WHERE guild_id = ? ORDER BY total DESC LIMIT 10`).all(message.guild.id);
  const img = await generateLeaderboardImage(users, 'أغنى اللاعبين');
  await sendImage(message, img, 'top.png');
}

async function handleProfile(message, args) {
  const target = message.mentions.users.first() || message.author;
  const user = getUser(target.id, message.guild.id, target.username);
  const props = db.prepare('SELECT * FROM properties WHERE user_id = ? AND guild_id = ?').all(target.id, message.guild.id);
  const pets = db.prepare('SELECT * FROM pets WHERE user_id = ? AND guild_id = ?').all(target.id, message.guild.id);
  const img = await generateProfileImage(user, props, pets);
  await sendImage(message, img, 'profile.png');
}

module.exports = {
  handleBalance, handleDeposit, handleWithdraw, handleTransfer,
  handleSalary, handleWeekly, handleMonthly, handleBonus,
  handleWealth, handleTop, handleProfile,
};
