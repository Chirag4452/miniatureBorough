import express from 'express';
import type { TaskResponse } from '@devvit/web/server';
import { createServer, context, getServerPort, redis, reddit } from '@devvit/web/server';
import { createPost } from './core/post';

const ATTEMPTS_MAX_PER_POST = 3;
const REDIS_KEY_POST_ATTEMPTS = (post_id: string, username: string) =>
  `post_attempts:${post_id}:${username}`;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

router.get('/api/daily-status', async (_req, res): Promise<void> => {
  try {
    const post_id = context.postId ?? 'unknown';
    const username = await reddit.getCurrentUsername();
    const user = username ?? 'anonymous';
    const key = REDIS_KEY_POST_ATTEMPTS(post_id, user);
    const raw = await redis.get(key);
    const data = raw ? (JSON.parse(raw) as { attempts_used: number; max_score: number }) : { attempts_used: 0, max_score: 0 };
    res.json({
      attempts_used: Math.min(ATTEMPTS_MAX_PER_POST, Number(data.attempts_used) || 0),
      max_score: Number(data.max_score) || 0,
    });
  } catch (e) {
    console.error('daily-status error:', e);
    res.status(500).json({ attempts_used: 0, max_score: 0 });
  }
});

router.post('/api/daily-attempt', async (req, res): Promise<void> => {
  try {
    const post_id = context.postId ?? 'unknown';
    const username = await reddit.getCurrentUsername();
    const user = username ?? 'anonymous';
    const key = REDIS_KEY_POST_ATTEMPTS(post_id, user);
    const score = Number((req.body as { score?: number }).score) || 0;

    const raw = await redis.get(key);
    const data = raw ? (JSON.parse(raw) as { attempts_used: number; max_score: number }) : { attempts_used: 0, max_score: 0 };
    const attempts_used = Math.min(ATTEMPTS_MAX_PER_POST, Number(data.attempts_used) || 0);
    const max_score = Math.max(Number(data.max_score) || 0, score);

    if (attempts_used >= ATTEMPTS_MAX_PER_POST) {
      res.status(200).json({ attempts_used, max_score: Number(data.max_score) || 0 });
      return;
    }

    const next_attempts = attempts_used + 1;
    await redis.set(key, JSON.stringify({ attempts_used: next_attempts, max_score }));
    const THIRTY_DAYS_SEC = 30 * 24 * 60 * 60;
    await redis.expire(key, THIRTY_DAYS_SEC);

    res.json({ attempts_used: next_attempts, max_score });
  } catch (e) {
    console.error('daily-attempt error:', e);
    res.status(500).json({ attempts_used: 0, max_score: 0 });
  }
});

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/scheduler/daily-game-post', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();
    console.log(`Daily game post created: ${post.id}`);
    const body: TaskResponse = { status: 'ok' };
    res.status(200).json(body);
  } catch (error) {
    console.error(`Daily game post failed: ${error}`);
    res.status(500).json({ status: 'error', message: 'Daily post failed' });
  }
});

app.use(router);

const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
