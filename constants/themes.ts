import { scale, verticalScale } from "@/utils/styling";

export const colors = {
  primary: "#f4a900", //dark yellow
  primaryLight: "#d4a017", //bright yellow
  primaryDark: "#d98b19",  //muted yellow
  text: "#1b1a18",    //dark brown
  textLight: "#543e35", //medium brown
  textLighter: "#9B6E50", //light brown
  white: "#fff", //white
  black: "#000", //black
  orange: "#e79700", //dark orange
  red: "#E52020", //red
  green: "#366025", //dark green
  lightgreen: "#78C841", //light green
  blue: "#33A1E0",
  gray: "#DDDAD0", //gray

  background: "#fdf4e3", //off white
  backgroundDark: "##f3e6ce", //light gray
  
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
};
