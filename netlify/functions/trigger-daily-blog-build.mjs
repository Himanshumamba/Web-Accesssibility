export default async () => {
  const buildHookUrl = process.env.NETLIFY_BUILD_HOOK_URL;

  if (!buildHookUrl) {
    console.error("Missing NETLIFY_BUILD_HOOK_URL.");
    return new Response("Missing NETLIFY_BUILD_HOOK_URL.", { status: 500 });
  }

  const response = await fetch(buildHookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      reason: "scheduled-blog-post",
      requestedAt: new Date().toISOString()
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Build hook failed: ${response.status} ${errorText}`);
    return new Response("Build hook failed.", { status: 500 });
  }

  console.log("Triggered Netlify build hook for daily blog generation.");
  return new Response("Triggered daily blog build.", { status: 200 });
};

export const config = {
  schedule: "30 3 * * *"
};
