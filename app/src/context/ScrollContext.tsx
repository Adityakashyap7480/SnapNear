import { type ReactNode, type RefObject, createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { ScrollView, View } from 'react-native';

interface ScrollValue {
  /** Scrolls so the view is centred on screen, like scrollIntoView({ block: 'center' }) */
  scrollIntoView: (target: RefObject<View | null>) => void;
  scrollToTop: () => void;
}

const ScrollContext = createContext<ScrollValue>({ scrollIntoView: () => {}, scrollToTop: () => {} });

interface ScrollPageProps {
  children: ReactNode;
  contentClassName?: string;
  header?: ReactNode;
}

/** The page's main scroller; children can ask it to scroll to a section. */
export function ScrollPage({ children, contentClassName, header }: ScrollPageProps) {
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const viewportHeight = useRef(0);

  const scrollIntoView = useCallback((target: RefObject<View | null>) => {
    const node = target.current;
    const content = contentRef.current;
    if (!node || !content) return;
    node.measureLayout(
      content,
      (_x, y, _w, h) => {
        const top = Math.max(0, y + h / 2 - viewportHeight.current / 2);
        scrollRef.current?.scrollTo({ y: top, animated: true });
      },
      () => {}
    );
  }, []);

  const scrollToTop = useCallback(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), []);
  const value = useMemo(() => ({ scrollIntoView, scrollToTop }), [scrollIntoView, scrollToTop]);

  return (
    <ScrollContext.Provider value={value}>
      {header}
      <ScrollView
        ref={scrollRef}
        className="w-full flex-1"
        style={{ width: '100%' }}
        contentContainerStyle={{ flexGrow: 1, width: '100%' }}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
        scrollEventThrottle={16}
        onLayout={(e) => {
          viewportHeight.current = e.nativeEvent.layout.height;
        }}
      >
        <View ref={contentRef} collapsable={false} className={`w-full flex-grow ${contentClassName || ''}`} style={{ width: '100%' }}>
          {children}
        </View>
      </ScrollView>
    </ScrollContext.Provider>
  );
}

export function useScroll() {
  return useContext(ScrollContext);
}
