import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

/**
 * 相机跟随组件
 * @description 让相机跟随目标移动，同时保持当前的视角和距离（允许用户自由旋转）
 */
export const CameraFollower = ({ targetRef }: { targetRef: React.MutableRefObject<Vector3> }) => {
  const { camera, controls } = useThree();
  const lastPosition = useRef(new Vector3().copy(targetRef.current));

  useFrame(() => {
    if (!targetRef.current) return;
    
    const currentPos = targetRef.current;
    const dx = currentPos.x - lastPosition.current.x;
    const dz = currentPos.z - lastPosition.current.z;
    const dy = currentPos.y - lastPosition.current.y;

    // 只有当位置发生变化时才更新
    if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001 || Math.abs(dy) > 0.0001) {
      // 移动相机
      camera.position.x += dx;
      camera.position.z += dz;
      camera.position.y += dy;

      // 移动 OrbitControls 的目标点
      if (controls) {
        const orbitControls = controls as unknown as OrbitControlsImpl;
        orbitControls.target.x += dx;
        orbitControls.target.z += dz;
        orbitControls.target.y += dy;
        orbitControls.update();
      }

      // 更新上一帧位置
      lastPosition.current.copy(currentPos);
    }
  });

  return null;
};
