import { useEffect, useRef, useCallback } from "react";
import { audioManager } from "@/lib/audio/AudioManager";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CarAudioProps {
  speed: number;
  isDrifting: boolean;
  position: THREE.Vector3;
  vehicleMode: "car" | "yacht" | "jet";
}

export const useCarAudio = () => {
  const engineOscRef = useRef<OscillatorNode | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);
  const tireNoiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const tireGainRef = useRef<GainNode | null>(null);
  const ambientNodeRef = useRef<OscillatorNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);
  const pannerRef = useRef<PannerNode | null>(null);
  
  const initialized = useRef(false);
  const currentMode = useRef<'car' | 'yacht' | 'jet'>('car');

  // 初始化音效系统
  const init = useCallback(() => {
    if (initialized.current) return;
    
    const ctx = audioManager.getContext();
    if (!ctx) return;

    // 1. 创建空间 Panner
    const panner = audioManager.createSpatialSource();
    if (!panner) return;
    panner.connect(audioManager.getMasterGain()!);
    pannerRef.current = panner;

    // 2. 引擎声 (合成器)
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const engineGain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = 60;
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    engineGain.gain.value = 0;

    osc.connect(filter);
    filter.connect(engineGain);
    engineGain.connect(panner);
    osc.start();

    engineOscRef.current = osc;
    engineGainRef.current = engineGain;

    // 3. 轮胎摩擦声
    const noiseBuffer = audioManager.createNoiseBuffer(2);
    if (noiseBuffer) {
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBuffer;
        noiseSrc.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1000;
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0;

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(panner);
        noiseSrc.start();

        tireNoiseNodeRef.current = noiseSrc;
        tireGainRef.current = noiseGain;
    }

    // 4. 环境音效 (Ambient Drone)
    const ambOsc = ctx.createOscillator();
    ambOsc.type = 'sine';
    ambOsc.frequency.value = 100;
    const ambGain = ctx.createGain();
    ambGain.gain.value = 0;
    
    ambOsc.connect(ambGain);
    ambGain.connect(audioManager.getMasterGain()!);
    ambOsc.start();
    
    ambientNodeRef.current = ambOsc;
    ambientGainRef.current = ambGain;

    initialized.current = true;
  }, []);

  const update = (
    speed: number,
    isDrifting: boolean,
    position: THREE.Vector3,
    vehicleMode: "car" | "yacht" | "jet" = "car",
  ) => {
    if (!initialized.current) {
      init();
      return;
    }

    const ctx = audioManager.getContext();
    if (!ctx || ctx.state === "suspended") return;

    const absSpeed = Math.abs(speed);
    const speedRatio = Math.min(absSpeed / 1.5, 1);

    // 模式切换逻辑
    if (vehicleMode !== currentMode.current) {
      currentMode.current = vehicleMode;
      if (engineOscRef.current) {
        // 根据模式改变波形
        if (vehicleMode === "jet") {
          engineOscRef.current.type = "sawtooth"; // 尖锐
        } else if (vehicleMode === "yacht") {
          engineOscRef.current.type = "sine"; // 低沉
        } else {
          engineOscRef.current.type = "square"; // 机械感
        }
      }
    }

    // --- 引擎声更新 ---
    if (engineOscRef.current && engineGainRef.current) {
      let targetFreq = 60;
      let targetVol = 0.1;

      if (vehicleMode === "jet") {
        // 喷气引擎：高频啸叫
        targetFreq = 200 + speedRatio * 800;
        targetVol = 0.2 + speedRatio * 0.3;
      } else if (vehicleMode === "yacht") {
        // 船舶引擎：低频轰鸣
        targetFreq = 40 + speedRatio * 100;
        targetVol = 0.3 + speedRatio * 0.2;
      } else {
        // 赛车引擎
        targetFreq = 60 + speedRatio * 340;
        targetVol = 0.1 + speedRatio * 0.2;
      }

      engineOscRef.current.frequency.setTargetAtTime(
        targetFreq,
        ctx.currentTime,
        0.1,
      );
      engineGainRef.current.gain.setTargetAtTime(
        targetVol,
        ctx.currentTime,
        0.1,
      );
    }

    // ... tire noise (disable for jet/yacht) ...
    if (tireGainRef.current) {
      let targetTireVol = 0;
      if (vehicleMode === "car") {
        if (isDrifting && absSpeed > 0.1) {
          targetTireVol = 0.4;
        } else if (absSpeed > 0.8) {
          targetTireVol = 0.05;
        }
      }
      tireGainRef.current.gain.setTargetAtTime(
        targetTireVol,
        ctx.currentTime,
        0.1,
      );
    }

    // ... ambient ...

    if (ambientNodeRef.current && ambientGainRef.current) {
      const windFreq = 100 + speedRatio * 200;
      const windVol = speedRatio * 0.1;

      ambientNodeRef.current.frequency.setTargetAtTime(
        windFreq,
        ctx.currentTime,
        0.5,
      );
      ambientGainRef.current.gain.setTargetAtTime(
        windVol,
        ctx.currentTime,
        0.5,
      );
    }

    // --- 空间位置更新 ---
    if (pannerRef.current) {
      pannerRef.current.positionX.value = position.x;
      pannerRef.current.positionY.value = position.y;
      pannerRef.current.positionZ.value = position.z;
    }
  };

  // 清理
  useEffect(() => {
    return () => {
      if (engineOscRef.current) engineOscRef.current.stop();
      if (tireNoiseNodeRef.current) tireNoiseNodeRef.current.stop();
      if (ambientNodeRef.current) ambientNodeRef.current.stop();

      engineGainRef.current?.disconnect();
      tireGainRef.current?.disconnect();
      ambientGainRef.current?.disconnect();
      pannerRef.current?.disconnect();
    };
  }, []);

  return { update };
};
