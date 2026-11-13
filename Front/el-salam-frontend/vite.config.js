import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import fs from 'fs'
import process from 'node:process'
import { fileURLToPath } from 'url'

// حساب المسار الحالي للملف عشان نحدد المسارات النسبية بأمان
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// المسار النسبي الآمن لفولدر wwwroot الخاص بمشروع الـ API (بيتعامل مع الحروف العربي والمسافات بسلاسة)
const backendWwwrootDir = path.resolve(
  __dirname,
  '../../El-Salam-Warehouse/src/El-Salam-Warehouse.Api/wwwroot'
)

// بلجن صغير في Vite عشان يحافظ على ملف .gitkeep في wwwroot بعد ما emptyOutDir يمسح الفولدر وقت البيلد
function preserveGitkeepPlugin(targetDir) {
  return {
    name: 'preserve-gitkeep-plugin',
    closeBundle() {
      try {
        const gitkeepPath = path.join(targetDir, '.gitkeep')
        if (!fs.existsSync(gitkeepPath)) {
          fs.writeFileSync(gitkeepPath, '', 'utf-8')
        }
      } catch (err) {
        console.warn('تعذر إعادة إنشاء ملف .gitkeep في wwwroot:', err)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // قراءة متغيرات البيئة وقت التطوير
  const env = loadEnv(mode, process.cwd(), '')

  // عنوان الباك إند وقت التطوير الافتراضي هو بورت الـ HTTP (5271) لتجنب مشاكل شهادة الـ SSL المحلية
  // ويمكن تغييره عبر متغير بيئة VITE_DEV_API_TARGET لو حابب توجه التطوير لسيرفر runasp.net المنشور
  const devApiTarget = env.VITE_DEV_API_TARGET || 'http://localhost:5271'

  return {
    // base بـ / عشان كل مسارات الـ assets تشتغل من أي مسار فرعي في الـ React Router
    base: '/',
    plugins: [
      react(),
      tailwindcss(),
      preserveGitkeepPlugin(backendWwwrootDir),
    ],
    server: {
      proxy: {
        // تحويل أي طلب يبدأ بـ /api وقت التطوير إلى الباك إند مباشرة
        '/api': {
          target: devApiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: backendWwwrootDir,
      emptyOutDir: true,
    },
  }
})
