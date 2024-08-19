import {
  Dispatch,
  ReactElement,
  SetStateAction,
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { Node } from "./LineageRender";

type Context = {
  getNode: () => Node<object> | null;
  setNode: Dispatch<Node<object> | null>;
  getFullScreen: () => boolean;
  setFullScreen: Dispatch<SetStateAction<boolean>>;
  subscribe: (fn: (n: Node<object> | null) => void) => () => void;
  fsSubscribe: (fn: (fs: boolean) => void) => () => void;
};

const LineageContext = createContext<Context | null>(null);

export const LineageProvider = ({
  children,
  fullscreenDefault,
}: {
  children: ReactElement;
  fullscreenDefault: boolean;
}) => {
  const store = useMemo(() => {
    let node: Node<object> | null = null;
    let fullscreen = fullscreenDefault;
    const subscribers = new Set<(n: Node<object> | null) => void>();
    const fsSubscribers = new Set<(fs: boolean) => void>();
    return {
      getNode: () => node,
      getFullScreen: () => fullscreen,
      setNode: (n: Node<object> | null) => {
        node = n;
        subscribers.forEach((fn) => fn(n));
      },
      setFullScreen(fs: boolean | ((f: boolean) => boolean)) {
        if (typeof fs === "function") {
          fs = fs(fullscreen);
        }
        fullscreen = fs;
        fsSubscribers.forEach((fn) => fn(fs));
      },
      subscribe: (fn: (n: Node<object> | null) => void) => {
        subscribers.add(fn);
        return () => subscribers.delete(fn);
      },
      fsSubscribe: (fn: (fs: boolean) => void) => {
        fsSubscribers.add(fn);
        return () => fsSubscribers.delete(fn);
      },
    };
  }, [fullscreenDefault]);
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

export const useFullScreen = () => {
  const store = useContext(LineageContext);
  if (!store)
    throw new Error("useFullScreen must be used within a LineageProvider");
  const fs = useSyncExternalStore(store.fsSubscribe, store.getFullScreen);
  return fs;
};

export const useSetFullScreen = () => {
  const store = useContext(LineageContext);
  if (!store)
    throw new Error("useSetFullScreen must be used within a LineageProvider");
  return store.setFullScreen;
};
