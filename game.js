// Boğaziçi Üniversitesi Kedi Besleme Oyunu - Gelişmiş Mobil & Görsel Oyun Motoru

class BounCatGame {
  constructor() {
    this.data = window.GAME_DATA;
    this.sound = window.soundEngine;

    // Oyuncu Durumu (Kalıcı)
    this.player = this.loadPlayerData() || {
      name: "Boğaziçili Öğrenci",
      dept: "cmpe",
      coins: 160,
      stress: 45,
      energy: 90,
      currentLocation: "guney_cimler",
      inventory: {
        cheap_kibble: 4,
        gourmet_can: 2,
        chicken_plate: 1,
        tuna_stick: 3,
        catnip: 1,
        kitten_milk: 2,
        brush: 1,
        laser_toy: 1,
        camera_film: 4
      },
      visitedLocations: ["guney_cimler"],
      album: [],
      studyMinutes: 0
    };

    this.cats = this.loadCatsData() || JSON.parse(JSON.stringify(this.data.cats));
    this.activeCatId = null;
    this.activeToy = null;
    this.timeOfDay = "sunset";
    this.isStudying = false;
    this.studyTimer = null;

    // Canvas & Retina / High-DPI
    this.canvas = null;
    this.ctx = null;
    this.dpr = 1;
    this.virtualWidth = 600;
    this.virtualHeight = 340;
    this.animFrameId = null;
    this.particles = [];
    this.pawPrints = [];

    // Animasyon Durumu
    this.catAnim = {
      breath: 0,
      tailAngle: 0,
      eyeBlink: 0,
      earTwitch: 0,
      isEating: false,
      eatTimer: 0,
      isHissing: false,
      hissTimer: 0,
      lookAtX: 0,
      lookAtY: 0,
      pounceX: 0,
      pounceY: 0
    };

    this.pettingActive = false;
    this.lastPetPos = { x: 0, y: 0 };
    this.petCombo = 0;
    this.laserPos = { x: 0, y: 0, active: false };

    this.init();
  }

  init() {
    this.setupUI();
    this.bindEvents();
    this.updateHUD();
    this.changeLocation(this.player.currentLocation);
    this.startCanvasLoop();

    // Periyodik kedi durumu
    setInterval(() => this.passiveCatTick(), 25000);
  }

  triggerHaptic(type = "light") {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        if (type === "light") navigator.vibrate(10);
        else if (type === "medium") navigator.vibrate(25);
        else if (type === "warning") navigator.vibrate([40, 30, 40]);
        else if (type === "success") navigator.vibrate([25, 40, 25, 50]);
      } catch (e) {}
    }
  }

  loadPlayerData() {
    try {
      const saved = localStorage.getItem("boun_cat_player_v2");
      return saved ? JSON.parse(saved) : null;
    } catch(e) { return null; }
  }

  savePlayerData() {
    try {
      localStorage.setItem("boun_cat_player_v2", JSON.stringify(this.player));
      localStorage.setItem("boun_cat_cats_v2", JSON.stringify(this.cats));
    } catch(e) {}
  }

  loadCatsData() {
    try {
      const saved = localStorage.getItem("boun_cat_cats_v2");
      return saved ? JSON.parse(saved) : null;
    } catch(e) { return null; }
  }

  setupUI() {
    this.canvas = document.getElementById("cat-stage-canvas");
    if (this.canvas) {
      this.ctx = this.canvas.getContext("2d");
      this.resizeCanvas();
      window.addEventListener("resize", () => this.resizeCanvas());
      window.addEventListener("orientationchange", () => setTimeout(() => this.resizeCanvas(), 250));
    }

    // Mekan butonlarını oluştur (Üst Bar Carousel)
    const locTabsContainer = document.getElementById("location-tabs");
    if (locTabsContainer) {
      locTabsContainer.innerHTML = "";
      Object.values(this.data.locations).forEach(loc => {
        const btn = document.createElement("button");
        btn.className = `loc-tab-btn ${loc.id === this.player.currentLocation ? 'active' : ''}`;
        btn.dataset.loc = loc.id;
        btn.innerHTML = `<i class="fa-solid ${loc.icon}"></i> <span>${loc.name}</span>`;
        btn.onclick = () => {
          this.triggerHaptic("light");
          this.changeLocation(loc.id);
        };
        locTabsContainer.appendChild(btn);
      });
    }

    // Mobil Mekan Drawer Grid
    const mobileLocGrid = document.getElementById("mobile-locations-grid");
    if (mobileLocGrid) {
      mobileLocGrid.innerHTML = "";
      Object.values(this.data.locations).forEach(loc => {
        const item = document.createElement("button");
        item.className = `mobile-loc-card ${loc.id === this.player.currentLocation ? 'active' : ''}`;
        item.dataset.loc = loc.id;
        item.innerHTML = `
          <div class="m-loc-icon"><i class="fa-solid ${loc.icon}"></i></div>
          <div class="m-loc-meta">
            <strong>${loc.name}</strong>
            <small>${loc.sub}</small>
          </div>
        `;
        item.onclick = () => {
          this.triggerHaptic("light");
          this.changeLocation(loc.id);
          document.getElementById("locations-modal").classList.remove("active");
        };
        mobileLocGrid.appendChild(item);
      });
    }

    // Bölüm Seçici
    const deptSelect = document.getElementById("dept-selector");
    if (deptSelect) {
      deptSelect.innerHTML = "";
      this.data.departments.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = `${d.name}`;
        if (d.id === this.player.dept) opt.selected = true;
        deptSelect.appendChild(opt);
      });
      deptSelect.onchange = (e) => {
        this.triggerHaptic("light");
        this.player.dept = e.target.value;
        const curDept = this.data.departments.find(d => d.id === this.player.dept);
        this.showToast(`Bölüm Değiştirildi: ${curDept.name}`, curDept.perk, "fa-graduation-cap");
        this.savePlayerData();
        this.updateHUD();
      };
    }

    this.renderMarket();
    this.renderQuests();
    this.renderAlbum();
  }

  // --- High-DPI Retina Canvas Boyutlandırma ---
  resizeCanvas() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    const w = rect.width || 360;
    const isMobile = window.innerWidth <= 768;
    // Mobilde optimum yükseklik ~270-310px, masaüstünde 350px
    const h = isMobile ? Math.min(Math.max(w * 0.72, 260), 310) : 340;

    this.virtualWidth = w;
    this.virtualHeight = h;

    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);

    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    if (this.ctx) {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
  }

  bindEvents() {
    // Ses Kontrolü
    const soundBtn = document.getElementById("sound-toggle-btn");
    if (soundBtn) {
      soundBtn.onclick = () => {
        this.triggerHaptic("light");
        const muted = this.sound.toggleMute();
        soundBtn.innerHTML = muted ? `<i class="fa-solid fa-volume-xmark"></i>` : `<i class="fa-solid fa-volume-high"></i>`;
        this.showToast(muted ? "Sesler Kapatıldı" : "Sesler Açıldı", "", "fa-music");
      };
    }

    // Lofi Arka Plan Müziği
    const bgmBtn = document.getElementById("bgm-toggle-btn");
    if (bgmBtn) {
      bgmBtn.onclick = () => {
        this.triggerHaptic("medium");
        if (this.sound.bgmPlaying) {
          this.sound.stopBgm();
          bgmBtn.classList.remove("playing");
          this.showToast("Kampüs Lofi Müziği Durduruldu", "", "fa-pause");
        } else {
          this.sound.startBgm();
          bgmBtn.classList.add("playing");
          this.showToast("Kampüs Lofi Müziği Başlatıldı", "Huzurlu Boğaziçi melodileri...", "fa-play");
        }
      };
    }

    // Günün Saati
    const timeBtn = document.getElementById("time-toggle-btn");
    if (timeBtn) {
      timeBtn.onclick = () => {
        this.triggerHaptic("light");
        const cycle = ["day", "sunset", "night"];
        const nextIdx = (cycle.indexOf(this.timeOfDay) + 1) % cycle.length;
        this.setTimeOfDay(cycle[nextIdx]);
      };
    }

    // Şipşak Fotoğraf
    const photoBtn = document.getElementById("btn-take-photo");
    if (photoBtn) {
      photoBtn.onclick = () => this.takeCatPolaroid();
    }

    // Mırlamalı Ders Çalışma
    const studyBtn = document.getElementById("btn-study-chill");
    if (studyBtn) {
      studyBtn.onclick = () => this.toggleStudySession();
    }

    // Lazer & Tarak Hızlı Aksiyonları
    const quickLaserBtn = document.getElementById("btn-quick-laser");
    if (quickLaserBtn) {
      quickLaserBtn.onclick = () => {
        this.triggerHaptic("light");
        this.toggleToy(this.data.items.laser_toy);
      };
    }

    const quickBrushBtn = document.getElementById("btn-quick-brush");
    if (quickBrushBtn) {
      quickBrushBtn.onclick = () => {
        this.triggerHaptic("light");
        this.toggleToy(this.data.items.brush);
      };
    }

    // Modal Kapatma
    document.querySelectorAll(".close-modal-btn").forEach(btn => {
      btn.onclick = () => {
        this.triggerHaptic("light");
        document.querySelectorAll(".game-modal").forEach(m => m.classList.remove("active"));
      };
    });

    document.querySelectorAll(".game-modal").forEach(m => {
      m.addEventListener("click", (e) => {
        if (e.target === m) {
          this.triggerHaptic("light");
          m.classList.remove("active");
        }
      });
    });

    // Menü Butonları
    const openMarketBtn = document.getElementById("btn-open-market");
    if (openMarketBtn) {
      openMarketBtn.onclick = () => {
        this.triggerHaptic("light");
        this.renderMarket();
        document.getElementById("market-modal").classList.add("active");
      };
    }

    const openAlbumBtn = document.getElementById("btn-open-album");
    if (openAlbumBtn) {
      openAlbumBtn.onclick = () => {
        this.triggerHaptic("light");
        this.renderAlbum();
        document.getElementById("album-modal").classList.add("active");
      };
    }

    const openQuestsBtn = document.getElementById("btn-open-quests");
    if (openQuestsBtn) {
      openQuestsBtn.onclick = () => {
        this.triggerHaptic("light");
        this.renderQuests();
        document.getElementById("quests-modal").classList.add("active");
      };
    }

    // Mobil Alt Dock Barı
    const mobileNavItems = document.querySelectorAll(".mobile-dock-btn");
    mobileNavItems.forEach(item => {
      item.onclick = () => {
        this.triggerHaptic("light");
        const action = item.dataset.action;
        mobileNavItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        if (action === "locations") {
          document.getElementById("locations-modal").classList.add("active");
        } else if (action === "market") {
          this.renderMarket();
          document.getElementById("market-modal").classList.add("active");
        } else if (action === "album") {
          this.renderAlbum();
          document.getElementById("album-modal").classList.add("active");
        } else if (action === "quests") {
          this.renderQuests();
          document.getElementById("quests-modal").classList.add("active");
        } else if (action === "stage") {
          const stageEl = document.getElementById("game-stage-wrapper");
          if (stageEl) stageEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      };
    });

    // --- Dokunmatik (Touch) & Mouse Etkileşimi ---
    if (this.canvas) {
      const getPos = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: (clientX - rect.left) * (this.virtualWidth / rect.width),
          y: (clientY - rect.top) * (this.virtualHeight / rect.height)
        };
      };

      const startInteraction = (e) => {
        if (e.touches && e.touches.length > 1) return;
        if (e.cancelable) e.preventDefault();
        const pos = getPos(e);
        this.pettingActive = true;
        this.lastPetPos = pos;

        // Dokunulan yere tatlı bir pati izi ekle
        this.spawnPawPrint(pos.x, pos.y);
        this.handleCanvasInteract(pos.x, pos.y, "start");
      };

      const moveInteraction = (e) => {
        if (!this.pettingActive && !this.activeToy) return;
        if (e.cancelable) e.preventDefault();
        const pos = getPos(e);
        const dist = Math.hypot(pos.x - this.lastPetPos.x, pos.y - this.lastPetPos.y);

        // Kedi gözleri dokunuşu takip eder
        this.catAnim.lookAtX = (pos.x - this.virtualWidth / 2) * 0.08;
        this.catAnim.lookAtY = (pos.y - (this.virtualHeight / 2 - 10)) * 0.08;

        if (this.activeToy === "laser_toy") {
          this.laserPos = { x: pos.x, y: pos.y, active: true };
          this.catAnim.pounceX = (pos.x - this.virtualWidth / 2) * 0.12;
          this.catAnim.pounceY = (pos.y - (this.virtualHeight / 2 + 50)) * 0.12;
        } else if (dist > 12) {
          this.handleCanvasInteract(pos.x, pos.y, "drag");
          this.lastPetPos = pos;
        }
      };

      const endInteraction = (e) => {
        this.pettingActive = false;
        this.sound.stopPurr();
        this.petCombo = 0;
        this.catAnim.lookAtX = 0;
        this.catAnim.lookAtY = 0;
        if (this.activeToy === "laser_toy") {
          this.laserPos.active = false;
        }
      };

      this.canvas.addEventListener("mousedown", startInteraction);
      this.canvas.addEventListener("mousemove", moveInteraction);
      window.addEventListener("mouseup", endInteraction);

      this.canvas.addEventListener("touchstart", startInteraction, { passive: false });
      this.canvas.addEventListener("touchmove", moveInteraction, { passive: false });
      this.canvas.addEventListener("touchend", endInteraction, { passive: false });
      this.canvas.addEventListener("touchcancel", endInteraction, { passive: false });
    }
  }

  // --- Mekan Değiştirme ---
  changeLocation(locId) {
    const loc = this.data.locations[locId];
    if (!loc) return;

    this.player.currentLocation = locId;
    if (!this.player.visitedLocations.includes(locId)) {
      this.player.visitedLocations.push(locId);
      this.checkQuest("q_all_locations");
    }

    document.querySelectorAll(".loc-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.loc === locId);
    });
    document.querySelectorAll(".mobile-loc-card").forEach(c => {
      c.classList.toggle("active", c.dataset.loc === locId);
    });

    const titleEl = document.getElementById("current-location-title");
    const subEl = document.getElementById("current-location-sub");
    const badgeEl = document.getElementById("current-location-vibe");

    if (titleEl) titleEl.textContent = loc.name;
    if (subEl) subEl.textContent = loc.sub;
    if (badgeEl) badgeEl.textContent = loc.vibe;

    // Kedileri güncelle
    this.renderLocationCatList(loc.cats);
    if (loc.cats.length > 0) {
      this.selectCat(loc.cats[0]);
    }

    if (locId === "bogaz_manzara") {
      this.sound.playShipHorn();
    } else if (locId === "guney_cimler") {
      this.sound.playSeagull();
    }

    this.savePlayerData();
    this.updateHUD();
  }

  renderLocationCatList(catIds) {
    const container = document.getElementById("location-cats-chips");
    if (!container) return;
    container.innerHTML = "";

    catIds.forEach(catId => {
      const cat = this.cats[catId];
      if (!cat) return;
      const chip = document.createElement("button");
      chip.className = `cat-selector-chip ${cat.id === this.activeCatId ? 'selected' : ''}`;
      chip.innerHTML = `
        <span class="cat-chip-icon" style="background:${cat.furColor}"><i class="fa-solid fa-cat"></i></span>
        <div class="cat-chip-info">
          <strong>${cat.name}</strong>
          <small>${cat.badge || cat.title.split(" ")[0]}</small>
        </div>
      `;
      chip.onclick = () => {
        this.triggerHaptic("light");
        this.selectCat(cat.id);
      };
      container.appendChild(chip);
    });
  }

  selectCat(catId) {
    this.activeCatId = catId;
    const cat = this.cats[catId];
    if (!cat) return;

    document.querySelectorAll(".cat-selector-chip").forEach(c => {
      c.classList.toggle("selected", c.querySelector("strong")?.textContent === cat.name);
    });

    // Sidebar & Sahne İçi Kedi Detayları
    const nameEl = document.getElementById("active-cat-name");
    const titleEl = document.getElementById("active-cat-title");
    const quoteEl = document.getElementById("active-cat-quote");
    const breedEl = document.getElementById("active-cat-breed");
    const favEl = document.getElementById("active-cat-fav");
    const friendLvlEl = document.getElementById("cat-friendship-level");

    // Sahne İçi Hızlı Göstergeler (Stage HUD)
    const stageCatName = document.getElementById("stage-cat-name");
    const stageCatLevel = document.getElementById("stage-cat-level");

    if (nameEl) nameEl.textContent = cat.name;
    if (stageCatName) stageCatName.textContent = cat.name;
    if (stageCatLevel) stageCatLevel.textContent = `Lv.${cat.friendship}`;
    if (titleEl) titleEl.textContent = cat.title;
    if (quoteEl) quoteEl.textContent = `"${cat.quote}"`;
    if (breedEl) breedEl.textContent = cat.breed;

    if (favEl) {
      const foodItem = this.data.items[cat.favFood];
      favEl.textContent = foodItem ? foodItem.name : "Yaş Mama";
    }
    if (friendLvlEl) friendLvlEl.textContent = `Dostluk Lv.${cat.friendship} (${cat.friendshipXP}/100 XP)`;

    this.updateCatBars();
    this.renderCatActionBar();

    this.sound.playMeow((cat.id === "fistik" || cat.id === "pamuk") ? "kitten" : "normal");
  }

  updateCatBars() {
    const cat = this.cats[this.activeCatId];
    if (!cat) return;

    // Hem sidebar hem stage mini barları güncelle
    const hungerBars = [document.getElementById("cat-hunger-bar"), document.getElementById("stage-hunger-bar")];
    const happyBars = [document.getElementById("cat-happiness-bar"), document.getElementById("stage-happiness-bar")];
    const hungerTxts = [document.getElementById("cat-hunger-text"), document.getElementById("stage-hunger-text")];
    const happyTxts = [document.getElementById("cat-happiness-text"), document.getElementById("stage-happiness-text")];

    hungerBars.forEach(b => { if (b) b.style.width = `${Math.min(100, Math.max(0, cat.hunger))}%`; });
    happyBars.forEach(b => { if (b) b.style.width = `${Math.min(100, Math.max(0, cat.happiness))}%`; });
    hungerTxts.forEach(t => { if (t) t.textContent = `%${Math.round(cat.hunger)}`; });
    happyTxts.forEach(t => { if (t) t.textContent = `%${Math.round(cat.happiness)}`; });
  }

  renderCatActionBar() {
    const container = document.getElementById("cat-inventory-actions");
    if (!container) return;
    container.innerHTML = "";

    let hasItems = false;
    Object.entries(this.player.inventory).forEach(([itemId, qty]) => {
      if (qty <= 0) return;
      hasItems = true;
      const item = this.data.items[itemId];
      if (!item) return;

      const btn = document.createElement("button");
      btn.className = `item-action-pill ${this.activeToy === itemId ? 'active-toy' : ''}`;
      btn.innerHTML = `
        <i class="fa-solid ${item.icon}"></i>
        <div class="pill-meta">
          <span>${item.name}</span>
          <small>x${qty} ${item.hungerValue ? `(+%${item.hungerValue})` : ''}</small>
        </div>
      `;
      btn.onclick = () => {
        this.triggerHaptic("light");
        this.useItemOnActiveCat(itemId);
      };
      container.appendChild(btn);
    });

    if (!hasItems) {
      container.innerHTML = `
        <div class="empty-inventory-note">
          <i class="fa-solid fa-store"></i>
          <span>Çantanda mama bitti! Aşağıdaki 'Pet Shop'tan hemen mama alabilirsin.</span>
        </div>
      `;
    }
  }

  useItemOnActiveCat(itemId) {
    const cat = this.cats[this.activeCatId];
    if (!cat) return;

    const item = this.data.items[itemId];
    if (!item) return;

    if (this.player.inventory[itemId] <= 0) {
      this.triggerHaptic("warning");
      this.showToast("Bu mamadan kalmadı!", "Pet Shop'tan satın alabilirsin.", "fa-circle-exclamation");
      return;
    }

    if (item.type === "food") {
      this.feedCat(cat, item);
    } else if (item.type === "toy") {
      this.toggleToy(item);
    } else if (item.type === "tool" && itemId === "camera_film") {
      this.takeCatPolaroid();
    }
  }

  feedCat(cat, item) {
    this.player.inventory[item.id]--;

    const isFavorite = (cat.favFood === item.id);
    const isDisliked = (cat.dislikedFood === item.id);

    let hungerGain = item.hungerValue || 20;
    let happyGain = item.happyValue || 15;
    let xpGain = 20;

    if (isFavorite) {
      hungerGain = Math.round(hungerGain * 1.5);
      happyGain += 25;
      xpGain += 25;
      this.triggerHaptic("success");
      this.showFloatingText(this.virtualWidth / 2, this.virtualHeight / 2 - 40, "⭐ FAVORİ MAMA! ⭐", "#ffb800");
    } else if (isDisliked) {
      happyGain = -10;
      this.triggerHaptic("warning");
      this.showFloatingText(this.virtualWidth / 2, this.virtualHeight / 2 - 40, "Bunu pek sevmedi...", "#e74c3c");
    } else {
      this.triggerHaptic("medium");
    }

    cat.hunger = Math.min(100, cat.hunger + hungerGain);
    cat.happiness = Math.min(100, Math.max(0, cat.happiness + happyGain));

    this.catAnim.isEating = true;
    this.catAnim.eatTimer = 35;
    if (item.id === "gourmet_can" || item.id === "chicken_plate") {
      this.sound.playSlurp();
    } else {
      this.sound.playCrunch();
    }

    this.addFriendshipXP(cat, xpGain);

    let coinReward = isFavorite ? 25 : 12;
    if (this.player.dept === "cmpe" && cat.id === "byte") coinReward = Math.round(coinReward * 1.3);
    this.player.coins += coinReward;
    this.sound.playCoin();

    this.player.stress = Math.max(0, this.player.stress - 8);

    for (let i = 0; i < 8; i++) {
      this.spawnParticle(
        this.virtualWidth / 2 + (Math.random() - 0.5) * 60,
        this.virtualHeight / 2 + (Math.random() - 0.5) * 40,
        "heart"
      );
    }

    this.checkQuest("q_first_feed");
    if (cat.id === "reis" && item.id === "gourmet_can") this.checkQuest("q_feed_reis");
    if (cat.id === "piramit" && item.id === "chicken_plate") this.checkQuest("q_dining_hall");

    this.showToast(
      `${cat.name} beslendi!`,
      `+${coinReward} Puan kazandın. Tokluk: %${cat.hunger}`,
      "fa-bowl-food"
    );

    this.updateCatBars();
    this.renderCatActionBar();
    this.updateHUD();
    this.savePlayerData();
  }

  toggleToy(item) {
    if (this.activeToy === item.id) {
      this.activeToy = null;
      this.showToast(`${item.name} Bırakıldı`, "", item.icon);
    } else {
      this.activeToy = item.id;
      if (item.id === "laser_toy") {
        this.showToast("Kırmızı Lazer Aktif!", "Parmağını ekranda gezdirerek kediyi koştur.", "fa-wand-magic-sparkles");
      } else if (item.id === "brush") {
        this.showToast("Masaj Tarağı Hazır!", "Kediyi tarayarak mırlat ve rahatlat.", "fa-brush");
      }
    }
    this.renderCatActionBar();
  }

  handleCanvasInteract(x, y, eventType) {
    const cat = this.cats[this.activeCatId];
    if (!cat) return;

    const cx = this.virtualWidth / 2;
    const cy = this.virtualHeight / 2 + 15;
    const dx = x - cx;
    const dy = y - cy;

    if (Math.abs(dx) > 130 || Math.abs(dy) > 110) return;

    if (this.activeToy === "brush") {
      this.sound.startPurr();
      cat.happiness = Math.min(100, cat.happiness + 0.35);
      this.player.stress = Math.max(0, this.player.stress - 0.25);
      this.triggerHaptic("light");
      this.spawnParticle(x, y, "sparkle");
      this.updateCatBars();
      return;
    }

    let hitSpot = "body";
    if (dy < -35) hitSpot = "ears";
    else if (dy > 45) hitSpot = "belly";
    else if (Math.abs(dx) < 30 && dy > -15 && dy < 40) hitSpot = "chin";
    else if (Math.abs(dx) > 40) hitSpot = "cheeks";
    else hitSpot = "back";

    if (hitSpot === cat.biteSpot && Math.random() < 0.25) {
      this.sound.playHiss();
      this.triggerHaptic("warning");
      this.catAnim.isHissing = true;
      this.catAnim.hissTimer = 25;
      cat.happiness = Math.max(0, cat.happiness - 5);
      this.showFloatingText(x, y, "TISSS! 😾 (Göbeğe Dokunma!)", "#e74c3c");
      this.pettingActive = false;
      this.sound.stopPurr();
      this.updateCatBars();
      return;
    }

    const isSweet = (hitSpot === cat.sweetSpot);
    this.petCombo++;

    if (this.petCombo % 5 === 0) {
      this.sound.startPurr();
      this.sound.playMeow("purr_chirp");
      this.triggerHaptic("light");

      const happyBoost = isSweet ? 3 : 1;
      cat.happiness = Math.min(100, cat.happiness + happyBoost);

      const stressRelief = (this.player.dept === "psy") ? 4 : 2;
      this.player.stress = Math.max(0, this.player.stress - stressRelief);

      this.addFriendshipXP(cat, isSweet ? 2 : 1);
      this.spawnParticle(x, y, isSweet ? "heart" : "note");
      this.updateCatBars();
      this.updateHUD();

      if (cat.id === "prof_mirmir") {
        this.checkQuest("q_mirmir_study");
      }
    }
  }

  addFriendshipXP(cat, amount) {
    cat.friendshipXP += amount;
    if (cat.friendshipXP >= 100 && cat.friendship < 5) {
      cat.friendship++;
      cat.friendshipXP = 0;
      this.sound.playSuccess();
      this.triggerHaptic("success");
      this.showToast(
        `🎉 DOSTLUK SEVİYESİ ATLADI!`,
        `${cat.name} ile artık Seviye ${cat.friendship} dostsunuz!`,
        "fa-trophy"
      );
      if (cat.friendship === 5) {
        this.unlockAchievement("ach_cat_whisperer");
      }
      const friendLvlEl = document.getElementById("cat-friendship-level");
      if (friendLvlEl) friendLvlEl.textContent = `Dostluk Lv.${cat.friendship} (${cat.friendshipXP}/100 XP)`;
      const stageCatLevel = document.getElementById("stage-cat-level");
      if (stageCatLevel) stageCatLevel.textContent = `Lv.${cat.friendship}`;
    }
  }

  takeCatPolaroid() {
    const cat = this.cats[this.activeCatId];
    if (!cat) return;

    if (this.player.inventory.camera_film <= 0) {
      this.triggerHaptic("warning");
      this.showToast("Polaroid Filmin Bitti!", "Pet Shop'tan yeni film paketi satın al.", "fa-camera");
      return;
    }

    this.player.inventory.camera_film--;
    this.triggerHaptic("medium");
    this.sound.playCameraSnap();

    const flashEl = document.getElementById("camera-flash-overlay");
    if (flashEl) {
      flashEl.classList.add("flash");
      setTimeout(() => flashEl.classList.remove("flash"), 450);
    }

    const loc = this.data.locations[this.player.currentLocation];
    const poses = [
      "Güneşlenirken yakalandı ☀️",
      "Kameraya tatlı pati uzattı 🐾",
      "Gözlerini kısıp Boğaz'ı izliyor 🌊",
      "Kafasını yana yatırıp mırladı 😻",
      "Öğrencinin sırt çantasına çökmüş 🎒"
    ];
    const pose = poses[Math.floor(Math.random() * poses.length)];

    const photoEntry = {
      id: "photo_" + Date.now(),
      catId: cat.id,
      catName: cat.name,
      locationName: loc.name,
      pose: pose,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      furColor: cat.furColor
    };

    this.player.album.unshift(photoEntry);
    cat.photoUnlocked = true;

    this.player.coins += 35;
    this.checkQuest("q_photo_master");

    this.showToast(
      "📸 Şipşak Fotoğraf Çekildi!",
      `${cat.name}'in fotoğrafı Albüme eklendi (+35 Puan)`,
      "fa-image"
    );

    this.updateHUD();
    this.renderCatActionBar();
    this.savePlayerData();
  }

  toggleStudySession() {
    const studyBtn = document.getElementById("btn-study-chill");
    this.triggerHaptic("medium");

    if (this.isStudying) {
      this.isStudying = false;
      clearInterval(this.studyTimer);
      this.studyTimer = null;
      if (studyBtn) {
        studyBtn.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> <span>Mırlamalı Çalış</span>`;
        studyBtn.classList.remove("studying");
      }
      this.sound.stopPurr();
      this.showToast("Ders Çalışma Tamamlandı!", "Zihnin dinlendi, vize vizyonun arttı.", "fa-check");
    } else {
      this.isStudying = true;
      if (studyBtn) {
        studyBtn.innerHTML = `<i class="fa-solid fa-circle-stop"></i> <span>Bitir</span>`;
        studyBtn.classList.add("studying");
      }
      this.sound.startPurr();
      this.showToast(
        "Kedi Eşliğinde Ders Çalışılıyor 📖",
        "Mırlama stresi sıfırlar ve Pati Puanı kazandırır.",
        "fa-book-open"
      );

      this.studyTimer = setInterval(() => {
        if (!this.isStudying) return;
        this.player.studyMinutes++;
        this.player.stress = Math.max(0, this.player.stress - 5);
        this.player.coins += 4;
        this.updateHUD();
        this.spawnParticle(this.virtualWidth / 2, this.virtualHeight / 2 - 30, "note");
      }, 3000);
    }
  }

  setTimeOfDay(time) {
    this.timeOfDay = time;
    const btn = document.getElementById("time-toggle-btn");
    const appEl = document.getElementById("app-root");

    if (btn) {
      const labels = {
        day: '<i class="fa-solid fa-sun"></i> <span>Gündüz</span>',
        sunset: '<i class="fa-solid fa-cloud-sun"></i> <span>Gün Batımı</span>',
        night: '<i class="fa-solid fa-moon"></i> <span>Gece</span>'
      };
      btn.innerHTML = labels[time];
    }

    if (appEl) {
      appEl.setAttribute("data-time", time);
    }

    this.showToast(`Zaman: ${time === 'day' ? 'Boğaziçi Güneşi' : time === 'sunset' ? 'Boğaz Gün Batımı' : 'Kütüphane Gecesi'}`, "", "fa-clock");
  }

  passiveCatTick() {
    Object.values(this.cats).forEach(cat => {
      cat.hunger = Math.max(5, cat.hunger - 3);
      if (cat.hunger < 25) {
        cat.happiness = Math.max(10, cat.happiness - 2);
      }
    });
    this.updateCatBars();
    this.savePlayerData();
  }

  // --- Market ---
  renderMarket() {
    const list = document.getElementById("market-item-list");
    const balanceEl = document.getElementById("market-player-balance");
    if (balanceEl) balanceEl.textContent = `${this.player.coins} BÜ-Puan`;
    if (!list) return;

    list.innerHTML = "";
    const isEcon = (this.player.dept === "econ");

    Object.values(this.data.items).forEach(item => {
      let finalPrice = item.price;
      if (isEcon && item.type === "food") {
        finalPrice = Math.round(item.price * 0.8);
      }

      const card = document.createElement("div");
      card.className = "market-item-card";
      card.innerHTML = `
        <div class="m-icon"><i class="fa-solid ${item.icon}"></i></div>
        <div class="m-details">
          <h4>${item.name}</h4>
          <p>${item.desc}</p>
          <div class="m-tags">
            ${isEcon && item.type === 'food' ? '<span class="econ-tag">%20 Econ İndirimi!</span>' : ''}
            <span class="m-price"><i class="fa-solid fa-gem"></i> ${finalPrice} Puan</span>
          </div>
        </div>
        <button class="buy-btn" ${this.player.coins < finalPrice ? 'disabled' : ''}>Satın Al</button>
      `;

      const buyBtn = card.querySelector(".buy-btn");
      buyBtn.onclick = () => {
        if (this.player.coins < finalPrice) {
          this.triggerHaptic("warning");
          this.showToast("Yetersiz Puan!", "Kedileri besleyip sevdikçe puan kazanırsın.", "fa-xmark");
          return;
        }
        this.triggerHaptic("medium");
        this.player.coins -= finalPrice;
        this.player.inventory[item.id] = (this.player.inventory[item.id] || 0) + 1;
        this.sound.playCoin();
        this.showToast(`Satın Alındı: ${item.name}`, `Çantana eklendi.`, "fa-bag-shopping");
        this.renderMarket();
        this.renderCatActionBar();
        this.updateHUD();
        this.savePlayerData();
      };

      list.appendChild(card);
    });
  }

  // --- Görevler ---
  renderQuests() {
    const questList = document.getElementById("quests-list-container");
    if (!questList) return;
    questList.innerHTML = "";

    this.data.quests.forEach(q => {
      const card = document.createElement("div");
      card.className = `quest-card ${q.done ? 'done' : ''}`;
      card.innerHTML = `
        <div class="q-icon"><i class="fa-solid ${q.done ? 'fa-circle-check' : 'fa-circle-dot'}"></i></div>
        <div class="q-content">
          <h4>${q.title}</h4>
          <p>${q.desc}</p>
        </div>
        <div class="q-reward"><i class="fa-solid fa-gem"></i> +${q.reward}</div>
      `;
      questList.appendChild(card);
    });

    const achList = document.getElementById("achievements-list-container");
    if (!achList) return;
    achList.innerHTML = "";

    this.data.achievements.forEach(a => {
      const card = document.createElement("div");
      card.className = `ach-card ${a.unlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="a-icon"><i class="fa-solid ${a.icon}"></i></div>
        <div class="a-content">
          <h4>${a.title}</h4>
          <p>${a.desc}</p>
        </div>
        <div class="a-badge">${a.unlocked ? 'Kazanıldı' : 'Kilitli'}</div>
      `;
      achList.appendChild(card);
    });
  }

  checkQuest(questId) {
    const q = this.data.quests.find(item => item.id === questId);
    if (q && !q.done) {
      q.done = true;
      this.player.coins += q.reward;
      this.sound.playSuccess();
      this.triggerHaptic("success");
      this.showToast(`🌟 GÖREV TAMAMLANDI: ${q.title}!`, `+${q.reward} Puan Kazandın!`, "fa-award");
      this.updateHUD();
      this.savePlayerData();
    }
  }

  unlockAchievement(achId) {
    const a = this.data.achievements.find(item => item.id === achId);
    if (a && !a.unlocked) {
      a.unlocked = true;
      this.sound.playSuccess();
      this.triggerHaptic("success");
      this.showToast(`🏆 BAŞARIM KAZANILDI: ${a.title}!`, a.desc, a.icon);
      this.savePlayerData();
    }
  }

  // --- Albüm ---
  renderAlbum() {
    const grid = document.getElementById("album-photo-grid");
    if (!grid) return;
    grid.innerHTML = "";

    if (this.player.album.length === 0) {
      grid.innerHTML = `
        <div class="empty-album-msg">
          <i class="fa-solid fa-camera"></i>
          <p>Henüz hiç fotoğraf çekmedin! 'Şipşak' butonuna basarak Boğaziçi kedilerini yakala.</p>
        </div>
      `;
      return;
    }

    this.player.album.forEach(photo => {
      const polaroid = document.createElement("div");
      polaroid.className = "polaroid-card";
      polaroid.innerHTML = `
        <div class="polaroid-photo" style="background: radial-gradient(circle, ${photo.furColor}44 0%, #1e293b 80%)">
          <div class="polaroid-cat-art">
            <i class="fa-solid fa-cat" style="color: ${photo.furColor}"></i>
          </div>
          <span class="polaroid-loc">${photo.locationName}</span>
        </div>
        <div class="polaroid-caption">
          <strong>${photo.catName}</strong>
          <small>${photo.pose}</small>
          <time>${photo.time}</time>
        </div>
      `;
      grid.appendChild(polaroid);
    });
  }

  updateHUD() {
    const coinEl = document.getElementById("hud-coins-val");
    const stressEl = document.getElementById("hud-stress-val");
    const stressFill = document.getElementById("hud-stress-bar-fill");
    const deptBadge = document.getElementById("hud-dept-badge");

    if (coinEl) coinEl.textContent = `${this.player.coins} Puan`;
    if (stressEl) stressEl.textContent = `%${Math.round(this.player.stress)}`;
    if (stressFill) stressFill.style.width = `${this.player.stress}%`;
    if (deptBadge) {
      const d = this.data.departments.find(item => item.id === this.player.dept);
      if (d) deptBadge.textContent = d.name.split(" ")[0];
    }
  }

  showToast(title, desc = "", icon = "fa-bell") {
    const container = document.getElementById("game-toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "boun-toast";
    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <div class="toast-body">
        <strong>${title}</strong>
        ${desc ? `<small>${desc}</small>` : ''}
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add("visible"), 20);
    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  spawnParticle(x, y, type) {
    this.particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 2.2,
      vy: -Math.random() * 2 - 1.2,
      alpha: 1,
      type: type,
      scale: 0.8 + Math.random() * 0.5
    });
  }

  spawnPawPrint(x, y) {
    this.pawPrints.push({
      x: x,
      y: y,
      alpha: 0.9,
      size: 14 + Math.random() * 6
    });
  }

  showFloatingText(x, y, text, color = "#ffb800") {
    this.particles.push({
      x: x,
      y: y,
      vx: 0,
      vy: -1.2,
      alpha: 1,
      text: text,
      color: color,
      type: "text",
      scale: 1
    });
  }

  // --- Animasyon Döngüsü ---
  startCanvasLoop() {
    let lastTime = 0;
    const loop = (time) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      this.updateCanvasPhysics(dt);
      this.drawCanvas();

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  updateCanvasPhysics(dt) {
    this.catAnim.breath += dt * 2.2;
    this.catAnim.tailAngle = Math.sin(this.catAnim.breath * 0.8) * 0.28;

    this.catAnim.eyeBlink += dt;
    if (this.catAnim.eyeBlink > 4.6) {
      if (this.catAnim.eyeBlink > 4.8) {
        this.catAnim.eyeBlink = 0;
      }
    }

    if (this.catAnim.isEating) {
      this.catAnim.eatTimer--;
      if (this.catAnim.eatTimer <= 0) this.catAnim.isEating = false;
    }

    if (this.catAnim.isHissing) {
      this.catAnim.hissTimer--;
      if (this.catAnim.hissTimer <= 0) this.catAnim.isHissing = false;
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= dt * 0.85;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.pawPrints.length - 1; i >= 0; i--) {
      const pw = this.pawPrints[i];
      pw.alpha -= dt * 1.5;
      if (pw.alpha <= 0) this.pawPrints.splice(i, 1);
    }
  }

  // --- Görsel Sahne ve Çizimler ---
  drawCanvas() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.virtualWidth;
    const h = this.virtualHeight;

    ctx.clearRect(0, 0, w, h);

    // 1. Kampüs Manzarası (Dinamik Scenery)
    this.drawCampusScenery(ctx, w, h);

    const cat = this.cats[this.activeCatId];
    if (!cat) return;

    // 2. Kedi Konumu ve Zemin Gölgesi
    // Mobilde kediyi mükemmel orantılamak için dinamik ölçek
    const scale = Math.min(w / 440, h / 330) * 0.95;
    const cx = w / 2 + this.catAnim.pounceX;
    const cy = h / 2 + (20 * scale) + this.catAnim.pounceY;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy + (85 * scale), 105 * scale, 18 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.fill();
    ctx.restore();

    // 3. Kediyi Çiz
    this.drawStylizedCat(ctx, cx, cy, cat, scale);

    // 4. Lazer Işığı
    if (this.laserPos && this.laserPos.active) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.laserPos.x, this.laserPos.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#ff0033";
      ctx.shadowColor = "#ff0055";
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.restore();
    }

    // 5. Dokunmatik Pati İzleri
    this.drawPawPrints(ctx);

    // 6. Uçuşan Kalpler ve Parçacıklar
    this.drawParticles(ctx);
  }

  // --- Boğaziçi Kampüs Manzaraları (Arka Plan Çizimi) ---
  drawCampusScenery(ctx, w, h) {
    const locId = this.player.currentLocation;
    const time = this.timeOfDay;

    ctx.save();

    // Gökyüzü Degradesi
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    if (time === "day") {
      sky.addColorStop(0, "#4ba3e3");
      sky.addColorStop(0.55, "#a1dbf7");
      sky.addColorStop(1, "#cbf3f0");
    } else if (time === "sunset") {
      sky.addColorStop(0, "#3d1b54");
      sky.addColorStop(0.45, "#883072");
      sky.addColorStop(0.75, "#e76f51");
      sky.addColorStop(1, "#f4a261");
    } else {
      sky.addColorStop(0, "#050c1a");
      sky.addColorStop(0.55, "#0d1b2a");
      sky.addColorStop(1, "#1b263b");
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Gece Yıldızları & Ay
    if (time === "night") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      for (let i = 0; i < 16; i++) {
        const sx = ((i * 47) % w);
        const sy = ((i * 23) % (h * 0.45));
        const blink = Math.sin(this.catAnim.breath * 2 + i) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2 * blink, 0, Math.PI * 2);
        ctx.fill();
      }
      // Hilal
      ctx.beginPath();
      ctx.arc(w - 45, 45, 18, 0, Math.PI * 2);
      ctx.fillStyle = "#fff8e7";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w - 52, 40, 16, 0, Math.PI * 2);
      ctx.fillStyle = "#07101f";
      ctx.fill();
    } else if (time === "sunset") {
      // Batan Güneş
      ctx.beginPath();
      ctx.arc(w * 0.78, h * 0.48, 28, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 230, 140, 0.85)";
      ctx.shadowColor = "#f39c12";
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Mekana Özel Silüetler
    if (locId === "bogaz_manzara") {
      // 1. Boğaz Suları & Dalgalar
      const waterY = h * 0.48;
      const waterGrad = ctx.createLinearGradient(0, waterY, 0, h);
      waterGrad.addColorStop(0, time === "night" ? "#0a192f" : time === "sunset" ? "#312a4f" : "#1a5b8c");
      waterGrad.addColorStop(1, time === "night" ? "#060f1c" : time === "sunset" ? "#1f3c58" : "#0d3b66");
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, waterY, w, h - waterY);

      // Karşı Kıyı Silüeti
      ctx.beginPath();
      ctx.moveTo(0, waterY);
      ctx.bezierCurveTo(w * 0.25, waterY - 14, w * 0.6, waterY - 22, w, waterY - 8);
      ctx.lineTo(w, waterY + 4);
      ctx.lineTo(0, waterY + 4);
      ctx.fillStyle = time === "night" ? "#06101c" : time === "sunset" ? "#50284e" : "#2a4d69";
      ctx.fill();

      // Boğaziçi Köprüsü Silüeti
      const bridgeX = w * 0.55;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = time === "night" ? "#38475a" : "rgba(255,255,255,0.45)";
      // Köprü ayakları
      ctx.beginPath();
      ctx.moveTo(bridgeX - 40, waterY - 35); ctx.lineTo(bridgeX - 40, waterY + 2);
      ctx.moveTo(bridgeX + 40, waterY - 35); ctx.lineTo(bridgeX + 40, waterY + 2);
      // Asma halat
      ctx.moveTo(bridgeX - 80, waterY - 20);
      ctx.quadraticCurveTo(bridgeX, waterY - 8, bridgeX + 80, waterY - 20);
      ctx.stroke();

      // Ön Taş Korkuluk Duvarı
      const wallY = h * 0.72;
      ctx.fillStyle = time === "night" ? "#1b263b" : "#4a5568";
      ctx.fillRect(0, wallY, w, h - wallY);
      // Taş derz çizgileri
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, wallY + 18); ctx.lineTo(w, wallY + 18);
      for (let i = 0; i < w; i += 70) {
        ctx.moveTo(i, wallY); ctx.lineTo(i, wallY + 18);
        ctx.moveTo(i + 35, wallY + 18); ctx.lineTo(i + 35, h);
      }
      ctx.stroke();

    } else if (locId === "guney_cimler") {
      // Güney Çimler Tepeleri & Albert Long Hall Silüeti
      const hillY = h * 0.52;
      // Arka Tepe
      ctx.beginPath();
      ctx.moveTo(0, hillY);
      ctx.quadraticCurveTo(w * 0.35, hillY - 25, w, hillY - 8);
      ctx.lineTo(w, h); ctx.lineTo(0, h);
      ctx.fillStyle = time === "night" ? "#0d2818" : time === "sunset" ? "#2d4a22" : "#487332";
      ctx.fill();

      // Ön Yeşil Çimler
      ctx.beginPath();
      ctx.moveTo(0, hillY + 18);
      ctx.quadraticCurveTo(w * 0.6, hillY + 5, w, hillY + 28);
      ctx.lineTo(w, h); ctx.lineTo(0, h);
      ctx.fillStyle = time === "night" ? "#13381e" : time === "sunset" ? "#386628" : "#5b8c3a";
      ctx.fill();

      // Albert Long Kule Silüeti
      const towerX = w * 0.18;
      ctx.fillStyle = time === "night" ? "#0a1f14" : "rgba(35, 60, 40, 0.65)";
      ctx.fillRect(towerX - 18, hillY - 55, 36, 55);
      // Sivri çatı
      ctx.beginPath();
      ctx.moveTo(towerX - 22, hillY - 55);
      ctx.lineTo(towerX, hillY - 78);
      ctx.lineTo(towerX + 22, hillY - 55);
      ctx.fill();

    } else if (locId === "kutuphane") {
      // Aptullah Kuran Kütüphanesi - Sıcak Çalışma Masası ve Kitaplar
      const deskY = h * 0.68;
      // Arka Kitaplık Rafları
      ctx.fillStyle = time === "night" ? "#17120e" : "#2e2119";
      ctx.fillRect(0, 0, w, deskY);

      // Kitap Sırtları
      const colors = ["#8b2635", "#1b4965", "#c57b57", "#2e5339", "#d4af37"];
      for (let i = 10; i < w - 20; i += 18) {
        ctx.fillStyle = colors[(i / 18) % colors.length];
        const bh = 55 + (i % 25);
        ctx.fillRect(i, deskY - bh - 8, 14, bh);
      }

      // Ön Ahşap Masa
      ctx.fillStyle = time === "night" ? "#261a12" : "#42281a";
      ctx.fillRect(0, deskY, w, h - deskY);

      // Masa Lambası Işığı (Yeşil Kütüphane Lambası)
      const lampX = w * 0.82;
      const coneGrad = ctx.createRadialGradient(lampX, deskY - 30, 10, lampX, deskY + 10, 110);
      coneGrad.addColorStop(0, "rgba(255, 235, 150, 0.45)");
      coneGrad.addColorStop(1, "rgba(255, 235, 150, 0)");
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.arc(lampX, deskY, 120, 0, Math.PI * 2);
      ctx.fill();

    } else if (locId === "kuzey_yemekhane") {
      // Petek Binası & Zemin Karoları
      const plazaY = h * 0.62;
      // Petek Geometrik Cephe
      ctx.fillStyle = time === "night" ? "#111827" : "#374151";
      ctx.fillRect(0, 0, w, plazaY);
      // Petek Pencereleri
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1.5;
      for (let x = 15; x < w; x += 35) {
        for (let y = 15; y < plazaY - 20; y += 30) {
          ctx.strokeRect(x, y, 24, 20);
        }
      }
      // Yemekhane Avlusu
      ctx.fillStyle = time === "night" ? "#1f2937" : "#64748b";
      ctx.fillRect(0, plazaY, w, h - plazaY);

    } else {
      // MAFM & Kare Blok için Genel Atmosfer Zemin Çizgisi
      const floorY = h * 0.68;
      ctx.fillStyle = time === "night" ? "#0f172a" : "#334155";
      ctx.fillRect(0, floorY, w, h - floorY);
    }

    ctx.restore();
  }

  // --- Süper Sevimli & Karakteristik Kedi Çizimi ---
  drawStylizedCat(ctx, cx, cy, cat, scale) {
    const breath = Math.sin(this.catAnim.breath) * 3;
    const furColor = cat.furColor;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // 1. KUYRUK
    ctx.save();
    ctx.translate(-68, 50);
    ctx.rotate(-0.35 + this.catAnim.tailAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-45, -20, -65, -75, -30, -95);
    ctx.bezierCurveTo(-15, -105, -2, -90, -10, -70);
    ctx.bezierCurveTo(-25, -45, -20, -15, 0, 0);
    ctx.fillStyle = furColor;
    ctx.fill();

    // Kuyruk ucu tüyü
    ctx.beginPath();
    ctx.arc(-22, -88, 12, 0, Math.PI * 2);
    ctx.fillStyle = (cat.id === "pamuk" || cat.id === "prof_mirmir" || cat.id === "fistik") ? "#ffffff" : furColor;
    ctx.fill();
    ctx.restore();

    // 2. GÖVDE
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 36 + breath * 0.5, 82, 62 + breath * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = furColor;
    ctx.fill();

    // Piramit için Calico Benekleri
    if (cat.id === "piramit") {
      ctx.beginPath();
      ctx.ellipse(-38, 25, 25, 20, 0.4, 0, Math.PI * 2);
      ctx.fillStyle = "#2c1810"; // Koyu çikolata benek
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(35, 45, 28, 22, -0.3, 0, Math.PI * 2);
      ctx.fillStyle = "#e67e22"; // Turuncu benek
      ctx.fill();
    }

    // Göğüs Tüyü / Beyaz Önlük (Bib)
    ctx.beginPath();
    ctx.ellipse(0, 42, 48, 42, 0, 0, Math.PI * 2);
    ctx.fillStyle = (cat.id === "prof_mirmir" || cat.id === "reis" || cat.id === "pamuk" || cat.id === "fistik") ? "#ffffff" : "#fbe6cf";
    ctx.fill();

    // Reis için Tabby Çizgileri
    if (cat.id === "reis" || cat.id === "byte") {
      ctx.lineWidth = 3;
      ctx.strokeStyle = cat.id === "reis" ? "#b85608" : "#4a5568";
      ctx.beginPath();
      ctx.moveTo(-60, 20); ctx.lineTo(-40, 25);
      ctx.moveTo(-65, 38); ctx.lineTo(-42, 40);
      ctx.moveTo(60, 20);  ctx.lineTo(40, 25);
      ctx.moveTo(65, 38);  ctx.lineTo(42, 40);
      ctx.stroke();
    }
    ctx.restore();

    // 3. ÖN PATİLER
    ctx.save();
    // Sol Pati
    ctx.beginPath();
    ctx.ellipse(-34, 86, 16, 13, 0, 0, Math.PI * 2);
    ctx.fillStyle = (cat.id === "prof_mirmir" || cat.id === "pamuk") ? "#ffffff" : furColor;
    ctx.fill();
    // Sağ Pati
    ctx.beginPath();
    ctx.ellipse(34, 86, 16, 13, 0, 0, Math.PI * 2);
    ctx.fillStyle = (cat.id === "prof_mirmir" || cat.id === "pamuk") ? "#ffffff" : furColor;
    ctx.fill();
    ctx.restore();

    // 4. BAŞ & YÜZ
    ctx.save();
    ctx.translate(0, -32 + breath);

    // Kulaklar (Airplane ears if hissing)
    const earAngle = this.catAnim.isHissing ? 0.35 : 0;

    // Sol Kulak
    ctx.save();
    ctx.rotate(-earAngle);
    ctx.beginPath();
    ctx.moveTo(-54, -28);
    ctx.lineTo(-80, -90);
    ctx.lineTo(-22, -52);
    ctx.fillStyle = furColor;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-48, -32);
    ctx.lineTo(-72, -82);
    ctx.lineTo(-26, -48);
    ctx.fillStyle = "#ffb8c0";
    ctx.fill();
    ctx.restore();

    // Sağ Kulak
    ctx.save();
    ctx.rotate(earAngle);
    ctx.beginPath();
    ctx.moveTo(54, -28);
    ctx.lineTo(80, -90);
    ctx.lineTo(22, -52);
    ctx.fillStyle = furColor;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(48, -32);
    ctx.lineTo(72, -82);
    ctx.lineTo(26, -48);
    ctx.fillStyle = "#ffb8c0";
    ctx.fill();
    ctx.restore();

    // Kafa Yuvarlağı
    ctx.beginPath();
    ctx.ellipse(0, -18, 65, 54, 0, 0, Math.PI * 2);
    ctx.fillStyle = furColor;
    ctx.fill();

    // Yanaklar
    ctx.beginPath();
    ctx.ellipse(-22, -6, 25, 20, -0.2, 0, Math.PI * 2);
    ctx.ellipse(22, -6, 25, 20, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = (cat.id === "prof_mirmir" || cat.id === "pamuk") ? "#ffffff" : "#fff3e6";
    ctx.fill();

    // Sevimli Pembe Yanak Allığı (Blush)
    ctx.beginPath();
    ctx.arc(-36, -8, 8, 0, Math.PI * 2);
    ctx.arc(36, -8, 8, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 130, 150, 0.35)";
    ctx.fill();

    // GÖZLER
    const isBlinking = (this.catAnim.eyeBlink > 4.6);
    const isHappy = (cat.happiness >= 75 || this.pettingActive);

    if (isBlinking || isHappy) {
      // Mırlayan Hilal Gözler (^ . ^)
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = (cat.id === "golge") ? "#ffffff" : "#2d3748";
      ctx.beginPath();
      ctx.arc(-24, -22, 11, 0.15 * Math.PI, 0.85 * Math.PI, false);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(24, -22, 11, 0.15 * Math.PI, 0.85 * Math.PI, false);
      ctx.stroke();
    } else {
      // Açık Gözler
      let eyeColorL = "#f1c40f";
      let eyeColorR = "#f1c40f";

      if (cat.id === "golge") { eyeColorL = "#2ecc71"; eyeColorR = "#2ecc71"; }
      else if (cat.id === "reis") { eyeColorL = "#e67e22"; eyeColorR = "#e67e22"; }
      else if (cat.id === "pamuk") { eyeColorL = "#3498db"; eyeColorR = "#f39c12"; } // Heterokromi (Van Kedisi!)
      else if (cat.id === "byte") { eyeColorL = "#00f0ff"; eyeColorR = "#00f0ff"; }

      const lx = this.catAnim.lookAtX;
      const ly = this.catAnim.lookAtY;

      // Sol Göz
      ctx.beginPath();
      ctx.ellipse(-24, -22, 12, 14, 0, 0, Math.PI * 2);
      ctx.fillStyle = eyeColorL;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-24 + lx, -22 + ly, 4.5, 11, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#111111";
      ctx.fill();
      // Işıltı
      ctx.beginPath();
      ctx.arc(-22 + lx * 0.5, -26 + ly * 0.5, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Sağ Göz
      ctx.beginPath();
      ctx.ellipse(24, -22, 12, 14, 0, 0, Math.PI * 2);
      ctx.fillStyle = eyeColorR;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(24 + lx, -22 + ly, 4.5, 11, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#111111";
      ctx.fill();
      // Işıltı
      ctx.beginPath();
      ctx.arc(26 + lx * 0.5, -26 + ly * 0.5, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }

    // BURUN & AĞIZ
    ctx.beginPath();
    ctx.moveTo(-5, -10);
    ctx.lineTo(5, -10);
    ctx.lineTo(0, -4);
    ctx.closePath();
    ctx.fillStyle = (cat.id === "golge") ? "#333333" : "#ff708f";
    ctx.fill();

    // Ağız çizgisi
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = "#444444";
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(0, 0);
    if (this.catAnim.isEating) {
      // Yeme ağzı (ağız açılıp kapanır)
      ctx.arc(0, 4, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#e76f51";
      ctx.fill();
    } else {
      ctx.moveTo(-9, 4);
      ctx.quadraticCurveTo(-4, 7, 0, 0);
      ctx.quadraticCurveTo(4, 7, 9, 4);
    }
    ctx.stroke();

    // Bıyıklar
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = (cat.id === "golge") ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.moveTo(-26, -5); ctx.lineTo(-60, -10);
    ctx.moveTo(-26, -1); ctx.lineTo(-65, 2);
    ctx.moveTo(-26, 3);  ctx.lineTo(-58, 14);
    ctx.moveTo(26, -5);  ctx.lineTo(60, -10);
    ctx.moveTo(26, -1);  ctx.lineTo(65, 2);
    ctx.moveTo(26, 3);   ctx.lineTo(58, 14);
    ctx.stroke();

    // AKSESUARLAR:
    // Prof. Mırmır için Yuvarlak Altın Kütüphane Gözlüğü
    if (cat.id === "prof_mirmir") {
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = "#d4af37";
      ctx.beginPath();
      ctx.arc(-24, -22, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(24, -22, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-8, -22); ctx.lineTo(8, -22);
      ctx.stroke();
    }

    // Piramit için Kırmızı Çanlı Tasma
    if (cat.id === "piramit") {
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#e74c3c";
      ctx.beginPath();
      ctx.arc(0, 15, 34, 0.25 * Math.PI, 0.75 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 46, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#f1c40f";
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  }

  // --- Dokunmatik Pati İzleri ---
  drawPawPrints(ctx) {
    this.pawPrints.forEach(pw => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pw.alpha);
      ctx.fillStyle = "rgba(244, 162, 97, 0.75)";

      // Ana taban
      ctx.beginPath();
      ctx.ellipse(pw.x, pw.y, pw.size * 0.7, pw.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4 parmak izi
      const offsets = [
        [-pw.size * 0.6, -pw.size * 0.5],
        [-pw.size * 0.2, -pw.size * 0.8],
        [pw.size * 0.2, -pw.size * 0.8],
        [pw.size * 0.6, -pw.size * 0.5]
      ];
      offsets.forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(pw.x + ox, pw.y + oy, pw.size * 0.22, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    });
  }

  // --- Parçacıklar & Kayan Yazı ---
  drawParticles(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.type === "heart") {
        ctx.fillStyle = "#ff477e";
        ctx.font = `${20 * p.scale}px sans-serif`;
        ctx.fillText("❤️", p.x, p.y);
      } else if (p.type === "sparkle") {
        ctx.fillStyle = "#ffd166";
        ctx.font = `${18 * p.scale}px sans-serif`;
        ctx.fillText("✨", p.x, p.y);
      } else if (p.type === "note") {
        ctx.fillStyle = "#48cae4";
        ctx.font = `${18 * p.scale}px sans-serif`;
        ctx.fillText("🎵", p.x, p.y);
      } else if (p.type === "text") {
        ctx.fillStyle = p.color;
        ctx.font = "bold 15px Outfit, sans-serif";
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 6;
        ctx.fillText(p.text, p.x, p.y);
      }

      ctx.restore();
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.bounGame = new BounCatGame();
});
