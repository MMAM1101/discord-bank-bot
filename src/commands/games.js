const { getUser, updateUser, addXp } = require('../utils/userManager');
const { generateGameResultImage, generateSimpleImage, ar } = require('../utils/imageGenerator');
const { AttachmentBuilder } = require('discord.js');

async function sendImage(message, buffer, filename = 'result.png') {
  const att = new AttachmentBuilder(buffer, { name: filename });
  await message.reply({ files: [att] });
}

function parseBet(user, betStr) {
  if (!betStr) return 0;
  if (betStr === 'كل') return user.cash;
  const n = parseInt(betStr);
  return isNaN(n) ? 0 : n;
}

async function handleCoinFlip(message, args) {
  const side = args[0];
  const bet = parseBet(getUser(message.author.id, message.guild.id, message.author.username), args[1]);
  const user = getUser(message.author.id, message.guild.id, message.author.username);

  if (!['وجه', 'كتابة'].includes(side)) {
    const img = await generateSimpleImage('خطأ', [{ text: 'الاستخدام: عملة وجه 1000 أو عملة كتابة 1000' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  if (bet <= 0 || user.cash < bet) {
    const img = await generateSimpleImage('خطأ', [{ text: `رصيدك: ${ar(user.cash)}` }, { text: 'اكتب مبلغاً صحيحاً' }], '#ff4444', '❌');
    return sendImage(message, img);
  }

  const result = Math.random() < 0.5 ? 'وجه' : 'كتابة';
  const isWin = result === side;
  const change = isWin ? bet : -bet;

  updateUser(message.author.id, message.guild.id, { cash: user.cash + change });
  addXp(message.author.id, message.guild.id, 10);

  const resultEmoji = result === 'وجه' ? '👑' : '✍️';
  const img = await generateGameResultImage(
    `قلب العملة ${resultEmoji}`,
    `نتيجة: ${result} ${isWin ? '✅ ربحت!' : '❌ خسرت!'}`,
    bet,
    isWin,
    [`اخترت: ${side}`, `رصيدك: ${ar(user.cash + change)} عملة`]
  );
  await sendImage(message, img, 'coinflip.png');
}

async function handleDice(message, args) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const bet = parseBet(user, args[0]);
  if (bet <= 0 || user.cash < bet) {
    const img = await generateSimpleImage('خطأ', [{ text: `رصيدك: ${ar(user.cash)}` }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const myDice = Math.ceil(Math.random() * 6);
  const botDice = Math.ceil(Math.random() * 6);
  const isWin = myDice > botDice;
  const isDraw = myDice === botDice;
  const change = isDraw ? 0 : isWin ? bet : -bet;
  updateUser(message.author.id, message.guild.id, { cash: user.cash + change });
  addXp(message.author.id, message.guild.id, 10);
  const diceEmojis = ['', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
  const img = await generateGameResultImage(
    'لعبة النرد 🎲',
    isDraw ? '🤝 تعادل!' : isWin ? '🎉 ربحت!' : '💔 خسرت!',
    Math.abs(change),
    isWin,
    [`أنت: ${diceEmojis[myDice]}  البوت: ${diceEmojis[botDice]}`, `رصيدك: ${ar(user.cash + change)} عملة`]
  );
  await sendImage(message, img, 'dice.png');
}

async function handleSlots(message, args) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const bet = parseBet(user, args[0]);
  if (bet <= 0 || user.cash < bet) {
    const img = await generateSimpleImage('خطأ', [{ text: `رصيدك: ${ar(user.cash)}` }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const symbols = ['🍒', '🍋', '🍊', '⭐', '💎', '🎰', '7️⃣'];
  const s = [
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];
  let multiplier = 0;
  if (s[0] === s[1] && s[1] === s[2]) {
    multiplier = s[0] === '7️⃣' ? 10 : s[0] === '💎' ? 7 : s[0] === '⭐' ? 5 : 3;
  } else if (s[0] === s[1] || s[1] === s[2] || s[0] === s[2]) {
    multiplier = 0.5;
  }
  const isWin = multiplier > 0;
  const won = isWin ? Math.floor(bet * multiplier) : -bet;
  updateUser(message.author.id, message.guild.id, { cash: user.cash + won });
  addXp(message.author.id, message.guild.id, 10);
  const img = await generateGameResultImage(
    'السلوت 🎰',
    `${s[0]} | ${s[1]} | ${s[2]}`,
    Math.abs(won),
    isWin,
    [isWin ? `مضاعف: x${multiplier}! 🎉` : 'حظ أسعد المرة القادمة!', `رصيدك: ${ar(user.cash + won)} عملة`]
  );
  await sendImage(message, img, 'slots.png');
}

async function handleBlackjack(message, args) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const bet = parseBet(user, args[0]);
  if (bet <= 0 || user.cash < bet) {
    const img = await generateSimpleImage('خطأ', [{ text: `رصيدك: ${ar(user.cash)}` }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  function drawCard() {
    const values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11];
    return values[Math.floor(Math.random() * values.length)];
  }
  function handValue(hand) {
    let total = hand.reduce((a, b) => a + b, 0);
    let aces = hand.filter(c => c === 11).length;
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
  }
  const playerHand = [drawCard(), drawCard()];
  let dealerHand = [drawCard(), drawCard()];
  while (handValue(dealerHand) < 17) dealerHand.push(drawCard());

  const pv = handValue(playerHand);
  const dv = handValue(dealerHand);
  const isWin = pv > 21 ? false : dv > 21 ? true : pv > dv;
  const isDraw = pv === dv && pv <= 21;
  const change = isDraw ? 0 : isWin ? bet : -bet;

  updateUser(message.author.id, message.guild.id, { cash: user.cash + change });
  addXp(message.author.id, message.guild.id, 15);

  const img = await generateGameResultImage(
    'بلاك جاك 🃏',
    isDraw ? '🤝 تعادل!' : isWin ? '🏆 ربحت!' : '💔 خسرت!',
    Math.abs(change),
    isWin,
    [`أنت: ${pv}  الموزع: ${dv}`, `رصيدك: ${ar(user.cash + change)} عملة`]
  );
  await sendImage(message, img, 'blackjack.png');
}

async function handleRoulette(message, args) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const bet = parseBet(user, args[0]);
  if (bet <= 0 || user.cash < bet) {
    const img = await generateSimpleImage('خطأ', [{ text: `رصيدك: ${ar(user.cash)}` }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const num = Math.floor(Math.random() * 37);
  const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num);
  const isWin = Math.random() < 0.45;
  const change = isWin ? bet : -bet;
  updateUser(message.author.id, message.guild.id, { cash: user.cash + change });
  addXp(message.author.id, message.guild.id, 12);
  const img = await generateGameResultImage(
    'الروليت 🎡',
    `الرقم: ${num} ${isRed ? '🔴' : num === 0 ? '🟢' : '⚫'}`,
    Math.abs(change),
    isWin,
    [isWin ? '🎉 ربحت!' : '💔 خسرت!', `رصيدك: ${ar(user.cash + change)} عملة`]
  );
  await sendImage(message, img, 'roulette.png');
}

async function handleGuess(message, args) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const guessNum = parseInt(args[0]);
  const bet = parseBet(user, args[1]);
  if (isNaN(guessNum) || guessNum < 1 || guessNum > 10 || bet <= 0 || user.cash < bet) {
    const img = await generateSimpleImage('خطأ', [{ text: 'الاستخدام: تخمين [1-10] [مبلغ]' }], '#ff4444', '❌');
    return sendImage(message, img);
  }
  const secret = Math.floor(Math.random() * 10) + 1;
  const isWin = guessNum === secret;
  const change = isWin ? bet * 8 : -bet;
  updateUser(message.author.id, message.guild.id, { cash: user.cash + change });
  addXp(message.author.id, message.guild.id, 10);
  const img = await generateGameResultImage(
    'لعبة التخمين 🔮',
    `الرقم كان: ${secret}`,
    Math.abs(change),
    isWin,
    [isWin ? '🎯 أصبت! مضاعف x8!' : `خمنت: ${guessNum}`, `رصيدك: ${ar(user.cash + change)} عملة`]
  );
  await sendImage(message, img, 'guess.png');
}

async function handleLuck(message) {
  const user = getUser(message.author.id, message.guild.id, message.author.username);
  const luck = Math.floor(Math.random() * 100) + 1;
  let result, bonus = 0;
  if (luck >= 90) { result = '🌟 حظك رائع جداً!'; bonus = 1000; }
  else if (luck >= 70) { result = '⭐ حظك جيد!'; bonus = 300; }
  else if (luck >= 50) { result = '😊 حظك معقول'; bonus = 100; }
  else if (luck >= 30) { result = '😐 حظك عادي'; bonus = 0; }
  else { result = '😔 حظك سيئ اليوم'; bonus = 0; }

  if (bonus > 0) updateUser(message.author.id, message.guild.id, { cash: user.cash + bonus });

  const img = await generateSimpleImage('الحظ اليومي 🍀', [
    { text: `حظك: ${luck}/100`, highlight: true },
    { text: result },
    bonus > 0 ? { left: '🎁 مكافأة الحظ', right: `${ar(bonus)} عملة`, rightColor: '#ffd700' } : { text: 'لا يوجد مكافأة اليوم' },
  ], '#44ff88', '🍀');
  await sendImage(message, img, 'luck.png');
}

module.exports = { handleCoinFlip, handleDice, handleSlots, handleBlackjack, handleRoulette, handleGuess, handleLuck };
