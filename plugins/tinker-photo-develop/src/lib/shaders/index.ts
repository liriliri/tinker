import { COLOR_SHADER_FUNCTIONS } from './color'
import { DETAIL_SHADER_FUNCTIONS } from './details'
import { EFFECTS_SHADER_FUNCTIONS } from './effects'
import { TONAL_SHADER_FUNCTIONS } from './tonal'

const FRAGMENT_UNIFORMS = `
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
`

const COMMON_SHADER_FUNCTIONS = `
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
`

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
${FRAGMENT_UNIFORMS}
${COMMON_SHADER_FUNCTIONS}
${TONAL_SHADER_FUNCTIONS}
${COLOR_SHADER_FUNCTIONS}
${EFFECTS_SHADER_FUNCTIONS}
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
