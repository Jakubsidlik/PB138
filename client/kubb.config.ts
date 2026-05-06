import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  root: '.',
  input: {
    path: '../openapi.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
    barrelFiles: true, // Generate index.ts for easier imports
  },
  plugins: [
    pluginOas(),
    pluginTs({
      output: { 
        path: 'models',
        barrelFiles: true,
      },
      enumsAsTypes: true, // TaskPriority atd. jako types místo enums
    }),
    pluginClient({
      client: 'axios',
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      output: {
        path: 'client',
        barrelFiles: true,
      },
    }),
    pluginZod({
      output: { 
        path: 'zod',
        barrelFiles: true,
      },
      strict: true, // Strict mode pro Zod schémata
    }),
    pluginReactQuery({
      output: { 
        path: 'hooks',
        barrelFiles: true,
      },
      client: {
        importPath: '../client',
      },
      infinite: {
        enabled: true, // Infinite query support pro paginaci
      },
      operations: {
        dataReturnType: 'full', // Vracet full response s metadata
      },
    })
  ],
})
