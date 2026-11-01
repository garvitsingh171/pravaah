// Separate local-only preview server. Never imported by the application or production build.
// All API requests stay on loopback and use fictional fixtures. Writes are rejected.
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dataFor } from './fixtures/workspace.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const state = process.env.PREVIEW_STATE ?? 'populated';
const role = process.env.PREVIEW_ROLE === 'STAFF' ? 'STAFF' : 'ADMIN';
const port = Number(process.env.PREVIEW_PORT ?? 4175);
const html =
    '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pravaah · Fictional UI preview</title></head><body><div id="root"></div><script type="module" src="/preview-entry.jsx"></script></body></html>';
const server = await createServer({
    root,
    configFile: false,
    envFile: false,
    cacheDir: '/tmp/pravaah-preview-vite',
    resolve: {
        alias: { '@clerk/react': fileURLToPath(new URL('./fixtures/clerk.mjs', import.meta.url)) },
    },
    plugins: [
        react(),
        {
            name: 'fictional-workspace-preview',
            resolveId(id) {
                if (id === '/preview-entry.jsx') return '\0preview-entry.jsx';
            },
            load(id) {
                if (id === '\0preview-entry.jsx')
                    return `import React from 'react'; import {createRoot} from 'react-dom/client'; import App from '/src/App.tsx'; import ToastProvider from '/src/components/feedback/ToastProvider.tsx'; import '/src/index.css'; createRoot(document.getElementById('root')).render(React.createElement(ToastProvider,null,React.createElement(App)));`;
            },
            configureServer(vite) {
                vite.middlewares.use(async (req, res, next) => {
                    const url = new URL(req.url, `http://127.0.0.1:${port}`);
                    if (url.pathname.startsWith('/api/')) {
                        const requestState = req.headers['x-preview-state'] ?? state;
                        const requestRole =
                            req.headers['x-preview-role'] === 'STAFF' ? 'STAFF' : role;
                        res.setHeader('Content-Type', 'application/json');
                        if (req.method !== 'GET') {
                            res.statusCode = 409;
                            res.end(
                                JSON.stringify({
                                    success: false,
                                    error: {
                                        code: 'PREVIEW_READ_ONLY',
                                        message: 'This fictional preview cannot save changes.',
                                    },
                                })
                            );
                            return;
                        }
                        if (requestState === 'slow')
                            await new Promise((resolve) => setTimeout(resolve, 1200));
                        const data = dataFor(url, requestState, requestRole);
                        const fail =
                            !data || (requestState === 'error' && !url.pathname.includes('/auth/'));
                        res.statusCode = fail ? 503 : 200;
                        res.end(
                            JSON.stringify(
                                fail
                                    ? {
                                          success: false,
                                          error: {
                                              code: 'PREVIEW_UNAVAILABLE',
                                              message:
                                                  'Clinic information could not be loaded. Try again.',
                                          },
                                      }
                                    : { success: true, data }
                            )
                        );
                        return;
                    }
                    if (req.headers.accept?.includes('text/html')) {
                        res.setHeader('Content-Type', 'text/html');
                        res.end(await vite.transformIndexHtml(req.url, html));
                        return;
                    }
                    next();
                });
            },
        },
    ],
    define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify(`http://127.0.0.1:${port}/api`) },
    server: { host: '127.0.0.1', port, strictPort: true },
});
await server.listen();
console.log(`Fictional workspace preview: http://127.0.0.1:${port}/dashboard (${state}, ${role})`);
