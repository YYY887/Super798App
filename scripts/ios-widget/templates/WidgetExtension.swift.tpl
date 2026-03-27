import SwiftUI
import WidgetKit

private let appGroup = "{{APP_GROUP}}"
private let deviceNameKey = "widget_device_name"
private let scanURL = URL(string: "{{SCHEME}}://widget/scan")!
private let drinkURL = URL(string: "{{SCHEME}}://widget/drink")!

struct WidgetEntry: TimelineEntry {
  let date: Date
  let deviceName: String
}

struct WidgetProvider: TimelineProvider {
  func placeholder(in context: Context) -> WidgetEntry {
    WidgetEntry(date: Date(), deviceName: "Select a device")
  }

  func getSnapshot(in context: Context, completion: @escaping (WidgetEntry) -> Void) {
    completion(WidgetEntry(date: Date(), deviceName: loadDeviceName()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<WidgetEntry>) -> Void) {
    let entry = WidgetEntry(date: Date(), deviceName: loadDeviceName())
    let nextRefresh = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date().addingTimeInterval(900)
    completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
  }

  private func loadDeviceName() -> String {
    let defaults = UserDefaults(suiteName: appGroup)
    let value = defaults?.string(forKey: deviceNameKey)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    return value.isEmpty ? "Select in Settings" : value
  }
}

struct {{WIDGET_NAME}}EntryView: View {
  let entry: WidgetEntry

  var body: some View {
    ZStack {
      RoundedRectangle(cornerRadius: 26, style: .continuous)
        .fill(Color.black)
        .overlay(
          RoundedRectangle(cornerRadius: 26, style: .continuous)
            .stroke(Color.white.opacity(0.09), lineWidth: 1)
        )

      VStack(alignment: .leading, spacing: 12) {
        Text("SUPER798 WIDGET")
          .font(.system(size: 10, weight: .bold))
          .foregroundStyle(Color.white.opacity(0.48))

        Text(entry.deviceName)
          .font(.system(size: 18, weight: .heavy))
          .foregroundStyle(.white)
          .lineLimit(2)

        HStack(spacing: 10) {
          Link(destination: scanURL) {
            Text("扫码")
              .frame(maxWidth: .infinity, minHeight: 46)
              .font(.system(size: 15, weight: .bold))
              .foregroundStyle(.black)
              .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                  .fill(Color.white)
              )
          }
          .buttonStyle(.plain)

          Link(destination: drinkURL) {
            Text("喝水")
              .frame(maxWidth: .infinity, minHeight: 46)
              .font(.system(size: 15, weight: .bold))
              .foregroundStyle(.white)
              .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                  .fill(Color.white.opacity(0.08))
                  .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                      .stroke(Color.white.opacity(0.10), lineWidth: 1)
                  )
              )
          }
          .buttonStyle(.plain)
        }
      }
      .padding(16)
    }
  }
}

struct {{WIDGET_NAME}}: Widget {
  let kind: String = "{{WIDGET_NAME}}"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: WidgetProvider()) { entry in
      {{WIDGET_NAME}}EntryView(entry: entry)
    }
    .configurationDisplayName("Super798 小组件")
    .description("一键扫码和一键喝水。")
    .supportedFamilies([.systemSmall])
  }
}

@main
struct {{WIDGET_NAME}}Bundle: WidgetBundle {
  var body: some Widget {
    {{WIDGET_NAME}}()
  }
}
