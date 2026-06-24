export const DETAIL_SHADER_FUNCTIONS = `
float hashPixel(vec2 p) {
  vec3 p3 = fract(vec3(p.x, p.y, p.x) * 0.1031);
  p3 += dot(p3, vec3(p3.y, p3.z, p3.x) + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 sampleSourceColor(vec2 texCoord, vec2 pixelOffset) {
  vec2 uv = texCoord + pixelOffset / uImageSize;
  return texture2D(uImage, clamp(uv, 0.0, 1.0)).rgb;
}

vec3 applyLocalContrast(
  vec3 processedColor,
  vec3 blurredColor,
  float amount,
  float threshold
) {
  if (abs(amount) < 0.00001) {
    return processedColor;
  }

  if (amount < 0.0) {
    float blurAmount = -amount * 0.5;
    return mix(processedColor, blurredColor, blurAmount);
  }

  float centerLuma = getLuma(processedColor);
  float shadowProtection = smoothstep(0.0, 0.03, centerLuma);
  float highlightProtection = 1.0 - smoothstep(0.9, 1.0, centerLuma);
  float midtoneMask = shadowProtection * highlightProtection;

  if (midtoneMask < 0.001) {
    return processedColor;
  }

  float blurredLuma = getLuma(blurredColor);
  float safeCenterLuma = max(centerLuma, 0.0001);
  float safeBlurredLuma = max(blurredLuma, 0.0001);
  float logRatio = log(safeCenterLuma / safeBlurredLuma) / log(2.0);
  float edgeMagnitude = abs(logRatio);
  float normalizedEdge = clamp(edgeMagnitude / 3.0, 0.0, 1.0);
  float edgeDampener = 1.0 - pow(normalizedEdge, 0.5);
  float edgeMask = smoothstep(threshold * 0.5, threshold * 1.5, edgeMagnitude);
  float effectiveAmount = amount * edgeDampener * edgeMask * 0.8;
  float contrastFactor = pow(2.0, logRatio * effectiveAmount);
  vec3 finalColor = processedColor * contrastFactor;

  return mix(processedColor, finalColor, midtoneMask);
}

vec3 applyNoiseReduction(vec3 centerColor, vec2 texCoord) {
  float lumaAmount = clamp(uLumaNoiseReduction, 0.0, 1.0);
  float colorAmount = clamp(uColorNoiseReduction, 0.0, 1.0);

  if (lumaAmount < 0.001 && colorAmount < 0.001) {
    return centerColor;
  }

  vec3 centerSafe = max(centerColor, vec3(0.0));
  float centerLuma = getLuma(centerSafe);
  vec3 centerChroma = centerColor - vec3(centerLuma);
  float resFactor = clamp(sqrt(uDetailScale), 0.5, 2.0);
  vec2 pixelCoord = texCoord * uImageSize;
  float newLuma = centerLuma;
  vec3 newChroma = centerChroma;

  if (lumaAmount > 0.001) {
    float lCurve = sqrt(lumaAmount);
    float stride = mix(1.0, 2.0, smoothstep(0.45, 0.95, lumaAmount)) * resFactor;
    float spatialSigma = mix(1.0, 1.5, lCurve);
    float spatialDenom = max(2.0 * spatialSigma * spatialSigma, 0.000001);
    float rangeSigma = mix(0.025, 0.075, lCurve);
    float rangeDenom = max(2.0 * rangeSigma * rangeSigma, 0.000001);
    float h1 = hashPixel(pixelCoord);
    float h2 = hashPixel(pixelCoord + vec2(17.31, 71.13));
    float jitterX = (h1 - 0.5) * stride * 0.5;
    float jitterY = (h2 - 0.5) * stride * 0.5;
    float sumLuma = 0.0;
    float sumWeight = 0.0;

    for (int dy = -2; dy <= 2; dy++) {
      for (int dx = -2; dx <= 2; dx++) {
        vec2 offset = vec2(
          float(dx) * stride + jitterX,
          float(dy) * stride + jitterY
        );
        vec3 sampleColor = sampleSourceColor(texCoord, offset);
        float sampleLuma = getLuma(max(sampleColor, vec3(0.0)));
        float spatialWeight = exp(-float(dx * dx + dy * dy) / spatialDenom);
        float deltaLuma = sampleLuma - centerLuma;
        float rangeWeight = exp(-(deltaLuma * deltaLuma) / rangeDenom);
        float weight = spatialWeight * rangeWeight;
        sumLuma += sampleLuma * weight;
        sumWeight += weight;
      }
    }

    float filteredLuma = sumLuma / max(sumWeight, 0.0001);
    newLuma = mix(centerLuma, filteredLuma, lumaAmount);
  }

  if (colorAmount > 0.001) {
    float centerRY = centerColor.r - centerLuma;
    float centerBY = centerColor.b - centerLuma;
    float cCurve = sqrt(colorAmount);
    float stride = mix(2.0, 3.5, cCurve) * resFactor;
    float spatialSigma = mix(2.0, 3.5, cCurve);
    float spatialDenom = max(2.0 * spatialSigma * spatialSigma, 0.000001);
    float lumaSigma = mix(0.12, 0.04, cCurve);
    float lumaDenom = max(2.0 * lumaSigma * lumaSigma, 0.000001);
    float chromaSigma = mix(0.20, 0.08, cCurve);
    float chromaDenom = max(2.0 * chromaSigma * chromaSigma, 0.000001);
    float jh1 = hashPixel(pixelCoord + vec2(43.7, 91.1));
    float jh2 = hashPixel(pixelCoord + vec2(73.3, 17.9));
    float jitterX = (jh1 - 0.5) * stride * 0.25;
    float jitterY = (jh2 - 0.5) * stride * 0.25;
    float sumRY = 0.0;
    float sumBY = 0.0;
    float sumWeight = 0.0;

    for (int dy = -2; dy <= 2; dy++) {
      for (int dx = -2; dx <= 2; dx++) {
        vec2 offset = vec2(
          float(dx) * stride + jitterX,
          float(dy) * stride + jitterY
        );
        vec3 sampleColor = sampleSourceColor(texCoord, offset);
        vec3 sampleSafe = max(sampleColor, vec3(0.0));
        float sampleLuma = getLuma(sampleSafe);
        float sampleRY = sampleColor.r - sampleLuma;
        float sampleBY = sampleColor.b - sampleLuma;
        float spatialWeight = exp(-float(dx * dx + dy * dy) / spatialDenom);
        float deltaLuma = sampleLuma - centerLuma;
        float lumaWeight = exp(-(deltaLuma * deltaLuma) / lumaDenom);
        float deltaRY = sampleRY - centerRY;
        float deltaBY = sampleBY - centerBY;
        float chromaDistSq = deltaRY * deltaRY + deltaBY * deltaBY;
        float chromaWeight = exp(-chromaDistSq / chromaDenom);
        float weight = spatialWeight * lumaWeight * chromaWeight;

        sumRY += sampleRY * weight;
        sumBY += sampleBY * weight;
        sumWeight += weight;
      }
    }

    float filteredRY = sumRY / max(sumWeight, 0.0001);
    float filteredBY = sumBY / max(sumWeight, 0.0001);
    float newRY = mix(centerRY, filteredRY, colorAmount);
    float newBY = mix(centerBY, filteredBY, colorAmount);
    float newGY = -(0.2126 * newRY + 0.0722 * newBY) / 0.7152;
    newChroma = vec3(newRY, newGY, newBY);
  }

  return vec3(newLuma) + newChroma;
}
`
