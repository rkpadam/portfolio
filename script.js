(function () {
  const canvas = document.querySelector("#brickCanvas");
  const wrap = document.querySelector(".canvas-wrap");
  const playAgain = document.querySelector("#playAgain");

  if (!canvas || !wrap || !playAgain) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const grid = { cols: 24, rows: 16 };
  const robotBlueprint = [
    { key: "head", x: 9, y: 5, w: 6, h: 2, color: "#1f73d1" },
    { key: "neck", x: 11, y: 7, w: 2, h: 1, color: "#f8fbff" },
    { key: "shoulders", x: 7, y: 8, w: 10, h: 1, color: "#ffcf24" },
    { key: "torso-left", x: 8, y: 9, w: 3, h: 2, color: "#18a957" },
    { key: "torso-right", x: 13, y: 9, w: 3, h: 2, color: "#18a957" },
    { key: "waist", x: 9, y: 11, w: 6, h: 1, color: "#1f73d1" },
    { key: "left-arm-top", x: 5, y: 9, w: 2, h: 2, color: "#e23d28" },
    { key: "left-arm-low", x: 4, y: 11, w: 2, h: 2, color: "#ffcf24" },
    { key: "right-arm-top", x: 17, y: 9, w: 2, h: 2, color: "#e23d28" },
    { key: "right-arm-low", x: 18, y: 11, w: 2, h: 2, color: "#ffcf24" },
    { key: "left-leg", x: 9, y: 12, w: 2, h: 3, color: "#e23d28" },
    { key: "right-leg", x: 13, y: 12, w: 2, h: 3, color: "#ffcf24" }
  ];
  const buildBlueprint = [
    {
      key: "chest",
      x: 11,
      y: 10,
      w: 2,
      h: 1,
      color: "#e23d28",
      stage: { x: 18.4, y: 7.4 },
      start: { x: 25.5, y: 6.1 }
    },
    {
      key: "left-hand",
      x: 3,
      y: 13,
      w: 2,
      h: 1,
      color: "#f8fbff",
      stage: { x: 3.1, y: 8.7 },
      start: { x: -3.2, y: 7.8 }
    },
    {
      key: "right-hand",
      x: 19,
      y: 13,
      w: 2,
      h: 1,
      color: "#f8fbff",
      stage: { x: 18.7, y: 10.6 },
      start: { x: 25.1, y: 10.9 }
    },
    {
      key: "left-foot",
      x: 8,
      y: 15,
      w: 3,
      h: 1,
      color: "#18a957",
      stage: { x: 3.2, y: 12.6 },
      start: { x: -4.1, y: 13.6 }
    },
    {
      key: "right-foot",
      x: 13,
      y: 15,
      w: 3,
      h: 1,
      color: "#1f73d1",
      stage: { x: 17.7, y: 13.6 },
      start: { x: 25.2, y: 14.1 }
    },
    {
      key: "antenna-left",
      x: 10,
      y: 4,
      w: 1,
      h: 1,
      color: "#ffcf24",
      stage: { x: 18.8, y: 6.2 },
      start: { x: 25.2, y: 3.9 }
    },
    {
      key: "antenna-right",
      x: 13,
      y: 4,
      w: 1,
      h: 1,
      color: "#ffcf24",
      stage: { x: 3.8, y: 6.2 },
      start: { x: -2.8, y: 4.2 }
    }
  ];

  let rafId = 0;
  let lastTime = performance.now();
  let cell = 24;
  let board = { x: 0, y: 0, w: 0, h: 0 };
  let complete = false;
  let phase = "arriving";
  let phaseProgress = 0;
  let activeIndex = 0;
  let pulse = 0;
  let basePieces = [];
  let buildPieces = [];

  function resetRobot() {
    complete = false;
    phase = "arriving";
    phaseProgress = 0;
    activeIndex = 0;
    pulse = 0;
    basePieces = robotBlueprint.map((piece, index) => ({
      ...piece,
      drop: -10 - index * 0.8 - Math.random() * 8,
      bob: Math.random() * Math.PI * 2,
      pulse: 0
    }));
    buildPieces = buildBlueprint.map((piece) => ({ ...piece, pulse: 0, placed: false }));
  }

  function resizeCanvas() {
    const rect = wrap.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    calculateBoard(rect.width, rect.height);
  }

  function calculateBoard(width, height) {
    const padding = Math.max(18, Math.min(width, height) * 0.055);
    cell = Math.min((width - padding * 2) / grid.cols, (height - padding * 2) / grid.rows);
    board.w = cell * grid.cols;
    board.h = cell * grid.rows;
    board.x = (width - board.w) / 2;
    board.y = (height - board.h) / 2;
  }

  function gridToCanvas(x, y) {
    return {
      x: board.x + x * cell,
      y: board.y + y * cell
    };
  }

  function rectFor(piece) {
    const point = gridToCanvas(piece.x, piece.y);
    return {
      x: point.x,
      y: point.y,
      w: piece.w * cell,
      h: piece.h * cell
    };
  }

  function activePiece() {
    return buildPieces[activeIndex] || null;
  }

  function currentActivePiece(now = performance.now()) {
    const piece = activePiece();
    if (!piece) {
      return null;
    }

    if (phase === "arriving") {
      const t = easeOutBack(phaseProgress);
      return {
        ...piece,
        x: piece.start.x + (piece.stage.x - piece.start.x) * t,
        y: piece.start.y + (piece.stage.y - piece.start.y) * t
      };
    }

    if (phase === "placing") {
      const t = easeOutCubic(phaseProgress);
      return {
        ...piece,
        x: piece.stage.x + (piece.x - piece.stage.x) * t,
        y: piece.stage.y + (piece.y - piece.stage.y) * t
      };
    }

    return {
      ...piece,
      x: piece.stage.x,
      y: piece.stage.y + Math.sin(now / 260 + activeIndex) * 0.08
    };
  }

  function easeOutBack(value) {
    const t = Math.max(0, Math.min(1, value));
    const c1 = 1.35;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - Math.max(0, Math.min(1, value)), 3);
  }

  function inflatedRect(rect, amount) {
    return {
      x: rect.x - amount,
      y: rect.y - amount,
      w: rect.w + amount * 2,
      h: rect.h + amount * 2
    };
  }

  function roundRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function pointInRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  function placeActivePiece() {
    if (complete || phase !== "waiting") {
      return;
    }
    phase = "placing";
    phaseProgress = 0;
    pulse = 1;
  }

  function onPointerDown(event) {
    if (complete || phase !== "waiting") {
      pulse = 1;
      return;
    }
    const point = pointerPosition(event);
    const current = currentActivePiece();
    if (!current) {
      return;
    }
    const activeRect = inflatedRect(rectFor(current), Math.max(12, cell * 0.4));
    const targetRect = inflatedRect(rectFor(activePiece()), Math.max(8, cell * 0.25));
    if (pointInRect(point, activeRect) || pointInRect(point, targetRect)) {
      event.preventDefault();
      placeActivePiece();
      return;
    }
    pulse = 1;
  }

  function drawBackground(width, height) {
    ctx.clearRect(0, 0, width, height);
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#eef6ff");
    grad.addColorStop(0.55, "#fff8d9");
    grad.addColorStop(1, "#ecf8ef");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    roundRect(board.x, board.y, board.w, board.h, 18);
    ctx.fillStyle = "rgba(255, 255, 255, 0.64)";
    ctx.fill();
    ctx.strokeStyle = "rgba(7, 30, 58, 0.13)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = "rgba(7, 30, 58, 0.055)";
    for (let y = 0; y < grid.rows; y += 1) {
      for (let x = 0; x < grid.cols; x += 1) {
        const p = gridToCanvas(x + 0.5, y + 0.5);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1.1, cell * 0.075), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawSlots(now) {
    ctx.save();
    buildPieces.forEach((piece, index) => {
      if (piece.placed) {
        return;
      }
      const rect = rectFor(piece);
      const active = index === activeIndex && !complete;
      const glow = active ? 0.46 + Math.sin(now / 230) * 0.18 + pulse * 0.28 : 0.18;
      roundRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4, Math.min(9, cell * 0.22));
      ctx.fillStyle = active ? "rgba(255, 207, 36, 0.18)" : "rgba(7, 30, 58, 0.045)";
      ctx.fill();
      ctx.setLineDash([Math.max(5, cell * 0.28), Math.max(4, cell * 0.18)]);
      ctx.lineDashOffset = active ? -now / 90 : 0;
      ctx.strokeStyle = active ? `rgba(226, 61, 40, ${glow})` : "rgba(7, 30, 58, 0.16)";
      ctx.lineWidth = Math.max(1.5, active ? cell * 0.09 : cell * 0.06);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawBrick(piece, options = {}) {
    const position = gridToCanvas(piece.x, piece.y);
    const scale = options.pulse ? 1 + options.pulse * 0.05 : 1;
    const drop = options.drop || 0;
    const bob = options.bob || 0;
    const w = piece.w * cell * scale;
    const h = piece.h * cell * scale;
    const x = position.x + piece.w * cell * (1 - scale) * 0.5;
    const y = position.y + drop * cell + bob + piece.h * cell * (1 - scale) * 0.5;
    const radius = Math.min(8, cell * 0.18);

    ctx.save();
    ctx.shadowColor = options.glow ? "rgba(201, 134, 43, 0.46)" : "rgba(7, 30, 58, 0.24)";
    ctx.shadowBlur = options.glow ? 26 : 14;
    ctx.shadowOffsetY = 9;
    roundRect(x, y, w, h, radius);
    ctx.fillStyle = piece.color;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "#071e3a";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(0, 0, 0, 0.13)";
    ctx.fillRect(x + 2, y + h - Math.max(5, cell * 0.2), w - 4, Math.max(3, cell * 0.12));

    const cols = Math.max(1, Math.round(piece.w));
    const rows = Math.max(1, Math.round(piece.h));
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const studX = x + (col + 0.5) * (w / cols);
        const studY = y + (row + 0.32) * (h / rows);
        const studR = Math.max(3.2, Math.min(10, Math.min(w / cols, h / rows) * 0.18));
        ctx.beginPath();
        ctx.arc(studX, studY, studR, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.34)";
        ctx.fill();
        ctx.strokeStyle = "rgba(7, 30, 58, 0.22)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawRobot() {
    basePieces.forEach((piece) => {
      drawBrick(piece, {
        drop: piece.drop,
        bob: Math.sin(piece.bob) * 0.8,
        pulse: piece.pulse
      });
    });

    buildPieces.forEach((piece) => {
      if (!piece.placed) {
        return;
      }
      drawBrick(piece, {
        glow: piece.pulse > 0.1 || complete,
        pulse: piece.pulse
      });
    });

    const current = !complete ? currentActivePiece() : null;
    if (current) {
      drawMotionTrail(current);
      drawBrick(current, {
        glow: true,
        pulse: phase === "waiting" ? 0.36 + pulse * 0.45 : pulse,
        bob: phase === "waiting" ? Math.sin(performance.now() / 220) * 1.8 : 0
      });
    }
    drawFace();
  }

  function drawFace() {
    const head = basePieces.find((piece) => piece.key === "head");
    if (!head) {
      return;
    }
    const rect = rectFor(head);
    const y = rect.y + head.drop * cell + Math.sin(head.bob) * 0.8;
    const eyeY = y + rect.h * 0.42;
    const leftEyeX = rect.x + rect.w * 0.36;
    const rightEyeX = rect.x + rect.w * 0.64;
    const eyeR = Math.max(2.6, cell * 0.1);

    ctx.save();
    ctx.fillStyle = "#071e3a";
    ctx.beginPath();
    ctx.arc(leftEyeX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.arc(rightEyeX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = Math.max(2, cell * 0.08);
    ctx.strokeStyle = "#071e3a";
    ctx.lineCap = "round";
    ctx.beginPath();
    if (complete) {
      ctx.arc(rect.x + rect.w * 0.5, y + rect.h * 0.58, rect.w * 0.16, 0.1 * Math.PI, 0.9 * Math.PI);
    } else {
      ctx.moveTo(rect.x + rect.w * 0.42, y + rect.h * 0.68);
      ctx.lineTo(rect.x + rect.w * 0.58, y + rect.h * 0.68);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawBubble() {
    const text = complete ? "Thank you! Play again?" : bubbleText();
    const bubbleW = Math.min(board.w - 34, complete ? 230 : 340);
    const bubbleH = 56;
    const bubbleX = Math.max(board.x + 14, board.x + board.w * 0.5 - bubbleW / 2);
    const bubbleY = board.y + 14;
    const active = currentActivePiece();
    const activeRect = active ? rectFor(active) : null;

    ctx.save();
    ctx.shadowColor = "rgba(7, 30, 58, 0.18)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 14);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "#071e3a";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#071e3a";
    ctx.font = `850 ${Math.max(12, Math.min(15, cell * 0.44))}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    wrapText(text, bubbleX + bubbleW / 2, bubbleY + bubbleH / 2, bubbleW - 30, Math.max(15, cell * 0.5));

    if (!complete && activeRect) {
      const startX = activeRect.x < bubbleX + bubbleW / 2 ? bubbleX + 52 : bubbleX + bubbleW - 52;
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = "rgba(226, 61, 40, 0.72)";
      ctx.lineWidth = Math.max(2, cell * 0.09);
      ctx.beginPath();
      ctx.moveTo(startX, bubbleY + bubbleH);
      ctx.quadraticCurveTo(
        activeRect.x + activeRect.w * 0.5,
        activeRect.y - cell * 0.8,
        activeRect.x + activeRect.w * 0.5,
        activeRect.y - 4
      );
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#e23d28";
      ctx.beginPath();
      ctx.moveTo(activeRect.x + activeRect.w * 0.5, activeRect.y - 2);
      ctx.lineTo(activeRect.x + activeRect.w * 0.34, activeRect.y - cell * 0.42);
      ctx.lineTo(activeRect.x + activeRect.w * 0.66, activeRect.y - cell * 0.38);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function bubbleText() {
    if (phase === "arriving") {
      return activeIndex === 0 ? "The blocks are coming. Click each one!" : "Here comes the next block!";
    }
    if (phase === "placing") {
      return "Nice! Keep going.";
    }
    return activeIndex === 0 ? "Click the block to complete me!" : "Click the next block!";
  }

  function wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    lines.push(line);
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((item, index) => {
      ctx.fillText(item, x, startY + index * lineHeight);
    });
  }

  function drawConfetti(now) {
    if (!complete) {
      return;
    }
    const origin = gridToCanvas(12, 4);
    const palette = ["#e23d28", "#ffcf24", "#1f73d1", "#18a957"];
    ctx.save();
    for (let i = 0; i < 18; i += 1) {
      const angle = i * 0.9;
      const spread = Math.sin(now / 360 + i) * cell * 0.35;
      const x = origin.x + Math.cos(angle) * cell * (2.4 + (i % 3) * 0.5) + spread;
      const y = origin.y + Math.sin(angle) * cell * (1.5 + (i % 4) * 0.25) - cell * 0.7;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + now / 900);
      ctx.fillStyle = palette[i % palette.length];
      ctx.fillRect(-cell * 0.11, -cell * 0.05, cell * 0.22, cell * 0.1);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawMotionTrail(piece) {
    if (phase !== "arriving") {
      return;
    }
    const rect = rectFor(piece);
    const pieceDef = activePiece();
    const direction = pieceDef && pieceDef.start.x > pieceDef.stage.x ? 1 : -1;
    ctx.save();
    ctx.strokeStyle = "rgba(201, 134, 43, 0.42)";
    ctx.lineWidth = Math.max(2, cell * 0.08);
    ctx.lineCap = "round";
    for (let i = 0; i < 3; i += 1) {
      const y = rect.y + rect.h * (0.32 + i * 0.18);
      const x1 = rect.x + (direction > 0 ? rect.w + cell * (0.25 + i * 0.16) : -cell * (0.25 + i * 0.16));
      const x2 = x1 + direction * cell * (0.65 + i * 0.16);
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawProgressPips() {
    const count = buildPieces.length;
    const gap = Math.max(12, cell * 0.52);
    const radius = Math.max(3.5, cell * 0.13);
    const startX = board.x + board.w * 0.5 - ((count - 1) * gap) / 2;
    const y = board.y + board.h - Math.max(15, cell * 0.55);

    ctx.save();
    for (let i = 0; i < count; i += 1) {
      const done = buildPieces[i].placed;
      const active = i === activeIndex && !complete;
      ctx.beginPath();
      ctx.arc(startX + i * gap, y, active ? radius * 1.22 : radius, 0, Math.PI * 2);
      ctx.fillStyle = done ? "#c9862b" : active ? "#e23d28" : "rgba(7, 30, 58, 0.18)";
      ctx.fill();
      if (active) {
        ctx.strokeStyle = "rgba(226, 61, 40, 0.3)";
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function tick(now) {
    const delta = Math.min(32, now - lastTime) / 16.67;
    lastTime = now;

    if (phase === "arriving") {
      phaseProgress = Math.min(1, phaseProgress + 0.032 * delta);
      if (phaseProgress >= 1) {
        phase = "waiting";
        phaseProgress = 0;
        pulse = 1;
      }
    }

    if (phase === "placing") {
      phaseProgress = Math.min(1, phaseProgress + 0.07 * delta);
      if (phaseProgress >= 1) {
        const justPlaced = activePiece();
        if (justPlaced) {
          justPlaced.placed = true;
          justPlaced.pulse = 1;
        }
        if (activeIndex >= buildPieces.length - 1) {
          complete = true;
          phase = "complete";
          pulse = 1;
        } else {
          activeIndex += 1;
          phase = "arriving";
          phaseProgress = 0;
          pulse = 1;
        }
      }
    }

    pulse = Math.max(0, pulse - 0.04 * delta);
    basePieces.forEach((piece) => {
      piece.drop += (0 - piece.drop) * Math.min(1, 0.14 * delta);
      piece.bob += 0.02 * delta;
      piece.pulse = Math.max(0, piece.pulse - 0.055 * delta);
    });
    buildPieces.forEach((piece) => {
      piece.pulse = Math.max(0, piece.pulse - 0.055 * delta);
    });

    const rect = canvas.getBoundingClientRect();
    drawBackground(rect.width, rect.height);
    drawSlots(now);
    drawRobot();
    drawBubble();
    drawProgressPips();
    drawConfetti(now);
    rafId = requestAnimationFrame(tick);
  }

  function init() {
    resetRobot();
    resizeCanvas();
    canvas.addEventListener("pointerdown", onPointerDown);
    playAgain.addEventListener("click", resetRobot);
    window.addEventListener("resize", resizeCanvas);
    if ("ResizeObserver" in window) {
      new ResizeObserver(resizeCanvas).observe(wrap);
    }
    rafId = requestAnimationFrame(tick);
  }

  window.addEventListener("beforeunload", () => cancelAnimationFrame(rafId));
  init();
})();

(function () {
  const canvas = document.querySelector("#brickCanvas");
  const wrap = document.querySelector(".canvas-wrap");
  const count = document.querySelector("#brickCount");
  const autoButton = document.querySelector("#autoBuild");
  const shuffleButton = document.querySelector("#shuffleBuild");
  const clearButton = document.querySelector("#clearBuild");
  const swatches = Array.from(document.querySelectorAll(".swatch"));
  const sizeButtons = Array.from(document.querySelectorAll(".brick-control[data-size]"));

  if (!canvas || !wrap || !count || !autoButton || !shuffleButton || !clearButton) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const grid = { cols: 26, rows: 16 };
  const sizes = {
    "2x1": { w: 2, h: 1 },
    "3x1": { w: 3, h: 1 },
    "4x2": { w: 4, h: 2 }
  };
  const robot = [
    { x: 11, y: 2, w: 1, h: 1, color: "#ffcf24" },
    { x: 14, y: 2, w: 1, h: 1, color: "#ffcf24" },
    { x: 10, y: 3, w: 6, h: 2, color: "#1f73d1", face: true },
    { x: 12, y: 5, w: 2, h: 1, color: "#f8fbff" },
    { x: 8, y: 6, w: 10, h: 1, color: "#ffcf24" },
    { x: 9, y: 7, w: 3, h: 2, color: "#18a957" },
    { x: 12, y: 8, w: 2, h: 1, color: "#e23d28" },
    { x: 14, y: 7, w: 3, h: 2, color: "#18a957" },
    { x: 10, y: 9, w: 6, h: 1, color: "#1f73d1" },
    { x: 6, y: 7, w: 2, h: 2, color: "#e23d28" },
    { x: 5, y: 9, w: 2, h: 2, color: "#ffcf24" },
    { x: 4, y: 11, w: 2, h: 1, color: "#f8fbff" },
    { x: 18, y: 7, w: 2, h: 2, color: "#e23d28" },
    { x: 19, y: 9, w: 2, h: 2, color: "#ffcf24" },
    { x: 20, y: 11, w: 2, h: 1, color: "#f8fbff" },
    { x: 10, y: 10, w: 2, h: 3, color: "#e23d28" },
    { x: 9, y: 13, w: 3, h: 1, color: "#18a957" },
    { x: 14, y: 10, w: 2, h: 3, color: "#ffcf24" },
    { x: 14, y: 13, w: 3, h: 1, color: "#1f73d1" }
  ];

  let rafId = 0;
  let cell = 20;
  let board = { x: 0, y: 0, w: 0, h: 0 };
  let activeColor = "#e23d28";
  let activeSize = sizes["2x1"];
  let bricks = [];
  let dragging = null;
  let lastTime = performance.now();
  let introBubble = true;

  function resizeCanvas() {
    const rect = wrap.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    calculateBoard(rect.width, rect.height);
  }

  function calculateBoard(width, height) {
    const padding = Math.max(16, Math.min(width, height) * 0.08);
    cell = Math.min((width - padding * 2) / grid.cols, (height - padding * 2) / grid.rows);
    board.w = cell * grid.cols;
    board.h = cell * grid.rows;
    board.x = (width - board.w) / 2;
    board.y = (height - board.h) / 2;
  }

  function roundRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function makeBrick(piece, index = 0, falling = false) {
    return {
      x: piece.x,
      y: falling ? piece.y - 8 - index * 0.3 : piece.y,
      tx: piece.x,
      ty: piece.y,
      w: piece.w,
      h: piece.h,
      color: piece.color,
      face: Boolean(piece.face),
      pulse: falling ? 1 : 0
    };
  }

  function autoBuild(showBubble = false) {
    bricks = robot.map((piece, index) => makeBrick(piece, index, true));
    introBubble = showBubble;
    updateCount();
  }

  function shuffleBuild() {
    introBubble = false;
    if (!bricks.length) {
      autoBuild();
      return;
    }
    bricks = bricks.map((brick) => {
      const x = Math.floor(Math.random() * Math.max(1, grid.cols - brick.w));
      const y = Math.floor(Math.random() * Math.max(1, grid.rows - brick.h));
      return { ...brick, tx: x, ty: y, face: false, pulse: 1 };
    });
    updateCount();
  }

  function clearBuild() {
    bricks = [];
    dragging = null;
    introBubble = true;
    updateCount();
  }

  function updateCount() {
    count.textContent = `${bricks.length} ${bricks.length === 1 ? "brick" : "bricks"}`;
  }

  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function canvasToGrid(point, brick = activeSize) {
    const x = Math.round((point.x - board.x) / cell - brick.w / 2);
    const y = Math.round((point.y - board.y) / cell - brick.h / 2);
    return {
      x: clamp(x, 0, grid.cols - brick.w),
      y: clamp(y, 0, grid.rows - brick.h)
    };
  }

  function brickRect(brick) {
    return {
      x: board.x + brick.x * cell,
      y: board.y + brick.y * cell,
      w: brick.w * cell,
      h: brick.h * cell
    };
  }

  function hitBrick(point) {
    for (let i = bricks.length - 1; i >= 0; i -= 1) {
      const rect = brickRect(bricks[i]);
      if (point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h) {
        return { brick: bricks[i], index: i };
      }
    }
    return null;
  }

  function addBrick(point) {
    const position = canvasToGrid(point);
    bricks.push({
      x: position.x,
      y: position.y - 3,
      tx: position.x,
      ty: position.y,
      w: activeSize.w,
      h: activeSize.h,
      color: activeColor,
      face: false,
      pulse: 1
    });
    updateCount();
  }

  function onPointerDown(event) {
    const point = pointFromEvent(event);
    if (point.x < board.x || point.x > board.x + board.w || point.y < board.y || point.y > board.y + board.h) {
      return;
    }

    const hit = hitBrick(point);
    if (hit) {
      event.preventDefault();
      introBubble = false;
      const rect = brickRect(hit.brick);
      dragging = {
        brick: hit.brick,
        offsetX: point.x - rect.x,
        offsetY: point.y - rect.y
      };
      hit.brick.pulse = 0.55;
      canvas.setPointerCapture(event.pointerId);
      return;
    }

    event.preventDefault();
    introBubble = false;
    addBrick(point);
  }

  function onPointerMove(event) {
    if (!dragging) {
      return;
    }
    const point = pointFromEvent(event);
    dragging.brick.x = (point.x - dragging.offsetX - board.x) / cell;
    dragging.brick.y = (point.y - dragging.offsetY - board.y) / cell;
    dragging.brick.tx = dragging.brick.x;
    dragging.brick.ty = dragging.brick.y;
  }

  function onPointerUp(event) {
    if (!dragging) {
      return;
    }
    const brick = dragging.brick;
    brick.tx = clamp(Math.round(brick.x), 0, grid.cols - brick.w);
    brick.ty = clamp(Math.round(brick.y), 0, grid.rows - brick.h);
    brick.pulse = 0.85;
    dragging = null;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  function selectColor(button) {
    activeColor = button.dataset.color || activeColor;
    swatches.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
  }

  function selectSize(button) {
    activeSize = sizes[button.dataset.size] || activeSize;
    sizeButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
  }

  function drawBackground(width, height) {
    ctx.clearRect(0, 0, width, height);
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#eef6ff");
    grad.addColorStop(0.55, "#fff8d9");
    grad.addColorStop(1, "#ecf8ef");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    roundRect(board.x, board.y, board.w, board.h, 12);
    ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
    ctx.fill();
    ctx.strokeStyle = "rgba(7, 30, 58, 0.14)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = "rgba(7, 30, 58, 0.06)";
    for (let y = 0; y < grid.rows; y += 1) {
      for (let x = 0; x < grid.cols; x += 1) {
        ctx.beginPath();
        ctx.arc(board.x + (x + 0.5) * cell, board.y + (y + 0.5) * cell, Math.max(1, cell * 0.065), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawBrick(brick) {
    const scale = 1 + brick.pulse * 0.035;
    const x = board.x + (brick.x + brick.w * (1 - scale) * 0.5) * cell;
    const y = board.y + (brick.y + brick.h * (1 - scale) * 0.5) * cell;
    const width = brick.w * cell * scale;
    const height = brick.h * cell * scale;
    const radius = Math.min(7, cell * 0.18);

    ctx.save();
    ctx.shadowColor = "rgba(7, 30, 58, 0.24)";
    ctx.shadowBlur = 11;
    ctx.shadowOffsetY = 7;
    roundRect(x, y, width, height, radius);
    ctx.fillStyle = brick.color;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "#071e3a";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = "rgba(0, 0, 0, 0.13)";
    ctx.fillRect(x + 2, y + height - Math.max(4, cell * 0.16), width - 4, Math.max(3, cell * 0.1));

    const cols = Math.max(1, Math.round(brick.w));
    const rows = Math.max(1, Math.round(brick.h));
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const studX = x + (col + 0.5) * (width / cols);
        const studY = y + (row + 0.35) * (height / rows);
        const studR = Math.max(2.7, Math.min(8, Math.min(width / cols, height / rows) * 0.17));
        ctx.beginPath();
        ctx.arc(studX, studY, studR, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.34)";
        ctx.fill();
        ctx.strokeStyle = "rgba(7, 30, 58, 0.22)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    if (brick.face) {
      drawFace(x, y, width, height);
    }
    ctx.restore();
  }

  function drawFace(x, y, width, height) {
    const eyeY = y + height * 0.43;
    ctx.fillStyle = "#071e3a";
    ctx.beginPath();
    ctx.arc(x + width * 0.36, eyeY, Math.max(2, cell * 0.09), 0, Math.PI * 2);
    ctx.arc(x + width * 0.64, eyeY, Math.max(2, cell * 0.09), 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = Math.max(1.8, cell * 0.07);
    ctx.lineCap = "round";
    ctx.strokeStyle = "#071e3a";
    ctx.beginPath();
    ctx.arc(x + width * 0.5, y + height * 0.57, width * 0.16, 0.12 * Math.PI, 0.88 * Math.PI);
    ctx.stroke();
  }

  function drawIntroBubble(now) {
    if (!introBubble) {
      return;
    }

    const bubbleW = Math.min(board.w - cell * 2, Math.max(190, cell * 15.5));
    const bubbleH = Math.max(38, cell * 2.65);
    const bubbleX = board.x + board.w * 0.5 - bubbleW / 2;
    const bubbleY = Math.max(8, board.y - cell * 1.45);
    const tailX = board.x + board.w * 0.5;
    const tailY = board.y + cell * 3.2;
    const float = Math.sin(now / 460) * 1.4;

    ctx.save();
    ctx.translate(0, float);
    ctx.shadowColor = "rgba(7, 30, 58, 0.18)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 7;
    roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 12);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "#071e3a";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bubbleX + bubbleW * 0.52, bubbleY + bubbleH - 1);
    ctx.quadraticCurveTo(tailX - cell * 0.7, bubbleY + bubbleH + cell * 0.65, tailX, tailY);
    ctx.strokeStyle = "rgba(7, 30, 58, 0.72)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#071e3a";
    ctx.font = `850 ${Math.max(12, Math.min(15, cell * 0.95))}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    wrapBubbleText("Click the board to build with me!", bubbleX + bubbleW / 2, bubbleY + bubbleH / 2, bubbleW - 24, Math.max(15, cell * 1.05));
    ctx.restore();
  }

  function wrapBubbleText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    lines.push(line);

    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((item, index) => {
      ctx.fillText(item, x, startY + index * lineHeight);
    });
  }

  function tick(now) {
    const delta = Math.min(32, now - lastTime) / 16.67;
    lastTime = now;

    bricks.forEach((brick) => {
      if (brick !== (dragging && dragging.brick)) {
        brick.x += (brick.tx - brick.x) * Math.min(1, 0.18 * delta);
        brick.y += (brick.ty - brick.y) * Math.min(1, 0.18 * delta);
      }
      brick.pulse = Math.max(0, brick.pulse - 0.045 * delta);
    });

    const rect = canvas.getBoundingClientRect();
    drawBackground(rect.width, rect.height);
    bricks.forEach(drawBrick);
    drawIntroBubble(now);
    rafId = requestAnimationFrame(tick);
  }

  function init() {
    resizeCanvas();
    autoBuild(true);
    swatches.forEach((button) => button.addEventListener("click", () => selectColor(button)));
    sizeButtons.forEach((button) => button.addEventListener("click", () => selectSize(button)));
    autoButton.addEventListener("click", () => autoBuild(false));
    shuffleButton.addEventListener("click", shuffleBuild);
    clearButton.addEventListener("click", clearBuild);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("resize", resizeCanvas);
    if ("ResizeObserver" in window) {
      new ResizeObserver(resizeCanvas).observe(wrap);
    }
    rafId = requestAnimationFrame(tick);
  }

  window.addEventListener("beforeunload", () => cancelAnimationFrame(rafId));
  init();
})();

(function () {
  const form = document.querySelector("#contact-form");
  const status = document.querySelector("#form-status");
  const endpoint = String(window.CONTACT_ENDPOINT_URL || "");

  if (!form || !status) {
    return;
  }

  function setStatus(message, type) {
    status.textContent = message;
    status.className = type ? `form-status ${type}` : "form-status";
  }

  function endpointReady(url) {
    return url && !/PASTE|YOUR_|example/i.test(url);
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function hasSpamSignals(value) {
    const lower = value.toLowerCase();
    const linkCount = (lower.match(/https?:\/\//g) || []).length;
    return linkCount > 2 || /\b(crypto|casino|loan|viagra|seo backlink)\b/.test(lower);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const website = String(formData.get("website") || "").trim();

    if (website) {
      setStatus("Thank you.", "is-success");
      form.reset();
      return;
    }

    if (name.length < 2 || name.length > 80) {
      setStatus("Please enter your name.", "is-error");
      return;
    }

    if (!validEmail(email) || email.length > 120) {
      setStatus("Please enter a valid email address.", "is-error");
      return;
    }

    if (message.length < 2 || message.length > 3000) {
      setStatus("Please add a message.", "is-error");
      return;
    }

    if (hasSpamSignals(message)) {
      setStatus("Please simplify the message and try again.", "is-error");
      return;
    }

    if (!endpointReady(endpoint)) {
      setStatus("Please connect with me on LinkedIn for now.", "is-error");
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const originalLabel = submitButton.textContent;
    formData.set("name", name);
    formData.set("email", email);
    formData.set("message", message);
    formData.set("source", window.location.href);

    submitButton.disabled = true;
    submitButton.textContent = "Sending";
    setStatus("", "");

    try {
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        body: formData
      });

      form.reset();
      setStatus("Thanks \u2014 your note has been submitted.", "is-success");
    } catch (error) {
      console.error(error);
      setStatus("Something went wrong. Please try LinkedIn for now.", "is-error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalLabel;
    }
  });
})();
