import { Animation, Color, GestureTypes } from '@nativescript/core';
import { AnimationCurve } from '@nativescript/core/ui/enums';

export function addTouchPop(view) {
    if (!view || !view.animate) {
        return;
    }
    let animationStartTime = 0;
    view.on(GestureTypes.touch, touchHandler);

    view.on('unloaded', () => {
        view.off(GestureTypes.touch, touchHandler);
    });

    function touchHandler(event) {
        if (event.action === 'down') {
            animationStartTime = Date.now();
            view.animate({
                scale: { x: 0.9, y: 0.9 },
                opacity: 0.8,
                duration: 200,
                curve: AnimationCurve.easeIn,
            });
        } else if (event.action === 'up') {
            view.animate({
                scale: { x: 1, y: 1 },
                opacity: 1,
                duration: 100,
                curve: AnimationCurve.easeOut,
                delay: Math.max(0, 200 - (Date.now() - animationStartTime)),
            });
        }
    }
}

export function addCellHighlight(view) {
    if (!view || !view.animate) {
        return;
    }
    view.backgroundColor = "rgba(144, 144, 144, 0)";
    let animation = new Animation([
        {
            target: view,
            backgroundColor: new Color('rgba(144,144,144,0.4)'),
            duration: 100,
            curve: AnimationCurve.easeIn,
        },
    ]);
    let animationOut = new Animation([
        {
            target: view,
            backgroundColor: new Color('rgba(144,144,144,0)'),
            duration: 200,
            curve: AnimationCurve.easeOut,
        },
    ]);

    view.on(GestureTypes.touch, touchHandler);

    view.on('unloaded', () => {
        view.off(GestureTypes.touch, touchHandler);
    });

    function touchHandler(event) {
        if (event.action === 'down') {
            animation.play().then(() => {
                animationOut.play()
            });
        }
    }
}
