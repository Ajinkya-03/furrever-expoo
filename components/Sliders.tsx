import React, { useState, useEffect } from "react";
import { StyleSheet, FlatList, FlatListProps, Image, Dimensions } from "react-native";
import Animated, {
  interpolate,
  Extrapolate,
  useDerivedValue,
  useAnimatedStyle,
  FadeInDown,
} from "react-native-reanimated";
import { firestore } from "@/config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { SliderProps } from "@/types";
import { verticalScale } from "@/utils/styling";
import { colors, radius } from "@/constants/themes";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SRC_WIDTH = Dimensions.get("window").width;
const CARD_LENGTH = SRC_WIDTH * 0.75;
const SPACING = SRC_WIDTH * 0.02;
const SIDECARD_LENGTH = (SRC_WIDTH - CARD_LENGTH) / 2;
const FULL_INTERVAL = CARD_LENGTH + SPACING;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as React.ComponentType<
  FlatListProps<SliderProps>
>;

interface ItemProps {
  index: number;
  scrollX: number;
  item: SliderProps;
}

function Item({ index, scrollX, item }: ItemProps) {
  const inputRange = [
    (index - 1) * FULL_INTERVAL,
    index * FULL_INTERVAL,
    (index + 1) * FULL_INTERVAL,
  ];

  const scale = useDerivedValue(() =>
    interpolate(scrollX, inputRange, [0.8, 1, 0.8], Extrapolate.CLAMP)
  );
  const opacity = useDerivedValue(() =>
    interpolate(scrollX, inputRange, [0.7, 1, 0.7], Extrapolate.CLAMP)
  );
  const rotate = useDerivedValue(() =>
    interpolate(scrollX, inputRange, [10, 0, -10], Extrapolate.CLAMP)
  );

  const cardStyle = useAnimatedStyle(() => {
    const rotateY = `${rotate.value}deg`;
    return {
      transform: [
        { perspective: 800 },
        { scale: scale.value },
        { rotateY },
        { translateX: rotate.value > 0 ? -10 : rotate.value < 0 ? 10 : 0 },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View entering={FadeInDown.duration(1000).delay(1000).damping(20)}>
      <Animated.View style={[styles.card, cardStyle, { marginRight: SPACING }]}>
        <Image
          source={{ uri: item.imageUrl }}
          style={{ width: "100%", height: "100%", resizeMode: "cover" }}
        />
      </Animated.View>
    </Animated.View>
  );
}

// Helpers for caching
const saveSlidersToCache = async (sliders: SliderProps[]) => {
  try {
    await AsyncStorage.setItem("cachedSliders", JSON.stringify(sliders));
  } catch {}
};

const loadSlidersFromCache = async (): Promise<SliderProps[] | null> => {
  try {
    const cached = await AsyncStorage.getItem("cachedSliders");
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

export default function Sliders() {
  const [scrollX, setScrollX] = useState(0);
  const [data, setData] = useState<SliderProps[]>([]);

  useEffect(() => {
    const fetchSliders = async () => {
      //  Load cached sliders immediately
      const cached = await loadSlidersFromCache();
      if (cached) setData(cached);

      //  Fetch fresh sliders from Firestore
      try {
        const querySnapshot = await getDocs(collection(firestore, "sliders"));
        const sliders: SliderProps[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<SliderProps, "id">),
        }));
        setData(sliders);
        saveSlidersToCache(sliders); // Update cache
      } catch {}
    };

    fetchSliders();
  }, []);

  return (
    <Animated.View>
      <AnimatedFlatList
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        decelerationRate={"fast"}
        snapToInterval={FULL_INTERVAL}
        disableIntervalMomentum={false}
        snapToAlignment={"center"}
        data={data}
        horizontal
        contentContainerStyle={{
          paddingHorizontal: SIDECARD_LENGTH - SPACING / 2,
        }}
        renderItem={({ item, index }) => (
          <Item index={index} scrollX={scrollX} item={item as SliderProps} />
        )}
        keyExtractor={(item) => item.id}
        onScroll={(event) => {
          setScrollX(event.nativeEvent.contentOffset.x);
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_LENGTH,
    height: verticalScale(200),
    overflow: "hidden",
    borderRadius: radius._17,
    borderCurve: "continuous",
    // shadowColor: colors.primaryDark,
    // shadowOffset: { width: 0, height: -10 },
    // elevation: 10,
    // shadowRadius: 5,
    // shadowOpacity: 0.15,
  },
});
