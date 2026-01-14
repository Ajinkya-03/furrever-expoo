import { scale, verticalScale } from "@/utils/styling";

export const colors = {
  // --- Core Brand (Pet Friendly Yellows) ---
  primary: "#f4a900",      // Dark Yellow (Paws & Sun)
  primaryLight: "#FFC133", // Brighter, more playful yellow
  primaryDark: "#d98b19",  // Muted Golden
  
  // --- Typography (Organic Earthy Browns) ---
  text: "#1b1a18",         // Deep Cocoa (High contrast)
  textLight: "#543e35",    // Medium Bark
  textLighter: "#9B6E50",  // Soft Tan
  
  // --- UI Accent Colors ---
  white: "#FFFFFF",
  black: "#000000",
  orange: "#e79700",
  red: "#E52020",
  green: "#366025",       // Forest Green (Nature)
  lightgreen: "#78C841",  // Grass Green (Playful)
  blue: "#33A1E0",        // Sky Blue
  gray: "#DDDAD0",
  
  // --- Surface & Backgrounds (Warm & Inviting) ---
  background: "#fdf4e3",     // Creamy Off-white
  backgroundDark: "#f3e6ce", // Soft Sand (Corrected double ##)
  card: "#FFFFFF",           // Clean white for cards
  
  // --- Playful Tints (For "Material Playful" indicators) ---
  primarySoft: "rgba(244, 169, 0, 0.12)", // Soft glow for active tabs/buttons
  successSoft: "rgba(120, 200, 65, 0.15)",
  errorSoft: "rgba(229, 32, 32, 0.10)",
};

export const spacingX = {
  _3: scale(3),
  _5: scale(5),
  _7: scale(7),
  _10: scale(10),
  _12: scale(12),
  _15: scale(15),
  _20: scale(20),
  _25: scale(25),
  _30: scale(30),
  _35: scale(35),
  _40: scale(40),
};

export const spacingY = {
  _5: verticalScale(5),
  _7: verticalScale(7),
  _10: verticalScale(10),
  _12: verticalScale(12),
  _15: verticalScale(15),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _25: verticalScale(25),
  _30: verticalScale(30),
  _35: verticalScale(35),
  _40: verticalScale(40),
  _50: verticalScale(50),
  _60: verticalScale(60),
};

export const radius = {
  _3: verticalScale(3),
  _6: verticalScale(6),
  _10: verticalScale(10),
  _12: verticalScale(12),
  _15: verticalScale(15),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _30: verticalScale(30),
  _40: verticalScale(40), 
};