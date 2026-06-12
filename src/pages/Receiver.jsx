import { useRef, useState } from "react";
import Card from "../components/shared/Card.jsx";
import Button from "../components/shared/Button.jsx";
import { frequencyMap } from "../audio/frequencyMap.js";

export default function Receiver() {
  const [isScanning, setIsScanning] = useState(false);
  const [account, setAccount] = useState("");
  const [status, setStatus] = useState("Idle");

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);
  
  // Track previously captured digits during the current burst window to prevent duplicate spamming
  const detectedThisWindowRef = useRef(new Set());
  const idleTimerRef = useRef(null);

  const startScan = async () => {
    try {
      setAccount("");
      setStatus("Requesting microphone...");

      // Explicitly disable system audio filtering that strips high frequencies
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();

      const source = audioCtxRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;

      source.connect(analyserRef.current);

      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      setIsScanning(true);
      setStatus("Listening for SoundPass...");

      detectLoop(bufferLength);
    } catch (err) {
      console.log(err);
      setStatus("Microphone access denied");
    }
  };

  const detectLoop = (bufferLength) => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    const sampleRate = audioCtxRef.current.sampleRate;
    const hzPerBin = sampleRate / analyser.fftSize;

    // Define scanning range limits based on our map (17400Hz - 18500Hz)
    const minBin = Math.floor(17400 / hzPerBin);
    const maxBin = Math.ceil(18500 / hzPerBin);

    let activeSignalDetected = false;

    const scan = () => {
      analyser.getByteFrequencyData(dataArray);
      
      let discoveredDigitsInFrame = new Set();

      // Scan ONLY our designated high-frequency index buckets
      for (let i = minBin; i <= maxBin; i++) {
        const volume = dataArray[i];
        
        // Volume detection threshold (Adjust down to 30 if room is quiet or speakers are low)
        if (volume > 25) {
          const frequency = i * hzPerBin;
          const digit = findClosestDigit(frequency);
          
          if (digit !== null) {
            discoveredDigitsInFrame.add(digit);
            activeSignalDetected = true;
          }
        }
      }

      if (discoveredDigitsInFrame.size > 0) {
        // Reset our deadman silence timer since we are actively receiving data
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        
        discoveredDigitsInFrame.forEach((digit) => {
          // Add the digit only if it hasn't been logged during this 300ms audio packet
          if (!detectedThisWindowRef.current.has(digit)) {
            detectedThisWindowRef.current.add(digit);
            
            setAccount((prev) => {
              if (prev.length >= 10) return prev;
              const updated = prev + digit;
              if (updated.length === 10) {
                setTimeout(() => stopScan(), 100);
                setStatus("Account received successfully");
              }
              return updated;
            });
          }
        });
      } else if (activeSignalDetected) {
        // If the air goes silent for 200ms, clear the window registry to prep for the next pulse
        if (!idleTimerRef.current) {
          idleTimerRef.current = setTimeout(() => {
            detectedThisWindowRef.current.clear();
            activeSignalDetected = false;
          }, 200);
        }
      }

      animationRef.current = requestAnimationFrame(scan);
    };

    animationRef.current = requestAnimationFrame(scan);
  };

  const findClosestDigit = (freq) => {
    let closestDigit = null;
    let minDiff = Infinity;

    for (const digit in frequencyMap) {
      const diff = Math.abs(freq - frequencyMap[digit]);
      // 75Hz strict safety fence to prevent mismatched adjacent frequencies
      if (diff < 75 && diff < minDiff) {
        minDiff = diff;
        closestDigit = digit;
      }
    }
    return closestDigit;
  };

  const stopScan = () => {
    setIsScanning(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioCtxRef.current) audioCtxRef.current.close();
  };

  return (
    <div style={styles.container}>
      <Card>
        <h2 style={styles.title}>OPay Transfer</h2>
        <div style={styles.inputBox}>
          <label>Account Number</label>
          <input
            value={account}
            readOnly
            placeholder="Waiting for SoundPass..."
            style={styles.input}
          />
        </div>
        <div style={styles.status}>
          Status: <span style={{ color: isScanning ? "#00c853" : "gray" }}>{status}</span>
        </div>
        {!isScanning ? (
          <Button onClick={startScan}>Scan SoundPass</Button>
        ) : (
          <Button onClick={stopScan} variant="secondary">Stop Scanning</Button>
        )}
        {account.length === 10 && (
          <div style={styles.success}>✅ Account Detected: {account}</div>
        )}
      </Card>
    </div>
  );
}

const styles = {
  container: { padding: 30, display: "flex", justifyContent: "center" },
  title: { marginBottom: 20, color: "#0b1f3a" },
  inputBox: { marginBottom: 20 },
  input: { width: "100%", padding: 12, marginTop: 6, borderRadius: 10, border: "1px solid #ddd", fontSize: 16 },
  status: { marginBottom: 20, fontWeight: 600 },
  success: { marginTop: 20, padding: 10, background: "#e8f5e9", color: "#00c853", borderRadius: 10, fontWeight: 600 },
};