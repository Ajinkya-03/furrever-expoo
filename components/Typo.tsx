import React from "react";
import { Text, TextStyle } from "react-native";
import { TypoProps } from "@/types";
import { colors } from "@/constants/themes";
import { verticalScale } from "@/utils/styling";

const Typo: React.FC<TypoProps> = ({
  size,
  color = colors.text,
  fontWeight = "400",
  children,
  style,
  textProps = {},
}) => {
  // Guard against undefined/null
  if (children === undefined || children === null) {
    console.warn("Typo received empty children");
    return null;
  }

  // Convert numbers/booleans to string to avoid raw primitive issues
  const normalizedChildren =
    typeof children === "number" || typeof children === "boolean"
      ? String(children)
      : children;

  const textStyle: TextStyle = {
    fontSize: size ? verticalScale(size) : verticalScale(18),
    color,
    fontWeight,
  };

  return (
    <Text style={[textStyle, style]} {...textProps}>
      {normalizedChildren}
    </Text>
  );
};

export default Typo;
