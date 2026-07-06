import { defineMcp } from "@lovable.dev/mcp-js";
import listPostsTool from "./tools/list-posts";
import getPostTool from "./tools/get-post";
import searchPostsTool from "./tools/search-posts";

export default defineMcp({
  name: "bayu-portfolio-mcp",
  title: "Bayu Dwi Darmawan Portfolio MCP",
  version: "0.1.0",
  instructions:
    "Tools for reading Bayu Dwi Darmawan's portfolio blog. Use `list_blog_posts` to browse published posts, `search_blog_posts` to find posts by keyword, and `get_blog_post` to read a full post by slug.",
  tools: [listPostsTool, searchPostsTool, getPostTool],
});
