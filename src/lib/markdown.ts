// Markdown collapses repeated blank lines, so empty paragraphs the writer
// created with Enter would vanish when rendered. Insert a zero-width space
// paragraph for every extra blank line so published articles match the editor
// preview exactly.
const ZWSP = '&#8203;';

export const normalizeArticleMarkdown = (text: string) => {
  const withEmptyParagraphs = text.replace(/\n{3,}/g, (match) => {
    const extra = match.length - 2;
    return '\n\n' + `${ZWSP}\n\n`.repeat(extra);
  });

  const trailing = withEmptyParagraphs.match(/\n{2,}$/);
  if (trailing) {
    return withEmptyParagraphs.replace(/\n{2,}$/, '\n\n' + ZWSP);
  }
  return withEmptyParagraphs;
};
