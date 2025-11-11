import { Router } from 'express';
import * as svc from '../features/users/users.service.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try { res.json(await svc.createUser(req.body)); }
  catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const u = await svc.getUser(req.params.id);
    if (!u) return res.status(404).json({ error: 'Not found' });
    res.json(u);
  } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const offset = Number(req.query.offset || 0);
    res.json(await svc.listUsers({ limit, offset }));
  } catch (e) { next(e); }
});

export default router;
