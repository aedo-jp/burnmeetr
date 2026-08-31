import React from 'react';
import { View, StyleSheet } from 'react-native';

// Layered glass lens effect — pure View/opacity, no LinearGradient
// Works in Expo Go without a native rebuild

type Props = {
  width: number;
  height: number;
  isOverrun?: boolean;
};

export const OdometerLens: React.FC<Props> = ({ width, height, isOverrun = false }) => {
  const tintColor = isOverrun
    ? 'rgba(120, 0, 0, 0.07)'
    : 'rgba(180, 200, 220, 0.03)';

  const edgeColor = isOverrun
    ? 'rgba(180,0,0,0.15)'
    : 'rgba(255,255,255,0.07)';

  return (
    <View style={[styles.lens, { width, height }]} pointerEvents="none">

      {/* Left vignette */}
      <View style={[styles.vignetteLeft, { backgroundColor: 'rgba(0,0,0,0.28)' }]} />

      {/* Right vignette */}
      <View style={[styles.vignetteRight, { backgroundColor: 'rgba(0,0,0,0.28)' }]} />

      {/* Top edge darkening */}
      <View style={[styles.edgeTop, { backgroundColor: 'rgba(0,0,0,0.32)' }]} />

      {/* Bottom edge darkening */}
      <View style={[styles.edgeBottom, { backgroundColor: 'rgba(0,0,0,0.32)' }]} />

      {/* Glass body tint */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tintColor }]} />

      {/* Specular highlight — thin bar across top, simulating convex glass */}
      <View style={styles.specularHighlight} />

      {/* Secondary specular — slightly dimmer, just below the first */}
      <View style={styles.specularSecondary} />

      {/* Lens bezel border */}
      <View style={[styles.lensEdge, { borderColor: edgeColor }]} />

    </View>
  );
};

const styles = StyleSheet.create({
  lens: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
    borderRadius: 4,
  },
  vignetteLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '18%',
    opacity: 0.7,
  },
  vignetteRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '18%',
    opacity: 0.7,
  },
  edgeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '22%',
    opacity: 0.6,
  },
  edgeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '22%',
    opacity: 0.6,
  },
  specularHighlight: {
    position: 'absolute',
    top: 0,
    left: '8%',
    right: '8%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 1,
  },
  specularSecondary: {
    position: 'absolute',
    top: 3,
    left: '15%',
    right: '15%',
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  lensEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 0.5,
    borderRadius: 4,
  },
});
