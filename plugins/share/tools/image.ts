export interface GeneratedImageInfo {
  path: string
  mimeType: string
  bytes: number
}

export interface GenerateImageToolData {
  images: GeneratedImageInfo[]
  provider: string
  model: string
}

export const GENERATE_IMAGE_TOOL = {
  type: 'function',
  function: {
    name: 'generate_image',
    description:
      'Generate an image from a text prompt using the configured default image model. Use when the user asks to draw, generate, or create an image. The image is automatically displayed in the chat UI. After success, briefly confirm in text; do not invent http/https image URLs or markdown image links. If you mention a file, copy the exact local path from the tool result.',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed description of the image to generate',
        },
        size: {
          type: 'string',
          description:
            'Optional image size as WIDTHxHEIGHT, e.g. 1024x1024. Defaults to 1024x1024.',
        },
      },
      required: ['prompt'],
    },
  },
} as const

function formatGenerateImageResult(data: GenerateImageToolData): string {
  if (data.images.length === 0) {
    return 'No images were generated.'
  }

  const lines = data.images.map((image, i) => `${i + 1}. ${image.path}`)
  return [
    'Success. The image is already displayed in the chat UI.',
    `Provider: ${data.provider}`,
    `Model: ${data.model}`,
    'Local path(s):',
    ...lines,
    'Reply rules: do not invent http/https URLs or other file paths; do not use markdown image syntax with made-up links; you may quote the local path(s) above exactly.',
  ].join('\n')
}

export function createGenerateImageToolResult(data: GenerateImageToolData) {
  return {
    content: formatGenerateImageResult(data),
    data,
  }
}
