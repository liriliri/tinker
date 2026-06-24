import { DETAIL_SHADER_FUNCTIONS } from './shaders/details'

export const VERTEX_SHADER = `
attribute vec2 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

export const FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uImage;
uniform sampler2D uBlurredImage;
uniform sampler2D uSharpnessBlur;
uniform float uSharpness;
uniform float uSharpnessThreshold;
uniform float uLumaNoiseReduction;
uniform float uColorNoiseReduction;
uniform float uDetailScale;
uniform float uExposure;
uniform float uBrightness;
uniform float uContrast;
uniform float uHighlights;
uniform float uShadows;
uniform float uWhites;
uniform float uBlacks;
uniform float uTemperature;
uniform float uTint;
uniform float uVibrance;
uniform float uSaturation;
uniform float uHslHue[8];
uniform float uHslSat[8];
uniform float uHslLum[8];
uniform float uHslActive;
uniform float uVignetteAmount;
uniform float uVignetteMidpoint;
uniform float uVignetteRoundness;
uniform float uVignetteFeather;
uniform float uGrainAmount;
uniform float uGrainSize;
uniform float uGrainRoughness;
uniform float uGrainScale;
uniform vec2 uImageSize;
uniform sampler2D uLumaLut;
uniform sampler2D uRedLut;
uniform sampler2D uGreenLut;
uniform sampler2D uBlueLut;
uniform float uRgbCurvesActive;
varying vec2 vTexCoord;

float getLuma(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

vec3 srgbToLinear(vec3 color) {
  vec3 cutoff = vec3(0.04045);
  vec3 a = vec3(0.055);
  vec3 higher = pow((color + a) / (1.0 + a), vec3(2.4));
  vec3 lower = color / 12.92;
  return mix(higher, lower, step(color, cutoff));
}

float tanhApprox(float x) {
  float e2x = exp(2.0 * x);
  return (e2x - 1.0) / (e2x + 1.0);
}

float getShadowMult(float luma, float shadows, float blacks) {
  float mult = 1.0;
  float safeLuma = max(luma, 0.0001);

  if (abs(blacks) > 0.00001) {
    float limit = 0.05;
    if (safeLuma < limit) {
      float x = safeLuma / limit;
      float mask = (1.0 - x) * (1.0 - x);
      float factor = min(exp2(blacks * 0.75), 3.9);
      mult *= mix(1.0, factor, mask);
    }
  }

  if (abs(shadows) > 0.00001) {
    float limit = 0.1;
    if (safeLuma < limit) {
      float x = safeLuma / limit;
      float mask = (1.0 - x) * (1.0 - x);
      float factor = min(exp2(shadows * 1.5), 3.9);
      mult *= mix(1.0, factor, mask);
    }
  }

  return mult;
}

vec3 applyLinearExposure(vec3 color, float exposureAdj) {
  if (abs(exposureAdj) < 0.00001) {
    return color;
  }
  return color * pow(2.0, exposureAdj);
}

vec3 applyFilmicBrightness(vec3 color, float brightnessAdj) {
  if (abs(brightnessAdj) < 0.00001) {
    return color;
  }

  const float RATIONAL_CURVE_MIX = 0.95;
  const float MIDTONE_STRENGTH = 1.2;
  const float TOP_ANCHOR = 1.06;

  float originalLuma = getLuma(color);
  if (abs(originalLuma) < 0.00001) {
    return color;
  }

  float directAdj = brightnessAdj * (1.0 - RATIONAL_CURVE_MIX);
  float rationalAdj = brightnessAdj * RATIONAL_CURVE_MIX;
  float scale = pow(2.0, directAdj);
  float k = pow(2.0, -rationalAdj * MIDTONE_STRENGTH);

  float lumaAbs = abs(originalLuma);
  float lumaFloor = floor(lumaAbs / TOP_ANCHOR) * TOP_ANCHOR;
  float lumaNorm = (lumaAbs - lumaFloor) / TOP_ANCHOR;
  float shapedNorm = lumaNorm / (lumaNorm + (1.0 - lumaNorm) * k);
  float shapedLumaAbs = lumaFloor + shapedNorm * TOP_ANCHOR;
  float newLuma = sign(originalLuma) * shapedLumaAbs * scale;

  vec3 chroma = color - vec3(originalLuma);
  float totalLumaScale = newLuma / originalLuma;
  float lumaWeight = clamp(newLuma, 0.0, 2.0) * 0.5;
  float dynamicExp = mix(0.95, 0.65, lumaWeight);
  float baseChromaScale = pow(totalLumaScale, dynamicExp);
  float highlightRolloff = 1.0 / (1.0 + max(0.0, newLuma - 0.9) * 2.0);
  float chromaScale = baseChromaScale * highlightRolloff;

  return vec3(newLuma) + chroma * chromaScale;
}

vec3 applyTonalAdjustments(
  vec3 color,
  vec3 blurredColor,
  float contrast,
  float shadows,
  float whites,
  float blacks
) {
  vec3 rgb = color;
  vec3 blurredLinear = srgbToLinear(blurredColor);

  if (abs(whites) > 0.00001) {
    float whiteLevel = 1.0 - whites * 0.25;
    float wMult = 1.0 / max(whiteLevel, 0.01);
    rgb *= wMult;
    blurredLinear *= wMult;
  }

  float pixelLuma = getLuma(max(rgb, vec3(0.0)));
  float blurredLuma = getLuma(max(blurredLinear, vec3(0.0)));
  float safePixelLuma = max(pixelLuma, 0.0001);
  float safeBlurredLuma = max(blurredLuma, 0.0001);

  float percPixel = pow(safePixelLuma, 0.5);
  float percBlurred = pow(safeBlurredLuma, 0.5);
  float edgeDiff = abs(percPixel - percBlurred);
  float haloProtection = smoothstep(0.05, 0.25, edgeDiff);

  if (abs(shadows) > 0.00001 || abs(blacks) > 0.00001) {
    float spatialMult = getShadowMult(safeBlurredLuma, shadows, blacks);
    float pixelMult = getShadowMult(safePixelLuma, shadows, blacks);
    float finalMult = mix(spatialMult, pixelMult, haloProtection);
    rgb *= finalMult;
  }

  if (abs(contrast) > 0.00001) {
    vec3 safeRgb = max(rgb, vec3(0.0));
    float g = 2.2;
    vec3 perceptual = pow(safeRgb, vec3(1.0 / g));
    vec3 clampedPerceptual = clamp(perceptual, vec3(0.0), vec3(1.0));
    float strength = pow(2.0, contrast * 1.25);
    vec3 condition = step(clampedPerceptual, vec3(0.5));
    vec3 highPart = vec3(1.0) - 0.5 * pow(2.0 * (vec3(1.0) - clampedPerceptual), vec3(strength));
    vec3 lowPart = 0.5 * pow(2.0 * clampedPerceptual, vec3(strength));
    vec3 curvedPerceptual = mix(highPart, lowPart, condition);
    vec3 contrastAdjustedRgb = pow(curvedPerceptual, vec3(g));
    vec3 mixFactor = smoothstep(vec3(1.0), vec3(1.01), safeRgb);
    rgb = mix(contrastAdjustedRgb, rgb, mixFactor);
  }

  return rgb;
}

vec3 applyHighlightsAdjustment(vec3 color, float highlightsAdj) {
  if (abs(highlightsAdj) < 0.00001) {
    return color;
  }

  float pixelLuma = getLuma(max(color, vec3(0.0)));
  float safePixelLuma = max(pixelLuma, 0.0001);
  float pixelMaskInput = tanhApprox(safePixelLuma * 1.5);
  float highlightMask = smoothstep(0.3, 0.95, pixelMaskInput);

  if (highlightMask < 0.001) {
    return color;
  }

  float luma = pixelLuma;
  vec3 finalAdjustedColor;

  if (highlightsAdj < 0.0) {
    float newLuma;
    if (luma <= 1.0) {
      float gamma = 1.0 - highlightsAdj * 1.75;
      newLuma = pow(luma, gamma);
    } else {
      float lumaExcess = luma - 1.0;
      float compressionStrength = -highlightsAdj * 6.0;
      float compressedExcess = lumaExcess / (1.0 + lumaExcess * compressionStrength);
      newLuma = 1.0 + compressedExcess;
    }

    vec3 tonallyAdjustedColor = color * (newLuma / max(luma, 0.0001));
    float desaturationAmount = smoothstep(1.0, 10.0, luma);
    vec3 whitePoint = vec3(newLuma);
    finalAdjustedColor = mix(tonallyAdjustedColor, whitePoint, desaturationAmount);
  } else {
    float adjustment = highlightsAdj * 1.75;
    float factor = pow(2.0, adjustment);
    finalAdjustedColor = color * factor;
  }

  return mix(color, finalAdjustedColor, highlightMask);
}

vec3 rgbToHsv(vec3 c) {
  float cMax = max(c.r, max(c.g, c.b));
  float cMin = min(c.r, min(c.g, c.b));
  float delta = cMax - cMin;
  float h = 0.0;

  if (delta > 0.0) {
    if (cMax == c.r) {
      h = mod((c.g - c.b) / delta, 6.0);
    } else if (cMax == c.g) {
      h = (c.b - c.r) / delta + 2.0;
    } else {
      h = (c.r - c.g) / delta + 4.0;
    }
    h *= 60.0;
  }

  if (h < 0.0) {
    h += 360.0;
  }

  float s = cMax > 0.0 ? delta / cMax : 0.0;
  return vec3(h, s, cMax);
}

vec3 hsvToRgb(vec3 c) {
  float h = c.x;
  float s = c.y;
  float v = c.z;
  float chroma = v * s;
  float x = chroma * (1.0 - abs(mod(h / 60.0, 2.0) - 1.0));
  float m = v - chroma;
  vec3 rgbPrime;

  if (h < 60.0) {
    rgbPrime = vec3(chroma, x, 0.0);
  } else if (h < 120.0) {
    rgbPrime = vec3(x, chroma, 0.0);
  } else if (h < 180.0) {
    rgbPrime = vec3(0.0, chroma, x);
  } else if (h < 240.0) {
    rgbPrime = vec3(0.0, x, chroma);
  } else if (h < 300.0) {
    rgbPrime = vec3(x, 0.0, chroma);
  } else {
    rgbPrime = vec3(chroma, 0.0, x);
  }

  return rgbPrime + vec3(m);
}

float getRawHslInfluence(float hue, float center, float width) {
  float dist = min(abs(hue - center), 360.0 - abs(hue - center));
  float falloff = dist / (width * 0.5);
  return exp(-1.5 * falloff * falloff);
}

vec2 getHslRange(int index) {
  if (index == 0) return vec2(358.0, 35.0);
  if (index == 1) return vec2(25.0, 45.0);
  if (index == 2) return vec2(60.0, 40.0);
  if (index == 3) return vec2(115.0, 90.0);
  if (index == 4) return vec2(180.0, 60.0);
  if (index == 5) return vec2(225.0, 60.0);
  if (index == 6) return vec2(280.0, 55.0);
  return vec2(330.0, 50.0);
}

vec3 applyHslPanel(vec3 color) {
  if (uHslActive < 0.5) {
    return color;
  }

  vec3 safeColor = max(color, vec3(0.0));

  if (distance(safeColor.r, safeColor.g) < 0.001 &&
      distance(safeColor.g, safeColor.b) < 0.001) {
    return safeColor;
  }

  vec3 originalHsv = rgbToHsv(safeColor);
  float originalLuma = getLuma(safeColor);
  float saturationMask = smoothstep(0.05, 0.20, originalHsv.y);
  float luminanceWeight = smoothstep(0.0, 1.0, originalHsv.y);

  if (saturationMask < 0.001 && luminanceWeight < 0.001) {
    return safeColor;
  }

  float originalHue = originalHsv.x;
  float rawInfluences[8];
  float totalRawInfluence = 0.0;

  for (int i = 0; i < 8; i++) {
    vec2 range = getHslRange(i);
    float influence = getRawHslInfluence(originalHue, range.x, range.y);
    rawInfluences[i] = influence;
    totalRawInfluence += influence;
  }

  if (totalRawInfluence < 0.00001) {
    return safeColor;
  }

  float totalHueShift = 0.0;
  float totalSatMultiplier = 0.0;
  float totalLumAdjust = 0.0;

  for (int i = 0; i < 8; i++) {
    float normalizedInfluence = rawInfluences[i] / totalRawInfluence;
    float hueSatInfluence = normalizedInfluence * saturationMask;
    float lumaInfluence = normalizedInfluence * luminanceWeight;

    totalHueShift += uHslHue[i] * 2.0 * hueSatInfluence;
    totalSatMultiplier += uHslSat[i] * hueSatInfluence;
    totalLumAdjust += uHslLum[i] * lumaInfluence;
  }

  if (originalHsv.y * (1.0 + totalSatMultiplier) < 0.0001) {
    return vec3(originalLuma * (1.0 + totalLumAdjust));
  }

  vec3 hsv = originalHsv;
  hsv.x = mod(hsv.x + totalHueShift + 360.0, 360.0);
  hsv.y = clamp(hsv.y * (1.0 + totalSatMultiplier), 0.0, 1.0);
  vec3 hsShiftedRgb = hsvToRgb(vec3(hsv.x, hsv.y, originalHsv.z));
  float newLuma = getLuma(hsShiftedRgb);
  float targetLuma = originalLuma * (1.0 + totalLumAdjust);

  if (newLuma < 0.0001) {
    return vec3(max(0.0, targetLuma));
  }

  return hsShiftedRgb * (targetLuma / newLuma);
}

vec3 applyWhiteBalance(vec3 color, float temp, float tnt) {
  if (abs(temp) < 0.00001 && abs(tnt) < 0.00001) {
    return color;
  }

  vec3 tempKelvinMult = vec3(
    1.0 + temp * 0.2,
    1.0 + temp * 0.05,
    1.0 - temp * 0.2
  );
  vec3 tintMult = vec3(
    1.0 + tnt * 0.25,
    1.0 - tnt * 0.25,
    1.0 + tnt * 0.25
  );
  return color * tempKelvinMult * tintMult;
}

vec3 applyCreativeColor(vec3 color, float sat, float vib) {
  vec3 processed = color;
  float luma = getLuma(processed);

  if (abs(sat) > 0.00001) {
    processed = mix(vec3(luma), processed, 1.0 + sat);
  }

  if (abs(vib) < 0.00001) {
    return processed;
  }

  float cMax = max(processed.r, max(processed.g, processed.b));
  float cMin = min(processed.r, min(processed.g, processed.b));
  float delta = cMax - cMin;

  if (delta < 0.02) {
    return processed;
  }

  float currentSat = delta / max(cMax, 0.001);

  if (vib > 0.0) {
    float satMask = 1.0 - smoothstep(0.4, 0.9, currentSat);
    vec3 hsv = rgbToHsv(processed);
    float hue = hsv.x;
    float skinCenter = 25.0;
    float hueDist = min(abs(hue - skinCenter), 360.0 - abs(hue - skinCenter));
    float isSkin = smoothstep(35.0, 10.0, hueDist);
    float skinDampener = mix(1.0, 0.6, isSkin);
    float amount = vib * satMask * skinDampener * 3.0;
    processed = mix(vec3(luma), processed, 1.0 + amount);
  } else {
    float desatMask = 1.0 - smoothstep(0.2, 0.8, currentSat);
    float amount = vib * desatMask;
    processed = mix(vec3(luma), processed, 1.0 + amount);
  }

  return processed;
}

float sampleCurve(sampler2D lut, float value) {
  return texture2D(lut, vec2(clamp(value, 0.0, 1.0), 0.5)).r;
}

vec3 applyAllCurves(vec3 color) {
  if (uRgbCurvesActive > 0.5) {
    vec3 colorGraded = vec3(
      sampleCurve(uRedLut, color.r),
      sampleCurve(uGreenLut, color.g),
      sampleCurve(uBlueLut, color.b)
    );
    float lumaInitial = getLuma(color);
    float lumaTarget = sampleCurve(uLumaLut, lumaInitial);
    float lumaGraded = getLuma(colorGraded);
    vec3 finalColor;

    if (lumaGraded > 0.001) {
      finalColor = colorGraded * (lumaTarget / lumaGraded);
    } else {
      finalColor = vec3(lumaTarget);
    }

    float maxComp = max(finalColor.r, max(finalColor.g, finalColor.b));
    if (maxComp > 1.0) {
      finalColor = finalColor / maxComp;
    }

    return finalColor;
  }

  return vec3(
    sampleCurve(uLumaLut, color.r),
    sampleCurve(uLumaLut, color.g),
    sampleCurve(uLumaLut, color.b)
  );
}

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

${DETAIL_SHADER_FUNCTIONS}

void main() {
  vec4 tex = texture2D(uImage, vTexCoord);
  vec3 blurred = texture2D(uBlurredImage, vTexCoord).rgb;
  vec3 sharpnessBlurred = texture2D(uSharpnessBlur, vTexCoord).rgb;

  vec3 rgb = applyNoiseReduction(tex.rgb, vTexCoord);
  rgb = applyLocalContrast(rgb, sharpnessBlurred, uSharpness, uSharpnessThreshold);
  rgb = applyLinearExposure(rgb, uExposure);
  rgb = applyWhiteBalance(rgb, uTemperature, uTint);
  rgb = applyFilmicBrightness(rgb, uBrightness);
  rgb = applyTonalAdjustments(
    rgb,
    blurred,
    uContrast,
    uShadows,
    uWhites,
    uBlacks
  );
  rgb = applyHighlightsAdjustment(rgb, uHighlights);
  rgb = applyHslPanel(rgb);
  rgb = applyAllCurves(rgb);
  rgb = applyCreativeColor(rgb, uSaturation, uVibrance);
  rgb = applyVignette(rgb, vTexCoord);
  rgb = applyGrain(rgb, vTexCoord);

  gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), tex.a);
}
`
