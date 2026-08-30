import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '.legacy-app-dependencies/**',
      '.crm_serve_before_nest_cli/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{js,cjs,mjs,ts,cts,mts,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    },
    rules: {
      'vue/multi-word-component-names': 'off'
    }
  },
  {
    files: ['crm_serve/**/*.spec.ts', 'crm_serve/test/**/*.ts'],
    languageOptions: {
      globals: globals.jest
    }
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  eslintConfigPrettier
)
