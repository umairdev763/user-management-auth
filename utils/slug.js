function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'blog';
}

async function createUniqueSlug(title, findExisting, currentId = null) {
  const base = slugify(title);
  let slug = base;
  let counter = 2;
  while (await findExisting(slug, currentId)) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

module.exports = { slugify, createUniqueSlug };
