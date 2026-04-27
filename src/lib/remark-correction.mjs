import { visit } from "unist-util-visit";

/**
 * Remark plugin to transform ~~original text~~(correction text) into custom correction markup
 * Example: ~~mistake~~(correct) becomes a strikethrough with correction inline to the right
 */
export function remarkCorrection() {
  return (tree) => {
    visit(tree, "paragraph", (node, index, parent) => {
      if (node.children) {
        for (let i = 0; i < node.children.length - 1; i++) {
          const currentNode = node.children[i];
          const nextNode = node.children[i + 1];

          // Check if current node is delete and next node is text with parentheses
          if (
            currentNode.type === "delete" &&
            nextNode &&
            nextNode.type === "text" &&
            nextNode.value.startsWith("(")
          ) {
            const match = nextNode.value.match(/^\(([^)]+)\)/);

            if (match) {
              const correctionText = match[1];
              const remainingText = nextNode.value.slice(match[0].length);

              // Get the original text from the delete node
              const originalText = currentNode.children
                .map((child) => (child.type === "text" ? child.value : ""))
                .join("");

              // Create inline correction
              const correctionNode = {
                type: "html",
                value: `<span class="line-through decoration-blue-800">${originalText}</span> <span class="font-handwritten font-bold text-blue-800 text-xl">${correctionText}</span>`,
              };

              // Replace the delete node with our correction node
              node.children[i] = correctionNode;

              // Update or remove the next text node
              if (remainingText) {
                nextNode.value = remainingText;
              } else {
                node.children.splice(i + 1, 1);
              }
            }
          }
        }
      }
    });
  };
}
