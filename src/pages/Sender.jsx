import { useState, useRef } from "react";
import Card from "../components/shared/Card.jsx";
import Button from "../components/shared/Button.jsx";
import { encodeAccountNumber } from "../audio/encoder.js";
import { createAudioContext } from "../audio/soundEngine.js";

export default function Sender() {
  const [account, setAccount] = useState("8123456789");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const audioCtxRef = useRef(null);
  const oscillatorsRef = useRef([]);
  const intervalRef = useRef(null);

  // 🎧 Start Broadcast
  // const startBroadcast = async () => {
  //   if (isBroadcasting) return;

  //   audioCtxRef.current = createAudioContext();

  //   setIsBroadcasting(true);

  //   const startBurst = () => {
  //     const oscillators = encodeAccountNumber(
  //       account,
  //       audioCtxRef.current
  //     );

  //     oscillatorsRef.current = oscillators;

  //     // Start sound
  //     oscillators.forEach((osc) => osc.start());

  //     // Stop after 300ms (pulse system)
  //     setTimeout(() => {
  //       oscillators.forEach((osc) => osc.stop());
  //     }, 300);
  //   };

  //   // Initial burst
  //   startBurst();

  //   // Repeat every 700ms (300ms sound + 400ms silence)
  //   intervalRef.current = setInterval(startBurst, 700);
  // };
const startBroadcast = async () => {
  if (isBroadcasting) return;

  // Initialize context directly inside the user's click event
  const ctx = createAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  
  audioCtxRef.current = ctx;
  setIsBroadcasting(true);

  const digits = account.split("");
  const noteLength = 0.20;  // 200ms per digit (very stable speed)
  const spaceLength = 0.05; // 50ms gap between digits

  let timeOffset = audioCtxRef.current.currentTime + 0.05;

  const playTone = (freq, start, duration) => {
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    
    // Smooth volume envelop to make sure it plays cleanly
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.1, start + 0.01);
    gain.gain.setValueAtTime(0.1, start + duration - 0.01);
    gain.gain.linearRampToValueAtTime(0, start + duration);

    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    osc.start(start);
    osc.stop(start + duration);
    oscillatorsRef.current.push(osc);
  };

  // 1. Play START signal
  playTone(frequencyMap["START"], timeOffset, noteLength);
  timeOffset += noteLength + spaceLength;

  // 2. Play the 10 digits sequentially
  digits.forEach((digit) => {
    playTone(frequencyMap[digit], timeOffset, noteLength);
    timeOffset += noteLength + spaceLength;
  });

  // 3. Play END signal
  playTone(frequencyMap["END"], timeOffset, noteLength);
  timeOffset += noteLength;

  // Automatically reset the UI state back to "Idle" when the single transmission finishes
  const totalDurationMs = (timeOffset - audioCtxRef.current.currentTime) * 1000;
  setTimeout(() => {
    setIsBroadcasting(false);
  }, totalDurationMs);
};
  // 🛑 Stop Broadcast
  const stopBroadcast = () => {
    setIsBroadcasting(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    try {
      oscillatorsRef.current.forEach((osc) => osc.stop());
    } catch (e) {}

    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
  };

  return (
    <div style={styles.container}>
      <Card>
        <h2 style={styles.title}>OPay POS Terminal</h2>

        <label>Account Number</label>
        <input
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          style={styles.input}
          maxLength={10}
        />

        <div style={styles.status}>
          Status:{" "}
          <span style={{ color: isBroadcasting ? "#00c853" : "red" }}>
            {isBroadcasting ? "Broadcasting..." : "Idle"}
          </span>
        </div>

        <div style={styles.buttons}>
          <Button onClick={startBroadcast}>Start Broadcast</Button>
          <Button onClick={stopBroadcast} variant="secondary">
            Stop
          </Button>
        </div>

        {isBroadcasting && (
          <div style={styles.radar}>
            <div style={styles.pulse}></div>
          </div>
        )}
      </Card>
    </div>
  );
}

const styles = {
  container: {
    padding: 30,
    display: "flex",
    justifyContent: "center",
  },
  title: {
    marginBottom: 20,
    color: "#0b1f3a",
  },
  input: {
    width: "100%",
    padding: 12,
    marginTop: 6,
    marginBottom: 20,
    borderRadius: 10,
    border: "1px solid #ddd",
    fontSize: 16,
  },
  status: {
    marginBottom: 20,
    fontWeight: 600,
  },
  buttons: {
    display: "flex",
    gap: 10,
  },
  radar: {
    marginTop: 30,
    height: 120,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  pulse: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#00c853",
    animation: "pulse 1s infinite",
  },
};