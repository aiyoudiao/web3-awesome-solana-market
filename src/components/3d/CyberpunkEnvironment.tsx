import { Grid, Environment, Stars } from '@react-three/drei';
import { memo } from 'react';

/**
 * 赛博朋克环境组件
 * @description 纯粹的暗黑科技风环境，包含网格、雾效和星空
 */
export const CyberpunkEnvironment = memo(() => {
  return (
    <>
      {/* 城市夜景光照预设 - 由于网络原因加载失败，暂时注释掉 */}
      {/* <Environment preset="city" blur={0.8} /> */}
      
      {/* 基础环境光 - 增强亮度以照亮网格 */}
      <ambientLight intensity={0.8} color="#4c1d95" />
      
      {/* 强烈的霓虹方向光 */}
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={2.5} 
        color="#9945FF" 
        castShadow 
      />
      
      {/* 顶部补光，确保网格清晰 */}
      <directionalLight 
        position={[0, 50, 0]} 
        intensity={1.5} 
        color="#ffffff" 
      />

      {/* 辅助蓝光 */}
      <pointLight 
        position={[-10, 5, -10]} 
        intensity={2} 
        color="#14F195" 
        distance={50}
      />
      
      {/* 深色迷雾，营造深邃感 */}
      <fog attach="fog" args={['#1B1B1F', 10, 60]} />

      {/* 动态星空 */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* 赛博网格地面 */}
      <Grid 
        position={[0, -0.01, 0]}
        args={[100, 100]} 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor="#9945FF" 
        sectionSize={5} 
        sectionThickness={1.5} 
        sectionColor="#14F195" 
        fadeDistance={50} 
        infiniteGrid 
      />
      
      {/* 反射地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color="#1B1B1F" 
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>
    </>
  );
});
