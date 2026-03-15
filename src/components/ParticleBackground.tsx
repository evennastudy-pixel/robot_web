'use client';

import React, { useEffect, useRef } from 'react';

interface ParticleBackgroundProps {
  particleCount?: number;
  particleSpread?: number;
  speed?: number;
  particleColors?: string[];
  moveParticlesOnHover?: boolean;
  particleHoverFactor?: number;
  alphaParticles?: boolean;
  particleBaseSize?: number;
  sizeRandomness?: number;
  cameraDistance?: number;
  disableRotation?: boolean;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
  alpha: number;
}

export default function ParticleBackground({
  particleCount = 200,
  particleSpread = 10,
  speed = 0.1,
  particleColors = ['#ffffff', '#5157E8', '#8b5cf6', '#3b82f6'],
  moveParticlesOnHover = true,
  particleHoverFactor = 1,
  alphaParticles = true,
  particleBaseSize = 2,
  sizeRandomness = 1,
  cameraDistance = 20,
  disableRotation = false,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ angleX: 0, angleY: 0 });
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置canvas大小
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 初始化粒子
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        const particle: Particle = {
          x: (Math.random() - 0.5) * particleSpread,
          y: (Math.random() - 0.5) * particleSpread,
          z: (Math.random() - 0.5) * particleSpread,
          vx: (Math.random() - 0.5) * speed * 0.02,
          vy: (Math.random() - 0.5) * speed * 0.02,
          vz: (Math.random() - 0.5) * speed * 0.02,
          size: particleBaseSize * (1 + Math.random() * sizeRandomness),
          color: particleColors[Math.floor(Math.random() * particleColors.length)],
          alpha: alphaParticles ? Math.random() * 0.5 + 0.5 : 1,
        };
        particlesRef.current.push(particle);
      }
    };
    initParticles();

    // 鼠标移动处理
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (moveParticlesOnHover) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // 3D投影函数
    const project = (x: number, y: number, z: number) => {
      const scale = cameraDistance / (cameraDistance + z);
      return {
        x: x * scale + canvas.width / 2,
        y: y * scale + canvas.height / 2,
        scale,
      };
    };

    // 旋转函数
    const rotate = (x: number, y: number, z: number, angleX: number, angleY: number) => {
      // 绕Y轴旋转
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;

      // 绕X轴旋转
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      return { x: x1, y: y1, z: z2 };
    };

    // 动画循环
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 更新旋转角度
      if (!disableRotation) {
        rotationRef.current.angleY += speed * 0.001;
        rotationRef.current.angleX += speed * 0.0005;
      }

      // 排序粒子（远的先画）
      const sortedParticles = [...particlesRef.current].sort((a, b) => {
        const rotatedA = rotate(a.x, a.y, a.z, rotationRef.current.angleX, rotationRef.current.angleY);
        const rotatedB = rotate(b.x, b.y, b.z, rotationRef.current.angleX, rotationRef.current.angleY);
        return rotatedA.z - rotatedB.z;
      });

      sortedParticles.forEach((particle) => {
        // 更新位置
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.z += particle.vz;

        // 鼠标交互
        if (moveParticlesOnHover) {
          particle.x += mouseRef.current.x * speed * particleHoverFactor * 0.01;
          particle.y += mouseRef.current.y * speed * particleHoverFactor * 0.01;
        }

        // 边界检查
        const boundary = particleSpread / 2;
        if (Math.abs(particle.x) > boundary) particle.vx *= -1;
        if (Math.abs(particle.y) > boundary) particle.vy *= -1;
        if (Math.abs(particle.z) > boundary) particle.vz *= -1;

        // 应用旋转
        const rotated = rotate(
          particle.x,
          particle.y,
          particle.z,
          rotationRef.current.angleX,
          rotationRef.current.angleY
        );

        // 投影到2D
        const projected = project(rotated.x * 50, rotated.y * 50, rotated.z * 50);

        // 绘制粒子
        if (projected.scale > 0) {
          const size = particle.size * projected.scale;
          const alpha = alphaParticles ? particle.alpha * projected.scale : particle.alpha;

          ctx.beginPath();
          ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
          
          // 创建渐变效果
          const gradient = ctx.createRadialGradient(
            projected.x,
            projected.y,
            0,
            projected.x,
            projected.y,
            size
          );
          
          const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result
              ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16),
                }
              : { r: 255, g: 255, b: 255 };
          };
          
          const rgb = hexToRgb(particle.color);
          gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`);
          gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
          
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (moveParticlesOnHover) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    particleCount,
    particleSpread,
    speed,
    particleColors,
    moveParticlesOnHover,
    particleHoverFactor,
    alphaParticles,
    particleBaseSize,
    sizeRandomness,
    cameraDistance,
    disableRotation,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'transparent' }}
    />
  );
}

