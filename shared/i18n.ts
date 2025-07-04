export type Language = 'en' | 'zh' | 'ar' | 'id';

export const translations = {
  en: {
    // Welcome
    'welcome.title': 'Welcome to LetBabyTalk',
    'welcome.subtitle': 'Your AI-powered parenting assistant to understand baby cries and needs',
    'welcome.signInSignUp': 'Sign In / Sign Up',
    'welcome.continueAsGuest': 'Continue as Guest',
    'welcome.guestInfo': 'Guest accounts give you full access. You can create a permanent account later.',

    // Onboarding
    'onboarding.welcome': 'Welcome to LetBabyTalk',
    'onboarding.subtitle': 'Your Personalized Parenting Assistant',
    'onboarding.features.understand': 'Better understand your baby\'s needs',
    'onboarding.features.explain': 'Explain the reason why baby cries',
    'onboarding.features.advice': 'Provide personalized advice',
    'onboarding.getStarted': 'Get Started',
    'onboarding.continueAsGuest': 'Continue As Guest',
    'onboarding.languageSelection': 'Select Language',
    'onboarding.next': 'Next',
    'onboarding.ok': 'OK',

    // Navigation
    'nav.chatbot': 'Chatbot',
    'nav.advisor': 'Advisor',
    'nav.home': 'Home',
    'nav.record': 'Record',
    'nav.history': 'History',
    'nav.settings': 'Settings',

    // Home
    'home.enterBabyInfo': 'Enter your baby\'s info',
    'home.premium': 'Premium',
    'home.tapToRecord': 'Tap to start recording',
    'home.recording': 'Recording...',
    'home.tapToStop': 'Tap again to stop recording',
    'home.recordMore': 'Record more than 8 seconds to get better results',

    // Baby Profile
    'babyProfile.title': 'Baby Profile',
    'babyProfile.add': 'Add Baby Profile',
    'babyProfile.name': 'Name',
    'babyProfile.dateOfBirth': 'Date Of Birth',
    'babyProfile.male': 'MALE',
    'babyProfile.female': 'FEMALE',
    'babyProfile.save': 'Save',
    'babyProfile.delete': 'Delete',
    'babyProfile.cancel': 'Cancel',
    'babyProfile.noProfiles': 'No baby profiles yet. Add your first one!',
    'babyProfile.enterName': 'Enter baby\'s name',

    // Settings
    'settings.account': 'Account',
    'settings.babyProfile': 'Baby Profile',
    'settings.language': 'Language',
    'settings.userGuide': 'User Guide',
    'settings.subscription': 'Subscription',
    'settings.terms': 'Terms and Conditions',
    'settings.privacy': 'Privacy Policy',
    'settings.contact': 'Contact Us',
    'settings.signOut': 'Sign Out',

    // History
    'history.title': 'History',
    'history.noRecordings': 'No recordings yet',
    'history.startRecording': 'Start recording baby cries to see analysis history here',
    'history.makeFirst': 'Make First Recording',
    'history.recommendations': 'Recommendations:',
    'history.confidence': 'confidence',
    'history.timeRange': 'Time Range',
    'history.day': 'Day',
    'history.week': 'Week',
    'history.month': 'Month',
    'history.custom': 'Custom',
    'history.statistics': 'Statistics',
    'history.total': 'Total',
    'history.recordings': 'Recordings',
    'history.noRecordingsInRange': 'No recordings for selected time range',
    'history.noRecordingsInCustomRange': 'No recordings for selected date range',
    'history.showing': 'Showing',
    'history.showMore': 'Show More',
    'history.showLess': 'Show Less',
    'history.babySelection': "Baby Selection",
    'history.allBabies': "All Babies",
    'history.showingRecordsFor': "Showing records for",
    'history.topCategory': "Top Category",
    'history.categories': "Categories",
    'history.avgPerCategory': "Avg/Category",

    // Categories
    'categories.hunger_food': 'Hunger (Food)',
    'categories.hunger_milk': 'Hunger (Milk)',
    'categories.sleepiness': 'Sleepiness',
    'categories.lack_of_security': 'Lack of Security',
    'categories.diaper_urine': 'Diaper (Urine)',
    'categories.diaper_bowel': 'Diaper (Bowel)',
    'categories.internal_pain': 'Internal Pain',
    'categories.external_pain': 'External Pain',
    'categories.physical_discomfort': 'Physical Discomfort',
    'categories.unmet_needs': 'Unmet Needs',
    'categories.breathing_difficulties': 'Breathing Difficulties',
    'categories.normal': 'Normal',
    'categories.no_cry_detected': 'No Cry Detected',
    'categories.unknown': 'Unknown',

    // Common
    'common.loading': 'Loading...',
    'common.analyzing': 'Analyzing...',
    'common.play': 'Play',
    'common.stop': 'Stop',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.error': 'Error',
    'common.success': 'Success',

    // Errors
    'error.unauthorized': 'You are logged out. Logging in again...',
    'error.failedToCreate': 'Failed to create baby profile',
    'error.failedToDelete': 'Failed to delete baby profile',
    'error.uploadFailed': 'Failed to analyze recording. Please try again.',

    // Success messages
    'success.profileCreated': 'Baby profile created successfully!',
    'success.profileDeleted': 'Baby profile deleted successfully!',
    'success.analysisComplete': 'Analysis Complete!',

    'settings.termsDesc': 'Review our terms of service',
    'settings.privacyDesc': 'Learn how we protect your data',

    'history.unknownBaby': 'Unknown Baby',
    'history.total': 'total',
    'history.noRecordingsTitle': 'No Recordings Found',
    'history.confidence': 'confidence',
    'history.viewAnalysis': 'View Analysis',
    'history.helpful': 'Helpful',
    'history.notHelpful': 'Not Helpful',
  },

  zh: {
    // Onboarding
    'onboarding.welcome': '欢迎来到LetBabyTalk',
    'onboarding.subtitle': '您的个性化育儿助手',
    'onboarding.features.understand': '更好地理解宝宝的需求',
    'onboarding.features.explain': '解释宝宝哭泣的原因',
    'onboarding.features.advice': '提供个性化建议',
    'onboarding.getStarted': '开始使用',
    'onboarding.continueAsGuest': '作为访客继续',
    'onboarding.languageSelection': '选择语言',
    'onboarding.next': '下一步',
    'onboarding.ok': '确定',

    // Navigation
    'nav.chatbot': '聊天机器人',
    'nav.advisor': '顾问',
    'nav.home': '首页',
    'nav.history': '历史',
    'nav.settings': '设置',

    // Home
    'home.enterBabyInfo': '输入您宝宝的信息',
    'home.premium': '高级版',
    'home.tapToRecord': '点击开始录音',
    'home.recording': '录音中...',
    'home.tapToStop': '再次点击停止录音',
    'home.recordMore': '录音超过8秒以获得更好的结果',

    // Baby Profile
    'babyProfile.title': '宝宝档案',
    'babyProfile.add': '添加宝宝档案',
    'babyProfile.name': '姓名',
    'babyProfile.dateOfBirth': '出生日期',
    'babyProfile.male': '男孩',
    'babyProfile.female': '女孩',
    'babyProfile.save': '保存',
    'babyProfile.delete': '删除',
    'babyProfile.cancel': '取消',
    'babyProfile.noProfiles': '还没有宝宝档案。添加第一个吧！',
    'babyProfile.enterName': '输入宝宝的名字',

    // Settings
    'settings.account': '账户',
    'settings.babyProfile': '宝宝档案',
    'settings.language': '语言',
    'settings.userGuide': '用户指南',
    'settings.subscription': '订阅',
    'settings.terms': '条款和条件',
    'settings.privacy': '隐私政策',
    'settings.contact': '联系我们',
    'settings.signOut': '退出登录',

    // History
    'history.title': '历史记录',
    'history.noRecordings': '还没有录音',
    'history.startRecording': '开始录制宝宝哭声以查看分析历史',
    'history.makeFirst': '进行第一次录音',
    'history.recommendations': '建议：',
    'history.confidence': '置信度',
    'history.timeRange': '时间范围',
    'history.day': '今天',
    'history.week': '本周',
    'history.month': '本月',
    'history.custom': '自定义',
    'history.statistics': '统计',
    'history.total': '总计',
    'history.recordings': '录音记录',
    'history.noRecordingsInRange': '所选时间范围内没有录音',
    'history.noRecordingsInCustomRange': '所选日期范围内没有录音',
    'history.showing': '显示',
    'history.showMore': "显示更多",
    'history.showLess': "显示更少",
    'history.babySelection': "宝宝选择",
    'history.allBabies': "所有宝宝",
    'history.showingRecordsFor': "显示记录为",
    'history.topCategory': "最多类别",
    'history.categories': "类别",
    'history.avgPerCategory': "平均/类别",

    // Categories
    'categories.hunger_food': '饥饿 (食物)',
    'categories.hunger_milk': '饥饿 (奶水)',
    'categories.sleepiness': '困倦',
    'categories.lack_of_security': '缺乏安全感',
    'categories.diaper_urine': '尿布 (尿液)',
    'categories.diaper_bowel': '尿布 (排便)',
    'categories.internal_pain': '内部疼痛',
    'categories.external_pain': '外部疼痛',
    'categories.physical_discomfort': '身体不适',
    'categories.unmet_needs': '需求未满足',
    'categories.breathing_difficulties': '呼吸困难',
    'categories.normal': '正常',
    'categories.no_cry_detected': '未检测到哭声',
    'categories.unknown': '未知',

    // Common
    'common.loading': '加载中...',
    'common.analyzing': '分析中...',
    'common.play': '播放',
    'common.stop': '停止',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.error': '错误',
    'common.success': '成功',

    // Errors
    'error.unauthorized': '您已退出登录。正在重新登录...',
    'error.failedToCreate': '创建宝宝档案失败',
    'error.failedToDelete': '删除宝宝档案失败',
    'error.uploadFailed': '分析录音失败。请重试。',

    // Success messages
    'success.profileCreated': '宝宝档案创建成功！',
    'success.profileDeleted': '宝宝档案删除成功！',
    'success.analysisComplete': '分析完成！',

    'settings.termsDesc': 'Review our terms of service',
    'settings.privacyDesc': 'Learn how we protect your data',
  },

  ar: {
    // Onboarding
    'onboarding.welcome': 'مرحباً بك في LetBabyTalk',
    'onboarding.subtitle': 'مساعدك الشخصي في تربية الأطفال',
    'onboarding.features.understand': 'فهم احتياجات طفلك بشكل أفضل',
    'onboarding.features.explain': 'تفسير سبب بكاء الطفل',
    'onboarding.features.advice': 'تقديم نصائح شخصية',
    'onboarding.getStarted': 'ابدأ',
    'onboarding.continueAsGuest': 'المتابعة كضيف',
    'onboarding.languageSelection': 'اختر اللغة',
    'onboarding.next': 'التالي',
    'onboarding.ok': 'موافق',

    // Navigation
    'nav.chatbot': 'المحادثة',
    'nav.advisor': 'المستشار',
    'nav.home': 'الرئيسية',
    'nav.history': 'التاريخ',
    'nav.settings': 'الإعدادات',

    // Home
    'home.enterBabyInfo': 'أدخل معلومات طفلك',
    'home.premium': 'مميز',
    'home.tapToRecord': 'اضغط لبدء التسجيل',
    'home.recording': 'جاري التسجيل...',
    'home.tapToStop': 'اضغط مرة أخرى لإيقاف التسجيل',
    'home.recordMore': 'سجل أكثر من 8 ثوانٍ للحصول على نتائج أفضل',

    // Baby Profile
    'babyProfile.title': 'ملف الطفل',
    'babyProfile.add': 'إضافة ملف طفل',
    'babyProfile.name': 'الاسم',
    'babyProfile.dateOfBirth': 'تاريخ الميلاد',
    'babyProfile.male': 'ذكر',
    'babyProfile.female': 'أنثى',
    'babyProfile.save': 'حفظ',
    'babyProfile.delete': 'حذف',
    'babyProfile.cancel': 'إلغاء',
    'babyProfile.noProfiles': 'لا توجد ملفات أطفال بعد. أضف الأول!',
    'babyProfile.enterName': 'أدخل اسم الطفل',

    // Settings
    'settings.account': 'الحساب',
    'settings.babyProfile': 'ملف الطفل',
    'settings.language': 'اللغة',
    'settings.userGuide': 'دليل المستخدم',
    'settings.subscription': 'الاشتراك',
    'settings.terms': 'الشروط والأحكام',
    'settings.privacy': 'سياسة الخصوصية',
    'settings.contact': 'اتصل بنا',
    'settings.signOut': 'تسجيل الخروج',

    // History
    'history.title': 'التاريخ',
    'history.noRecordings': 'لا توجد تسجيلات بعد',
    'history.startRecording': 'ابدأ بتسجيل بكاء الطفل لرؤية تاريخ التحليل هنا',
    'history.makeFirst': 'قم بالتسجيل الأول',
    'history.recommendations': 'التوصيات:',
    'history.confidence': 'الثقة',
    'history.timeRange': 'النطاق الزمني',
    'history.day': 'اليوم',
    'history.week': 'الأسبوع',
    'history.month': 'الشهر',
    'history.custom': 'مخصص',
    'history.statistics': 'الإحصائيات',
    'history.total': 'المجموع',
    'history.recordings': 'التسجيلات',
    'history.noRecordingsInRange': 'لا توجد تسجيلات في النطاق الزمني المحدد',
    'history.noRecordingsInCustomRange': 'لا توجد تسجيلات في النطاق الزمني المخصص',
    'history.showing': 'عرض',
    'history.showMore': "Show More",
    'history.showLess': "Show Less",
    'history.babySelection': "اختيار الطفل",
    'history.allBabies': "كل الأطفال",
    'history.showingRecordsFor': "عرض التسجيلات ل",

    // Categories
    'categories.hunger_food': 'الجوع (طعام)',
    'categories.hunger_milk': 'الجوع (حليب)',
    'categories.sleepiness': 'النعاس',
    'categories.lack_of_security': 'نقص الأمان',
    'categories.diaper_urine': 'الحفاض (بول)',
    'categories.diaper_bowel': 'الحفاض (براز)',
    'categories.internal_pain': 'ألم داخلي',
    'categories.external_pain': 'ألم خارجي',
    'categories.physical_discomfort': 'عدم الراحة الجسدية',
    'categories.unmet_needs': 'احتياجات غير مُلباة',
    'categories.breathing_difficulties': 'صعوبات في التنفس',
    'categories.normal': 'طبيعي',
    'categories.no_cry_detected': 'لم يتم اكتشاف بكاء',
    'categories.unknown': 'غير معروف',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.analyzing': 'جاري التحليل...',
    'common.play': 'تشغيل',
    'common.stop': 'إيقاف',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.error': 'خطأ',
    'common.success': 'نجح',

    // Errors
    'error.unauthorized': 'تم تسجيل خروجك. جاري تسجيل الدخول مرة أخرى...',
    'error.failedToCreate': 'فشل في إنشاء ملف الطفل',
    'error.failedToDelete': 'فشل في حذف ملف الطفل',
    'error.uploadFailed': 'فشل في تحليل التسجيل. يرجى المحاولة مرة أخرى.',

    // Success messages
    'success.profileCreated': 'تم إنشاء ملف الطفل بنجاح!',
    'success.profileDeleted': 'تم حذف ملف الطفل بنجاح!',
    'success.analysisComplete': 'اكتمل التحليل!',

    'settings.termsDesc': 'Review our terms of service',
    'settings.privacyDesc': 'Learn how we protect your data',
  },

  id: {
    // Onboarding
    'onboarding.welcome': 'Selamat datang di LetBabyTalk',
    'onboarding.subtitle': 'Asisten Parenting Personal Anda',
    'onboarding.features.understand': 'Memahami kebutuhan bayi Anda dengan lebih baik',
    'onboarding.features.explain': 'Menjelaskan alasan mengapa bayi menangis',
    'onboarding.features.advice': 'Memberikan saran yang dipersonalisasi',
    'onboarding.getStarted': 'Mulai',
    'onboarding.continueAsGuest': 'Lanjutkan Sebagai Tamu',
    'onboarding.languageSelection': 'Pilih Bahasa',
    'onboarding.next': 'Selanjutnya',
    'onboarding.ok': 'OK',

    // Navigation
    'nav.chatbot': 'Chatbot',
    'nav.advisor': 'Penasihat',
    'nav.home': 'Beranda',
    'nav.history': 'Riwayat',
    'nav.settings': 'Pengaturan',

    // Home
    'home.enterBabyInfo': 'Masukkan info bayi Anda',
    'home.premium': 'Premium',
    'home.tapToRecord': 'Ketuk untuk mulai merekam',
    'home.recording': 'Merekam...',
    'home.tapToStop': 'Ketuk lagi untuk berhenti merekam',
    'home.recordMore': 'Rekam lebih dari 8 detik untuk hasil yang lebih baik',

    // Baby Profile
    'babyProfile.title': 'Profil Bayi',
    'babyProfile.add': 'Tambah Profil Bayi',
    'babyProfile.name': 'Nama',
    'babyProfile.dateOfBirth': 'Tanggal Lahir',
    'babyProfile.male': 'LAKI-LAKI',
    'babyProfile.female': 'PEREMPUAN',
    'babyProfile.save': 'Simpan',
    'babyProfile.delete': 'Hapus',
    'babyProfile.cancel': 'Batal',
    'babyProfile.noProfiles': 'Belum ada profil bayi. Tambahkan yang pertama!',
    'babyProfile.enterName': 'Masukkan nama bayi',

    // Settings
    'settings.account': 'Akun',
    'settings.babyProfile': 'Profil Bayi',
    'settings.language': 'Bahasa',
    'settings.userGuide': 'Panduan Pengguna',
    'settings.subscription': 'Langganan',
    'settings.terms': 'Syarat dan Ketentuan',
    'settings.privacy': 'Kebijakan Privasi',
    'settings.contact': 'Hubungi Kami',
    'settings.signOut': 'Keluar',

    // History
    'history.title': 'Riwayat',
    'history.noRecordings': 'Belum ada rekaman',
    'history.startRecording': 'Mulai merekam tangisan bayi untuk melihat riwayat analisis di sini',
    'history.makeFirst': 'Buat Rekaman Pertama',
    'history.recommendations': 'Rekomendasi:',
    'history.confidence': 'kepercayaan',
    'history.timeRange': 'Rentang Waktu',
    'history.day': 'Hari',
    'history.week': 'Minggu',
    'history.month': 'Bulan',
    'history.custom': 'Kustom',
    'history.statistics': 'Statistik',
    'history.total': 'Total',
    'history.recordings': 'Rekaman',
    'history.noRecordingsInRange': 'Tidak ada rekaman untuk rentang waktu yang dipilih',
    'history.noRecordingsInCustomRange': 'Tidak ada rekaman untuk rentang tanggal yang dipilih',
    'history.showing': 'Menampilkan',
    'history.showMore': "Tampilkan Lebih Banyak",
    'history.showLess': "Tampilkan Lebih Sedikit",
    'history.babySelection': "Pemilihan Bayi",
    'history.allBabies': "Semua Bayi",
    'history.showingRecordsFor': "Menampilkan catatan untuk",
    'history.topCategory': "Kategori Teratas",
    'history.categories': "Kategori",
    'history.avgPerCategory': "Rata-rata/Kategori",

    // Categories
    'categories.hunger_food': 'Lapar (Makanan)',
    'categories.hunger_milk': 'Lapar (Susu)',
    'categories.sleepiness': 'Mengantuk',
    'categories.lack_of_security': 'Kurang Rasa Aman',
    'categories.diaper_urine': 'Popok (Urin)',
    'categories.diaper_bowel': 'Popok (BAB)',
    'categories.internal_pain': 'Nyeri Internal',
    'categories.external_pain': 'Nyeri Eksternal',
    'categories.physical_discomfort': 'Ketidaknyamanan Fisik',
    'categories.unmet_needs': 'Kebutuhan Belum Terpenuhi',
    'categories.breathing_difficulties': 'Kesulitan Bernapas',
    'categories.normal': 'Normal',
    'categories.no_cry_detected': 'Tidak Ada Tangisan Terdeteksi',
    'categories.unknown': 'Tidak Diketahui',

    // Common
    'common.loading': 'Memuat...',
    'common.analyzing': 'Menganalisis...',
    'common.play': 'Putar',
    'common.stop': 'Berhenti',
    'common.save': 'Simpan',
    'common.cancel': 'Batal',
    'common.delete': 'Hapus',
    'common.error': 'Error',
    'common.success': 'Berhasil',

    // Errors
    'error.unauthorized': 'Anda telah logout. Masuk lagi...',
    'error.failedToCreate': 'Gagal membuat profil bayi',
    'error.failedToDelete': 'Gagal menghapus profil bayi',
    'error.uploadFailed': 'Gagal menganalisis rekaman. Silakan coba lagi.',

    // Success messages
    'success.profileCreated': 'Profil bayi berhasil dibuat!',
    'success.profileDeleted': 'Profil bayi berhasil dihapus!',
    'success.analysisComplete': 'Analisis Selesai!',

    'settings.termsDesc': 'Tinjau ketentuan layanan kami',
    'settings.privacyDesc': 'Pelajari cara kami melindungi data Anda',
  },
};

export function getTranslation(language: Language, key: string): string {
  const keys = key.split('.');
  let value: any = translations[language];

  for (const k of keys) {
    value = value?.[k];
  }

  return value || translations.en[key as keyof typeof translations.en] || key;
}

export const languageNames = {
  en: 'English',
  zh: '中文',
  ar: 'العربية',
  id: 'Bahasa Indonesia',
};