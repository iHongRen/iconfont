
//  AppOpenFilesEmitter.m
//  iconfont
//
//  Created by chen on 2018/8/10.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "AppOpenFilesEmitter.h"

NSString *const IFApplicationOpenFilenamesNotification = @"ApplicationOpenFilenamesNotification";

@implementation AppOpenFilesEmitter

RCT_EXPORT_MODULE();
- (NSArray<NSString *> *)supportedEvents {
  return @[@"ApplicationOpenFilenamesEvent"];
}

- (void)startObserving {
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(applicationOpenTTFFilenames:) name:IFApplicationOpenFilenamesNotification object:nil];
}

- (void)stopObserving {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)applicationOpenTTFFilenames:(NSNotification *)noti {
  [self sendEventWithName:@"ApplicationOpenFilenamesEvent" body:noti.object];
}


@end
