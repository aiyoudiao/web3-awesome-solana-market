import { useRef, useEffect, useState, memo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, MathUtils } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export type CameraMode = 'follow' | 'top' | 'driver';

interface CameraFollowerProps {
  targetRef: React.MutableRefObject<Vector3>;
  headingRef?: React.MutableRefObject<number>;
  mode?: CameraMode; // Allow external control if needed
  onModeChange?: (mode: CameraMode) => void;
}

/**
 * 多模式相机跟随组件
 * @description 
 * 支持三种视角切换：
 * 1. Follow (默认): 自由旋转的第三人称跟随
 * 2. Top: 俯视上帝视角 (固定方向)
 * 3. Driver: 第一人称驾驶视角 (锁定方向)
 */
export const CameraFollower = memo(({ targetRef, headingRef, mode: externalMode, onModeChange }: CameraFollowerProps) => {
  const { camera, controls } = useThree();
  const [internalMode, setInternalMode] = useState<CameraMode>('follow');
  const mode = externalMode || internalMode;
  
  const lastPosition = useRef(new Vector3().copy(targetRef.current));
  
  // 平滑过渡的目标参数
  const targetOffset = useRef(new Vector3(0, 15, 25)); // Default follow offset
  const lookAtOffset = useRef(new Vector3(0, 0, 0));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyC') {
        const nextMode = mode === 'follow' ? 'top' : mode === 'top' ? 'driver' : 'follow';
        
        // 如果有外部控制，只通知外部；否则更新内部状态
        if (onModeChange) {
            onModeChange(nextMode);
        } else {
            setInternalMode(nextMode);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, onModeChange]);

  // Reset camera when switching to follow mode
  useEffect(() => {
      if (mode === 'follow' && targetRef.current) {
          const currentPos = targetRef.current;
          // Reset to standard offset: up 15, back 25
          const offset = new Vector3(0, 15, 25);
          // Only update position if we are switching FROM another mode (not continuous update)
          // Actually, let's trust OrbitControls to handle position relative to target if we just set target correctly?
          // No, we need to reset camera position relative to target once.
          
          camera.position.copy(currentPos).add(offset);
          camera.lookAt(currentPos);
          
          if (controls) {
              const orbitControls = controls as unknown as OrbitControlsImpl;
              orbitControls.target.copy(currentPos);
              // Important: Sync lastPosition to avoid jump
              lastPosition.current.copy(currentPos);
              orbitControls.update();
          }
      }
  }, [mode, camera, controls, targetRef]);

  useFrame((state, delta) => {
    if (!targetRef.current) return;
    
    const currentPos = targetRef.current;
    const heading = headingRef?.current || 0;
    const orbitControls = controls as unknown as OrbitControlsImpl;

    if (mode === 'follow') {
        // === 模式 1: 标准跟随 ===
        // 保持 OrbitControls 的自由度，只更新 target
        // 相机位置随 target 移动，保持相对偏移
        
        // 增加平滑系数 (Damping)
        const smoothing = 0.1; // 值越小越平滑，但也越延迟
        
        // 目标位置
        const targetPos = currentPos.clone();
        
        // 计算当前相机相对于目标的偏移
        // 注意：这里我们希望相机跟随目标移动，但不改变相对角度
        // OrbitControls 已经在处理旋转，我们只需要更新相机和target的世界坐标
        
        // 直接计算差值
        const dx = targetPos.x - lastPosition.current.x;
        const dz = targetPos.z - lastPosition.current.z;
        const dy = targetPos.y - lastPosition.current.y;

        // 如果移动距离极小，忽略以防微颤
        if (dx*dx + dy*dy + dz*dz < 0.000001) return;

        // 柔和跟随：不是直接加 dx，而是 lerp
        // 但 OrbitControls 需要相机和 target 保持刚性同步，否则旋转中心会偏
        // 所以我们必须同步移动 camera 和 controls.target
        
        // 方案 B: 
        // lastPosition 追踪的是 "相机当前锁定的虚拟目标位置"
        // 我们每一帧让这个虚拟目标向真实目标 (currentPos) 靠近
        
        lastPosition.current.lerp(targetPos, smoothing);
        
        // 实际移动量 (这一帧的增量)
        const moveX = lastPosition.current.x - (camera.position.x - (camera.position.x - lastPosition.current.x)); 
        // Wait, simpler:
        // We want controls.target to be at lastPosition.current
        
        if (orbitControls) {
            // 计算 controls.target 需要移动多少才能到达 lastPosition.current
            const diffX = lastPosition.current.x - orbitControls.target.x;
            const diffZ = lastPosition.current.z - orbitControls.target.z;
            const diffY = lastPosition.current.y - orbitControls.target.y;
            
            // 应用移动到相机和target
            camera.position.x += diffX;
            camera.position.z += diffZ;
            camera.position.y += diffY;
            
            orbitControls.target.copy(lastPosition.current);
            orbitControls.update();
        } else {
             // Fallback without controls
             const offset = camera.position.clone().sub(lastPosition.current); // old offset
             // This logic is tricky without controls reference. 
             // Ideally we always have controls.
        }
        
        // 确保 controls 启用
        if (orbitControls) {
            orbitControls.enabled = true;
            orbitControls.maxPolarAngle = Math.PI / 2.1;
            orbitControls.minDistance = 5;
            orbitControls.maxDistance = 100;
        }

    } else if (mode === 'top') {
        // === 模式 2: 上帝视角 ===
        // 固定相机在正上方，禁止旋转
        
        const desiredPos = new Vector3(currentPos.x, 50, currentPos.z); // High altitude
        
        // 平滑移动相机
        camera.position.lerp(desiredPos, 0.05);
        
        if (orbitControls) {
            orbitControls.target.lerp(currentPos, 0.1);
            // 锁定旋转
            orbitControls.enabled = false; // Disable user interaction
            camera.lookAt(currentPos); // Ensure looking down
        }

    } else if (mode === 'driver') {
        // === 模式 3: 驾驶视角 ===
        // 相机位于车内，随车旋转
        
        // 计算驾驶员眼睛位置：车身中心 + 旋转偏移
        // 假设驾驶员位置：相对车身 {x:0, y:0.8, z:0.2}
        const offset = new Vector3(0, 0.8, 0.2);
        
        // 应用旋转
        // 简单旋转：x = x*cos - z*sin, z = x*sin + z*cos
        const rotatedX = offset.x * Math.cos(heading) + offset.z * Math.sin(heading);
        const rotatedZ = -offset.x * Math.sin(heading) + offset.z * Math.cos(heading);
        
        const driverPos = new Vector3(
            currentPos.x + rotatedX,
            currentPos.y + offset.y,
            currentPos.z + rotatedZ
        );
        
        // 观察点：车前方 10 米
        const lookDist = 10;
        const lookTarget = new Vector3(
            currentPos.x + Math.sin(heading) * lookDist,
            currentPos.y + 0.5,
            currentPos.z + Math.cos(heading) * lookDist
        );

        // 硬锁定位置 (无延迟，避免眩晕)
        camera.position.copy(driverPos);
        camera.lookAt(lookTarget);
        
        if (orbitControls) {
            orbitControls.enabled = false;
            orbitControls.target.copy(lookTarget);
        }
    }
  });

  return null;
});
