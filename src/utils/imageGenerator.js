const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCard(ctx, x, y, w, h, r = 16, bg = 'rgba(30,30,50,0.95)', border = null) {
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.fillStyle = bg;
  ctx.fill();
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawGradientBg(ctx, w, h, colors) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(0.5, colors[1]);
  grad.addColorStop(1, colors[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawProgressBar(ctx, x, y, w, h, progress, color1, color2) {
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fill();
  if (progress > 0) {
    const fillW = Math.max((w * progress) / 100, h);
    drawRoundedRect(ctx, x, y, fillW, h, h / 2);
    const grad = ctx.createLinearGradient(x, 0, x + fillW, 0);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    ctx.fill();
  }
  ctx.restore();
}

function drawStars(ctx, w, h, count = 60) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 1.5;
    const alpha = Math.random() * 0.6 + 0.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
  }
  ctx.restore();
}

function drawDecorativeLines(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(0, h * (i / 5));
    ctx.lineTo(w, h * (i / 5 + 0.2));
    ctx.stroke();
  }
  ctx.restore();
}

function ar(n) {
  if (n === undefined || n === null) return '0';
  const num = Number(n);
  if (isNaN(num)) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toLocaleString();
}

function getRankColor(totalWealth) {
  if (totalWealth < 1000) return '#808080';
  if (totalWealth < 10000) return '#a0a0a0';
  if (totalWealth < 50000) return '#4a9eff';
  if (totalWealth < 200000) return '#44cc44';
  if (totalWealth < 1000000) return '#ffa500';
  if (totalWealth < 10000000) return '#ffd700';
  if (totalWealth < 100000000) return '#ff6600';
  return '#ff0066';
}

function getRankName(totalWealth) {
  if (totalWealth < 1000) return 'مفلس';
  if (totalWealth < 10000) return 'مواطن';
  if (totalWealth < 50000) return 'عامل';
  if (totalWealth < 200000) return 'تاجر';
  if (totalWealth < 1000000) return 'رجل أعمال';
  if (totalWealth < 10000000) return 'مليونير';
  if (totalWealth < 100000000) return 'ملياردير';
  return 'أسطورة اقتصادية';
}

const FONT = 'Arial';

async function generateBalanceImage(user) {
  const w = 700, h = 380;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  const total = (user.cash || 0) + (user.bank || 0);
  const rankColor = getRankColor(total);

  drawGradientBg(ctx, w, h, ['#0a0a1a', '#0d1b2a', '#0a1520']);
  drawStars(ctx, w, h, 80);
  drawDecorativeLines(ctx, w, h);

  const headerGrad = ctx.createLinearGradient(0, 0, w, 80);
  headerGrad.addColorStop(0, rankColor + '33');
  headerGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, w, 80);

  ctx.font = `bold 28px ${FONT}`;
  ctx.fillStyle = rankColor;
  ctx.textAlign = 'center';
  ctx.fillText(`💰 رصيد ${user.username}`, w / 2, 45);

  const rankName = getRankName(total);
  ctx.font = `16px ${FONT}`;
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText(`رتبة: ${rankName}`, w / 2, 68);

  const cardW = 290, cardH = 110, gap = 30;
  const startX = (w - cardW * 2 - gap) / 2;
  const cardY = 95;

  drawCard(ctx, startX, cardY, cardW, cardH, 14, 'rgba(20,40,80,0.9)', '#1a4a9a');
  ctx.font = `14px ${FONT}`;
  ctx.fillStyle = '#7aadff';
  ctx.textAlign = 'center';
  ctx.fillText('💵 النقد (المحفظة)', startX + cardW / 2, cardY + 28);
  ctx.font = `bold 34px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(ar(user.cash), startX + cardW / 2, cardY + 72);
  ctx.font = `12px ${FONT}`;
  ctx.fillStyle = '#5599cc';
  ctx.fillText('عملة', startX + cardW / 2, cardY + 95);

  const cardX2 = startX + cardW + gap;
  drawCard(ctx, cardX2, cardY, cardW, cardH, 14, 'rgba(20,60,40,0.9)', '#1a8a4a');
  ctx.font = `14px ${FONT}`;
  ctx.fillStyle = '#7affaa';
  ctx.textAlign = 'center';
  ctx.fillText('🏦 البنك', cardX2 + cardW / 2, cardY + 28);
  ctx.font = `bold 34px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(ar(user.bank), cardX2 + cardW / 2, cardY + 72);
  ctx.font = `12px ${FONT}`;
  ctx.fillStyle = '#55cc88';
  ctx.fillText('عملة', cardX2 + cardW / 2, cardY + 95);

  drawCard(ctx, 30, 225, w - 60, 55, 12, 'rgba(100,80,20,0.3)', '#ffd70044');
  ctx.font = `13px ${FONT}`;
  ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'left';
  ctx.fillText(`🥇 ذهب: ${ar(user.gold)}`, 55, 258);
  ctx.textAlign = 'right';
  ctx.fillText(`💎 جواهر: ${ar(user.gems)}`, w - 55, 258);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 14px ${FONT}`;
  ctx.fillText(`إجمالي الثروة: ${ar(total)} عملة`, w / 2, 261);

  const lvl = Math.floor(Math.sqrt((user.xp || 0) / 100)) + 1;
  const nextXp = Math.pow(lvl, 2) * 100;
  const curXp = Math.pow(lvl - 1, 2) * 100;
  const prog = Math.min(Math.floor(((user.xp - curXp) / (nextXp - curXp)) * 100), 100) || 0;

  ctx.font = `13px ${FONT}`;
  ctx.fillStyle = '#aaaaaa';
  ctx.textAlign = 'left';
  ctx.fillText(`⭐ المستوى ${lvl}`, 55, 310);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText(`${user.xp || 0} / ${nextXp} XP`, w - 55, 310);

  drawProgressBar(ctx, 55, 318, w - 110, 12, prog, '#ffd700', '#ff8800');

  ctx.font = `11px ${FONT}`;
  ctx.fillStyle = '#666666';
  ctx.textAlign = 'center';
  ctx.fillText(`بوت البنك • الديسكورد`, w / 2, 368);

  return canvas.toBuffer('image/png');
}

async function generateLeaderboardImage(users, title = 'أغنى اللاعبين') {
  const w = 700, h = 80 + users.length * 68 + 40;
  const canvas = createCanvas(w, Math.max(h, 300));
  const ctx = canvas.getContext('2d');

  drawGradientBg(ctx, w, canvas.height, ['#0a0a1a', '#0d1b2a', '#0a1520']);
  drawStars(ctx, w, canvas.height, 60);

  ctx.font = `bold 26px ${FONT}`;
  ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'center';
  ctx.fillText(`🏆 ${title}`, w / 2, 45);

  const medals = ['🥇', '🥈', '🥉'];

  users.forEach((u, i) => {
    const y = 75 + i * 68;
    const isTop = i < 3;
    const cardColor = isTop
      ? [`rgba(255,215,0,0.15)`, `rgba(192,192,192,0.15)`, `rgba(205,127,50,0.15)`][i]
      : 'rgba(255,255,255,0.05)';
    const borderColor = isTop
      ? ['#ffd700', '#c0c0c0', '#cd7f32'][i]
      : 'rgba(255,255,255,0.1)';

    drawCard(ctx, 30, y, w - 60, 58, 12, cardColor, borderColor);

    const medal = medals[i] || `#${i + 1}`;
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(medal, 52, y + 36);

    ctx.font = `bold 16px ${FONT}`;
    ctx.fillStyle = '#e0e0e0';
    ctx.fillText(u.username, 95, y + 28);

    const total = (u.cash || 0) + (u.bank || 0);
    const rankColor = getRankColor(total);
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = rankColor;
    ctx.fillText(getRankName(total), 95, y + 50);

    ctx.font = `bold 18px ${FONT}`;
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'right';
    ctx.fillText(`${ar(total)} 💰`, w - 50, y + 36);
  });

  ctx.font = `11px ${FONT}`;
  ctx.fillStyle = '#444444';
  ctx.textAlign = 'center';
  ctx.fillText('بوت البنك', w / 2, canvas.height - 12);

  return canvas.toBuffer('image/png');
}

async function generateSimpleImage(title, lines, color = '#4a9eff', emoji = '💰') {
  const w = 600, lineH = 36;
  const h = 100 + lines.length * lineH + 40;
  const canvas = createCanvas(w, Math.max(h, 200));
  const ctx = canvas.getContext('2d');

  drawGradientBg(ctx, w, canvas.height, ['#0a0a1a', '#0d1b2a', '#0a1520']);
  drawStars(ctx, w, canvas.height, 40);

  drawCard(ctx, 20, 20, w - 40, 60, 12,
    color + '22', color + '66');

  ctx.font = `bold 24px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(`${emoji} ${title}`, w / 2, 58);

  lines.forEach((line, i) => {
    const y = 100 + i * lineH;
    if (line.divider) {
      ctx.beginPath();
      ctx.moveTo(40, y + lineH / 2);
      ctx.lineTo(w - 40, y + lineH / 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
      return;
    }
    if (line.header) {
      ctx.font = `bold 15px ${FONT}`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(line.header, w / 2, y + 24);
      return;
    }
    ctx.font = `15px ${FONT}`;
    ctx.fillStyle = line.highlight ? '#ffd700' : '#cccccc';
    if (line.left && line.right) {
      ctx.textAlign = 'left';
      ctx.fillText(line.left, 45, y + 24);
      ctx.textAlign = 'right';
      ctx.fillStyle = line.rightColor || '#ffffff';
      ctx.fillText(line.right, w - 45, y + 24);
    } else {
      ctx.textAlign = 'center';
      ctx.fillText(line.text || line, w / 2, y + 24);
    }
  });

  ctx.font = `11px ${FONT}`;
  ctx.fillStyle = '#444444';
  ctx.textAlign = 'center';
  ctx.fillText('بوت البنك', w / 2, canvas.height - 10);

  return canvas.toBuffer('image/png');
}

async function generateGameResultImage(title, result, amount, isWin, details = []) {
  const w = 600, h = 320;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  const bgColor = isWin ? ['#0a1a0a', '#0d2b0d', '#0a1a0a'] : ['#1a0a0a', '#2b0d0d', '#1a0a0a'];
  drawGradientBg(ctx, w, h, bgColor);
  drawStars(ctx, w, h, 50);

  const mainColor = isWin ? '#44ff88' : '#ff4444';
  const mainEmoji = isWin ? '🎉' : '💔';

  drawCard(ctx, 20, 20, w - 40, 70, 14, mainColor + '22', mainColor + '88');
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillStyle = mainColor;
  ctx.textAlign = 'center';
  ctx.fillText(`${mainEmoji} ${title}`, w / 2, 62);

  ctx.font = `bold 44px ${FONT}`;
  ctx.fillStyle = isWin ? '#ffd700' : '#ff6666';
  ctx.textAlign = 'center';
  ctx.fillText(isWin ? `+${ar(amount)}` : `-${ar(amount)}`, w / 2, 155);

  ctx.font = `18px ${FONT}`;
  ctx.fillStyle = '#888888';
  ctx.fillText('عملة', w / 2, 180);

  ctx.font = `bold 20px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(result, w / 2, 215);

  details.forEach((d, i) => {
    ctx.font = `14px ${FONT}`;
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(d, w / 2, 240 + i * 22);
  });

  ctx.font = `11px ${FONT}`;
  ctx.fillStyle = '#444444';
  ctx.fillText('بوت البنك', w / 2, h - 12);

  return canvas.toBuffer('image/png');
}

async function generateProfileImage(user, properties = [], pets = []) {
  const w = 700, h = 460;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  const total = (user.cash || 0) + (user.bank || 0);
  const rankColor = getRankColor(total);

  drawGradientBg(ctx, w, h, ['#0a0a1a', '#0d1b2a', '#0a1520']);
  drawStars(ctx, w, h, 70);

  const topGrad = ctx.createLinearGradient(0, 0, w, 100);
  topGrad.addColorStop(0, rankColor + '44');
  topGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, w, 100);

  ctx.beginPath();
  ctx.arc(60, 55, 35, 0, Math.PI * 2);
  ctx.fillStyle = rankColor + '33';
  ctx.fill();
  ctx.strokeStyle = rankColor;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.font = `bold 28px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('👤', 60, 65);

  ctx.font = `bold 22px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(user.username, 110, 45);
  ctx.font = `14px ${FONT}`;
  ctx.fillStyle = rankColor;
  ctx.fillText(`${getRankName(total)} • مستوى ${user.level || 1}`, 110, 68);
  ctx.fillStyle = '#666666';
  ctx.fillText(`الوظيفة: ${user.job || 'بدون وظيفة'}`, 110, 88);

  const col1X = 30, col2X = w / 2 + 10;
  const statY = 115;

  drawCard(ctx, col1X, statY, w / 2 - 20, 100, 12, 'rgba(20,40,80,0.8)', '#1a4a9a44');
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillStyle = '#7aadff';
  ctx.textAlign = 'center';
  ctx.fillText('💰 الثروة', col1X + (w / 2 - 20) / 2, statY + 25);
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(ar(total), col1X + (w / 2 - 20) / 2, statY + 60);
  ctx.font = `12px ${FONT}`;
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText(`نقد: ${ar(user.cash)} | بنك: ${ar(user.bank)}`, col1X + (w / 2 - 20) / 2, statY + 85);

  drawCard(ctx, col2X, statY, w / 2 - 20, 100, 12, 'rgba(80,40,20,0.8)', '#9a5a1a44');
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillStyle = '#ffaa7a';
  ctx.textAlign = 'center';
  ctx.fillText('⭐ الخبرة', col2X + (w / 2 - 20) / 2, statY + 25);
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${user.xp || 0} XP`, col2X + (w / 2 - 20) / 2, statY + 60);
  ctx.font = `12px ${FONT}`;
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText(`مستوى: ${user.level || 1}`, col2X + (w / 2 - 20) / 2, statY + 85);

  const lvl = user.level || 1;
  const nextXp = Math.pow(lvl, 2) * 100;
  const curXp = Math.pow(lvl - 1, 2) * 100;
  const prog = Math.min(Math.floor((((user.xp || 0) - curXp) / (nextXp - curXp)) * 100), 100) || 0;

  ctx.font = `12px ${FONT}`;
  ctx.fillStyle = '#aaaaaa';
  ctx.textAlign = 'left';
  ctx.fillText(`تقدم المستوى: ${prog}%`, col1X + 5, 235);
  drawProgressBar(ctx, col1X, 242, w - 60, 10, prog, rankColor, '#ffffff');

  const infoY = 268;
  drawCard(ctx, 30, infoY, w - 60, 80, 12, 'rgba(30,30,50,0.8)', 'rgba(255,255,255,0.1)');

  const infos = [
    { label: '🥇 ذهب', val: ar(user.gold) },
    { label: '💎 جواهر', val: ar(user.gems) },
    { label: '🏠 عقارات', val: String(properties.length) },
    { label: '🐾 حيوان', val: pets.length ? pets[0].pet_type : 'لا يوجد' },
    { label: '⚔️ نقابة', val: user.guild_name || 'لا يوجد' },
    { label: '💑 متزوج', val: user.married_to ? 'نعم' : 'لا' },
  ];

  const infoW = (w - 60) / 3;
  infos.forEach((info, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const ix = 30 + col * infoW + infoW / 2;
    const iy = infoY + 25 + row * 34;
    ctx.font = `12px ${FONT}`;
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.fillText(info.label, ix, iy);
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(info.val, ix, iy + 18);
  });

  if (user.married_to) {
    drawCard(ctx, 30, 365, w - 60, 40, 10, 'rgba(255,100,150,0.15)', '#ff449988');
    ctx.font = `14px ${FONT}`;
    ctx.fillStyle = '#ff88bb';
    ctx.textAlign = 'center';
    ctx.fillText(`💑 متزوج من: ${user.married_to}`, w / 2, 390);
  }

  ctx.font = `11px ${FONT}`;
  ctx.fillStyle = '#444444';
  ctx.textAlign = 'center';
  ctx.fillText('بوت البنك', w / 2, h - 10);

  return canvas.toBuffer('image/png');
}

async function generateShopImage(items) {
  const w = 700;
  const rows = Math.ceil(items.length / 2);
  const h = 90 + rows * 90 + 40;
  const canvas = createCanvas(w, Math.max(h, 300));
  const ctx = canvas.getContext('2d');

  drawGradientBg(ctx, w, canvas.height, ['#0a0a1a', '#1a0d2a', '#0a0a1a']);
  drawStars(ctx, w, canvas.height, 50);

  ctx.font = `bold 26px ${FONT}`;
  ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'center';
  ctx.fillText('🛒 المتجر', w / 2, 50);

  items.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col === 0 ? 20 : w / 2 + 10;
    const y = 70 + row * 90;
    const iw = w / 2 - 30;

    drawCard(ctx, x, y, iw, 75, 12, 'rgba(30,30,60,0.9)', '#4444aa44');

    ctx.font = `bold 16px ${FONT}`;
    ctx.fillStyle = '#e0e0e0';
    ctx.textAlign = 'left';
    ctx.fillText(`${item.emoji} ${item.name}`, x + 14, y + 28);

    ctx.font = `12px ${FONT}`;
    ctx.fillStyle = '#888888';
    ctx.fillText(item.description || '', x + 14, y + 48);

    ctx.font = `bold 16px ${FONT}`;
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'right';
    ctx.fillText(`${ar(item.price)} 💰`, x + iw - 14, y + 28);

    if (item.effect) {
      ctx.font = `11px ${FONT}`;
      ctx.fillStyle = '#44ff88';
      ctx.textAlign = 'right';
      ctx.fillText(item.effect, x + iw - 14, y + 48);
    }
  });

  ctx.font = `11px ${FONT}`;
  ctx.fillStyle = '#444444';
  ctx.textAlign = 'center';
  ctx.fillText('بوت البنك', w / 2, canvas.height - 10);

  return canvas.toBuffer('image/png');
}

async function generateStocksImage(stocks) {
  const w = 700, h = 90 + stocks.length * 65 + 40;
  const canvas = createCanvas(w, Math.max(h, 300));
  const ctx = canvas.getContext('2d');

  drawGradientBg(ctx, w, canvas.height, ['#0a1a0a', '#0d2b0d', '#0a1a0a']);
  drawStars(ctx, w, canvas.height, 40);

  ctx.font = `bold 24px ${FONT}`;
  ctx.fillStyle = '#44ff88';
  ctx.textAlign = 'center';
  ctx.fillText('📈 سوق الأسهم', w / 2, 46);

  stocks.forEach((s, i) => {
    const y = 65 + i * 65;
    const change = s.change || 0;
    const isUp = change >= 0;
    const borderColor = isUp ? '#44ff8844' : '#ff444444';
    const cardBg = isUp ? 'rgba(20,60,20,0.6)' : 'rgba(60,20,20,0.6)';

    drawCard(ctx, 20, y, w - 40, 52, 10, cardBg, borderColor);

    ctx.font = `bold 16px ${FONT}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`[${s.symbol}] ${s.name}`, 40, y + 22);

    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = '#888888';
    ctx.fillText(`آخر تحديث: ${s.timeAgo || 'الآن'}`, 40, y + 42);

    ctx.font = `bold 20px ${FONT}`;
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'right';
    ctx.fillText(`${ar(s.price)} 💰`, w - 40, y + 22);

    ctx.font = `bold 14px ${FONT}`;
    ctx.fillStyle = isUp ? '#44ff88' : '#ff4444';
    ctx.fillText(`${isUp ? '▲' : '▼'} ${Math.abs(change)}%`, w - 40, y + 42);
  });

  ctx.font = `11px ${FONT}`;
  ctx.fillStyle = '#444444';
  ctx.textAlign = 'center';
  ctx.fillText('الأسعار تتحدث كل 10 دقائق', w / 2, canvas.height - 10);

  return canvas.toBuffer('image/png');
}

module.exports = {
  generateBalanceImage,
  generateLeaderboardImage,
  generateSimpleImage,
  generateGameResultImage,
  generateProfileImage,
  generateShopImage,
  generateStocksImage,
  ar,
};
