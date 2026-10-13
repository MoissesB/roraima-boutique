(function () {
  var posts = window.__silhouettePublishedPosts || [];
  var slugs = new Set(posts.map(function (post) { return post.slug; }));
  if (!slugs.size) return;

  function directUrl(slug) {
    return new URL('./blog/' + slug + '/', window.location.href.split('#')[0]).href;
  }

  function publishedSlug(value) {
    var match = String(value || '').match(/#\/blog\/([a-z0-9-]+)(?:[/?]|$)/);
    return match && slugs.has(match[1]) ? match[1] : null;
  }

  function redirectHash() {
    var slug = publishedSlug(window.location.hash);
    if (slug) window.location.replace(directUrl(slug));
  }

  redirectHash();
  window.addEventListener('hashchange', redirectHash);

  function rewriteLinks() {
    document.querySelectorAll('a[href*="#/blog/"]').forEach(function (link) {
      var slug = publishedSlug(link.getAttribute('href'));
      if (slug) link.href = directUrl(slug);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    rewriteLinks();
    new MutationObserver(rewriteLinks).observe(document.body, { childList: true, subtree: true });
  });

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href*="#/blog/"]');
    var slug = link && publishedSlug(link.getAttribute('href'));
    if (slug) {
      event.preventDefault();
      window.location.assign(directUrl(slug));
    }
  }, true);
})();
