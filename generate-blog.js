const fs = require('fs');

async function generateBlogPost() {
  // We use the free Google Gemini API to generate the blog post
  const API_KEY = process.env.GEMINI_API_KEY; 
  if (!API_KEY) {
    console.error("No API key found. Please set the GEMINI_API_KEY secret in GitHub.");
    process.exit(1);
  }

  const prompt = `You are an expert in Web Accessibility (WCAG, ADA). Write a short, professional blog post for a web accessibility consulting business. 
  The post should be helpful, actionable, and focus on a specific accessibility topic. 
  Output strictly in this JSON format:
  {
    "title": "A catchy professional title",
    "excerpt": "A 2-sentence summary of the post",
    "body": [
      "Paragraph 1",
      "Paragraph 2",
      "Paragraph 3"
    ],
    "tags": ["Tag1", "Tag2", "Tag3"]
  }`;

  try {
    console.log("Generating blog post via AI...");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      console.error("API failed to generate content. Full response:");
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    const contentText = data.candidates[0].content.parts[0].text;
    const newPostData = JSON.parse(contentText);

    // Format the date and generate a unique ID
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // Gets YYYY-MM-DD
    const slug = newPostData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = `${slug}-${dateString}`;

    const newPost = {
      id: id,
      slug: slug,
      title: newPostData.title,
      date: dateString,
      excerpt: newPostData.excerpt,
      readTime: "3 min read",
      tags: newPostData.tags,
      body: newPostData.body
    };

    // Read the existing posts
    const fileContent = fs.readFileSync('blog-posts.json', 'utf8');
    const posts = JSON.parse(fileContent);

    // Add the new post to the very top
    posts.unshift(newPost);

    // Write it back to the file
    fs.writeFileSync('blog-posts.json', JSON.stringify(posts, null, 2), 'utf8');
    console.log(`Successfully generated and added new blog post: "${newPost.title}"`);

  } catch (error) {
    console.error("Error generating blog post:", error);
    process.exit(1);
  }
}

generateBlogPost();
