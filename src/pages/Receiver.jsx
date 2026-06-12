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

  let isGateOpen = false;
  let tempBuffer = [];
  let lastRegisteredDigit = null;
  let lastDigitTime = 0;

  const scan = () => {
    analyser.getByteFrequencyData(dataArray);

    let highestVolume = 0;
    let targetFreq = 0;

    // Monitor frequency bounds
    const minBin = Math.floor(16800 / hzPerBin);
    const maxBin = Math.ceil(20000 / hzPerBin);

    for (let i = minBin; i <= maxBin; i++) {
      if (dataArray[i] > highestVolume && dataArray[i] > 40) {
        highestVolume = dataArray[i];
        targetFreq = i * hzPerBin;
      }
    }

    if (targetFreq > 0) {
      const now = Date.now();

      // GATE LAYER 1: Detect START Signal
      if (Math.abs(targetFreq - frequencyMap["START"]) < 75) {
        if (!isGateOpen && (now - lastDigitTime > 1000)) {
          isGateOpen = true;
          tempBuffer = [];
          lastRegisteredDigit = null;
          lastDigitTime = now;
          setAccount(""); // Clear UI presentation pane
          setStatus("Sync found! Parsing incoming packet...");
        }
      } 
      
      // GATE LAYER 2: Detect END Signal
      else if (Math.abs(targetFreq - frequencyMap["END"]) < 75) {
        if (isGateOpen && (now - lastDigitTime > 200)) {
          isGateOpen = false;
          lastDigitTime = now;

          // Your fallback logic validation constraint: Check if we captured exactly 10 digits
          if (tempBuffer.length === 10) {
            const finalAccount = tempBuffer.join("");
            setAccount(finalAccount);
            setStatus("Account received successfully");
            setTimeout(() => stopScan(), 200);
          } else {
            // Fault management recovery: Bad packet structure size, drop it and listen for next loop
            setStatus(`Signal distorted (${tempBuffer.length}/10 digits). Retrying next wave loop...`);
            tempBuffer = [];
            lastRegisteredDigit = null;
          }
        }
      } 
      
      // DATA LAYER: Parse digits inside open gate boundaries
      else if (isGateOpen) {
        let matchedDigit = null;
        let minDiff = Infinity;

        for (const digit in frequencyMap) {
          if (digit === "START" || digit === "END") continue;
          const diff = Math.abs(targetFreq - frequencyMap[digit]);
          if (diff < 75 && diff < minDiff) {
            minDiff = diff;
            matchedDigit = digit;
          }
        }

        if (matchedDigit !== null) {
          const elapsed = now - lastDigitTime;

          // The Anti-Repeat Guard: Only log if it's a completely new digit, 
          // OR if it's the same digit but enough time has passed (meaning a new sound burst started)
          if (matchedDigit !== lastRegisteredDigit || elapsed > 200) {
            lastRegisteredDigit = matchedDigit;
            lastDigitTime = now;
            tempBuffer.push(matchedDigit);
            
            // Render progress real-time to track visually
            setAccount(tempBuffer.join("") + "_".repeat(10 - tempBuffer.length));
          }
        }
      }
    }

    animationRef.current = requestAnimationFrame(scan);
  };

  animationRef.current = requestAnimationFrame(scan);
};
  // const detectLoop = (bufferLength) => {
  //   const analyser = analyserRef.current;
  //   const dataArray = dataArrayRef.current;
  //   const sampleRate = audioCtxRef.current.sampleRate;
  //   const hzPerBin = sampleRate / analyser.fftSize;

  //   // Define scanning range limits based on our map (17400Hz - 18500Hz)
  //   const minBin = Math.floor(17400 / hzPerBin);
  //   const maxBin = Math.ceil(18500 / hzPerBin);

  //   let activeSignalDetected = false;

  //   const scan = () => {
  //     analyser.getByteFrequencyData(dataArray);
      
  //     let discoveredDigitsInFrame = new Set();

  //     // Scan ONLY our designated high-frequency index buckets
  //     for (let i = minBin; i <= maxBin; i++) {
  //       const volume = dataArray[i];
        
  //       // Volume detection threshold (Adjust down to 30 if room is quiet or speakers are low)
  //       if (volume > 25) {
  //         const frequency = i * hzPerBin;
  //         const digit = findClosestDigit(frequency);
          
  //         if (digit !== null) {
  //           discoveredDigitsInFrame.add(digit);
  //           activeSignalDetected = true;
  //         }
  //       }
  //     }

  //     if (discoveredDigitsInFrame.size > 0) {
  //       // Reset our deadman silence timer since we are actively receiving data
  //       if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        
  //       discoveredDigitsInFrame.forEach((digit) => {
  //         // Add the digit only if it hasn't been logged during this 300ms audio packet
  //         if (!detectedThisWindowRef.current.has(digit)) {
  //           detectedThisWindowRef.current.add(digit);
            
  //           setAccount((prev) => {
  //             if (prev.length >= 10) return prev;
  //             const updated = prev + digit;
  //             if (updated.length === 10) {
  //               setTimeout(() => stopScan(), 100);
  //               setStatus("Account received successfully");
  //             }
  //             return updated;
  //           });
  //         }
  //       });
  //     } else if (activeSignalDetected) {
  //       // If the air goes silent for 200ms, clear the window registry to prep for the next pulse
  //       if (!idleTimerRef.current) {
  //         idleTimerRef.current = setTimeout(() => {
  //           detectedThisWindowRef.current.clear();
  //           activeSignalDetected = false;
  //         }, 200);
  //       }
  //     }

  //     animationRef.current = requestAnimationFrame(scan);
  //   };

  //   animationRef.current = requestAnimationFrame(scan);
  // };
// const detectLoop = (bufferLength) => {
//   const analyser = analyserRef.current;
//   const dataArray = dataArrayRef.current;
//   const sampleRate = audioCtxRef.current.sampleRate;
//   const hzPerBin = sampleRate / analyser.fftSize;

//   let lastDigitAdded = null;
//   let lastDigitTime = 0;

//   const scan = () => {
//     analyser.getByteFrequencyData(dataArray);
    
//     let highestVolume = 0;
//     let targetFreq = 0;

//     // Scan frequencies between 17000Hz and 19700Hz
//     const minBin = Math.floor(17000 / hzPerBin);
//     const maxBin = Math.ceil(19700 / hzPerBin);

//     for (let i = minBin; i <= maxBin; i++) {
//       if (dataArray[i] > highestVolume && dataArray[i] > 35) { // Threshold level
//         highestVolume = dataArray[i];
//         targetFreq = i * hzPerBin;
//       }
//     }

//     if (targetFreq > 0) {
//       const now = Date.now();
      
//       // Check if it's the SYNC tone
//       if (Math.abs(targetFreq - frequencyMap["SYNC"]) < 80) {
//         if (now - lastDigitTime > 400) { // Throttle sync resets
//           setAccount(""); // Clear text to start fresh sequence
//           setStatus("Receiving tracking sequence...");
//           lastDigitAdded = null;
//           lastDigitTime = now;
//         }
//       } else {
//         // Find matching digit
//         let matchedDigit = null;
//         let minDiff = Infinity;
//         for (const digit in frequencyMap) {
//           if (digit === "SYNC") continue;
//           const diff = Math.abs(targetFreq - frequencyMap[digit]);
//           if (diff < 80 && diff < minDiff) {
//             minDiff = diff;
//             matchedDigit = digit;
//           }
//         }

//         // Add digit if it's new OR if enough time passed to allow double numbers (like '88')
//         if (matchedDigit !== null) {
//           const timeSinceLastDigit = now - lastDigitTime;
          
//           if (matchedDigit !== lastDigitAdded || timeSinceLastDigit > 90) {
//             lastDigitAdded = matchedDigit;
//             lastDigitTime = now;

//             setAccount((prev) => {
//               if (prev.length >= 10) return prev;
//               const updated = prev + matchedDigit;
//               if (updated.length === 10) {
//                 setStatus("Account received successfully");
//                 // Small delay before shutting down mic to let UI settle
//                 setTimeout(() => stopScan(), 300);
//               }
//               return updated;
//             });
//           }
//         }
//       }
//     }

//     animationRef.current = requestAnimationFrame(scan);
//   };

//   animationRef.current = requestAnimationFrame(scan);
// };
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