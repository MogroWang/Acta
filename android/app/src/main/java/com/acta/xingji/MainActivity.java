package com.acta.xingji;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ActaSyncPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
