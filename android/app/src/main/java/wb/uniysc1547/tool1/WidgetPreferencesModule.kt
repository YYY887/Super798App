package wb.uniysc1547.tool1

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

private const val WIDGET_PREFS_NAME = "super798_widget_prefs"
private const val WIDGET_DEVICE_ID_KEY = "widget_device_id"
private const val WIDGET_DEVICE_NAME_KEY = "widget_device_name"

class WidgetPreferencesModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "WidgetPreferences"

  @ReactMethod
  fun setWidgetDevice(deviceId: String, deviceName: String, promise: Promise) {
    val prefs = reactContext.getSharedPreferences(WIDGET_PREFS_NAME, Context.MODE_PRIVATE)
    prefs.edit()
      .putString(WIDGET_DEVICE_ID_KEY, deviceId)
      .putString(WIDGET_DEVICE_NAME_KEY, deviceName)
      .apply()

    DrinkWidgetProvider.updateAll(reactContext)
    promise.resolve(null)
  }

  @ReactMethod
  fun getWidgetDevice(promise: Promise) {
    val prefs = reactContext.getSharedPreferences(WIDGET_PREFS_NAME, Context.MODE_PRIVATE)
    val map = Arguments.createMap().apply {
      putString("deviceId", prefs.getString(WIDGET_DEVICE_ID_KEY, "") ?: "")
      putString("deviceName", prefs.getString(WIDGET_DEVICE_NAME_KEY, "") ?: "")
    }
    promise.resolve(map)
  }

  @ReactMethod
  fun refreshWidget(promise: Promise) {
    DrinkWidgetProvider.updateAll(reactContext)
    promise.resolve(null)
  }
}

class DrinkWidgetProvider : android.appwidget.AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    appWidgetIds.forEach { widgetId ->
      appWidgetManager.updateAppWidget(widgetId, buildRemoteViews(context))
    }
  }

  companion object {
    fun updateAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val component = ComponentName(context, DrinkWidgetProvider::class.java)
      val widgetIds = manager.getAppWidgetIds(component)
      if (widgetIds.isEmpty()) {
        return
      }

      val views = buildRemoteViews(context)
      widgetIds.forEach { widgetId ->
        manager.updateAppWidget(widgetId, views)
      }
    }

    private fun buildRemoteViews(context: Context): android.widget.RemoteViews {
      val prefs = context.getSharedPreferences(WIDGET_PREFS_NAME, Context.MODE_PRIVATE)
      val deviceName = prefs.getString(WIDGET_DEVICE_NAME_KEY, "")?.trim().orEmpty()
      val resolvedName = deviceName.ifEmpty { "先在设置里选设备" }

      return android.widget.RemoteViews(context.packageName, R.layout.drink_widget).apply {
        setTextViewText(R.id.widget_device_name, resolvedName)
        setOnClickPendingIntent(
          R.id.widget_scan_button,
          buildLaunchPendingIntent(context, "super798://widget/scan", 1001)
        )
        setOnClickPendingIntent(
          R.id.widget_drink_button,
          buildLaunchPendingIntent(context, "super798://widget/drink", 1002)
        )
      }
    }

    private fun buildLaunchPendingIntent(
      context: Context,
      uri: String,
      requestCode: Int
    ): PendingIntent {
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri), context, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
      }

      return PendingIntent.getActivity(
        context,
        requestCode,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
    }
  }
}
