// vite.config.js
import { resolve } from "path";
import { defineConfig } from "file:///Users/superlucky84/project/state-ref/node_modules/.pnpm/vite@5.4.8_terser@5.18.1/node_modules/vite/dist/node/index.js";
import checker from "file:///Users/superlucky84/project/state-ref/node_modules/.pnpm/vite-plugin-checker@0.6.1_eslint@8.57.1_optionator@0.9.4_typescript@5.6.3_vite@5.4.8_terser@5.18.1_/node_modules/vite-plugin-checker/dist/esm/main.js";
import dts from "file:///Users/superlucky84/project/state-ref/node_modules/.pnpm/vite-plugin-dts@2.3.0_rollup@4.24.0_vite@5.4.8_terser@5.18.1_/node_modules/vite-plugin-dts/dist/index.mjs";
import vue from "file:///Users/superlucky84/project/state-ref/node_modules/.pnpm/@vitejs+plugin-vue@5.1.4_vite@5.4.8_terser@5.18.1__vue@3.5.10_typescript@5.6.3_/node_modules/@vitejs/plugin-vue/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/superlucky84/project/state-ref/packages/connect-vue";
var vite_config_default = defineConfig({
  plugins: [
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx}"'
      }
    }),
    dts({
      outputDir: ["dist"]
    }),
    vue()
  ],
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    emptyOutDir: false,
    sourcemap: true,
    minify: true,
    lib: {
      entry: resolve(__vite_injected_original_dirname, "src"),
      name: "stateref-connect-vue",
      formats: ["es", "umd", "cjs"],
      fileName: (format) => {
        if (format === "umd") return "stateref-connect-vue.umd.js";
        return format === "cjs" ? "stateref-connect-vue.cjs" : "stateref-connect-vue.mjs";
      }
    },
    rollupOptions: {
      external: ["state-ref", "vue"],
      output: {
        globals: {
          "state-ref": "stateRef",
          vue: "vue"
        }
      }
    }
  },
  test: {
    environment: "jsdom",
    includeSource: ["src/tests/**/*.{js,ts,jsx,tsx}"],
    setupFiles: "./test/setup.ts",
    globals: true
  },
  server: {
    open: "./html/vue/default.html"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc3VwZXJsdWNreTg0L3Byb2plY3Qvc3RhdGUtcmVmL3BhY2thZ2VzL2Nvbm5lY3QtdnVlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvc3VwZXJsdWNreTg0L3Byb2plY3Qvc3RhdGUtcmVmL3BhY2thZ2VzL2Nvbm5lY3QtdnVlL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9zdXBlcmx1Y2t5ODQvcHJvamVjdC9zdGF0ZS1yZWYvcGFja2FnZXMvY29ubmVjdC12dWUvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCBjaGVja2VyIGZyb20gJ3ZpdGUtcGx1Z2luLWNoZWNrZXInO1xuaW1wb3J0IGR0cyBmcm9tICd2aXRlLXBsdWdpbi1kdHMnO1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgY2hlY2tlcih7XG4gICAgICB0eXBlc2NyaXB0OiB0cnVlLFxuICAgICAgZXNsaW50OiB7XG4gICAgICAgIGxpbnRDb21tYW5kOiAnZXNsaW50IFwiLi9zcmMvKiovKi57dHMsdHN4fVwiJyxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgZHRzKHtcbiAgICAgIG91dHB1dERpcjogWydkaXN0J10sXG4gICAgfSksXG4gICAgdnVlKCksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiByZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBlbXB0eU91dERpcjogZmFsc2UsXG4gICAgc291cmNlbWFwOiB0cnVlLFxuICAgIG1pbmlmeTogdHJ1ZSxcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxuICAgICAgbmFtZTogJ3N0YXRlcmVmLWNvbm5lY3QtdnVlJyxcbiAgICAgIGZvcm1hdHM6IFsnZXMnLCAndW1kJywgJ2NqcyddLFxuICAgICAgZmlsZU5hbWU6IGZvcm1hdCA9PiB7XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICd1bWQnKSByZXR1cm4gJ3N0YXRlcmVmLWNvbm5lY3QtdnVlLnVtZC5qcyc7XG4gICAgICAgIC8vIFwidHlwZVwiOiBcIm1vZHVsZVwiIG1ha2VzIGEgLmpzIGZpbGUgRVNNLCBzbyB0aGUgVU1EIG91dHB1dFxuICAgICAgICAvLyBjYW5ub3Qgc2VydmUgdGhlIGByZXF1aXJlYCBjb25kaXRpb24uXG4gICAgICAgIHJldHVybiBmb3JtYXQgPT09ICdjanMnID8gJ3N0YXRlcmVmLWNvbm5lY3QtdnVlLmNqcycgOiAnc3RhdGVyZWYtY29ubmVjdC12dWUubWpzJztcbiAgICAgIH0sXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBleHRlcm5hbDogWydzdGF0ZS1yZWYnLCAndnVlJ10sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgZ2xvYmFsczoge1xuICAgICAgICAgICdzdGF0ZS1yZWYnOiAnc3RhdGVSZWYnLFxuICAgICAgICAgIHZ1ZTogJ3Z1ZScsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICBpbmNsdWRlU291cmNlOiBbJ3NyYy90ZXN0cy8qKi8qLntqcyx0cyxqc3gsdHN4fSddLFxuICAgIHNldHVwRmlsZXM6ICcuL3Rlc3Qvc2V0dXAudHMnLFxuICAgIGdsb2JhbHM6IHRydWUsXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIG9wZW46ICcuL2h0bWwvdnVlL2RlZmF1bHQuaHRtbCcsXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBZ1csU0FBUyxlQUFlO0FBQ3hYLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sYUFBYTtBQUNwQixPQUFPLFNBQVM7QUFDaEIsT0FBTyxTQUFTO0FBSmhCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLFFBQVE7QUFBQSxNQUNOLFlBQVk7QUFBQSxNQUNaLFFBQVE7QUFBQSxRQUNOLGFBQWE7QUFBQSxNQUNmO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDRCxJQUFJO0FBQUEsTUFDRixXQUFXLENBQUMsTUFBTTtBQUFBLElBQ3BCLENBQUM7QUFBQSxJQUNELElBQUk7QUFBQSxFQUNOO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ2pDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsYUFBYTtBQUFBLElBQ2IsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLElBQ1IsS0FBSztBQUFBLE1BQ0gsT0FBTyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxNQUMvQixNQUFNO0FBQUEsTUFDTixTQUFTLENBQUMsTUFBTSxPQUFPLEtBQUs7QUFBQSxNQUM1QixVQUFVLFlBQVU7QUFDbEIsWUFBSSxXQUFXLE1BQU8sUUFBTztBQUc3QixlQUFPLFdBQVcsUUFBUSw2QkFBNkI7QUFBQSxNQUN6RDtBQUFBLElBQ0Y7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLFVBQVUsQ0FBQyxhQUFhLEtBQUs7QUFBQSxNQUM3QixRQUFRO0FBQUEsUUFDTixTQUFTO0FBQUEsVUFDUCxhQUFhO0FBQUEsVUFDYixLQUFLO0FBQUEsUUFDUDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osYUFBYTtBQUFBLElBQ2IsZUFBZSxDQUFDLGdDQUFnQztBQUFBLElBQ2hELFlBQVk7QUFBQSxJQUNaLFNBQVM7QUFBQSxFQUNYO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
