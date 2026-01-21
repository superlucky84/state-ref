// vite.config.js
import { resolve } from "path";
import { defineConfig } from "file:///Users/n250109005/project/state-ref/node_modules/.pnpm/vite@5.4.8_terser@5.18.1/node_modules/vite/dist/node/index.js";
import checker from "file:///Users/n250109005/project/state-ref/node_modules/.pnpm/vite-plugin-checker@0.6.1_eslint@8.57.1_optionator@0.9.4_typescript@5.6.3_vite@5.4.8_terser@5.18.1_/node_modules/vite-plugin-checker/dist/esm/main.js";
import dts from "file:///Users/n250109005/project/state-ref/node_modules/.pnpm/vite-plugin-dts@2.3.0_rollup@4.24.0_vite@5.4.8_terser@5.18.1_/node_modules/vite-plugin-dts/dist/index.mjs";
import vue from "file:///Users/n250109005/project/state-ref/node_modules/.pnpm/@vitejs+plugin-vue@5.1.4_vite@5.4.8_terser@5.18.1__vue@3.5.10_typescript@5.6.3_/node_modules/@vitejs/plugin-vue/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/n250109005/project/state-ref/packages/connect-vue";
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
      fileName: (format) => {
        return format === "umd" ? "stateref-connect-vue.umd.js" : "stateref-connect-vue.mjs";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbjI1MDEwOTAwNS9wcm9qZWN0L3N0YXRlLXJlZi9wYWNrYWdlcy9jb25uZWN0LXZ1ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL24yNTAxMDkwMDUvcHJvamVjdC9zdGF0ZS1yZWYvcGFja2FnZXMvY29ubmVjdC12dWUvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL24yNTAxMDkwMDUvcHJvamVjdC9zdGF0ZS1yZWYvcGFja2FnZXMvY29ubmVjdC12dWUvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCBjaGVja2VyIGZyb20gJ3ZpdGUtcGx1Z2luLWNoZWNrZXInO1xuaW1wb3J0IGR0cyBmcm9tICd2aXRlLXBsdWdpbi1kdHMnO1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgY2hlY2tlcih7XG4gICAgICB0eXBlc2NyaXB0OiB0cnVlLFxuICAgICAgZXNsaW50OiB7XG4gICAgICAgIGxpbnRDb21tYW5kOiAnZXNsaW50IFwiLi9zcmMvKiovKi57dHMsdHN4fVwiJyxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgZHRzKHtcbiAgICAgIG91dHB1dERpcjogWydkaXN0J10sXG4gICAgfSksXG4gICAgdnVlKCksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiByZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBlbXB0eU91dERpcjogZmFsc2UsXG4gICAgc291cmNlbWFwOiB0cnVlLFxuICAgIG1pbmlmeTogdHJ1ZSxcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxuICAgICAgbmFtZTogJ3N0YXRlcmVmLWNvbm5lY3QtdnVlJyxcbiAgICAgIGZpbGVOYW1lOiBmb3JtYXQgPT4ge1xuICAgICAgICByZXR1cm4gZm9ybWF0ID09PSAndW1kJ1xuICAgICAgICAgID8gJ3N0YXRlcmVmLWNvbm5lY3QtdnVlLnVtZC5qcydcbiAgICAgICAgICA6ICdzdGF0ZXJlZi1jb25uZWN0LXZ1ZS5tanMnO1xuICAgICAgfSxcbiAgICB9LFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGV4dGVybmFsOiBbJ3N0YXRlLXJlZicsICd2dWUnXSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBnbG9iYWxzOiB7XG4gICAgICAgICAgJ3N0YXRlLXJlZic6ICdzdGF0ZVJlZicsXG4gICAgICAgICAgdnVlOiAndnVlJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgdGVzdDoge1xuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgIGluY2x1ZGVTb3VyY2U6IFsnc3JjL3Rlc3RzLyoqLyoue2pzLHRzLGpzeCx0c3h9J10sXG4gICAgc2V0dXBGaWxlczogJy4vdGVzdC9zZXR1cC50cycsXG4gICAgZ2xvYmFsczogdHJ1ZSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgb3BlbjogJy4vaHRtbC92dWUvZGVmYXVsdC5odG1sJyxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEwVixTQUFTLGVBQWU7QUFDbFgsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxhQUFhO0FBQ3BCLE9BQU8sU0FBUztBQUNoQixPQUFPLFNBQVM7QUFKaEIsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsUUFBUTtBQUFBLE1BQ04sWUFBWTtBQUFBLE1BQ1osUUFBUTtBQUFBLFFBQ04sYUFBYTtBQUFBLE1BQ2Y7QUFBQSxJQUNGLENBQUM7QUFBQSxJQUNELElBQUk7QUFBQSxNQUNGLFdBQVcsQ0FBQyxNQUFNO0FBQUEsSUFDcEIsQ0FBQztBQUFBLElBQ0QsSUFBSTtBQUFBLEVBQ047QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDakM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxhQUFhO0FBQUEsSUFDYixXQUFXO0FBQUEsSUFDWCxRQUFRO0FBQUEsSUFDUixLQUFLO0FBQUEsTUFDSCxPQUFPLFFBQVEsa0NBQVcsS0FBSztBQUFBLE1BQy9CLE1BQU07QUFBQSxNQUNOLFVBQVUsWUFBVTtBQUNsQixlQUFPLFdBQVcsUUFDZCxnQ0FDQTtBQUFBLE1BQ047QUFBQSxJQUNGO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDYixVQUFVLENBQUMsYUFBYSxLQUFLO0FBQUEsTUFDN0IsUUFBUTtBQUFBLFFBQ04sU0FBUztBQUFBLFVBQ1AsYUFBYTtBQUFBLFVBQ2IsS0FBSztBQUFBLFFBQ1A7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNKLGFBQWE7QUFBQSxJQUNiLGVBQWUsQ0FBQyxnQ0FBZ0M7QUFBQSxJQUNoRCxZQUFZO0FBQUEsSUFDWixTQUFTO0FBQUEsRUFDWDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
