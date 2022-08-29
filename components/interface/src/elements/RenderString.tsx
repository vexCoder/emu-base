import { curryN } from "ramda";
import {
  createElement,
  ReactHTML,
  ReactNode,
  useLayoutEffect,
  useState,
} from "react";

type RenderStringProps<T extends keyof ReactHTML> = BaseComponentProps<T> & {
  html: string;
  container: T;
  nodeRender?: (child: ChildNode) => ReactNode;
};

const RenderString = <T extends keyof ReactHTML>({
  html,
  container,
  nodeRender = () => undefined,
  ...containerProps
}: RenderStringProps<T>) => {
  const [nodes, setNodes] = useState<React.ReactNode[]>([]);

  useLayoutEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const arrNodes = Array.from(doc.body.childNodes).map(
      (item): ReactNode | null => {
        const { nodeName, nodeType, textContent } = item;
        const custom = nodeRender(item);
        if (custom) return custom;
        if (nodeType === Node.TEXT_NODE) return <p>{textContent}</p>;
        if (nodeType === Node.ELEMENT_NODE) {
          const create = curryN(textContent ? 3 : 2, createElement);
          return textContent && textContent.length
            ? create(nodeName.toLowerCase(), {}, textContent)
            : create(nodeName.toLowerCase(), {});
        }

        return null;
      }
    );

    setNodes(arrNodes);
  }, [html, nodeRender]);

  return createElement(container, containerProps, ...nodes);
};

export default RenderString;
