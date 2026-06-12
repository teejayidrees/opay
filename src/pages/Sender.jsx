// Sender.jsx
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

  const startBroadcast = async () => {
    if (isBroadcasting) return;

    const ctx = createAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    audioCtxRef.current = ctx;
    setIsBroadcasting(true);

    const triggerSingleWaveform = () => {
      // Safety check to ensure context is active
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
      
      // Clear old oscillators from memory before firing a new burst loop
      try {
        oscillatorsRef.current.forEach(osc => osc.stop());
      } catch(e){}
      oscillatorsRef.current = [];

      // Fire the single sound packet
      const { oscillators } = encodeAccountNumber(account, audioCtxRef.current);
      oscillatorsRef.current = oscillators;
    };

    // Run first transmission immediately
    triggerSingleWaveform();

    // Endlessly loop the entire sequence every 4.5 seconds smoothly
    intervalRef.current = setInterval(triggerSingleWaveform, 4500);
  };

  const stopBroadcast = () => {
    setIsBroadcasting(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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
            {isBroadcasting ? "Broadcasting (Looping)..." : "Idle"}
          </span>
        </div>
        <div style={styles.buttons}>
          <Button onClick={startBroadcast}>Start Broadcast</Button>
          <Button onClick={stopBroadcast} variant="secondary">Stop</Button>
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
  container: { padding: 30, display: "flex", justifyContent: "center" },
  title: { marginBottom: 20, color: "#0b1f3a" },
  input: { width: "100%", padding: 12, marginTop: 6, marginBottom: 20, borderRadius: 10, border: "1px solid #ddd", fontSize: 16 },
  status: { marginBottom: 20, fontWeight: 600 },
  buttons: { display: "flex", gap: 10 },
  radar: { marginTop: 30, height: 120, display: "flex", justifyContent: "center", alignItems: "center" },
  pulse: { width: 40, height: 40, borderRadius: "50%", background: "#00c853", animation: "pulse 1s infinite" },
};