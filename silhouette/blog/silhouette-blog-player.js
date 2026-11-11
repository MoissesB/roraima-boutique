for (const player of document.querySelectorAll('.article-video-player')) {
  const overlay = player.querySelector('[data-video-preview]');
  if (!overlay) continue;

  const video = player.querySelector('[data-video-full]');
  const preview = overlay.querySelector('video');
  const start = overlay.querySelector('[data-video-start]');
  const motion = overlay.querySelector('[data-video-motion]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let inView = false;
  let manuallyPaused = false;
  let started = false;

  function updatePreview() {
    if (started) return;
    const canAnimate = !reducedMotion.matches;
    motion.hidden = !canAnimate;
    if (canAnimate && inView && !manuallyPaused) {
      if (!preview.hasAttribute('src')) preview.src = preview.dataset.src;
      preview.play().catch(() => { motion.hidden = true; });
    } else {
      preview.pause();
    }
  }

  motion.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    motion.textContent = manuallyPaused ? 'Reanudar adelanto' : 'Pausar adelanto';
    updatePreview();
  });

  start.addEventListener('click', () => {
    started = true;
    preview.pause();
    overlay.hidden = true;
    video.controls = true;
    video.muted = false;
    video.focus({ preventScroll: true });
    video.play().catch(() => {});
  });

  video.controls = false;
  overlay.hidden = false;
  reducedMotion.addEventListener('change', updatePreview);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updatePreview();
    }).observe(player);
  } else {
    inView = true;
    updatePreview();
  }
}
