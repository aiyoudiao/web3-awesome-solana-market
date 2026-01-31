import { Grid, Stars, Cloud, Sky } from '@react-three/drei';
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

  const grid = useMemo(() => {
    if (level === 'low') return { cellSize: 6, sectionSize: 60, fadeDistance: 90 };
    if (level === 'medium') return { cellSize: 5, sectionSize: 50, fadeDistance: 110 };
    if (level === 'high') return { cellSize: 4, sectionSize: 40, fadeDistance: 130 };
    return { cellSize: 4, sectionSize: 40, fadeDistance: 160 };
  }, [level]);

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
      <Grid
        position={[0, -0.01, 0]}
        args={[320, 320]}
        cellSize={grid.cellSize}
        cellThickness={0.6}
        cellColor={palette.primary}
        sectionSize={grid.sectionSize}
        sectionThickness={1.2}
        sectionColor={palette.accent}
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
    const { shadows, shadowMapSize, visualPreset } = useQualityStore();
    const palette = TRINITY_MODES.yacht.environment.palette;

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
                cellSize={4} 
                cellThickness={1} 
                cellColor={palette.primary} 
                sectionSize={40} 
                sectionThickness={2} 
                sectionColor={palette.accent} 
                fadeDistance={100} 
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
