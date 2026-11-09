(() => {
  const config = window.SPLAT_STREAM ?? {};
  const screen = document.querySelector("#screen");
  const video = document.querySelector("#video");
  const cover = document.querySelector("#cover");
  const status = document.querySelector("#status");
  const hint = document.querySelector("#hint");
  const play = document.querySelector("#play");
  const playLabel = document.querySelector("#play-label");
  const hlsUrl = config.hlsUrl?.trim();
  const youtubeId = config.youtubeVideoId?.trim();
  let hls;
  let library;
  let timeout;
  let active = false;

  function showStatus(text, state = "idle") {
    status.textContent = text;
    status.dataset.state = state;
  }

  function unavailable(message) {
    if (!active) return;
    active = false;
    clearTimeout(timeout);
    hls?.destroy();
    hls = undefined;
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.hidden = true;
    cover.hidden = false;
    play.disabled = false;
    playLabel.textContent = "Попробовать снова";
    hint.textContent = message;
    showStatus("Сигнал недоступен");
    play.focus();
  }

  function loadLibrary() {
    if (window.Hls) return Promise.resolve(window.Hls);
    library ??= new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js";
      script.onload = () => resolve(window.Hls);
      script.onerror = () => {
        script.remove();
        reject(new Error("Не удалось загрузить hls.js"));
      };
      document.head.append(script);
    }).catch((error) => {
      library = undefined;
      throw error;
    });
    return library;
  }

  if (!hlsUrl && !youtubeId) return;
  showStatus("Готов к подключению");
  hint.textContent = "";
  play.hidden = false;

  play.addEventListener("click", async () => {
    if (!hlsUrl && /^[\w-]{11}$/.test(youtubeId)) {
      const frame = document.createElement("iframe");
      frame.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
      frame.title = "Эфир СПЛАТ ТВ на YouTube";
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.allowFullscreen = true;
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      screen.append(frame);
      cover.hidden = true;
      showStatus("Плеер YouTube");
      frame.focus();
      return;
    }

    active = true;
    play.disabled = true;
    showStatus("Подключаемся…");
    hint.textContent = "Подключение к трансляции";
    try {
      const source = new URL(hlsUrl || "");
      if (!["https:", "http:"].includes(source.protocol) ||
          (location.protocol === "https:" && source.protocol !== "https:")) {
        unavailable("Для этой страницы нужен HTTPS-адрес потока.");
        return;
      }
      const native = video.canPlayType("application/vnd.apple.mpegurl");
      const Hls = native ? null : await loadLibrary();
      if (!native && !Hls?.isSupported()) {
        unavailable("В этом браузере недоступно воспроизведение HLS.");
        return;
      }

      timeout = setTimeout(() => unavailable("Проверьте, началась ли трансляция, и попробуйте снова."), 25000);
      if (native) {
        video.src = source.href;
      } else {
        hls = new Hls({
          lowLatencyMode: false,
          liveSyncDurationCount: 5
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) unavailable("Проверьте, началась ли трансляция, и попробуйте снова.");
        });
        hls.loadSource(source.href);
        hls.attachMedia(video);
      }
      cover.hidden = true;
      video.hidden = false;
      video.focus();
      video.play().catch(() => {
        if (active) showStatus("Нажмите ▶ в плеере");
      });
    } catch {
      unavailable("Не удалось открыть источник. Проверьте адрес потока и соединение.");
    }
  });

  video.addEventListener("playing", () => {
    clearTimeout(timeout);
    showStatus("В эфире", "live");
  });
  video.addEventListener("waiting", () => {
    if (!active) return;
    showStatus("Загрузка сигнала…");
    clearTimeout(timeout);
    timeout = setTimeout(() => unavailable("Сигнал пропал. Попробуйте подключиться снова."), 25000);
  });
  video.addEventListener("pause", () => {
    if (!active) return;
    clearTimeout(timeout);
    showStatus("На паузе");
  });
  video.addEventListener("ended", () => unavailable("Трансляция закончилась."));
  video.addEventListener("error", () => unavailable("Сигнал недоступен. Попробуйте подключиться снова."));
})();
