import { useRef, useMemo, useState, useLayoutEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance } from '@react-three/drei';
import { InstancedMesh, Object3D, Vector3 } from 'three';
import { Market } from '@/lib/api';
import { MarketGeometries, MarketMaterials } from './MarketResources';

interface MarketInstancedMeshProps {
  markets: Market[];
  positions: { id: string; position: Vector3 }[];
  onSelect: (id: string) => void;
  onHover: (market: Market | null, position: Vector3 | null) => void;
  hoveredId: string | null;
}

// 单个实例组件 - 使用 memo 防止非相关项重渲染
const MarketInstance = memo(({ id, initialPosition, phase, market, onSelect, onHover, isHovered }: any) => {
    const ref = useRef<any>(null);
    const [hover, setHover] = useState(false);

    useFrame((state) => {
        if (ref.current) {
            // Distance check for LOD/Culling animation
            const dist = state.camera.position.distanceTo(ref.current.position);
            // If too far, skip animation (but keep position/rotation static)
            // Or just update less frequently. For now, simple culling.
            if (dist > 50) return;

            const t = state.clock.getElapsedTime();
            // 简单的上下漂浮
            ref.current.position.y = initialPosition.y + Math.sin(t * 2 + phase) * 0.5;
            
            // 悬停缩放
            const targetScale = (hover || isHovered) ? 1.5 : 1.0;
            ref.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale } as any, 0.1);
            
            // 旋转
            ref.current.rotation.y += 0.01;
            ref.current.rotation.z = Math.sin(t + phase) * 0.1;
        }
    });

    return (
        <Instance
            ref={ref}
            position={initialPosition}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(id);
            }}
            onPointerOver={(e) => {
                e.stopPropagation();
                setHover(true);
                // 这里的 e.point 是世界坐标
                // 我们需要传递正确的 tooltip 位置
                // Instance 的位置是在不断变化的 (floating)
                // 可以直接传 ref.current 的位置
                if (ref.current) {
                    // Instance 是一个 Group-like 代理，可以直接获取位置吗？
                    // Drei 的 Instance ref 暴露了 position/rotation/scale
                    // 但 getWorldPosition 需要 matrixWorld
                    // 简单起见，我们用 e.point + offset
                    onHover(market, new Vector3(e.point.x, e.point.y + 2, e.point.z));
                }
            }}
            onPointerOut={() => {
                setHover(false);
                onHover(null, null);
            }}
            // Instance 支持 color prop，可以给悬停的高亮
            color={hover || isHovered ? "#FFFFFF" : "#14F195"}
        />
    );
});

/**
 * 实例化市场渲染组件 (GPU Instancing)
 * @description
 * 使用 <Instances> 批量渲染所有市场水晶，将 Draw Calls 从 N 降至 1。
 * 实现漂浮动画：在 useFrame 中直接操作 Instance 的 Matrix。
 */
export const MarketInstancedMesh = memo(({ markets, positions, onSelect, onHover, hoveredId }: MarketInstancedMeshProps) => {
  // 预计算随机相位，让每个水晶漂浮步调不一致
  const phases = useMemo(() => {
    return markets.map(() => Math.random() * Math.PI * 2);
  }, [markets]);

  // 临时对象用于矩阵计算，避免 GC
  const tempObject = useMemo(() => new Object3D(), []);

  // 引用 Instances 的内部 InstancedMesh
  // 注意：Drei 的 <Instances> 内部其实管理了一个 InstancedMesh
  // 如果我们需要手动更新 matrix，通常是在 Instance 组件上做，或者在父级做
  // 但 Drei 的 Instance 提供了很好的抽象，允许我们像操作普通组件一样操作
  
  return (
    <Instances 
      range={markets.length} 
      geometry={MarketGeometries.crystal} 
      material={MarketMaterials.crystalInstanced}
    >
      {markets.map((market, i) => {
        const pos = positions[i]?.position || new Vector3();
        return (
          <MarketInstance 
             key={market.marketId}
             id={market.marketId}
             initialPosition={pos}
             phase={phases[i]}
             market={market}
             onSelect={onSelect}
             onHover={onHover}
             isHovered={hoveredId === market.marketId}
          />
        );
      })}
    </Instances>
  );
});
