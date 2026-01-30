import { useRef, useState, memo, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float, useCursor, Instances, Instance } from '@react-three/drei';
import { Mesh, Group, Vector3, MeshPhysicalMaterial, TorusGeometry, OctahedronGeometry, MeshBasicMaterial } from 'three';
import { Market } from '@/lib/api';
import { useQualityStore } from '@/stores/useQualityStore';

interface MarketArtifactProps {
  market: Market;
  position: [number, number, number];
  onSelect: (id: string) => void;
  onHover?: (market: Market | null, position: Vector3 | null) => void;
  isFocused?: boolean;
}

// ... (geometries and materials remain same)

/**
 * 共享的几何体和材质，用于实例化渲染
 */
const geometries = {
    crystal: new OctahedronGeometry(1, 0),
    ring1: new TorusGeometry(1.4, 0.02, 16, 32),
    ring2: new TorusGeometry(1.6, 0.02, 16, 32),
};

const materials = {
    crystalHigh: new MeshPhysicalMaterial({
        color: '#14F195',
        emissive: '#14F195',
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.1,
        transmission: 0.6,
        thickness: 2,
        clearcoat: 1
    }),
    crystalMedium: new MeshPhysicalMaterial({
        color: '#14F195',
        emissive: '#14F195',
        emissiveIntensity: 0.8,
        metalness: 0.5,
        roughness: 0.2,
        transmission: 0 // Disable transmission
    }),
    wireframe: new MeshBasicMaterial({ color: '#14F195', wireframe: true }),
    ringPurple: new MeshBasicMaterial({ color: '#9945FF', transparent: true, opacity: 0.4 }),
    ringGreen: new MeshBasicMaterial({ color: '#14F195', transparent: true, opacity: 0.4 })
};

/**
 * 单个实例化市场对象
 */
const MarketInstance = ({ market, position, onSelect, onHover, isFocused }: MarketArtifactProps) => {
    const groupRef = useRef<Group>(null);
    const [hovered, setHover] = useState(false);
    const [lodLevel, setLodLevel] = useState<'high' | 'medium' | 'low'>('high');
    const { lodDistance } = useQualityStore();
    
    useCursor(hovered);
    const offset = useMemo(() => Math.random() * 100, []);

    useFrame((state) => {
        // LOD Logic
        if (groupRef.current) {
            const dist = state.camera.position.distanceTo(groupRef.current.getWorldPosition(new Vector3()));
            if (dist < 15 * lodDistance) {
                if (lodLevel !== 'high') setLodLevel('high');
            } else if (dist < 40 * lodDistance) {
                if (lodLevel !== 'medium') setLodLevel('medium');
            } else {
                if (lodLevel !== 'low') setLodLevel('low');
            }
            
            // Scale animation
            const targetScale = (hovered || isFocused) ? 1.2 : 1;
            groupRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale } as any, 0.1);
        }
    });

    return (
        <group position={position} ref={groupRef}>
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                <group
                    onClick={(e) => { e.stopPropagation(); onSelect(market.marketId); }}
                    onPointerOver={(e) => {
                        e.stopPropagation();
                        setHover(true);
                        // Calculate screen position or world position for tooltip
                        if (groupRef.current) {
                            const worldPos = groupRef.current.getWorldPosition(new Vector3());
                            worldPos.y += 2; // Offset
                            onHover?.(market, worldPos);
                        }
                    }}
                    onPointerOut={() => {
                        setHover(false);
                        onHover?.(null, null);
                    }}
                >
                    {/* 根据 LOD 选择共享材质 */}
                    {lodLevel === 'low' ? (
                        <mesh geometry={geometries.crystal} material={materials.wireframe} />
                    ) : (
                        <mesh 
                            geometry={geometries.crystal} 
                            material={lodLevel === 'high' ? materials.crystalHigh : materials.crystalMedium}
                            castShadow={lodLevel === 'high'}
                        />
                    )}

                    {/* High Detail Rings */}
                    {lodLevel === 'high' && (
                        <>
                            <mesh geometry={geometries.ring1} material={materials.ringPurple} rotation={[Math.PI/2, 0, 0]} />
                            <mesh geometry={geometries.ring2} material={materials.ringGreen} rotation={[0, Math.PI/2, 0]} />
                            
                            {/* REMOVED LOCAL HTML OVERLAY - MOVED TO GLOBAL */}
                        </>
                    )}
                    
                    {(hovered || isFocused) && <pointLight distance={3} intensity={2} color="#9945FF" />}
                </group>
            </Float>
        </group>
    );
};

export const MarketArtifact = memo(MarketInstance);

