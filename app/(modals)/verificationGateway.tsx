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
  const [timeLeft, setTimeLeft] = useState(300);
  const isMounted = useRef(true);

  // Use !! to ensure boolean, and only show if user exists but isn't verified
  const isVisible = !!user && !user.emailVerified;

  useEffect(() => {
    isMounted.current = true;
    let pollTimeout: ReturnType<typeof setTimeout>;

    // RECURSIVE POLLING (Safe Pattern)
    // This ensures calls never overlap and don't block the UI thread
    const checkStatus = async () => {
      if (!isMounted.current || !isVisible) return;
      
      try {
        await reloadUser();
      } catch (e) {
        console.warn("Poll Error:", e);
      } finally {
        // Only schedule the next check if still visible and mounted
        if (isMounted.current && isVisible) {
          pollTimeout = setTimeout(checkStatus, 5000); // 5 seconds is standard for production
        }
      }
    };

    if (isVisible) {
      checkStatus();
    }

    return () => {
      isMounted.current = false;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [isVisible]);

  // Separate Timer for the Countdown (UI only)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isVisible) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isVisible]);

  const handleTimeout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Session Expired", 
      "Verification time limit reached. Please log in again.",
      [{ text: "OK", onPress: () => logout() }]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const now = Date.now();
      const stored = await AsyncStorage.getItem(VERIFY_LIMIT_KEY);
      let history = stored ? JSON.parse(stored) : [];
      history = history.filter((t: number) => now - t < 24 * 60 * 60 * 1000);

      if (history.length >= 3) {
        Alert.alert("Limit Reached", "Please wait 24 hours to resend again.");
        return;
      }

      await sendVerification();
      history.push(now);
      await AsyncStorage.setItem(VERIFY_LIMIT_KEY, JSON.stringify(history));
      Alert.alert("Link Sent", "Please check your inbox and spam folder.");
    } catch (error) {
      Alert.alert("Error", "Could not resend link.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Modal visible={isVisible} animationType="fade" transparent={false}>
      <View style={styles.container}>
        <Typo size={28} fontWeight="800">Verify Email</Typo>
        
        <View style={styles.timerBox}>
          <Typo color={colors.red} fontWeight="700">Expires in: {formatTime(timeLeft)}</Typo>
        </View>

        <Typo color={colors.textLight} style={styles.subtext}>
          We've sent a link to <Typo fontWeight="700">{user?.email}</Typo>. Click it to activate your account!
        </Typo>

        <View style={styles.statusBox}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Typo size={14} color={colors.textLight}>Waiting for verification...</Typo>
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
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacingX._25, alignItems: 'center', gap: 25 },
  subtext: { textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  timerBox: { backgroundColor: colors.red + '15', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primarySoft, padding: 15, borderRadius: 15, width: '100%', justifyContent: 'center' },
  logoutBtn: { padding: 10 },
});