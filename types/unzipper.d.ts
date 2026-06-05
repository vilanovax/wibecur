declare module 'unzipper' {
  import type { Readable } from 'stream';

  interface ZipEntry {
    path: string;
    buffer: () => Promise<Buffer>;
  }

  interface Directory {
    files: ZipEntry[];
  }

  interface Open {
    buffer: (buf: Buffer) => Promise<Directory>;
    file: (path: string) => Promise<Directory>;
  }

  const Open: Open;
  export { Open };
  export default { Open };
}
