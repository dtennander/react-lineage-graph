import {
  Dispatch,
  ReactElement,
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { Node } from "./LineageRender";

type Context = {
  getNode: () => Node<object> | null;
  setNode: Dispatch<Node<object> | null>;
  subscribe: (fn: (n: Node<object> | null) => void) => () => void;
};

const LineageContext = createContext<Context | null>(null);

export const LineageProvider = ({ children }: { children: ReactElement }) => {
  const store = useMemo(() => {
    let node: Node<object> | null = null;
    const subscribers = new Set<(n: Node<object> | null) => void>();
    return {
      getNode: () => node,
      setNode: (n: Node<object> | null) => {
        node = n;
        subscribers.forEach((fn) => fn(n));
      },
      subscribe: (fn: (n: Node<object> | null) => void) => {
        subscribers.add(fn);
        return () => subscribers.delete(fn);
      },
    };
  }, []);
  return (
    <LineageContext.Provider value={store}>{children}</LineageContext.Provider>
  );
};

export const useNode = (): Node<object> | null => {
  const store = useContext(LineageContext);
  if (!store) throw new Error("useNode must be used within a LineageProvider");
  const node = useSyncExternalStore(store.subscribe, store.getNode);
  return node;
};

export const useSetNode = () => {
  const store = useContext(LineageContext);
  if (!store)
    throw new Error("useSetNode must be used within a LineageProvider");
  return store.setNode;
};
