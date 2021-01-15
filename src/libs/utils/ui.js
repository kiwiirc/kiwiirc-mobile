import { isAndroid } from "@nativescript/core";

export function verticalCenterLabel(view) {
    if (isAndroid) {
        view.android.setGravity(17);
    }
}
