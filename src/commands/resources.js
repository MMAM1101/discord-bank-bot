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

function makeAction(options) {
  return async function(message) {
    const user = getUser(message.author.id, message.guild.id, message.author.username);
    const left = getCooldownLeft(user[options.cooldownField], options.cooldown);
    if (left > 0) {
      const img = await generateSimpleImage('انتظر!', [{ text: `⏳ ${options.name} القادم بعد: ${formatCooldown(left)}` }], '#ff8800', '⏰');
      return sendImage(message, img);
    }
    const hasBoost = options.toolName ? hasTool(user.id, message.guild.id, options.toolName) : false;
    const base = options.baseMin + Math.floor(Math.random() * (options.baseMax - options.baseMin));
    const earned = hasBoost ? Math.floor(base * 1.3) : base;
    const updateData = { cash: user.cash + earned };
    updateData[options.cooldownField] = Math.floor(Date.now() / 1000);
    updateUser(message.author.id, message.guild.id, updateData);
    addXp(message.author.id, message.guild.id, options.xp || 15);
    const msgs = options.messages || [`حصلت على ${ar(earned)} عملة!`];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    const img = await generateGameResultImage(
      `${options.emoji} ${options.title}`,
      msg,
      earned,
      true,
      [hasBoost ? `+30% بونص الأداة!` : '', `رصيدك: ${ar(user.cash + earned)} عملة`].filter(Boolean)
    );
    await sendImage(message, img, `${options.cooldownField}.png`);
  };
}

const handleFish = makeAction({
  name: 'صيد', title: 'صيد السمك', emoji: '🎣',
  cooldownField: 'last_fish', cooldown: 45 * 60 * 1000,
  baseMin: 150, baseMax: 600, xp: 20, toolName: 'عصا_صيد',
  messages: ['صدت سمكة كبيرة!', 'السمك وفير اليوم!', 'نهر هادئ وصيد ممتاز!'],
});

const handleMine = makeAction({
  name: 'تعدين', title: 'التعدين', emoji: '⛏️',
  cooldownField: 'last_mine', cooldown: 60 * 60 * 1000,
  baseMin: 200, baseMax: 800, xp: 25, toolName: 'معول',
  messages: ['وجدت معادن نفيسة!', 'المنجم غني اليوم!', 'حفرت عميقاً ووجدت خيراً!'],
});

const handleChop = makeAction({
  name: 'احتطاب', title: 'الاحتطاب', emoji: '🪓',
  cooldownField: 'last_chop', cooldown: 40 * 60 * 1000,
  baseMin: 100, baseMax: 450, xp: 15, toolName: 'فأس',
  messages: ['قطعت أخشاباً ثمينة!', 'الغابة كريمة!', 'أخشاب نادرة!'],
});

const handleFarm = makeAction({
  name: 'زراعة', title: 'الزراعة', emoji: '🌾',
  cooldownField: 'last_farm', cooldown: 90 * 60 * 1000,
  baseMin: 300, baseMax: 1000, xp: 30, toolName: 'بذور',
  messages: ['محصول وفير!', 'الأرض خصبة!', 'حصاد ممتاز!'],
});

const handleGather = makeAction({
  name: 'جمع', title: 'جمع النباتات', emoji: '🌿',
  cooldownField: 'last_gather', cooldown: 30 * 60 * 1000,
  baseMin: 80, baseMax: 300, xp: 10,
  messages: ['جمعت أعشاباً نادرة!', 'نباتات طبية ثمينة!', 'جمعت خيرات الطبيعة!'],
});

const handleDig = makeAction({
  name: 'تنقيب', title: 'التنقيب', emoji: '⚒️',
  cooldownField: 'last_dig', cooldown: 2 * 60 * 60 * 1000,
  baseMin: 500, baseMax: 2000, xp: 40,
  messages: ['وجدت كنزاً مدفوناً!', 'قطعة أثرية!', 'ذهب قديم!'],
});

module.exports = { handleFish, handleMine, handleChop, handleFarm, handleGather, handleDig };
