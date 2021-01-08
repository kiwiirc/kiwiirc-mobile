import { isAndroid } from 'tns-core-modules/platform';

export function verticalCenterLabel(view) {
    if (isAndroid) {
        view.android.setGravity(17);
    }
}
