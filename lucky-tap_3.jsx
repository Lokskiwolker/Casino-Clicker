import React, { useState, useRef, useMemo, useEffect } from "react";

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
function sliderTrack(value, max, color) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, rgba(255,255,255,0.12) ${pct}%, rgba(255,255,255,0.12) 100%)`;
}

const BOND_RATE = 0.06;
const BOND_INTERVAL_SEC = 30;

const EVENT_CHANCE = 0.06;
const EVENT_COOLDOWN_MS = 20000;
const EVENT_AUTO_DISMISS_MS = 9000;
const EVENT_STAKE_PCT = 0.3;

function stakeFrom(balance) {
  return Math.max(1, Math.round(balance * EVENT_STAKE_PCT));
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
const FRIEND_NAMES = ["Jamie", "Marcus", "Priya", "Deshawn", "Elena", "Kofi", "Nadia", "Tyler", "Sofia", "Andre", "Mei", "Owen"];
const COMPANY_PREFIXES = ["Quantum", "Nova", "Byte", "Lunar", "Turbo", "Giga", "Pixel", "Velvet", "Rocket", "Cosmic", "Neon", "Frosty"];
const COMPANY_SUFFIXES = ["Dynamics", "Labs", "Corp", "Industries", "Ventures", "Systems", "Holdings", "Collective", "Works", "Group"];
const CRYPTO_PREFIXES = ["Doge", "Moon", "Byte", "Giga", "Frog", "Toast", "Noodle", "Turbo", "Pixel", "Velvet"];
const CRYPTO_SUFFIXES = ["Coin", "Token", "Cash", "Bucks", "Finance", "Chain"];

function randomFriend() {
  return pick(FRIEND_NAMES);
}
function randomCompany() {
  return `${pick(COMPANY_PREFIXES)} ${pick(COMPANY_SUFFIXES)}`;
}
function randomCrypto() {
  return `${pick(CRYPTO_PREFIXES)}${pick(CRYPTO_SUFFIXES)}`;
}

// Every template returns a title/description/win-lose flavor text. All of them
// follow the same mechanic: stake 30% of the current balance on a 50/50 flip.
const EVENT_TEMPLATES = [
  {
    icon: "\u{1F4C8}",
    build: (balance) => {
      const friend = randomFriend();
      const company = randomCompany();
      const amount = stakeFrom(balance);
      return {
        title: "Hot stock tip",
        description: `${friend} texts you: "bro, ${company} is about to blow up, trust me." Put in $${fmt(amount)}?`,
        amount,
        winText: `${company} actually popped off. Nice.`,
        loseText: `${company} cratered. ${friend} has gone quiet.`,
      };
    },
  },
  {
    icon: "\u{1FA99}",
    build: (balance) => {
      const coin = randomCrypto();
      const amount = stakeFrom(balance);
      return {
        title: "Crypto DM",
        description: `A stranger slides into your DMs: "get in on $${coin} before it moons." Send $${fmt(amount)}?`,
        amount,
        winText: `$${coin} actually mooned. Screenshot that.`,
        loseText: `$${coin} rugged. The stranger blocked you.`,
      };
    },
  },
  {
    icon: "\u{1F3A9}",
    build: (balance) => {
      const amount = stakeFrom(balance);
      return {
        title: "Street magician",
        description: `A street magician bets he can guess your card. Wager $${fmt(amount)} that he's wrong?`,
        amount,
        winText: "He guessed wrong! Crowd goes wild, cash doubles.",
        loseText: "He nailed it on the first try. Slow clap.",
      };
    },
  },
  {
    icon: "\u{1F3B0}",
    build: (balance) => {
      const amount = stakeFrom(balance);
      return {
        title: "Mystery vending machine",
        description: `You find a vending machine that either doubles your cash or eats it. Feed it $${fmt(amount)}?`,
        amount,
        winText: "Ka-ching! The machine spits out double.",
        loseText: "The machine swallows it with a sad beep.",
      };
    },
  },
  {
    icon: "\u{1F3C6}",
    build: (balance) => {
      const amount = stakeFrom(balance);
      return {
        title: "Office pool",
        description: `Your coworkers start a surprise fantasy league buy-in. Chip in $${fmt(amount)}?`,
        amount,
        winText: "Your bracket somehow survives. You cash out big.",
        loseText: "Your bracket is destroyed in round one.",
      };
    },
  },
  {
    icon: "\u{1F3FA}",
    build: (balance) => {
      const amount = stakeFrom(balance);
      return {
        title: "Garage sale gamble",
        description: `A dusty lamp at a garage sale looks suspiciously like an antique. Buy it for $${fmt(amount)}?`,
        amount,
        winText: "Turns out it's a rare collector's piece. Jackpot.",
        loseText: "It's just a lamp. A regular, ordinary lamp.",
      };
    },
  },
  {
    icon: "\u{1F0CF}",
    build: (balance) => {
      const amount = stakeFrom(balance);
      return {
        title: "Late-night poker",
        description: `Your buddy invites you to a high-stakes poker night. Buy in for $${fmt(amount)}?`,
        amount,
        winText: "You bluff your way to a huge pot. Cha-ching.",
        loseText: "You get cleaned out by round two.",
      };
    },
  },
  {
    icon: "\u{1F3AB}",
    build: (balance) => {
      const amount = stakeFrom(balance);
      return {
        title: "Suspicious raffle",
        description: `A guy outside the grocery store is running a raffle for a "guaranteed prize." Buy in for $${fmt(amount)}?`,
        amount,
        winText: "You actually win the prize. Shockingly legit.",
        loseText: "There was no prize. There was never a prize.",
      };
    },
  },
];

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

  // Investment bonds: money set aside compounds at 6% every 30 seconds
  const [invested, setInvested] = useState(0);
  const [depositAmount, setDepositAmount] = useState(50);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(BOND_INTERVAL_SEC);
  const [totalInterestEarned, setTotalInterestEarned] = useState(0);
  const [interestPulseId, setInterestPulseId] = useState(0);
  const [lastInterestAmt, setLastInterestAmt] = useState(0);

  // Random side-events triggered occasionally while tapping
  const [activeEvent, setActiveEvent] = useState(null);

  const comboRef = useRef(0);
  const lastTapRef = useRef(0);
  const comboTimerRef = useRef(null);
  const grabTimerRef = useRef(null);
  const touchPointRef = useRef({ x: 0, y: 0 });
  const lastEventTimeRef = useRef(0);
  const eventTimeoutRef = useRef(null);

  const stake = Math.max(0, Math.min(betAmount, balance));
  const depositStake = Math.max(0, Math.min(depositAmount, balance));
  const withdrawStake = Math.max(0, Math.min(withdrawAmount, invested));

  // Keep slider values sane if balance/invested shrink from other actions
  useEffect(() => {
    setDepositAmount((d) => Math.min(d, balance));
  }, [balance]);
  useEffect(() => {
    setWithdrawAmount((w) => Math.min(w, invested));
  }, [invested]);

  // Applies 6% compound interest to the invested pool every 30 seconds,
  // regardless of which screen is currently open.
  useEffect(() => {
    const id = setInterval(() => {
      setInvested((v) => {
        if (v <= 0) return v;
        const interest = v * BOND_RATE;
        setLastInterestAmt(interest);
        setInterestPulseId((n) => n + 1);
        setTotalInterestEarned((t) => t + interest);
        return v + interest;
      });
      setSecondsLeft(BOND_INTERVAL_SEC);
    }, BOND_INTERVAL_SEC * 1000);
    return () => clearInterval(id);
  }, []);

  // One-second countdown just for the "next payout in..." display
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function depositToBonds(amount) {
    const amt = Math.max(0, Math.min(amount, balance));
    if (amt <= 0) return;
    setBalance((b) => b - amt);
    setInvested((v) => v + amt);
  }
  function withdrawFromBonds(amount) {
    const amt = Math.max(0, Math.min(amount, invested));
    if (amt <= 0) return;
    setInvested((v) => v - amt);
    setBalance((b) => b + amt);
  }

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
    maybeTriggerEvent(balance + value);

    const popupId = Math.random().toString(36).slice(2) + "-p";
    setPopups((p) => [...p, { id: popupId, value }]);
    setTimeout(() => {
      setPopups((p) => p.filter((pt) => pt.id !== popupId));
    }, 700);
  }

  function maybeTriggerEvent(currentBalance) {
    if (activeEvent) return;
    const now = Date.now();
    if (now - lastEventTimeRef.current < EVENT_COOLDOWN_MS) return;
    if (currentBalance < 20) return;
    if (Math.random() > EVENT_CHANCE) return;

    lastEventTimeRef.current = now;
    const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
    const built = template.build(currentBalance);
    const ev = {
      id: Math.random().toString(36).slice(2),
      icon: template.icon,
      resolved: false,
      outcome: null,
      ...built,
    };
    setActiveEvent(ev);
    if (eventTimeoutRef.current) clearTimeout(eventTimeoutRef.current);
    eventTimeoutRef.current = setTimeout(() => {
      setActiveEvent((cur) => (cur && cur.id === ev.id && !cur.resolved ? null : cur));
    }, EVENT_AUTO_DISMISS_MS);
  }

  function resolveEvent() {
    setActiveEvent((cur) => {
      if (!cur || cur.resolved) return cur;
      const win = Math.random() < 0.5;
      setBalance((b) => (win ? b + cur.amount : b - cur.amount));
      if (win) setPulseId((n) => n + 1);
      if (eventTimeoutRef.current) clearTimeout(eventTimeoutRef.current);
      eventTimeoutRef.current = setTimeout(() => setActiveEvent(null), 2600);
      return { ...cur, resolved: true, outcome: win ? "win" : "lose" };
    });
  }

  function skipEvent() {
    if (eventTimeoutRef.current) clearTimeout(eventTimeoutRef.current);
    setActiveEvent(null);
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
        @keyframes lt-toast-in {
          0% { transform: translateX(24px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .lt-event-toast { animation: lt-toast-in 0.25s ease-out; }
        .lt-event-btn { transition: transform 0.08s ease, opacity 0.15s ease; }
        .lt-event-btn:active { transform: scale(0.96); }
        .lt-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 999px;
          outline: none;
          cursor: pointer;
          display: block;
        }
        .lt-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #00E676;
          box-shadow: 0 2px 8px rgba(0,0,0,0.45);
          cursor: pointer;
        }
        .lt-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #00E676;
          box-shadow: 0 2px 8px rgba(0,0,0,0.45);
          cursor: pointer;
        }
        .lt-slider::-moz-range-track {
          height: 6px;
          border-radius: 999px;
          background: transparent;
        }
        .lt-slider:disabled { opacity: 0.4; cursor: not-allowed; }
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

        <EventToast event={activeEvent} onInvest={resolveEvent} onSkip={skipEvent} />

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
          {screen === "bonds" && (
            <Bonds
              balance={balance}
              invested={invested}
              depositAmount={depositAmount}
              setDepositAmount={setDepositAmount}
              depositStake={depositStake}
              withdrawAmount={withdrawAmount}
              setWithdrawAmount={setWithdrawAmount}
              withdrawStake={withdrawStake}
              secondsLeft={secondsLeft}
              totalInterestEarned={totalInterestEarned}
              interestPulseId={interestPulseId}
              lastInterestAmt={lastInterestAmt}
              onDeposit={depositToBonds}
              onWithdraw={withdrawFromBonds}
            />
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
            { id: "tap", label: "Tap" },
            { id: "market", label: "Market" },
            { id: "bonds", label: "Bonds" },
            { id: "table", label: "Table" },
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

function EventToast({ event, onInvest, onSkip }) {
  if (!event) return null;
  return (
    <div
      className="lt-event-toast"
      style={{
        position: "absolute",
        top: 84,
        right: 14,
        width: 220,
        zIndex: 30,
        background: "rgba(15,12,4,0.92)",
        backdropFilter: "blur(10px)",
        border: `1px solid rgba(227,179,65,0.45)`,
        borderRadius: 16,
        padding: "13px 14px",
        boxShadow: "0 16px 36px rgba(0,0,0,0.5), 0 0 24px rgba(227,179,65,0.12)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: event.resolved ? 4 : 8 }}>
        <span style={{ fontSize: 18 }}>{event.icon}</span>
        <span style={{ fontWeight: 800, color: COLORS.text, fontSize: 13 }}>{event.title}</span>
      </div>

      {!event.resolved ? (
        <>
          <div style={{ color: COLORS.textDim, fontSize: 12, lineHeight: 1.4, marginBottom: 12 }}>
            {event.description}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="lt-event-btn"
              onClick={onInvest}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 10,
                padding: "9px 0",
                background: `linear-gradient(135deg, #F3D77A, ${COLORS.gold} 60%, #B8912E)`,
                color: "#1A1000",
                fontWeight: 800,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Invest ${fmt(event.amount)}
            </button>
            <button
              className="lt-event-btn"
              onClick={onSkip}
              style={{
                border: `1px solid rgba(255,255,255,0.16)`,
                borderRadius: 10,
                padding: "9px 12px",
                background: "transparent",
                color: COLORS.textDim,
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Skip
            </button>
          </div>
        </>
      ) : (
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 14,
              color: event.outcome === "win" ? COLORS.green : COLORS.red,
            }}
          >
            {event.outcome === "win" ? `+$${fmt(event.amount)}` : `-$${fmt(event.amount)}`}
          </div>
          <div style={{ color: COLORS.textDim, fontSize: 12, marginTop: 3, lineHeight: 1.4 }}>
            {event.outcome === "win" ? event.winText : event.loseText}
          </div>
        </div>
      )}
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

function Bonds({
  balance,
  invested,
  depositAmount,
  setDepositAmount,
  depositStake,
  withdrawAmount,
  setWithdrawAmount,
  withdrawStake,
  secondsLeft,
  totalInterestEarned,
  interestPulseId,
  lastInterestAmt,
  onDeposit,
  onWithdraw,
}) {
  const progressPct = ((BOND_INTERVAL_SEC - secondsLeft) / BOND_INTERVAL_SEC) * 100;
  const PRESETS = [0.25, 0.5, 0.75, 1];

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.text, letterSpacing: "-0.01em" }}>
          Investment bonds
        </div>
        <div style={{ color: COLORS.textDim, fontSize: 13, marginTop: 3 }}>
          Set cash aside and it earns {Math.round(BOND_RATE * 100)}% every {BOND_INTERVAL_SEC} seconds.
        </div>
      </div>

      {/* Invested balance card */}
      <div
        style={{
          position: "relative",
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${COLORS.glassBorder}`,
          borderRadius: 18,
          padding: "18px 18px 16px",
          marginBottom: 16,
          overflow: "visible",
        }}
      >
        <div style={{ color: COLORS.textDim, fontSize: 11, fontWeight: 600, letterSpacing: "0.02em" }}>
          Invested
        </div>
        <div
          key={interestPulseId}
          className="lt-balance-pulse"
          style={{ fontSize: 28, fontWeight: 800, color: COLORS.green, marginTop: 2, fontVariantNumeric: "tabular-nums" }}
        >
          ${fmt(invested)}
        </div>
        {interestPulseId > 0 && (
          <span
            key={"pop-" + interestPulseId}
            className="lt-popup"
            style={{ left: "50%", top: 4, color: COLORS.green, fontWeight: 800, fontSize: 14 }}
          >
            +${fmt(lastInterestAmt)}
          </span>
        )}

        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: COLORS.textDim, fontSize: 11 }}>Next payout</span>
            <span style={{ color: COLORS.textDim, fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
              {secondsLeft}s
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${COLORS.green}, #1BFF9C)`,
                transition: "width 1s linear",
                borderRadius: 999,
              }}
            />
          </div>
        </div>

        <div style={{ color: COLORS.textDim, fontSize: 11, marginTop: 12 }}>
          Total interest earned:{" "}
          <span style={{ color: COLORS.green, fontWeight: 700 }}>${fmt(totalInterestEarned)}</span>
        </div>
      </div>

      {/* Deposit */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ color: COLORS.textDim, fontSize: 12 }}>Deposit from balance</span>
          <span style={{ color: COLORS.green, fontSize: 13, fontWeight: 700 }}>${fmt(depositStake)}</span>
        </div>
        <input
          type="range"
          className="lt-slider"
          min={0}
          max={Math.max(0, balance)}
          step={1}
          value={depositStake}
          disabled={balance <= 0}
          onChange={(e) => setDepositAmount(Number(e.target.value))}
          style={{ background: sliderTrack(depositStake, balance, COLORS.green) }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
          <span style={{ color: COLORS.textDim, fontSize: 10 }}>$0</span>
          <span style={{ color: COLORS.textDim, fontSize: 10 }}>${fmt(balance)}</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, marginBottom: 12 }}>
          {PRESETS.map((pct) => (
            <button
              key={pct}
              className="lt-pill"
              onClick={() => setDepositAmount(Math.round(balance * pct))}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 999,
                border: `1px solid ${COLORS.glassBorder}`,
                background: "transparent",
                color: COLORS.textDim,
                fontWeight: 700,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {pct === 1 ? "Max" : `${pct * 100}%`}
            </button>
          ))}
        </div>
        <button
          className="lt-buy-btn"
          disabled={depositStake <= 0}
          onClick={() => onDeposit(depositStake)}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 14,
            border: "none",
            background:
              depositStake > 0
                ? `linear-gradient(135deg, #1BFF9C, ${COLORS.green} 60%, #00A855)`
                : "rgba(255,255,255,0.06)",
            color: depositStake > 0 ? "#05130C" : COLORS.textDim,
            fontSize: 14,
            fontWeight: 800,
            cursor: depositStake > 0 ? "pointer" : "not-allowed",
          }}
        >
          Deposit ${fmt(depositStake)}
        </button>
      </div>

      {/* Withdraw */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ color: COLORS.textDim, fontSize: 12 }}>Withdraw back to balance</span>
          <span style={{ color: COLORS.green, fontSize: 13, fontWeight: 700 }}>${fmt(withdrawStake)}</span>
        </div>
        <input
          type="range"
          className="lt-slider"
          min={0}
          max={Math.max(0, invested)}
          step={1}
          value={withdrawStake}
          disabled={invested <= 0}
          onChange={(e) => setWithdrawAmount(Number(e.target.value))}
          style={{ background: sliderTrack(withdrawStake, invested, COLORS.green) }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
          <span style={{ color: COLORS.textDim, fontSize: 10 }}>$0</span>
          <span style={{ color: COLORS.textDim, fontSize: 10 }}>${fmt(invested)}</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, marginBottom: 12 }}>
          {PRESETS.map((pct) => (
            <button
              key={pct}
              className="lt-pill"
              onClick={() => setWithdrawAmount(Math.round(invested * pct))}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 999,
                border: `1px solid ${COLORS.glassBorder}`,
                background: "transparent",
                color: COLORS.textDim,
                fontWeight: 700,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {pct === 1 ? "All" : `${pct * 100}%`}
            </button>
          ))}
        </div>
        <button
          className="lt-buy-btn"
          disabled={withdrawStake <= 0}
          onClick={() => {
            onWithdraw(withdrawStake);
            setWithdrawAmount(0);
          }}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 14,
            border: `1px solid ${withdrawStake > 0 ? COLORS.green : COLORS.glassBorder}`,
            background: withdrawStake > 0 ? "rgba(0,230,118,0.12)" : "transparent",
            color: withdrawStake > 0 ? COLORS.green : COLORS.textDim,
            fontSize: 14,
            fontWeight: 800,
            cursor: withdrawStake > 0 ? "pointer" : "not-allowed",
          }}
        >
          Withdraw ${fmt(withdrawStake)}
        </button>
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
