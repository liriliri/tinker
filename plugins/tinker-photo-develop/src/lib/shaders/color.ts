export const COLOR_SHADER_FUNCTIONS = `
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
`
