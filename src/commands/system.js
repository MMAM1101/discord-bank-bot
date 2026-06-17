const { generateSimpleImage } = require('../utils/imageGenerator');
const { AttachmentBuilder } = require('discord.js');

async function sendImage(message, buffer, filename = 'result.png') {
  const att = new AttachmentBuilder(buffer, { name: filename });
  await message.reply({ files: [att] });
}

async function handleHelp(message) {
  const img = await generateSimpleImage('قائمة الأوامر 📖', [
    { header: '💰 الاقتصاد' },
    { text: 'رصيدي | فلوسي | محفظتي | بنك | ايداع | سحب | تحويل | راتب | اسبوعي | شهري | مكافأة | ثروتي | اغنى | توب' },
    { divider: true },
    { header: '💼 الوظائف' },
    { text: 'وظائف | توظف | عملي | استقل | ترقية | دوام' },
    { divider: true },
    { header: '📈 الاستثمار' },
    { text: 'استثمار | استثماراتي | بيع_استثمار | اسهم | شراء_سهم | بيع_سهم | سوق' },
    { divider: true },
    { header: '🏠 العقارات' },
    { text: 'عقارات | شراء_عقار | بيع_عقار | عقاراتي | تحصيل_ايجار' },
    { divider: true },
    { header: '🎮 الألعاب' },
    { text: 'عملة | نرد | سلوت | بلاك_جاك | روليت | تخمين | حظ' },
    { divider: true },
    { header: '🥷 الجرائم' },
    { text: 'جريمة | سرقة | سطو | تهريب | اختلاس | هروب' },
  ], '#4a9eff', '📖');
  await sendImage(message, img, 'help.png');
}

async function handleHelp2(message) {
  const img = await generateSimpleImage('قائمة الأوامر 2 📖', [
    { header: '⛏️ العمل' },
    { text: 'صيد | تعدين | احتطاب | زراعة | جمع | تنقيب' },
    { divider: true },
    { header: '🐾 الحيوانات' },
    { text: 'حيوانات | شراء_حيوان | حيواني | اطعام | لعب | تطوير_حيوان' },
    { divider: true },
    { header: '🛒 المتجر' },
    { text: 'متجر | شراء | بيع | حقيبتي | استخدام | اغراضي' },
    { divider: true },
    { header: '⭐ المستويات' },
    { text: 'لفل | خبرتي | توب_لفلات' },
    { divider: true },
    { header: '🏆 الإنجازات' },
    { text: 'انجازات | مهام | استلام_مهمة' },
    { divider: true },
    { header: '💑 الزواج' },
    { text: 'زواج | طلاق | عائلتي | مصروف' },
    { divider: true },
    { header: '⚔️ النقابات' },
    { text: 'انشاء_نقابة | نقابتي | دعوة_نقابة | طرد_نقابة | حرب_نقابات' },
    { divider: true },
    { header: '🎉 الأحداث' },
    { text: 'حدث | يانصيب | سحب_عشوائي | سباق | مزاد' },
  ], '#4a9eff', '📖');
  await sendImage(message, img, 'help2.png');
}

async function handleCommands(message) {
  return handleHelp(message);
}

async function handleInfo(message) {
  const { version } = require('../../package.json');
  const img = await generateSimpleImage('معلومات البوت 🤖', [
    { left: '🤖 اسم البوت', right: 'بوت البنك' },
    { left: '📦 الإصدار', right: `v${version}` },
    { left: '🏠 السيرفرات', right: String(message.client.guilds.cache.size) },
    { left: '👥 الأعضاء', right: String(message.client.users.cache.size) },
    { left: '⏱️ مدة التشغيل', right: formatUptime(message.client.uptime) },
    { left: '📡 Ping', right: `${message.client.ws.ping}ms` },
    { divider: true },
    { text: 'بوت بنك متكامل بأكثر من 80 أمر' },
    { text: 'مبني بـ Discord.js v14' },
  ], '#4a9eff', '🤖');
  await sendImage(message, img, 'info.png');
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m ${s % 60}s`;
}

async function handlePing(message) {
  const ping = message.client.ws.ping;
  const img = await generateSimpleImage('Ping 🏓', [
    { left: '📡 Latency', right: `${ping}ms`, rightColor: ping < 100 ? '#44ff88' : ping < 200 ? '#ffd700' : '#ff4444' },
    { text: ping < 100 ? '🟢 ممتاز' : ping < 200 ? '🟡 جيد' : '🔴 بطيء' },
  ], '#4a9eff', '🏓');
  await sendImage(message, img, 'ping.png');
}

async function handleInvite(message) {
  const id = message.client.user.id;
  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${id}&permissions=8&scope=bot`;
  const img = await generateSimpleImage('دعوة البوت 🔗', [
    { text: 'انسخ الرابط لدعوة البوت:' },
    { text: inviteUrl.slice(0, 60) + '...', highlight: true },
    { text: '(الرابط الكامل في console البوت)' },
  ], '#7289da', '🔗');
  console.log('Invite URL:', inviteUrl);
  await sendImage(message, img, 'invite.png');
}

async function handleSupport(message) {
  const img = await generateSimpleImage('الدعم والمساعدة 💬', [
    { text: 'للدعم والمساعدة:' },
    { left: '📖 الأوامر', right: 'اوامر أو مساعدة' },
    { left: '🐛 الأخطاء', right: 'أبلغ عنها للمشرفين' },
    { left: '💡 الاقتراحات', right: 'راسل المشرفين' },
  ], '#44ff88', '💬');
  await sendImage(message, img, 'support.png');
}

module.exports = { handleHelp, handleHelp2, handleCommands, handleInfo, handlePing, handleInvite, handleSupport };
