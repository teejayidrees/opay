// Receiver.jsx
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

  const startScan = async () => {
    try {
      setAccount("");
      setStatus("Requesting microphone...");

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

// Inside Receiver.jsx
const detectLoop = (bufferLength) => {
  const analyser = analyserRef.current;
  const dataArray = dataArrayRef.current;
  const sampleRate = audioCtxRef.current.sampleRate;
  const hzPerBin = sampleRate / analyser.fftSize;

  let isGateOpen = false;
  let tempBuffer = [];
  let lastDigitAdded = null;
  let lastDigitTime = 0;

  const scan = () => {
    analyser.getByteFrequencyData(dataArray);
    
    let highestVolume = 0;
    let targetFreq = 0;

    const minBin = Math.floor(16800 / hzPerBin);
    const maxBin = Math.ceil(20000 / hzPerBin);

    for (let i = minBin; i <= maxBin; i++) {
      if (dataArray[i] > highestVolume && dataArray[i] > 30) { 
        highestVolume = dataArray[i];
        targetFreq = i * hzPerBin;
      }
    }

    if (targetFreq > 0) {
      const now = Date.now();
      
      // RULE 1: Detect Boundary START Signal
      if (Math.abs(targetFreq - frequencyMap["START"]) < 60) {
        if (!isGateOpen && (now - lastDigitTime > 800)) { 
          isGateOpen = true;
          tempBuffer = [];
          lastDigitAdded = null;
          lastDigitTime = now;
          setAccount(""); 
          setStatus("Start token detected! Scanning incoming packet...");
        }
      } 
      
      // RULE 2: Detect Boundary END Signal
      else if (Math.abs(targetFreq - frequencyMap["END"]) < 60) {
        if (isGateOpen && (now - lastDigitTime > 200)) {
          isGateOpen = false;
          lastDigitTime = now;

          // RULE 4: Complete Validation Check (Must be exactly 10 digits)
          if (tempBuffer.length === 10) {
            setAccount(tempBuffer.join(""));
            setStatus("Account received successfully!");
            stopScan();
            return; // Terminate execution frame loop safely
          } else {
            // Drop packet, wipe tracking, wait for next loop sequence
            setStatus(`Data distorted (${tempBuffer.length}/10 parsed). Scanning next wave loop...`);
            tempBuffer = [];
            lastDigitAdded = null;
          }
        }
      } 
      
      // RULE 3: Capture digits ONLY if the boundary gate is explicitly open
      else if (isGateOpen) {
        let matchedDigit = null;
        let minDiff = Infinity;
        
        for (const digit in frequencyMap) {
          if (digit === "START" || digit === "END") continue;
          const diff = Math.abs(targetFreq - frequencyMap[digit]);
          if (diff < 60 && diff < minDiff) {
            minDiff = diff;
            matchedDigit = digit;
          }
        }

        if (matchedDigit !== null) {
          const timeSinceLastDigit = now - lastDigitTime;
          
          // Anti-Repeat Guard: 250ms block prevents the same audio note 
          // from being counted multiple times as it plays through the air
          if (matchedDigit !== lastDigitAdded || timeSinceLastDigit > 250) {
            lastDigitAdded = matchedDigit;
            lastDigitTime = now;

            tempBuffer.push(matchedDigit);
            
            // Render loading slots to show the user it is filling up live
            setAccount(tempBuffer.join("") + "_".repeat(10 - tempBuffer.length));
          }
        }
      }
    }

    animationRef.current = requestAnimationFrame(scan);
  };

  animationRef.current = requestAnimationFrame(scan);
};

  const stopScan = () => {
    setIsScanning(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioCtxRef.current) audioCtxRef.current.close();
  };

  return (
    <div style={styles.container}>
      <Card>
        <h2 style={styles.title}>OPay Transfer</h2>
        <div style={styles.inputBox}>
          <label>Account Number</label>
          <input value={account} readOnly placeholder="Waiting for SoundPass..." style={styles.input} />
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