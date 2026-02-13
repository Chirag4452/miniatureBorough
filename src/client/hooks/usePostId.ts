import { useCallback, useEffect, useState } from 'react';
import { context as devvit_context } from '@devvit/web/client';

const POST_ID_URL = '/api/post-id';

export function usePostId(): { post_id: string; loading: boolean } {
  const context_post_id = typeof (devvit_context as { postId?: string }).postId === 'string'
    ? (devvit_context as { postId: string }).postId
    : '';

  const [post_id, set_post_id] = useState(context_post_id);
  const [loading, set_loading] = useState(!context_post_id);

  const fetch_post_id = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(POST_ID_URL);
      const data = (await res.json()) as { post_id?: string };
      const id = typeof data.post_id === 'string' ? data.post_id : '';
      set_post_id(id);
    } catch {
      set_post_id('');
    } finally {
      set_loading(false);
    }
  }, []);

  useEffect(() => {
    if (context_post_id) {
      set_post_id(context_post_id);
      set_loading(false);
      return;
    }
    void fetch_post_id();
  }, [context_post_id, fetch_post_id]);

  return { post_id, loading };
}
