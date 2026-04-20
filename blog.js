const POSTS_PER_PAGE = 6;

async function loadBlogPosts() {
  const response = await fetch("blog-posts.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Could not load blog posts.");
  }

  const posts = await response.json();
  return posts
    .filter((post) => post && post.title && post.slug)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

function renderTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return "";
  }

  return `<div class="tag-list">${tags
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join("")}</div>`;
}

function renderLatestPosts(posts) {
  const container = document.getElementById("latest-posts");
  if (!container) {
    return;
  }

  if (!posts.length) {
    container.innerHTML = '<div class="blog-empty">No blog posts yet. The first post will appear here as soon as it is added to <code>blog-posts.json</code>.</div>';
    return;
  }

  container.innerHTML = posts.slice(0, 3).map((post) => `
    <article class="blog-card">
      <div class="blog-meta">
        <span>${formatDate(post.date)}</span>
        <span>${post.readTime || "4 min read"}</span>
      </div>
      <h3><a class="blog-link" href="blog.html#${post.slug}">${post.title}</a></h3>
      <p>${post.excerpt || ""}</p>
      ${renderTags(post.tags)}
      <a class="blog-link" href="blog.html#${post.slug}">Read article</a>
    </article>
  `).join("");
}

function renderBlogArchive(posts) {
  const container = document.getElementById("blog-posts");
  const pagination = document.getElementById("blog-pagination");
  if (!container) {
    return;
  }

  if (!posts.length) {
    container.innerHTML = '<div class="blog-empty">No posts available yet. Add entries to <code>blog-posts.json</code> and they will show up automatically.</div>';
    if (pagination) {
      pagination.innerHTML = "";
    }
    return;
  }

  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const currentPage = getCurrentPage(posts, totalPages);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const visiblePosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  container.innerHTML = visiblePosts.map((post) => `
    <article class="blog-post" id="${post.slug}">
      <div class="blog-post-meta">
        <span>${formatDate(post.date)}</span>
        <span>${post.readTime || "4 min read"}</span>
      </div>
      <h2>${post.title}</h2>
      <p>${post.excerpt || ""}</p>
      ${(post.body || []).map((paragraph) => `<p>${paragraph}</p>`).join("")}
      ${renderTags(post.tags)}
    </article>
  `).join("");

  renderPagination({ currentPage, totalPages });
  scrollToHashTarget();
}

function getCurrentPage(posts, totalPages) {
  const hash = window.location.hash.replace(/^#/, "").trim();
  if (hash) {
    const postIndex = posts.findIndex((post) => post.slug === hash);
    if (postIndex >= 0) {
      return Math.floor(postIndex / POSTS_PER_PAGE) + 1;
    }
  }

  const params = new URLSearchParams(window.location.search);
  const pageValue = Number.parseInt(params.get("page") || "1", 10);

  if (Number.isNaN(pageValue) || pageValue < 1) {
    return 1;
  }

  return Math.min(pageValue, totalPages);
}

function scrollToHashTarget() {
  const hash = window.location.hash;
  if (!hash) {
    return;
  }

  const target = document.querySelector(hash);
  if (target) {
    target.scrollIntoView({ block: "start" });
  }
}

function createPageUrl(pageNumber) {
  const url = new URL(window.location.href);

  if (pageNumber <= 1) {
    url.searchParams.delete("page");
  } else {
    url.searchParams.set("page", String(pageNumber));
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function renderPagination({ currentPage, totalPages }) {
  const pagination = document.getElementById("blog-pagination");
  if (!pagination) {
    return;
  }

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  const pages = [];
  for (let page = 1; page <= totalPages; page += 1) {
    pages.push(page);
  }

  pagination.innerHTML = `
    <a class="pagination-link" href="${createPageUrl(Math.max(1, currentPage - 1))}" ${currentPage === 1 ? 'aria-disabled="true" tabindex="-1"' : ""}>Previous</a>
    <div class="pagination-pages" aria-label="Page numbers">
      ${pages.map((page) => `
        <a
          class="pagination-link ${page === currentPage ? "is-active" : ""}"
          href="${createPageUrl(page)}"
          ${page === currentPage ? 'aria-current="page"' : ""}
        >
          ${page}
        </a>
      `).join("")}
    </div>
    <a class="pagination-link" href="${createPageUrl(Math.min(totalPages, currentPage + 1))}" ${currentPage === totalPages ? 'aria-disabled="true" tabindex="-1"' : ""}>Next</a>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const posts = await loadBlogPosts();
    renderLatestPosts(posts);
    renderBlogArchive(posts);
  } catch (error) {
    const homeContainer = document.getElementById("latest-posts");
    const archiveContainer = document.getElementById("blog-posts");
    const message = '<div class="blog-empty">There was a problem loading blog content. Check that <code>blog-posts.json</code> exists and contains valid JSON.</div>';

    if (homeContainer) {
      homeContainer.innerHTML = message;
    }

    if (archiveContainer) {
      archiveContainer.innerHTML = message;
    }
  }
});
