const appJson = require('./app.json');

const config = appJson.expo;
const disableWidgets = process.env.DISABLE_EXPO_WIDGETS === '1';

/*
 * 2026-03-26:
 * GitHub Actions 里的无签名 IPA 构建只需要主应用本体。
 * expo-widgets 在当前 SDK / Pod 组合下会改写 Podfile 并导致 prebuild 后 pod install 失败，
 * 所以这里允许通过环境变量临时关掉 widgets 插件，避免影响本地开发配置。
 */
module.exports = () => {
  if (!disableWidgets) {
    return config;
  }

  return {
    ...config,
    plugins: (config.plugins || []).filter((plugin) => {
      if (typeof plugin === 'string') {
        return plugin !== 'expo-widgets';
      }

      return Array.isArray(plugin) ? plugin[0] !== 'expo-widgets' : true;
    }),
  };
};
