import React, { useMemo, useRef, useCallback } from "react";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { House, Heart, Chat, User } from "phosphor-react-native";
import * as Haptics from 'expo-haptics';

import { colors, spacingY, radius } from "@/constants/themes";
import { verticalScale, scale } from "@/utils/styling";
import { useChat } from "@/contexts/chatContext";
import { useAuth } from "@/contexts/AuthContext";
import Typo from "@/components/Typo";

export default function CustomTabs({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { rooms } = useChat();
  const { user } = useAuth();
  
  // Ref-based lock to prevent rapid double-tapping navigation crashes
  const isNavigating = useRef(false);

  // Memoized unread count for efficiency (O(n) where n is number of rooms)
  const unreadCount = useMemo(() => {
    if (!user?.uid || !rooms) return 0;
    return rooms.filter(room => {
      // Robust date parsing for crash prevention
      const lastRead = room.lastRead?.[user.uid]?.toDate?.() || new Date(0);
      const updatedAt = room.updatedAt?.toDate 
        ? room.updatedAt.toDate() 
        : new Date(room.updatedAt || 0);
      return updatedAt > lastRead;
    }).length;
  }, [rooms, user?.uid]);

  // Icon configuration moved to a stable object
  const tabbarIcons: Record<string, (isFocused: boolean) => React.ReactNode> = {
    index: (isFocused) => (
      <House 
        size={verticalScale(24)} 
        weight={isFocused ? "fill" : "duotone"} 
        color={isFocused ? colors.primary : colors.textLight} 
      />
    ),
    favourite: (isFocused) => (
      <Heart 
        size={verticalScale(24)} 
        weight={isFocused ? "fill" : "duotone"} 
        color={isFocused ? colors.primary : colors.textLight} 
      />
    ),
    inbox: (isFocused) => (
      <View>
        <Chat 
          size={verticalScale(24)} 
          weight={isFocused ? "fill" : "duotone"} 
          color={isFocused ? colors.primary : colors.textLight} 
        />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Typo color="white" size={10} fontWeight="800">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Typo>
          </View>
        )}
      </View>
    ),
    profile: (isFocused) => (
      <User 
        size={verticalScale(24)} 
        weight={isFocused ? "fill" : "duotone"} 
        color={isFocused ? colors.primary : colors.textLight} 
      />
    ),
  };

  const handlePress = useCallback((route: any, isFocused: boolean) => {
    if (isNavigating.current) return;
    
    // Playful tactile feedback
    Haptics.selectionAsync();

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      isNavigating.current = true;
      navigation.navigate(route.name, route.params);
      
      // Release lock after transition
      setTimeout(() => {
        isNavigating.current = false;
      }, 500);
    }
  }, [navigation]);

  return (
    <View style={styles.container}>
      <BlurView 
        intensity={Platform.OS === 'ios' ? 80 : 100} 
        tint="light" 
        style={styles.tabBar}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          
          return (
            <TouchableOpacity
              key={route.name}
              onPress={() => handlePress(route, isFocused)}
              activeOpacity={0.7}
              style={styles.tabBarItem}
            >
              <View style={[styles.pill, isFocused && styles.pillActive]}>
                {tabbarIcons[route.name]?.(isFocused)}
              </View>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    paddingBottom: Platform.OS === "ios" ? spacingY._25 : spacingY._15,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBar: {
    flexDirection: "row",
    width: "90%",
    height: verticalScale(64),
    borderRadius: radius._40, // More playful rounded look
    overflow: "hidden",
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabBarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: '100%',
  },
  pill: {
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(16),
    borderRadius: radius._20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: colors.primarySoft, // Using your new playful tint
  },
  badge: {
    position: 'absolute',
    right: -scale(6),
    top: -verticalScale(4),
    backgroundColor: colors.red,
    borderRadius: radius._10,
    minWidth: verticalScale(18),
    height: verticalScale(18),
    paddingHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  }
});