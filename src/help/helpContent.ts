export type HelpArticleId = 'home' | 'getting-started' | 'projects' | 'drawing-basics' | 'dimensions' | 'layers' | 'export' | 'commands' | 'release-notes' | 'about' | 'social' | 'support'
export interface HelpArticle { id: HelpArticleId; title: string; summary: string; sections: { heading: string; body: string }[] }

export const editorToolbarHelp = {
  en: {
    guideHeading: 'Editor header',
    guideBody: 'The top row contains the project name, centered Undo and Redo, and project-level actions. The second row contains the Draw, Dimension, and Modify tool groups. Commands and snap controls remain in the desktop footer.',
    releaseHeading: 'Clear two-row editor toolbar',
    releaseBody: 'Project actions and drawing tools now occupy separate, fixed rows. Undo and Redo stay centered even when the project name or right-side actions change width.',
  },
  tr: {
    guideHeading: 'Editör başlığı',
    guideBody: 'Üst satırda proje adı, ortalanmış Geri Al ve Yinele ile proje işlemleri bulunur. İkinci satır Çizim, Ölçü ve Düzenle araç gruplarına ayrılır. Komut alanı ve yakalama kontrolleri masaüstü alt çubuğunda kalır.',
    releaseHeading: 'Net iki satırlı editör araç çubuğu',
    releaseBody: 'Proje işlemleri ve çizim araçları artık ayrı, sabit satırlarda bulunuyor. Proje adı veya sağ taraftaki işlemler genişlese bile Geri Al ve Yinele ortada kalıyor.',
  },
} as const

export const helpArticles: HelpArticle[] = [
  { id: 'home', title: 'Kivi Help', summary: 'Simple guides for projects, drawing and sharing.', sections: [{ heading: 'Start here', body: 'Create a drawing from the project hub, then choose a tool from the grouped editor toolbar.' }] },
  { id: 'getting-started', title: 'Getting started', summary: 'Create your first measured drawing.', sections: [{ heading: 'A quick workflow', body: 'Choose New Drawing, select Line or a shape tool, place points, then use Dimension to add measurements. Your work saves locally as you draw.' }] },
  { id: 'projects', title: 'Projects', summary: 'Open and manage local .kivi drawings.', sections: [{ heading: 'Local-first files', body: 'Projects remain in this browser. The project hub shows your latest work and the editor project name opens a compact project switcher.' }] },
  { id: 'drawing-basics', title: 'Drawing basics', summary: 'Lines, rectangles, circles, arcs and selection.', sections: [{ heading: 'Precision', body: 'Use grid, endpoint, midpoint and angle snapping. The crosshair marks your active drawing position.' }] },
  { id: 'dimensions', title: 'Dimensions', summary: 'Add linked or free-point measurements.', sections: [{ heading: 'Measured geometry', body: 'Select Dimension and pick an existing line, or choose two free points. Linked dimensions follow supported geometry changes.' }] },
  { id: 'layers', title: 'Layers', summary: 'Organize and control drawing content.', sections: [{ heading: 'Visibility and editing', body: 'Create, rename, hide and lock layers from the Layers button in the editor header.' }] },
  { id: 'export', title: 'Export', summary: 'Create PNG, PDF and SVG output.', sections: [{ heading: 'Share menu', body: 'Open Share in the editor to export the visible drawing. Cloud links remain unavailable until a backend is connected.' }] },
  { id: 'commands', title: 'Commands', summary: 'Use keyboard-friendly command search.', sections: [{ heading: 'Command bar', body: 'On desktop, type a tool or action name in the footer command field and choose a suggestion.' }] },
  { id: 'release-notes', title: "What's new", summary: 'Changes in Kivi 0.1.', sections: [{ heading: 'Project hub and editor refresh', body: 'A new project hub, grouped editor tools, tabbed settings, Help Center, account placeholder and precision crosshair.' }, { heading: 'Drawing tools', body: 'Includes measured shapes, layers, snapping, box selection, transforms, trim, offset and extend.' }] },
  { id: 'about', title: 'About Kivi', summary: 'A focused, local-first drawing tool.', sections: [{ heading: 'Why Kivi', body: 'Kivi is designed for quick, approachable measured drawings without a heavy CAD interface.' }] },
  { id: 'social', title: 'Social', summary: 'Community links are being prepared.', sections: [{ heading: 'Stay in touch', body: 'Official community profiles will appear here when they are available.' }] },
  { id: 'support', title: 'Contact support', summary: 'Get help from the developer.', sections: [{ heading: 'Email', body: 'The developer support email has not been configured yet. It will be published here when support opens.' }] },
]

export function helpArticleForPath(pathname: string) {
  const segment = pathname.replace(/^\/help\/?/, '').split('/')[0] || 'home'
  if (segment === 'tools') return helpArticles.find((article) => article.id === 'drawing-basics')!
  return helpArticles.find((article) => article.id === segment) ?? helpArticles[0]!
}
