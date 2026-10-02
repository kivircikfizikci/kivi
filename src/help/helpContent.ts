import type { Locale } from '../i18n/types.ts'

export type HelpArticleId =
  | 'home' | 'getting-started' | 'projects' | 'editor' | 'navigation' | 'offline'
  | 'line' | 'rectangle' | 'circle' | 'arc' | 'polygon' | 'dimensions' | 'measure' | 'snapping' | 'selection' | 'layers'
  | 'move' | 'copy' | 'repeat' | 'rotate' | 'mirror' | 'offset' | 'trim' | 'extend'
  | 'context-menu' | 'commands' | 'shortcuts' | 'export-sharing' | 'fullscreen' | 'settings'
  | 'release-notes' | 'about' | 'social' | 'feedback' | 'support'

export type HelpCategoryId = 'start' | 'draw' | 'organize' | 'modify' | 'reference' | 'product'
export type HelpArticleKind = 'standard' | 'home' | 'commands' | 'feedback' | 'support'

export interface HelpSection {
  heading: string
  paragraphs?: string[]
  steps?: string[]
  bullets?: string[]
}

interface HelpTranslation {
  title: string
  summary: string
  keywords: string[]
  sections: HelpSection[]
}

export interface HelpArticleDefinition {
  id: HelpArticleId
  category: HelpCategoryId
  slug: string
  aliases?: string[]
  order: number
  kind: HelpArticleKind
  locales: Record<Locale, HelpTranslation>
}

export interface LocalizedHelpArticle extends HelpTranslation {
  id: HelpArticleId
  category: HelpCategoryId
  slug: string
  order: number
  kind: HelpArticleKind
}

const article = (
  id: HelpArticleId,
  category: HelpCategoryId,
  slug: string,
  order: number,
  en: HelpTranslation,
  tr: HelpTranslation,
  options: { aliases?: string[]; kind?: HelpArticleKind } = {},
): HelpArticleDefinition => ({ id, category, slug, order, kind: options.kind ?? 'standard', aliases: options.aliases, locales: { en, tr } })

export const helpManifest: readonly HelpArticleDefinition[] = [
  article('home', 'start', '', 0,
    { title: 'KIVI Help', summary: 'Short, practical guides for making measured drawings.', keywords: ['home', 'help'], sections: [] },
    { title: 'KIVI Yardım', summary: 'Ölçülü çizimler hazırlamak için kısa ve pratik anlatımlar.', keywords: ['ana sayfa', 'yardım'], sections: [] },
    { kind: 'home' }),
  article('getting-started', 'start', 'getting-started', 10,
    { title: 'Getting Started', summary: 'Make a useful measured drawing without CAD experience.', keywords: ['first drawing', 'new', 'basics'], sections: [
      { heading: 'What is KIVI?', paragraphs: ['KIVI is a fast measured drawing tool for workshop, carpentry, metalwork, tile and home projects. You do not need CAD knowledge. One drawing unit equals 1 cm.'] },
      { heading: 'Your first drawing', steps: ['Choose New Drawing in the Project Hub.', 'Choose Line from Draw.', 'Tap or click the starting point, then choose a rough direction.', 'Enter the exact length and confirm.', 'Choose Dimension and place a measurement.'] },
      { heading: 'Finish', paragraphs: ['KIVI saves committed changes automatically on this device. There is no Save button during normal drawing.'] },
    ] },
    { title: 'Başlarken', summary: 'CAD bilgisi olmadan kullanışlı bir ölçülü çizim hazırlayın.', keywords: ['ilk çizim', 'yeni', 'temel'], sections: [
      { heading: 'KIVI nedir?', paragraphs: ['KIVI; atölye, marangozluk, metal işleri, fayans ve ev projeleri için hızlı bir ölçülü çizim aracıdır. CAD bilgisi gerekmez. Çizimde 1 birim, 1 cm’dir.'] },
      { heading: 'İlk çiziminiz', steps: ['Proje Merkezi’nde Yeni Çizim’i seçin.', 'Çizim menüsünden Çizgi’yi seçin.', 'Başlangıç noktasına dokunun veya tıklayın, ardından yaklaşık yönü belirleyin.', 'Kesin uzunluğu girip onaylayın.', 'Ölçü’yü seçip ölçüyü yerleştirin.'] },
      { heading: 'Bitirirken', paragraphs: ['KIVI, onaylanan değişiklikleri bu cihaza otomatik kaydeder. Normal çizim sırasında Kaydet düğmesi gerekmez.'] },
    ] }, { aliases: ['drawing-basics', 'tools'] }),
  article('projects', 'start', 'projects', 20,
    { title: 'Projects', summary: 'Create, open and manage drawings stored on this device.', keywords: ['project hub', 'rename', 'delete', 'kivi'], sections: [
      { heading: 'Project Hub', bullets: ['New Drawing creates and opens a local project.', 'Recents shows the latest projects. Choose a name to open it.', 'Use Rename or Delete in the project list. Deleting an entire project cannot be undone; this is separate from deleting selected drawing items.'] },
      { heading: 'Inside the editor', paragraphs: ['Choose the project name on desktop, or Projects in the mobile More menu, to open the left-side Projects panel. The KIVI logo returns to the Project Hub.'] },
      { heading: 'About .kivi names', paragraphs: ['Project names end in .kivi to identify a complete KIVI drawing. Importing or downloading a standalone .kivi file is not available yet.'] },
      { heading: 'Local and offline', paragraphs: ['Projects currently live in this browser on this device. There is no cloud sync. Autosave and cached offline use continue locally; clearing browser or site data can remove local-only projects.'] },
    ] },
    { title: 'Projeler', summary: 'Bu cihazda saklanan çizimleri oluşturun, açın ve yönetin.', keywords: ['proje merkezi', 'yeniden adlandır', 'sil', 'kivi'], sections: [
      { heading: 'Proje Merkezi', bullets: ['Yeni Çizim, yerel bir proje oluşturup açar.', 'Son Çizimler en yeni projeleri gösterir. Açmak için proje adını seçin.', 'Proje listesinde Yeniden Adlandır veya Sil’i kullanın. Yalnızca projenin tamamını silmek geri alınamaz; bu işlem seçili çizim öğelerini silmekten farklıdır.'] },
      { heading: 'Editör içinden', paragraphs: ['Soldaki Projeler panelini açmak için masaüstünde proje adını, mobilde Diğer menüsündeki Projeler’i seçin. KIVI logosu Proje Merkezi’ne döner.'] },
      { heading: '.kivi adları hakkında', paragraphs: ['Proje adları, tam bir KIVI çizimini belirtmek için .kivi ile biter. Bağımsız bir .kivi dosyasını içe aktarma veya indirme henüz yoktur.'] },
      { heading: 'Yerel ve çevrimdışı', paragraphs: ['Projeler şu anda bu cihazdaki tarayıcıda tutulur. Bulut eşitleme yoktur. Otomatik kayıt ve önbelleğe alınmış çevrimdışı kullanım yerel olarak sürer; tarayıcı veya site verilerini temizlemek yalnızca yerelde bulunan projeleri silebilir.'] },
    ] }),
  article('editor', 'start', 'editor', 30,
    { title: 'Editor Interface', summary: 'Find project actions, tools, commands and drawing controls.', keywords: ['toolbar', 'mobile', 'desktop', 'footer'], sections: [
      { heading: 'Desktop', bullets: ['Top row: KIVI and project on the left, fixed Undo/Redo plus chosen tool shortcuts in the center, then Share, Layers, Settings, Help and Account.', 'Choose KIVI for the Project Hub; choose the project name for the Projects panel.', 'Second row: centered Draw, Dimension and Modify groups.', 'Footer: command entry on the left and snap quick controls on the right. Fullscreen stays as a floating canvas button.'] },
      { heading: 'Mobile', bullets: ['Top row: KIVI on the left, fixed Undo, Redo and Delete plus chosen tool shortcuts in the center, then Settings, Account and More.', 'Delete removes the current selection and can be reversed immediately with Undo.', 'More contains Projects, Share, Layers and Help.', 'Second row: centered Draw, Dimension and Modify menus.', 'Autosave text appears at the lower-left of the canvas. There is no bottom tools drawer.'] },
    ] },
    { title: 'Editör Arayüzü', summary: 'Proje işlemlerini, araçları, komutları ve çizim kontrollerini bulun.', keywords: ['araç çubuğu', 'mobil', 'masaüstü', 'alt çubuk'], sections: [
      { heading: 'Masaüstü', bullets: ['Üst satır: solda KIVI ve proje; ortada sabit Geri Al/Yinele ile seçilen araç kısayolları; sağda Paylaş, Katmanlar, Ayarlar, Yardım ve Hesap.', 'Proje Merkezi için KIVI’yi, Projeler paneli için proje adını seçin.', 'İkinci satır: ortalanmış Çizim, Ölçü ve Düzenle grupları.', 'Alt çubuk: solda komut alanı, sağda hızlı yakalama kontrolleri. Tam ekran düğmesi tuval üzerinde yüzer.'] },
      { heading: 'Mobil', bullets: ['Üst satır: solda KIVI; ortada sabit Geri Al, Yinele ve Sil ile seçilen araç kısayolları; sağda Ayarlar, Hesap ve Diğer.', 'Sil, mevcut seçimi kaldırır ve işlem Geri Al ile hemen geri alınabilir.', 'Diğer menüsünde Projeler, Paylaş, Katmanlar ve Yardım bulunur.', 'İkinci satır: ortalanmış Çizim, Ölçü ve Düzenle menüleri.', 'Otomatik kayıt yazısı tuvalin sol altında görünür. Altta ayrı bir araç çekmecesi yoktur.'] },
    ] }),
  article('navigation', 'start', 'navigation', 40,
    { title: 'Move Around and Undo', summary: 'Zoom, pan and safely reverse changes.', keywords: ['zoom', 'pan', 'undo', 'redo'], sections: [
      { heading: 'Zoom and pan', bullets: ['Desktop: use the mouse wheel to zoom around the pointer. Hold the middle mouse button and drag to pan.', 'Touch: use two fingers to zoom and pan together.'] },
      { heading: 'Undo and Redo', paragraphs: ['Use the centered Undo and Redo buttons. Deleting selected drawing items is recorded in the same history and can be undone. On a keyboard, Ctrl+Z undoes; Ctrl+Y or Ctrl+Shift+Z redoes.'] },
    ] },
    { title: 'Gezinme ve Geri Alma', summary: 'Yakınlaştırın, kaydırın ve değişiklikleri güvenle geri alın.', keywords: ['yakınlaştır', 'kaydır', 'geri al', 'yinele'], sections: [
      { heading: 'Yakınlaştırma ve kaydırma', bullets: ['Masaüstü: işaretçinin çevresinde yakınlaştırmak için fare tekerini kullanın. Kaydırmak için orta fare düğmesini basılı tutup sürükleyin.', 'Dokunmatik ekran: aynı anda yakınlaştırmak ve kaydırmak için iki parmak kullanın.'] },
      { heading: 'Geri Al ve Yinele', paragraphs: ['Ortadaki Geri Al ve Yinele düğmelerini kullanın. Seçili çizim öğelerini silmek aynı geçmişe kaydedilir ve geri alınabilir. Klavyede Ctrl+Z geri alır; Ctrl+Y veya Ctrl+Shift+Z yineler.'] },
    ] }),
  article('offline', 'start', 'offline', 50,
    { title: 'Autosave and Working Offline', summary: 'Understand what is saved and what happens without internet.', keywords: ['autosave', 'offline', 'local', 'saved'], sections: [
      { heading: 'Autosave', paragraphs: ['KIVI automatically saves committed drawing changes. Desktop may briefly show Saving… and then Saved. Finish a value entry or placement so the change is committed.'] },
      { heading: 'Offline use', paragraphs: ['After the app has been opened and cached, you can keep drawing without an internet connection. Projects and settings remain local to this browser.'] },
      { heading: 'Protect local work', paragraphs: ['Clearing browser or site data can remove local-only projects. PNG and PDF exports are useful output copies, but they are not editable KIVI project backups.'] },
    ] },
    { title: 'Otomatik Kayıt ve Çevrimdışı Kullanım', summary: 'Nelerin kaydedildiğini ve internet yokken ne olduğunu öğrenin.', keywords: ['otomatik kayıt', 'çevrimdışı', 'yerel', 'kaydedildi'], sections: [
      { heading: 'Otomatik kayıt', paragraphs: ['KIVI, onaylanan çizim değişikliklerini otomatik kaydeder. Masaüstünde kısa süre Kaydediliyor… ardından Kaydedildi görünebilir. Değişikliğin kayda geçmesi için değer girişini veya yerleştirmeyi tamamlayın.'] },
      { heading: 'Çevrimdışı kullanım', paragraphs: ['Uygulama bir kez açılıp önbelleğe alındıktan sonra internet bağlantısı olmadan çizmeyi sürdürebilirsiniz. Projeler ve ayarlar bu tarayıcıda yerel kalır.'] },
      { heading: 'Yerel çalışmayı koruyun', paragraphs: ['Tarayıcı veya site verilerini temizlemek yalnızca yerelde bulunan projeleri silebilir. PNG ve PDF çıktıları yararlıdır ancak düzenlenebilir KIVI proje yedeği değildir.'] },
    ] }),
  article('line', 'draw', 'drawing/line', 100,
    { title: 'Line', summary: 'Draw a line with an exact length.', keywords: ['line', 'length', 'coordinate'], sections: [
      { heading: 'Draw with mouse or touch', steps: ['Choose Line.', 'Choose the start point.', 'Choose a rough direction.', 'Enter the exact length in cm.', 'Confirm. The next line continues from the new endpoint.'] },
      { heading: 'Start from coordinates on desktop', steps: ['Type line in the command field.', 'Enter a start such as 100,100.', 'Choose direction, enter length and confirm.'] },
    ] },
    { title: 'Çizgi', summary: 'Kesin uzunlukta bir çizgi çizin.', keywords: ['çizgi', 'uzunluk', 'koordinat'], sections: [
      { heading: 'Fare veya dokunmayla çizim', steps: ['Çizgi’yi seçin.', 'Başlangıç noktasını seçin.', 'Yaklaşık yönü belirleyin.', 'Kesin uzunluğu cm olarak girin.', 'Onaylayın. Sonraki çizgi yeni uç noktadan devam eder.'] },
      { heading: 'Masaüstünde koordinatla başlama', steps: ['Komut alanına line yazın.', '100,100 gibi bir başlangıç girin.', 'Yönü seçin, uzunluğu girin ve onaylayın.'] },
    ] }),
  article('rectangle', 'draw', 'drawing/rectangle', 110,
    { title: 'Rectangle', summary: 'Create a rectangle with exact width and height.', keywords: ['rectangle', 'width', 'height'], sections: [
      { heading: 'Create a rectangle', steps: ['Choose Rectangle.', 'Choose the first corner.', 'Choose the opposite corner to set its direction and rough size.', 'Enter Width and Height.', 'Confirm.'] },
      { heading: 'After creation', paragraphs: ['Select the rectangle by its edges. Rotate can turn it around a chosen pivot; its stored width and height remain part of the shape.'] },
    ] },
    { title: 'Dikdörtgen', summary: 'Kesin genişlik ve yükseklikte dikdörtgen oluşturun.', keywords: ['dikdörtgen', 'genişlik', 'yükseklik'], sections: [
      { heading: 'Dikdörtgen oluşturma', steps: ['Dikdörtgen’i seçin.', 'İlk köşeyi seçin.', 'Yönü ve yaklaşık boyutu belirlemek için karşı köşeyi seçin.', 'Genişlik ve Yükseklik değerlerini girin.', 'Onaylayın.'] },
      { heading: 'Oluşturduktan sonra', paragraphs: ['Dikdörtgeni kenarlarından seçin. Döndür aracı, seçilen dönme noktasının çevresinde çevirebilir; genişlik ve yükseklik şeklin parçası olarak saklanır.'] },
    ] }),
  article('circle', 'draw', 'drawing/circle', 120,
    { title: 'Circle', summary: 'Create a circle by radius or diameter.', keywords: ['circle', 'radius', 'diameter'], sections: [
      { heading: 'Create a circle', steps: ['Choose Circle.', 'Choose the center.', 'Choose a point on the edge.', 'Select R for radius or D for diameter.', 'Enter the exact value and confirm.'] },
    ] },
    { title: 'Çember', summary: 'Yarıçap veya çapla çember oluşturun.', keywords: ['çember', 'yarıçap', 'çap'], sections: [
      { heading: 'Çember oluşturma', steps: ['Çember’i seçin.', 'Merkezi seçin.', 'Çember üzerindeki bir noktayı seçin.', 'Yarıçap için R, çap için D seçin.', 'Kesin değeri girip onaylayın.'] },
    ] }),
  article('arc', 'draw', 'drawing/arc', 130,
    { title: 'Arc', summary: 'Draw an arc from center, start and end.', keywords: ['arc', 'center', 'start', 'end'], sections: [
      { heading: 'Create an arc', steps: ['Choose Arc.', 'Choose the center.', 'Choose the start point to set the radius.', 'Choose the end point.'] },
      { heading: 'Arc behavior', paragraphs: ['KIVI creates the supported shortest sweep between the start and end. Advanced arc modes are not available.'] },
    ] },
    { title: 'Yay', summary: 'Merkez, başlangıç ve bitişle bir yay çizin.', keywords: ['yay', 'merkez', 'başlangıç', 'bitiş'], sections: [
      { heading: 'Yay oluşturma', steps: ['Yay’ı seçin.', 'Merkezi seçin.', 'Yarıçapı belirlemek için başlangıç noktasını seçin.', 'Bitiş noktasını seçin.'] },
      { heading: 'Yay davranışı', paragraphs: ['KIVI, başlangıç ve bitiş arasındaki desteklenen en kısa yayı oluşturur. Gelişmiş yay kipleri yoktur.'] },
    ] }),
  article('polygon', 'draw', 'drawing/polygon', 135,
    { title: 'Polygon', summary: 'Draw a regular polygon with an exact radius and side count.', keywords: ['polygon', 'triangle', 'hexagon', 'sides', 'radius'], sections: [
      { heading: 'Create a regular polygon', steps: ['Choose Polygon.', 'Choose the center.', 'Choose a rough radius and the direction of the first vertex.', 'Enter a side count from 3 to 50 and an exact radius in cm.', 'Confirm.'] },
      { heading: 'Orientation and reuse', paragraphs: ['Angle Snap can guide the first-vertex direction. KIVI remembers the last confirmed side count for the current session. Polygon vertices support Endpoint snap and edge centers support Midpoint snap.'] },
    ] },
    { title: 'Çokgen', summary: 'Kesin yarıçap ve kenar sayısıyla düzgün çokgen çizin.', keywords: ['çokgen', 'üçgen', 'altıgen', 'kenar', 'yarıçap'], sections: [
      { heading: 'Düzgün çokgen oluşturma', steps: ['Çokgen’i seçin.', 'Merkezi seçin.', 'Yaklaşık yarıçapı ve ilk köşenin yönünü belirleyin.', '3 ile 50 arasında kenar sayısı ve cm cinsinden kesin yarıçap girin.', 'Onaylayın.'] },
      { heading: 'Yön ve yeniden kullanım', paragraphs: ['Açı Yakalama ilk köşenin yönünü belirlemeye yardım eder. KIVI, geçerli oturumda son onaylanan kenar sayısını hatırlar. Çokgen köşeleri Uç Nokta, kenar merkezleri Orta Nokta yakalamayı destekler.'] },
    ] }),
  article('dimensions', 'draw', 'dimensions', 140,
    { title: 'Dimensions', summary: 'Measure a line or any two points.', keywords: ['dimension', 'measure', 'cm', 'mm'], sections: [
      { heading: 'Measure an existing line', steps: ['Choose Dimension.', 'Choose the line.', 'Move away from the line and choose where the dimension should sit.'] },
      { heading: 'Measure two points', steps: ['Choose Dimension.', 'Choose Point A.', 'Choose Point B.', 'Choose where the dimension should sit.'] },
      { heading: 'How dimensions behave', bullets: ['Display can use cm or mm, with the unit suffix shown or hidden.', 'Dimensions automatically belong to the Dimensions layer.', 'A line-linked dimension follows supported changes to that line.', 'A free two-point dimension stays independent.'] },
    ] },
    { title: 'Ölçüler', summary: 'Bir çizgiyi veya herhangi iki noktayı ölçün.', keywords: ['ölçü', 'ölçmek', 'cm', 'mm'], sections: [
      { heading: 'Var olan çizgiyi ölçme', steps: ['Ölçü’yü seçin.', 'Çizgiyi seçin.', 'Çizgiden uzaklaşıp ölçünün duracağı yeri seçin.'] },
      { heading: 'İki noktayı ölçme', steps: ['Ölçü’yü seçin.', 'A noktasını seçin.', 'B noktasını seçin.', 'Ölçünün duracağı yeri seçin.'] },
      { heading: 'Ölçülerin davranışı', bullets: ['Gösterim cm veya mm olabilir; birim yazısı gösterilebilir ya da gizlenebilir.', 'Ölçüler otomatik olarak Ölçüler katmanına gider.', 'Çizgiye bağlı ölçü, desteklenen çizgi değişikliklerini izler.', 'Serbest iki nokta ölçüsü bağımsız kalır.'] },
    ] }),
  article('measure', 'draw', 'measure', 145,
    { title: 'Measure', summary: 'Inspect geometry, distances and angles without adding drawing objects.', keywords: ['measure', 'distance', 'angle', 'temporary'], sections: [
      { heading: 'Inspect geometry', paragraphs: ['Choose Measure and click or tap a Line, Rectangle, Circle, Arc or Polygon. KIVI shows the most useful values, such as length and angle, width and height, radius and diameter, or polygon side information.'] },
      { heading: 'Measure points and angles', bullets: ['Choose two snapped or empty points to see direct distance, ΔX, ΔY and angle.', 'Choose two line-like edges to see the angle and its supplementary angle near their intersection.', 'Endpoint, Midpoint and Grid snaps are available. Angle Snap does not alter Measure points.'] },
      { heading: 'Temporary by design', paragraphs: ['Measure graphics are temporary UI overlays. They are not saved, do not enter Undo/Redo or layers, and are never included in PNG or PDF exports. Done, Escape or switching tools clears them. Hidden geometry cannot be measured; visible locked geometry can.'] },
    ] },
    { title: 'Ölç', summary: 'Çizime nesne eklemeden geometriyi, mesafeleri ve açıları inceleyin.', keywords: ['ölç', 'mesafe', 'açı', 'geçici'], sections: [
      { heading: 'Geometriyi inceleme', paragraphs: ['Ölç’ü seçip Çizgi, Dikdörtgen, Çember, Yay veya Çokgen’e tıklayın ya da dokunun. KIVI; uzunluk ve açı, genişlik ve yükseklik, yarıçap ve çap ya da çokgen kenar bilgileri gibi en yararlı değerleri gösterir.'] },
      { heading: 'Nokta ve açı ölçme', bullets: ['Doğrudan mesafe, ΔX, ΔY ve açıyı görmek için iki yakalanmış veya boş nokta seçin.', 'Kesişim yakınında açı ve bütünler açıyı görmek için çizgi benzeri iki kenar seçin.', 'Uç Nokta, Orta Nokta ve Izgara yakalama kullanılabilir. Açı Yakalama, Ölç noktalarını değiştirmez.'] },
      { heading: 'Geçici çalışma', paragraphs: ['Ölç grafikleri geçici arayüz katmanlarıdır. Kaydedilmez, Geri Al/Yinele geçmişine veya katmanlara girmez ve PNG/PDF çıktısına eklenmez. Bitir, Escape veya başka araca geçmek bunları temizler. Gizli geometri ölçülemez; görünür kilitli geometri ölçülebilir.'] },
    ] }),
  article('snapping', 'draw', 'snapping', 150,
    { title: 'Snapping', summary: 'Place points accurately without difficult coordinate work.', keywords: ['snap', 'endpoint', 'midpoint', 'grid', 'angle'], sections: [
      { heading: 'Snap types', bullets: ['Endpoint locks to the end of existing geometry.', 'Midpoint locks to the middle of supported geometry.', 'Grid locks to nearby grid intersections.', 'Angle keeps the current direction on configured angle steps; the default is 15°.', 'When several snaps are possible, endpoint and midpoint take priority over grid and angle.'] },
      { heading: 'Desktop quick controls', paragraphs: ['Use the snap controls in the desktop footer to toggle each type without opening Settings. Settings contains the same switches, grid spacing and angle interval.'] },
    ] },
    { title: 'Yakalama', summary: 'Zor koordinat işlemleri olmadan noktaları hassas yerleştirin.', keywords: ['yakalama', 'uç nokta', 'orta nokta', 'ızgara', 'açı'], sections: [
      { heading: 'Yakalama türleri', bullets: ['Uç nokta, işaretçiyi var olan geometrinin ucuna kilitler.', 'Orta nokta, işaretçiyi desteklenen geometrinin ortasına kilitler.', 'Izgara, yakındaki ızgara kesişimine kilitler.', 'Açı, yönü ayarlanan açı aralıklarında tutar; varsayılan 15°’dir.', 'Birden fazla seçenek varsa uç ve orta nokta, ızgara ve açıdan önce gelir.'] },
      { heading: 'Masaüstü hızlı kontrolleri', paragraphs: ['Ayarlar’ı açmadan türleri değiştirmek için masaüstü alt çubuğundaki yakalama kontrollerini kullanın. Aynı anahtarlar, ızgara aralığı ve açı aralığı Ayarlar’da da bulunur.'] },
    ] }),
  article('selection', 'organize', 'selection', 200,
    { title: 'Selection', summary: 'Select one object, several objects or a desktop area.', keywords: ['select', 'multi', 'box', 'ctrl', 'shift'], sections: [
      { heading: 'Select objects', bullets: ['Choose Select, then choose an object.', 'Desktop: hold Ctrl or Shift while choosing to add or remove items.', 'Desktop: drag an empty area to box-select geometry that is inside or crosses the box.', 'On mobile, tap an object to select it.'] },
      { heading: 'Protected content', paragraphs: ['Hidden geometry cannot be selected. Locked geometry stays visible but cannot be changed.'] },
    ] },
    { title: 'Seçim', summary: 'Tek nesne, birden fazla nesne veya masaüstünde bir alan seçin.', keywords: ['seç', 'çoklu', 'kutu', 'ctrl', 'shift'], sections: [
      { heading: 'Nesne seçme', bullets: ['Seç’i seçip bir nesneye dokunun veya tıklayın.', 'Masaüstü: seçim eklemek ya da çıkarmak için Ctrl veya Shift basılıyken tıklayın.', 'Masaüstü: kutunun içinde kalan veya kutuyu kesen geometrileri seçmek için boş alanda sürükleyin.', 'Mobilde bir nesneyi seçmek için dokunun.'] },
      { heading: 'Korunan içerik', paragraphs: ['Gizli geometri seçilemez. Kilitli geometri görünür kalır ancak değiştirilemez.'] },
    ] }),
  article('layers', 'organize', 'layers', 210,
    { title: 'Layers', summary: 'Organize geometry and control what can be seen or changed.', keywords: ['layers', 'default', 'dimensions', 'lock', 'hide'], sections: [
      { heading: 'Built-in layers', bullets: ['Default holds normal drawing geometry.', 'Dimensions holds dimensions automatically and cannot be the active drawing layer.'] },
      { heading: 'Layer actions', bullets: ['Create custom layers and choose the active layer.', 'Rename or delete a custom layer. Deleting moves its items to Default.', 'Show or hide a layer; hidden items are not visible, selectable or exported.', 'Lock a layer to keep it visible but protected.', 'Use the desktop right-click menu to move selected geometry to another layer.'] },
    ] },
    { title: 'Katmanlar', summary: 'Geometriyi düzenleyin; nelerin görüneceğini veya değiştirileceğini denetleyin.', keywords: ['katmanlar', 'varsayılan', 'ölçüler', 'kilit', 'gizle'], sections: [
      { heading: 'Yerleşik katmanlar', bullets: ['Varsayılan, normal çizim geometrisini tutar.', 'Ölçüler, ölçüleri otomatik tutar ve etkin çizim katmanı yapılamaz.'] },
      { heading: 'Katman işlemleri', bullets: ['Özel katmanlar oluşturup etkin katmanı seçin.', 'Özel katmanı yeniden adlandırın veya silin. Silinen katmandaki öğeler Varsayılan’a taşınır.', 'Katmanı gösterin veya gizleyin; gizli öğeler görünmez, seçilemez ve dışa aktarılmaz.', 'Katmanı görünür ancak korumalı tutmak için kilitleyin.', 'Seçili geometriyi başka katmana taşımak için masaüstü sağ tık menüsünü kullanın.'] },
    ] }),
  article('move', 'modify', 'modify/move', 300,
    { title: 'Move', summary: 'Reposition selected geometry from a precise base point.', keywords: ['move', 'base point', 'distance'], sections: [{ heading: 'Move a selection', steps: ['Select the geometry.', 'Choose Move.', 'Choose a base point; snapping is available.', 'Choose the destination or rough direction.', 'Enter the exact distance if needed, then confirm.'] }] },
    { title: 'Taşı', summary: 'Seçili geometriyi hassas bir temel noktadan taşıyın.', keywords: ['taşı', 'temel nokta', 'mesafe'], sections: [{ heading: 'Seçimi taşıma', steps: ['Geometriyi seçin.', 'Taşı’yı seçin.', 'Temel noktayı seçin; yakalama kullanılabilir.', 'Hedefi veya yaklaşık yönü seçin.', 'Gerekirse kesin mesafeyi girip onaylayın.'] }] }),
  article('copy', 'modify', 'modify/copy', 310,
    { title: 'Copy', summary: 'Place a copy while keeping the original.', keywords: ['copy', 'base point', 'destination'], sections: [{ heading: 'Copy a selection', steps: ['Select the geometry.', 'Choose Copy.', 'Choose a base point.', 'Choose the destination or rough direction.', 'Enter the exact distance if needed, then confirm.'], paragraphs: ['The original remains in place.'] }] },
    { title: 'Kopyala', summary: 'Orijinali koruyarak bir kopya yerleştirin.', keywords: ['kopyala', 'temel nokta', 'hedef'], sections: [{ heading: 'Seçimi kopyalama', steps: ['Geometriyi seçin.', 'Kopyala’yı seçin.', 'Temel noktayı seçin.', 'Hedefi veya yaklaşık yönü seçin.', 'Gerekirse kesin mesafeyi girip onaylayın.'], paragraphs: ['Orijinal yerinde kalır.'] }] }),
  article('repeat', 'modify', 'modify/repeat', 320,
    { title: 'Repeat', summary: 'Make evenly spaced copies in one direction.', keywords: ['repeat', 'array', 'spacing', 'copies'], sections: [{ heading: 'Repeat a selection', steps: ['Select the geometry.', 'Choose Repeat.', 'Choose the direction.', 'Enter Spacing.', 'Enter Copies and confirm.'], paragraphs: ['Copies means additional copies; the original is not counted. The current maximum is 500.'] }] },
    { title: 'Tekrarla', summary: 'Bir yönde eşit aralıklı kopyalar oluşturun.', keywords: ['tekrarla', 'dizi', 'aralık', 'kopya'], sections: [{ heading: 'Seçimi tekrarlama', steps: ['Geometriyi seçin.', 'Tekrarla’yı seçin.', 'Yönü seçin.', 'Aralık değerini girin.', 'Kopya sayısını girip onaylayın.'], paragraphs: ['Kopya sayısı ek kopyaları belirtir; orijinal sayılmaz. Güncel üst sınır 500’dür.'] }] }),
  article('rotate', 'modify', 'modify/rotate', 330,
    { title: 'Rotate', summary: 'Turn selected geometry around a chosen point.', keywords: ['rotate', 'pivot', 'angle'], sections: [{ heading: 'Rotate a selection', steps: ['Select the geometry.', 'Choose Rotate.', 'Choose the pivot point.', 'Choose a rough angle.', 'Enter the exact angle and confirm.'] }] },
    { title: 'Döndür', summary: 'Seçili geometriyi belirlediğiniz noktanın çevresinde döndürün.', keywords: ['döndür', 'dönme noktası', 'açı'], sections: [{ heading: 'Seçimi döndürme', steps: ['Geometriyi seçin.', 'Döndür’ü seçin.', 'Dönme noktasını seçin.', 'Yaklaşık açıyı belirleyin.', 'Kesin açıyı girip onaylayın.'] }] }),
  article('mirror', 'modify', 'modify/mirror', 340,
    { title: 'Mirror', summary: 'Reflect selected geometry across a two-point axis.', keywords: ['mirror', 'axis', 'keep original'], sections: [{ heading: 'Mirror a selection', steps: ['Select the geometry.', 'Choose Mirror.', 'Choose axis point 1.', 'Choose axis point 2.', 'Choose whether to Keep original, then confirm.'] }] },
    { title: 'Aynala', summary: 'Seçili geometriyi iki noktalı bir eksene göre yansıtın.', keywords: ['aynala', 'eksen', 'orijinali koru'], sections: [{ heading: 'Seçimi aynalama', steps: ['Geometriyi seçin.', 'Aynala’yı seçin.', 'Eksenin ilk noktasını seçin.', 'Eksenin ikinci noktasını seçin.', 'Orijinali koru seçimini yapıp onaylayın.'] }] }),
  article('offset', 'modify', 'modify/offset', 350,
    { title: 'Offset', summary: 'Create a parallel or resized copy at an exact distance.', keywords: ['offset', 'parallel', 'distance'], sections: [{ heading: 'Example: a line 10 cm away', steps: ['Choose Offset.', 'Choose the line.', 'Point to the side where the new line should go.', 'Enter 10 and confirm.'] }, { heading: 'Supported shapes', paragraphs: ['Offset currently supports Line, Rectangle, Circle and Arc. An inward value that would collapse a shape is rejected.'] }] },
    { title: 'Ofset', summary: 'Kesin mesafede paralel veya yeniden boyutlanmış bir kopya oluşturun.', keywords: ['ofset', 'paralel', 'mesafe'], sections: [{ heading: 'Örnek: 10 cm uzakta çizgi', steps: ['Ofset’i seçin.', 'Çizgiyi seçin.', 'Yeni çizginin geleceği tarafı gösterin.', '10 girip onaylayın.'] }, { heading: 'Desteklenen şekiller', paragraphs: ['Ofset şu anda Çizgi, Dikdörtgen, Çember ve Yay ile çalışır. Şekli yok edecek içe doğru değer reddedilir.'] }] }),
  article('trim', 'modify', 'modify/trim', 360,
    { title: 'Trim', summary: 'Remove an unwanted part between intersections.', keywords: ['trim', 'cut', 'red preview'], sections: [{ heading: 'Trim geometry', steps: ['Choose Trim.', 'Point to the unwanted portion.', 'Check the red preview.', 'Click or tap to remove it.'] }, { heading: 'Current support', paragraphs: ['Line and Arc can be trimmed. Visible rectangles and circles can also act as cutting boundaries.'] }] },
    { title: 'Kırp', summary: 'Kesişimler arasındaki istenmeyen parçayı kaldırın.', keywords: ['kırp', 'kes', 'kırmızı önizleme'], sections: [{ heading: 'Geometriyi kırpma', steps: ['Kırp’ı seçin.', 'İstenmeyen parçayı gösterin.', 'Kırmızı önizlemeyi kontrol edin.', 'Kaldırmak için tıklayın veya dokunun.'] }, { heading: 'Güncel destek', paragraphs: ['Çizgi ve Yay kırpılabilir. Görünür dikdörtgen ve çemberler de kesme sınırı olabilir.'] }] }),
  article('extend', 'modify', 'modify/extend', 370,
    { title: 'Extend', summary: 'Lengthen a line to the nearest visible boundary.', keywords: ['extend', 'line', 'boundary'], sections: [{ heading: 'Extend a line', steps: ['Choose Extend.', 'Point to the end of the line you want to lengthen.', 'Check the preview.', 'Click or tap to extend it to the nearest visible boundary.'] }, { heading: 'Current support', paragraphs: ['The target being extended must be a Line. Other visible geometry may act as boundaries. Arc extension is not available.'] }] },
    { title: 'Uzat', summary: 'Bir çizgiyi en yakın görünür sınıra kadar uzatın.', keywords: ['uzat', 'çizgi', 'sınır'], sections: [{ heading: 'Çizgiyi uzatma', steps: ['Uzat’ı seçin.', 'Uzatmak istediğiniz çizgi ucunu gösterin.', 'Önizlemeyi kontrol edin.', 'En yakın görünür sınıra uzatmak için tıklayın veya dokunun.'] }, { heading: 'Güncel destek', paragraphs: ['Uzatılan hedef bir Çizgi olmalıdır. Diğer görünür geometriler sınır görevi görebilir. Yay uzatma yoktur.'] }] }),
  article('context-menu', 'modify', 'context-menu', 380,
    { title: 'Desktop Right-click Menu', summary: 'Reach common actions for selected geometry.', keywords: ['right click', 'context menu'], sections: [{ heading: 'Available actions', paragraphs: ['Right-click geometry on desktop. The menu can offer Offset when valid, Move, Copy, Repeat, Rotate, Mirror, Move to layer and Delete. Locked selections keep protected actions disabled.'] }] },
    { title: 'Masaüstü Sağ Tık Menüsü', summary: 'Seçili geometri için sık kullanılan işlemlere ulaşın.', keywords: ['sağ tık', 'bağlam menüsü'], sections: [{ heading: 'Kullanılabilir işlemler', paragraphs: ['Masaüstünde geometriye sağ tıklayın. Menü, uygunsa Ofset ile birlikte Taşı, Kopyala, Tekrarla, Döndür, Aynala, Katmana taşı ve Sil işlemlerini sunar. Kilitli seçimlerde korunan işlemler devre dışı kalır.'] }] }),
  article('commands', 'reference', 'commands', 400,
    { title: 'Commands', summary: 'Start tools and actions from the desktop command field.', keywords: ['command', 'alias', 'autocomplete'], sections: [{ heading: 'Use autocomplete', paragraphs: ['Type a few letters in the desktop footer. For example, rec suggests Rectangle and lay suggests Layers. Choose a suggestion or enter a full command or alias.'] }, { heading: 'Current command list', paragraphs: ['This list comes directly from the same registry used by the command field, so names and aliases stay synchronized.'] }] },
    { title: 'Komutlar', summary: 'Masaüstü komut alanından araçları ve işlemleri başlatın.', keywords: ['komut', 'kısaltma', 'otomatik tamamlama'], sections: [{ heading: 'Komut önerilerini kullanma', paragraphs: ['Masaüstü alt çubuğuna birkaç harf yazın. Örneğin rec, Dikdörtgen’i; lay, Katmanlar’ı önerir. Bir öneri seçin veya tam komutu ya da kısaltmayı girin.'] }, { heading: 'Güncel komut listesi', paragraphs: ['Bu liste doğrudan komut alanının kullandığı kayıt sisteminden gelir; adlar ve kısaltmalar böylece eşit kalır.'] }] },
    { kind: 'commands' }),
  article('shortcuts', 'reference', 'shortcuts', 410,
    { title: 'Keyboard and Toolbar Shortcuts', summary: 'Use implemented keyboard keys and configure quick buttons.', keywords: ['keyboard', 'ctrl z', 'escape', 'delete'], sections: [
      { heading: 'Keyboard', bullets: ['Ctrl+Z: Undo.', 'Ctrl+Y or Ctrl+Shift+Z: Redo.', 'Delete or Backspace: delete the selection.', 'Escape: close the open panel, or finish the active non-selection tool.', 'Ctrl or Shift while selecting: add or remove items on desktop.'] },
      { heading: 'Toolbar shortcuts', paragraphs: ['In Settings → Shortcuts, choose any drawing or modify tool for mobile and web. Mobile allows up to three and web up to five. Undo and Redo are fixed on both layouts; Delete is also fixed on mobile and can be undone. These actions are not shortcut choices. Changes save immediately; chosen tools appear in the center of the top row.'] },
    ] },
    { title: 'Klavye ve Araç Çubuğu Kısayolları', summary: 'Uygulanan klavye tuşlarını kullanın ve hızlı düğmeleri ayarlayın.', keywords: ['klavye', 'ctrl z', 'escape', 'sil'], sections: [
      { heading: 'Klavye', bullets: ['Ctrl+Z: Geri Al.', 'Ctrl+Y veya Ctrl+Shift+Z: Yinele.', 'Delete veya Backspace: seçimi sil.', 'Escape: açık paneli kapatır veya etkin seçim dışı aracı bitirir.', 'Seçim sırasında Ctrl veya Shift: masaüstünde öğe ekler ya da çıkarır.'] },
      { heading: 'Araç çubuğu kısayolları', paragraphs: ['Ayarlar → Kısayollar bölümünde mobil ve web için herhangi bir çizim veya düzenleme aracını seçin. Mobilde en fazla üç, webde en fazla beş seçim yapılabilir. Geri Al ve Yinele iki görünümde de sabittir; Sil de mobilde sabittir ve geri alınabilir. Bu işlemler kısayol seçeneği değildir. Değişiklikler hemen kaydedilir ve seçilen araçlar üst satırın ortasında görünür.'] },
    ] }),
  article('export-sharing', 'reference', 'export', 420,
    { title: 'Export and Sharing', summary: 'Create drawing-only PNG or PDF output.', keywords: ['export', 'png', 'pdf', 'share', 'link'], sections: [
      { heading: 'PNG and PDF', steps: ['Open Share.', 'Choose PNG or PDF.', 'Your browser downloads the result.'] },
      { heading: 'What is exported', bullets: ['The drawing background is transparent.', 'The grid and editor controls are excluded.', 'Only visible layers are included.', 'Visible dimensions are included.'] },
      { heading: 'Public links', paragraphs: ['Public-link sharing is not active. It requires future cloud backup and a backend. PNG and PDF export work now.'] },
    ] },
    { title: 'Dışa Aktarma ve Paylaşım', summary: 'Yalnızca çizimi içeren PNG veya PDF çıktısı oluşturun.', keywords: ['dışa aktar', 'png', 'pdf', 'paylaş', 'bağlantı'], sections: [
      { heading: 'PNG ve PDF', steps: ['Paylaş’ı açın.', 'PNG veya PDF’yi seçin.', 'Tarayıcınız sonucu indirir.'] },
      { heading: 'Dışa aktarılan içerik', bullets: ['Çizim arka planı şeffaftır.', 'Izgara ve editör kontrolleri dahil edilmez.', 'Yalnızca görünür katmanlar dahil edilir.', 'Görünür ölçüler dahil edilir.'] },
      { heading: 'Herkese açık bağlantılar', paragraphs: ['Herkese açık bağlantıyla paylaşım etkin değildir. Gelecekte bulut yedekleme ve sunucu gerekir. PNG ve PDF dışa aktarma şimdi çalışır.'] },
    ] }, { aliases: ['sharing'] }),
  article('fullscreen', 'reference', 'fullscreen', 430,
    { title: 'Drawing Fullscreen', summary: 'Give the canvas more room while drawing.', keywords: ['fullscreen', 'exit'], sections: [{ heading: 'Enter and exit', paragraphs: ['Use the floating Fullscreen button on the canvas. In fullscreen, use the visible exit control to return to the editor. The normal header and desktop footer are hidden while fullscreen is active.'] }] },
    { title: 'Çizim Tam Ekranı', summary: 'Çizerken tuvale daha fazla yer ayırın.', keywords: ['tam ekran', 'çıkış'], sections: [{ heading: 'Giriş ve çıkış', paragraphs: ['Tuval üzerindeki yüzen Tam Ekran düğmesini kullanın. Editöre dönmek için tam ekrandaki görünür çıkış kontrolünü seçin. Tam ekran etkinken normal başlık ve masaüstü alt çubuğu gizlenir.'] }] }),
  article('settings', 'reference', 'settings', 440,
    { title: 'Settings', summary: 'Adjust the interface, drawing defaults and snapping.', keywords: ['settings', 'canvas', 'theme', 'reset'], sections: [
      { heading: 'Sections', bullets: ['Preferences: language, Light/Dark theme, autosave and local-first information.', 'Shortcuts: mobile and web tool buttons.', 'Canvas: background, grid color and visibility, spacing, line color and width.', 'Dimensions: dimension color, cm/mm and unit suffix.', 'Snap: endpoint, midpoint, grid, angle and angle interval.'] },
      { heading: 'Saving and closing', paragraphs: ['Changes save automatically. Done closes Settings. Escape closes it on desktop. Reset restores default settings; there is no Save button.'] },
      { heading: 'Appearance rules', bullets: ['Changing the UI theme applies matching background, grid, and line colors to the current drawing.', 'Changing the line color recolors existing geometry as well as new geometry. Line width still applies to new geometry.', 'Canvas and dimension settings apply to the current project when Settings is opened from the editor.'] },
    ] },
    { title: 'Ayarlar', summary: 'Arayüzü, çizim varsayılanlarını ve yakalamayı ayarlayın.', keywords: ['ayarlar', 'tuval', 'tema', 'sıfırla'], sections: [
      { heading: 'Bölümler', bullets: ['Tercihler: dil, Açık/Koyu tema, otomatik kayıt ve yerel çalışma bilgisi.', 'Kısayollar: mobil ve web araç düğmeleri.', 'Tuval: arka plan, ızgara rengi ve görünürlüğü, aralık, çizgi rengi ve kalınlığı.', 'Ölçüler: ölçü rengi, cm/mm ve birim yazısı.', 'Yakalama: uç nokta, orta nokta, ızgara, açı ve açı aralığı.'] },
      { heading: 'Kaydetme ve kapatma', paragraphs: ['Değişiklikler otomatik kaydedilir. Bitir, Ayarlar’ı kapatır. Masaüstünde Escape de kapatır. Sıfırla varsayılan ayarlara döner; Kaydet düğmesi yoktur.'] },
      { heading: 'Görünüm kuralları', bullets: ['Arayüz temasını değiştirmek güncel çizime uyumlu arka plan, ızgara ve çizgi renklerini uygular.', 'Çizgi rengini değiştirmek yeni geometrilerle birlikte var olan geometrileri de yeniden renklendirir. Çizgi kalınlığı yalnızca yeni geometrilere uygulanır.', 'Ayarlar editörden açıldığında tuval ve ölçü ayarları güncel projeye uygulanır.'] },
    ] }),
  article('release-notes', 'product', 'release-notes', 500,
    { title: 'Release Notes', summary: 'Recent user-visible improvements in KIVI.', keywords: ['release', 'new', 'changes'], sections: [
      { heading: '0.1.6 · 2 October 2026', bullets: ['New: Draw regular Polygons with 3–50 sides, exact radius and snap-aware orientation.', 'New: Measure geometry, point-to-point distances and angles with temporary non-destructive overlays.'] },
      { heading: '0.1.5 · 1 October 2026', bullets: ['Improved: Any drawing or modify tool can be placed as a centered top-row shortcut.', 'Improved: Mobile now keeps an undoable Delete action beside Undo and Redo.', 'Improved: Language and theme now live together under Preferences.', 'Improved: Autosave status moved to a clear lower-left label on mobile, and the empty Project Hub now has a KIVI mascot.'] },
      { heading: '0.1.4 · 1 October 2026', bullets: ['New: Complete bilingual Help Center with synchronized English and Turkish articles.', 'Improved: Responsive editor header, centered tool groups, working configurable shortcuts and left-side Projects panel.', 'Fixed: Matching transparent light and dark logo assets and clearer mobile Settings navigation.'] },
      { heading: '0.1.3 · Drawing and editing tools', bullets: ['New: Rectangle, Circle, Arc, Move, Copy, Repeat, Rotate, Mirror and Extend.', 'New: Offset and Trim with visual previews.', 'Improved: Line coordinate starts and precise base-point snapping.'] },
      { heading: '0.1.2 · Measurement and organization', bullets: ['New: Free two-point dimensions and line-linked dimensions.', 'New: Default, Dimensions and custom layers with visibility and locking.', 'Improved: Desktop snap quick controls and configurable angle interval.'] },
      { heading: '0.1.1 · Projects and output', bullets: ['Improved: Project Hub and two-level desktop/mobile editor interface.', 'Fixed: Transparent PNG/PDF output, correct orientation and visible-layer export.', 'Improved: Local autosave and offline-ready application behavior.'] },
    ] },
    { title: 'Sürüm Notları', summary: 'KIVI’deki son kullanıcıya dönük iyileştirmeler.', keywords: ['sürüm', 'yeni', 'değişiklikler'], sections: [
      { heading: '0.1.6 · 2 Ekim 2026', bullets: ['Yeni: 3–50 kenarlı, kesin yarıçaplı ve yakalamayla yönlendirilebilen düzgün Çokgen çizimi.', 'Yeni: Geometriyi, iki nokta mesafelerini ve açıları geçici, çizimi değiştirmeyen katmanlarla inceleyen Ölç aracı.'] },
      { heading: '0.1.5 · 1 Ekim 2026', bullets: ['İyileştirildi: Her çizim veya düzenleme aracı üst satırın ortasına kısayol olarak eklenebilir.', 'İyileştirildi: Mobilde Geri Al ve Yinele yanında geri alınabilir sabit Sil işlemi bulunuyor.', 'İyileştirildi: Dil ve tema artık Tercihler altında birlikte bulunuyor.', 'İyileştirildi: Otomatik kayıt durumu mobilde anlaşılır bir sol alt yazıya taşındı; boş Proje Merkezi’ne KIVI maskotu eklendi.'] },
      { heading: '0.1.4 · 1 Ekim 2026', bullets: ['Yeni: Eşlenmiş İngilizce ve Türkçe makalelerle eksiksiz iki dilli Yardım Merkezi.', 'İyileştirildi: Duyarlı editör başlığı, ortalanmış araç grupları, çalışan ayarlanabilir kısayollar ve soldan açılan Projeler paneli.', 'Düzeltildi: Birbiriyle uyumlu şeffaf açık/koyu logo dosyaları ve daha anlaşılır mobil Ayarlar gezintisi.'] },
      { heading: '0.1.3 · Çizim ve düzenleme araçları', bullets: ['Yeni: Dikdörtgen, Çember, Yay, Taşı, Kopyala, Tekrarla, Döndür, Aynala ve Uzat.', 'Yeni: Görsel önizlemeli Ofset ve Kırp.', 'İyileştirildi: Koordinatla Çizgi başlangıcı ve hassas temel nokta yakalama.'] },
      { heading: '0.1.2 · Ölçüm ve düzen', bullets: ['Yeni: Serbest iki nokta ölçüleri ve çizgiye bağlı ölçüler.', 'Yeni: Görünürlük ve kilitleme destekli Varsayılan, Ölçüler ve özel katmanlar.', 'İyileştirildi: Masaüstü hızlı yakalama kontrolleri ve ayarlanabilir açı aralığı.'] },
      { heading: '0.1.1 · Projeler ve çıktı', bullets: ['İyileştirildi: Proje Merkezi ve iki seviyeli masaüstü/mobil editör arayüzü.', 'Düzeltildi: Şeffaf PNG/PDF çıktısı, doğru yön ve görünür katman dışa aktarımı.', 'İyileştirildi: Yerel otomatik kayıt ve çevrimdışına hazır uygulama davranışı.'] },
    ] }),
  article('about', 'product', 'about', 510,
    { title: 'About KIVI', summary: 'A fast measured drawing tool that anyone can use.', keywords: ['about', 'kivi', 'motto'], sections: [{ heading: 'Built for practical work', paragraphs: ['KIVI helps people plan workshop, metalwork, carpentry, tile and home projects without a heavy CAD interface. Draw quickly, enter real measurements and keep work local.'] }, { heading: 'Our motto', paragraphs: ['Everyone can use it.'] }] },
    { title: 'KIVI Hakkında', summary: 'Herkesin kullanabileceği hızlı bir ölçülü çizim aracı.', keywords: ['hakkında', 'kivi', 'slogan'], sections: [{ heading: 'Pratik işler için', paragraphs: ['KIVI; atölye, metal işleri, marangozluk, fayans ve ev projelerini ağır bir CAD arayüzü olmadan planlamaya yardımcı olur. Hızla çizin, gerçek ölçüleri girin ve çalışmanızı yerelde tutun.'] }, { heading: 'Sloganımız', paragraphs: ['Herkes kullanabilir.'] }] }),
  article('social', 'product', 'social', 520,
    { title: 'Social', summary: 'Find official KIVI community links when they are published.', keywords: ['social', 'community'], sections: [{ heading: 'Official links', paragraphs: ['No official social profiles are published in KIVI yet. Links will appear here only after they are available.'] }] },
    { title: 'Sosyal', summary: 'Yayımlandığında resmi KIVI topluluk bağlantılarını burada bulun.', keywords: ['sosyal', 'topluluk'], sections: [{ heading: 'Resmi bağlantılar', paragraphs: ['KIVI’de henüz yayımlanmış resmi sosyal profil yoktur. Bağlantılar yalnızca kullanıma açıldıktan sonra burada yer alacaktır.'] }] }),
  article('feedback', 'product', 'feedback', 530,
    { title: 'Provide Feedback', summary: 'Tell the developer what would make KIVI more useful.', keywords: ['feedback', 'email', 'message'], sections: [] },
    { title: 'Geri Bildirim Gönder', summary: 'KIVI’yi daha kullanışlı yapacak önerinizi geliştiriciyle paylaşın.', keywords: ['geri bildirim', 'e-posta', 'mesaj'], sections: [] },
    { kind: 'feedback' }),
  article('support', 'product', 'support', 540,
    { title: 'Contact Support', summary: 'Contact the KIVI developer directly.', keywords: ['support', 'email', 'developer'], sections: [{ heading: 'Developer support email', paragraphs: ['For a problem or question, describe what you were doing and what happened. Do not include passwords or private project data.'] }] },
    { title: 'Destek', summary: 'KIVI geliştiricisiyle doğrudan iletişime geçin.', keywords: ['destek', 'e-posta', 'geliştirici'], sections: [{ heading: 'Geliştirici destek e-postası', paragraphs: ['Bir sorun veya soru için ne yaptığınızı ve ne olduğunu kısaca anlatın. Parola veya özel proje verisi göndermeyin.'] }] },
    { kind: 'support' }),
] as const

export const helpMetadata = { appVersion: '0.1.0', lastUpdated: '2026-10-01' } as const
export const developerSupportEmail = 'u.burak.tomac@gmail.com'

export const helpCategories: Record<Locale, Record<HelpCategoryId, string>> = {
  en: { start: 'Start', draw: 'Draw and measure', organize: 'Select and organize', modify: 'Modify', reference: 'Reference', product: 'KIVI' },
  tr: { start: 'Başlangıç', draw: 'Çizim ve ölçü', organize: 'Seçim ve düzen', modify: 'Düzenle', reference: 'Başvuru', product: 'KIVI' },
}

export const helpUi = {
  en: {
    center: 'Help Center', openKivi: 'Open KIVI', guide: 'KIVI GUIDE', english: 'English', turkish: 'Türkçe', language: 'Help language',
    startHere: 'Start here', popularTools: 'Popular tools', learnMore: 'Learn more', commands: 'Command', aliases: 'Aliases', noAlias: '—',
    email: 'Email', message: 'Feedback', challenge: 'Anti-spam: What is 3 + 4?', send: 'Send feedback',
    invalid: 'Please check all fields and answer the anti-spam question.', unavailable: 'Sending is not active yet. Your message has not been submitted.', sent: 'Feedback sent.', failed: 'Feedback could not be sent.',
  },
  tr: {
    center: 'Yardım Merkezi', openKivi: 'KIVI’yi Aç', guide: 'KIVI REHBERİ', english: 'English', turkish: 'Türkçe', language: 'Yardım dili',
    startHere: 'Buradan başlayın', popularTools: 'Sık kullanılan araçlar', learnMore: 'Daha fazlası', commands: 'Komut', aliases: 'Kısaltmalar', noAlias: '—',
    email: 'E-posta', message: 'Geri bildirim', challenge: 'İstenmeyen ileti denetimi: 3 + 4 kaçtır?', send: 'Geri bildirim gönder',
    invalid: 'Tüm alanları kontrol edin ve güvenlik sorusunu yanıtlayın.', unavailable: 'Gönderim henüz etkin değil. Mesajınız gönderilmedi.', sent: 'Geri bildirim gönderildi.', failed: 'Geri bildirim gönderilemedi.',
  },
} as const

export const helpHomeGroups: Record<Locale, { title: string; ids: HelpArticleId[] }[]> = {
  en: [
    { title: helpUi.en.startHere, ids: ['getting-started', 'projects', 'editor'] },
    { title: helpUi.en.popularTools, ids: ['line', 'dimensions', 'move', 'trim'] },
    { title: helpUi.en.learnMore, ids: ['layers', 'commands', 'export-sharing'] },
  ],
  tr: [
    { title: helpUi.tr.startHere, ids: ['getting-started', 'projects', 'editor'] },
    { title: helpUi.tr.popularTools, ids: ['line', 'dimensions', 'move', 'trim'] },
    { title: helpUi.tr.learnMore, ids: ['layers', 'commands', 'export-sharing'] },
  ],
}

export function helpArticlesForLocale(locale: Locale): LocalizedHelpArticle[] {
  return helpManifest.map(({ id, category, slug, order, kind, locales }) => ({ id, category, slug, order, kind, ...locales[locale] }))
}

export function helpLocaleForSetting(value: unknown): Locale {
  return value === 'tr' ? 'tr' : 'en'
}

export const helpArticles = helpArticlesForLocale('en')

export function helpArticleForPath(pathname: string, locale: Locale = 'en'): LocalizedHelpArticle {
  const path = pathname.replace(/^\/help\/?/, '').replace(/\/$/, '')
  const definition = helpManifest.find((item) => item.slug === path || item.aliases?.includes(path)) ?? helpManifest[0]!
  return { id: definition.id, category: definition.category, slug: definition.slug, order: definition.order, kind: definition.kind, ...definition.locales[locale] }
}

export function helpPath(articleOrId: LocalizedHelpArticle | HelpArticleId) {
  const id = typeof articleOrId === 'string' ? articleOrId : articleOrId.id
  const definition = helpManifest.find((item) => item.id === id) ?? helpManifest[0]!
  return definition.id === 'home' ? '/help' : `/help/${definition.slug}`
}

export function validateHelpManifest() {
  const errors: string[] = []
  const ids = new Set<string>()
  const slugs = new Set<string>()
  for (const item of helpManifest) {
    if (ids.has(item.id)) errors.push(`Duplicate Help id: ${item.id}`)
    if (slugs.has(item.slug)) errors.push(`Duplicate Help slug: ${item.slug}`)
    ids.add(item.id)
    slugs.add(item.slug)
    for (const locale of ['en', 'tr'] as const) {
      const value = item.locales[locale]
      if (!value?.title.trim() || !value.summary.trim()) errors.push(`Missing ${locale} content: ${item.id}`)
      if (item.kind === 'standard' && value.sections.length === 0) errors.push(`Missing ${locale} sections: ${item.id}`)
    }
  }
  return errors
}
