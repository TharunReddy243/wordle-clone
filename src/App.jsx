import { useEffect, useMemo, useState } from "react";
import { WORDS, getRandomWord } from "./utils/words";



const MODES = [4, 5, 6];
const KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

function chooseWord(length) {
  const candidates = WORDS.filter(word => word.length === length);
  return candidates[Math.floor(Math.random() * candidates.length)] || "word";
}

function getMarks(guess, answer) {
  const marks = Array(guess.length).fill("absent");
  const remaining = {};
  for (let i = 0; i < answer.length; i++) remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) {
      marks[i] = "correct";
      remaining[guess[i]]--;
    }
  }
  for (let i = 0; i < guess.length; i++) {
    if (marks[i] === "correct") continue;
    if (remaining[guess[i]] > 0) {
      marks[i] = "present";
      remaining[guess[i]]--;
    }
  }
  return marks;
}

function playTone(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = type === "win" ? 660 : type === "error" ? 180 : 330;
    gain.gain.setValueAtTime(0.06, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
  } catch { }
}

export default function App() {
  const [mode, setMode] = useState(null);
  const [answer, setAnswer] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [current, setCurrent] = useState("");
  const [status, setStatus] = useState("playing");
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(false);
  const [dark, setDark] = useState(false);

  const wordSet = useMemo(() => new Set(WORDS), []);
  const keyboardMarks = useMemo(() => {
    const result = {};
    guesses.forEach(({ word, marks }) => {
      word.split("").forEach((letter, index) => {
        const mark = marks[index];
        if (mark === "correct" || (mark === "present" && result[letter] !== "correct")) result[letter] = mark;
        else if (!result[letter]) result[letter] = "absent";
      });
    });
    return result;
  }, [guesses]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setDark(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  function startGame(length) {
    setMode(length);
    setAnswer(getRandomWord(length));
    setGuesses([]);
    setCurrent("");
    setStatus("playing");
    setMessage("");
  }

  function submitGuess() {
    if (status !== "playing") return;

    if (current.length !== mode) {
      setMessage(`Enter a ${mode}-letter word.`);
      setShake(true);
      playTone("error");
      setTimeout(() => setShake(false), 350);
      return;
    }

    if (!wordSet.has(current)) {
      setMessage("That word is not in the dictionary.");
      setShake(true);
      playTone("error");
      setTimeout(() => setShake(false), 350);
      return;
    }

    // Prevent duplicate guesses
    if (guesses.some((guess) => guess.word === current)) {
      setMessage("You already entered that word.");
      setShake(true);
      playTone("error");
      setTimeout(() => setShake(false), 350);
      return;
    }

    const marks = getMarks(current, answer);

    const next = [...guesses, { word: current, marks }];

    setGuesses(next);
    setCurrent("");

    if (current === answer) {
      setStatus("won");
      setMessage("You got it!");
      playTone("win");
    } else if (next.length === 6) {
      setStatus("lost");
      setMessage(`The answer was ${answer.toUpperCase()}.`);
      playTone("error");
    } else {
      playTone("tile");
    }
  }

  function pressKey(key) {
    if (key === "enter") return submitGuess();
    if (key === "backspace") return setCurrent(value => value.slice(0, -1));
    if (status !== "playing" || current.length >= mode) return;
    setCurrent(value => value + key);
  }

  function shareResult() {
    const rows = guesses.map(({ marks }) => marks.map(mark => mark === "correct" ? "🟩" : mark === "present" ? "🟨" : "⬛").join("")).join("\n");
    const text = `Wordle Clone ${mode}/${guesses.length}\n${rows}`;
    if (navigator.share) navigator.share({ title: "Wordle Clone", text }).catch(() => { });
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => setMessage("Result copied."));
    else setMessage(text);
  }

  if (!mode) {
    return (
      <main className={`app landing ${dark ? "dark" : ""}`}>
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <section className="start-screen">
          <div className="brand-mark" aria-hidden="true">
            <span className="brand-tile correct">W</span>
            <span className="brand-tile present">O</span>
            <span className="brand-tile absent">R</span>
            <span className="brand-tile correct">D</span>
            <span className="brand-tile present">L</span>
            <span className="brand-tile absent">E</span>
          </div>
          <div className="brand">WORDLE V1</div>
          <p className="subtitle">Offline word game</p>
          <h1>Choose your game</h1>
          <div className="mode-list">
            {MODES.map(length => (
              <button className="mode-card" key={length} onClick={() => startGame(length)}>
                <span className="mode-number">{length}</span>
                <span><strong>{length}-Letter Wordle</strong><small>6 guesses</small></span>
                <span className="arrow">→</span>
              </button>
            ))}
          </div>
          {/* <p className="offline-note">Works offline. No account. No tracking.</p> */}
        </section>
      </main>
    );
  }

  return (
    <main className={`app game-app ${status} ${dark ? "dark" : ""}`}>
      {status === "won" && <div className="confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div>}
      <header className="topbar">
        <button className="icon-button" onClick={() => setMode(null)} aria-label="Back to game selection">⌂</button>
        <div className="brand small">WORDLE <span>{mode}</span></div>
        <button className="icon-button" onClick={() => startGame(mode)} aria-label="Restart game">↻</button>
      </header>

      <section className="game">
        <div className="game-info">
          <span>{mode}-letter mode</span>
          <span>{guesses.length}/6</span>
        </div>

        <div className={`board ${shake ? "shake" : ""}`} aria-label="Word board">
          {Array.from({ length: 6 }, (_, row) => {
            const entry = guesses[row];
            const letters = entry ? entry.word.split("") : row === guesses.length ? current.split("") : [];
            return (
              <div className="board-row" key={row}>
                {Array.from({ length: mode }, (_, col) => {
                  const letter = letters[col] || "";
                  const mark = entry?.marks[col] || "";
                  return <div className={`tile ${mark} ${letter ? "filled" : ""}`} style={entry ? { "--tile-delay": `${col * 90}ms` } : undefined} key={col}>{letter.toUpperCase()}</div>;
                })}
              </div>
            );
          })}
        </div>

        <div className={`message ${status !== "playing" ? "result" : ""}`} aria-live="polite">
          {message || " "}
        </div>

        {status !== "playing" && (
          <div className="result-panel">
            <strong>{status === "won" ? "Solved" : "Game over"}</strong>
            <span>The word was <b>{answer.toUpperCase()}</b></span>
            <div className="result-actions">
              <button onClick={() => startGame(mode)}>Play again</button>
              <button onClick={shareResult}>Share result</button>
            </div>
          </div>
        )}

        <div className="keyboard" aria-label="Keyboard">
          {KEY_ROWS.map((row, index) => (
            <div className="keyboard-row" key={row}>
              {index === 2 && <button className="key wide" onClick={() => pressKey("enter")}>ENTER</button>}
              {row.split("").map(key => <button key={key} className={`key ${keyboardMarks[key] || ""}`} onClick={() => pressKey(key)}>{key.toUpperCase()}</button>)}
              {index === 2 && <button className="key wide" onClick={() => pressKey("backspace")} aria-label="Backspace">⌫</button>}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
