import { useTexture } from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import { useRef } from "react";
import { Vector3 } from "three";

import { CustomShaderMaterial, TYPES } from "three-custom-shader-material";

extend({ CustomShaderMaterial });

export default function Earth() {
  const day = useTexture("/day.jpg");
  const night = useTexture("/night.jpg");
  const normal = useTexture("/normal.jpg");
  const rough = useTexture("/rough.jpg");
  const clouds = useTexture("/clouds.jpg");
  const mat = useRef();

  const cloudsRef = useRef();

  const { gl } = useThree();

  useFrame(() => {
    if (mat?.current?.uniforms && gl.state.lightPos) {
      mat.current.uniforms.uLight.value = gl.state.lightPos;
    }
  });

  useFrame((_, dt) => {
    if (cloudsRef?.current) {
      cloudsRef.current.rotation.y += dt * 0.01;
    }
  });

  return (
    <>
      <mesh
        ref={cloudsRef}
        layers={1}
        castShadow
        scale={[1.001, 1.001, 1.001]}
        rotation-y={Math.PI}
      >
        <icosahedronGeometry args={[1, 128]} />
        <meshPhysicalMaterial
          color={0xffffff}
          roughness={1}
          opacity={0.2}
          alphaMap={clouds}
          transparent
        />
      </mesh>
      <mesh
        layers={1}
        receiveShadow
        scale={[0.99, 0.99, 0.99]}
        rotation-y={Math.PI}
      >
        <icosahedronGeometry args={[1, 128]} />
        <customShaderMaterial
          ref={mat}
          args={[
            {
              baseMaterial: TYPES.PHYSICAL,
              vShader: {
                defines: ``,
                header: `
              uniform vec3 uLight;
              varying vec2 vUv2;
              varying float vDist;

              float map(float value, float min1, float max1, float min2, float max2) {
                return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
              }
             
              float normalize(float v) { return map(v, -1.0, 1.0, 0.0, 1.0); }

              `,
                main: `
              vUv2 = uv;
              // vDist = distance(vec3(2.), position) * 0.05;
              vDist = clamp(pow(normalize(dot(normalize(uLight) * vec3(-1.,1.,-1.) , position) * 2.), 2.), 0., 1.);
              `
              },
              fShader: {
                defines: ``,
                header: `
              uniform sampler2D uDay;
              uniform sampler2D uNight;
              uniform vec3 uLight;
              varying vec2 vUv2;
              varying float vDist;
              `,
                main: `
              vec4 texDay = texture2D(uDay, vUv2);
              vec4 texNight = texture2D(uNight, vUv2);
              float c = vDist;
              vec4 d = mix(texNight,texDay,vDist);
              // vec4 d = vec4(vDist);
              csm_DiffuseColor = d;
              `
              },
              uniforms: {
                uDay: { value: day },
                uNight: { value: night },
                uLight: { value: new Vector3().setScalar(2) }
              },
              passthrough: {
                flatShading: true,
                normalMap: normal,
                roughnessMap: rough
              }
            }
          ]}
        />
      </mesh>
    </>
  );
}
