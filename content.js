(() => {
  const HIDE_CLASS = 'soop-ctrl-hidden';
  const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  let ctrlHidden = false; // 이 페이지에서의 플레이바 숨김 상태 (일반/전체화면 공통)

  const isTyping = (el) =>
    !!el &&
    (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

  // ---------- Ctrl+I: 하단 플레이바 + 상단 정보 토글 ----------
  const applyCtrl = () => {
    document.documentElement.classList.toggle(HIDE_CLASS, ctrlHidden);
  };

  // ---------- < > : 재생 속도 ----------
  const getVideo = () => {
    const main = document.querySelector('#video');
    if (main && main.offsetWidth) return main;
    const vids = [...document.querySelectorAll('video')].filter(
      (v) => v.offsetWidth && getComputedStyle(v).display !== 'none'
    );
    vids.sort((a, b) => b.offsetWidth * b.offsetHeight - a.offsetWidth * a.offsetHeight);
    return vids[0] || null;
  };

  let toast = null;
  let toastTimer = 0;
  const showToast = (video, text) => {
    const host =
      video.closest('#player') ||
      document.fullscreenElement ||
      video.parentElement;
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'soop-ext-speed-toast';
    }
    if (toast.parentElement !== host) host.appendChild(toast);
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 800);
  };

  const changeSpeed = (dir) => {
    const video = getVideo();
    if (!video || !isFinite(video.duration)) return false; // 라이브 방송은 제외
    const cur = video.playbackRate;
    let next;
    if (dir > 0) next = SPEEDS.find((s) => s > cur + 1e-3) ?? SPEEDS[SPEEDS.length - 1];
    else next = [...SPEEDS].reverse().find((s) => s < cur - 1e-3) ?? SPEEDS[0];
    video.playbackRate = next;
    showToast(video, `${next}x`);
    return true;
  };

  // ---------- Ctrl+←/→: 1분, Shift+←/→: 5분 이동 ----------
  const seekBy = (sec) => {
    const video = getVideo();
    if (!video || !isFinite(video.duration)) return false; // 라이브 방송은 제외
    const target = Math.min(Math.max(video.currentTime + sec, 0), video.duration - 0.5);
    video.currentTime = target;
    const m = Math.abs(sec) / 60;
    showToast(video, `${sec < 0 ? '◀◀ ' : ''}${m}분${sec > 0 ? ' ▶▶' : ''}`);
    return true;
  };

  // ---------- 키 처리 ----------
  window.addEventListener(
    'keydown',
    (e) => {
      if (isTyping(e.target)) return;

      // Ctrl+I
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey &&
          (e.code === 'KeyI' || e.key.toLowerCase() === 'i')) {
        if (!document.querySelector('.player_ctrlBox')) return; // 플레이어가 없는 페이지는 무시
        e.preventDefault();
        e.stopImmediatePropagation();
        ctrlHidden = !ctrlHidden;
        applyCtrl();
        return;
      }

      // Ctrl+←/→ (1분), Shift+←/→ (5분)
      if ((e.code === 'ArrowLeft' || e.code === 'ArrowRight') && !e.altKey && !e.metaKey &&
          (e.ctrlKey !== e.shiftKey)) {
        const sign = e.code === 'ArrowLeft' ? -1 : 1;
        if (seekBy(sign * (e.ctrlKey ? 60 : 300))) {
          e.preventDefault();
          e.stopImmediatePropagation(); // SOOP 기본 10초 이동 막기
        }
        return;
      }

      // < (Shift+,) / > (Shift+.)
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      let dir = 0;
      if (e.key === '>' || (e.shiftKey && e.code === 'Period')) dir = 1;
      else if (e.key === '<' || (e.shiftKey && e.code === 'Comma')) dir = -1;
      if (!dir) return;
      if (changeSpeed(dir)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true
  );
})();
