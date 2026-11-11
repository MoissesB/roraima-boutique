export function readVideo(video, slug) {
  if (video === undefined) return undefined;
  if (!video || typeof video !== 'object' || Array.isArray(video)) {
    throw new Error(`${slug}: video must be an object`);
  }
  const { title, description, durationSeconds, uploadDate } = video;
  if (![title, description].every(value => typeof value === 'string' && value.trim())) {
    throw new Error(`${slug}: video title and description are required`);
  }
  if (!Number.isInteger(durationSeconds) || durationSeconds < 120 || durationSeconds > 180) {
    throw new Error(`${slug}: video duration must be 120–180 seconds`);
  }
  if (uploadDate !== undefined && (typeof uploadDate !== 'string'
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(uploadDate)
      || !Number.isFinite(Date.parse(uploadDate))
      || new Date(uploadDate).toISOString().replace('.000Z', 'Z') !== uploadDate)) {
    throw new Error(`${slug}: video uploadDate must be a valid UTC timestamp`);
  }
  for (const field of ['url', 'posterUrl', 'captionsUrl']) {
    const url = typeof video[field] === 'string' ? URL.parse(video[field]) : null;
    if (!url || url.protocol !== 'https:'
        || url.username || url.password || url.hash) {
      throw new Error(`${slug}: ${field} must be a public HTTPS URL`);
    }
  }
  return { title, description, durationSeconds, ...(uploadDate ? { uploadDate } : {}), url: video.url, posterUrl: video.posterUrl, captionsUrl: video.captionsUrl };
}

export function validateVideoSchedule(posts) {
  const postsPerDate = new Map();
  for (const { publishAtMexico } of posts) {
    const date = publishAtMexico.slice(0, 10);
    postsPerDate.set(date, (postsPerDate.get(date) ?? 0) + 1);
  }
  for (const post of posts.filter(post => post.video !== undefined)) {
    if (!post.publishAtMexico.endsWith('T20:00:00')) {
      throw new Error(`${post.slug}: schedule videos at 20:00 in Mexico City`);
    }
    if (postsPerDate.get(post.publishAtMexico.slice(0, 10)) !== 1) {
      throw new Error(`${post.slug}: another article is scheduled for the same date`);
    }
  }
}

export function videoMetadata(video, publishAt) {
  return {
    '@type': 'VideoObject',
    name: video.title,
    description: video.description,
    thumbnailUrl: [video.posterUrl],
    uploadDate: video.uploadDate ?? publishAt,
    duration: `PT${video.durationSeconds}S`,
    contentUrl: video.url,
    inLanguage: 'es-MX',
  };
}
