/**
 * محافظ SSRF — جلوگیری از fetch سمت سرور به آدرس‌های داخلی/خصوصی.
 *
 * هستهٔ کار یک `lookup` سفارشی روی http/https Agent است؛ چون هر اتصال (شامل
 * redirectها) دوباره DNS را resolve و IP مقصد را اعتبارسنجی می‌کند، حملهٔ
 * DNS-rebinding و redirect-to-internal هم پوشش داده می‌شود.
 */
import { lookup as dnsLookup, type LookupAddress } from 'dns';
import http from 'http';
import https from 'https';
import net from 'net';

/** در dev اجازهٔ آدرس خصوصی (استوریج/سرویس‌های localhost). با env قابل override در prod. */
const ALLOW_PRIVATE =
  process.env.NODE_ENV === 'development' ||
  process.env.ALLOW_PRIVATE_IMAGE_HOSTS === '1';

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const o = Number(p);
    if (!Number.isInteger(o) || o < 0 || o > 255) return null;
    n = n * 256 + o;
  }
  return n >>> 0;
}

function inV4Range(ipInt: number, cidr: string): boolean {
  const [base, bitsStr] = cidr.split('/');
  const baseInt = ipv4ToInt(base);
  if (baseInt === null) return false;
  const bits = Number(bitsStr);
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

const BLOCKED_V4 = [
  '0.0.0.0/8',
  '10.0.0.0/8',
  '100.64.0.0/10',
  '127.0.0.0/8',
  '169.254.0.0/16', // link-local + cloud metadata (169.254.169.254)
  '172.16.0.0/12',
  '192.0.0.0/24',
  '192.0.2.0/24',
  '192.168.0.0/16',
  '198.18.0.0/15',
  '198.51.100.0/24',
  '203.0.113.0/24',
  '224.0.0.0/4', // multicast
  '240.0.0.0/4', // reserved
];

/** آیا این IP (v4 یا v6) داخلی/خصوصی/رزرو است؟ */
export function isBlockedAddress(address: string): boolean {
  const family = net.isIP(address);

  if (family === 4) {
    const ipInt = ipv4ToInt(address);
    if (ipInt === null) return true; // غیرقابل‌تجزیه → مسدود
    return BLOCKED_V4.some((cidr) => inV4Range(ipInt, cidr));
  }

  if (family === 6) {
    let v6 = address.toLowerCase();
    // IPv4-mapped (::ffff:a.b.c.d) → بر اساس IPv4 ارزیابی کن
    const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isBlockedAddress(mapped[1]);
    if (v6.includes('%')) v6 = v6.split('%')[0]; // حذف zone id
    if (v6 === '::1' || v6 === '::') return true; // loopback / unspecified
    if (v6.startsWith('fe80') || v6.startsWith('fe9') || v6.startsWith('fea') || v6.startsWith('feb'))
      return true; // link-local fe80::/10
    if (v6.startsWith('fc') || v6.startsWith('fd')) return true; // unique-local fc00::/7
    if (v6.startsWith('2001:db8')) return true; // documentation
    return false;
  }

  // نه IPv4 و نه IPv6 معتبر
  return true;
}

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number
) => void;

// امضای سازگار با dns.lookup که توسط net/tls هنگام اتصال صدا زده می‌شود.
function safeLookup(hostname: string, options: unknown, callback: LookupCallback): void {
  const cb = (typeof options === 'function' ? options : callback) as LookupCallback;
  const opts = typeof options === 'function' ? {} : (options as object);

  dnsLookup(hostname, opts as never, (err, address, family) => {
    if (err) return cb(err, '', undefined);

    const addrs: LookupAddress[] = Array.isArray(address)
      ? (address as unknown as LookupAddress[])
      : [{ address: address as string, family: family as number }];

    if (!ALLOW_PRIVATE) {
      for (const a of addrs) {
        if (isBlockedAddress(a.address)) {
          const e = new Error(
            `SSRF blocked: ${hostname} → ${a.address} (private/reserved address)`
          ) as NodeJS.ErrnoException;
          e.code = 'ERR_SSRF_BLOCKED';
          return cb(e, '', undefined);
        }
      }
    }

    // فرمت خروجی را مطابق ورودی برگردان (آرایه یا تک‌مقدار)
    if (Array.isArray(address)) return cb(null, addrs);
    return cb(null, addrs[0].address, addrs[0].family);
  });
}

/** Agentهای امن برای axios/fetch — هر اتصال IP مقصد را اعتبارسنجی می‌کند. */
export const ssrfSafeHttpAgent = new http.Agent({
  lookup: safeLookup as never,
  keepAlive: false,
});
export const ssrfSafeHttpsAgent = new https.Agent({
  lookup: safeLookup as never,
  keepAlive: false,
});

/**
 * اعتبارسنجی اولیهٔ یک URL کاربر قبل از fetch.
 * فقط http/https و (در prod) هاست‌های غیرخصوصیِ literal-IP را می‌پذیرد.
 * اعتبارسنجی نهاییِ IP در زمان اتصال توسط safeLookup انجام می‌شود.
 */
export function isPublicHttpUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  if (!parsed.hostname) return false;

  // اگر هاست یک IP literal است، همین‌جا چک کن (lookup برای IPها صدا زده نمی‌شود)
  const host = parsed.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host) && !ALLOW_PRIVATE && isBlockedAddress(host)) return false;

  return true;
}
