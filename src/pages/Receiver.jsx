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

  // 🎤 Start Microphone + FFT
  const startScan = async () => {
    try {
      setStatus("Requesting microphone...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      audioCtxRef.current = new AudioContext();

      const source =
        audioCtxRef.current.createMediaStreamSource(stream);

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

  // 🔍 Frequency Detection Loop
  const detectLoop = (bufferLength) => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    const scan = () => {
      analyser.getByteFrequencyData(dataArray);

      let maxIndex = 0;

      for (let i = 1; i < bufferLength; i++) {
        if (dataArray[i] > dataArray[maxIndex]) {
          maxIndex = i;
        }
      }

      // Convert index → approximate frequency
      const frequency = maxIndex * (audioCtxRef.current.sampleRate / analyser.fftSize);

      // 🎯 Check if frequency matches any digit
      const matchedDigit = findClosestDigit(frequency);

      if (matchedDigit !== null) {
        setAccount((prev) => {
          const updated = prev + matchedDigit;
          if (updated.length === 10) {
            stopScan();
            setStatus("Account received successfully");
          }
          return updated.slice(0, 10);
        });
      }

      animationRef.current = requestAnimationFrame(scan);
    };

    scan();
  };

  // 🎯 Map frequency → digit
  const findClosestDigit = (freq) => {
    let closestDigit = null;
    let minDiff = Infinity;

    for (const digit in frequencyMap) {
      const diff = Math.abs(freq - frequencyMap[digit]);

      if (diff < 80 && diff < minDiff) {
        minDiff = diff;
        closestDigit = digit;
      }
    }

    return closestDigit;
  };

  // 🛑 Stop scanning
  const stopScan = () => {
    setIsScanning(false);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
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
          Status:{" "}
          <span style={{ color: isScanning ? "#00c853" : "gray" }}>
            {status}
          </span>
        </div>

        {!isScanning ? (
          <Button onClick={startScan}>Scan SoundPass</Button>
        ) : (
          <Button onClick={stopScan} variant="secondary">
            Stop Scanning
          </Button>
        )}

        {account.length === 10 && (
          <div style={styles.success}>
            ✅ Account Detected: {account}
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
  inputBox: {
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 12,
    marginTop: 6,
    borderRadius: 10,
    border: "1px solid #ddd",
    fontSize: 16,
  },
  status: {
    marginBottom: 20,
    fontWeight: 600,
  },
  success: {
    marginTop: 20,
    padding: 10,
    background: "#e8f5e9",
    color: "#00c853",
    borderRadius: 10,
    fontWeight: 600,
  },
};