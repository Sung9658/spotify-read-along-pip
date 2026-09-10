# Spotify 跟读文本画中画小窗

把 Spotify 播客的「跟读文本」放进浏览器画中画小窗：自动高亮当前句、进度条点按跳转、快进快退控制。纯书签脚本，无需任何扩展或油猴。

> 🌏 其他语言：[English](README.md) | [日本語](README.ja.md)

## 为什么用书签而不是油猴（Tampermonkey）？

书签通过浏览器账号原生同步——Edge/Chrome 登录后，书签栏自动同步到所有设备，零配置。油猴脚本同步需要手动开启 Chrome Sync 或配置 WebDAV，麻烦得多。书签也不依赖扩展本身（扩展被禁用/卸载时书签依然可用），导出书签 HTML 即可完整备份。

如果你更喜欢油猴/篡改猴等插件，完全可以把这个脚本的逻辑移植成 userscript——核心选择器和同步逻辑都是现成的，欢迎参考/复用。

## 安装

1. 打开 [`bookmarklet.txt`](bookmarklet.txt)，复制全部内容（以 `javascript:` 开头）。
2. 在浏览器中新建一个书签（随便收藏一个页面然后编辑它），把复制的内容粘贴到 **URL** 栏。
3. **注意（Edge/Chrome 的坑）：** 粘贴时浏览器可能吞掉开头的 `javascript:` 前缀。如果保存后无法使用，请编辑书签手动在开头补打 `javascript:`（英文冒号）。
4. 名字随意，比如「小窗」。

## 使用

1. 播放一集带「跟读文本（测试版）」的播客，并打开右侧「当前播放」视图让跟读文本面板可见。
2. 点击书签，会弹出一个画中画小窗，包含：
   - 跟读文本，自动跟随当前句（绿色高亮）
   - 播放控制：后退15秒 / 播放暂停 / 快进15秒 / 上一首 / 下一首
   - 进度条（点击或拖动跳转）
   - 跟随开关（⇅），手动滚动后自动暂停跟随 6 秒

关闭小窗即恢复正常，主页面不受影响。

## 兼容性

- 桌面版 Edge / Chrome / 其他支持 `documentPictureInPicture` 的 Chromium 浏览器（Chrome 116+）
- 需要登录 Spotify（跟读文本是登录态的测试版功能）

## 原理

脚本把 Spotify 自己的跟读文本容器（`[data-testid="read-along-scroll-container"]`）克隆进 `documentPictureInPicture` 画中画窗口，之后只同步 Spotify 自己维护的"已读"行 class（不重新渲染），所以高亮永远和主页面一致。进度跳转通过驱动 Spotify 进度条内部隐藏的 `input[type=range]` 实现，并模拟完整的手势事件保证 React 状态一致。全程只用稳定的 `data-testid` 选择器，不用 Spotify 的混淆 class，Spotify 改版后大概率依然可用。

## 文件

- [`bookmarklet.txt`](bookmarklet.txt) — 一行版书签脚本（粘贴进书签 URL 用）
- [`spotify-read-along-pip.js`](spotify-read-along-pip.js) — 可读源码（带注释），想自己改样式的看这个

---

MIT 许可。Spotify 页面结构会变化导致脚本失效，届时请检查更新版本或提 issue。
