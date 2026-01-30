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
      
      {/* 基础环境光 - 大幅增强亮度，确保初始化时不黑屏 */}
      <ambientLight intensity={2.0} color="#6d28d9" />
      
      {/* 强烈的霓虹方向光 - 恢复高强度和阴影 */}
      <directionalLight 
        position={[50, 100, 50]} 
        intensity={3.0} 
        color="#9945FF" 
        castShadow 
      />
      
      {/* 顶部补光，确保网格清晰 */}
      <directionalLight 
        position={[0, 100, 0]} 
        intensity={2.0} 
        color="#ffffff" 
      />

      {/* 辅助蓝光 - 恢复大范围覆盖 */}
      <pointLight 
        position={[-50, 20, -50]} 
        intensity={3} 
        color="#14F195" 
        distance={400} 
      />
      
      {/* 深色迷雾，营造深邃感 - 大幅增加可视范围 */}
      <fog attach="fog" args={['#050505', 100, 500]} />

      {/* 动态星空 - 恢复高数量 */}
      <Stars radius={400} depth={100} count={8000} factor={6} saturation={0} fade speed={1} />

      {/* 赛博网格地面 - 缩减范围 */}
      <Grid 
        position={[0, -0.01, 0]}
        args={[300, 300]} 
        cellSize={4} 
        cellThickness={1.0} 
        cellColor="#9945FF" 
        sectionSize={20} 
        sectionThickness={1.5} 
        sectionColor="#14F195" 
        fadeDistance={150} 
        infiniteGrid 
      />
      
      {/* 反射地面 - 缩减物理平面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial 
          color="#0a0a0a" 
          emissive="#1a1a2e"
          emissiveIntensity={0.2}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.9}
        />
      </mesh>
    </>
  );
});
