const uiChangeExitDurationMs = 150;
const uiChangeEnterDurationMs = 220;
const languageDustScatterDurationMs = 380;
const languageDustAssembleDurationMs = 900;
const languageDustFallbackDurationMs = 2400;
const maxLanguageDustGlyphs = 1100;
let isUiChangeInProgress = false;

type DustGlyph = {
  value: string;
  x: number;
  top: number;
  baseline: number;
  width: number;
  height: number;
  font: string;
  fontSize: number;
  color: string;
  clipLeft: number;
  clipTop: number;
  clipRight: number;
  clipBottom: number;
};

type DustParticle = {
  glyphIndex: number;
  color: string;
  size: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  wobble: number;
  clipLeft: number;
  clipTop: number;
  clipRight: number;
  clipBottom: number;
};

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function easeOutCubic(value: number) {
  return 1 - ((1 - value) ** 3);
}

function smoothStep(value: number) {
  const progress = clamp(value);
  return progress * progress * (3 - (2 * progress));
}

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function getElementClipRect(element: HTMLElement, viewportWidth: number, viewportHeight: number) {
  let clipLeft = 0;
  let clipTop = 0;
  let clipRight = viewportWidth;
  let clipBottom = viewportHeight;
  let currentElement: HTMLElement | null = element;

  while (currentElement && currentElement !== document.body) {
    const style = getComputedStyle(currentElement);
    const rect = currentElement.getBoundingClientRect();
    const clipsHorizontally = /^(auto|clip|hidden|scroll)$/.test(style.overflowX);
    const clipsVertically = /^(auto|clip|hidden|scroll)$/.test(style.overflowY);

    if (clipsHorizontally) {
      clipLeft = Math.max(clipLeft, rect.left);
      clipRight = Math.min(clipRight, rect.right);
    }

    if (clipsVertically) {
      clipTop = Math.max(clipTop, rect.top);
      clipBottom = Math.min(clipBottom, rect.bottom);
    }

    currentElement = currentElement.parentElement;
  }

  return { clipLeft, clipTop, clipRight, clipBottom };
}

function collectVisibleGlyphs(container: HTMLElement) {
  const glyphs: DustGlyph[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let currentNode = walker.nextNode();

  while (currentNode && glyphs.length < maxLanguageDustGlyphs) {
    const textNode = currentNode as Text;
    const parent = textNode.parentElement;
    const text = textNode.textContent ?? "";

    if (
      parent
      && text.trim()
      && !parent.closest("script, style, noscript, canvas, svg, [aria-hidden='true']")
    ) {
      const style = getComputedStyle(parent);
      const opacity = Number.parseFloat(style.opacity);

      if (
        style.display !== "none"
        && style.visibility !== "hidden"
        && opacity > 0.02
        && style.color !== "transparent"
        && !style.color.endsWith(", 0)")
      ) {
        const fontSize = Number.parseFloat(style.fontSize) || 16;
        const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const clipRect = getElementClipRect(parent, viewportWidth, viewportHeight);
        const range = document.createRange();
        let offset = 0;

        for (const value of Array.from(text)) {
          const nextOffset = offset + value.length;

          if (value.trim()) {
            range.setStart(textNode, offset);
            range.setEnd(textNode, nextOffset);
            const rect = range.getBoundingClientRect();
            const visibleWidth = Math.max(0, Math.min(rect.right, clipRect.clipRight) - Math.max(rect.left, clipRect.clipLeft));
            const visibleHeight = Math.max(0, Math.min(rect.bottom, clipRect.clipBottom) - Math.max(rect.top, clipRect.clipTop));

            if (
              rect.width > 0
              && rect.height > 0
              && visibleWidth > 0
              && visibleHeight > 0
              && rect.right > 0
              && rect.left < viewportWidth
              && rect.bottom > 0
              && rect.top < viewportHeight
            ) {
              glyphs.push({
                value,
                x: rect.left,
                top: rect.top,
                baseline: rect.top + ((rect.height - fontSize) / 2) + (fontSize * 0.82),
                width: rect.width,
                height: rect.height,
                font,
                fontSize,
                color: style.color,
                ...clipRect
              });
            }
          }

          offset = nextOffset;

          if (glyphs.length >= maxLanguageDustGlyphs) {
            break;
          }
        }

        range.detach();
      }
    }

    currentNode = walker.nextNode();
  }

  return glyphs.sort((left, right) => {
    const leftLine = Math.round(left.top / 6);
    const rightLine = Math.round(right.top / 6);

    return leftLine === rightLine ? left.x - right.x : left.top - right.top;
  });
}

function createDustParticles(glyphs: DustGlyph[], direction: "out" | "in") {
  const particles: DustParticle[] = [];
  const particlesPerGlyph = glyphs.length > 760 ? 2 : 4;

  glyphs.forEach((glyph, glyphIndex) => {
    for (let particleIndex = 0; particleIndex < particlesPerGlyph; particleIndex += 1) {
      const seed = (glyphIndex + 1) * 17.17 + particleIndex * 31.31;
      const angle = pseudoRandom(seed) * Math.PI * 2;
      const distance = 18 + pseudoRandom(seed + 4.2) * 42;
      const targetX = glyph.x + (pseudoRandom(seed + 8.1) * Math.max(glyph.width, glyph.fontSize * 0.42));
      const targetY = glyph.top + (pseudoRandom(seed + 12.7) * glyph.height);
      const cloudX = clamp(targetX + Math.cos(angle) * distance, glyph.clipLeft, glyph.clipRight);
      const cloudY = clamp(targetY + Math.sin(angle) * distance, glyph.clipTop, glyph.clipBottom);

      particles.push({
        glyphIndex,
        color: glyph.color,
        size: 0.8 + pseudoRandom(seed + 16.4) * 1.9,
        fromX: direction === "out" ? targetX : cloudX,
        fromY: direction === "out" ? targetY : cloudY,
        toX: direction === "out" ? cloudX : targetX,
        toY: direction === "out" ? cloudY : targetY,
        wobble: (pseudoRandom(seed + 20.9) - 0.5) * 10,
        clipLeft: glyph.clipLeft,
        clipTop: glyph.clipTop,
        clipRight: glyph.clipRight,
        clipBottom: glyph.clipBottom
      });
    }
  });

  return particles;
}

function drawGlyph(
  context: CanvasRenderingContext2D,
  glyph: DustGlyph,
  opacity: number,
  offsetX = 0,
  offsetY = 0
) {
  if (opacity <= 0) {
    return;
  }

  context.globalAlpha = clamp(opacity);
  context.fillStyle = glyph.color;
  context.font = glyph.font;
  context.textBaseline = "alphabetic";
  context.save();
  context.beginPath();
  context.rect(
    glyph.clipLeft,
    glyph.clipTop,
    Math.max(0, glyph.clipRight - glyph.clipLeft),
    Math.max(0, glyph.clipBottom - glyph.clipTop)
  );
  context.clip();
  context.fillText(glyph.value, glyph.x + offsetX, glyph.baseline + offsetY);
  context.restore();
}

function drawDustParticle(
  context: CanvasRenderingContext2D,
  particle: DustParticle,
  progress: number,
  opacity: number
) {
  if (opacity <= 0) {
    return;
  }

  const easedProgress = easeOutCubic(progress);
  const x = clamp(
    particle.fromX + ((particle.toX - particle.fromX) * easedProgress),
    particle.clipLeft,
    particle.clipRight - particle.size
  );
  const y = clamp(
    particle.fromY
    + ((particle.toY - particle.fromY) * easedProgress)
    + (Math.sin(progress * Math.PI) * particle.wobble),
    particle.clipTop,
    particle.clipBottom - particle.size
  );

  context.globalAlpha = clamp(opacity);
  context.fillStyle = particle.color;
  context.fillRect(x, y, particle.size, particle.size);
}

function prepareDustCanvas() {
  const canvas = document.createElement("canvas");
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  canvas.className = "language-dust-canvas";
  canvas.setAttribute("aria-hidden", "true");
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.scale(pixelRatio, pixelRatio);
  return { canvas, context, width, height };
}

export function runUiChangeTransition(updateUi: () => void): void {
  if (
    isUiChangeInProgress
    || window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    if (!isUiChangeInProgress) {
      updateUi();
    }
    return;
  }

  isUiChangeInProgress = true;
  const root = document.documentElement;
  root.style.setProperty("--ui-change-background", getComputedStyle(document.body).backgroundColor);
  root.classList.remove("ui-change--entering");
  root.classList.add("ui-change--leaving");

  window.setTimeout(() => {
    updateUi();

    window.setTimeout(() => {
      root.classList.remove("ui-change--leaving");
      root.classList.add("ui-change--entering");

      window.setTimeout(() => {
        root.classList.remove("ui-change--entering");
        root.style.removeProperty("--ui-change-background");
        isUiChangeInProgress = false;
      }, uiChangeEnterDurationMs);
    }, 0);
  }, uiChangeExitDurationMs);
}

export function runLanguageDustTransition(updateUi: () => void): void {
  if (
    isUiChangeInProgress
    || document.hidden
    || window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    if (!isUiChangeInProgress) {
      updateUi();
    }
    return;
  }

  const appRoot = document.querySelector<HTMLElement>("#root");
  const pageRoot = document.documentElement;
  const body = document.body;

  if (!appRoot || !body) {
    updateUi();
    return;
  }

  const previousOverflow = body.style.overflow;
  const previousPaddingRight = body.style.paddingRight;
  const scrollbarWidth = window.innerWidth - pageRoot.clientWidth;
  const bodyPaddingRight = Number.parseFloat(getComputedStyle(body).paddingRight) || 0;

  body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${bodyPaddingRight + scrollbarWidth}px`;
  }

  const oldGlyphs = collectVisibleGlyphs(appRoot);
  const dustCanvas = prepareDustCanvas();

  if (oldGlyphs.length === 0 || !dustCanvas) {
    body.style.overflow = previousOverflow;
    body.style.paddingRight = previousPaddingRight;
    runUiChangeTransition(updateUi);
    return;
  }

  isUiChangeInProgress = true;
  const { canvas, context, width, height } = dustCanvas;
  const oldParticles = createDustParticles(oldGlyphs, "out");
  let newGlyphs: DustGlyph[] = [];
  let newParticles: DustParticle[] = [];
  let phase: "scatter" | "assemble" = "scatter";
  let phaseStartedAt = performance.now();
  let animationFrameId = 0;
  let swapTimerId = 0;
  let hasUpdatedLanguage = false;
  let hasFinished = false;

  const applyLanguage = () => {
    if (hasUpdatedLanguage) {
      return;
    }

    hasUpdatedLanguage = true;
    updateUi();
  };

  const cleanup = () => {
    if (hasFinished) {
      return;
    }

    hasFinished = true;
    window.cancelAnimationFrame(animationFrameId);
    window.clearTimeout(swapTimerId);
    window.clearTimeout(fallbackTimerId);
    pageRoot.classList.remove("language-dust--active");
    canvas.remove();
    body.style.overflow = previousOverflow;
    body.style.paddingRight = previousPaddingRight;
    isUiChangeInProgress = false;
  };

  const drawScatter = (progress: number) => {
    context.clearRect(0, 0, width, height);
    const glyphOpacity = 1 - (progress ** 2.2);

    oldGlyphs.forEach((glyph, index) => {
      drawGlyph(
        context,
        glyph,
        glyphOpacity,
        Math.sin(index * 1.71) * progress * 4,
        -progress * (3 + pseudoRandom(index + 5) * 6)
      );
    });

    const particleProgress = clamp((progress - 0.06) / 0.94);
    const particleOpacity = Math.sin(particleProgress * Math.PI) * (1 - particleProgress * 0.32);
    oldParticles.forEach((particle) => {
      drawDustParticle(context, particle, particleProgress, particleOpacity);
    });
  };

  const drawAssemble = (progress: number) => {
    context.clearRect(0, 0, width, height);
    const glyphCount = Math.max(newGlyphs.length - 1, 1);

    newGlyphs.forEach((glyph, index) => {
      const delay = (index / glyphCount) * 0.6;
      const localProgress = clamp((progress - delay) / (1 - delay));
      const glyphProgress = smoothStep((localProgress - 0.34) / 0.66);
      const jitter = 1 - glyphProgress;

      drawGlyph(
        context,
        glyph,
        glyphProgress,
        (pseudoRandom(index + 41) - 0.5) * 14 * jitter,
        (pseudoRandom(index + 73) - 0.5) * 10 * jitter
      );
    });

    newParticles.forEach((particle) => {
      const delay = (particle.glyphIndex / glyphCount) * 0.6;
      const localProgress = clamp((progress - delay) / (1 - delay));
      const particleOpacity = Math.sin(localProgress * Math.PI) * (1 - localProgress * 0.22);
      drawDustParticle(context, particle, localProgress, particleOpacity);
    });
  };

  const animate = (now: number) => {
    if (hasFinished) {
      return;
    }

    if (phase === "scatter") {
      const progress = clamp((now - phaseStartedAt) / languageDustScatterDurationMs);
      drawScatter(progress);

      if (progress >= 1) {
        applyLanguage();
        swapTimerId = window.setTimeout(() => {
          pageRoot.classList.remove("language-dust--active");
          newGlyphs = collectVisibleGlyphs(appRoot);
          pageRoot.classList.add("language-dust--active");

          if (newGlyphs.length === 0) {
            cleanup();
            return;
          }

          newParticles = createDustParticles(newGlyphs, "in");
          phase = "assemble";
          phaseStartedAt = performance.now();
          animationFrameId = window.requestAnimationFrame(animate);
        }, 34);
        return;
      }
    } else {
      const progress = clamp((now - phaseStartedAt) / languageDustAssembleDurationMs);
      drawAssemble(progress);

      if (progress >= 1) {
        cleanup();
        return;
      }
    }

    animationFrameId = window.requestAnimationFrame(animate);
  };

  const fallbackTimerId = window.setTimeout(() => {
    applyLanguage();
    cleanup();
  }, languageDustFallbackDurationMs);

  document.body.append(canvas);
  pageRoot.classList.add("language-dust--active");
  animationFrameId = window.requestAnimationFrame(animate);
}
