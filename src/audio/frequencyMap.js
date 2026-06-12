// export const frequencyMap = {
//   0: 17000,
//   1: 17200,
//   2: 17400,
//   3: 17600,
//   4: 17800,
//   5: 18000,
//   6: 18200,
//   7: 18400,
//   8: 18600,
//   9: 18800,
//   START: 19400, // Boundary Gate Open
//   END: 19800    // Boundary Gate Close
// };

// Clean 200Hz steps to keep it well within standard microphone range
export const frequencyMap = {
  0: 17200,
  1: 17400,
  2: 17600,
  3: 17800,
  4: 18000,
  5: 18200,
  6: 18400,
  7: 18600,
  8: 18800,
  9: 19000,
  SYNC: 19500 // The "Reset/Wake-Up" frequency
};