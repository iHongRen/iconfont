/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AppDelegate.h"

#import <Cocoa/Cocoa.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import "AppOpenFilesEmitter.h"


@implementation AppDelegate
{
  BOOL didFinishLaunching;
  NSArray *openFilenames;
}

-(instancetype)init {
  if(self = [super init]) {
    NSRect contentSize = NSMakeRect(200, 500, 1000, 500); // initial size of main NSWindow
    self.window = [[NSWindow alloc] initWithContentRect:contentSize
                                             styleMask:
                                                NSWindowStyleMaskTitled |
                                                NSWindowStyleMaskResizable |
                                                NSWindowStyleMaskFullSizeContentView |
                                                NSWindowStyleMaskMiniaturizable |
                                                NSWindowStyleMaskClosable
                                               backing:NSBackingStoreBuffered
                                                 defer:NO];
    NSWindowController *windowController = [[NSWindowController alloc] initWithWindow:self.window];
    [[self window] setTitleVisibility:NSWindowTitleHidden];
    [[self window] setTitlebarAppearsTransparent:YES];
    [windowController setShouldCascadeWindows:NO];
    [windowController setWindowFrameAutosaveName:@"iconfont"];
    [windowController showWindow:self.window];
    [self setUpApplicationMenu];
  }
  return self;
}


- (void)applicationDidFinishLaunching:(__unused NSNotification *)aNotification {
  NSURL *jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"iconfont"
                                               initialProperties:nil
                                                   launchOptions:@{@"argv": [self argv]}];
  rootView.material = NSVisualEffectMaterialAppearanceBased;
  [self.window setContentView:rootView];
  
  didFinishLaunching = YES;
  if (openFilenames.count) {
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [[NSNotificationCenter defaultCenter] postNotificationName:IFApplicationOpenFilenamesNotification object:openFilenames];
        openFilenames = nil;
      });
  }
}

- (void)setUpApplicationMenu {
  NSMenuItem *containerItem = [NSMenuItem new];
  NSMenu *rootMenu = [[NSMenu alloc] initWithTitle:@""];
  [containerItem setSubmenu:rootMenu];
  [rootMenu addItemWithTitle:@"About" action:@selector(orderFrontStandardAboutPanel:) keyEquivalent:@""];
  [rootMenu addItemWithTitle:@"Quit" action:@selector(terminate:) keyEquivalent:@"q"];
  [[NSApp mainMenu] addItem:containerItem];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication * __unused)theApplication {
  return YES;
}

- (void)application:(NSApplication *)sender openFiles:(NSArray<NSString *> *)filenames {
  if (didFinishLaunching) {
    [[NSNotificationCenter defaultCenter] postNotificationName:IFApplicationOpenFilenamesNotification object:filenames];
    return;
  }
  
  openFilenames = filenames;
}
@end
