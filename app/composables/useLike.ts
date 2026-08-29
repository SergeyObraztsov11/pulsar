/**
 * useLike — лайк/анлайк с общим in-memory кэшем.
 * Один id → одно состояние сердца в плеере, карточках и на страницах.
 * Между вкладками — BroadcastChannel (только client).
 */
export type LikeTarget = "track" | "album" | "artist";

const API_PATH: Record<LikeTarget, string> = {
  track: "tracks",
  album: "albums",
  artist: "artists",
};

const LIKE_BROADCAST_CHANNEL = "pulsar:likes";

type LikeBroadcastMessage =
  | { type: "clear" }
  | { type: "set"; target: LikeTarget; id: string; isLiked: boolean };

/** Общий кэш сессии: ключ «track:cuid», значение — лайкнут ли */
const likeCache = reactive<Record<string, boolean>>({});

let likeBroadcast: BroadcastChannel | null = null;

function cacheKey(target: LikeTarget, id: string): string {
  return `${target}:${id}`;
}

function likeApiUrl(target: LikeTarget, id: string): string {
  return `/api/${API_PATH[target]}/${id}/like`;
}

function hasCachedLike(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(likeCache, key);
}

function setCachedLike(key: string, isLiked: boolean) {
  likeCache[key] = isLiked;
}

/** Записать лайк в кэш; для трека — патч снимка очереди плеера */
function applyLikeState(target: LikeTarget, id: string, isLiked: boolean) {
  setCachedLike(cacheKey(target, id), isLiked);
  if (target === "track") {
    usePlayerStore().patchTrackLike(id, isLiked);
  }
}

/** Внешняя синхронизация (например add to «Любимые» из меню) */
export function setLikeState(target: LikeTarget, id: string, isLiked: boolean) {
  applyLikeState(target, id, isLiked);
  postLikeBroadcast({ type: "set", target, id, isLiked });
}

function postLikeBroadcast(message: LikeBroadcastMessage) {
  if (!import.meta.client) return;
  ensureLikeBroadcast();
  likeBroadcast?.postMessage(message);
}

/** Слушатель канала — один раз на вкладку */
function ensureLikeBroadcast() {
  if (!import.meta.client || likeBroadcast) return;

  likeBroadcast = new BroadcastChannel(LIKE_BROADCAST_CHANNEL);
  likeBroadcast.onmessage = (event: MessageEvent<LikeBroadcastMessage>) => {
    const message = event.data;
    if (!message?.type) return;

    if (message.type === "clear") {
      clearLikeCache({ broadcast: false });
      return;
    }

    applyLikeState(message.target, message.id, message.isLiked);
  };
}

/** Сброс при logout; broadcast — другие вкладки тоже очищают кэш */
export function clearLikeCache(options: { broadcast?: boolean } = {}) {
  for (const key of Object.keys(likeCache)) {
    delete likeCache[key];
  }
  if (options.broadcast !== false) {
    postLikeBroadcast({ type: "clear" });
  }
}

/**
 * Лайк сущности: читает/пишет общий кэш, toggle — optimistic + POST/DELETE.
 * initial — isLiked из API; после первого toggle побеждает кэш.
 */
export function useLike(
  target: MaybeRefOrGetter<LikeTarget>,
  id: MaybeRefOrGetter<string | null | undefined>,
  options: {
    initial?: MaybeRefOrGetter<boolean | undefined>;
    disabled?: MaybeRefOrGetter<boolean>;
  } = {},
) {
  ensureLikeBroadcast();

  const pending = ref(false);
  /** До mount — только initial (SSR + гидрация без mismatch) */
  const isClientReady = ref(false);

  if (import.meta.client) {
    onMounted(() => {
      isClientReady.value = true;
    });
  }

  const cacheKeyRef = computed(() => {
    const idValue = toValue(id);
    const targetValue = toValue(target);
    if (!idValue) return null;
    return cacheKey(targetValue, idValue);
  });

  // Смена id: подставить initial из API, если кэша ещё нет
  watch(
    cacheKeyRef,
    (key) => {
      if (!key || hasCachedLike(key)) return;
      const initial = toValue(options.initial);
      if (initial != null) setCachedLike(key, initial);
    },
    { immediate: true },
  );

  // initial пришёл позже (lazy fetch): тот же seed, не затираем toggle
  watch(
    () => toValue(options.initial),
    (initial) => {
      const key = cacheKeyRef.value;
      if (!key || initial == null || hasCachedLike(key)) return;
      setCachedLike(key, initial);
    },
    { immediate: true },
  );

  /** До mount — initial; после — кэш для мгновенного UI и sync между компонентами */
  const isLiked = computed(() => {
    const key = cacheKeyRef.value;
    if (!key) return false;
    const initial = toValue(options.initial) ?? false;

    if (import.meta.server || !isClientReady.value) {
      return initial;
    }

    if (hasCachedLike(key)) return likeCache[key]!;
    return initial;
  });

  /** Optimistic toggle; при ошибке — откат; успех — broadcast в другие вкладки */
  async function toggleLike() {
    if (toValue(options.disabled)) return;

    const idValue = toValue(id);
    const targetValue = toValue(target);
    const key = cacheKeyRef.value;
    if (!idValue || !key || pending.value) return;

    if (import.meta.client) {
      isClientReady.value = true;
    }

    const likedBefore = isLiked.value;
    setCachedLike(key, !likedBefore);
    pending.value = true;

    try {
      const result = await $fetch<{ isLiked: boolean }>(
        likeApiUrl(targetValue, idValue),
        { method: likedBefore ? "DELETE" : "POST" },
      );
      applyLikeState(targetValue, idValue, result.isLiked);
      postLikeBroadcast({
        type: "set",
        target: targetValue,
        id: idValue,
        isLiked: result.isLiked,
      });
    } catch {
      setCachedLike(key, likedBefore);
    } finally {
      pending.value = false;
    }
  }

  return { isLiked, pending, toggleLike };
}
