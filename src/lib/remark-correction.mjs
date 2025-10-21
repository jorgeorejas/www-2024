import { visit } from "unist-util-visit";

/**
 * Remark plugin to transform ~~original text~~(correction text) into custom correction markup
 * Example: ~~mistake~~(correct) becomes a strikethrough with correction inline to the right
 */
export function remarkCorrection() {
  return (tree) => {
    visit(tree, "delete", (node, index, parent) => {
      // Check if the next node is a text node starting with '('
      if (index !== null && parent && index < parent.children.length - 1) {
        const nextNode = parent.children[index + 1];

        // Check if next node is text and starts with (
        if (
          nextNode &&
          nextNode.type === "text" &&
          nextNode.value.startsWith("(")
        ) {
          const match = nextNode.value.match(/^\(([^)]+)\)/);

          if (match) {
            const correctionText = match[1];
            const remainingText = nextNode.value.slice(match[0].length);

            // Get the original text from the delete node
            const originalText = node.children
              .map((child) => (child.type === "text" ? child.value : ""))
              .join("");

            // Create inline correction without line breaks
            const correctionNode = {
              type: "html",
              value: `<span class="line-through decoration-blue-800">${originalText}</span> <span class="font-handwritten font-bold text-blue-800">${correctionText}</span>`,
            };

            // Replace the delete node with our correction node
            parent.children[index] = correctionNode;

            // Update or remove the next text node
            if (remainingText) {
              nextNode.value = remainingText;
            } else {
              parent.children.splice(index + 1, 1);
            }
          }
        }
      }
    });
  };
}
