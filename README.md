# Spotify Read-Along PiP Window / Spotify 跟读文本画中画小窗 / Spotify 読み合わせ PiP ウィンドウ

Open a Spotify podcast's read-along transcript ("跟读文本") in a browser Picture-in-Picture window — no extension, no Tampermonkey. Pure bookmarklet.

把 Spotify 播客的「跟读文本」放进浏览器画中画小窗：自动高亮当前句、进度条点按跳转、快进快退控制。纯书签脚本，无需任何扩展。

Spotifyのポッドキャスト「読み合わせテキスト」をブラウザのピクチャーインピクチャーで表示します。拡張機能不要のブックマークレットです。

---

## Why a bookmarklet instead of Tampermonkey? / 为什么用书签而不是油猴？/ なぜブックマークレット？

**中文**：书签会通过浏览器账号原生同步——Edge/Chrome 登录后，书签栏自动同步到所有设备，零配置。油猴（Tampermonkey）脚本同步需要手动开启 Chrome Sync 或配置 WebDAV，麻烦得多。书签也不依赖扩展本身（扩展被禁用/卸载时书签依然可用），导出书签 HTML 即可完整备份。

**English**: Bookmarks sync natively through your browser account — sign into Edge/Chrome and your bookmarks bar follows you to every device with zero configuration. Tampermonkey scripts, by contrast, need manual Chrome Sync or WebDAV setup. Bookmarklets also don't depend on an extension being installed or enabled, and backing up is just exporting your bookmarks HTML.

**日本語**：ブックマークはブラウザアカウントでネイティブ同期されます。Edge/Chromeにログインすれば、全デバイスのブックマークバーに自動反映され、設定は不要です。Tampermonkeyのスクリプト同期はChrome SyncやWebDAVの手動設定が必要で手間がかかります。ブックマークレットは拡張機能に依存しないため、拡張機能が無効でも動作します。

> 如果你更喜欢油猴/篡改猴等插件，完全可以把这个脚本的逻辑移植成 userscript——核心选择器和同步逻辑都是现成的，欢迎参考/复用。
> If you prefer Tampermonkey or similar extensions, porting this logic into a userscript is straightforward — the selectors and sync logic are all here. Feel free to reference or reuse.
> Tampermonkeyなどの拡張機能をお好みの場合は、このスクリプトのロジックをuserscriptに移植可能です。セレクタと同期ロジックはすべてここにあります。参考・再利用はご自由に。

---

## Install / 安装 / インストール

1. Open [`bookmarklet.txt`](bookmarklet.txt) and copy the entire contents (it starts with `javascript:`).
   打开 [`bookmarklet.txt`](bookmarklet.txt)，复制全部内容（以 `javascript:` 开头）。
   [`bookmarklet.txt`](bookmarklet.txt)を開いて全文コピーします（`javascript:`で始まります）。
2. In your browser, add a new bookmark (Ctrl+D on any page, then edit it), paste the copied text as the **URL**.
   在浏览器中新建一个书签（随便收藏一个页面然后编辑它），把复制的内容粘贴到 **URL** 栏。
   ブラウザで新しいブックマークを追加し、URL欄に貼り付けます。
3. **Note (Edge/Chrome quirk):** pasting may silently strip the `javascript:` prefix. If that happens, edit the bookmark and manually type `javascript:` at the very front (English colon).
   **注意（Edge/Chrome 的坑）：** 粘贴时浏览器可能吞掉开头的 `javascript:` 前缀。如果保存后无法使用，请编辑书签手动在开头补打 `javascript:`（英文冒号）。
   **注意（Edge/Chromeの仕様）：** 貼り付け時に`javascript:`プレフィックスが削除されることがあります。その場合は書き直してください。
4. Name it something like `小窗` / `PiP`.
   名字随意，比如「小窗」。
   名前は自由です。

## Usage / 使用 / 使い方

1. Play a podcast episode that has the read-along transcript (Spotify's 「跟读文本（测试版）」 feature), and open the "Now Playing" view so the transcript panel is visible.
   播放一集带「跟读文本（测试版）」的播客，并打开右侧「当前播放」视图让跟读文本面板可见。
2. Click the bookmark. A Picture-in-Picture window opens with:
   点击书签，会弹出一个画中画小窗，包含：
   ブックマークをクリックするとPiPウィンドウが開きます：
   - the read-along transcript, auto-following the current sentence (green highlight)
     跟读文本，自动跟随当前句（绿色高亮）
   - transport controls: «15 / play-pause / 15» / prev / next
     播放控制：后退15秒 / 播放暂停 / 快进15秒 / 上一首 / 下一首
   - a seek bar (click or drag to jump)
     进度条（点击或拖动跳转）
   - a follow toggle (⇅) — it pauses auto-scroll for 6s after you scroll manually
     跟随开关（⇅），手动滚动后自动暂停跟随6秒

Close the PiP window when done — everything returns to normal.
关闭小窗即恢复正常，主页面不受影响。

## Compatibility / 兼容性 / 互換性

- Desktop Edge / Chrome / other Chromium browsers with `documentPictureInPicture` support (Chrome 116+)
- Requires you to be logged in to Spotify (the read-along transcript is a logged-in, beta feature)
- 需要登录 Spotify（跟读文本是登录态的测试版功能）
- Spotify ネットワークプレーヤーにログインしている必要があります

## How it works / 原理 / 仕組み

The bookmarklet clones Spotify's own read-along container (`[data-testid="read-along-scroll-container"]`) into a `documentPictureInPicture` window, then syncs per-line "read" classes (lines Spotify itself marks as read) instead of re-rendering — so highlighting always matches the main page. Seeking drives the hidden `input[type=range]` inside Spotify's progress bar with a full pointer gesture so React state stays consistent. Spotify's hashed CSS class names are never used; only stable `data-testid`s, so it survives Spotify UI updates.

脚本把 Spotify 自己的跟读文本容器克隆进 `documentPictureInPicture` 画中画窗口，之后只同步 Spotify 自己维护的"已读"行 class（不重新渲染），所以高亮永远和主页面一致。进度跳转通过驱动 Spotify 进度条内部隐藏的 `input[type=range]` 实现，并模拟完整的手势事件保证 React 状态一致。全程只用稳定的 `data-testid` 选择器，不用 Spotify 的混淆 class，Spotify 改版后大概率依然可用。

このブックマークレットはSpotifyの読み合わせコンテナをPiPウィンドウにクローンし、Spotify自身が管理する既読クラスを同期します。シークはプログレスバー内の隠し`input[type=range]`をドライブします。安定した`data-testid`のみを使用し、難読化されたクラス名には依存しません。

## Files / 文件 / ファイル

- [`bookmarklet.txt`](bookmarklet.txt) — the one-line bookmarklet (paste into a bookmark URL)
  一行版书签脚本（粘贴进书签 URL 用）
- [`spotify-read-along-pip.js`](spotify-read-along-pip.js) — readable source with comments
  可读源码（带注释），想自己改样式的看这个

---

License: MIT. Use at your own risk — Spotify's DOM changes over time; if it breaks, check for an updated version or open an issue.
MIT 许可。Spotify 页面结构会变化导致脚本失效，届时请检查更新版本或提 issue。
