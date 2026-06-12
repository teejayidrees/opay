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
  let isReadyForNextDigit = false;
  let tempBuffer = [];

  const scan = () => {
    analyser.getByteFrequencyData(dataArray);
    
    let highestVolume = 0;
    let targetFreq = 0;

    const minBin = Math.floor(17000 / hzPerBin);
    const maxBin = Math.ceil(20100 / hzPerBin);

    for (let i = minBin; i <= maxBin; i++) {
      if (dataArray[i] > highestVolume && dataArray[i] > 25) { 
        highestVolume = dataArray[i];
        targetFreq = i * hzPerBin;
      }
    }

    if (targetFreq > 0) {
      
      // LAYER 1: Match START Boundary
      if (Math.abs(targetFreq - frequencyMap["START"]) < 60) {
        if (!isGateOpen) {
          isGateOpen = true;
          isReadyForNextDigit = true; // Unlock tracking gate
          tempBuffer = [];
          setAccount(""); 
          setStatus("START parsed. Sync locked...");
        }
      } 
      
      // LAYER 2: Match END Boundary
      else if (Math.abs(targetFreq - frequencyMap["END"]) < 60) {
        if (isGateOpen) {
          isGateOpen = false;
          isReadyForNextDigit = false;

          if (tempBuffer.length === 10) {
            setAccount(tempBuffer.join(""));
            setStatus("Account received successfully!");
            stopScan();
            return;
          } else {
            setStatus(`Data mismatch (${tempBuffer.length}/10 parsed). Dropped packet.`);
            tempBuffer = [];
          }
        }
      } 
      
      // LAYER 3: Match GAP Intermission Tone
      else if (isGateOpen && Math.abs(targetFreq - frequencyMap["GAP"]) < 60) {
        // The sender is playing a separator note; safely unlock the gate for the next incoming digit
        isReadyForNextDigit = true;
      } 
      
      // LAYER 4: Match Digits (Only allowed if isReadyForNextDigit is true)
      else if (isGateOpen && isReadyForNextDigit) {
        let matchedDigit = null;
        let minDiff = Infinity;
        
        for (const digit in frequencyMap) {
          if (digit === "START" || digit === "END" || digit === "GAP") continue;
          const diff = Math.abs(targetFreq - frequencyMap[digit]);
          if (diff < 60 && diff < minDiff) {
            minDiff = diff;
            matchedDigit = digit;
          }
        }

        if (matchedDigit !== null) {
          tempBuffer.push(matchedDigit);
          
          // Lock the gate instantly! Ignore all incoming tones until a clear GAP is processed
          isReadyForNextDigit = false; 
          
          setAccount(tempBuffer.join("") + "_".repeat(10 - tempBuffer.length));
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