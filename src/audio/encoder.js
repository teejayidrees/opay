// encoder.js
import { frequencyMap } from "./frequencyMap";

export function encodeAccountNumber(accountNumber, audioContext) {
  const digits = accountNumber.split("");
  const oscillators = [];
  
  let timeOffset = audioContext.currentTime + 0.05;
  const toneDuration = 0.40; // 400ms per signal is massive, clear, and un-missable

  const playTone = (freq, start) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    
    // Smooth volume ramps to eliminate speaker popping noise
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.1, start + 0.02);
    gain.gain.setValueAtTime(0.1, start + toneDuration - 0.02);
    gain.gain.linearRampToValueAtTime(0, start + toneDuration);

    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(start);
    osc.stop(start + toneDuration);
    oscillators.push(osc);
  };

  // 1. Emit START token
  playTone(frequencyMap["START"], timeOffset);
  timeOffset += toneDuration;

  // 2. Interleave digits with the GAP frequency
  digits.forEach((digit, index) => {
    // Play the actual account digit
    playTone(frequencyMap[digit], timeOffset);
    timeOffset += toneDuration;

    // Inject a GAP tone after every digit except the final one
    if (index < digits.length - 1) {
      playTone(frequencyMap["GAP"], timeOffset);
      timeOffset += toneDuration;
    }
  });

  // 3. Emit END token
  playTone(frequencyMap["END"], timeOffset);

  return { oscillators };
}