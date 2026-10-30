const canvas = document.querySelector(".universe");
const context = canvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointer = { x: 0, y: 0 };
let width = 0;
let height = 0;
let frame = 0;

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function drawUniverse() {
  frame += reducedMotion ? 0 : 0.003;
  context.clearRect(0, 0, width, height);
  const isMobile = width < 640;
  const centerX = width * (isMobile ? 0.62 : 0.73) + pointer.x * 17;
  const centerY = height * 0.46 + pointer.y * 13;
  const radius = Math.min(width * (isMobile ? 0.32 : 0.23), 290);
  const scroll = Math.min(window.scrollY / Math.max(height, 1), 4);
  const rotation = frame + scroll * 0.23 + pointer.x * 0.16;
  const stars = isMobile ? 78 : 150;

  for (let i = 0; i < stars; i += 1) {
    const seedX = ((i * 193.37) % 997) / 997;
    const seedY = ((i * 317.11) % 991) / 991;
    const x = seedX * width;
    const y = (seedY * height - scroll * (14 + (i % 7) * 5) + height * 3) % height;
    const twinkle = 0.23 + ((Math.sin(frame * 2 + i * 7) + 1) / 2) * 0.48;
    context.globalAlpha = twinkle;
    context.fillStyle = i % 13 === 0 ? "#d3ff67" : "#f0eee8";
    context.beginPath();
    context.arc(x, y, i % 17 === 0 ? 1.35 : 0.65, 0, Math.PI * 2);
    context.fill();
  }

  context.globalAlpha = 1;
  const points = [];
  const rings = 13;
  const segments = 31;
  for (let ring = 0; ring < rings; ring += 1) {
    const latitude = (ring / (rings - 1) - 0.5) * Math.PI;
    for (let segment = 0; segment < segments; segment += 1) {
      const longitude = (segment / segments) * Math.PI * 2 + rotation;
      const x = Math.cos(latitude) * Math.cos(longitude);
      const y = Math.sin(latitude);
      const z = Math.cos(latitude) * Math.sin(longitude);
      const tilt = 0.34;
      const tiltedY = y * Math.cos(tilt) - z * Math.sin(tilt);
      const tiltedZ = y * Math.sin(tilt) + z * Math.cos(tilt);
      const perspective = 1 / (1.7 - tiltedZ * 0.45);
      points.push({
        x: centerX + x * radius * perspective,
        y: centerY + tiltedY * radius * perspective,
        depth: tiltedZ,
      });
    }
  }

  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    const nextInRing = points[i + 1];
    const nextAcrossRing = points[i + segments];
    if (i % segments !== segments - 1) drawWire(point, nextInRing, "rgba(255,117,80,.36)");
    if (nextAcrossRing) drawWire(point, nextAcrossRing, "rgba(211,255,103,.17)");
    context.globalAlpha = 0.2 + ((point.depth + 1) / 2) * 0.63;
    context.fillStyle = point.depth > 0.48 ? "#d3ff67" : "#ff7654";
    context.beginPath();
    context.arc(point.x, point.y, point.depth > 0.5 ? 1.35 : 0.8, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
  if (!reducedMotion) requestAnimationFrame(drawUniverse);
}

function drawWire(start, end, color) {
  if (start.depth < -0.5 || end.depth < -0.5) return;
  context.globalAlpha = Math.min(0.7, 0.15 + (start.depth + end.depth + 2) * 0.12);
  context.strokeStyle = color;
  context.lineWidth = 0.55;
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
}

resizeCanvas();
drawUniverse();
window.addEventListener("resize", resizeCanvas, { passive: true });
window.addEventListener("pointermove", (event) => {
  pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
  pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
}, { passive: true });

const progress = document.querySelector(".scroll-progress span");
let scrollQueued = false;
window.addEventListener("scroll", () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0}%`;
    scrollQueued = false;
  });
}, { passive: true });

const revealElements = [...document.querySelectorAll(".reveal")];
let revealQueued = false;
function revealOnScroll() {
  const revealThreshold = window.innerHeight * 0.88;
  for (const element of revealElements) {
    if (element.getBoundingClientRect().top <= revealThreshold) {
      element.classList.add("is-visible");
    }
  }
  revealQueued = false;
}
function queueRevealCheck() {
  if (revealQueued) return;
  revealQueued = true;
  requestAnimationFrame(revealOnScroll);
}
window.addEventListener("scroll", queueRevealCheck, { passive: true });
window.addEventListener("resize", queueRevealCheck, { passive: true });
revealOnScroll();

const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");
menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  navigation.classList.toggle("is-open", !isOpen);
});
navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    navigation.classList.remove("is-open");
  });
});

if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reducedMotion) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${y * -5}deg) rotateY(${x * 5}deg) translateY(-3px)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}
