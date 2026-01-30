import { OctahedronGeometry, TorusGeometry, MeshPhysicalMaterial, MeshBasicMaterial } from 'three';

/**
 * 共享的 3D 资源 (Geometry/Material)
 * 提取出来以便在 InstancedMesh 和普通 Mesh 之间复用
 */
export const MarketGeometries = {
    crystal: new OctahedronGeometry(1, 0),
    ring1: new TorusGeometry(1.4, 0.02, 16, 32),
    ring2: new TorusGeometry(1.6, 0.02, 16, 32),
};

export const MarketMaterials = {
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
        transmission: 0 // Disable transmission for medium/instanced
    }),
    wireframe: new MeshBasicMaterial({ color: '#14F195', wireframe: true }),
    ringPurple: new MeshBasicMaterial({ color: '#9945FF', transparent: true, opacity: 0.4 }),
    ringGreen: new MeshBasicMaterial({ color: '#14F195', transparent: true, opacity: 0.4 }),
    // New material for instancing (maybe slightly cheaper)
    crystalInstanced: new MeshPhysicalMaterial({
        color: '#14F195',
        emissive: '#14F195',
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2,
    })
};
