import { Grid, Stars, Cloud, Sky, MeshReflectorMaterial } from '@react-three/drei';
import { memo, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Aurora, MythicWater } from './MythicEffects';
import { useQualityStore } from '@/stores/useQualityStore';
import { createRuneTexture } from './runes';
import { AdditiveBlending } from 'three';
import { TRINITY_MODES } from '@/mythic/trinity';

const LandEnvironment = memo(() => {
  const { level, shadows, shadowMapSize, visualPreset } = useQualityStore();
  const palette = TRINITY_MODES.car.environment.palette;

  const starCount = useMemo(() => {
    if (level === 'low') return 0;
    if (level === 'medium') return 600;
    if (level === 'high') return 900;
    return 1200;
  }, [level]);

  const gridColors = useMemo(() => {
    if (visualPreset === 'esports') {
      return { cell: palette.primary, section: palette.accent };
    }
    return { cell: '#B026FF', section: '#00F0FF' };
  }, [palette.accent, palette.primary, visualPreset]);

  const grid = useMemo(() => {
    if (visualPreset === 'esports') {
      if (level === 'low') return { cellSize: 6, sectionSize: 48, fadeDistance: 80, cellThickness: 0.4, sectionThickness: 1.1 };
      if (level === 'medium') return { cellSize: 5, sectionSize: 45, fadeDistance: 95, cellThickness: 0.45, sectionThickness: 1.2 };
      if (level === 'high') return { cellSize: 4.5, sectionSize: 42, fadeDistance: 110, cellThickness: 0.5, sectionThickness: 1.3 };
      return { cellSize: 4.5, sectionSize: 42, fadeDistance: 120, cellThickness: 0.55, sectionThickness: 1.35 };
    }
    if (level === 'low') return { cellSize: 4.5, sectionSize: 45, fadeDistance: 120, cellThickness: 0.22, sectionThickness: 2.6 };
    if (level === 'medium') return { cellSize: 4.0, sectionSize: 40, fadeDistance: 170, cellThickness: 0.18, sectionThickness: 3.0 };
    if (level === 'high') return { cellSize: 3.5, sectionSize: 35, fadeDistance: 220, cellThickness: 0.16, sectionThickness: 3.6 };
    return { cellSize: 3.2, sectionSize: 32, fadeDistance: 280, cellThickness: 0.14, sectionThickness: 4.2 };
  }, [level, visualPreset]);

  const runeMap = useMemo(() => {
    const tex = createRuneTexture({
      size: 512,
      seed: 777,
      tile: 6,
      stroke: 'rgba(153,69,255,0.75)',
      glow: 'rgba(20,241,149,0.18)',
    });
    tex.repeat.set(6, 6);
    return tex;
  }, []);

  const floor = useMemo<null | { blur: [number, number]; resolution: number; mixBlur: number; mixStrength: number; roughness: number; mirror: number }>(() => {
    if (level === 'low') return null;
    if (visualPreset === 'esports') return null;

    if (visualPreset === 'neon') {
      if (level === 'medium') return { blur: [260, 60], resolution: 256, mixBlur: 0.9, mixStrength: 1.6, roughness: 0.22, mirror: 0.7 };
      if (level === 'high') return { blur: [320, 80], resolution: 512, mixBlur: 1.1, mixStrength: 1.9, roughness: 0.18, mirror: 0.76 };
      return { blur: [380, 100], resolution: 512, mixBlur: 1.3, mixStrength: 2.15, roughness: 0.16, mirror: 0.82 };
    }

    if (level === 'medium') return { blur: [220, 50], resolution: 256, mixBlur: 0.75, mixStrength: 1.15, roughness: 0.28, mirror: 0.62 };
    if (level === 'high') return { blur: [260, 60], resolution: 512, mixBlur: 0.85, mixStrength: 1.25, roughness: 0.24, mirror: 0.66 };
    return { blur: [300, 70], resolution: 512, mixBlur: 0.95, mixStrength: 1.35, roughness: 0.22, mirror: 0.7 };
  }, [level, visualPreset]);

  return (
    <>
      <ambientLight intensity={1.2} color={palette.primary} />
      <directionalLight
        position={[50, 90, 50]}
        intensity={1.8}
        color={palette.primary}
        castShadow={shadows && visualPreset !== 'esports'}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
      />
      <fog attach="fog" args={[palette.fog, 30, 180]} />
      {starCount > 0 ? <Stars radius={260} depth={40} count={starCount} factor={3} fade speed={0.5} /> : null}
      {floor ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[420, 420]} />
          <MeshReflectorMaterial
            blur={floor.blur}
            resolution={floor.resolution}
            mixBlur={floor.mixBlur}
            mixStrength={floor.mixStrength}
            roughness={floor.roughness}
            depthScale={0.35}
            minDepthThreshold={0.28}
            maxDepthThreshold={1.2}
            color="#050505"
            metalness={0.8}
            mirror={floor.mirror}
          />
        </mesh>
      ) : null}
      <Grid
        position={[0, -0.01, 0]}
        args={[320, 320]}
        cellSize={grid.cellSize}
        cellThickness={grid.cellThickness}
        cellColor={gridColors.cell}
        sectionSize={grid.sectionSize}
        sectionThickness={grid.sectionThickness}
        sectionColor={gridColors.section}
        fadeDistance={grid.fadeDistance}
        infiniteGrid
      />
      {level !== 'low' ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
          <planeGeometry args={[260, 260]} />
          <meshBasicMaterial
            map={runeMap}
            transparent
            opacity={0.12}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ) : null}
    </>
  );
});

const OceanEnvironment = memo(() => {
    const { level, shadows, shadowMapSize, visualPreset } = useQualityStore();
    const palette = TRINITY_MODES.yacht.environment.palette;

    const gridColors = useMemo(() => {
        if (visualPreset === 'esports') return { cell: palette.accent, section: palette.primary };
        return { cell: '#B026FF', section: '#00F0FF' };
    }, [palette.accent, palette.primary, visualPreset]);

    return (
        <>
            <ambientLight intensity={2.0} color={palette.accent} />
            <directionalLight
              position={[-50, 50, -50]}
              intensity={3.0}
              color={palette.primary}
              castShadow={shadows && visualPreset !== 'esports'}
              shadow-mapSize-width={shadowMapSize}
              shadow-mapSize-height={shadowMapSize}
            />
            <fog attach="fog" args={[palette.fog, 10, 150]} />
            
            {/* 神话水面 */}
            <MythicWater />
            
            {/* 水下网格 */}
            <Grid 
                position={[0, -5, 0]}
                args={[500, 500]} 
                cellSize={visualPreset === 'esports' ? 5 : 4} 
                cellThickness={visualPreset === 'esports' ? 0.55 : level === 'ultra' ? 0.16 : level === 'high' ? 0.18 : 0.22} 
                cellColor={gridColors.cell} 
                sectionSize={visualPreset === 'esports' ? 50 : 36} 
                sectionThickness={visualPreset === 'esports' ? 1.2 : level === 'ultra' ? 3.6 : level === 'high' ? 3.2 : 2.6} 
                sectionColor={gridColors.section} 
                fadeDistance={visualPreset === 'esports' ? 80 : level === 'ultra' ? 220 : level === 'high' ? 190 : 150} 
                infiniteGrid 
            />
        </>
    );
});

const SkyEnvironment = memo(() => {
  const { level, shadows, shadowMapSize, visualPreset } = useQualityStore();
  const palette = TRINITY_MODES.jet.environment.palette;

  const cloudSegments = level === 'low' ? 8 : level === 'medium' ? 10 : 12;
  const cloudOpacity = level === 'low' ? 0.25 : 0.35;
  const starCount = level === 'ultra' ? 1200 : level === 'high' ? 800 : 0;

  return (
    <>
      <ambientLight intensity={1.8} color={palette.accent} />
      <directionalLight
        position={[120, 140, 60]}
        intensity={3.2}
        color={palette.primary}
        castShadow={shadows && visualPreset !== 'esports'}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
      />
      <directionalLight position={[-80, 40, -120]} intensity={1.2} color={palette.accent} />

      <fog attach="fog" args={[palette.fog, 120, 900]} />
      <color attach="background" args={[palette.background]} />
      <Sky
        sunPosition={[120, 20, 80]}
        turbidity={7}
        rayleigh={1.6}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {starCount > 0 ? <Stars radius={700} depth={100} count={starCount} factor={3} fade speed={0.15} /> : null}
      {level !== 'low' ? <Aurora /> : null}

      <Cloud position={[-120, 40, -220]} opacity={cloudOpacity} speed={0.12} segments={cloudSegments} scale={60} />
      <Cloud position={[90, 55, -260]} opacity={cloudOpacity} speed={0.14} segments={cloudSegments} scale={80} />
      <Cloud position={[0, 28, -180]} opacity={cloudOpacity} speed={0.1} segments={cloudSegments} scale={120} />

      {visualPreset !== 'esports' && level !== 'low' ? (
        <Grid
          position={[0, -30, 0]}
          args={[1200, 1200]}
          cellSize={18}
          cellThickness={0.25}
          cellColor={'#B026FF'}
          sectionSize={180}
          sectionThickness={2.8}
          sectionColor={'#00F0FF'}
          fadeDistance={750}
          infiniteGrid
        />
      ) : null}

      <group position={[0, 70, -420]} rotation={[0.2, 0.6, 0]}>
        <mesh>
          <torusGeometry args={[28, 1.2, 16, 64]} />
          <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.25} emissive="#0EA5E9" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[0, 0, -6]}>
          <cylinderGeometry args={[2.0, 2.0, 20, 16]} />
          <meshStandardMaterial color="#0B1220" metalness={0.9} roughness={0.35} emissive="#A78BFA" emissiveIntensity={0.25} />
        </mesh>
      </group>
    </>
  );
});

export const MythicEnvironment = memo(() => {
  const vehicleMode = useStore((state) => state.vehicleMode);

  return (
    <group>
        {vehicleMode === 'car' && <LandEnvironment />}
        {vehicleMode === 'yacht' && <OceanEnvironment />}
        {vehicleMode === 'jet' && <SkyEnvironment />}
    </group>
  );
});
