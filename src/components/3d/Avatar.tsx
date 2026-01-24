import { useRef, memo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';

interface AvatarProps {
  onPositionChange?: (position: { x: number; z: number }) => void;
  teleportPos?: { x: number; z: number } | null;
  positionRef?: React.MutableRefObject<Vector3>;
}

/**
 * 3D 用户角色组件 (Avatar)
 * @description
 * 代表用户在 3D 场景中的化身。
 * 纯赛博朋克风格：蓝色发光球体 + 旋转光环。
 * 支持键盘控制 (WASD/方向键) 移动。
 */
export const Avatar = memo(({ onPositionChange, teleportPos, positionRef }: AvatarProps) => {
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  
  // 运动状态
  const [position] = useState(new Vector3(0, 2, 8)); // 初始位置
  const keys = useRef<{ [key: string]: boolean }>({});
  const speed = 0.2;

  // 处理瞬移
  useEffect(() => {
    if (teleportPos) {
      position.x = teleportPos.x;
      position.z = teleportPos.z;
      // 立即更新 mesh 位置以防闪烁
      if (meshRef.current) {
        meshRef.current.position.x = teleportPos.x;
        meshRef.current.position.z = teleportPos.z;
      }
      if (glowRef.current) {
        glowRef.current.position.x = teleportPos.x;
        glowRef.current.position.z = teleportPos.z;
      }
    }
  }, [teleportPos, position]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state) => {
    // 处理移动
    let dx = 0;
    let dz = 0;
    
    if (keys.current['ArrowUp'] || keys.current['KeyW']) dz -= speed;
    if (keys.current['ArrowDown'] || keys.current['KeyS']) dz += speed;
    if (keys.current['ArrowLeft'] || keys.current['KeyA']) dx -= speed;
    if (keys.current['ArrowRight'] || keys.current['KeyD']) dx += speed;
    
    if (dx !== 0 || dz !== 0) {
      position.x += dx;
      position.z += dz;
      
      // 边界限制 (可选)
      position.x = Math.max(-20, Math.min(20, position.x));
      position.z = Math.max(-20, Math.min(20, position.z));
      
      // 更新外部 ref
      if (positionRef) {
        positionRef.current.copy(position);
      }

      // 通知外部位置变化
      if (onPositionChange) {
        onPositionChange({ x: position.x, z: position.z });
      }
    }

    if (meshRef.current) {
      // 位置同步
      meshRef.current.position.x = position.x;
      meshRef.current.position.z = position.z;
      
      // 核心悬浮动画
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 2; 
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
    
    if (glowRef.current) {
      // 位置同步
      glowRef.current.position.x = position.x;
      glowRef.current.position.z = position.z;
      
      // 光晕反向旋转
      glowRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 2;
      glowRef.current.rotation.z = -state.clock.elapsedTime * 0.2;
      glowRef.current.rotation.x = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <>
      {/* 核心球体 */}
      <mesh ref={meshRef} castShadow>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial 
          color="#9945FF" 
          emissive="#7C3AED" 
          emissiveIntensity={2}
          roughness={0.2}
          metalness={0.8}
          wireframe={true}
        />
      </mesh>
      
      {/* 外层光晕 */}
      <mesh ref={glowRef}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshBasicMaterial 
          color="#14F195" 
          transparent 
          opacity={0.3} 
          wireframe 
        />
      </mesh>
    </>
  );
});
