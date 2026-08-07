export {};

declare global {
  interface Window {
    umami?: {
      track: (
        event?: string | ((props: { url?: string; [key: string]: unknown }) => Record<string, unknown>),
        data?: Record<string, string | number>
      ) => void;
    };
  }
}
