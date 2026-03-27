import Foundation
import React
import WidgetKit

@objc(WidgetPreferences)
class WidgetPreferences: NSObject {
  private let appGroup = "{{APP_GROUP}}"
  private let deviceIdKey = "widget_device_id"
  private let deviceNameKey = "widget_device_name"

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc
  func setWidgetDevice(
    _ deviceId: String,
    deviceName: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let defaults = UserDefaults(suiteName: appGroup) else {
      reject("widget_defaults_unavailable", "Unable to open app group defaults.", nil)
      return
    }

    defaults.set(deviceId, forKey: deviceIdKey)
    defaults.set(deviceName, forKey: deviceNameKey)
    WidgetCenter.shared.reloadAllTimelines()
    resolve(nil)
  }

  @objc
  func getWidgetDevice(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let defaults = UserDefaults(suiteName: appGroup) else {
      reject("widget_defaults_unavailable", "Unable to open app group defaults.", nil)
      return
    }

    resolve([
      "deviceId": defaults.string(forKey: deviceIdKey) ?? "",
      "deviceName": defaults.string(forKey: deviceNameKey) ?? ""
    ])
  }

  @objc
  func refreshWidget(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    WidgetCenter.shared.reloadAllTimelines()
    resolve(nil)
  }
}
