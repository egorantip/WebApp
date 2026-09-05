import http from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const HOST = 'localhost';
const DB_FILE = path.join(__dirname, 'db.json');

const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend');
const TEMPLATES_DIR = path.join(__dirname, 'templates');

let db = { models: [] };

// ====================== Работа с БД ======================
async function loadDB() {
    try {
        const data = await readFile(DB_FILE, 'utf8');
        db = JSON.parse(data);
        console.log('db.json успешно загружен');
    } catch {
        console.log('db.json не найден или повреждён, создаём новый');
        db = { models: [] };
        await saveDB();
    }
}

async function saveDB() {
    try {
        await writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
        console.log('db.json успешно сохранён');
    } catch (err) {
        console.error('Ошибка записи в db.json:', err.message);
        throw err;
    }
}

// ====================== Вспомогательные функции ======================

async function sendFile(res, filePath, contentType = 'application/octet-stream', encoding = null) {
    try {
        const fileStat = await stat(filePath);
        if (!fileStat.isFile()) throw new Error('Not a file');

        let content = encoding ? await readFile(filePath, encoding) : await readFile(filePath);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', Buffer.byteLength(content, encoding || 'utf8'));
        res.statusCode = 200;
        res.end(content);
    } catch (err) {
        console.error(`Ошибка при чтении файла ${filePath}:`, err.message);
        await send404(res);
    }
}

async function sendTemplate(res, templatePath, replacements = {}) {
    try {
        await stat(templatePath);
        let template = await readFile(templatePath, 'utf8');

        const sanitize = str =>
            str.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

        for (const key in replacements) {
            const regex = new RegExp(`%%\\s*${key}\\s*%%`, 'g');
            template = template.replace(regex, sanitize(replacements[key]));
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Length', Buffer.byteLength(template, 'utf8'));
        res.statusCode = 200;
        res.end(template);
    } catch (err) {
        console.error(`Ошибка при чтении шаблона ${templatePath}:`, err.message);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Internal Server Error');
    }
}

async function send404(res) {
    try {
        const notFoundPath = path.join(FRONTEND_DIR, '404.html');
        const content = await readFile(notFoundPath, 'utf8');
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Length', Buffer.byteLength(content, 'utf8'));
        res.end(content);
    } catch {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Internal Server Error');
    }
}

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.js': return 'application/javascript; charset=utf-8';
        case '.css': return 'text/css; charset=utf-8';
        case '.html': return 'text/html; charset=utf-8';
        case '.json': return 'application/json; charset=utf-8';
        case '.png': return 'image/png';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.gif': return 'image/gif';
        default: return 'application/octet-stream';
    }
}

// ====================== Сервер ======================
const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    console.log(`Получен запрос: ${req.method} ${pathname} от ${req.socket.remoteAddress}`);

    // ===== API /models =====
    if (pathname.startsWith('/models')) {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
            const body = Buffer.concat(chunks).toString('utf8');
            res.setHeader('Content-Type', 'application/json; charset=utf-8');

            try {
                // GET /models
                if (req.method === 'GET') {
                    if (pathname === '/models') {
                        const nameFilter = parsedUrl.searchParams.get('name');
                        let result = db.models;
                        if (nameFilter) result = db.models.filter(m => m.name === nameFilter);
                        res.statusCode = 200;
                        res.end(JSON.stringify(result));
                        return;
                    }

                    // GET /models/:id
                    const id = Number(pathname.split('/')[2]);
                    const model = db.models.find(m => m.id === id);
                    if (!model) { res.statusCode = 404; res.end(JSON.stringify({ error: 'Not Found' })); return; }
                    res.statusCode = 200;
                    res.end(JSON.stringify(model));
                    return;
                }

                // POST /models
                if (req.method === 'POST' && pathname === '/models') {
                    if (!body.trim()) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Bad Request: пустое тело' })); return; }

                    const newModel = JSON.parse(body);
                    if (!newModel.name || typeof newModel.name !== 'string') {
                        res.statusCode = 400; res.end(JSON.stringify({ error: 'Bad Request: поле name обязательно' })); return;
                    }

                    const lastId = db.models.length ? Math.max(...db.models.map(m => m.id)) : 0;
                    newModel.id = lastId + 1;
                    db.models.push(newModel);

                    await saveDB();
                    res.statusCode = 201;
                    res.end(JSON.stringify(newModel));
                    return;
                }

                // PUT /models/:id
                if (req.method === 'PUT') {
                    const id = Number(pathname.split('/')[2]);
                    const index = db.models.findIndex(m => m.id === id);
                    if (index === -1) { res.statusCode = 404; res.end(JSON.stringify({ error: 'Not Found' })); return; }

                    const update = JSON.parse(body);
                    db.models[index] = { ...db.models[index], ...update, updatedAt: new Date().toISOString() };
                    await saveDB();
                    res.statusCode = 200;
                    res.end(JSON.stringify(db.models[index]));
                    return;
                }

                // DELETE /models/:id
                if (req.method === 'DELETE') {
                    const id = Number(pathname.split('/')[2]);
                    db.models = db.models.filter(m => m.id !== id);
                    await saveDB();
                    res.statusCode = 200;
                    res.end(JSON.stringify({ success: true }));
                    return;
                }

                res.statusCode = 405;
                res.end(JSON.stringify({ error: 'Method Not Allowed' }));
            } catch {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Bad Request' }));
            }
        });
        return;
    }

    // ===== /request-info =====
    if (pathname === '/request-info') {
        await sendTemplate(res, path.join(TEMPLATES_DIR, 'request-info.html'), {
            'user-agent': req.headers['user-agent'] || '',
            'accept-encoding': req.headers['accept-encoding'] || '',
            'accept': req.headers['accept'] || ''
        });
        return;
    }

    // ===== Статические файлы =====
    const filePath = pathname === '/' ? path.join(FRONTEND_DIR, 'index.html') : path.join(FRONTEND_DIR, pathname);
    await sendFile(res, filePath, getContentType(filePath));
});

// ====================== Запуск сервера ======================
async function startServer() {
    await loadDB();

    server.listen(PORT, HOST, () => {
        console.log(`Сервер запущен на http://${HOST}:${PORT}`);
        console.log('Режим работы: development');
    });

    server.on('connection', socket => {
        console.log(`Новое TCP-подключение от ${socket.remoteAddress}:${socket.remotePort}`);
    });
}

startServer();