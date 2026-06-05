"use client";

// Renders the article editor in "create" mode by forwarding to the [id] editor
// with the sentinel value "new".
import ArticleEditorPage from "../[id]/page";

export default function NewArticlePage() {
  return <ArticleEditorPage />;
}
