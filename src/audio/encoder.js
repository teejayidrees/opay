import { frequencyMap } from "./frequencyMap";

export function encodeAccountNumber(accountNumber, audioContext) {
  const digits = accountNumber.split("");
  const oscillators = [];
  
  let timeOffset = audioContext.currentTime + 0.05;
  const noteLength = 0.08; // 80ms per digit burst
  const spaceLength = 0.02; // 20ms tiny gap to let speaker settle

  // 1. Play the SYNC tone first to clear the receiver's screen
  const syncOsc = audioContext.createOscillator();
  const syncGain = audioContext.createGain();
  syncOsc.frequency.value = frequencyMap["SYNC"];
  syncOsc.type = "sine";
  syncGain.gain.setValueAtTime(0.08, timeOffset);
  syncOsc.connect(syncGain);
  syncGain.connect(audioContext.destination);
  syncOsc.start(timeOffset);
  syncOsc.stop(timeOffset + noteLength);
  
  oscillators.push(syncOsc);
  timeOffset += noteLength + spaceLength;

  // 2. Queue up each digit sequentially
  digits.forEach((digit) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.frequency.value = frequencyMap[digit];
    osc.type = "sine";
    
    // Clean fade-in/fade-out to prevent popping noises
    gain.gain.setValueAtTime(0, timeOffset);
    gain.gain.linearRampToValueAtTime(0.08, timeOffset + 0.01);
    gain.gain.setValueAtTime(0.08, timeOffset + noteLength - 0.01);
    gain.gain.linearRampToValueAtTime(0, timeOffset + noteLength);

    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.start(timeOffset);
    osc.stop(timeOffset + noteLength);
    
    oscillators.push(osc);
    timeOffset += noteLength + spaceLength;
  });

  return oscillators;
}