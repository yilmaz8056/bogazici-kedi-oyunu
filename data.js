// Boğaziçi Üniversitesi Kedi Besleme Oyunu - Veri ve Konfigürasyon Dosyası

const GAME_DATA = {
  // Kampüs Mekanları
  locations: {
    guney_cimler: {
      id: "guney_cimler",
      name: "Güney Çimler",
      sub: "Albert Long Hall & Hamlin Önü",
      description: "Boğaziçi klasiği. Güneşli günlerde çimlere uzanan öğrenciler, frizbi oynayanlar ve çanta üstünde uyuyan patiler.",
      bgGradient: "linear-gradient(180deg, #70c4ff 0%, #b8e6fe 50%, #68b855 75%, #428a30 100%)",
      cats: ["fistik", "pamuk"],
      icon: "fa-seedling",
      vibe: "Canlı, Neşeli, Güneşli",
      landmark: "Tarihi Binalar & Manzara Merdivenleri"
    },
    bogaz_manzara: {
      id: "bogaz_manzara",
      name: "Manzara (Güney Boğaz)",
      sub: "Aşiyan ve Boğaziçi Köprüsü Manzarası",
      description: "İstanbul Boğazı'nın masmavi sularına ve gemilere bakan taş duvar. Boğaziçi'nin en bilge kedisi Reis burayı yönetir.",
      bgGradient: "linear-gradient(180deg, #3a7bd5 0%, #3a6073 50%, #1f3c58 85%, #566779 100%)",
      cats: ["reis"],
      icon: "fa-water",
      vibe: "Huzurlu, Felsefi, Esintili",
      landmark: "Tarihi Taş Korkuluk & Boğaz Köprüsü"
    },
    kutuphane: {
      id: "kutuphane",
      name: "Aptullah Kuran Kütüphanesi",
      sub: "Kütüphane Bahçesi & 2. Kat Masaları",
      description: "Finallerde sabahlanan, kahve kokan sessiz tapınak. Sandalyelerde ve kitap yığınlarının üstünde uyuyan tüylü kütüphaneciler.",
      bgGradient: "linear-gradient(180deg, #2b3a4a 0%, #485563 50%, #685a4a 80%, #3d2f24 100%)",
      cats: ["prof_mirmir"],
      icon: "fa-book-open",
      vibe: "Sessiz, Odaklanmış, Kahve Kokulu",
      landmark: "Kitap Rafları & Masa Lambaları"
    },
    kuzey_yemekhane: {
      id: "kuzey_yemekhane",
      name: "Kuzey Kampüs & Yemekhane",
      sub: "Petek Binası & Turnikeler",
      description: "Öğle yemeği saati öğrenci akını! Turnikelerin hemen önünde 'tavuk ve köfte' vergisi toplayan kedi çetesi.",
      bgGradient: "linear-gradient(180deg, #e0c3fc 0%, #8ec5fc 60%, #9cb3c9 80%, #76889b 100%)",
      cats: ["piramit"],
      icon: "fa-utensils",
      vibe: "Hareketli, Kokulu, İştahlı",
      landmark: "Yemekhane Sırası & Petek Meydanı"
    },
    mafm: {
      id: "mafm",
      name: "Mithat Alam Film Merkezi (MAFM)",
      sub: "MAFM Bahçesi & Sinema Koltukları",
      description: "Ağaçların altındaki kırmızı koltuklar, sinema afişleri ve sanat sohbetleri. Entel kedimiz Gölge'nin film stüdyosu.",
      bgGradient: "linear-gradient(180deg, #380036 0%, #0cbaba 65%, #2a6855 85%, #184236 100%)",
      cats: ["golge"],
      icon: "fa-film",
      vibe: "Bohem, Sinematik, Sanatsal",
      landmark: "Kırmızı Sinema Koltukları & Afişler"
    },
    muhendislik_kare: {
      id: "muhendislik_kare",
      name: "Kare Blok / Mühendislik",
      sub: "CmpE & EE Laboratuvarları Koridoru",
      description: "Algoritmalar, devre kartları ve kahve makineleri. Kod yazanların sıcacık laptop klavyelerine yatan teknoloji tutkunu kediler.",
      bgGradient: "linear-gradient(180deg, #141e30 0%, #243b55 60%, #2c5364 85%, #1d333d 100%)",
      cats: ["byte"],
      icon: "fa-laptop-code",
      vibe: "Teknolojik, Sıcak, Bug-Savar",
      landmark: "Sunucu Kabinleri & Kodlama Masası"
    }
  },

  // Kediler
  cats: {
    reis: {
      id: "reis",
      name: "Reis",
      title: "Boğaz'ın & Manzara'nın Bilge Efendisi",
      location: "bogaz_manzara",
      breed: "İri Sarman Tekir",
      furColor: "#e67e22",
      badge: "Efsanevi",
      hunger: 40,
      happiness: 55,
      friendship: 1,
      friendshipXP: 0,
      favFood: "gourmet_can",
      dislikedFood: "cheap_kibble",
      personality: "Ağırbaşlı, bilge, seçici. Herkesin mamasına tenezzül etmez, Boğaz'a dalıp uzaklara bakar.",
      lore: "8 senedir Boğaziçi'nde. 'Rektörler gelir geçer, Manzara'da tek Reis kalır' sözünün bizzat sahibidir. Boğaz vapur düdüğünü duyunca kulaklarını diker.",
      sweetSpot: "chin",
      biteSpot: "belly",
      photoUnlocked: false,
      quote: "Mroww... Boğaz bugün yine dalgalı, somonlu mamayı hak ettik genç."
    },
    prof_mirmir: {
      id: "prof_mirmir",
      name: "Prof. Mırmır",
      title: "Fahri Kütüphane Dekanı & GPA Kurtarıcısı",
      location: "kutuphane",
      breed: "Gözlüklü Smokin (Tuxedo)",
      furColor: "#2c3e50",
      badge: "Akademik",
      hunger: 50,
      happiness: 60,
      friendship: 1,
      friendshipXP: 0,
      favFood: "catnip",
      dislikedFood: "messy_meat",
      personality: "Sessizlik aşığı, titiz. Sayfa hışırtısını ve kedi nanesini çok sever. Masada ders çalışanların not kağıdına oturur.",
      lore: "Aptullah Kuran Kütüphanesi'nin 2. katında felsefe ve matematik raflarında kestirir. Vizeden önce kafasını okşayanların en az BB aldığı Boğaziçi efsanesidir.",
      sweetSpot: "ears",
      biteSpot: "tail",
      photoUnlocked: false,
      quote: "Şşşt... Kütüphanede sessiz ol. Kedi nanesini masaya bırak ve dersine dön."
    },
    piramit: {
      id: "piramit",
      name: "Piramit",
      title: "Yemekhane Turnike Şefi & Gurme",
      location: "kuzey_yemekhane",
      breed: "Tombul Calico (Üç Renkli)",
      furColor: "#d35400",
      badge: "Obur Muhafız",
      hunger: 20,
      happiness: 45,
      friendship: 1,
      friendshipXP: 0,
      favFood: "chicken_plate",
      dislikedFood: "diet_treat",
      personality: "Doymak nedir bilmez, sevimli miyavlamalarla öğrencilerin yemekhane tepsilerini vergilendirir.",
      lore: "Turnikelerin dibinde nöbet tutar. BUCARD basmadan geçen tek kampüs mensubudur. Öğrenciler ona 'Tombiş Turnike' de der.",
      sweetSpot: "cheeks",
      biteSpot: "belly",
      photoUnlocked: false,
      quote: "Miyavvv! Tavuklu menü mü aldın? Payımı vermeden Kuzey Çimler'e geçiş yok!"
    },
    golge: {
      id: "golge",
      name: "Gölge",
      title: "MAFM'nin Bağımsız Film Yönetmeni",
      location: "mafm",
      breed: "Gece Karası Panter (Bombay)",
      furColor: "#1a1a1a",
      badge: "Entelektüel",
      hunger: 60,
      happiness: 50,
      friendship: 1,
      friendshipXP: 0,
      favFood: "tuna_stick",
      dislikedFood: "cheap_kibble",
      personality: "Gizemli, mesafeli ama sanat aşığı. Sinema salonunun kırmızı kadife koltuğunda uyur.",
      lore: "Mithat Alam Film Merkezi'nin açık hava gösterimlerinde perdenin önünden ağır ağır geçerek sahneye derinlik katar. Godard ve Kiarostami filmlerine bayılır.",
      sweetSpot: "back",
      biteSpot: "paws",
      photoUnlocked: false,
      quote: "Mırrr... Hayat 24 karelik bir rüya, ödül çubuğun ise saf bir şiir."
    },
    byte: {
      id: "byte",
      name: "Byte",
      title: "Mühendislik Baş Bug-Savar Kedisi",
      location: "muhendislik_kare",
      breed: "Gri Çizgili Tekir (Silver Tabby)",
      furColor: "#7f8c8d",
      badge: "Mühendis",
      hunger: 45,
      happiness: 50,
      friendship: 1,
      friendshipXP: 0,
      favFood: "cheap_kibble",
      dislikedFood: "watery_soup",
      personality: "Sıcak laptopları sever, Space tuşuna basarak kodun derlenmesini sağlar. Gece lab sabahlamalarının en büyük yoldaşı.",
      lore: "CmpE labında sabahlarken kafan klavyeye düştüğünde gelip omzuna tırmanır. 3 tane öğrencinin projesindeki 'Infinite Loop' bug'ını kuyruğuyla kapatmıştır.",
      sweetSpot: "head",
      biteSpot: "belly",
      photoUnlocked: false,
      quote: "Prrr-beep! Klavyen çok sıcak, tam uyunacak kıvamda. Kodun bittiyse çıtır kuru mama saatim geldi."
    },
    fistik: {
      id: "fistik",
      name: "Fıstık",
      title: "Güney Çimlerin Güneş Perisi",
      location: "guney_cimler",
      breed: "Sarı-Beyaz Pofuduk",
      furColor: "#f39c12",
      badge: "Oyuncu",
      hunger: 35,
      happiness: 65,
      friendship: 1,
      friendshipXP: 0,
      favFood: "kitten_milk",
      dislikedFood: "hard_bone",
      personality: "Çantaların içine dalar, çimlerde gitar çalanların kucağına atlar.",
      lore: "Bahar festivalinde ana sahneye fırlayıp solistin bacağına sürtünerek konser videosunu viral yapmıştır.",
      sweetSpot: "chin",
      biteSpot: "tail",
      photoUnlocked: false,
      quote: "Miyav! Çantanın fermuarını açık unutmuşsun, tam benlik pofuduk bir yuva!"
    },
    pamuk: {
      id: "pamuk",
      name: "Pamuk",
      title: "Güney Çimlerin Beyaz Yumağı",
      location: "guney_cimler",
      breed: "Kar Beyazı Van Melezi",
      furColor: "#ffffff",
      badge: "Uykucu Bebek",
      hunger: 25,
      happiness: 75,
      friendship: 1,
      friendshipXP: 0,
      favFood: "kitten_milk",
      dislikedFood: "cheap_kibble",
      personality: "Tüy yumağı gibi yuvarlanır, güneş ışığının vurduğu taşlarda tatlı tatlı esner.",
      lore: "Gözlerinin biri kehribar biri açık mavidir. Çimlerde güneşlenenlerin güneş gözlüklerini patilemeye bayılır.",
      sweetSpot: "ears",
      biteSpot: "belly",
      photoUnlocked: false,
      quote: "Purrr... Güneş sıcacık, laktozsuz sütümü içip Hamlin merdivenlerinde kestireceğim."
    }
  },

  // Eşyalar & Mamalar
  items: {
    cheap_kibble: {
      id: "cheap_kibble",
      name: "Çıtır Kuru Mama",
      type: "food",
      price: 15,
      hungerValue: 25,
      happyValue: 12,
      desc: "Hisarüstü bakkalından çıtır kuru mama. Bütün kedilerin karnını doyurur.",
      icon: "fa-bowl-rice"
    },
    gourmet_can: {
      id: "gourmet_can",
      name: "Gurme Somonlu Yaş Mama",
      type: "food",
      price: 45,
      hungerValue: 50,
      happyValue: 35,
      desc: "Boğaz Reis'inin vazgeçilmezi. Jöleli somon balığı parçacıkları.",
      icon: "fa-fish"
    },
    chicken_plate: {
      id: "chicken_plate",
      name: "Yemekhane Haşlama Tavuğu",
      type: "food",
      price: 35,
      hungerValue: 50,
      happyValue: 30,
      desc: "Kuzey Yemekhane menüsünden kediler için ayrılmış mis gibi haşlama tavuk.",
      icon: "fa-drumstick-bite"
    },
    tuna_stick: {
      id: "tuna_stick",
      name: "Tuna Ödül Çubuğu (Kedi Şekeri)",
      type: "food",
      price: 30,
      hungerValue: 20,
      happyValue: 40,
      desc: "Kedilerin görünce çıldırdığı leziz krema ödül çubuğu.",
      icon: "fa-candy-cane"
    },
    catnip: {
      id: "catnip",
      name: "Organik Kedi Nanesi (Catnip)",
      type: "food",
      price: 55,
      hungerValue: 10,
      happyValue: 60,
      desc: "Kütüphane kedilerini bile mest eden, neşelendiren doğal kedi otu.",
      icon: "fa-cannabis"
    },
    kitten_milk: {
      id: "kitten_milk",
      name: "Laktozsuz Yavru Kedi Sütü",
      type: "food",
      price: 25,
      hungerValue: 35,
      happyValue: 35,
      desc: "Güney Çimler'deki yavru kedi kardeşler için özel besleyici süt.",
      icon: "fa-glass-water"
    },
    brush: {
      id: "brush",
      name: "Bambu Masaj Tarağı",
      type: "toy",
      price: 75,
      happyValue: 30,
      desc: "Dökülen tüyleri temizler, kedinin mırlama frekansını tavana çıkarır.",
      icon: "fa-brush"
    },
    laser_toy: {
      id: "laser_toy",
      name: "Kırmızı Lazer & İpli Fare",
      type: "toy",
      price: 90,
      happyValue: 45,
      desc: "Kedileri peşinden koşturup enerjisini boşaltan eğlenceli oyuncak.",
      icon: "fa-wand-magic-sparkles"
    },
    camera_film: {
      id: "camera_film",
      name: "Polaroid Film Paketi",
      type: "tool",
      price: 40,
      desc: "Kampüs kedilerinin en tatlı anlarını ölümsüzleştirmek için yedek film.",
      icon: "fa-camera-retro"
    }
  },

  // Bölümler
  departments: [
    {
      id: "cmpe",
      name: "Bilgisayar Mühendisliği (CmpE)",
      perk: "Byte ile labda özel bağ: Mühendislik kedilerinden +%30 Pati Puanı",
      bonusCat: "byte"
    },
    {
      id: "econ",
      name: "İktisat (Econ)",
      perk: "Bütçe yöneticisi: Hisarüstü Pet Shop'ta tüm mamalara %20 İndirim",
      bonusCat: null
    },
    {
      id: "phil",
      name: "Felsefe & Edebiyat (Phil)",
      perk: "Boğaz Manzarası aşığı: Reis ile dostluk kurmak 2 kat daha hızlı",
      bonusCat: "reis"
    },
    {
      id: "psy",
      name: "Psikoloji (Psy)",
      perk: "Mırlama Terapisi: Kedi severken stresini anında sıfırlar ve ilham verir",
      bonusCat: null
    },
    {
      id: "mbg",
      name: "Moleküler Biyoloji & Genetik (MBG)",
      perk: "Sağlık uzmanı: Kedilerin sağlık ve tokluk barları %50 daha yavaş düşer",
      bonusCat: null
    }
  ],

  // Görevler
  quests: [
    {
      id: "q_first_feed",
      title: "İlk Pati Dostluğu",
      desc: "Herhangi bir Boğaziçi kedisine ilk mamasını ver.",
      reward: 50,
      done: false
    },
    {
      id: "q_feed_reis",
      title: "Manzara'nın Reisi'ne Hürmet",
      desc: "Boğaz manzaralı taş duvarda Reis'e Somonlu Gurme Yaş Mama ikram et.",
      reward: 80,
      done: false
    },
    {
      id: "q_mirmir_study",
      title: "Finallere Mırlamalı Hazırlık",
      desc: "Kütüphanede Prof. Mırmır'ı mırlayana kadar sev ve stresini düşür.",
      reward: 70,
      done: false
    },
    {
      id: "q_dining_hall",
      title: "Yemekhane Kaçamağı",
      desc: "Kuzey Kampüs'te Piramit'e yemekhane haşlanmış tavuğu ver.",
      reward: 75,
      done: false
    },
    {
      id: "q_all_locations",
      title: "Tüm Kampüsü Adımla",
      desc: "Boğaziçi'nin 6 ikonik mekanını da ziyaret et ve kedileriyle tanış.",
      reward: 150,
      done: false
    },
    {
      id: "q_photo_master",
      title: "Pati Fotoğrafçısı",
      desc: "En az 3 farklı kedinin Polaroid fotoğrafını albümüne ekle.",
      reward: 120,
      done: false
    }
  ],

  // Başarımlar
  achievements: [
    { id: "ach_cat_whisperer", title: "Kedi Fısıldayıcısı", desc: "Bir kediyi 5. seviye En Yakın Dost yap.", icon: "fa-crown", unlocked: false },
    { id: "ach_boun_legend", title: "Boğaziçi Çim Klasiği", desc: "Güney Çimlerde 3 kediyi aynı anda mutlu et.", icon: "fa-certificate", unlocked: false },
    { id: "ach_purr_zen", title: "Mırlama Meditasyonu", desc: "Kesintisiz 60 saniye kedi mırlaması dinle.", icon: "fa-heart", unlocked: false },
    { id: "ach_bosphorus_prince", title: "Boğaz'ın Efendisi", desc: "Reis'in en güvendiği öğrenci ol.", icon: "fa-anchor", unlocked: false }
  ]
};

window.GAME_DATA = GAME_DATA;
