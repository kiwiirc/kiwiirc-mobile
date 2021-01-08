import * as Misc from '@/helpers/Misc';

export {
    joinChannels
};

function joinChannels(network, channels) {
    const state = network.appState;
    let bufferObjs = Misc.extractBuffers(channels);

    // Only switch to the first channel we join if multiple are being joined
    let hasSwitchedActiveBuffer = false;
    bufferObjs.forEach((bufferObj) => {
        let chanName = bufferObj.name;
        let ignoreNames = ['#0', '0', '&0'];
        if (
            ignoreNames.indexOf(chanName) > -1 ||
            chanName.replace(/[#&]/g, '') === ''
        ) {
            return;
        }

        let newBuffer = state.getOrAddBufferByName(network.id, chanName);
        if (newBuffer && !hasSwitchedActiveBuffer) {
            state.$emit('open.buffer', newBuffer);
            hasSwitchedActiveBuffer = true;
        }

        if (bufferObj.key) {
            newBuffer.key = bufferObj.key;
        }

        if (network.isChannelName(chanName)) {
            network.ircClient.join(chanName, bufferObj.key);
        }
    });
}
