const KEY = 'mizo-quest-theme'

export const THEMES = [
  {
    key: 'puan',
    label: 'プアン',
    note: 'ミゾの伝統織物。生成りに赤と黒',
    swatch: ['#faf6ee', '#b5222e', '#1d1b19'],
  },
  {
    key: 'tlang',
    label: '青い山',
    note: 'ミゾラム=青い山の国。霧と峰の色',
    swatch: ['#f2f6f8', '#1d5b7d', '#3e8e7e'],
  },
  {
    key: 'rual',
    label: '竹林',
    note: '夜の竹やぶ。枯れ竹の金色',
    swatch: ['#0d1712', '#d8c15a', '#4fa77e'],
  },
  {
    key: 'zan',
    label: '夜霧',
    note: '彩度を落としたダーク',
    swatch: ['#11151b', '#e0574f', '#7f9cc0'],
  },
]

export const DEFAULT_THEME = 'puan'

export const loadTheme = () => {
  try {
    const v = localStorage.getItem(KEY)
    return THEMES.some((t) => t.key === v) ? v : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

/** テーマを <html data-theme> に反映し、アドレスバーの色(theme-color)も合わせる */
export const applyTheme = (key) => {
  const theme = THEMES.find((t) => t.key === key) || THEMES[0]
  document.documentElement.dataset.theme = theme.key
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme.swatch[0])
  try {
    localStorage.setItem(KEY, theme.key)
  } catch {
    /* 保存不可でも表示は切り替わる */
  }
}
