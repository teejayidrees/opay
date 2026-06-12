export function createAudioContext() {
  return new (window.AudioContext || window.webkitAudioContext)();
}