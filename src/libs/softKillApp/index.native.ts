import {NativeModules} from 'react-native';
import Log from '@libs/Log';

const softKillApp = () => {
    if (!NativeModules.TestToolsBridge) {
        Log.warn('[softKillApp] TestToolsBridge native module is not registered in this build — soft kill skipped');
        return;
    }
    NativeModules.TestToolsBridge.softKillApp();
};
export default softKillApp;
