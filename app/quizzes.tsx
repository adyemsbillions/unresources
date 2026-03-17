/*
  File: app/quiz-coming-soon.tsx
  Purpose: Coming Soon screen for Quizzes — cinematic dark/purple, floating orbs, orbital ring, staggered reveal
*/

import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, {
    Circle,
    Defs,
    G,
    Line,
    RadialGradient,
    Stop,
} from "react-native-svg";
import { C } from "./constants/theme";

const { width: W, height: H } = Dimensions.get("window");

// ── Orbital Ring SVG ─────────────────────────────────────────────────────────
function OrbitalRing({
  size,
  progress,
}: {
  size: number;
  progress: Animated.Value;
}) {
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  // Dot positions on ring (4 orbiting nodes)
  const nodes = [0, 90, 180, 270];

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={C.purpleMid} stopOpacity="0.5" />
          <Stop offset="60%" stopColor={C.purpleGlow} stopOpacity="0.12" />
          <Stop offset="100%" stopColor={C.bg} stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Background glow blob */}
      <Circle cx={cx} cy={cy} r={r * 0.85} fill="url(#coreGlow)" />

      {/* Outer orbit ring */}
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={C.purpleGlow}
        strokeWidth="1"
        strokeOpacity="0.2"
      />

      {/* Inner orbit ring */}
      <Circle
        cx={cx}
        cy={cy}
        r={r * 0.62}
        fill="none"
        stroke={C.purpleMid}
        strokeWidth="1"
        strokeOpacity="0.25"
        strokeDasharray="6 10"
      />

      {/* Cross-hair lines */}
      <Line
        x1={cx}
        y1={cy - r * 0.3}
        x2={cx}
        y2={cy + r * 0.3}
        stroke={C.purpleGlow}
        strokeWidth="1"
        strokeOpacity="0.3"
      />
      <Line
        x1={cx - r * 0.3}
        y1={cy}
        x2={cx + r * 0.3}
        y2={cy}
        stroke={C.purpleGlow}
        strokeWidth="1"
        strokeOpacity="0.3"
      />

      {/* Orbit nodes */}
      {nodes.map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const nx = cx + r * Math.cos(rad);
        const ny = cy + r * Math.sin(rad);
        return (
          <G key={i}>
            <Circle cx={nx} cy={ny} r={5} fill={C.purpleMid} opacity={0.7} />
            <Circle
              cx={nx}
              cy={ny}
              r={9}
              fill="none"
              stroke={C.purpleGlow}
              strokeWidth="1"
              opacity={0.4}
            />
          </G>
        );
      })}

      {/* Center core */}
      <Circle cx={cx} cy={cy} r={18} fill={C.purpleMid} opacity="0.3" />
      <Circle cx={cx} cy={cy} r={10} fill={C.purpleGlow} opacity="0.6" />
      <Circle cx={cx} cy={cy} r={5} fill="#fff" opacity="0.9" />
    </Svg>
  );
}

// ── Floating Particle ─────────────────────────────────────────────────────────
function Particle({
  x,
  y,
  size,
  delay,
  color,
}: {
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
}) {
  const floatY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatY, {
              toValue: -18,
              duration: 2200 + (delay % 800),
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(floatY, {
              toValue: 0,
              duration: 2200 + (delay % 800),
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.7,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.15,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
        ),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY: floatY }],
      }}
    />
  );
}

// ── Feature Row ───────────────────────────────────────────────────────────────
function FeatureItem({
  icon,
  label,
  delay,
  masterFade,
}: {
  icon: string;
  label: string;
  delay: number;
  masterFade: Animated.Value;
}) {
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: 0,
      delay,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.featureItem,
        { opacity: masterFade, transform: [{ translateX: slide }] },
      ]}
    >
      <View style={styles.featureIconWrap}>
        <Text style={styles.featureIcon}>{icon}</Text>
      </View>
      <Text style={styles.featureLabel}>{label}</Text>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function QuizComingSoon() {
  const router = useRouter();

  const masterFade = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.75)).current;
  const heroFloat = useRef(new Animated.Value(0)).current;
  const orbRotate = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(30)).current;
  const btnScale = useRef(new Animated.Value(0.9)).current;

  const ORBI_SIZE = Math.min(W * 0.62, 260);

  useEffect(() => {
    // Staggered entrance
    Animated.sequence([
      Animated.parallel([
        Animated.timing(masterFade, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(heroScale, {
          toValue: 1,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(titleSlide, {
          toValue: 0,
          delay: 200,
          tension: 70,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.spring(btnScale, {
          toValue: 1,
          delay: 600,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous orbit rotation
    Animated.loop(
      Animated.timing(orbRotate, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Hero gentle float
    Animated.loop(
      Animated.sequence([
        Animated.timing(heroFloat, {
          toValue: -10,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heroFloat, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const spinDeg = orbRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Particles config
  const particles = [
    { x: W * 0.08, y: H * 0.12, size: 6, delay: 0, color: C.purpleGlow },
    { x: W * 0.85, y: H * 0.1, size: 4, delay: 300, color: C.purpleMid },
    { x: W * 0.78, y: H * 0.35, size: 8, delay: 600, color: C.purpleGlow },
    { x: W * 0.05, y: H * 0.42, size: 5, delay: 900, color: C.purpleMid },
    { x: W * 0.9, y: H * 0.65, size: 6, delay: 200, color: C.purpleGlow },
    { x: W * 0.12, y: H * 0.72, size: 4, delay: 700, color: C.purpleMid },
    { x: W * 0.55, y: H * 0.08, size: 5, delay: 400, color: C.purpleGlow },
    { x: W * 0.35, y: H * 0.88, size: 7, delay: 100, color: C.purpleMid },
  ];

  const features = [
    { icon: "📚", label: "Subject-based practice tests" },
    { icon: "🏆", label: "Leaderboards & streak tracking" },
    { icon: "📶", label: "Full offline mode support" },
    { icon: "📊", label: "Detailed performance analytics" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Background particles */}
      {particles.map((p, i) => (
        <Particle key={i} {...p} />
      ))}

      {/* Subtle bg gradient circles */}
      <View
        style={[
          styles.bgBlob,
          { top: -80, left: -80, width: 280, height: 280, opacity: 0.08 },
        ]}
      />
      <View
        style={[
          styles.bgBlob,
          { bottom: 40, right: -100, width: 320, height: 320, opacity: 0.06 },
        ]}
      />

      {/* Back button top-left */}
      <Animated.View style={[styles.backTopWrap, { opacity: masterFade }]}>
        <TouchableOpacity
          style={styles.backTopBtn}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <Text style={styles.backTopText}>← Back</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Hero orbital */}
        <Animated.View
          style={[
            styles.heroWrap,
            {
              opacity: masterFade,
              transform: [{ scale: heroScale }, { translateY: heroFloat }],
            },
          ]}
        >
          {/* Rotating outer ring wrapper */}
          <Animated.View
            style={{ transform: [{ rotate: spinDeg }], position: "absolute" }}
          >
            <View
              style={{
                width: ORBI_SIZE + 40,
                height: ORBI_SIZE + 40,
                borderRadius: (ORBI_SIZE + 40) / 2,
                borderWidth: 1,
                borderColor: `${C.purpleGlow}30`,
                borderStyle: "dashed",
              }}
            />
          </Animated.View>

          <OrbitalRing size={ORBI_SIZE} progress={orbRotate} />
        </Animated.View>

        {/* Title block */}
        <Animated.View
          style={[
            styles.titleBlock,
            { opacity: masterFade, transform: [{ translateY: titleSlide }] },
          ]}
        >
          <Text style={styles.eyebrow}>COMING SOON</Text>
          <Text style={styles.title}>Quizzes</Text>
          <Text style={styles.tagline}>
            Practice smarter. Score higher.{"\n"}Built for UNIMAID students.
          </Text>
        </Animated.View>

        {/* Feature list */}
        <View style={styles.featureList}>
          {features.map((f, i) => (
            <FeatureItem
              key={i}
              icon={f.icon}
              label={f.label}
              delay={400 + i * 100}
              masterFade={masterFade}
            />
          ))}
        </View>

        {/* CTA button */}
        <Animated.View
          style={{ transform: [{ scale: btnScale }], opacity: masterFade }}
        >
          <TouchableOpacity style={styles.notifyBtn} activeOpacity={0.8}>
            <Text style={styles.notifyBtnText}>Notify Me When Live 🔔</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <Animated.Text style={[styles.footer, { opacity: masterFade }]}>
          We're building something you'll love 🚀
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  bgBlob: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: C.purpleMid,
  },

  backTopWrap: {
    position: "absolute",
    top: 56,
    left: 20,
    zIndex: 10,
  },
  backTopBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: C.border,
  },
  backTopText: {
    color: C.whiteMuted,
    fontSize: 14,
    fontWeight: "700",
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 20,
    gap: 0,
  },

  // Hero
  heroWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },

  // Title
  titleBlock: {
    alignItems: "center",
    marginBottom: 32,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: C.purpleGlow,
    letterSpacing: 4,
    marginBottom: 8,
    opacity: 0.9,
  },
  title: {
    fontSize: 48,
    fontWeight: "900",
    color: C.white,
    letterSpacing: -1.5,
    marginBottom: 14,
    textAlign: "center",
  },
  tagline: {
    fontSize: 16,
    color: C.whiteSoft,
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.85,
  },

  // Features
  featureList: {
    width: "100%",
    gap: 10,
    marginBottom: 36,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.purpleFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  featureIcon: { fontSize: 18 },
  featureLabel: {
    fontSize: 14,
    color: C.whiteMuted,
    fontWeight: "600",
    flex: 1,
  },

  // CTA
  notifyBtn: {
    backgroundColor: C.purpleMid,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 50,
    marginBottom: 20,
    shadowColor: C.purpleGlow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  notifyBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  footer: {
    fontSize: 13,
    color: C.faint,
    textAlign: "center",
    opacity: 0.7,
  },
});
