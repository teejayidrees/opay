// encoder.js
import { frequencyMap } from "./frequencyMap";

export function encodeAccountNumber(accountNumber, audioContext) {
  const digits = accountNumber.split("");
  const oscillators = [];
  
  let timeOffset = audioContext.currentTime + 0.05;
  const noteLength = 0.20;  // 200ms gives microphones plenty of time to capture the frequency bin
  const spaceLength = 0.05; // 50ms clear silence gap between digits to stop bleeding

  // 1. Queue the SYNC tone to let the receiver clear its display
  const syncOsc = audioContext.createOscillator();
  const syncGain = audioContext.createGain();
  syncOsc.frequency.value = frequencyMap["SYNC"];
  syncOsc.type = "sine";
  
  syncGain.gain.setValueAtTime(0, timeOffset);
  syncGain.gain.linearRampToValueAtTime(0.1, timeOffset + 0.01);
  syncGain.gain.setValueAtTime(0.1, timeOffset + noteLength - 0.01);
  syncGain.gain.linearRampToValueAtTime(0, timeOffset + noteLength);

  syncOsc.connect(syncGain);
  syncGain.connect(audioContext.destination);
  syncOsc.start(timeOffset);
  syncOsc.stop(timeOffset + noteLength);
  
  oscillators.push(syncOsc);
  timeOffset += noteLength + spaceLength;

  // 2. Queue all digits one after another with precise timing
  digits.forEach((digit) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.frequency.value = frequencyMap[digit];
    osc.type = "sine";
    
    gain.gain.setValueAtTime(0, timeOffset);
    gain.gain.linearRampToValueAtTime(0.1, timeOffset + 0.01);
    gain.gain.setValueAtTime(0.1, timeOffset + noteLength - 0.01);
    gain.gain.linearRampToValueAtTime(0, timeOffset + noteLength);

    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.start(timeOffset);
    osc.stop(timeOffset + noteLength);
    
    oscillators.push(osc);
    timeOffset += noteLength + spaceLength;
  });

  return { oscillators, totalDuration: timeOffset - audioContext.currentTime };
}