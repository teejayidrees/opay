import { frequencyMap } from "./frequencyMap";

export function encodeAccountNumber(accountNumber, audioContext) {
  const digits = accountNumber.split("");

  const oscillators = digits.map((digit) => {
    const osc = audioContext.createOscillator();
    osc.frequency.value = frequencyMap[digit];
    osc.type = "sine";

    const gain = audioContext.createGain();
    gain.gain.value = 0.05;

    osc.connect(gain);
    gain.connect(audioContext.destination);

    return osc;
  });

  return oscillators;
}