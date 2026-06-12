export function detectFrequencies(analyser, bufferLength, dataArray) {
  analyser.getByteFrequencyData(dataArray);

  let maxIndex = 0;

  for (let i = 1; i < bufferLength; i++) {
    if (dataArray[i] > dataArray[maxIndex]) {
      maxIndex = i;
    }
  }

  return maxIndex;
}