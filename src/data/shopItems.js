const SHOP_ITEMS = {
  'عصا_صيد': { name: 'عصا صيد', emoji: '🎣', price: 500, description: 'تزيد مكاسب الصيد', effect: '+30% صيد', type: 'tool' },
  'معول': { name: 'معول', emoji: '⛏️', price: 700, description: 'تزيد مكاسب التعدين', effect: '+30% تعدين', type: 'tool' },
  'فأس': { name: 'فأس', emoji: '🪓', price: 600, description: 'تزيد مكاسب الاحتطاب', effect: '+30% احتطاب', type: 'tool' },
  'بذور': { name: 'بذور', emoji: '🌱', price: 300, description: 'تزيد مكاسب الزراعة', effect: '+30% زراعة', type: 'tool' },
  'سلاح': { name: 'سلاح', emoji: '🗡️', price: 2000, description: 'يزيد نجاح الجرائم', effect: '+40% جريمة', type: 'weapon' },
  'درع': { name: 'درع', emoji: '🛡️', price: 1500, description: 'يقلل غرامة الفشل', effect: '-30% غرامة', type: 'armor' },
  'قفازات': { name: 'قفازات', emoji: '🧤', price: 1200, description: 'يزيد نجاح السرقة', effect: '+25% سرقة', type: 'tool' },
  'سيارة': { name: 'سيارة', emoji: '🚗', price: 5000, description: 'تسريع الوصول للعمل', effect: '-10 دقيقة عمل', type: 'vehicle' },
  'حقيبة_كبيرة': { name: 'حقيبة كبيرة', emoji: '🎒', price: 3000, description: 'تزيد سعة الحقيبة', effect: '+20 غرض', type: 'utility' },
  'كتاب_خبرة': { name: 'كتاب خبرة', emoji: '📚', price: 1000, description: 'يعطيك خبرة فورية', effect: '+500 XP', type: 'consumable' },
  'حظ': { name: 'تعويذة الحظ', emoji: '🍀', price: 800, description: 'يزيد حظك في الألعاب', effect: '+15% فوز', type: 'consumable' },
  'صندوق_غامض': { name: 'صندوق غامض', emoji: '📦', price: 2500, description: 'محتوى عشوائي!', effect: '؟؟؟', type: 'consumable' },
};

const PROPERTIES = {
  'غرفة': { name: 'غرفة', emoji: '🚪', price: 5000, rent: 50, description: 'غرفة متواضعة' },
  'شقة': { name: 'شقة', emoji: '🏢', price: 20000, rent: 200, description: 'شقة في المدينة' },
  'منزل': { name: 'منزل', emoji: '🏠', price: 80000, rent: 800, description: 'منزل عائلي' },
  'فيلا': { name: 'فيلا', emoji: '🏡', price: 250000, rent: 2500, description: 'فيلا فاخرة' },
  'قصر': { name: 'قصر', emoji: '🏰', price: 1000000, rent: 10000, description: 'قصر ملكي' },
  'برج': { name: 'برج', emoji: '🗼', price: 5000000, rent: 50000, description: 'برج تجاري' },
  'شركة': { name: 'شركة', emoji: '🏭', price: 20000000, rent: 200000, description: 'شركة ضخمة' },
  'مصنع': { name: 'مصنع', emoji: '🏗️', price: 50000000, rent: 500000, description: 'مصنع إنتاج' },
  'جزيرة': { name: 'جزيرة', emoji: '🏝️', price: 200000000, rent: 2000000, description: 'جزيرة خاصة' },
};

const PETS = {
  'قطة': { name: 'قطة', emoji: '🐱', price: 2000, bonus: 'cash', bonusRate: 0.05, description: 'تزيد الراتب' },
  'كلب': { name: 'كلب', emoji: '🐶', price: 3000, bonus: 'crime', bonusRate: 0.1, description: 'يساعد في الجرائم' },
  'صقر': { name: 'صقر', emoji: '🦅', price: 8000, bonus: 'xp', bonusRate: 0.15, description: 'يزيد الخبرة' },
  'حصان': { name: 'حصان', emoji: '🐴', price: 15000, bonus: 'all', bonusRate: 0.1, description: 'يزيد كل شيء' },
  'ذئب': { name: 'ذئب', emoji: '🐺', price: 25000, bonus: 'steal', bonusRate: 0.2, description: 'يزيد السرقة' },
  'نمر': { name: 'نمر', emoji: '🐯', price: 50000, bonus: 'all', bonusRate: 0.2, description: 'يزيد كل شيء' },
};

const JOBS = {
  'عامل': { name: 'عامل', emoji: '👷', salary: 200, cooldown: 3600000, requirements: { level: 1, cash: 0 } },
  'مزارع': { name: 'مزارع', emoji: '🧑‍🌾', salary: 350, cooldown: 3600000, requirements: { level: 3, cash: 1000 } },
  'صياد': { name: 'صياد', emoji: '🎣', salary: 400, cooldown: 3600000, requirements: { level: 5, cash: 2000 } },
  'نجار': { name: 'نجار', emoji: '🪚', salary: 500, cooldown: 3600000, requirements: { level: 7, cash: 5000 } },
  'شرطي': { name: 'شرطي', emoji: '👮', salary: 700, cooldown: 3600000, requirements: { level: 10, cash: 10000 } },
  'طبيب': { name: 'طبيب', emoji: '👨‍⚕️', salary: 1200, cooldown: 3600000, requirements: { level: 15, cash: 30000 } },
  'مهندس': { name: 'مهندس', emoji: '👨‍💻', salary: 1500, cooldown: 3600000, requirements: { level: 20, cash: 60000 } },
  'محامي': { name: 'محامي', emoji: '⚖️', salary: 2000, cooldown: 3600000, requirements: { level: 25, cash: 100000 } },
  'مدير': { name: 'مدير', emoji: '💼', salary: 3000, cooldown: 3600000, requirements: { level: 35, cash: 300000 } },
  'رجل أعمال': { name: 'رجل أعمال', emoji: '🤵', salary: 5000, cooldown: 3600000, requirements: { level: 50, cash: 1000000 } },
};

module.exports = { SHOP_ITEMS, PROPERTIES, PETS, JOBS };
