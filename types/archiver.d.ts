declare module 'archiver' {
  interface Archiver {
    pipe<T extends NodeJS.WritableStream>(destination: T): T;
    append(source: string | Buffer, options: { name: string }): Archiver;
    finalize(): void;
    on(event: 'error', listener: (err: Error) => void): Archiver;
  }

  function archiver(format: 'zip', options?: { zlib?: { level?: number } }): Archiver;
  export default archiver;
}
