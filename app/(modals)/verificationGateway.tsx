import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import Typo from '@/components/Typo';
import Button from '@/components/Button';
import { colors, spacingY, spacingX } from '@/constants/themes';

const VERIFY_LIMIT_KEY = "@verify_resend_limit";

const VerificationGateway = () => {
  const { user, sendVerification, logout, reloadUser } = useAuth();
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 Minutes
  const isBusy = useRef(false);

  const isVisible = !!user && !user.emailVerified;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let timer: ReturnType<typeof setInterval>;

    if (isVisible) {
      // Polling for status
      interval = setInterval(() => reloadUser(), 3000);

      // Countdown timer
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            clearInterval(interval);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timer) clearInterval(timer);
    };
  }, [isVisible]);

  const handleTimeout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Session Expired", 
      "Verification time limit reached. Logging out.",
      [{ text: "OK", onPress: () => logout() }]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleResend = async () => {
    if (isBusy.current) return;
    isBusy.current = true;
    try {
      const now = Date.now();
      const stored = await AsyncStorage.getItem(VERIFY_LIMIT_KEY);
      let history = stored ? JSON.parse(stored) : [];
      history = history.filter((t: number) => now - t < 24 * 60 * 60 * 1000);

      if (history.length >= 3) {
        Alert.alert("Limit Reached", "Max 3 resends per day.");
        return;
      }

      setResendLoading(true);
      await sendVerification();
      setResendLoading(false);
      
      history.push(now);
      await AsyncStorage.setItem(VERIFY_LIMIT_KEY, JSON.stringify(history));
      Alert.alert("Sent", "Check your email!");
    } finally {
      setTimeout(() => { isBusy.current = false; }, 1000);
    }
  };

  return (
    <Modal visible={isVisible} animationType="fade">
      <View style={styles.container}>
        <Typo size={28} fontWeight="800">Verify Email</Typo>
        
        <View style={styles.timerBox}>
          <Typo color={colors.red} fontWeight="700">Ends in: {formatTime(timeLeft)}</Typo>
        </View>

        <Typo color={colors.textLight} style={styles.subtext}>
          Please verify <Typo fontWeight="700">{user?.email}</Typo> to join the pack!
        </Typo>

        <View style={styles.statusBox}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Typo size={14} color={colors.textLight}>Waiting for link click...</Typo>
        </View>

        <Button loading={resendLoading} onPress={handleResend} style={{ width: '100%' }}>
          <Typo color={colors.background} fontWeight="700">Resend Link</Typo>
        </Button>

        <TouchableOpacity onPress={() => logout()} style={styles.logoutBtn}>
          <Typo color={colors.red} fontWeight="600">Cancel & Logout</Typo>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default VerificationGateway;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacingX._25, alignItems: 'center', gap: 20 },
  subtext: { textAlign: 'center', lineHeight: 22 },
  timerBox: { backgroundColor: colors.red + '15', padding: 8, borderRadius: 20 },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primarySoft, padding: 15, borderRadius: 15 },
  logoutBtn: { marginTop: 10 },
});