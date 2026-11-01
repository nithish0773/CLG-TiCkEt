export interface AvatarPreset {
  id: string
  name: string
  roleLabel: string
  dataUrl: string
}

function makeSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'student-blue',
    name: 'Student Explorer',
    roleLabel: 'Undergraduate / Scholar',
    dataUrl: makeSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg-sb" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3B82F6"/>
            <stop offset="100%" stop-color="#1D4ED8"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#bg-sb)"/>
        <!-- Head -->
        <circle cx="50" cy="40" r="18" fill="#FED7AA"/>
        <!-- Hair / Cap -->
        <path d="M30 36 C30 24, 70 24, 70 36 Z" fill="#1E293B"/>
        <polygon points="50,18 72,25 50,32 28,25" fill="#0F172A"/>
        <circle cx="50" cy="25" r="2.5" fill="#F59E0B"/>
        <path d="M72 25 L75 38" stroke="#F59E0B" stroke-width="2"/>
        <!-- Face Features -->
        <circle cx="44" cy="41" r="2" fill="#334155"/>
        <circle cx="56" cy="41" r="2" fill="#334155"/>
        <path d="M46 48 Q50 52 54 48" stroke="#EA580C" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Body / Hoodie -->
        <path d="M22 88 C24 64, 76 64, 78 88 Z" fill="#2563EB"/>
        <polygon points="50,66 43,80 57,80" fill="#DBEAFE"/>
      </svg>
    `.trim()),
  },
  {
    id: 'innovator-purple',
    name: 'Campus Innovator',
    roleLabel: 'Researcher / Tech Lead',
    dataUrl: makeSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg-ip" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8B5CF6"/>
            <stop offset="100%" stop-color="#6D28D9"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#bg-ip)"/>
        <!-- Head -->
        <circle cx="50" cy="42" r="18" fill="#FDE047"/>
        <!-- Modern Hair -->
        <path d="M32 38 C32 20, 68 18, 68 38 C62 30, 42 28, 32 38 Z" fill="#312E81"/>
        <!-- Glasses -->
        <rect x="36" y="38" width="11" height="8" rx="2" fill="none" stroke="#4338CA" stroke-width="2"/>
        <rect x="53" y="38" width="11" height="8" rx="2" fill="none" stroke="#4338CA" stroke-width="2"/>
        <line x1="47" y1="42" x2="53" y2="42" stroke="#4338CA" stroke-width="2"/>
        <!-- Smile -->
        <path d="M46 51 Q50 54 54 51" stroke="#B45309" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Body / Jacket -->
        <path d="M20 90 C22 66, 78 66, 80 90 Z" fill="#4C1D95"/>
        <path d="M42 68 L50 82 L58 68 Z" fill="#C4B5FD"/>
      </svg>
    `.trim()),
  },
  {
    id: 'engineer-amber',
    name: 'Facilities Engineer',
    roleLabel: 'Operations / Maintenance',
    dataUrl: makeSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg-ea" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#F59E0B"/>
            <stop offset="100%" stop-color="#D97706"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#bg-ea)"/>
        <!-- Head -->
        <circle cx="50" cy="44" r="18" fill="#FED7AA"/>
        <!-- Hardhat -->
        <path d="M28 36 C28 22, 72 22, 72 36 Z" fill="#FBBF24"/>
        <rect x="24" y="34" width="52" height="5" rx="2.5" fill="#F59E0B"/>
        <rect x="47" y="24" width="6" height="12" fill="#D97706"/>
        <!-- Eyes & Smile -->
        <circle cx="43" cy="45" r="2" fill="#334155"/>
        <circle cx="57" cy="45" r="2" fill="#334155"/>
        <path d="M46 52 Q50 56 54 52" stroke="#C2410C" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Body / High-vis Vest -->
        <path d="M20 90 C22 68, 78 68, 80 90 Z" fill="#047857"/>
        <rect x="36" y="70" width="8" height="20" fill="#FBBF24"/>
        <rect x="56" y="70" width="8" height="20" fill="#FBBF24"/>
      </svg>
    `.trim()),
  },
  {
    id: 'scholar-emerald',
    name: 'Academic Scholar',
    roleLabel: 'Faculty / Department Chair',
    dataUrl: makeSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg-se" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10B981"/>
            <stop offset="100%" stop-color="#059669"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#bg-se)"/>
        <!-- Head -->
        <circle cx="50" cy="42" r="18" fill="#FBCFE8"/>
        <!-- Hair -->
        <path d="M30 38 C30 18, 70 18, 70 38 C60 26, 40 26, 30 38 Z" fill="#374151"/>
        <!-- Specs -->
        <circle cx="43" cy="42" r="5" fill="none" stroke="#1F2937" stroke-width="2"/>
        <circle cx="57" cy="42" r="5" fill="none" stroke="#1F2937" stroke-width="2"/>
        <line x1="48" y1="42" x2="52" y2="42" stroke="#1F2937" stroke-width="2"/>
        <path d="M46 52 Q50 55 54 52" stroke="#BE185D" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Blazer -->
        <path d="M20 90 C22 66, 78 66, 80 90 Z" fill="#065F46"/>
        <polygon points="50,68 44,84 56,84" fill="#D1FAE5"/>
      </svg>
    `.trim()),
  },
  {
    id: 'developer-cyan',
    name: 'Developer Super Admin',
    roleLabel: 'Infrastructure / Core Dev',
    dataUrl: makeSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg-dc" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#06B6D4"/>
            <stop offset="100%" stop-color="#0284C7"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#bg-dc)"/>
        <!-- Head -->
        <circle cx="50" cy="42" r="18" fill="#FED7AA"/>
        <!-- Beanie / Hair -->
        <path d="M32 36 C32 20, 68 20, 68 36 Z" fill="#0F172A"/>
        <rect x="30" y="34" width="40" height="5" rx="2.5" fill="#334155"/>
        <!-- Headset -->
        <path d="M30 42 C26 42, 26 34, 32 30" stroke="#E2E8F0" stroke-width="3" fill="none"/>
        <circle cx="28" cy="42" r="4" fill="#64748B"/>
        <!-- Eyes & Smile -->
        <circle cx="44" cy="44" r="2" fill="#0F172A"/>
        <circle cx="56" cy="44" r="2" fill="#0F172A"/>
        <path d="M46 51 Q50 54 54 51" stroke="#EA580C" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Hoodie -->
        <path d="M20 90 C22 66, 78 66, 80 90 Z" fill="#0F172A"/>
        <!-- Terminal Prompt Icon on Chest -->
        <text x="50" y="80" font-family="monospace" font-size="9" font-weight="bold" fill="#38BDF8" text-anchor="middle">&gt;_ FIXIT</text>
      </svg>
    `.trim()),
  },
  {
    id: 'executive-indigo',
    name: 'Campus Manager',
    roleLabel: 'Administration & Governance',
    dataUrl: makeSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg-ei" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4F46E5"/>
            <stop offset="100%" stop-color="#312E81"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#bg-ei)"/>
        <!-- Head -->
        <circle cx="50" cy="42" r="18" fill="#FDE68A"/>
        <!-- Slick Hair -->
        <path d="M32 36 C32 22, 68 20, 68 36 C58 30, 40 30, 32 36 Z" fill="#18181B"/>
        <!-- Face Features -->
        <circle cx="43" cy="43" r="2" fill="#27272A"/>
        <circle cx="57" cy="43" r="2" fill="#27272A"/>
        <path d="M46 51 Q50 54 54 51" stroke="#D97706" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Suit & Tie -->
        <path d="M20 90 C22 66, 78 66, 80 90 Z" fill="#1E1B4B"/>
        <polygon points="50,66 43,82 57,82" fill="#FFFFFF"/>
        <polygon points="50,70 52,80 50,86 48,80" fill="#EF4444"/>
      </svg>
    `.trim()),
  },
  {
    id: 'creative-rose',
    name: 'Design & Culture',
    roleLabel: 'Arts, Council & Activities',
    dataUrl: makeSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg-cr" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#F43F5E"/>
            <stop offset="100%" stop-color="#BE123C"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#bg-cr)"/>
        <!-- Head -->
        <circle cx="50" cy="42" r="18" fill="#FED7AA"/>
        <!-- Creative Hairstyle -->
        <path d="M30 40 C28 22, 72 20, 70 40 C64 26, 36 26, 30 40 Z" fill="#881337"/>
        <circle cx="34" cy="42" r="5" fill="#881337"/>
        <circle cx="66" cy="42" r="5" fill="#881337"/>
        <!-- Face Features -->
        <circle cx="44" cy="43" r="2" fill="#4C0519"/>
        <circle cx="56" cy="43" r="2" fill="#4C0519"/>
        <path d="M46 51 Q50 55 54 51" stroke="#E11D48" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Stylized Top -->
        <path d="M20 90 C22 66, 78 66, 80 90 Z" fill="#9F1239"/>
        <circle cx="50" cy="74" r="5" fill="#FDE047"/>
      </svg>
    `.trim()),
  },
  {
    id: 'office-teal',
    name: 'Office Operations',
    roleLabel: 'Registrar & Student Affairs',
    dataUrl: makeSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg-ot" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#14B8A6"/>
            <stop offset="100%" stop-color="#0F766E"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#bg-ot)"/>
        <!-- Head -->
        <circle cx="50" cy="42" r="18" fill="#FDE68A"/>
        <!-- Short Neat Hair -->
        <path d="M32 36 C32 22, 68 22, 68 36 Z" fill="#134E4A"/>
        <!-- Eyes & Smile -->
        <circle cx="44" cy="43" r="2" fill="#042F2E"/>
        <circle cx="56" cy="43" r="2" fill="#042F2E"/>
        <path d="M46 51 Q50 54 54 51" stroke="#0D9488" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Corporate Shirt -->
        <path d="M20 90 C22 66, 78 66, 80 90 Z" fill="#0D9488"/>
        <polygon points="50,68 44,80 56,80" fill="#CCFBF1"/>
      </svg>
    `.trim()),
  },
]

/**
 * Reads any user-selected image file, validates, crops/scales to max 256x256,
 * and produces a compact base64 JPEG/PNG data URL under 35KB.
 */
export function compressImageFile(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file (PNG, JPG, WebP).'))
    }

    if (file.size > 10 * 1024 * 1024) {
      return reject(new Error('Image file is too large. Max file size is 10 MB.'))
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to decode image data.'))
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Calculate aspect-preserving thumbnail dimensions
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(reader.result as string)

        ctx.drawImage(img, 0, 0, width, height)
        // Compress as jpeg with 0.85 quality for compact storage
        const compressed = canvas.toDataURL('image/jpeg', 0.85)
        resolve(compressed)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

