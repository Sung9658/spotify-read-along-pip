(async () => {
  if (!("documentPictureInPicture" in window)) { alert("浏览器版本过低"); return; }
  try {
    const src = document.querySelector('[data-testid="read-along-scroll-container"]');
    if (!src) throw new Error("找不到跟读文本容器——请播放带跟读的集并打开右侧「当前播放」视图");

    const p = await window.documentPictureInPicture.requestWindow({ width: 420, height: 640 });

    // 不复制主页面样式表：播放状态下Spotify注入的规则会把PiP内容撑出固定宽度导致缩放失效
    const style = p.document.createElement("style");
    style.textContent = `
      html, body { background:#121212; color:#fff; margin:0; height:100%;
        display:flex; flex-direction:column; overflow:hidden; }
      .pip-text { flex:1; overflow-y:auto; padding:12px 14px; box-sizing:border-box;
        scroll-behavior:smooth; }
      .pip-text * { max-width:100% !important; min-width:0 !important;
        word-break:break-word; position:static !important;
        margin:0 !important; padding:0 !important; }
      .pip-text p { font-size:15px; line-height:1.9; color:#b3b3b3; }
      .pip-text button { background:none; border:none; color:#1db954; font-size:12px;
        cursor:pointer; margin:8px 0 2px !important; padding:0 !important; display:block; }
      .pip-text img, .pip-text video { display:none !important; }
      .pip-text p { opacity:.55; transition: opacity .3s, color .3s; }
      .pip-text p.read { opacity:1; color:#fff; }
      .pip-text p.read_now { color:#1ed760 !important; }
      .pip-bar { flex-shrink:0; border-top:1px solid #282828; background:#181818;
        padding:8px 10px; display:flex; align-items:center; gap:8px; }
      .pip-bar { min-width:0 !important; overflow:hidden; }
      .pip-title { flex:1 1 0; font-size:13px; color:#b3b3b3; white-space:nowrap;
        overflow:hidden; text-overflow:ellipsis; min-width:0; }
      .pip-bar button { background:none; border:1px solid #535353; color:#fff;
        border-radius:50%; width:38px; height:38px; padding:0;
        font-size:13px; cursor:pointer; flex-shrink:1; min-width:0; flex-basis:38px; }
      .pip-bar button.on { border-color:#1db954; color:#1db954; }
      .pip-bar button:hover { transform:scale(1.06); }
      .pip-progress-row { flex-shrink:0; background:#181818; padding:0 12px 6px;
        display:flex; align-items:center; gap:6px; font-size:11px; color:#b3b3b3;
        min-width:0; overflow:hidden; }
      .pip-progress { flex:1 1 0; min-width:0; height:14px; display:flex; align-items:center; cursor:pointer; }
      .pip-progress-track { width:100%; height:4px; background:#4d4d4d; border-radius:2px;
        position:relative; overflow:hidden; }
      .pip-progress-fill { position:absolute; left:0; top:0; bottom:0; width:0%;
        background:#1db954; border-radius:2px; pointer-events:none; }
    `;
    p.document.head.appendChild(style);

    const textWrap = p.document.createElement("div");
    textWrap.className = "pip-text";
    p.document.body.appendChild(textWrap);

    // ===== 控制条 =====
    const realClick = el => {
      if (!el) throw new Error("主窗口找不到控件");
      const r = el.getBoundingClientRect();
      const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      const base = { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy, button: 0 };
      el.dispatchEvent(new PointerEvent("pointerdown", base));
      el.dispatchEvent(new MouseEvent("mousedown", base));
      el.focus?.();
      el.dispatchEvent(new PointerEvent("pointerup", base));
      el.dispatchEvent(new MouseEvent("mouseup", base));
      el.dispatchEvent(new MouseEvent("click", base));
    };
    const doBtn = sel => () => {
      try { realClick(document.querySelector(sel)); }
      catch (err) { alert("按钮失败: " + err.message); }
    };
    const mkBtn = (label, sel, tip) => {
      const b = p.document.createElement("button");
      b.textContent = label; b.title = tip || label;
      if (sel) b.onclick = doBtn(sel);
      return b;
    };
    const title = p.document.createElement("div");
    title.className = "pip-title";
    const bar = p.document.createElement("div");
    bar.className = "pip-bar";
    const btnRew  = mkBtn("«15", '[data-testid="control-button-seek-back-15"]', "后退15秒");
    const btnPlay = mkBtn("▶",  '[data-testid="control-button-playpause"]', "播放/暂停");
    const btnFwd  = mkBtn("15»", '[data-testid="control-button-seek-forward-15"]', "快进15秒");
    let follow = true;
    const btnFollow = mkBtn("⇅", null, "开/关自动跟随");
    btnFollow.classList.add("on");
    btnFollow.onclick = () => { follow = !follow; btnFollow.classList.toggle("on", follow); };
    let manualHold = 0;
    textWrap.addEventListener("wheel", () => { manualHold = Date.now() + 6000; }, { passive: true });
    const btnPrev = mkBtn("⏮",  '[data-testid="control-button-skip-back"]', "上一首");
    const btnNext = mkBtn("⏭",  '[data-testid="control-button-skip-forward"]', "下一首");
    bar.append(btnRew, btnPlay, btnFwd, btnPrev, btnNext, btnFollow, title);
    p.document.body.appendChild(bar);

    // ===== 进度条（在控制条上方/下方，点击跳转）=====
    const pRow = p.document.createElement("div");
    pRow.className = "pip-progress-row";
    const tCur = p.document.createElement("span"); tCur.textContent = "0:00"; tCur.style.flexShrink = "0";
    const prog = p.document.createElement("div"); prog.className = "pip-progress";
    const track = p.document.createElement("div"); track.className = "pip-progress-track";
    const fill = p.document.createElement("div"); fill.className = "pip-progress-fill";
    track.appendChild(fill); prog.appendChild(track);
    const tDur = p.document.createElement("span"); tDur.textContent = "-:--";
    pRow.append(tCur, prog, tDur);
    p.document.body.appendChild(pRow);

    const toSec = s => { const [m, x] = s.split(":").map(Number); return (m||0)*60 + (x||0); };
    const fmt = v => Math.floor(v/60) + ":" + String(Math.floor(v%60)).padStart(2, "0");
    // 点击/拖动进度条 → 主窗口跳转
    // Spotify进度条是role=slider的自定义控件，监听完整pointer拖动序列
    let dragging = false;
    const seekTo = ratio => {
      // Spotify进度条内藏真正的 <input type="range">（单位毫秒，React受控）
      const range = document.querySelector('[data-testid="playback-progressbar"] input[type="range"]');
      if (!range) { alert("找不到进度条input"); return; }
      const max = Number(range.max) || 0;
      if (!max) return;
      // React受控input必须用native setter
      // 先发pointerdown，让Spotify状态机进入标准交互流
      const pbPre = document.querySelector('[data-testid="progress-bar"]') || range;
      const rrPre = pbPre.getBoundingClientRect();
      const pre = { bubbles: true, cancelable: true, view: window, clientX: rrPre.left + rrPre.width * ratio, clientY: rrPre.top + rrPre.height / 2, button: 0, pointerId: 1, isPrimary: true, pointerType: "mouse" };
      range.dispatchEvent(new PointerEvent("pointerdown", pre));
      range.dispatchEvent(new MouseEvent("mousedown", pre));
      const proto = Object.getPrototypeOf(range);
      const desc = Object.getOwnPropertyDescriptor(proto, "value");
      desc.set.call(range, Math.round(ratio * max));
      range.dispatchEvent(new Event("input", { bubbles: true }));
      range.dispatchEvent(new Event("change", { bubbles: true }));
      // 结束Spotify的scrubbing状态：补发释放事件，防止之后hover/move被当作持续拖动
      const pb = document.querySelector('[data-testid="progress-bar"]') || range.closest('[data-testid="playback-progressbar"]');
      const rr = pb ? pb.getBoundingClientRect() : range.getBoundingClientRect();
      const rel = { bubbles: true, cancelable: true, view: window, clientX: rr.left + rr.width * ratio, clientY: rr.top + rr.height / 2, button: 0, pointerId: 1, isPrimary: true, pointerType: "mouse" };
      range.dispatchEvent(new PointerEvent("pointerup", rel));
      range.dispatchEvent(new MouseEvent("mouseup", rel));
      range.dispatchEvent(new PointerEvent("pointerleave", rel));
      range.dispatchEvent(new MouseEvent("mouseleave", rel));
      range.blur?.();
    };
    prog.addEventListener("pointerdown", ev => {
      ev.stopPropagation();
      dragging = true;
      const rect = prog.getBoundingClientRect();
      seekTo(Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width)));
    });
    // 拖动：在小窗进度条上按住移动时实时seek
    prog.addEventListener("pointermove", ev => {
      if (!dragging) return;
      const rect = prog.getBoundingClientRect();
      seekTo(Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width)));
    });
    window.addEventListener("pointerup", () => { dragging = false; });

    const syncTitle = () => {
      const el = document.querySelector('[data-testid="context-item-link"]');
      if (el) title.textContent = el.textContent;
      const pp = document.querySelector('[data-testid="control-button-playpause"]');
      if (pp) btnPlay.textContent = /暂停|一時停止|Pause/i.test(pp.getAttribute("aria-label") || "") ? "❚❚" : "▶";
      const cur = document.querySelector('[data-testid="playback-position"]');
      const dur = document.querySelector('[data-testid="playback-duration"]');
      if (cur) tCur.textContent = cur.textContent;
      if (dur) tDur.textContent = dur.textContent;
      const c = cur ? toSec(cur.textContent) : 0, d = dur ? toSec(dur.textContent) : 0;
      fill.style.width = (d ? Math.min(100, c / d * 100) : 0) + "%";
    };
    syncTitle();

    // ===== 核心同步：不重建DOM，只同步class =====
    const markRead = () => {
      // 主窗口与 小窗的行一一对应（行数一致时），只搬class
      const srcPs = src.querySelectorAll("p");
      const dstPs = textWrap.querySelectorAll("p");
      if (srcPs.length !== dstPs.length) return false;  // 行数不匹配→需要重建
      textWrap.querySelectorAll("p.read_now").forEach(x => x.classList.remove("read_now"));
      let lastReadIdx = -1;
      for (let i = 0; i < srcPs.length; i++) {
        const isRead = /VLqgd/.test(srcPs[i].parentElement?.className || "");
        dstPs[i].classList.toggle("read", isRead);
        if (isRead) lastReadIdx = i;
      }
      // 当前句 = 最后已读行的下一行（正在读的那句）
      const curIdx = lastReadIdx + 1 < dstPs.length ? lastReadIdx + 1 : lastReadIdx;
      if (curIdx >= 0) dstPs[curIdx].classList.add("read_now");
      return curIdx;
    };

    let inited = false;
    let lastKey = "";
    const timer = setInterval(() => {
      try {
        if (!inited || !markRead()) {
          // 首次 或 行数变了（换集/懒加载变化）→ 全量重建
          textWrap.innerHTML = src.innerHTML;
          inited = (markRead() !== false);
          lastKey = "";
        }
        syncTitle();

        if (!follow || Date.now() < manualHold) return;
        const cur = textWrap.querySelector("p.read_now");
        if (cur) {
          const key = cur.textContent;
          if (key !== lastKey) {
            lastKey = key;
            cur.scrollIntoView({ block: "center" });
          }
        }
      } catch (_) {}
    }, 400);
    p.addEventListener("pagehide", () => clearInterval(timer));
  } catch (err) {
    alert("小窗脚本报错:\n" + err.message);
  }
})();
