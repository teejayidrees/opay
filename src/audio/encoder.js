// encoder.js
import { frequencyMap } from "./frequencyMap";

export function encodeAccountNumber(accountNumber, audioContext) {
  const digits = accountNumber.split("");
  const oscillators = [];
  
  let timeOffset = audioContext.currentTime + 0.05;
  const noteLength = 0.25;  // 250ms solid tone burst
  const spaceLength = 0.15; // 150ms deep gap to avoid overlapping waves

  const playTone = (freq, start, duration) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    
    // Crisp gain envelope parameters
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.1, start + 0.01);
    gain.gain.setValueAtTime(0.1, start + duration - 0.01);
    gain.gain.linearRampToValueAtTime(0, start + duration);

    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(start);
    osc.stop(start + duration);
    oscillators.push(osc);
  };

  // 1. Emit START framing gate
  playTone(frequencyMap["START"], timeOffset, noteLength);
  timeOffset += noteLength + spaceLength;

  // 2. Emit the 10 account digits
  digits.forEach((digit) => {
    playTone(frequencyMap[digit], timeOffset, noteLength);
    timeOffset += noteLength + spaceLength;
  });

  // 3. Emit END framing gate
  playTone(frequencyMap["END"], timeOffset, noteLength);

  return { oscillators };
}