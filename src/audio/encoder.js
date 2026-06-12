// encoder.js
import { frequencyMap } from "./frequencyMap";

export function encodeAccountNumber(accountNumber, audioContext, startTimeOffset = 0) {
  const digits = accountNumber.split("");
  const oscillators = [];
  
  // Set the precise baseline timing window
  let timeOffset = audioContext.currentTime + startTimeOffset + 0.05;
  const noteLength = 0.20;  // 200ms audio blast per digit
  const spaceLength = 0.10; // 100ms of complete silence between digits to stop overlapping

  const playTone = (freq, start, duration) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.08, start + 0.01);
    gain.gain.setValueAtTime(0.08, start + duration - 0.01);
    gain.gain.linearRampToValueAtTime(0, start + duration);

    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(start);
    osc.stop(start + duration);
    oscillators.push(osc);
  };

  // 1. Emit the START signal boundary
  playTone(frequencyMap["START"], timeOffset, noteLength);
  timeOffset += noteLength + spaceLength;

  // 2. Emit the 10 digits one after another
  digits.forEach((digit) => {
    playTone(frequencyMap[digit], timeOffset, noteLength);
    timeOffset += noteLength + spaceLength;
  });

  // 3. Emit the END signal boundary
  playTone(frequencyMap["END"], timeOffset, noteLength);
  timeOffset += noteLength;

  // Return the calculated lifetime of this single packet frame burst
  const totalDuration = timeOffset - audioContext.currentTime;
  return { oscillators, totalDuration };
}