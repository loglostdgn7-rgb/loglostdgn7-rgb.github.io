// index.js

// ===== 유틸 =====
const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const debounce = (fn, d = 200) => {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), d); };
};

// ===== 헤더/푸터 보조 =====
(function footerYear() {
  const yearEl = qs('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

// ===== 히어로 단어 티커 =====
(function wordTicker() {
  const words = [
    '현실적인,',
    '도전적인',
    '사용자지향의',
    '지속가능한',
    '성능최적화된',
  ];
  const ticker = qs('#wordTicker');
  if (!ticker) return;

  // 초기 DOM 구성
  const makeItem = (w) => {
    const span = document.createElement('span');
    span.className = 'ticker-item';
    span.textContent = w;
    span.style.display = 'block';
    return span;
  };

  const frag = document.createDocumentFragment();
  words.forEach(w => frag.appendChild(makeItem(w)));
  // 무한 루프를 위한 첫 요소 복제
  frag.appendChild(makeItem(words[0]));
  ticker.appendChild(frag);

  let index = 0;
  const step = () => {
    index++;
    ticker.style.transform = `translateY(-${index}em)`;
    // 마지막(복제) 도달 시 즉시 초기화
    if (index === words.length) {
      setTimeout(() => {
        ticker.style.transition = 'none';
        index = 0;
        ticker.style.transform = 'translateY(0)';
        // 리플로우 강제 후 다시 트랜지션 활성화
        void ticker.offsetHeight;
        ticker.style.transition = '';
      }, 620);
    }
  };

  // 접근성: 고정 높이를 글꼴 크기 기준으로 보장
  ticker.style.lineHeight = '1.1';
  ticker.style.transition = 'transform .6s cubic-bezier(.2,.6,.2,1)';
  // 주기적 전환
  const id = setInterval(step, 2200);
  // 정리
  window.addEventListener('pagehide', () => clearInterval(id));
})();

// ===== 히어로 배경 캔버스(인터랙티브 컨스텔레이션) =====
(function heroCanvas() {
  const canvas = qs('#hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0;

  const opts = {
    count: 90,
    speed: 0.3,
    linkDist: 110,
    linkAlpha: 0.18,
    dotSize: [1.2, 2.2],
    hueA: 205, // 파란
    hueB: 165, // 민트
  };

  const state = {
    pts: [],
    mouse: { x: 0, y: 0, active: false },
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    w = Math.floor(rect.width);
    h = Math.floor(rect.height);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const initPoints = () => {
    const count = Math.floor(opts.count * (w * h) / (1280 * 720));
    state.pts = Array.from({ length: clamp(count, 50, 140) }, () => ({
      x: rand(0, w),
      y: rand(0, h),
      vx: rand(-opts.speed, opts.speed),
      vy: rand(-opts.speed, opts.speed),
      r: rand(opts.dotSize[0], opts.dotSize[1]),
    }));
  };

  const step = () => {
    ctx.clearRect(0, 0, w, h);

    // 그라디언트 글로우
    const g = ctx.createRadialGradient(w * 0.5, h * 0.7, 0, w * 0.5, h * 0.7, Math.max(w, h));
    g.addColorStop(0, `rgba(110, 250, 204, .07)`);
    g.addColorStop(1, `rgba(0, 0, 0, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const { x: mx, y: my, active } = state.mouse;

    // 점 이동
    for (const p of state.pts) {
      p.x += p.vx; p.y += p.vy;

      // 마우스 반발
      if (active) {
        const dx = p.x - mx, dy = p.y - my;
        const dist2 = dx * dx + dy * dy;
        const rad = 120; // 영향 반경
        if (dist2 < rad * rad) {
          const d = Math.sqrt(dist2) || 1;
          const ux = dx / d, uy = dy / d;
          const force = (1 - d / rad) * 0.9;
          p.vx += ux * force * 0.3;
          p.vy += uy * force * 0.3;
        }
      }

      // 벽 반사
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      // 점
      ctx.beginPath();
      ctx.fillStyle = `hsla(${rand(opts.hueA, opts.hueB)}, 85%, 70%, .9)`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 연결선
    ctx.lineWidth = 1;
    for (let i = 0; i < state.pts.length; i++) {
      for (let j = i + 1; j < state.pts.length; j++) {
        const a = state.pts[i], b = state.pts[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        const dist = Math.sqrt(d2);
        if (dist < opts.linkDist) {
          const alpha = opts.linkAlpha * (1 - dist / opts.linkDist);
          ctx.strokeStyle = `rgba(142, 193, 255, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    req = requestAnimationFrame(step);
  };

  const onMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    state.mouse.x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    state.mouse.y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    state.mouse.active = true;
  };
  const onLeave = () => { state.mouse.active = false; };

  let req = 0;
  const start = () => {
    resize();
    initPoints();
    cancelAnimationFrame(req);
    req = requestAnimationFrame(step);
  };

  start();
  window.addEventListener('resize', debounce(() => { dpr = Math.min(window.devicePixelRatio || 1, 2); start(); }, 150));
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('touchmove', onMove, { passive: true });
  canvas.addEventListener('mouseleave', onLeave);
  canvas.addEventListener('touchend', onLeave);

  // 감소된 모션 환경에서 애니메이션 정지
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener?.('change', () => { if (mq.matches) cancelAnimationFrame(req); else start(); });
  if (mq.matches) cancelAnimationFrame(req);
})();

// ===== 스크롤 인디케이터 클릭 시 다음 섹션으로 =====
(function heroScrollButton() {
  const btn = qs('.scroll-indicator');
  const about = qs('#about');
  if (!btn || !about) return;
  btn.addEventListener('click', () => about.scrollIntoView({ behavior: 'smooth', block: 'start' }));
})();

// ===== 스킬 아이콘 무작위 예쁜 배치(동심원 + 랜덤 각도) =====
(function skillCloud() {
  const el = qs('#skillCloud');
  if (!el) return;

  // Devicon CDN 아이콘 (필요에 맞게 추가/수정 가능)
  const skills = [
    { name: 'TypeScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
    { name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
    { name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
    { name: 'Next.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg' },
    { name: 'Node.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg' },
    { name: 'Express', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg' },
    { name: 'NestJS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nestjs/nestjs-plain.svg' },
    { name: 'GraphQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg' },
    { name: 'PostgreSQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
    { name: 'MongoDB', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg' },
    { name: 'Redis', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg' },
    { name: 'Docker', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
    { name: 'Kubernetes', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg' },
    { name: 'AWS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg' },
    { name: 'Git', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg' },
    { name: 'Tailwind CSS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg' },
    { name: 'Sass', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sass/sass-original.svg' },
    { name: 'Jest', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jest/jest-plain.svg' },
    { name: 'Cypress', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cypressio/cypressio-original.svg' },
    { name: 'Webpack', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/webpack/webpack-original.svg' },
    { name: 'Vite', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg' },
  ];

  // 폴백: 데이터 URL로 텍스트 배지 생성
  const fallbackDataUrl = (text) => {
    const svg = encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>
        <rect width='100%' height='100%' rx='12' ry='12' fill='rgba(255,255,255,0.04)'/>
        <text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='#e6edf3'>${text.slice(0,6)}</text>
      </svg>`
    );
    return `data:image/svg+xml;charset=utf-8,${svg}`;
  };

  const render = () => {
    el.innerHTML = '';
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // 원형 레이아웃: 바깥에서 안쪽으로 3~4개 링, 각 링에 랜덤 각도 배치
    const total = skills.length;
    const rings = rect.width < 520 ? 3 : 4;
    const radiusBase = Math.min(rect.width, rect.height) * 0.38;
    const ringGap = clamp(radiusBase / rings, 60, 110);

    let idx = 0;
    for (let r = 0; r < rings; r++) {
      const radius = radiusBase - r * ringGap;
      const countInRing = Math.ceil((total - idx) / (rings - r));
      const jitter = (Math.random() * 360) | 0; // 각도 랜덤 시드

      for (let i = 0; i < countInRing && idx < total; i++, idx++) {
        const angle = ((i / countInRing) * 360 + jitter + Math.random() * 14 - 7) * (Math.PI / 180);
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius * (rect.height > rect.width ? 0.86 : 1); // 세로형에서 살짝 눌러서 겹침 방지

        const item = document.createElement('div');
        item.className = 'skill reveal';
        item.style.left = `${x}px`;
        item.style.top = `${y}px`;
        item.dataset.skill = skills[idx].name;

        const img = document.createElement('img');
        img.alt = `${skills[idx].name} 아이콘`;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.src = skills[idx].icon;
        img.onerror = () => { img.src = fallbackDataUrl(skills[idx].name); };

        item.appendChild(img);
        el.appendChild(item);
      }
    }
    // 접근성 대체 텍스트 업데이트
    const ul = qs('#skillListFallback');
    if (ul) {
      ul.innerHTML = skills.map(s => `<li>${s.name}</li>`).join('');
    }

    // 등장 애니메이션 관찰자 재연결
    setupReveals();
  };

  render();
  window.addEventListener('resize', debounce(render, 150));
})();

// ===== 포트폴리오: 프로젝트별 스와이퍼 초기화 =====
(function initSwipers() {
  const swipers = qsa('.project-swiper');
  swipers.forEach((el, i) => {
    // 개별 페이징/네비게이션 요소를 카드 내부에서 찾음
    const pagination = el.querySelector('.swiper-pagination');
    const prevEl = el.querySelector('.swiper-button-prev');
    const nextEl = el.querySelector('.swiper-button-next');

    // eslint-disable-next-line no-undef
    new Swiper(el, {
      loop: true,
      speed: 500,
      spaceBetween: 10,
      slidesPerView: 1,
      autoHeight: true,
      centeredSlides: true,
      pagination: { el: pagination, clickable: true },
      navigation: { prevEl, nextEl },
      keyboard: { enabled: true },
      watchOverflow: true,
      nested: true, // 중첩 스와이퍼 간 제스처 충돌 방지
    });
  });
})();

// ===== 섹션 스크롤 리빌 =====
function setupReveals() {
  const targets = qsa('.reveal:not(.visible), .section:not(.hero-initialized)');
  if (!targets.length) return;

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(el => io.observe(el));
}
// 초기 대상 마킹
qsa('.section').forEach(s => s.classList.add('reveal'));
setupReveals();
qs('#hero')?.classList.remove('reveal'); // 히어로는 항상 보이도록

// ===== 내비 링크 스무스 스크롤(고정 헤더 보정) =====
(function smoothAnchors() {
  const header = qs('.site-header');
  const headerH = () => (header ? header.getBoundingClientRect().height : 0);
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href') || '';
      if (id.length < 2) return;
      const target = qs(id);
      if (!target) return;

      e.preventDefault();
      const top = window.scrollY + target.getBoundingClientRect().top - headerH() - 6;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();