import express from 'express';
import type { TaskResponse } from '@devvit/web/server';
import { createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

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
