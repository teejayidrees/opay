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

      // Restrict lookup index ranges to minimize processor load and noise induction
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
        
        // Catch the Sync/Reset burst signal
        if (Math.abs(targetFreq - frequencyMap["SYNC"]) < 60) {
          if (now - lastDigitTime > 400) { 
            setAccount(""); 
            setStatus("Sync found. Processing SoundPass wave...");
            lastDigitAdded = null;
            lastDigitTime = now;
          }
        } else {
          let matchedDigit = null;
          let minDiff = Infinity;
          
          for (const digit in frequencyMap) {
            if (digit === "SYNC") continue;
            const diff = Math.abs(targetFreq - frequencyMap[digit]);
            if (diff < 60 && diff < minDiff) {
              minDiff = diff;
              matchedDigit = digit;
            }
          }

          if (matchedDigit !== null) {
            const timeSinceLastDigit = now - lastDigitTime;
            
            // 230ms debouncer directly intercepts repeating digits within the single note frame
            if (matchedDigit !== lastDigitAdded || timeSinceLastDigit > 230) {
              lastDigitAdded = matchedDigit;
              lastDigitTime = now;

              setAccount((prev) => {
                if (prev.length >= 10) return prev;
                const updated = prev + matchedDigit;
                if (updated.length === 10) {
                  setStatus("Account received successfully!");
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