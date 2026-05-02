export interface IMarketplacePlugin {
  id: string
  name: string
  description: string
  icon: string
  locales?: Record<string, { name?: string; description?: string }>
}

export const marketplacePlugins: IMarketplacePlugin[] = [
  {
    id: 'tinker-agent-notification',
    name: 'Agent Notification',
    description: 'Configure notification sounds for coding agents',
    icon: 'tinker-agent-notification.png',
    locales: {
      'zh-CN': {
        name: 'Agent 提示音',
        description: '为编码 Agent 配置提示音',
      },
    },
  },
  {
    id: 'tinker-bg-remover',
    name: 'Background Remover',
    description: 'Remove image backgrounds locally with AI',
    icon: 'tinker-bg-remover.png',
    locales: {
      'zh-CN': {
        name: '抠图',
        description: '使用 AI 在本地移除图片背景',
      },
    },
  },
  {
    id: 'tinker-bilibili-downloader',
    name: 'Bilibili Downloader',
    description: 'Download Bilibili videos with quality selection',
    icon: 'tinker-bilibili-downloader.png',
    locales: {
      'zh-CN': {
        name: 'B站视频下载',
        description: '下载哔哩哔哩视频，支持画质选择',
      },
    },
  },
  {
    id: 'tinker-clipboard-sync',
    name: 'Clipboard Sync',
    description: 'Sync clipboard between host and VM via shared files',
    icon: 'tinker-clipboard-sync.png',
    locales: {
      'zh-CN': {
        name: '剪贴板同步',
        description: '通过共享文件在宿主机和虚拟机之间同步剪贴板',
      },
    },
  },
  {
    id: 'tinker-dictionary',
    name: 'Dictionary',
    description: 'Look up word definitions and translations',
    icon: 'tinker-dictionary.png',
    locales: {
      'zh-CN': {
        name: '词典',
        description: '查询单词定义和翻译',
      },
    },
  },
  {
    id: 'tinker-electron-debug',
    name: 'Electron Debug',
    description: 'Remote debugger for Electron applications',
    icon: 'tinker-electron-debug.png',
    locales: {
      'zh-CN': {
        name: 'Electron 调试',
        description: '远程调试 Electron 应用',
      },
    },
  },
  {
    id: 'tinker-emoji',
    name: 'Emoji',
    description: 'Search and copy emojis quickly',
    icon: 'tinker-emoji.png',
    locales: {
      'zh-CN': {
        name: 'Emoji',
        description: '快速搜索并复制表情符号',
      },
    },
  },
  {
    id: 'tinker-exchange',
    name: 'Currency Exchange',
    description: 'Currency exchange rate calculator',
    icon: 'tinker-exchange.png',
    locales: {
      'zh-CN': {
        name: '汇率换算',
        description: '货币汇率计算器',
      },
    },
  },
  {
    id: 'tinker-gamepad',
    name: 'Gamepad',
    description: 'Test and visualize gamepad inputs',
    icon: 'tinker-gamepad.png',
    locales: {
      'zh-CN': {
        name: '手柄测试',
        description: '测试并可视化游戏手柄输入',
      },
    },
  },
  {
    id: 'tinker-gba',
    name: 'GBA',
    description: 'Play Game Boy Advance ROMs',
    icon: 'tinker-gba.png',
    locales: {
      'zh-CN': {
        name: 'GBA',
        description: '运行 Game Boy Advance 游戏',
      },
    },
  },
  {
    id: 'tinker-hanzi-converter',
    name: 'Hanzi Converter',
    description: 'Chinese character tools for pinyin and conversion',
    icon: 'tinker-hanzi-converter.png',
    locales: {
      'zh-CN': {
        name: '汉字转换',
        description: '汉字拼音、大写金额、简繁转换工具',
      },
    },
  },
  {
    id: 'tinker-js13k',
    name: 'JS13K Games',
    description: 'Play curated JS13K games',
    icon: 'tinker-js13k.png',
    locales: {
      'zh-CN': {
        name: 'JS13K 游戏',
        description: '畅玩精选 JS13K 游戏',
      },
    },
  },
  {
    id: 'tinker-life-progress',
    name: 'Life Progress',
    description: 'Visualize life, month, and day progress',
    icon: 'tinker-life-progress.png',
    locales: {
      'zh-CN': {
        name: '人生进度',
        description: '可视化人生、月份和每日进度',
      },
    },
  },
  {
    id: 'tinker-lunar-calendar',
    name: 'Lunar Calendar',
    description: 'A perpetual calendar with lunar date support',
    icon: 'tinker-lunar-calendar.png',
    locales: {
      'zh-CN': {
        name: '万年历',
        description: '支持农历的万年历',
      },
    },
  },
  {
    id: 'tinker-map',
    name: 'Map',
    description: 'Explore maps, search locations and manage bookmarks',
    icon: 'tinker-map.png',
    locales: {
      'zh-CN': {
        name: '地图',
        description: '浏览地图、搜索地点和管理标注',
      },
    },
  },
  {
    id: 'tinker-nes',
    name: 'NES',
    description: 'Play NES ROMs with save state support',
    icon: 'tinker-nes.png',
    locales: {
      'zh-CN': {
        name: '红白机',
        description: '运行 NES 游戏，支持存档',
      },
    },
  },
  {
    id: 'tinker-ocr',
    name: 'OCR',
    description: 'Recognize text from images using Tesseract.js',
    icon: 'tinker-ocr.png',
    locales: {
      'zh-CN': {
        name: 'OCR 识别',
        description: '使用 Tesseract.js 识别图片中的文字',
      },
    },
  },
  {
    id: 'tinker-token-usage',
    name: 'Token Usage',
    description: 'Track token usage statistics for AI coding tools',
    icon: 'tinker-token-usage.png',
    locales: {
      'zh-CN': {
        name: 'Token 统计',
        description: '跟踪 AI 编程工具的 Token 用量统计',
      },
    },
  },
  {
    id: 'tinker-translate',
    name: 'Translate',
    description: 'Translate text with multiple translation services',
    icon: 'tinker-translate.png',
    locales: {
      'zh-CN': {
        name: '翻译',
        description: '使用多种翻译服务翻译文本',
      },
    },
  },
  {
    id: 'tinker-trending',
    name: 'Trending',
    description: 'Browse trending topics from multiple platforms',
    icon: 'tinker-trending.png',
    locales: {
      'zh-CN': {
        name: '热搜榜',
        description: '浏览多个平台的热搜榜',
      },
    },
  },
  {
    id: 'tinker-typing-test',
    name: 'Typing Test',
    description: 'Test and improve your typing speed',
    icon: 'tinker-typing-test.png',
    locales: {
      'zh-CN': {
        name: '打字测速',
        description: '测试并提高你的打字速度',
      },
    },
  },
  {
    id: 'tinker-video-converter',
    name: 'Video Converter',
    description: 'Convert video formats with FFmpeg',
    icon: 'tinker-video-converter.png',
    locales: {
      'zh-CN': {
        name: '视频转换',
        description: '使用 FFmpeg 转换视频格式',
      },
    },
  },
  {
    id: 'tinker-wallpaper',
    name: 'Wallpaper',
    description: 'Search, preview and set desktop wallpapers',
    icon: 'tinker-wallpaper.png',
    locales: {
      'zh-CN': {
        name: '壁纸',
        description: '搜索、预览并设置桌面壁纸',
      },
    },
  },
  {
    id: 'tinker-weather',
    name: 'Weather',
    description: 'Check real-time weather and forecasts',
    icon: 'tinker-weather.png',
    locales: {
      'zh-CN': {
        name: '天气',
        description: '查看实时天气和天气预报',
      },
    },
  },
  {
    id: 'tinker-white-noise',
    name: 'White Noise',
    description: 'Play ambient white noise with visual effects',
    icon: 'tinker-white-noise.png',
    locales: {
      'zh-CN': {
        name: '白噪音',
        description: '播放环境白噪音，配合视觉效果',
      },
    },
  },
  {
    id: 'tinker-whois',
    name: 'WHOIS',
    description: 'Query WHOIS information for domains and IPs',
    icon: 'tinker-whois.png',
    locales: {
      'zh-CN': {
        name: 'WHOIS 查询',
        description: '查询域名和 IP 的 WHOIS 信息',
      },
    },
  },
]
