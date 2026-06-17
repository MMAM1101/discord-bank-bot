const db = require('../database');
const { getUser, updateUser, addXp, getCooldownLeft, formatCooldown } = require('../utils/userManager');
const { generateGameResultImage, generateSimpleImage, ar } = require('../utils/imageGenerator');
const { AttachmentBuilder } = require('discord.js');

async function sendImage(message, buffer, filename = 'result.png') {
  const att = new AttachmentBuilder(buffer, { name: filename });
  await message.reply({ files: [att] });
}

function hasTool(userId, guildId, toolName) {
  return !!db.prepare('SELECT id FROM inventory WHERE user_id = ? AND guild_id = ? AND item_name = ? AND quantity > 0').get(userId, guildId, toolName);
}

async function handleCrime(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const now = Math.floor(Date.now() / 1000);
  if (user.prison_until > now) {
    const img = await generateSimpleImage('أنت في السجن! 🔒', [
      { text: `تخرج بعد: ${formatCooldown((user.prison_until - now) * 1000)}` }
    ], '#ff4444', '🔒');
    return sendImage(message, img);
  }
  const cooldown = 30 * 60 * 1000;
  const left = getCooldownLeft(user.last_crime, cooldown);
  if (left > 0) {
    const img = await generateSimpleImage('انتظر!', [{ text: `⏳ الجريمة القادمة بعد: ${formatCooldown(left)}` }], '#ff8800', '⏰');
    return sendImage(message, img);
  }
  const hasWeapon = hasTool(user.id, message.guild.id, 'سلاح');
  const successRate = hasWeapon ? 0.65 : 0.45;
  const isSuccess = Math.random() < successRate;
  const crimes = ['سرقة متجر', 'نصب واحتيال', 'تزوير وثائق', 'سرقة سيارة', 'اختراق حسابات'];
  const crime = crimes[Math.floor(Math.random() * crimes.length)];

  if (isSuccess) {
    const earned = 500 + Math.floor(Math.random() * 2000);
    updateUser(message.author.id, message.guild.id, { cash: user.cash + earned, last_crime: now });
    addXp(message.author.id, message.guild.id, 30);
    const img = await generateGameResultImage('جريمة ناجحة 🥷', `${crime} - نجاح!`, earned, true, [`رصيدك: ${ar(user.cash + earned)} عملة`]);
    return sendImage(message, img, 'crime.png');
  } else {
    const fine = 200 + Math.floor(Math.random() * 800);
    const prisonTime = 10 * 60;
    const actualFine = Math.min(fine, user.cash);
    updateUser(message.author.id, message.guild.id, {
      cash: user.cash - actualFine,
      last_crime: now,
      prison_until: now + prisonTime,
    });
    const img = await generateGameResultImage('فشلت وسُجنت! 🚔', `${crime} - فشل! غرامة + سجن 10 دقائق`, actualFine, false,
      [`غرامة: ${ar(actualFine)} عملة`, `رصيدك: ${ar(user.cash - actualFine)} عملة`]);
    return sendImage(message, img, 'crime.png');
  }
}

async function handleSteal(message, args) {
  const target = message.mentions.users.first();
  if (!target) {
    const img = await generateSimpleImage('خطأ', [{ text: 'الاستخدام: سرقة @عضو' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const victim = getUser(target.id, message.guild.id, target.username);
  const now = Math.floor(Date.now() / 1000);
  if (user.prison_until > now) {
    const img = await generateSimpleImage('أنت في السجن! 🔒', [{ text: `تخرج بعد: ${formatCooldown((user.prison_until - now) * 1000)}` }], '#ff4444', '🔒');
    return sendImage(message, img);
  }
  if (victim.cash < 100) {
    const img = await generateSimpleImage('لا يستحق!', [{ text: `${target.username} فقير جداً!` }], '#ff8800', '⚠️');
    return sendImage(message, img);
  }
  const hasGloves = hasTool(user.id, message.guild.id, 'قفازات');
  const successRate = hasGloves ? 0.55 : 0.35;
  const isSuccess = Math.random() < successRate;
  if (isSuccess) {
    const stolen = Math.floor(victim.cash * 0.1 + Math.random() * victim.cash * 0.1);
    updateUser(message.author.id, message.guild.id, { cash: user.cash + stolen });
    updateUser(target.id, message.guild.id, { cash: victim.cash - stolen });
    addXp(message.author.id, message.guild.id, 25);
    const img = await generateGameResultImage('سرقة ناجحة! 💰', `سرقت من ${target.username}`, stolen, true, [`رصيدك: ${ar(user.cash + stolen)} عملة`]);
    return sendImage(message, img, 'steal.png');
  } else {
    const fine = Math.floor(victim.cash * 0.05);
    updateUser(message.author.id, message.guild.id, { cash: user.cash - fine, prison_until: now + 300 });
    const img = await generateGameResultImage('فشلت في السرقة! 🚔', `تم القبض عليك من ${target.username}`, fine, false,
      [`غرامة: ${ar(fine)} عملة`, 'سجن 5 دقائق']);
    return sendImage(message, img, 'steal.png');
  }
}

async function handleRobbery(message, args) {
  const target = message.mentions.users.first();
  if (!target) {
    const img = await generateSimpleImage('خطأ', [{ text: 'الاستخدام: سطو @عضو' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const victim = getUser(target.id, message.guild.id, target.username);
  const now = Math.floor(Date.now() / 1000);
  if (victim.bank < 500) {
    const img = await generateSimpleImage('لا يستحق!', [{ text: `بنك ${target.username} فارغ تقريباً!` }], '#ff8800', '⚠️');
    return sendImage(message, img);
  }
  const hasWeapon = hasTool(user.id, message.guild.id, 'سلاح');
  const isSuccess = Math.random() < (hasWeapon ? 0.4 : 0.25);
  if (isSuccess) {
    const stolen = Math.floor(victim.bank * 0.15);
    updateUser(message.author.id, message.guild.id, { cash: user.cash + stolen });
    updateUser(target.id, message.guild.id, { bank: victim.bank - stolen });
    addXp(message.author.id, message.guild.id, 40);
    const img = await generateGameResultImage('سطو ناجح! 🏦', `سطوت على بنك ${target.username}`, stolen, true, [`رصيدك: ${ar(user.cash + stolen)} عملة`]);
    return sendImage(message, img, 'robbery.png');
  } else {
    const fine = Math.floor(victim.bank * 0.05);
    updateUser(message.author.id, message.guild.id, { cash: Math.max(0, user.cash - fine), prison_until: now + 900 });
    const img = await generateGameResultImage('فشل السطو! 🚔', 'الشرطة القبضت عليك!', fine, false, ['سجن 15 دقيقة', `غرامة: ${ar(fine)} عملة`]);
    return sendImage(message, img, 'robbery.png');
  }
}

async function handleSmuggle(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const now = Math.floor(Date.now() / 1000);
  const isSuccess = Math.random() < 0.5;
  if (isSuccess) {
    const earned = 1000 + Math.floor(Math.random() * 3000);
    updateUser(message.author.id, message.guild.id, { cash: user.cash + earned });
    addXp(message.author.id, message.guild.id, 35);
    const img = await generateGameResultImage('تهريب ناجح! 📦', 'وصلت البضاعة بأمان!', earned, true, [`رصيدك: ${ar(user.cash + earned)} عملة`]);
    return sendImage(message, img, 'smuggle.png');
  } else {
    const fine = 500 + Math.floor(Math.random() * 1000);
    updateUser(message.author.id, message.guild.id, { cash: Math.max(0, user.cash - fine), prison_until: now + 1200 });
    const img = await generateGameResultImage('ضبطت في التهريب! 🚔', 'الجمارك مسكتك!', fine, false, ['سجن 20 دقيقة']);
    return sendImage(message, img, 'smuggle.png');
  }
}

async function handleEmbezzle(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (!user.job) {
    const img = await generateSimpleImage('لا توجد وظيفة', [{ text: 'تحتاج وظيفة للاختلاس!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const now = Math.floor(Date.now() / 1000);
  const isSuccess = Math.random() < 0.4;
  if (isSuccess) {
    const earned = 2000 + Math.floor(Math.random() * 5000);
    updateUser(message.author.id, message.guild.id, { cash: user.cash + earned });
    addXp(message.author.id, message.guild.id, 50);
    const img = await generateGameResultImage('اختلاس ناجح! 💼', 'اختلست من الشركة!', earned, true, [`رصيدك: ${ar(user.cash + earned)} عملة`]);
    return sendImage(message, img, 'embezzle.png');
  } else {
    updateUser(message.author.id, message.guild.id, { job: null, prison_until: now + 1800 });
    const img = await generateGameResultImage('ضُبطت في الاختلاس! 🚔', 'فقدت وظيفتك وسُجنت!', 0, false, ['سجن 30 دقيقة', 'فقدت وظيفتك!']);
    return sendImage(message, img, 'embezzle.png');
  }
}

async function handleEscape(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const now = Math.floor(Date.now() / 1000);
  if (user.prison_until <= now) {
    const img = await generateSimpleImage('لست في السجن', [{ text: 'أنت حر! لا تحتاج للهروب' }], '#44ff88', '✅');
    return sendImage(message, img);
  }
  const remaining = user.prison_until - now;
  const isSuccess = Math.random() < 0.35;
  if (isSuccess) {
    updateUser(message.author.id, message.guild.id, { prison_until: 0 });
    const img = await generateGameResultImage('هروب ناجح! 🏃', 'هربت من السجن!', 0, true, ['أنت حر الآن!']);
    return sendImage(message, img, 'escape.png');
  } else {
    updateUser(message.author.id, message.guild.id, { prison_until: now + remaining + 600 });
    const img = await generateGameResultImage('فشل الهروب! 🔒', 'أُعيدت للزنزانة!', 0, false, ['إضافة 10 دقائق للسجن!']);
    return sendImage(message, img, 'escape.png');
  }
}

module.exports = { handleCrime, handleSteal, handleRobbery, handleSmuggle, handleEmbezzle, handleEscape };
