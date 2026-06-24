export const TONAL_SHADER_FUNCTIONS = `
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
`
