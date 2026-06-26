package ir.wibecur.app;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.net.http.SslError;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;

/**
 * WebView مستقیم به سایت — بدون Capacitor Bridge.
 * Capacitor با server.url روی اندروید جدید درخواست‌ها را intercept می‌کند و صفحه سفید می‌دهد.
 */
public class MainActivity extends AppCompatActivity {

    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

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
                    String scheme = uri.getScheme();
                    String host = uri.getHost();

                    // فقط origin خودِ اپ داخل WebView بارگذاری شود.
                    boolean isAppOrigin =
                        host != null
                            && ("https".equals(scheme))
                            && (host.equals("app.wibe.ir") || host.endsWith(".wibe.ir"));
                    if (isAppOrigin) {
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
                    if (request.isForMainFrame()) {
                        view.loadUrl(AppConfig.ERROR_PAGE);
                    }
                }

                @Override
                public void onReceivedSslError(
                    WebView view,
                    SslErrorHandler handler,
                    SslError error
                ) {
                    // گواهی نامعتبر = هندشیک را لغو کن (امن؛ هرگز proceed نکن)
                    // و به‌جای صفحهٔ سفید، صفحهٔ خطای فارسی را نشان بده.
                    handler.cancel();
                    view.loadUrl(AppConfig.ERROR_PAGE);
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
