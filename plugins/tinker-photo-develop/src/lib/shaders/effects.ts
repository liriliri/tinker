export const EFFECTS_SHADER_FUNCTIONS = `
float hashNoise(vec2 p) {
  vec3 p3 = fract(vec3(p.x, p.y, p.x) * 0.1031);
  p3 += dot(p3, vec3(p3.y, p3.z, p3.x) + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float gradientNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

  vec2 ga = vec2(
    hashNoise(i + vec2(0.0, 0.0)),
    hashNoise(i + vec2(0.0, 0.0) + vec2(11.0, 37.0))
  ) * 2.0 - 1.0;
  vec2 gb = vec2(
    hashNoise(i + vec2(1.0, 0.0)),
    hashNoise(i + vec2(1.0, 0.0) + vec2(11.0, 37.0))
  ) * 2.0 - 1.0;
  vec2 gc = vec2(
    hashNoise(i + vec2(0.0, 1.0)),
    hashNoise(i + vec2(0.0, 1.0) + vec2(11.0, 37.0))
  ) * 2.0 - 1.0;
  vec2 gd = vec2(
    hashNoise(i + vec2(1.0, 1.0)),
    hashNoise(i + vec2(1.0, 1.0) + vec2(11.0, 37.0))
  ) * 2.0 - 1.0;

  float dot00 = dot(ga, f - vec2(0.0, 0.0));
  float dot10 = dot(gb, f - vec2(1.0, 0.0));
  float dot01 = dot(gc, f - vec2(0.0, 1.0));
  float dot11 = dot(gd, f - vec2(1.0, 1.0));
  float bottomInterp = mix(dot00, dot10, u.x);
  float topInterp = mix(dot01, dot11, u.x);

  return mix(bottomInterp, topInterp, u.y);
}

vec3 applyVignette(vec3 color, vec2 texCoord) {
  if (abs(uVignetteAmount) < 0.00001) {
    return color;
  }

  float vRound = 1.0 - uVignetteRoundness;
  float vFeather = uVignetteFeather * 0.5;
  float aspect = uImageSize.y / uImageSize.x;
  vec2 uvCentered = (texCoord - 0.5) * 2.0;
  vec2 uvRound = sign(uvCentered) * pow(abs(uvCentered), vec2(vRound));
  float distanceValue = length(uvRound * vec2(1.0, aspect)) * 0.5;
  float vignetteMask = smoothstep(
    uVignetteMidpoint - vFeather,
    uVignetteMidpoint + vFeather,
    distanceValue
  );

  if (uVignetteAmount < 0.0) {
    return color * (1.0 + uVignetteAmount * vignetteMask);
  }

  return mix(color, vec3(1.0), uVignetteAmount * vignetteMask);
}

vec3 applyGrain(vec3 color, vec2 texCoord) {
  if (uGrainAmount <= 0.00001) {
    return color;
  }

  vec2 coord = texCoord * uImageSize;
  float amount = uGrainAmount * 0.5;
  float grainFrequency = (1.0 / max(uGrainSize, 0.1)) / uGrainScale;
  float luma = max(0.0, getLuma(color));
  float lumaMask =
    smoothstep(0.0, 0.15, luma) * (1.0 - smoothstep(0.6, 1.0, luma));
  vec2 baseCoord = coord * grainFrequency;
  vec2 roughCoord = coord * grainFrequency * 0.6;
  float noiseBase = gradientNoise(baseCoord);
  float noiseRough = gradientNoise(roughCoord + vec2(5.2, 1.3));
  float noiseVal = mix(noiseBase, noiseRough, uGrainRoughness);

  return color + vec3(noiseVal) * amount * lumaMask;
}
`
