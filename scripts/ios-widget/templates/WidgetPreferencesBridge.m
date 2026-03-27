#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetPreferences, NSObject)

RCT_EXTERN_METHOD(
  setWidgetDevice:(NSString *)deviceId
  deviceName:(NSString *)deviceName
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  getWidgetDevice:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  refreshWidget:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
