package com.mws.acta;

import android.app.Activity;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    public static final String SYSTEM_BAR_PREFERENCES = "acta.system.bar.preferences";
    public static final String SYSTEM_BAR_COLOR = "color";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ActaSyncPlugin.class);
        super.onCreate(savedInstanceState);
        getBridge().getWebView().setWebChromeClient(new ActaWebChromeClient(getBridge()));
        applySavedSystemBars();
    }

    @Override
    public void onResume() {
        super.onResume();
        applySavedSystemBars();
    }

    private void applySavedSystemBars() {
        SharedPreferences preferences = getSharedPreferences(SYSTEM_BAR_PREFERENCES, 0);
        int color = preferences.getInt(SYSTEM_BAR_COLOR, Color.parseColor("#E7E7E3"));
        applySystemBars(this, color);
    }

    public static void applySystemBars(Activity activity, int background) {
        Window window = activity.getWindow();
        window.setStatusBarColor(background);
        window.setNavigationBarColor(background);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }
        WindowCompat.setDecorFitsSystemWindows(window, true);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        boolean darkIcons = relativeLuminance(background) >= .42;
        controller.setAppearanceLightStatusBars(darkIcons);
        controller.setAppearanceLightNavigationBars(darkIcons);
    }

    private static double relativeLuminance(int color) {
        double red = linearChannel(Color.red(color) / 255.0);
        double green = linearChannel(Color.green(color) / 255.0);
        double blue = linearChannel(Color.blue(color) / 255.0);
        return red * .2126 + green * .7152 + blue * .0722;
    }

    private static double linearChannel(double channel) {
        return channel <= .04045 ? channel / 12.92 : Math.pow((channel + .055) / 1.055, 2.4);
    }
}
