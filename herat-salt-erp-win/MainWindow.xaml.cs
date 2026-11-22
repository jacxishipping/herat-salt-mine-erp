using System.Windows;
using HeratSaltErp.ViewModels;

namespace HeratSaltErp;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        DataContext = new MainViewModel();
    }
}
