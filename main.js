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

// Путь к frontend вне WebApp-Antieg
const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend');

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
                // GET /models или GET /models?name=...
                if (req.method === 'GET') {
                    if (pathname === '/models') {
                        const nameFilter = parsedUrl.searchParams.get('name');
                        let result = db.models;
                        if (nameFilter) {
                            result = db.models.filter(m => m.name === nameFilter);
                        }
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
                    if (!body.trim()) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ error: 'Bad Request: тело запроса пустое' }));
                        return;
                    }

                    const newModel = JSON.parse(body);
                    if (!newModel.name || typeof newModel.name !== 'string') {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ error: 'Bad Request: поле "name" обязательно и должно быть строкой' }));
                        return;
                    }

                    // Последовательный маленький ID
                    const lastId = db.models.length > 0 ? Math.max(...db.models.map(m => m.id)) : 0;
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

    // ===== Статические файлы фронтенда =====
    let filePath;
    if (pathname === '/') {
        filePath = path.join(FRONTEND_DIR, 'index.html');
    } else {
        filePath = path.join(FRONTEND_DIR, pathname);
    }

    try {
        const fileStat = await stat(filePath);
        if (!fileStat.isFile()) throw new Error('Not a file');

        const ext = path.extname(filePath).toLowerCase();
        let content;

        if (['.html', '.js', '.css', '.json'].includes(ext)) {
            content = await readFile(filePath, 'utf8');
        } else {
            content = await readFile(filePath);
        }

        switch (ext) {
            case '.js':
                res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
                break;
            case '.css':
                res.setHeader('Content-Type', 'text/css; charset=utf-8');
                break;
            case '.html':
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                break;
            case '.json':
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                break;
            case '.png':
                res.setHeader('Content-Type', 'image/png');
                break;
            case '.jpg':
            case '.jpeg':
                res.setHeader('Content-Type', 'image/jpeg');
                break;
            case '.gif':
                res.setHeader('Content-Type', 'image/gif');
                break;
            default:
                res.setHeader('Content-Type', 'application/octet-stream');
        }

        res.statusCode = 200;
        res.end(content);
        return;

    } catch {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
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