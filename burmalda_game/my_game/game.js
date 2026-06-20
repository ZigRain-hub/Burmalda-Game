var viewers = 0;
var coins = 0;
var level = 1;
var shopLevel = 0;
var buffActive = false;
var buffEndTime = 0;
var buffType = null;
var soundEnabled = true;
var musicEnabled = true;
var audioCtx = null;
var bgMusic = null;
var musicStarted = false;
var ysdk = null;
var player = null;
var donateAlertTimeout = null;
var isPaused = false;
var gameStarted = false;
var adCooldown = false;

var baseDonation = 5;
var buffCost = 1000;
var buffDuration = 10 * 60 * 1000;
var adBuffDuration = 5 * 60 * 1000;

// Магазин Меллстройности (левая панель)
var shopItems = [
    {lvl: 1, name: "Новичок", desc: "2 зрителя за тап", cost: 100, viewersGain: 2},
    {lvl: 2, name: "Знакомый", desc: "4 зрителя за тап", cost: 1042, viewersGain: 4},
    {lvl: 3, name: "Подписчик", desc: "10 зрителей за тап", cost:10052, viewersGain: 10},
    {lvl: 4, name: "Фанат", desc: "25 зрителей за тап", cost: 151488, viewersGain: 25},
    {lvl: 5, name: "Модератор", desc: "60 зрителей за тап", cost: 676767, viewersGain: 60},
    {lvl: 6, name: "Донатер", desc: "150 зрителей за тап", cost: 5228228, viewersGain: 150},
    {lvl: 7, name: "Топ-донатер", desc: "400 зрителей за тап", cost: 50000000, viewersGain: 400},
    {lvl: 8, name: "Олд", desc: "1000 зрителей за тап", cost: 100000000, viewersGain: 1000},
    {lvl: 9, name: "Легенда", desc: "2500 зрителей за тап", cost: 500000000, viewersGain: 2500},
    {lvl: 10, name: "Меллстрой", desc: "10000 зрителей за тап", cost: 6752148842, viewersGain: 10000}
];

// Спец предложения (нижняя панель) — без иконок, эмодзи в тексте
var specialItems = [
    {id: "levelup", name: "⭐ УРОВЕНЬ", desc: "Повысить уровень", getCost: function() { return getLevelCost(); }, type: "level"},
    {id: "buff2x", name: "🔥 ×2 БАФФ", desc: "×2 доход 10 мин", cost: 10000000, type: "buff"},
    {id: "buff2x_ad", name: "📺 ×2 РЕКЛАМА", desc: "×2 доход 5 мин", cost: 0, type: "ad_buff"}
];

var streamerImages = {
    1: "mellstroy1.png", 2: "mellstroy2.png", 3: "mellstroy3.png",
    4: "mellstroy4.png", 5: "mellstroy5.png", 6: "mellstroy6.png",
    7: "mellstroy7.png", 8: "mellstroy8.png", 9: "mellstroy9.png", 10: "mellstroy10.png"
};

var chatNames = ["Аноним","Зритель228","Донатер","Фанат_Меллстроя","Стример_помоги","Просто_чел","Киберспортсмен","Топ_донатер","Новичок","Олд","Мемолог","Тиктокер","Владелец_кота","Программист","Дизайнер","Модератор","Подписчик","Зритель","Чел_из_чата","Девочка_из_чата"];

var chatPhrases = ["Крутой стрим! 🔥","Меллстрой лучший!","Ам-ам-ам 😂","Когда новый видос?","Топ контент","Это легенда","Я тут первый раз","Дайте мне модератора","Сколько уже стримишь?","Четко, брат","Это контент года","Подписка оформлена ✅","Какой микрофон?","Ты красава","Го в доту","Когда розыгрыш?","Я с телефона смотрю","Поставь музыку погромче","Это было эпично","Ты реально крутой","Сколько тебе лет?","Откуда ты?","Покажи кота","Я донатил вчера","Топовый стрим","Продолжай в том же духе","Я твой фанат","Когда коллаб?","Обожаю твои стримы","Привет из Москвы!","Привет из Питера!","Ты читаешь чат?","Ответь плиз","Я новый подписчик","Контент бомба 💣","Меллстрой гений","Лучший стример","Топ за деньги","Как дела?","Что за игра?","Го общаться","Мемасик","Хахаха","Офигеть","Вау","Ничоси","Прикольно","Класс","Огонь","Бомба"];

function getViewersPerTap() {
    var gain = 1;
    if (shopLevel >= 1) gain = shopItems[shopLevel-1].viewersGain;
    if (buffActive) gain *= 2;
    return gain;
}

function getDonateMultiplier() {
    var mult = 1 + (level - 1) * 0.1;
    if (buffActive) mult *= 2;
    return mult;
}

function getLevelCost() {
    return Math.floor(1000 * Math.pow(4, level - 1));
}

function getSpeedMultiplier() {
    var mult = 1 + Math.floor(viewers / 500) * 0.01;
    return Math.min(mult, 2.0);
}

function applySpeedToAnimations() {
    var mult = getSpeedMultiplier();
    var app = document.querySelector('.app');
    if (app) app.style.animationDuration = (0.6 / mult) + 's, ' + (1.5 / mult) + 's, 1s';
    var mellstroy = document.querySelector('.streamer-img-full img');
    if (mellstroy) mellstroy.style.animationDuration = (0.5 / mult) + 's, 4s';
}

function formatNumber(n) {
    if (n >= 1e9) return (n/1e9).toFixed(1) + "B";
    if (n >= 1e6) return (n/1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n/1e3).toFixed(1) + "K";
    return n.toString();
}

function updateUI() {
    document.getElementById("viewers-count").textContent = formatNumber(viewers);
    document.getElementById("coins-count").textContent = formatNumber(coins);
    document.getElementById("level-count").textContent = level;
    applySpeedToAnimations();

    var cost = getLevelCost();
    var progress = Math.min((coins / cost) * 100, 100);
    var progressBar = document.getElementById("level-progress");
    if (progressBar) progressBar.style.width = progress + "%";

    var buffIndicator = document.getElementById("buff-indicator");
    if (buffIndicator) buffIndicator.style.display = buffActive ? "flex" : "none";

    var btnSound = document.getElementById("btn-sound");
    if (btnSound) {
        btnSound.textContent = soundEnabled ? "🔊" : "🔇";
        btnSound.classList.toggle("muted", !soundEnabled);
    }

    var btnMusic = document.getElementById("btn-music");
    if (btnMusic) {
        btnMusic.textContent = musicEnabled ? "🎵" : "🚫";
        btnMusic.classList.toggle("muted", !musicEnabled);
    }

    renderSpecialItems();
}

function updateStreamerImage() {
    var imgEl = document.getElementById("streamer-img");
    var imgName = streamerImages[level];
    if (imgName) {
        imgEl.innerHTML = '<img src="' + imgName + '" alt="Меллстрой" id="streamer-png" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'🎙️\';">';
    }
}

function addChat(text, type) {
    var chat = document.getElementById("chat-messages");
    var msg = document.createElement("div");
    msg.className = "chat-msg " + type;
    if (type === "normal") {
        var name = chatNames[Math.floor(Math.random() * chatNames.length)];
        msg.innerHTML = '<span class="name">' + name + ":</span> " + text;
    } else {
        msg.textContent = text;
    }
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
    while (chat.children.length > 50) chat.removeChild(chat.firstChild);
}

function spawnParticle(x, y, text, isBonus) {
    var container = document.getElementById("particles");
    var p = document.createElement("div");
    p.className = "particle" + (isBonus ? " bonus" : "");
    p.textContent = text;
    p.style.left = x + "px";
    p.style.top = y + "px";
    p.style.color = ["#9146ff", "#00f593", "#ffd93d", "#ff6b6b", "#00d4ff", "#ff00ff"][Math.floor(Math.random() * 6)];
    var speedMult = getSpeedMultiplier();
    p.style.animationDuration = (isBonus ? 1.2 : 0.8) / speedMult + "s";
    container.appendChild(p);
    setTimeout(function() { if (p.parentNode) p.parentNode.removeChild(p); }, (isBonus ? 1200 : 800) / speedMult);
}

function showDonationAlert(name, amount) {
    var alert = document.getElementById("donation-alert");
    var amountEl = document.getElementById("donation-amount");
    var nameEl = document.getElementById("donation-name");
    if (!alert) return;
    if (donateAlertTimeout) clearTimeout(donateAlertTimeout);
    amountEl.textContent = amount + " $";
    nameEl.textContent = name;
    alert.style.display = "block";
    var screen = document.getElementById("click-zone");
    screen.style.filter = "brightness(1.8) saturate(2.5) hue-rotate(45deg)";
    setTimeout(function() { screen.style.filter = ""; }, 400);
    donateAlertTimeout = setTimeout(function() { alert.style.display = "none"; }, 4000);
}

// ===== РЕНДЕР МАГАЗИНА МЕЛЛСТРОЙНОСТИ =====
function renderShop() {
    var container = document.getElementById("shop-items");
    if (!container) return;
    container.innerHTML = "";
    for (var i = 0; i < shopItems.length; i++) {
        var item = shopItems[i];
        var owned = shopLevel >= item.lvl;
        var locked = !owned && shopLevel < item.lvl - 1;
        var el = document.createElement("div");
        el.className = "shop-item" + (owned ? " owned" : "") + (locked ? " shop-item-locked" : "");
        el.innerHTML = '<div class="shop-item-lvl">УРОВЕНЬ ' + item.lvl + '</div>' +
            '<div class="shop-item-name">' + item.name + '</div>' +
            '<div class="shop-item-desc">' + item.desc + '</div>' +
            '<div class="shop-item-cost">' + (owned ? "✅ КУПЛЕНО" : "💰 " + formatNumber(item.cost)) + '</div>';
        if (!owned && !locked) {
            el.onclick = (function(itm) {
                return function() {
                    if (coins >= itm.cost && shopLevel < itm.lvl) {
                        coins -= itm.cost;
                        shopLevel = itm.lvl;
                        addChat("🛒 Куплен уровень Меллстройности: " + itm.name + "! +" + itm.viewersGain + " зрителей/тап", "levelup");
                        playLevelUpSound();
                        renderShop();
                        updateUI();
                    }
                };
            })(item);
        }
        container.appendChild(el);
    }
}

// ===== РЕНДЕР СПЕЦ ПРЕДЛОЖЕНИЙ =====
function renderSpecialItems() {
    var container = document.getElementById("special-items");
    if (!container) return;
    container.innerHTML = "";

    for (var i = 0; i < specialItems.length; i++) {
        var item = specialItems[i];
        var el = document.createElement("div");
        var cost = item.type === "level" ? item.getCost() : item.cost;
        var canAfford = coins >= cost;
        var isDisabled = (item.type === "buff" && buffActive) || (item.type === "ad_buff" && adCooldown);

        el.className = "special-item" + (isDisabled ? " disabled" : "");
        if (item.type === "ad_buff") el.classList.add("ad");

        // Без отдельной иконки — эмодзи уже в name
        el.innerHTML = '<div class="special-item-name">' + item.name + '</div>' +
            '<div class="special-item-desc">' + item.desc + '</div>' +
            '<div class="special-item-cost">' + (item.type === "ad_buff" ? "📺 РЕКЛАМА" : "💰 " + formatNumber(cost)) + '</div>';

        if (!isDisabled) {
            el.onclick = (function(itm) {
                return function() {
                    handleSpecialClick(itm);
                };
            })(item);
        }

        container.appendChild(el);
    }
}

function handleSpecialClick(item) {
    if (isPaused) return;

    switch(item.type) {
        case "level":
            var cost = getLevelCost();
            if (coins >= cost) {
                coins -= cost;
                level++;
                addChat("⭐ УРОВЕНЬ ПОВЫШЕН! Теперь уровень " + level + "!", "levelup");
                playLevelUpSound();
                updateStreamerImage();
                updateUI();
                showInterstitialAd();
            }
            break;
        case "buff":
            if (coins >= buffCost && !buffActive) {
                coins -= buffCost;
                activateBuff("coins", buffDuration);
            }
            break;
        case "ad_buff":
            if (!adCooldown) {
                showRewardedAdForBuff();
            }
            break;
    }
}

function activateBuff(type, duration) {
    buffActive = true;
    buffType = type;
    buffEndTime = Date.now() + duration;
    var mins = Math.floor(duration / 60000);
    var source = type === "ad" ? " (реклама)" : " (монеты)";
    addChat("🔥 БАФФ АКТИВИРОВАН! ×2 доход на " + mins + " мин!" + source, "buff");
    playBuffSound();
    updateUI();
}

// ===== РЕКЛАМА =====
function showRewardedAdForBuff() {
    if (!ysdk || !ysdk.adv) {
        addChat("📺 Реклама недоступна, но бафф выдан!", "system");
        activateBuff("ad", adBuffDuration);
        return;
    }

    adCooldown = true;
    handlePause();

    ysdk.adv.showRewardedVideo({
        callbacks: {
            onOpen: function() {
                if (bgMusic) bgMusic.pause();
            },
            onRewarded: function() {
                activateBuff("ad", adBuffDuration);
                addChat("📺 Спасибо за просмотр! Бафф получен!", "system");
            },
            onClose: function() {
                handleResume();
                updateMusicState();
                setTimeout(function() { adCooldown = false; }, 180000);
            },
            onError: function(err) {
                handleResume();
                updateMusicState();
                setTimeout(function() { adCooldown = false; }, 10000);
                addChat("❌ Ошибка рекламы", "system");
                console.log("Ad error:", err);
            }
        }
    });
}

function showInterstitialAd() {
    if (!ysdk || !ysdk.adv) return;
    ysdk.adv.showFullscreenAdv({
        callbacks: {
            onOpen: function() { handlePause(); if(bgMusic) bgMusic.pause(); },
            onClose: function(wasShown) { handleResume(); updateMusicState(); },
            onError: function(err) { handleResume(); updateMusicState(); }
        }
    });
}

// ЗВУКИ
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
}

function playClickSound() {
    if (!soundEnabled || isPaused) return;
    initAudio();
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(350, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(650, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.1);
}

function playDonateSound() {
    if (!soundEnabled || isPaused) return;
    initAudio();
    var now = audioCtx.currentTime;
    var notes = [523, 659, 784, 1047];
    for (var i = 0; i < notes.length; i++) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(notes[i], now + i * 0.06);
        gain.gain.setValueAtTime(0.18, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.2);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.2);
    }
}

function playLevelUpSound() {
    if (!soundEnabled || isPaused) return;
    initAudio();
    var now = audioCtx.currentTime;
    var notes = [440, 554, 659, 880, 1100];
    for (var i = 0; i < notes.length; i++) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "square";
        osc.frequency.setValueAtTime(notes[i], now + i * 0.06);
        gain.gain.setValueAtTime(0.1, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.15);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.15);
    }
}

function playBuffSound() {
    if (!soundEnabled || isPaused) return;
    initAudio();
    var now = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.4);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
}

// МУЗЫКА
function initMusic() {
    if (musicStarted || isPaused) return;
    bgMusic = document.getElementById("bg-music");
    if (!bgMusic) return;
    bgMusic.volume = 0.3;
    if (musicEnabled) {
        bgMusic.play().then(function() {
            musicStarted = true;
        }).catch(function(e) {
            console.log("Music autoplay blocked");
        });
    }
}

function toggleMusic() {
    if (!bgMusic) {
        bgMusic = document.getElementById("bg-music");
        if (!bgMusic) return;
    }
    musicEnabled = !musicEnabled;
    if (musicEnabled) {
        if (!isPaused) {
            bgMusic.volume = 0.3;
            bgMusic.play().catch(function(){});
        }
    } else {
        bgMusic.pause();
    }
    updateUI();
}

function updateMusicState() {
    if (!bgMusic) return;
    if (musicEnabled && !isPaused) {
        bgMusic.volume = 0.3;
        bgMusic.play().catch(function(){});
    } else {
        bgMusic.pause();
    }
}

// SAVE/LOAD
function saveYandex() {
    if (isPaused) return;
    var data = {
        viewers: viewers, coins: coins, level: level, shopLevel: shopLevel,
        buffActive: buffActive, buffEndTime: buffEndTime, buffType: buffType,
        soundEnabled: soundEnabled, musicEnabled: musicEnabled, timestamp: Date.now()
    };
    if (player) {
        player.setData(data).catch(function() { saveLocal(data); });
    } else {
        saveLocal(data);
    }
}

function loadYandex() {
    if (player) {
        player.getData().then(function(data) {
            if (data && Object.keys(data).length > 0) applySaveData(data);
            else loadLocal();
        }).catch(function() { loadLocal(); });
    } else {
        loadLocal();
    }
}

function saveLocal(data) {
    localStorage.setItem("mellstroy_save", JSON.stringify(data));
}

function loadLocal() {
    var raw = localStorage.getItem("mellstroy_save");
    if (!raw) return;
    try { applySaveData(JSON.parse(raw)); } catch(e) {}
}

function applySaveData(data) {
    viewers = data.viewers || 0;
    coins = data.coins || 0;
    level = data.level || 1;
    shopLevel = data.shopLevel || 0;
    soundEnabled = data.soundEnabled !== false;
    musicEnabled = data.musicEnabled !== false;
    if (data.buffActive && data.buffEndTime > Date.now()) {
        buffActive = true;
        buffEndTime = data.buffEndTime;
        buffType = data.buffType || "coins";
    } else {
        buffActive = false;
    }
    var offline = Math.min(Date.now() - (data.timestamp || Date.now()), 2 * 3600 * 1000);
    if (offline > 5000 && viewers > 0) {
        var earned = Math.floor(baseDonation * (viewers / 100) * level * (offline / 60000));
        if (earned > 0) {
            coins += earned;
            addChat("💤 Оффлайн доход: +" + earned + " $", "system");
        }
    }
}

// ПАУЗА/РЕЗЮМЕ
function handlePause() {
    isPaused = true;
    if (bgMusic) bgMusic.pause();
    if (audioCtx && audioCtx.state === "running") audioCtx.suspend();
}

function handleResume() {
    isPaused = false;
    updateMusicState();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}

// СОБЫТИЯ
var clickZone = document.getElementById("click-zone");
if (clickZone) {
    clickZone.onclick = function(e) {
        if (isPaused) return;
        if (!musicStarted) initMusic();
        var rect = this.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var gain = getViewersPerTap();
        viewers += gain;
        var speedMult = getSpeedMultiplier();
        var particleCount = Math.min(4 + Math.floor(viewers / 200), 10);

        spawnParticle(x, y, "+" + gain + " 👥", false);
        for (var i = 0; i < particleCount; i++) {
            var px = x + (Math.random() - 0.5) * 80;
            var py = y + (Math.random() - 0.5) * 50;
            var icons = ["💜", "🔥", "⭐", "💎", "⚡", "🚀", "👑", "💰", "🎙️", "🎵"];
            spawnParticle(px, py, icons[Math.floor(Math.random() * icons.length)], true);
        }

        playClickSound();

        var img = document.getElementById("streamer-png");
        if (img) {
            img.classList.toggle("mirror");
            img.classList.add("click-flash");
            setTimeout(function() { img.classList.remove("click-flash"); }, 150 / speedMult);
        }

        var screen = document.getElementById("click-zone");
        screen.style.animation = "shake 0.2s ease-in-out";
        screen.style.filter = "brightness(1.5) saturate(1.8) hue-rotate(20deg)";
        setTimeout(function() { 
            screen.style.animation = ""; 
            screen.style.filter = ""; 
        }, 200 / speedMult);

        updateUI();
    };
}

// Кнопки управления
document.getElementById("btn-music").onclick = function() {
    toggleMusic();
};

document.getElementById("btn-sound").onclick = function() {
    soundEnabled = !soundEnabled;
    updateUI();
};

document.getElementById("btn-save").onclick = function() {
    saveYandex();
    addChat("💾 Прогресс сохранён!", "system");
};

document.getElementById("btn-reset").onclick = function() {
    if (!confirm("Сбросить ВЕСЬ прогресс? Это необратимо!")) return;
    if (!confirm("Точно? Все покупки и уровни будут потеряны!")) return;
    viewers = 0; coins = 0; level = 1; shopLevel = 0;
    buffActive = false; buffEndTime = 0; buffType = null;
    localStorage.removeItem("mellstroy_save");
    document.getElementById("chat-messages").innerHTML = "";
    addChat("🗑️ Прогресс сброшен", "system");
    renderShop();
    renderSpecialItems();
    updateStreamerImage();
    updateUI();
};

// Сворачивание панелей (магазин и чат)
var shopToggle = document.getElementById("shop-toggle");
if (shopToggle) {
    shopToggle.onclick = function() {
        var panel = document.getElementById("shop-panel");
        var icon = document.getElementById("shop-toggle-icon");
        panel.classList.toggle("collapsed");
        icon.textContent = panel.classList.contains("collapsed") ? "▶" : "◀";
    };
}

var chatToggle = document.getElementById("chat-toggle");
if (chatToggle) {
    chatToggle.onclick = function() {
        var panel = document.getElementById("chat-panel");
        var icon = document.getElementById("chat-toggle-icon");
        panel.classList.toggle("collapsed");
        icon.textContent = panel.classList.contains("collapsed") ? "▶" : "▼";
    };
}

// СПЕЦ ПРЕДЛОЖЕНИЯ — НЕ СВОРАЧИВАЮТСЯ (обработчик удалён)

// ЧАТ
setInterval(function() {
    if (!isPaused && Math.random() > 0.25) {
        var name = chatNames[Math.floor(Math.random() * chatNames.length)];
        var phrase = chatPhrases[Math.floor(Math.random() * chatPhrases.length)];
        addChat(name + ": " + phrase, "normal");
    }
}, 250);

// ДОНАТЫ
function scheduleDonate() {
    var delay = 2500 + Math.random() * 5000;
    setTimeout(function() {
        if (!isPaused && viewers >= 1) {
            var mult = getDonateMultiplier();
            var amount = Math.floor(baseDonation * (viewers / 100) * level * mult *0.9);
            if (amount >= 1) {
                coins += amount;
                var name = chatNames[Math.floor(Math.random() * chatNames.length)];
                showDonationAlert(name, amount);
                addChat("💰 " + name + " задонатил " + amount + " $", "donation");
                playDonateSound();
                updateUI();
            }
        }
        scheduleDonate();
    }, delay);
}

// БАФФ ТАЙМЕР
function updateBuffTimer() {
    if (!buffActive) return;
    var remaining = buffEndTime - Date.now();
    if (remaining <= 0) {
        buffActive = false;
        buffType = null;
        addChat("🔥 Бафф закончился!", "system");
        updateUI();
        return;
    }
    var mins = Math.floor(remaining / 60000);
    var secs = Math.floor((remaining % 60000) / 1000);
    var timer = document.getElementById("buff-timer");
    if (timer) timer.textContent = mins + ":" + secs.toString().padStart(2, "0");
}

// YANDEX SDK INIT
function initYandex() {
    if (typeof YaGames === 'undefined') {
        console.log("Yandex SDK not available");
        loadLocal();
        startGame();
        return;
    }
    YaGames.init().then(function(sdk) {
        ysdk = sdk;
        console.log("Yandex SDK initialized");

        if (ysdk.deviceInfo && ysdk.deviceInfo.isMobile && ysdk.deviceInfo.isMobile()) {
            ysdk.screen.fullscreen.request().catch(function(){});
        }

        ysdk.on('game_api_pause', handlePause);
        ysdk.on('game_api_resume', handleResume);

        document.addEventListener('visibilitychange', function() {
            if (document.hidden) handlePause();
            else handleResume();
        });

        ysdk.features.LoadingAPI.ready();
        return ysdk.getPlayer();
    }).then(function(p) {
        player = p;
        loadYandex();
        startGame();
    }).catch(function(err) {
        console.log("Yandex init failed:", err);
        loadLocal();
        startGame();
    });
}

function startGame() {
    gameStarted = true;
    renderShop();
    renderSpecialItems();
    updateStreamerImage();
    updateUI();
    scheduleDonate();
    setInterval(saveYandex, 30000);
    setInterval(updateBuffTimer, 1000);



    addChat("🎙️ Стрим начался! Тапайте для зрителей!", "system");
    addChat("💡 Совет: Прокачивайте Меллстройность для онлайна!", "system");
    addChat("🔥 Спец предложения внизу — качай уровни и баффы!", "system");
    addChat("Крутой стрим! 🔥", "normal");
    addChat("Меллстрой лучший!", "normal");
}

// Prevent pinch zoom
document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) e.preventDefault();
}, {passive: false});

// Prevent context menu
document.addEventListener('contextmenu', function(e) { e.preventDefault(); });

// Keyboard controls
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        var zone = document.getElementById("click-zone");
        if (zone) zone.click();
    }
});

// СТАРТ
initYandex();
