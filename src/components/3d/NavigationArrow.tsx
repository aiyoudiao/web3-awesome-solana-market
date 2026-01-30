import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion, Object3D } from 'three';
import { useStore } from '@/lib/store';

interface NavigationArrowProps {
  target: Vector3;
}

/**
 * AR 导航箭头
 * @description
 * 在赛车前方显示一个动态箭头，指向当前选中的目标（或最近的市场）。
 */
export const NavigationArrow = ({ target }: NavigationArrowProps) => {
  const arrowRef = useRef<Object3D>(null);
  const { playerPos } = useStore();
  
  useFrame((state) => {
    if (!arrowRef.current) return;
    
    // 1. 获取玩家当前位置
    const currentPos = new Vector3(playerPos.x, 1, playerPos.z);
    
    // 2. 计算方向向量
    const direction = target.clone().sub(currentPos).normalize();
    
    // 3. 计算距离
    const distance = currentPos.distanceTo(target);
    
    // 4. 将箭头放置在玩家前方 3 米处
    const arrowPos = currentPos.clone().add(direction.clone().multiplyScalar(3));
    arrowRef.current.position.copy(arrowPos);
    
    // 5. 让箭头朝向目标
    arrowRef.current.lookAt(target);
    
    // 6. 动画效果：上下浮动 + 距离越近越透明
    arrowRef.current.position.y += Math.sin(state.clock.elapsedTime * 3) * 0.2;
    
    // 7. 如果非常近了，隐藏箭头
    arrowRef.current.visible = distance > 4;
  });

  return (
    <group ref={arrowRef}>
      {/* 箭头主体 */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <coneGeometry args={[0.3, 0.8, 4]} />
        <meshBasicMaterial color="#14F195" transparent opacity={0.8} depthTest={false} />
      </mesh>
      {/* 脉冲光环 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.4]}>
        <ringGeometry args={[0.2, 0.3, 16]} />
        <meshBasicMaterial color="#9945FF" transparent opacity={0.5} depthTest={false} />
      </mesh>
    </group>
  );
};
