package com.mws.acta;

import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.view.ContextThemeWrapper;
import android.view.Gravity;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.WebView;
import android.widget.EditText;
import android.widget.FrameLayout;
import androidx.appcompat.app.AlertDialog;
import androidx.core.view.WindowCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebChromeClient;

public final class ActaWebChromeClient extends BridgeWebChromeClient {
    private final Bridge actaBridge;

    public ActaWebChromeClient(Bridge bridge) {
        super(bridge);
        actaBridge = bridge;
    }

    private boolean activityUnavailable() {
        Activity activity = actaBridge.getActivity();
        return activity == null || activity.isFinishing() || (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1 && activity.isDestroyed());
    }

    private Context dialogContext(WebView view) {
        Activity activity = actaBridge.getActivity();
        Context base = activity != null ? activity : view.getContext();
        return new ContextThemeWrapper(base, R.style.ActaNativeDialogTheme);
    }

    private int dp(Context context, int value) {
        return Math.round(value * context.getResources().getDisplayMetrics().density);
    }

    private void showAlignedDialog(AlertDialog dialog, boolean showKeyboard) {
        dialog.show();
        Window window = dialog.getWindow();
        if (window == null) return;
        Context context = dialog.getContext();
        int availableWidth = context.getResources().getDisplayMetrics().widthPixels - dp(context, 32);
        window.setGravity(Gravity.CENTER);
        window.setLayout(Math.min(dp(context, 420), availableWidth), WindowManager.LayoutParams.WRAP_CONTENT);
        WindowCompat.setDecorFitsSystemWindows(window, true);
        if (showKeyboard) {
            window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE | WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE);
        }
    }

    @Override
    public boolean onJsAlert(WebView view, String url, String message, final JsResult result) {
        if (activityUnavailable()) {
            result.cancel();
            return true;
        }
        AlertDialog dialog = new AlertDialog.Builder(dialogContext(view))
            .setMessage(message)
            .setPositiveButton(android.R.string.ok, (current, which) -> result.confirm())
            .setOnCancelListener(current -> result.cancel())
            .create();
        showAlignedDialog(dialog, false);
        return true;
    }

    @Override
    public boolean onJsConfirm(WebView view, String url, String message, final JsResult result) {
        if (activityUnavailable()) {
            result.cancel();
            return true;
        }
        AlertDialog dialog = new AlertDialog.Builder(dialogContext(view))
            .setMessage(message)
            .setPositiveButton(android.R.string.ok, (current, which) -> result.confirm())
            .setNegativeButton(android.R.string.cancel, (current, which) -> result.cancel())
            .setOnCancelListener(current -> result.cancel())
            .create();
        showAlignedDialog(dialog, false);
        return true;
    }

    @Override
    public boolean onJsPrompt(WebView view, String url, String message, String defaultValue, final JsPromptResult result) {
        if (activityUnavailable()) {
            result.cancel();
            return true;
        }
        Context context = dialogContext(view);
        EditText input = new EditText(context);
        input.setSingleLine(true);
        input.setText(defaultValue == null ? "" : defaultValue);
        input.setSelection(input.getText().length());

        FrameLayout field = new FrameLayout(context);
        field.setPadding(dp(context, 24), dp(context, 4), dp(context, 24), dp(context, 4));
        field.addView(input, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        AlertDialog dialog = new AlertDialog.Builder(context)
            .setMessage(message)
            .setView(field)
            .setPositiveButton(android.R.string.ok, (current, which) -> result.confirm(input.getText().toString().trim()))
            .setNegativeButton(android.R.string.cancel, (current, which) -> result.cancel())
            .setOnCancelListener(current -> result.cancel())
            .create();
        showAlignedDialog(dialog, true);
        input.requestFocus();
        return true;
    }
}
