require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const db = require('./database');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel],
});

const economy = require('./commands/economy');
const jobs = require('./commands/jobs');
const games = require('./commands/games');
const crime = require('./commands/crime');
const resources = require('./commands/resources');
const shop = require('./commands/shop');
const properties = require('./commands/properties');
const investments = require('./commands/investments');
const pets = require('./commands/pets');
const levels = require('./commands/levels');
const achievements = require('./commands/achievements');
const marriage = require('./commands/marriage');
const guilds = require('./commands/guilds');
const events = require('./commands/events');
const admin = require('./commands/admin');
const system = require('./commands/system');

function getBankChannel(guildId) {
  const row = db.prepare('SELECT bank_channel FROM guilds_config WHERE guild_id = ?').get(guildId);
  return row?.bank_channel || null;
}

function setBankChannel(guildId, channelId) {
  const existing = db.prepare('SELECT guild_id FROM guilds_config WHERE guild_id = ?').get(guildId);
  if (existing) {
    db.prepare('UPDATE guilds_config SET bank_channel = ? WHERE guild_id = ?').run(channelId, guildId);
  } else {
    db.prepare('INSERT INTO guilds_config (guild_id, bank_channel) VALUES (?, ?)').run(guildId, channelId);
  }
}

const COMMANDS = {
  'رصيدي': (msg, args) => economy.handleBalance(msg, args, true),
  'فلوسي': (msg, args) => economy.handleBalance(msg, args, true),
  'محفظتي': (msg, args) => economy.handleBalance(msg, args, true),
  'بنك': (msg, args) => economy.handleBalance(msg, args, true),
  'ايداع': economy.handleDeposit,
  'سحب': economy.handleWithdraw,
  'تحويل': economy.handleTransfer,
  'راتب': economy.handleSalary,
  'اسبوعي': economy.handleWeekly,
  'شهري': economy.handleMonthly,
  'مكافأة': economy.handleBonus,
  'ثروتي': economy.handleWealth,
  'اغنى': economy.handleTop,
  'توب': economy.handleTop,
  'ملفي': economy.handleProfile,

  'وظائف': jobs.handleJobs,
  'توظف': jobs.handleHire,
  'عملي': jobs.handleMyJob,
  'استقل': jobs.handleResign,
  'ترقية': jobs.handleUpgrade,
  'دوام': jobs.handleWork,

  'استثمار': investments.handleInvest,
  'استثماراتي': investments.handleMyInvestments,
  'بيع_استثمار': investments.handleSellInvestment,
  'اسهم': investments.handleStocks,
  'شراء_سهم': investments.handleBuyStock,
  'بيع_سهم': investments.handleSellStock,
  'سوق': investments.handleMarket,

  'عقارات': properties.handleProperties,
  'شراء_عقار': properties.handleBuyProperty,
  'بيع_عقار': properties.handleSellProperty,
  'عقاراتي': properties.handleMyProperties,
  'تحصيل_ايجار': properties.handleCollectRent,

  'متجر': shop.handleShop,
  'شراء': shop.handleBuy,
  'بيع': shop.handleSell,
  'حقيبتي': shop.handleBag,
  'استخدام': shop.handleUse,
  'اغراضي': shop.handleItems,

  'حيوانات': pets.handlePetsList,
  'شراء_حيوان': pets.handleBuyPet,
  'حيواني': pets.handleMyPet,
  'اطعام': pets.handleFeedPet,
  'لعب': pets.handlePlayPet,
  'تطوير_حيوان': pets.handleUpgradePet,

  'عملة': games.handleCoinFlip,
  'نرد': games.handleDice,
  'سلوت': games.handleSlots,
  'بلاك_جاك': games.handleBlackjack,
  'روليت': games.handleRoulette,
  'تخمين': games.handleGuess,
  'حظ': games.handleLuck,

  'جريمة': crime.handleCrime,
  'سرقة': crime.handleSteal,
  'سطو': crime.handleRobbery,
  'تهريب': crime.handleSmuggle,
  'اختلاس': crime.handleEmbezzle,
  'هروب': crime.handleEscape,

  'صيد': resources.handleFish,
  'تعدين': resources.handleMine,
  'احتطاب': resources.handleChop,
  'زراعة': resources.handleFarm,
  'جمع': resources.handleGather,
  'تنقيب': resources.handleDig,

  'لفل': levels.handleLevel,
  'خبرتي': levels.handleMyXp,
  'توب_لفلات': levels.handleTopLevels,

  'انجازات': achievements.handleAchievements,
  'مهام': achievements.handleTasks,
  'استلام_مهمة': achievements.handleClaimTask,

  'زواج': marriage.handleMarry,
  'طلاق': marriage.handleDivorce,
  'عائلتي': marriage.handleFamily,
  'مصروف': marriage.handleAllowance,

  'انشاء_نقابة': guilds.handleCreateGuild,
  'نقابتي': guilds.handleMyGuild,
  'دعوة_نقابة': guilds.handleInviteGuild,
  'طرد_نقابة': guilds.handleKickGuild,
  'حرب_نقابات': guilds.handleGuildWar,

  'اضافة_فلوس': admin.handleAddMoney,
  'خصم_فلوس': admin.handleRemoveMoney,
  'تصفير': admin.handleReset,
  'اعطاء_غرض': admin.handleGiveItem,
  'سحب_غرض': admin.handleRemoveItem,

  'حدث': events.handleEvent,
  'يانصيب': events.handleLottery,
  'سحب_عشوائي': events.handleRandomDraw,
  'سباق': events.handleRace,
  'مزاد': events.handleAuction,

  'مساعدة': system.handleHelp,
  'اوامر': system.handleHelp,
  'اوامر2': system.handleHelp2,
  'معلومات': system.handleInfo,
  'بنق': system.handlePing,
  'دعوة': system.handleInvite,
  'دعم': system.handleSupport,
};

client.on('ready', () => {
  console.log(`✅ بوت البنك جاهز! تسجيل دخول كـ ${client.user.tag}`);
  console.log(`📊 متصل بـ ${client.guilds.cache.size} سيرفر`);
  client.user.setActivity('بوت البنك | اكتب مساعدة', { type: 3 });
  setInterval(() => investments.updateStockPrices(), 10 * 60 * 1000);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const content = message.content.trim();

  if (content.startsWith('/set channel bank') || content.startsWith('تحديد_قناة')) {
    if (!message.member.permissions.has('Administrator') && !message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ هذا الأمر للمشرفين فقط!');
    }
    const channelMention = message.mentions.channels.first();
    const targetChannel = channelMention || message.channel;
    setBankChannel(message.guild.id, targetChannel.id);
    return message.reply(`✅ تم تحديد ${targetChannel} كقناة البنك الرسمية!\nأي شخص يكتب الأوامر فيها سيحصل على ردود من البوت.`);
  }

  const bankChannel = getBankChannel(message.guild.id);
  if (bankChannel && message.channel.id !== bankChannel) return;

  const parts = content.split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  const handler = COMMANDS[cmd];
  if (!handler) return;

  try {
    await handler(message, args);
  } catch (err) {
    console.error(`خطأ في أمر "${cmd}":`, err);
    try {
      const { generateSimpleImage } = require('./utils/imageGenerator');
      const { AttachmentBuilder } = require('discord.js');
      const buf = await generateSimpleImage('حدث خطأ! ⚠️', [
        { text: 'حدث خطأ غير متوقع' },
        { text: 'يرجى المحاولة مرة أخرى' },
      ], '#ff4444', '⚠️');
      await message.reply({ files: [new AttachmentBuilder(buf, { name: 'error.png' })] });
    } catch (_) {}
  }
});

client.on('error', console.error);

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ DISCORD_TOKEN غير موجود في .env');
  process.exit(1);
}

client.login(token);
