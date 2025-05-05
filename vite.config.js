import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import {fileURLToPath} from 'url'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(fileURLToPath(new URL('.', import.meta.url)), './src')
        }
    },
    server: {
        host: '0.0.0.0',
        port: 5173
    },
    // build: {
    //     outDir: './dist',
    //     sourcemap: true,
    //     rollupOptions: {
    //         output: {
    //             entryFileNames: '[name].js',
    //             chunkFileNames: '[name].js',
    //             assetFileNames: '[name].[ext]'
    //         }
    //     }
    // }
});