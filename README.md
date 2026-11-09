# СПЛАТ ТВ

Статический сайт с заставкой, описанием канала и плеером. Для эфира можно выбрать HLS с MediaMTX или встроенный плеер YouTube. Сайт готов к загрузке в GitHub Pages и открывается локально через `index.html`.

## Публикация на GitHub Pages

1. Создайте публичный репозиторий, например `splat-tv`.
2. Загрузите **содержимое** архива в корень ветки `main`, чтобы `index.html` лежал на одном уровне с папкой `assets`. Сохраните пустой файл `.nojekyll`.
3. Откройте **Settings → Pages → Build and deployment**. Выберите **Deploy from a branch → main → / (root)** и нажмите **Save**.
4. После сборки откройте **Visit site**. Для репозитория `splat-tv` адрес обычно будет `https://ВАШ-ЛОГИН.github.io/splat-tv/`.

GitHub Pages отдаёт файлы сайта. Видео поступает в браузер со второго сервера по HTTPS. [Документация GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 1. Проверьте OBS → MediaMTX на своём ПК

В инструкции OBS и MediaMTX работают на одном компьютере. Сделайте резервную копию `mediamtx.yml`. В существующем файле поменяйте значения перечисленных ключей. Добавьте `splat` в существующий раздел `paths`, сохранив нужные вам записи.

```yaml
rtmp: true
rtmpAddress: 127.0.0.1:1935
hls: true
hlsAddress: 127.0.0.1:8888
hlsEncryption: false
hlsVariant: fmp4
hlsAllowOrigins: ["*"]

paths:
  splat:
    source: publisher
```

1. Из папки MediaMTX запустите в PowerShell `.\mediamtx.exe .\mediamtx.yml`.
2. В OBS откройте **Настройки → Трансляция → Настраиваемый сервис**. В поле «Сервер» введите `rtmp://127.0.0.1:1935/splat`. Оставьте поле «Ключ потока» пустым.
3. Для старта подойдут H.264 + AAC, 720p, 30 кадров/с, 2000 кбит/с для видео и интервал ключевых кадров 2 секунды. Добавьте источник в OBS и нажмите **Начать трансляцию**.
4. Откройте `http://127.0.0.1:8888/splat/` в браузере. Дайте MediaMTX несколько секунд на подготовку HLS.
5. Чтобы проверить плеер сайта, временно установите `hlsUrl: "http://127.0.0.1:8888/splat/index.m3u8"` в `stream-config.js`. В папке сайта запустите `py -m http.server 8000 --bind 127.0.0.1` и откройте `http://127.0.0.1:8000/`.

[OBS Studio и MediaMTX](https://mediamtx.org/docs/publish/obs-studio) · [Проверка HLS](https://mediamtx.org/docs/read/web-browsers) · [Параметры MediaMTX](https://mediamtx.org/docs/references/configuration-file)

## 2. Откройте эфир через Tailscale Funnel

Этот способ сохраняет цепочку OBS → MediaMTX → плеер СПЛАТ ТВ. Funnel выдаёт публичный HTTPS-адрес для локального HLS. Проброс портов и публичный IP дома не нужны. Funnel доступен на бесплатном тарифе Personal и имеет ограничение пропускной способности, поэтому начните с проверки на одном зрителе. [Tailscale Funnel](https://tailscale.com/docs/features/tailscale-funnel) · [Тарифы](https://tailscale.com/pricing)

1. Установите [Tailscale для Windows](https://tailscale.com/docs/install/windows) и войдите в свой аккаунт.
2. Запустите MediaMTX с настройками из шага 1 и начните эфир в OBS. Убедитесь, что `http://127.0.0.1:8888/splat/` показывает видео. Funnel откроет для интернета HLS на порту `8888`, включая другие потоки, которые выдаёт этот HLS-сервер. Для публичного эфира используйте экземпляр MediaMTX, где транслируется только `splat`.
3. Откройте PowerShell и выполните `tailscale funnel 8888`. При первом запуске откройте предложенную ссылку и включите Funnel. Оставьте PowerShell с запущенной командой открытым. [Команда Funnel](https://tailscale.com/docs/reference/tailscale-cli/funnel)
4. Скопируйте выданный HTTPS-адрес. Добавьте к нему `/splat/` и проверьте видео через мобильный интернет. Зрителям Tailscale устанавливать не нужно.
5. В `stream-config.js` впишите тот же адрес с окончанием `/splat/index.m3u8` и загрузите обновлённый файл на GitHub.

```js
window.SPLAT_STREAM = {
  hlsUrl: "https://имя-устройства.имя-сети.ts.net/splat/index.m3u8",
  youtubeVideoId: ""
};
```

Подставьте реальный адрес из вывода команды. Для эфира оставьте включёнными ПК, OBS, MediaMTX и Funnel. Чтобы закрыть публичный доступ после эфира, нажмите Ctrl+C в окне с командой.

## Если Funnel недоступен или эфир прерывается

Если YouTube Live доступен для вашего аккаунта и зрителей, создайте эфир в YouTube Studio и отправляйте видео из OBS прямо на YouTube. Используйте выданные YouTube адрес сервера и ключ только в OBS. Разрешите встраивание и скопируйте ID эфира из ссылки после `v=` или из кода встраивания после `/embed/`. В `stream-config.js` оставьте `hlsUrl` пустым и заполните `youtubeVideoId`. Для нового эфира с другим ID обновите файл на GitHub. [Эфир через видеокодер](https://support.google.com/youtube/answer/2907883) · [Встраивание видео](https://support.google.com/youtube/answer/171780)
