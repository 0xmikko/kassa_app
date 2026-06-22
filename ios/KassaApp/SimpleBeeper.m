#import "SimpleBeeper.h"
#import <AudioToolbox/AudioToolbox.h>
#import <AVFoundation/AVFoundation.h>

@implementation SimpleBeeper

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(playBeep)
{
    NSLog(@"🔊 SimpleBeeper: Native playBeep called");
    
    // Configure audio session for playback
    NSError *error;
    AVAudioSession *session = [AVAudioSession sharedInstance];
    [session setCategory:AVAudioSessionCategoryPlayback error:&error];
    [session setActive:YES error:&error];
    
    if (error) {
        NSLog(@"❌ Audio session error: %@", error.localizedDescription);
    } else {
        NSLog(@"✅ Audio session configured for playback");
    }
    
    // Play system sound - this WILL work if speakers are functional
    AudioServicesPlaySystemSound(1057); // Tock
    NSLog(@"🔊 AudioServicesPlaySystemSound(1057) called");
    
    // Also try alert sound
    AudioServicesPlayAlertSound(1057);
    NSLog(@"🔊 AudioServicesPlayAlertSound(1057) called");
    
    // Try another common system sound
    AudioServicesPlaySystemSound(1103); // Screenshot sound
    NSLog(@"🔊 AudioServicesPlaySystemSound(1103) called");
}

RCT_EXPORT_METHOD(playErrorBeep)
{
    NSLog(@"🔊 SimpleBeeper: Native playErrorBeep called");
    
    // Different system sound for errors
    AudioServicesPlaySystemSound(1053); // Error beep
    NSLog(@"🔊 AudioServicesPlaySystemSound(1053) called");
}

@end 