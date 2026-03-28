export const READ_FILE_TOOL = {
  type: 'function',
  function: {
    name: 'read_file',
    description:
      'Read the contents of a file. Returns numbered lines. Use offset and limit to paginate through large files.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'The file path to read (absolute or relative to working directory)',
        },
        offset: {
          type: 'integer',
          description:
            'Line number to start reading from (1-indexed, default 1)',
          minimum: 1,
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of lines to read (default 2000)',
          minimum: 1,
        },
      },
      required: ['path'],
    },
  },
} as const

export const WRITE_FILE_TOOL = {
  type: 'function',
  function: {
    name: 'write_file',
    description:
      'Write content to a file at the given path. Creates parent directories if needed. Overwrites existing files.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'The file path to write to (absolute or relative to working directory)',
        },
        content: {
          type: 'string',
          description: 'The content to write',
        },
      },
      required: ['path', 'content'],
    },
  },
} as const

export const EDIT_FILE_TOOL = {
  type: 'function',
  function: {
    name: 'edit_file',
    description:
      'Edit a file by replacing old_text with new_text. Set replace_all=true to replace every occurrence.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'The file path to edit (absolute or relative to working directory)',
        },
        old_text: {
          type: 'string',
          description: 'The exact text to find and replace',
        },
        new_text: {
          type: 'string',
          description: 'The text to replace with',
        },
        replace_all: {
          type: 'boolean',
          description: 'Replace all occurrences (default false)',
        },
      },
      required: ['path', 'old_text', 'new_text'],
    },
  },
} as const

export const LIST_DIR_TOOL = {
  type: 'function',
  function: {
    name: 'list_dir',
    description:
      'List the contents of a directory. Set recursive=true to explore nested structure. Common noise directories are auto-ignored.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'The directory path to list (absolute or relative to working directory)',
        },
        recursive: {
          type: 'boolean',
          description: 'Recursively list all files (default false)',
        },
        max_entries: {
          type: 'integer',
          description: 'Maximum entries to return (default 200)',
          minimum: 1,
        },
      },
      required: ['path'],
    },
  },
} as const

export type ToolName = 'read_file' | 'write_file' | 'edit_file' | 'list_dir'

export function getToolLabel(name: string): string {
  const labels: Record<string, string> = {
    read_file: 'Read File',
    write_file: 'Write File',
    edit_file: 'Edit File',
    list_dir: 'List Dir',
  }
  return labels[name] ?? name
}
