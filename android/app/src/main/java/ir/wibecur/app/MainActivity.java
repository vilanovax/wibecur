package ir.wibecur.app;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.net.http.SslError;
import android.util.Log;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;

/**
 * WebView مستقیم به سایت — بدون Capacitor Bridge.
 * Capacitor با server.url روی اندروید جدید درخواست‌ها را intercept می‌کند و صفحه سفید می‌دهد.
 */
public class MainActivity extends AppCompatActivity {

    private static final String TAG = "WibeWebView";

    private WebView webView;

    private String appScheme;
    private String appHost;

    /** origin خودِ اپ (از AppConfig.APP_URL) — تا dev و prod هر دو داخل WebView بمانند. */
    private boolean isAppOrigin(Uri uri) {
        String scheme = uri.getScheme();
        String host = uri.getHost();
        if (scheme == null || host == null) return false;
        if (!scheme.equalsIgnoreCase(appScheme)) return false;
        // میزبان دقیق یا زیردامنه‌های همان دامنهٔ ریشه (مثلاً *.wibe.ir).
        if (host.equalsIgnoreCase(appHost)) return true;
        String rootDot = "." + appHost;
        return host.toLowerCase().endsWith(rootDot.toLowerCase());
    }

    /** صفحهٔ خطا را با علت واقعی (کد + توضیح) باز می‌کند تا دیباگ ممکن شود. */
    private void showErrorPage(WebView view, String reason) {
        String encoded;
        try {
            encoded = URLEncoder.encode(reason == null ? "" : reason, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            encoded = "";
        }
        view.loadUrl(AppConfig.ERROR_PAGE + "?reason=" + encoded);
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Uri appUri = Uri.parse(AppConfig.APP_URL);
        appScheme = appUri.getScheme() != null ? appUri.getScheme() : "https";
        appHost = appUri.getHost() != null ? appUri.getHost() : "app.wibe.ir";

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#E5E7EB"));
        setContentView(webView);

        // دیباگ ریموت WebView فقط در بیلد debug؛ در release هرگز روشن نشود
        // (جلوگیری از اتصال DevTools به نشست احراز‌هویت‌شده روی دستگاه کاربر).
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        // محتوای mixed فقط در dev مجاز است؛ در production هرگز HTTP روی صفحهٔ HTTPS بارگذاری نشود.
        settings.setMixedContentMode(
            BuildConfig.DEBUG
                ? WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
                : WebSettings.MIXED_CONTENT_NEVER_ALLOW
        );
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        // امنیت: باز شدن خودکار پنجره/پاپ‌آپ توسط JS غیرفعال شود.
        settings.setJavaScriptCanOpenWindowsAutomatically(false);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(
            new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(
                    WebView view,
                    WebResourceRequest request
                ) {
                    Uri uri = request.getUrl();

                    // فقط origin خودِ اپ داخل WebView بارگذاری شود.
                    if (isAppOrigin(uri)) {
                        return false; // بگذار WebView خودش بارگذاری کند.
                    }

                    // هر مقصد خارجی در مرورگر سیستم باز شود (نه داخل نشست احراز‌هویت‌شده).
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    } catch (ActivityNotFoundException ignored) {
                        // اپ مناسبی برای این لینک نیست — نادیده بگیر.
                    }
                    return true;
                }

                @Override
                public void onReceivedError(
                    WebView view,
                    WebResourceRequest request,
                    WebResourceError error
                ) {
                    // فقط خطای فریم اصلی (سند) باعث صفحهٔ خطا شود؛
                    // خطای زیرمنبع‌ها (تصویر/فونت) نباید کل صفحه را از کار بیندازد.
                    if (!request.isForMainFrame()) {
                        return;
                    }
                    String reason = "code=" + error.getErrorCode()
                        + " desc=" + error.getDescription()
                        + " url=" + request.getUrl();
                    Log.e(TAG, "onReceivedError " + reason);
                    showErrorPage(view, reason);
                }

                @Override
                public void onReceivedSslError(
                    WebView view,
                    SslErrorHandler handler,
                    SslError error
                ) {
                    // گواهی نامعتبر = هندشیک را لغو کن (امن؛ هرگز proceed نکن)
                    // و به‌جای صفحهٔ سفید، صفحهٔ خطای فارسی را نشان بده.
                    // SslError.SSL_UNTRUSTED = 3 — معمولاً زنجیرهٔ ناقص یا ریشهٔ جدید LE (Root YR)
                    String label;
                    switch (error.getPrimaryError()) {
                        case SslError.SSL_UNTRUSTED:
                            label = "SSL_UNTRUSTED(3)";
                            break;
                        case SslError.SSL_EXPIRED:
                            label = "SSL_EXPIRED(1)";
                            break;
                        case SslError.SSL_IDMISMATCH:
                            label = "SSL_IDMISMATCH(2)";
                            break;
                        case SslError.SSL_DATE_INVALID:
                            label = "SSL_DATE_INVALID(4)";
                            break;
                        case SslError.SSL_INVALID:
                            label = "SSL_INVALID(5)";
                            break;
                        default:
                            label = "SSL_" + error.getPrimaryError();
                            break;
                    }
                    String reason = label + " url=" + error.getUrl();
                    Log.e(TAG, "onReceivedSslError " + reason + " cert=" + error.getCertificate());
                    handler.cancel();
                    showErrorPage(view, reason);
                }
            }
        );

        webView.loadUrl(AppConfig.APP_URL);

        getOnBackPressedDispatcher().addCallback(
            this,
            new OnBackPressedCallback(true) {
                @Override
                public void handleOnBackPressed() {
                    if (webView.canGoBack()) {
                        webView.goBack();
                    } else {
                        finish();
                    }
                }
            }
        );
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
