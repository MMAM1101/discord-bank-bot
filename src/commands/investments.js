const db = require('../database');
const { getUser, updateUser, addXp } = require('../utils/userManager');
const { generateSimpleImage, generateStocksImage, ar } = require('../utils/imageGenerator');
const { AttachmentBuilder } = require('discord.js');

async function sendImage(message, buffer, filename = 'result.png') {
  const att = new AttachmentBuilder(buffer, { name: filename });
  await message.reply({ files: [att] });
}

async function handleInvest(message, args) {
  const amount = parseInt(args[0]);
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (isNaN(amount) || amount < 100) {
    const img = await generateSimpleImage('خطأ', [{ text: 'الاستخدام: استثمار [مبلغ]' }, { text: 'الحد الأدنى: 100 عملة' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  if (user.cash < amount) {
    const img = await generateSimpleImage('رصيد غير كافٍ', [{ left: '💰 نقدك', right: `${ar(user.cash)} عملة` }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const rate = (Math.random() * 0.4 - 0.1).toFixed(4);
  db.prepare('INSERT INTO investments (user_id, guild_id, amount, return_rate) VALUES (?, ?, ?, ?)').run(message.author.id, message.guild.id, amount, parseFloat(rate));
  updateUser(message.author.id, message.guild.id, { cash: user.cash - amount });
  addXp(message.author.id, message.guild.id, 20);
  const rateNum = parseFloat(rate);
  const img = await generateSimpleImage('تم الاستثمار! 📈', [
    { left: '💰 المبلغ المستثمر', right: `${ar(amount)} عملة` },
    { left: '📊 معدل العائد', right: `${(rateNum * 100).toFixed(1)}%`, rightColor: rateNum >= 0 ? '#44ff88' : '#ff4444' },
    { text: 'يمكنك بيع الاستثمار لاحقاً بأمر: بيع_استثمار [رقم]' },
  ], '#44ff88', '📈');
  await sendImage(message, img, 'invest.png');
}

async function handleMyInvestments(message) {
  const invs = db.prepare('SELECT * FROM investments WHERE user_id = ? AND guild_id = ? ORDER BY id DESC').all(message.author.id, message.guild.id);
  if (!invs.length) {
    const img = await generateSimpleImage('لا توجد استثمارات', [{ text: 'ليس لديك استثمارات' }, { text: 'استخدم: استثمار [مبلغ]' }], '#888888', '📈');
    return sendImage(message, img);
  }
  const now = Math.floor(Date.now() / 1000);
  const lines = invs.map((inv, i) => {
    const age = now - inv.invested_at;
    const growth = inv.amount * inv.return_rate * (age / 3600);
    const current = Math.floor(inv.amount + growth);
    const diff = current - inv.amount;
    return {
      left: `#${inv.id} - ${ar(inv.amount)} عملة`,
      right: `${diff >= 0 ? '+' : ''}${ar(diff)} (${ar(current)})`,
      rightColor: diff >= 0 ? '#44ff88' : '#ff4444',
    };
  });
  const img = await generateSimpleImage('استثماراتي 📊', lines, '#44ff88', '📈');
  await sendImage(message, img, 'myinvestments.png');
}

async function handleSellInvestment(message, args) {
  const id = parseInt(args[0]);
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (isNaN(id)) {
    const img = await generateSimpleImage('خطأ', [{ text: 'الاستخدام: بيع_استثمار [رقم]' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const inv = db.prepare('SELECT * FROM investments WHERE id = ? AND user_id = ? AND guild_id = ?').get(id, message.author.id, message.guild.id);
  if (!inv) {
    const img = await generateSimpleImage('لا يوجد', [{ text: `لا يوجد استثمار برقم ${id}` }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const now = Math.floor(Date.now() / 1000);
  const age = now - inv.invested_at;
  const growth = inv.amount * inv.return_rate * (age / 3600);
  const returned = Math.max(Math.floor(inv.amount + growth), Math.floor(inv.amount * 0.5));
  const profit = returned - inv.amount;
  db.prepare('DELETE FROM investments WHERE id = ?').run(id);
  updateUser(message.author.id, message.guild.id, { cash: user.cash + returned });
  addXp(message.author.id, message.guild.id, 15);
  const img = await generateSimpleImage(`بيع الاستثمار #${id}`, [
    { left: '💰 المبلغ الأصلي', right: `${ar(inv.amount)} عملة` },
    { left: profit >= 0 ? '📈 الربح' : '📉 الخسارة', right: `${profit >= 0 ? '+' : ''}${ar(profit)} عملة`, rightColor: profit >= 0 ? '#44ff88' : '#ff4444' },
    { left: '💵 المسترجع', right: `${ar(returned)} عملة`, rightColor: '#ffd700' },
    { left: '💰 رصيدك الآن', right: `${ar(user.cash + returned)} عملة` },
  ], profit >= 0 ? '#44ff88' : '#ff4444', profit >= 0 ? '📈' : '📉');
  await sendImage(message, img, 'sellinv.png');
}

function updateStockPrices() {
  const stocks = db.prepare('SELECT * FROM stocks').all();
  for (const stock of stocks) {
    const change = (Math.random() * 0.2 - 0.08);
    const newPrice = Math.max(10, Math.floor(stock.price * (1 + change)));
    db.prepare('UPDATE stocks SET price = ?, last_updated = ? WHERE symbol = ?').run(newPrice, Math.floor(Date.now() / 1000), stock.symbol);
  }
}

async function handleStocks(message) {
  const stocks = db.prepare('SELECT * FROM stocks').all();
  const now = Math.floor(Date.now() / 1000);
  const stocksWithChange = stocks.map(s => {
    const age = now - s.last_updated;
    const timeAgo = age < 60 ? 'الآن' : age < 3600 ? `${Math.floor(age / 60)} د` : `${Math.floor(age / 3600)} س`;
    const change = (Math.random() * 10 - 4).toFixed(1);
    return { ...s, change: parseFloat(change), timeAgo };
  });
  const img = await generateStocksImage(stocksWithChange);
  await sendImage(message, img, 'stocks.png');
}

async function handleBuyStock(message, args) {
  const symbol = args[0]?.toUpperCase();
  const qty = parseInt(args[1]);
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (!symbol || isNaN(qty) || qty <= 0) {
    const img = await generateSimpleImage('خطأ', [{ text: 'الاستخدام: شراء_سهم [رمز] [كمية]' }, { text: 'مثال: شراء_سهم TECH 10' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const stock = db.prepare('SELECT * FROM stocks WHERE symbol = ?').get(symbol);
  if (!stock) {
    const img = await generateSimpleImage('سهم غير موجود', [{ text: `الرمز "${symbol}" غير موجود` }, { text: 'استخدم: اسهم لرؤية القائمة' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const cost = stock.price * qty;
  if (user.cash < cost) {
    const img = await generateSimpleImage('رصيد غير كافٍ', [
      { left: '💰 التكلفة', right: `${ar(cost)} عملة` },
      { left: '💵 نقدك', right: `${ar(user.cash)} عملة` },
    ], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const existing = db.prepare('SELECT * FROM user_stocks WHERE user_id = ? AND guild_id = ? AND symbol = ?').get(message.author.id, message.guild.id, symbol);
  if (existing) {
    const newQty = existing.quantity + qty;
    const newAvg = Math.floor((existing.avg_price * existing.quantity + cost) / newQty);
    db.prepare('UPDATE user_stocks SET quantity = ?, avg_price = ? WHERE id = ?').run(newQty, newAvg, existing.id);
  } else {
    db.prepare('INSERT INTO user_stocks (user_id, guild_id, symbol, quantity, avg_price) VALUES (?, ?, ?, ?, ?)').run(message.author.id, message.guild.id, symbol, qty, stock.price);
  }
  updateUser(message.author.id, message.guild.id, { cash: user.cash - cost });
  addXp(message.author.id, message.guild.id, 25);
  const img = await generateSimpleImage('تم شراء الأسهم! 📈', [
    { left: '📊 السهم', right: `${stock.name} (${symbol})` },
    { left: '🔢 الكمية', right: String(qty) },
    { left: '💰 السعر', right: `${ar(stock.price)} عملة/سهم` },
    { left: '💸 التكلفة', right: `${ar(cost)} عملة`, rightColor: '#ff8844' },
    { left: '💵 رصيدك', right: `${ar(user.cash - cost)} عملة`, rightColor: '#ffd700' },
  ], '#44ff88', '📈');
  await sendImage(message, img, 'buystock.png');
}

async function handleSellStock(message, args) {
  const symbol = args[0]?.toUpperCase();
  const qty = parseInt(args[1]);
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  if (!symbol || isNaN(qty) || qty <= 0) {
    const img = await generateSimpleImage('خطأ', [{ text: 'الاستخدام: بيع_سهم [رمز] [كمية]' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const holding = db.prepare('SELECT * FROM user_stocks WHERE user_id = ? AND guild_id = ? AND symbol = ?').get(message.author.id, message.guild.id, symbol);
  if (!holding || holding.quantity < qty) {
    const img = await generateSimpleImage('لا يوجد', [{ text: `ليس لديك ${qty} سهم من ${symbol}` }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const stock = db.prepare('SELECT * FROM stocks WHERE symbol = ?').get(symbol);
  const revenue = stock.price * qty;
  const profit = revenue - (holding.avg_price * qty);
  if (holding.quantity - qty <= 0) {
    db.prepare('DELETE FROM user_stocks WHERE user_id = ? AND guild_id = ? AND symbol = ?').run(message.author.id, message.guild.id, symbol);
  } else {
    db.prepare('UPDATE user_stocks SET quantity = quantity - ? WHERE user_id = ? AND guild_id = ? AND symbol = ?').run(qty, message.author.id, message.guild.id, symbol);
  }
  updateUser(message.author.id, message.guild.id, { cash: user.cash + revenue });
  const img = await generateSimpleImage(`بيع أسهم ${symbol}`, [
    { left: '🔢 الكمية', right: String(qty) },
    { left: '💰 سعر البيع', right: `${ar(stock.price)} عملة/سهم` },
    { left: profit >= 0 ? '📈 الربح' : '📉 الخسارة', right: `${profit >= 0 ? '+' : ''}${ar(profit)} عملة`, rightColor: profit >= 0 ? '#44ff88' : '#ff4444' },
    { left: '💵 رصيدك', right: `${ar(user.cash + revenue)} عملة`, rightColor: '#ffd700' },
  ], profit >= 0 ? '#44ff88' : '#ff4444', profit >= 0 ? '📈' : '📉');
  await sendImage(message, img, 'sellstock.png');
}

async function handleMarket(message) {
  const stocks = db.prepare('SELECT * FROM stocks ORDER BY price DESC').all();
  const userStocks = db.prepare('SELECT * FROM user_stocks WHERE user_id = ? AND guild_id = ?').all(message.author.id, message.guild.id);
  const lines = [{ header: '📊 السوق الحالي' }];
  stocks.forEach(s => {
    const owned = userStocks.find(us => us.symbol === s.symbol);
    lines.push({
      left: `[${s.symbol}] ${s.name}`,
      right: `${ar(s.price)} 💰${owned ? ` (لديك: ${owned.quantity})` : ''}`,
      rightColor: '#ffd700',
    });
  });
  const img = await generateSimpleImage('سوق الأسهم 📈', lines, '#44ff88', '📊');
  await sendImage(message, img, 'market.png');
}

module.exports = { handleInvest, handleMyInvestments, handleSellInvestment, handleStocks, handleBuyStock, handleSellStock, handleMarket, updateStockPrices };
