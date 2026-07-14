const DEFINITION_PREVIEW_LIMIT = 150;

export function getDefinitionPreview(term: {
  english_definition: string | null;
  short_definition: string | null;
}) {
  const definition =
    term.short_definition ||
    term.english_definition?.split(/\r?\n/, 1)[0] ||
    "";

  if (definition.length <= DEFINITION_PREVIEW_LIMIT) {
    return definition;
  }

  return `${definition.slice(0, DEFINITION_PREVIEW_LIMIT).trim()}...`;
}
