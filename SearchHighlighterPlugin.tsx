import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useCallback } from 'react';

// doesn't work in Firefox (but is in Firefox nightly)
// https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API#browser_compatibility
//
// highlights the given search terms in the editor
// then scrolls to the first search term and selects it

export function SearchHighlighterPlugin({
  searchTerms
}: {
  searchTerms: string[];
}): null {
  const [editor] = useLexicalComposerContext();

  const highlightSearchTerms = useCallback(() => {
    if (!searchTerms || searchTerms.length === 0) return;

    CSS.highlights?.clear();

    const editorElement = editor.getRootElement();
    if (!editorElement) return;

    const ranges: Range[] = [];
    const treeWalker = document.createTreeWalker(editorElement, NodeFilter.SHOW_TEXT);

    let currentNode = treeWalker.nextNode();
    while (currentNode) {
      const text = currentNode.textContent?.toLowerCase() || '';
      searchTerms.forEach(term => {
        const termLower = term.toLowerCase();
        let startPos = 0;
        while (startPos < text.length) {
          const index = text.indexOf(termLower, startPos);
          if (index === -1) break;

          if (currentNode) {
            const range = new Range();
            range.setStart(currentNode, index);
            range.setEnd(currentNode, index + term.length);
            ranges.push(range);
          }

          startPos = index + term.length;
        }
      });
      currentNode = treeWalker.nextNode();
    }

    if (CSS.highlights && ranges.length > 0) {
      const searchResultsHighlight = new Highlight(...ranges);
      CSS.highlights.set("search-results", searchResultsHighlight);

      if (ranges[0]) {
        const firstElement = ranges[0].startContainer.parentElement;
        firstElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(ranges[0]);
      }
    }
  }, [searchTerms, editor]);

  useEffect(() => {
    highlightSearchTerms();

    return () => {
      if (searchTerms.length > 0) {
        CSS.highlights?.clear();
      }
    };
  }, [editor, searchTerms, highlightSearchTerms]);

  return null;
}