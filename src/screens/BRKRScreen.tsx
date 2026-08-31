import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, PanResponder, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Game constants ────────────────────────────────────────────────────────────
const PADDLE_W = 80;
const PADDLE_H = 10;
const PADDLE_Y = SCREEN_H * 0.78;
const BALL_R = 7;
const BRICK_ROWS = 4;
const BRICK_COLS = 8;
const BRICK_H = 18;
const BRICK_GAP = 4;
const BRICK_TOP = 100;
const BALL_SPEED = 5.5;

type Brick = { x: number; y: number; w: number; h: number; alive: boolean };
type Ball = { x: number; y: number; vx: number; vy: number };

function initBricks(): Brick[] {
  const totalW = SCREEN_W - 32;
  const brickW = (totalW - (BRICK_COLS - 1) * BRICK_GAP) / BRICK_COLS;
  const bricks: Brick[] = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: 16 + c * (brickW + BRICK_GAP),
        y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
        w: brickW,
        h: BRICK_H,
        alive: true,
      });
    }
  }
  return bricks;
}

type Props = { onComplete: () => void };

export const BRKRScreen: React.FC<Props> = ({ onComplete }) => {
  const [paddleX, setPaddleX] = useState(SCREEN_W / 2 - PADDLE_W / 2);
  const [ball, setBall] = useState<Ball>({
    x: SCREEN_W / 2,
    y: PADDLE_Y - BALL_R - 2,
    vx: BALL_SPEED * 0.7,
    vy: -BALL_SPEED,
  });
  const [bricks, setBricks] = useState<Brick[]>(initBricks);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [score, setScore] = useState(0);

  const paddleXRef = useRef(paddleX);
  const ballRef = useRef(ball);
  const bricksRef = useRef(bricks);
  const livesRef = useRef(lives);
  const gameStateRef = useRef(gameState);
  const frameRef = useRef<number | null>(null);

  paddleXRef.current = paddleX;
  ballRef.current = ball;
  bricksRef.current = bricks;
  livesRef.current = lives;
  gameStateRef.current = gameState;

  // ── Game loop ──────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;

    const b = { ...ballRef.current };
    const px = paddleXRef.current;

    b.x += b.vx;
    b.y += b.vy;

    // Wall bounces
    if (b.x - BALL_R <= 0) { b.x = BALL_R; b.vx = Math.abs(b.vx); }
    if (b.x + BALL_R >= SCREEN_W) { b.x = SCREEN_W - BALL_R; b.vx = -Math.abs(b.vx); }
    if (b.y - BALL_R <= 60) { b.y = 60 + BALL_R; b.vy = Math.abs(b.vy); }

    // Paddle collision
    if (
      b.y + BALL_R >= PADDLE_Y &&
      b.y + BALL_R <= PADDLE_Y + PADDLE_H + 4 &&
      b.x >= px - 4 &&
      b.x <= px + PADDLE_W + 4 &&
      b.vy > 0
    ) {
      const hitPos = (b.x - px) / PADDLE_W; // 0–1
      const angle = (hitPos - 0.5) * 1.4; // -0.7 to 0.7 radians
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      b.vx = speed * Math.sin(angle);
      b.vy = -Math.abs(speed * Math.cos(angle));
      b.y = PADDLE_Y - BALL_R - 1;
    }

    // Ball lost
    if (b.y - BALL_R > SCREEN_H) {
      const newLives = livesRef.current - 1;
      if (newLives <= 0) {
        setGameState('lost');
        gameStateRef.current = 'lost';
        setTimeout(onComplete, 2500);
      } else {
        setLives(newLives);
        livesRef.current = newLives;
        b.x = SCREEN_W / 2;
        b.y = PADDLE_Y - BALL_R - 2;
        b.vx = BALL_SPEED * 0.7;
        b.vy = -BALL_SPEED;
      }
    }

    // Brick collisions
    let newBricks = [...bricksRef.current];
    let hit = false;
    let won = false;

    newBricks = newBricks.map(brick => {
      if (!brick.alive || hit) return brick;
      const closestX = Math.max(brick.x, Math.min(b.x, brick.x + brick.w));
      const closestY = Math.max(brick.y, Math.min(b.y, brick.y + brick.h));
      const dx = b.x - closestX;
      const dy = b.y - closestY;
      if (dx * dx + dy * dy <= BALL_R * BALL_R) {
        hit = true;
        const overlapX = b.x < brick.x + brick.w / 2 ? b.x - brick.x : brick.x + brick.w - b.x;
        const overlapY = b.y < brick.y + brick.h / 2 ? b.y - brick.y : brick.y + brick.h - b.y;
        if (Math.abs(overlapX) < Math.abs(overlapY)) {
          b.vx = -b.vx;
        } else {
          b.vy = -b.vy;
        }
        setScore(s => s + 10);
        return { ...brick, alive: false };
      }
      return brick;
    });

    if (newBricks.every(br => !br.alive)) {
      setGameState('won');
      gameStateRef.current = 'won';
      setTimeout(onComplete, 2500);
    }

    bricksRef.current = newBricks;
    setBricks(newBricks);
    setBall({ ...b });

    frameRef.current = requestAnimationFrame(tick);
  }, [onComplete]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [tick]);

  // ── Pan responder for paddle ───────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        const newX = Math.max(0, Math.min(gs.moveX - PADDLE_W / 2, SCREEN_W - PADDLE_W));
        setPaddleX(newX);
        paddleXRef.current = newX;
      },
    })
  ).current;

  const statusText = gameState === 'won'
    ? 'Session complete. Returning to expenditure data.'
    : gameState === 'lost'
    ? 'Session complete. Returning to expenditure data.'
    : null;

  return (
    <View style={styles.shell} {...panResponder.panHandlers}>
      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>BRKR</Text>
          <Text style={styles.score}>{score}</Text>
          <Text style={styles.lives}>{'● '.repeat(lives).trim()}</Text>
        </View>
      </SafeAreaView>

      {/* Bricks */}
      {bricks.map((brick, i) =>
        brick.alive ? (
          <View
            key={i}
            style={[
              styles.brick,
              {
                left: brick.x,
                top: brick.y,
                width: brick.w,
                height: brick.h,
              },
            ]}
          />
        ) : null
      )}

      {/* Ball */}
      <View
        style={[
          styles.ball,
          {
            left: ball.x - BALL_R,
            top: ball.y - BALL_R,
            width: BALL_R * 2,
            height: BALL_R * 2,
            borderRadius: BALL_R,
          },
        ]}
      />

      {/* Paddle */}
      <View
        style={[
          styles.paddle,
          {
            left: paddleX,
            top: PADDLE_Y,
            width: PADDLE_W,
            height: PADDLE_H,
          },
        ]}
      />

      {/* Game over overlay */}
      {statusText && (
        <View style={styles.overlay}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: Colors.bg,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  title: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: Colors.textDead,
    letterSpacing: 3,
    flex: 1,
  },
  score: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  lives: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.teal,
    letterSpacing: 2,
  },
  brick: {
    position: 'absolute',
    backgroundColor: Colors.teal,
    opacity: 0.85,
  },
  ball: {
    position: 'absolute',
    backgroundColor: '#F0F0F0',
  },
  paddle: {
    position: 'absolute',
    backgroundColor: Colors.teal,
    opacity: 0.7,
  },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  statusText: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.red,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.3,
  },
});
