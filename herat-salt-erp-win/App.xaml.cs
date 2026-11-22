using System;
using System.Windows;

namespace HeratSaltErp;

public partial class App : Application
{
    public static void ApplyTheme(bool isDark)
    {
        if (Current is null) return;
        var dicts = Current.Resources.MergedDictionaries;
        var themeUri = new Uri(isDark ? "Themes/DarkTheme.xaml" : "Themes/LightTheme.xaml", UriKind.Relative);
        if (dicts.Count > 0)
        {
            dicts[0] = new ResourceDictionary { Source = themeUri };
        }
    }
}
