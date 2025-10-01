document.documentElement.classList.add('has-js');

// 유틸리티 함수
const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));
const clamp = (n, min, max) => Math.max(min, Math.min(n));
const rand = (min, max) => Math.random() * (max - min) + min;
const debounce = (fn, d = 100) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), d); }; };

// 문서 로드 시 초기화
window.addEventListener('DOMContentLoaded', () => {
  setYear();
  setupWordRoller();
  setupHeroCanvas();
  setupSkillCloud();
  setupPortfolioSlider();
});

function setYear() {
  const el = qs('#year');
  if (el) el.textContent = new Date().getFullYear();
}

function setupWordRoller() {
  const roller = qs('.word-roller');
  if (!roller) return;
  const inner = qs('.word-roller-inner');
  const wordsAttr = roller.getAttribute('data-words') || '';
  const words = wordsAttr.split(',').map(s => s.trim()).filter(Boolean);
  if (words.length === 0) return;

  inner.innerHTML = words.map(word => `<div>${word}</div>`).join('');
  const firstWordClone = document.createElement('div');
  firstWordClone.textContent = words[0];
  inner.appendChild(firstWordClone);

  let currentIndex = 0;
  const wordCount = words.length;
  const itemHeight = inner.firstElementChild.clientHeight;

  const roll = () => {
    currentIndex++;
    inner.style.transform = `translateY(-${currentIndex * itemHeight}px)`;

    if (currentIndex >= wordCount) {
      setTimeout(() => {
        inner.style.transition = 'none';
        currentIndex = 0;
        inner.style.transform = 'translateY(0)';
        setTimeout(() => {
          inner.style.transition = 'transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
        }, 50);
      }, 500);
    }
  };
  
  setInterval(roll, 2500);
}

function setupPortfolioSlider() {
  if (typeof Swiper === 'undefined') {
    console.warn('Swiper library is not loaded.');
    return;
  }

  new Swiper('.swiper', {
    loop: true,
    slidesPerView: 'auto',
    spaceBetween: 24,
    initialSlide: 0, // 첫 번째 슬라이드부터 시작하도록 설정
    grabCursor: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    autoplay: {
      delay: 3500,
      disableOnInteraction: false,
    },
  });
}

function setupSkillCloud() {
  const container = qs('#skill-cloud');
  if (!container) return;

  const skills = [
    { name: 'HTML5', slug: 'html5', size: 80 },
    { name: 'CSS3', size: 80, renderAsText: true },
    { name: 'JavaScript', slug: 'javascript', size: 85 },
    { name: 'Java', size: 90, renderAsText: true },
    { name: 'Spring Boot', slug: 'springboot', size: 90 },
    { name: 'Spring Security', slug: 'springsecurity', size: 80 },
    { name: 'Thymeleaf', slug: 'thymeleaf', size: 75 },
    { name: 'MySQL', slug: 'mysql', size: 80 },
    { name: 'MyBatis', size: 75, renderAsText: true },
    { name: 'Git', slug: 'git', size: 80 },
    { name: 'GitHub', slug: 'github', size: 80, invert: true },
    { name: 'Docker', slug: 'docker', size: 85 },
    { name: 'Maven', slug: 'apachemaven', size: 75 },
    { name: 'Lombok', size: 70, renderAsText: true },
  ];

  let bodies = [];
  let bounds;
  let animId = null;
  let dragTarget = null;
  const pointer = { x: 0, y: 0 };
  const DAMPING = 1;

  function init() {
    bounds = container.getBoundingClientRect();
    container.innerHTML = '';
    bodies = [];

    skills.forEach(skill => {
      const el = document.createElement('div');
      el.style.width = `${skill.size}px`;
      el.style.height = `${skill.size}px`;

      if (skill.renderAsText) {
        el.className = 'skill-icon skill-icon--text';
        el.textContent = skill.name;
      } else {
        el.className = `skill-icon ${skill.invert ? 'skill-icon--inverted' : ''}`.trim();
        el.innerHTML = `<img src="https://cdn.simpleicons.org/${skill.slug}" alt="${skill.name} 로고" /><span>${skill.name}</span>`;
      }
      
      container.appendChild(el);

      const body = {
        el,
        x: rand(skill.size, bounds.width - skill.size),
        y: rand(skill.size, bounds.height - skill.size),
        vx: rand(-1, 1),
        vy: rand(-1, 1),
        r: skill.size / 2,
        mass: skill.size / 10,
        scaleX: 1,
        scaleY: 1,
      };
      bodies.push(body);
    });

    for (const body of bodies) {
      body.el.style.transform = `translate(${body.x - body.r}px, ${body.y - body.r}px)`;
    }
  }

  function update() {
    for (const body of bodies) {
      if (body === dragTarget) continue;

      body.vx *= DAMPING;
      body.vy *= DAMPING;
      body.x += body.vx;
      body.y += body.vy;

      body.scaleX += (1 - body.scaleX) * 0.2;
      body.scaleY += (1 - body.scaleY) * 0.2;

      if (body.x - body.r < 0) {
        body.x = body.r; body.vx *= -1;
        body.scaleX = 0.8; body.scaleY = 1.2;
      } else if (body.x + body.r > bounds.width) {
        body.x = bounds.width - body.r; body.vx *= -1;
        body.scaleX = 0.8; body.scaleY = 1.2;
      }

      if (body.y - body.r < 0) {
        body.y = body.r; body.vy *= -1;
        body.scaleX = 1.2; body.scaleY = 0.8;
      } else if (body.y + body.r > bounds.height) {
        body.y = bounds.height - body.r; body.vy *= -1;
        body.scaleX = 1.2; body.scaleY = 0.8;
      }
    }

    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i]; const b = bodies[j];
        const dx = b.x - a.x; const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const min_dist = a.r + b.r;

        if (dist < min_dist) {
          const angle = Math.atan2(dy, dx);
          const overlap = min_dist - dist;
          
          const ax = overlap * Math.cos(angle) * 0.5;
          const ay = overlap * Math.sin(angle) * 0.5;
          a.x -= ax; a.y -= ay;
          b.x += ax; b.y += ay;
          
          const v1 = { x: a.vx, y: a.vy }; const v2 = { x: b.vx, y: b.vy };
          const m1 = a.mass, m2 = b.mass;
          
          const new_avx = (v1.x * (m1 - m2) + 2 * m2 * v2.x) / (m1 + m2);
          const new_avy = (v1.y * (m1 - m2) + 2 * m2 * v2.y) / (m1 + m2);
          const new_bvx = (v2.x * (m2 - m1) + 2 * m1 * v1.x) / (m1 + m2);
          const new_bvy = (v2.y * (m2 - m1) + 2 * m1 * v1.y) / (m1 + m2);

          a.vx = new_avx; a.vy = new_avy;
          b.vx = new_bvx; b.vy = new_bvy;

          if (Math.abs(dx) > Math.abs(dy)) {
            a.scaleX = b.scaleX = 0.8; a.scaleY = b.scaleY = 1.2;
          } else {
            a.scaleX = b.scaleX = 1.2; a.scaleY = b.scaleY = 0.8;
          }
        }
      }
    }

    for (const body of bodies) {
      body.el.style.transform = `translate(${body.x - body.r}px, ${body.y - body.r}px) scale(${body.scaleX}, ${body.scaleY})`;
    }

    animId = requestAnimationFrame(update);
  }

  function onPointerDown(e) {
    if (!e.target.closest('.skill-icon')) return;
    const targetEl = e.target.closest('.skill-icon');
    const rect = container.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    
    dragTarget = bodies.find(body => body.el === targetEl);
    
    if (dragTarget) {
      dragTarget.vx = dragTarget.vy = 0;
      container.setPointerCapture(e.pointerId);
      container.addEventListener('pointermove', onPointerMove);
      container.addEventListener('pointerup', onPointerUp);
    }
  }

  function onPointerMove(e) {
    if (!dragTarget) return;
    const rect = container.getBoundingClientRect();
    const newX = e.clientX - rect.left;
    const newY = e.clientY - rect.top;
    dragTarget.vx = (newX - pointer.x) * 1.5;
    dragTarget.vy = (newY - pointer.y) * 1.5;
    pointer.x = newX;
    pointer.y = newY;
    dragTarget.x = clamp(pointer.x, dragTarget.r, bounds.width - dragTarget.r);
    dragTarget.y = clamp(pointer.y, dragTarget.r, bounds.height - dragTarget.r);
  }

  function onPointerUp(e) {
    dragTarget = null;
    container.releasePointerCapture(e.pointerId);
    container.removeEventListener('pointermove', onPointerMove);
    container.removeEventListener('pointerup', onPointerUp);
  }

  init();
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!animId) {
          animId = requestAnimationFrame(update);
        }
      } else {
        if (animId) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      }
    });
  }, { threshold: 0.01 });

  observer.observe(container);

  window.addEventListener('resize', debounce(init, 200));
  container.addEventListener('pointerdown', onPointerDown);
}


function setupHeroCanvas() {
  const canvas = qs('#hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  let DPR = window.devicePixelRatio || 1;
  let w = 0, h = 0;
  let stars = [];
  let animId = 0;

  const STAR_DENSITY = 0.00015;
  const LINK_DIST = 140;
  const CURSOR_BOOST = 120;
  const BG = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0b0f14';
  const FG = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#6ea8fe';

  const pointer = { x: null, y: null, active: false };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    DPR = window.devicePixelRatio || 1;
    w = rect.width * DPR;
    h = rect.height * DPR;
    canvas.width = w;
    canvas.height = h;
    initStars();
  }

  function initStars() {
    const targetCount = Math.floor(canvas.clientWidth * canvas.clientHeight * STAR_DENSITY);
    stars = Array.from({ length: targetCount }, () => ({
      x: rand(0, w),
      y: rand(0, h),
      vx: rand(-0.1, 0.1) * DPR,
      vy: rand(-0.1, 0.1) * DPR,
      r: rand(0.5, 1.8) * DPR,
      a: rand(0.4, 0.9)
    }));
  }

  function step() {
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, h * 0.7, 0, h);
    grad.addColorStop(0, BG + '00');
    grad.addColorStop(1, BG + '60');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    for (const s of stars) {
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < 0 || s.x > w) s.vx *= -1;
      if (s.y < 0 || s.y > h) s.vy *= -1;
      ctx.globalAlpha = s.a;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.lineWidth = 0.8 * DPR;
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const a = stars[i], b = stars[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        let maxDist = LINK_DIST * DPR;

        if (pointer.active && pointer.x != null && pointer.y != null) {
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const dp = Math.hypot(midX - pointer.x, midY - pointer.y);
          const boost = clamp((CURSOR_BOOST * DPR) - dp * 0.5, 0, CURSOR_BOOST * DPR);
          maxDist += boost;
        }

        if (dist < maxDist) {
          const alpha = clamp(1 - (dist / maxDist), 0.05, 0.8);
          ctx.strokeStyle = hexToRgba(FG, alpha * 0.7);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(step);
  }

  function hexToRgba(hex, alpha = 1) {
    let h = hex.replace('#', '').trim();
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
  }
  
  const onMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (e.clientX - rect.left) * DPR;
    pointer.y = (e.clientY - rect.top) * DPR;
    pointer.active = (pointer.x >= 0 && pointer.y >= 0 && pointer.x <= w && pointer.y <= h);
  };
  
  const onLeave = () => { pointer.active = false; };
  
  const onResize = debounce(resize, 100);

  resize();
  if (animId) cancelAnimationFrame(animId);
  animId = requestAnimationFrame(step);

  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
}