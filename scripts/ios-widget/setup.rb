#!/usr/bin/env ruby

require 'json'
require 'fileutils'
require 'pathname'
require 'xcodeproj'

ROOT = File.expand_path('../..', __dir__)
IOS_DIR = File.join(ROOT, 'ios')
APP_JSON_PATH = File.join(ROOT, 'app.json')
TEMPLATES_DIR = File.join(__dir__, 'templates')

def abort_with(message)
  warn(message)
  exit(1)
end

def write_if_changed(path, content)
  if File.exist?(path) && File.read(path) == content
    return
  end

  FileUtils.mkdir_p(File.dirname(path))
  File.write(path, content)
end

def plist_for_app_group(app_group)
  <<~PLIST
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>com.apple.security.application-groups</key>
      <array>
        <string>#{app_group}</string>
      </array>
    </dict>
    </plist>
  PLIST
end

def widget_info_plist
  <<~PLIST
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>CFBundleDevelopmentRegion</key>
      <string>$(DEVELOPMENT_LANGUAGE)</string>
      <key>CFBundleDisplayName</key>
      <string>Super798 Widget</string>
      <key>CFBundleExecutable</key>
      <string>$(EXECUTABLE_NAME)</string>
      <key>CFBundleIdentifier</key>
      <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
      <key>CFBundleInfoDictionaryVersion</key>
      <string>6.0</string>
      <key>CFBundleName</key>
      <string>$(PRODUCT_NAME)</string>
      <key>CFBundlePackageType</key>
      <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
      <key>CFBundleShortVersionString</key>
      <string>$(MARKETING_VERSION)</string>
      <key>CFBundleVersion</key>
      <string>$(CURRENT_PROJECT_VERSION)</string>
      <key>NSExtension</key>
      <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.widgetkit-extension</string>
      </dict>
    </dict>
    </plist>
  PLIST
end

def render_template(path, replacements)
  content = File.read(path)
  replacements.each do |key, value|
    content = content.gsub("{{#{key}}}", value)
  end
  content
end

def ensure_file_reference(group, relative_path)
  basename = File.basename(relative_path)
  group.files.find { |file| file.path == basename } || group.new_file(relative_path)
end

def ensure_source_membership(target, file_ref)
  return if target.source_build_phase.files_references.include?(file_ref)

  target.source_build_phase.add_file_reference(file_ref, true)
end

abort_with('缺少 app.json，无法生成 iOS 小组件。') unless File.exist?(APP_JSON_PATH)
abort_with('还没有生成 ios 原生工程，请先执行 expo prebuild --platform ios。') unless Dir.exist?(IOS_DIR)

app_json = JSON.parse(File.read(APP_JSON_PATH))
expo = app_json.fetch('expo')
bundle_id = expo.dig('ios', 'bundleIdentifier')
scheme = expo['scheme']
app_name = expo['name'] || 'Super798'

abort_with('app.json 缺少 expo.ios.bundleIdentifier。') if bundle_id.to_s.empty?
abort_with('app.json 缺少 expo.scheme。') if scheme.to_s.empty?

project_path = Dir[File.join(IOS_DIR, '*.xcodeproj')].first
abort_with('未找到 iOS xcodeproj。') unless project_path

project = Xcodeproj::Project.open(project_path)
app_target = project.targets.find do |target|
  next false unless target.product_type == 'com.apple.product-type.application'

  target.build_configurations.any? do |config|
    config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] == bundle_id
  end
end
app_target ||= project.targets.find { |target| target.product_type == 'com.apple.product-type.application' }
abort_with('未找到 iOS 主应用 target。') unless app_target

app_folder_name = File.basename(project_path, '.xcodeproj')
widget_name = "#{app_name}Widget"
widget_bundle_id = "#{bundle_id}.widget"
app_group = "group.#{bundle_id}.shared"

bridge_dir = File.join(IOS_DIR, 'WidgetPreferencesBridge')
widget_dir = File.join(IOS_DIR, widget_name)

write_if_changed(
  File.join(bridge_dir, 'WidgetPreferencesBridge.swift'),
  render_template(
    File.join(TEMPLATES_DIR, 'WidgetPreferencesBridge.swift.tpl'),
    {
      'APP_GROUP' => app_group
    }
  )
)
write_if_changed(
  File.join(bridge_dir, 'WidgetPreferencesBridge.m'),
  File.read(File.join(TEMPLATES_DIR, 'WidgetPreferencesBridge.m'))
)
write_if_changed(
  File.join(widget_dir, "#{widget_name}.swift"),
  render_template(
    File.join(TEMPLATES_DIR, 'WidgetExtension.swift.tpl'),
    {
      'APP_GROUP' => app_group,
      'SCHEME' => scheme,
      'WIDGET_NAME' => widget_name
    }
  )
)
write_if_changed(File.join(widget_dir, 'Info.plist'), widget_info_plist)
write_if_changed(File.join(widget_dir, "#{widget_name}.entitlements"), plist_for_app_group(app_group))
write_if_changed(
  File.join(IOS_DIR, app_folder_name, "#{app_folder_name}.entitlements"),
  plist_for_app_group(app_group)
)

root_group = project.main_group
bridge_group = root_group.find_subpath('WidgetPreferencesBridge', true)
widget_group = root_group.find_subpath(widget_name, true)

bridge_swift_ref = ensure_file_reference(bridge_group, "WidgetPreferencesBridge/WidgetPreferencesBridge.swift")
bridge_objc_ref = ensure_file_reference(bridge_group, "WidgetPreferencesBridge/WidgetPreferencesBridge.m")
widget_swift_ref = ensure_file_reference(widget_group, "#{widget_name}/#{widget_name}.swift")
ensure_file_reference(widget_group, "#{widget_name}/Info.plist")
ensure_file_reference(widget_group, "#{widget_name}/#{widget_name}.entitlements")

ensure_source_membership(app_target, bridge_swift_ref)
ensure_source_membership(app_target, bridge_objc_ref)

widget_target = project.targets.find { |target| target.name == widget_name }
unless widget_target
  widget_target = project.new_target(:app_extension, widget_name, :ios, '16.0')
end

widget_target.build_configurations.each do |config|
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = widget_bundle_id
  config.build_settings['INFOPLIST_FILE'] = "#{widget_name}/Info.plist"
  config.build_settings['CODE_SIGN_ENTITLEMENTS'] = "#{widget_name}/#{widget_name}.entitlements"
  config.build_settings['SWIFT_VERSION'] = '5.0'
  config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'
  config.build_settings['APPLICATION_EXTENSION_API_ONLY'] = 'YES'
  config.build_settings['GENERATE_INFOPLIST_FILE'] = 'NO'
  config.build_settings['SKIP_INSTALL'] = 'YES'
  config.build_settings['TARGETED_DEVICE_FAMILY'] = '1,2'
  config.build_settings['LD_RUNPATH_SEARCH_PATHS'] = '$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks'
end

app_target.build_configurations.each do |config|
  config.build_settings['CODE_SIGN_ENTITLEMENTS'] = "#{app_folder_name}/#{app_folder_name}.entitlements"
  config.build_settings['SWIFT_VERSION'] = '5.0'
end

ensure_source_membership(widget_target, widget_swift_ref)

unless app_target.dependencies.any? { |dependency| dependency.target == widget_target }
  app_target.add_dependency(widget_target)
end

embed_phase = app_target.copy_files_build_phases.find { |phase| phase.name == 'Embed App Extensions' }
embed_phase ||= app_target.new_copy_files_build_phase('Embed App Extensions')
embed_phase.symbol_dst_subfolder_spec = :plugins

unless embed_phase.files_references.include?(widget_target.product_reference)
  build_file = embed_phase.add_file_reference(widget_target.product_reference, true)
  build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy', 'CodeSignOnCopy'] }
end

project.save

puts("iOS widget injected: #{widget_name} (#{widget_bundle_id})")
