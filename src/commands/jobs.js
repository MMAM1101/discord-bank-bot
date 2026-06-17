const db = require('../database');
const { getUser, updateUser, addXp, getCooldownLeft, formatCooldown } = require('../utils/userManager');
const { generateSimpleImage, ar } = require('../utils/imageGenerator');
const { AttachmentBuilder } = require('discord.js');
const { JOBS } = require('../data/shopItems');

async function sendImage(message, buffer, filename = 'result.png') {
  const att = new AttachmentBuilder(buffer, { name: filename });
  await message.reply({ files: [att] });
}

async function handleJobs(message) {
  const lines = Object.entries(JOBS).map(([key, j]) => ({
    left: `${j.emoji} ${j.name}`,
    right: `${ar(j.salary)} عملة/3ساعات`,
    rightColor: '#ffd700',
  }));
  const img = await generateSimpleImage('قائمة الوظائف', lines, '#4a9eff', '💼');
  await sendImage(message, img, 'jobs.png');
}

async function handleHire(message, args) {
  const jobName = args.slice(0).join(' ');
  const job = JOBS[jobName];
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (!job) {
    const img = await generateSimpleImage('وظيفة غير موجودة', [{ text: 'استخدم أمر: وظائف لرؤية القائمة' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  if (user.level < job.requirements.level) {
    const img = await generateSimpleImage('مستوى غير كافٍ', [
      { left: '⭐ مستواك', right: String(user.level) },
      { left: '⭐ المطلوب', right: String(job.requirements.level) },
    ], '#ff4444', '❌');
    return sendImage(message, img);
  }
  if (user.cash < job.requirements.cash) {
    const img = await generateSimpleImage('رصيد غير كافٍ', [
      { left: '💰 نقدك', right: `${ar(user.cash)} عملة` },
      { left: '💰 المطلوب', right: `${ar(job.requirements.cash)} عملة` },
    ], '#ff4444', '❌');
    return sendImage(message, img);
  }
  updateUser(message.author.id, message.guild.id, { job: jobName, job_level: 1 });
  const img = await generateSimpleImage('تم التوظيف! 🎉', [
    { left: '👔 الوظيفة', right: `${job.emoji} ${job.name}` },
    { left: '💰 الراتب', right: `${ar(job.salary)} عملة/3ساعات`, rightColor: '#ffd700' },
    { text: 'استخدم أمر: راتب للحصول على راتبك' },
  ], '#44ff88', '💼');
  await sendImage(message, img, 'hire.png');
}

async function handleMyJob(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (!user.job) {
    const img = await generateSimpleImage('لا توجد وظيفة', [{ text: 'ليس لديك وظيفة حالياً' }, { text: 'استخدم: توظف [وظيفة]' }], '#ff8800', '⚠️');
    return sendImage(message, img);
  }
  const job = JOBS[user.job];
  const salary = job ? job.salary * (user.job_level || 1) : 0;
  const img = await generateSimpleImage('وظيفتي 💼', [
    { left: '👔 الوظيفة', right: `${job?.emoji || ''} ${user.job}` },
    { left: '⭐ مستوى الوظيفة', right: String(user.job_level || 1) },
    { left: '💰 الراتب الحالي', right: `${ar(salary)} عملة`, rightColor: '#ffd700' },
    { text: 'استخدم: ترقية لترقية وظيفتك' },
  ], '#4a9eff', '💼');
  await sendImage(message, img, 'myjob.png');
}

async function handleResign(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (!user.job) {
    const img = await generateSimpleImage('لا توجد وظيفة', [{ text: 'ليس لديك وظيفة لتستقيل منها' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const oldJob = user.job;
  updateUser(message.author.id, message.guild.id, { job: null, job_level: 1 });
  const img = await generateSimpleImage('استقالة ✅', [
    { left: '👋 استقلت من', right: oldJob },
    { text: 'يمكنك التوظف مجدداً في أي وقت' },
  ], '#ff8800', '👋');
  await sendImage(message, img, 'resign.png');
}

async function handleUpgrade(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (!user.job) {
    const img = await generateSimpleImage('لا توجد وظيفة', [{ text: 'احصل على وظيفة أولاً!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const currentLevel = user.job_level || 1;
  const upgradeCost = currentLevel * 5000;
  if (user.cash < upgradeCost) {
    const img = await generateSimpleImage('رصيد غير كافٍ', [
      { left: '💰 تكلفة الترقية', right: `${ar(upgradeCost)} عملة` },
      { left: '💰 نقدك', right: `${ar(user.cash)} عملة` },
    ], '#ff4444', '❌');
    return sendImage(message, img);
  }
  updateUser(message.author.id, message.guild.id, {
    job_level: currentLevel + 1,
    cash: user.cash - upgradeCost,
  });
  addXp(message.author.id, message.guild.id, 50);
  const job = JOBS[user.job];
  const newSalary = job ? job.salary * (currentLevel + 1) : 0;
  const img = await generateSimpleImage('تمت الترقية! 🎉', [
    { left: '⬆️ المستوى الجديد', right: String(currentLevel + 1), rightColor: '#ffd700' },
    { left: '💰 الراتب الجديد', right: `${ar(newSalary)} عملة`, rightColor: '#44ff88' },
    { left: '💸 تكلفة الترقية', right: `${ar(upgradeCost)} عملة` },
  ], '#44ff88', '⬆️');
  await sendImage(message, img, 'upgrade.png');
}

async function handleWork(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (!user.job) {
    const img = await generateSimpleImage('لا توجد وظيفة', [{ text: 'احصل على وظيفة أولاً!' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const cooldown = 30 * 60 * 1000;
  const left = getCooldownLeft(user.last_work, cooldown);
  if (left > 0) {
    const img = await generateSimpleImage('انتظر!', [{ text: `⏳ العمل القادم بعد: ${formatCooldown(left)}` }], '#ff8800', '⏰');
    return sendImage(message, img);
  }
  const job = JOBS[user.job];
  const base = job ? Math.floor(job.salary * 0.3) : 60;
  const earned = base + Math.floor(Math.random() * base * 0.5);
  updateUser(message.author.id, message.guild.id, { cash: user.cash + earned, last_work: Math.floor(Date.now() / 1000) });
  addXp(message.author.id, message.guild.id, 15);
  const workMessages = ['أنهيت مهمتك بنجاح!', 'عمل ممتاز!', 'تفوقت على المتوقع!', 'أداء رائع اليوم!'];
  const msg = workMessages[Math.floor(Math.random() * workMessages.length)];
  const img = await generateSimpleImage('دوام انتهى! 🏢', [
    { text: msg },
    { left: '💰 الكسب', right: `${ar(earned)} عملة`, rightColor: '#44ff88' },
    { left: '💵 رصيدك الآن', right: `${ar(user.cash + earned)} عملة`, rightColor: '#ffd700' },
    { text: '⏰ العمل القادم بعد 30 دقيقة' },
  ], '#4a9eff', '🏢');
  await sendImage(message, img, 'work.png');
}

module.exports = { handleJobs, handleHire, handleMyJob, handleResign, handleUpgrade, handleWork };
