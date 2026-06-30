import { describe, expect, it } from 'vitest';
import { parseKetabrahBookHtml } from '@/lib/books/ketabrah';

const SAMPLE_HTML = `
<html><head>
<meta name="description" content="کتاب کار عمیق: قوانینی برای تمرکز در دنیایی آشفته نوشته‌ی کال نیوپورت ، اثر پرفروشی است که نشان می‌دهد چگونه ظهور تکنولوژی، توانایی تمرکز عمیق بر وظایف‌تان را از شما گرفته است و چطور می‌توانید بر این معضل غلبه کنید...." />
<meta property="canonical" content="https://ketabrah.com/book/40821-کتاب-کار-عمیق" />
<meta property="og:image" content="https://img.ketabrah.com/img/l/6987879975299278.jpg" />
</head><body>
<div class="book-page-title"><h1>کتاب کار عمیق: قوانینی برای تمرکز در دنیایی آشفته</h1></div>
<meta itemprop="ratingValue" content="4.4" />
<div class="book-main-info-authors"><ul>
<li>نویسنده: <a href="/author/13316">کال نیوپورت</a></li>
<li>مترجم: <a href="/author/23808">ناهید ملکی</a></li>
<li>ناشر: <a href="/publisher/novin"> نشر نوین</a></li>
</ul></div>
<div class="book-description-content">
<div class="section" id="BookIntroduction">
<h2 class="section-title">معرفی کتاب</h2>
<p>کتاب <strong>کار عمیق</strong> نوشته‌ی <strong>کال نیوپورت</strong>، اثر پرفروشی است که نشان می‌دهد چگونه ظهور تکنولوژی، توانایی تمرکز عمیق بر وظایف‌تان را از شما گرفته است.</p>
<p>در این اثر استراتژی‌های گوناگونی مطرح می‌شود که به شما کمک می‌کند خروجی کارتان را بهبود بخشید.</p>
</div>
<div class="book-details section" id="BookDetails">
<table><tbody>
<tr><td>شابک</td><td><span>978-622-6840-12-5</span></td></tr>
<tr><td>موضوع کتاب</td><td><a href="/books/کتاب-مدیریت-ذهن" title="کتاب‌های مدیریت ذهن">کتاب‌های مدیریت ذهن</a></td></tr>
</tbody></table>
</div>
</div>
</body></html>
`;

describe('parseKetabrahBookHtml', () => {
  it('extracts rich book fields for import', () => {
    const record = parseKetabrahBookHtml(SAMPLE_HTML, '40821');
    expect(record).not.toBeNull();
    expect(record?.title).toBe('کار عمیق');
    expect(record?.authors).toEqual(['کال نیوپورت']);
    expect(record?.translator).toBe('ناهید ملکی');
    expect(record?.publisher).toBe('نشر نوین');
    expect(record?.isbn).toBe('9786226840125');
    expect(record?.genres).toContain('مدیریت ذهن');
    expect(record?.description).toContain('استراتژی');
    expect(record?.description).toContain('تکنولوژی');
    expect(record?.coverUrl).toContain('ketabrah.com');
    expect(record?.bookUrl).toContain('40821');
    expect(record?.rating).toBe(4.4);
  });
});
