import OG from "@components/OG";
import type { APIRoute } from "astro";
import { getCollection, getEntry } from "astro:content";
import { PNG } from "./createImage";

export const getStaticPaths = async () => {
  const blogEntries = await getCollection("blog");
  return blogEntries.map((entry) => ({
    params: { slug: entry.slug },
  }));
};

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params;

  if (!slug) {
    return new Response(JSON.stringify({ error: "Slug is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const entry = await getEntry("blog", slug);

    if (!entry) {
      return new Response(JSON.stringify({ error: "Blog post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const image = await PNG(OG(entry.data.title, entry.data.description));
    return new Response(new Uint8Array(image), {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
