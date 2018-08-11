//
//  AppOpenFilesEmitter.h
//  iconfont
//
//  Created by chen on 2018/8/10.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
extern NSString *const IFApplicationOpenFilenamesNotification;

@interface AppOpenFilesEmitter : RCTEventEmitter <RCTBridgeModule>

@end
