import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    open: true,
    // 日本語パスのアセットを正しく配信
    fs: {
      strict: false
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html'
    },
    // アセットファイル名にハッシュを付与
    assetsDir: 'assets',
    sourcemap: true
  },
  // 開発サーバーでの静的アセット配信
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg']
});
