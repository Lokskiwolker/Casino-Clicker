import React, { useState, useRef, useMemo } from "react";

// ---- Theme: modern cash-app aesthetic ---------------------------------
const COLORS = {
  bg0: "#05070A",
  bg1: "#0B0F14",
  bg2: "#11161D",
  glass: "rgba(255,255,255,0.045)",
  glassBorder: "rgba(255,255,255,0.09)",
  green: "#00E676",
  greenSoft: "#5EEAD4",
  greenDim: "#0B3B2C",
  greenDim2: "#0E4433",
  gold: "#E3B341",
  goldDim: "#3A2E10",
  red: "#EF4444",
  black: "#18181B",
  text: "#F5F7FA",
  textDim: "rgba(245,247,250,0.55)",
};

const FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif";

// European wheel pocket order, clockwise from the top
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);
const SEGMENT_ANGLE = 360 / WHEEL_ORDER.length;

function pocketColor(n) {
  if (n === 0) return "green";
  return RED_NUMBERS.has(n) ? "red" : "black";
}
function colorHex(c) {
  if (c === "red") return COLORS.red;
  if (c === "green") return COLORS.green;
  return COLORS.black;
}
function fmt(n) {
  return Math.round(n).toLocaleString();
}
function rand(min, max) {
  return min + Math.random() * (max - min);
}

const BET_CHIPS = [10, 50, 100, 250];
const BET_TYPES = [
  { id: "red", label: "Red", bg: COLORS.red },
  { id: "black", label: "Black", bg: COLORS.black },
  { id: "green", label: "Green 0", bg: COLORS.greenDim, ring: COLORS.green },
  { id: "odd", label: "Odd", bg: "rgba(255,255,255,0.06)" },
  { id: "even", label: "Even", bg: "rgba(255,255,255,0.06)" },
];

// Market items: 'flat' items add a fixed amount per pull, 'mult' items each
// contribute a multiplier that stacks with the others.
const MARKET_ITEMS = [
  {
    id: "fingers",
    name: "Extra Fingers",
    desc: "Grip more bills with every single pull.",
    type: "flat",
    value: 1,
    baseCost: 60,
    growth: 1.55,
    icon: "\u270B",
    tier: "common",
  },
  {
    id: "gloves",
    name: "Counting Gloves",
    desc: "Practiced hands move cash noticeably faster.",
    type: "mult",
    value: 1.15,
    baseCost: 150,
    growth: 1.6,
    icon: "\u{1F9E4}",
    tier: "common",
  },
  {
    id: "counter",
    name: "Cash Counter",
    desc: "Recounts every stack for a cleaner take.",
    type: "mult",
    value: 1.35,
    baseCost: 600,
    growth: 1.65,
    icon: "\u{1F4B5}",
    tier: "common",
  },
  {
    id: "printer",
    name: "Money Printer",
    desc: "Runs quietly under the table, padding every pull.",
    type: "mult",
    value: 1.75,
    baseCost: 2500,
    growth: 1.7,
    icon: "\u{1F5A8}\uFE0F",
    tier: "uncommon",
  },
  {
    id: "golden",
    name: "Golden Touch",
    desc: "Everything you pull turns to profit. Legendary.",
    type: "mult",
    value: 2.5,
    baseCost: 12000,
    growth: 1.8,
    icon: "\u2728",
    tier: "legendary",
  },
];

function costFor(item, level) {
  return Math.round(item.baseCost * Math.pow(item.growth, level));
}

// Small bill used for the flying/pulled-away particles
function BillSmall({ style, className }) {
  return (
    <svg width="26" height="15" viewBox="0 0 26 15" style={style} className={className}>
      <rect x="0.5" y="0.5" width="25" height="14" rx="2" fill={COLORS.greenDim} stroke={COLORS.green} strokeWidth="1" />
      <circle cx="13" cy="7.5" r="3.8" fill="none" stroke={COLORS.green} strokeWidth="0.8" />
      <text x="13" y="9.8" textAnchor="middle" fontSize="5.8" fill={COLORS.green} fontWeight="700">$</text>
    </svg>
  );
}

// Larger bill used to build the resting stack
function BillLarge({ shade }) {
  const fill = shade ? COLORS.greenDim : COLORS.greenDim2;
  return (
    <svg width="112" height="64" viewBox="0 0 112 64">
      <rect x="1" y="1" width="110" height="62" rx="6" fill={fill} stroke={COLORS.green} strokeWidth="1.4" />
      <rect x="7" y="7" width="98" height="50" rx="3" fill="none" stroke={COLORS.green} strokeOpacity="0.35" strokeWidth="1" />
      <circle cx="56" cy="32" r="15" fill="none" stroke={COLORS.green} strokeOpacity="0.7" strokeWidth="1.2" />
      <text x="56" y="39" textAnchor="middle" fontSize="17" fill={COLORS.green} fontWeight="800">$</text>
      <text x="16" y="20" fontSize="8" fill={COLORS.green} fontWeight="700" opacity="0.7">$</text>
      <text x="90" y="52" fontSize="8" fill={COLORS.green} fontWeight="700" opacity="0.7">$</text>
    </svg>
  );
}

export default function LuckyTap() {
  const [screen, setScreen] = useState("tap"); // 'tap' | 'market' | 'table'
  const [balance, setBalance] = useState(250);
  const [levels, setLevels] = useState({ fingers: 0, gloves: 0, counter: 0, printer: 0, golden: 0 });
  const [comboMult, setComboMult] = useState(1);
  const [flyingBills, setFlyingBills] = useState([]);
  const [popups, setPopups] = useState([]);
  const [pulseId, setPulseId] = useState(0);
  const [grabbing, setGrabbing] = useState(false);

  const [betAmount, setBetAmount] = useState(10);
  const [betType, setBetType] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [message, setMessage] = useState("Pick a bet, then spin the wheel.");
  const [history, setHistory] = useState([]);

  const comboRef = useRef(0);
  const lastTapRef = useRef(0);
  const comboTimerRef = useRef(null);
  const grabTimerRef = useRef(null);
  const touchPointRef = useRef({ x: 0, y: 0 });

  const stake = Math.max(0, Math.min(betAmount, balance));

  // Flat bonuses add up, then every multiplier item stacks on top.
  const { baseTapValue, totalMultiplier } = useMemo(() => {
    const flatBonus = 1 + levels.fingers * 1;
    const totalMultiplier = MARKET_ITEMS.filter((i) => i.type === "mult").reduce(
      (acc, item) => acc * (1 + (item.value - 1) * levels[item.id]),
      1
    );
    return {
      baseTapValue: Math.max(1, Math.round(flatBonus * totalMultiplier)),
      totalMultiplier,
    };
  }, [levels]);

  const wheelBackground = useMemo(() => {
    const stops = WHEEL_ORDER.map((n, i) => {
      const start = (i * SEGMENT_ANGLE).toFixed(3);
      const end = ((i + 1) * SEGMENT_ANGLE).toFixed(3);
      return `${colorHex(pocketColor(n))} ${start}deg ${end}deg`;
    }).join(", ");
    return `conic-gradient(from 0deg, ${stops})`;
  }, []);

  // Pulls one bill off the stack and sends it flying away at the given angle
  function pullBill(angleDeg) {
    const id = Math.random().toString(36).slice(2);
    const finalAngle = angleDeg + rand(-14, 14);
    const rad = (finalAngle * Math.PI) / 180;
    const dist = rand(230, 330);
    const tx = Math.cos(rad) * dist;
    const ty = Math.sin(rad) * dist;
    const rot = rand(-70, 70);
    const dur = Math.round(rand(650, 950));
    setFlyingBills((b) => [...b, { id, tx, ty, rot, dur }]);
    setTimeout(() => {
      setFlyingBills((b) => b.filter((bl) => bl.id !== id));
    }, dur + 60);
  }

  function bumpGrab() {
    setGrabbing(true);
    if (grabTimerRef.current) clearTimeout(grabTimerRef.current);
    grabTimerRef.current = setTimeout(() => setGrabbing(false), 140);
  }

  function registerPull(angleDeg) {
    const now = Date.now();
    comboRef.current = now - lastTapRef.current < 350 ? comboRef.current + 1 : 1;
    lastTapRef.current = now;
    const mult = Math.min(1 + Math.floor(comboRef.current / 5), 5);
    setComboMult(mult);
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => {
      comboRef.current = 0;
      setComboMult(1);
    }, 600);

    const value = baseTapValue * mult;
    setBalance((b) => b + value);
    setPulseId((n) => n + 1);
    bumpGrab();
    pullBill(angleDeg);

    const popupId = Math.random().toString(36).slice(2) + "-p";
    setPopups((p) => [...p, { id: popupId, value }]);
    setTimeout(() => {
      setPopups((p) => p.filter((pt) => pt.id !== popupId));
    }, 700);
  }

  // Click / single tap: pull upward with a bit of natural spread
  function handleClick() {
    registerPull(rand(-125, -55));
  }
  function handleTouchStart(e) {
    e.preventDefault();
    const t = e.touches[0];
    touchPointRef.current = { x: t.clientX, y: t.clientY };
    registerPull(rand(-125, -55));
  }
  // Dragging: bills fly off in the direction of the swipe, like fanning cash out of the stack
  function handleTouchMove(e) {
    const t = e.touches[0];
    const dx = t.clientX - touchPointRef.current.x;
    const dy = t.clientY - touchPointRef.current.y;
    if (Math.hypot(dx, dy) > 16) {
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      registerPull(angleDeg);
      touchPointRef.current = { x: t.clientX, y: t.clientY };
    }
  }

  function buyItem(id) {
    const item = MARKET_ITEMS.find((i) => i.id === id);
    const level = levels[id];
    const cost = costFor(item, level);
    if (balance < cost) return;
    setBalance((b) => b - cost);
    setLevels((l) => ({ ...l, [id]: l[id] + 1 }));
  }

  function spin() {
    if (spinning) return;
    if (!betType) {
      setMessage("Pick red, black, green, odd, or even first.");
      return;
    }
    if (stake <= 0) {
      setMessage("You need cash on the table to spin.");
      return;
    }

    setSpinning(true);
    setMessage("The wheel is spinning\u2026");
    setBalance((b) => b - stake);

    const resultNumber = Math.floor(Math.random() * 37);
    const idx = WHEEL_ORDER.indexOf(resultNumber);
    const pocketAngle = idx * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const spins = 4;

    setRotation((prev) => {
      const targetMod = (360 - pocketAngle + 360) % 360;
      const deltaMod = (targetMod - (prev % 360) + 360) % 360;
      return prev + spins * 360 + deltaMod;
    });

    setTimeout(() => {
      const color = pocketColor(resultNumber);
      let multiplier = 0;
      if (betType === "red" && color === "red") multiplier = 2;
      else if (betType === "black" && color === "black") multiplier = 2;
      else if (betType === "green" && color === "green") multiplier = 36;
      else if (betType === "even" && resultNumber !== 0 && resultNumber % 2 === 0)
        multiplier = 2;
      else if (betType === "odd" && resultNumber % 2 === 1) multiplier = 2;

      const win = multiplier > 0;
      const payout = stake * multiplier;
      if (win) {
        setBalance((b) => b + payout);
        setPulseId((n) => n + 1);
      }

      setHistory((h) => [{ number: resultNumber, color, win }, ...h].slice(0, 8));
      setLastResult({ number: resultNumber, color, win, payout });
      setMessage(
        win
          ? `${resultNumber} (${color}) \u2014 you win ${fmt(payout)}!`
          : `${resultNumber} (${color}) \u2014 no match this time.`
      );
      setSpinning(false);
    }, 4200);
  }

  const readyToSpin = betType && stake > 0 && !spinning;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "24px 12px",
        background: `radial-gradient(ellipse 900px 500px at 50% -10%, rgba(0,230,118,0.09), transparent 60%), linear-gradient(180deg, ${COLORS.bg1}, ${COLORS.bg0})`,
        fontFamily: FONT,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <style>{`
        .lt-pill, .lt-upgrade-btn, .lt-buy-btn { transition: border-color 0.15s ease, background 0.15s ease, transform 0.08s ease, opacity 0.15s ease; }
        .lt-pill:active, .lt-upgrade-btn:active, .lt-buy-btn:active { transform: scale(0.96); }
        @keyframes lt-bill-fly {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) rotate(var(--rot)) scale(0.85); opacity: 0; }
        }
        .lt-bill-fly { position: absolute; left: 50%; top: 42%; animation: lt-bill-fly var(--dur) cubic-bezier(0.22,0.61,0.36,1) forwards; pointer-events: none; }
        @keyframes lt-popup-rise {
          0% { transform: translate(-50%, -50%) translateY(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) translateY(-40px); opacity: 0; }
        }
        .lt-popup { position: absolute; left: 50%; top: 6%; animation: lt-popup-rise 0.7s ease-out forwards; pointer-events: none; }
        @keyframes lt-pulse {
          0% { transform: scale(1); text-shadow: 0 0 0 rgba(0,230,118,0); }
          30% { transform: scale(1.08); text-shadow: 0 0 20px rgba(0,230,118,0.6); }
          100% { transform: scale(1); text-shadow: 0 0 0 rgba(0,230,118,0); }
        }
        .lt-balance-pulse { display: inline-block; animation: lt-pulse 0.4s ease-out; }
        @keyframes lt-glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,230,118,0.5); }
          50% { box-shadow: 0 0 0 12px rgba(0,230,118,0); }
        }
        .lt-spin-ready { animation: lt-glow-pulse 1.8s ease-in-out infinite; }
      `}</style>

      {/* Ambient background glyphs */}
      <div style={{ position: "absolute", top: 40, left: -30, fontSize: 160, color: COLORS.green, opacity: 0.035, fontWeight: 800, pointerEvents: "none" }}>$</div>
      <div style={{ position: "absolute", bottom: 20, right: -20, fontSize: 200, color: COLORS.green, opacity: 0.03, fontWeight: 800, pointerEvents: "none" }}>$</div>

      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: COLORS.glass,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: 32,
          overflow: "hidden",
          border: `1px solid ${COLORS.glassBorder}`,
          boxShadow: "0 30px 90px rgba(0,0,0,0.6)",
          position: "relative",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 22px",
            borderBottom: `1px solid ${COLORS.glassBorder}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${COLORS.green}, #00A855)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 17,
                color: "#05130C",
                boxShadow: "0 0 20px rgba(0,230,118,0.4)",
              }}
            >
              $
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, letterSpacing: "-0.01em" }}>
              Lucky Tap
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: COLORS.textDim, fontWeight: 600, letterSpacing: "0.02em" }}>
              Balance
            </div>
            <div
              key={pulseId}
              className="lt-balance-pulse"
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: COLORS.green,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              ${fmt(balance)}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "26px 20px 16px" }}>
          {screen === "tap" && (
            <TapFloor
              baseTapValue={baseTapValue}
              totalMultiplier={totalMultiplier}
              comboMult={comboMult}
              flyingBills={flyingBills}
              popups={popups}
              grabbing={grabbing}
              onTapClick={handleClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onOpenMarket={() => setScreen("market")}
            />
          )}
          {screen === "market" && (
            <Market balance={balance} levels={levels} onBuy={buyItem} />
          )}
          {screen === "table" && (
            <TableFloor
              wheelBackground={wheelBackground}
              rotation={rotation}
              spinning={spinning}
              lastResult={lastResult}
              message={message}
              betAmount={betAmount}
              setBetAmount={setBetAmount}
              betType={betType}
              setBetType={setBetType}
              balance={balance}
              stake={stake}
              onSpin={spin}
              readyToSpin={readyToSpin}
              history={history}
            />
          )}
        </div>

        {/* Nav */}
        <div style={{ display: "flex", gap: 8, padding: "12px 16px 18px" }}>
          {[
            { id: "tap", label: "Tap floor" },
            { id: "market", label: "Market" },
            { id: "table", label: "The table" },
          ].map((t) => (
            <button
              key={t.id}
              className="lt-pill"
              onClick={() => setScreen(t.id)}
              style={{
                flex: 1,
                padding: "12px 0",
                borderRadius: 999,
                border: `1px solid ${screen === t.id ? COLORS.green : COLORS.glassBorder}`,
                background: screen === t.id ? "rgba(0,230,118,0.12)" : "transparent",
                color: screen === t.id ? COLORS.green : COLORS.textDim,
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CashStack({ grabbing }) {
  // rotation per layer, bottom to top; the last entry is the top bill
  const layers = [-4, 3, -3, 4, -2, 0];
  return (
    <div style={{ position: "relative", width: 130, height: 84 }}>
      {layers.map((rot, i) => {
        const isTop = i === layers.length - 1;
        const depth = layers.length - 1 - i;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 9 + depth * 1.2,
              top: 10 - depth * 2.6,
              transform: `rotate(${rot}deg) ${isTop && grabbing ? "translateY(4px) scale(0.96)" : ""}`,
              transition: "transform 0.12s ease",
              filter: isTop ? "drop-shadow(0 8px 14px rgba(0,0,0,0.4))" : "drop-shadow(0 2px 3px rgba(0,0,0,0.25))",
            }}
          >
            <BillLarge shade={i % 2 === 0} />
          </div>
        );
      })}
    </div>
  );
}

function TapFloor({
  baseTapValue,
  totalMultiplier,
  comboMult,
  flyingBills,
  popups,
  grabbing,
  onTapClick,
  onTouchStart,
  onTouchMove,
  onOpenMarket,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ height: 26, marginBottom: 6 }}>
        {comboMult > 1 && (
          <span
            style={{
              background: "rgba(0,230,118,0.12)",
              border: `1px solid ${COLORS.green}`,
              color: COLORS.green,
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Combo x{comboMult}
          </span>
        )}
      </div>

      <div
        onClick={onTapClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        style={{
          position: "relative",
          width: 240,
          height: 190,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          userSelect: "none",
          touchAction: "none",
        }}
      >
        {/* grounding shadow */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            width: 140,
            height: 22,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(0,230,118,0.22), transparent 70%)",
            filter: "blur(2px)",
          }}
        />
        <CashStack grabbing={grabbing} />

        {flyingBills.map((b) => (
          <BillSmall
            key={b.id}
            style={{
              "--tx": `${b.tx}px`,
              "--ty": `${b.ty}px`,
              "--rot": `${b.rot}deg`,
              "--dur": `${b.dur}ms`,
            }}
            className="lt-bill-fly"
          />
        ))}
        {popups.map((p) => (
          <span
            key={p.id}
            className="lt-popup"
            style={{ color: COLORS.green, fontWeight: 800, fontSize: 16 }}
          >
            +${p.value}
          </span>
        ))}
      </div>

      <div style={{ color: COLORS.textDim, fontSize: 13, fontWeight: 600, marginTop: 4, marginBottom: 22 }}>
        Swipe the stack to pull cash
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${COLORS.glassBorder}`,
          borderRadius: 18,
          padding: "14px 16px",
        }}
      >
        <div>
          <div style={{ color: COLORS.text, fontWeight: 700, fontSize: 14 }}>
            ${baseTapValue} per pull
          </div>
          <div style={{ color: COLORS.textDim, fontSize: 12, marginTop: 2 }}>
            {totalMultiplier > 1 ? `Market boost: x${totalMultiplier.toFixed(2)}` : "No market boosts yet"}
          </div>
        </div>
        <button
          className="lt-upgrade-btn"
          onClick={onOpenMarket}
          style={{
            border: `1px solid ${COLORS.green}`,
            background: "rgba(0,230,118,0.12)",
            color: COLORS.green,
            borderRadius: 12,
            padding: "9px 14px",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Visit market
        </button>
      </div>
    </div>
  );
}

function Market({ balance, levels, onBuy }) {
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.text, letterSpacing: "-0.01em" }}>
          The market
        </div>
        <div style={{ color: COLORS.textDim, fontSize: 13, marginTop: 3 }}>
          Spend what you've earned on gear that multiplies every pull.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {MARKET_ITEMS.map((item) => {
          const level = levels[item.id];
          const cost = costFor(item, level);
          const affordable = balance >= cost;
          const legendary = item.tier === "legendary";
          const accent = legendary ? COLORS.gold : COLORS.green;
          const currentBonus =
            item.type === "flat"
              ? `+$${item.value * level} per pull`
              : `x${(1 + (item.value - 1) * level).toFixed(2)} boost`;
          const nextBonus =
            item.type === "flat" ? `+$${item.value} per level` : `x${item.value} per level`;

          return (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: legendary ? COLORS.goldDim : "rgba(255,255,255,0.03)",
                border: `1px solid ${legendary ? "rgba(227,179,65,0.35)" : COLORS.glassBorder}`,
                borderRadius: 16,
                padding: "13px 14px",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  minWidth: 42,
                  borderRadius: 12,
                  background: legendary ? "rgba(227,179,65,0.16)" : "rgba(0,230,118,0.1)",
                  border: `1px solid ${accent}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 19,
                }}
              >
                {item.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: COLORS.text, fontWeight: 700, fontSize: 14 }}>
                    {item.name}
                  </span>
                  {level > 0 && (
                    <span style={{ color: accent, fontSize: 11, fontWeight: 700 }}>
                      Lv {level}
                    </span>
                  )}
                </div>
                <div style={{ color: COLORS.textDim, fontSize: 12, marginTop: 2 }}>
                  {item.desc}
                </div>
                <div style={{ color: accent, fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                  {level > 0 ? currentBonus : nextBonus}
                </div>
              </div>

              <button
                className="lt-buy-btn"
                disabled={!affordable}
                onClick={() => onBuy(item.id)}
                style={{
                  border: `1px solid ${affordable ? accent : COLORS.glassBorder}`,
                  background: affordable
                    ? legendary
                      ? "rgba(227,179,65,0.16)"
                      : "rgba(0,230,118,0.12)"
                    : "transparent",
                  color: affordable ? accent : COLORS.textDim,
                  borderRadius: 10,
                  padding: "9px 12px",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: affordable ? "pointer" : "not-allowed",
                  opacity: affordable ? 1 : 0.5,
                  whiteSpace: "nowrap",
                  minWidth: 68,
                }}
              >
                ${fmt(cost)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TableFloor({
  wheelBackground,
  rotation,
  spinning,
  lastResult,
  message,
  betAmount,
  setBetAmount,
  betType,
  setBetType,
  balance,
  stake,
  onSpin,
  readyToSpin,
  history,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Wheel */}
      <div style={{ position: "relative", width: 260, height: 260, marginBottom: 8 }}>
        <div
          style={{
            position: "absolute",
            top: -4,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "9px solid transparent",
            borderRight: "9px solid transparent",
            borderTop: `14px solid ${COLORS.green}`,
            zIndex: 3,
            filter: "drop-shadow(0 0 8px rgba(0,230,118,0.6))",
          }}
        />
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: `7px solid rgba(255,255,255,0.08)`,
            boxShadow: "0 18px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,230,118,0.15)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: wheelBackground,
              transform: `rotate(${rotation}deg)`,
              transition: "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)",
              position: "relative",
            }}
          >
            {WHEEL_ORDER.map((n, i) => (
              <div
                key={n}
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: `rotate(${i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2}deg)`,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: 9,
                    fontWeight: 700,
                    color: COLORS.text,
                  }}
                >
                  {n}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 66,
            height: 66,
            borderRadius: "50%",
            background: "rgba(11,15,20,0.85)",
            backdropFilter: "blur(6px)",
            border: `2px solid ${COLORS.green}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            boxShadow: "0 0 20px rgba(0,230,118,0.3)",
          }}
        >
          <span style={{ color: COLORS.green, fontWeight: 800, fontSize: 20 }}>
            {lastResult ? lastResult.number : "\u2013"}
          </span>
        </div>
      </div>

      <div
        style={{
          minHeight: 20,
          color: lastResult && lastResult.win ? COLORS.green : COLORS.textDim,
          fontSize: 13,
          fontWeight: 600,
          textAlign: "center",
          marginBottom: 18,
          padding: "0 8px",
        }}
      >
        {message}
      </div>

      {/* Bet amount */}
      <div style={{ width: "100%", marginBottom: 14 }}>
        <div style={{ color: COLORS.textDim, fontSize: 12, marginBottom: 8 }}>
          Bet amount
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {BET_CHIPS.map((amt) => (
            <button
              key={amt}
              className="lt-pill"
              disabled={spinning}
              onClick={() => setBetAmount(amt)}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 12,
                border: `1px solid ${
                  betAmount === amt && amt <= balance ? COLORS.green : COLORS.glassBorder
                }`,
                background: betAmount === amt ? "rgba(0,230,118,0.12)" : "transparent",
                color: amt <= balance ? COLORS.text : COLORS.textDim,
                fontWeight: 700,
                fontSize: 13,
                cursor: spinning ? "not-allowed" : "pointer",
                opacity: amt <= balance ? 1 : 0.45,
              }}
            >
              {amt}
            </button>
          ))}
          <button
            className="lt-pill"
            disabled={spinning || balance <= 0}
            onClick={() => setBetAmount(balance)}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 12,
              border: `1px solid ${COLORS.glassBorder}`,
              background: "transparent",
              color: COLORS.text,
              fontWeight: 700,
              fontSize: 13,
              cursor: spinning || balance <= 0 ? "not-allowed" : "pointer",
              opacity: balance > 0 ? 1 : 0.45,
            }}
          >
            Max
          </button>
        </div>
      </div>

      {/* Bet type */}
      <div style={{ width: "100%", marginBottom: 18 }}>
        <div style={{ color: COLORS.textDim, fontSize: 12, marginBottom: 8 }}>
          Bet on
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {BET_TYPES.map((b) => (
            <button
              key={b.id}
              className="lt-pill"
              disabled={spinning}
              onClick={() => setBetType(b.id)}
              style={{
                flex: "1 1 28%",
                padding: "12px 0",
                borderRadius: 12,
                border: `2px solid ${betType === b.id ? COLORS.green : "transparent"}`,
                background: b.bg,
                color: COLORS.text,
                fontWeight: 700,
                fontSize: 13,
                cursor: spinning ? "not-allowed" : "pointer",
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onSpin}
        disabled={spinning}
        className={readyToSpin ? "lt-spin-ready" : ""}
        style={{
          width: "100%",
          padding: "16px 0",
          borderRadius: 16,
          border: "none",
          background: spinning
            ? "rgba(255,255,255,0.06)"
            : `linear-gradient(135deg, #1BFF9C, ${COLORS.green} 60%, #00A855)`,
          color: spinning ? COLORS.textDim : "#05130C",
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: "-0.01em",
          cursor: spinning ? "not-allowed" : "pointer",
          marginBottom: 18,
        }}
      >
        {spinning ? "Spinning\u2026" : `Spin the wheel \u2014 $${fmt(stake)}`}
      </button>

      {history.length > 0 && (
        <div style={{ width: "100%" }}>
          <div style={{ color: COLORS.textDim, fontSize: 12, marginBottom: 8 }}>
            Recent spins
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {history.map((h, i) => (
              <div
                key={i}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: colorHex(h.color),
                  border: h.win ? `2px solid ${COLORS.green}` : "2px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: COLORS.text,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {h.number}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
