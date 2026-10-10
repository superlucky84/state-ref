import { INITIAL_SHIPS } from './src/mission-data.mjs';

/** A same-origin, memory-only server for dev AND built-demo browser tests. */
export function missionServer() {
  let ships = structuredClone(INITIAL_SHIPS);
  let delay = 350;
  let failRead = false;
  let rejectSave = false;
  const json = (res, status, value) => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(value));
  };
  const middleware = async (req, res, next) => {
    const path = new URL(req.url, 'http://mission.local').pathname;
    if (!path.startsWith('/mission-api/')) return next();
    try {
      let body = '';
      if (req.method !== 'GET') {
        for await (const chunk of req) {
          body += chunk;
          if (body.length > 16_384)
            return json(res, 413, { error: 'Too large' });
        }
      }
      const input = body ? JSON.parse(body) : {};
      if (path === '/mission-api/control' && req.method === 'POST') {
        if (input.reset) {
          ships = structuredClone(INITIAL_SHIPS);
          delay = 350;
          failRead = rejectSave = false;
        }
        if (typeof input.delay === 'number')
          delay = Math.max(0, Math.min(5000, input.delay));
        if (input.failRead) failRead = true;
        if (input.rejectSave) rejectSave = true;
        if (input.change) {
          const ship = ships.find(value => value.id === input.change);
          if (ship) {
            ship.fuel += 7;
            if ('oxygen' in ship) ship.oxygen += 5;
            ship.revision += 1;
          }
        }
        return json(res, 200, { ok: true });
      }
      const match = path.match(/^\/mission-api\/ships\/(\d+)$/);
      const ship = match && ships.find(value => value.id === Number(match[1]));
      if (!ship) return json(res, 404, { error: '우주선을 찾을 수 없어요.' });
      if (!['GET', 'PUT'].includes(req.method))
        return json(res, 405, { error: 'Method' });
      const failed = req.method === 'GET' && failRead;
      const rejected = req.method === 'PUT' && rejectSave;
      if (req.method === 'GET') failRead = false;
      else rejectSave = false;
      const timer = setTimeout(
        () => {
          if (failed)
            return json(res, 503, {
              error: '우주 먼지 때문에 통신이 끊겼어요.',
            });
          if (rejected)
            return json(res, 409, {
              error: '정비소가 이번 저장을 거절했어요. 입력은 그대로예요.',
            });
          if (req.method === 'PUT') {
            if (typeof input.name !== 'string' || !input.name.trim())
              return json(res, 400, { error: '이름을 입력해 주세요.' });
            ship.name = input.name.trim().toUpperCase();
            ship.revision += 1;
          }
          json(res, 200, structuredClone(ship));
        },
        req.method === 'PUT' ? Math.max(delay, 900) : delay
      );
      res.on('close', () => clearTimeout(timer));
      return undefined;
    } catch {
      return json(res, 400, { error: '잘못된 요청이에요.' });
    }
  };
  return {
    name: 'mission-memory-server',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
