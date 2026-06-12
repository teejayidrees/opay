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

  let lastDigitAdded = null;
  let lastDigitTime = 0;

  const scan = () => {
    analyser.getByteFrequencyData(dataArray);
    
    let highestVolume = 0;
    let targetFreq = 0;

    // Scan frequencies between 17000Hz and 19700Hz
    const minBin = Math.floor(17000 / hzPerBin);
    const maxBin = Math.ceil(19700 / hzPerBin);

    for (let i = minBin; i <= maxBin; i++) {
      if (dataArray[i] > highestVolume && dataArray[i] > 35) { // Threshold level
        highestVolume = dataArray[i];
        targetFreq = i * hzPerBin;
      }
    }

    if (targetFreq > 0) {
      const now = Date.now();
      
      // Check if it's the SYNC tone
      if (Math.abs(targetFreq - frequencyMap["SYNC"]) < 80) {
        if (now - lastDigitTime > 400) { // Throttle sync resets
          setAccount(""); // Clear text to start fresh sequence
          setStatus("Receiving tracking sequence...");
          lastDigitAdded = null;
          lastDigitTime = now;
        }
      } else {
        // Find matching digit
        let matchedDigit = null;
        let minDiff = Infinity;
        for (const digit in frequencyMap) {
          if (digit === "SYNC") continue;
          const diff = Math.abs(targetFreq - frequencyMap[digit]);
          if (diff < 80 && diff < minDiff) {
            minDiff = diff;
            matchedDigit = digit;
          }
        }

        // Add digit if it's new OR if enough time passed to allow double numbers (like '88')
        if (matchedDigit !== null) {
          const timeSinceLastDigit = now - lastDigitTime;
          
          if (matchedDigit !== lastDigitAdded || timeSinceLastDigit > 90) {
            lastDigitAdded = matchedDigit;
            lastDigitTime = now;

            setAccount((prev) => {
              if (prev.length >= 10) return prev;
              const updated = prev + matchedDigit;
              if (updated.length === 10) {
                setStatus("Account received successfully");
                // Small delay before shutting down mic to let UI settle
                setTimeout(() => stopScan(), 300);
              }
              return updated;
            });
          }
        }
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