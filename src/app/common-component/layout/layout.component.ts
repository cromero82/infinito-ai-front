import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  SettingsService,
  SidebarService,
  routes,
} from 'src/app/core/core.index';

@Component({
    selector: 'app-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],
    standalone: false
})
export class LayoutComponent {
  public routes=routes;
  layoutMode = 'default';
  layoutWidth = 'fluid';
  cardStyle = '1';
  sidebarColor = 'light';
  dynamicSidebarColor = '';
  themeColor = 'light';
  sidebarSize = '1';
  isLoader = '1';
  primaryColor = 'primary';
  primaryColor1 = '1';
  topbarColor2 = '1';
  topbarColor3 = '1';
  topbarColor4='1';
  topbarColor = 'white';
  topbarImage = '1';
  sidebarImage = '';
  selectedColor = '84, 109, 254, 1';
  selectedColor1 = '84, 109, 254, 1'; // Default HEX color
  horizontalColor= '84, 109, 254, 1';
  dthemeColor= '84, 109, 254, 1';
  rgbaValues = '84, 109, 254, 1'; // Default RGBA values without "rgba()"
  rgbaValues1 = '84, 109, 254, 1';
  rgbaValues2 = '84, 109, 254, 1';
  rgbaValues3 = '84, 109, 254, 1';

  constructor(public settings: SettingsService,private sidebar: SidebarService) {

    this.settings.layoutMode.subscribe((res: string) => {
      this.layoutMode = res;

    });
    this.settings.layoutWidth.subscribe((res: string) => {
      this.layoutWidth = res;
    });
 
    this.settings.sidebarColor.subscribe((res: string) => {
      this.sidebarColor = res;
    });
    this.settings.themeColor.subscribe((res: string) => {
      this.themeColor = res;
    });

    this.settings.primaryColor.subscribe((res: string) => {
      this.primaryColor = res;
    });
    this.settings.topbarColor.subscribe((res: string) => {
      this.topbarColor = res;
    });
    this.settings.sidebarImage.subscribe((res: string) => {
      this.sidebarImage = res;
    });

    this.settings.sidebarColor2.subscribe((res: string) => {
      this.selectedColor = res;
    });
    this.settings.topbarColor2.subscribe((res: string) => {
      this.selectedColor1 = res;
    });
    this.settings.topbarColor4.subscribe((res: string) => {
      this.topbarColor4 = res;
    });
    this.settings.primaryColor1.subscribe((res: string) => {
      this.primaryColor1 = res;
    });





  }

  setColor(): void {
    this.settings.changeSidebarColor('all');
    // Convert HEX to RGBA values string without "rgba()"
    this.rgbaValues = this.hexToRgbaValues(this.selectedColor, 1); // Assuming alpha is 1
    this.settings.changeSidebarColor2(this.rgbaValues)

  }
  setColor1(): void {
    this.settings.changeTopbarColor('all');
    // Convert HEX to RGBA values string without "rgba()"
    this.rgbaValues1 = this.hexToRgbaValues(this.selectedColor1, 1); // Assuming alpha is 1
    this.settings.changeTopbarColor3(this.rgbaValues1)

  }
  sethorizontalColor(): void {
    this.settings.changeTopbarColor2('7');
    // Convert HEX to RGBA values string without "rgba()"
    this.rgbaValues2 = this.hexToRgbaValues(this.horizontalColor, 1); // Assuming alpha is 1
    this.settings.changeTopbarHorizontalColor(this.rgbaValues2)
  }

  setprimaryColor(): void {
    this.settings.changePrimaryColor('all');
    // Convert HEX to RGBA values string without "rgba()"
    this.rgbaValues3 = this.hexToRgbaValues(this.dthemeColor,1); // Assuming alpha is 1
    this.settings.changePrimaryColor1(this.rgbaValues3)
  }

  // Function to convert HEX to RGBA values string without "rgba()"
  hexToRgbaValues(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `${r}, ${g}, ${b}`;
  }

  ngOnInit(): void {
    // Check localStorage for the settings when the component initializes
    const layout = localStorage.getItem('layoutMode') || 'default';
    const layoutWidth = localStorage.getItem('layoutWidth') || 'fluid';
    const sidebarColor = localStorage.getItem('sidebarColor') || '1';
    const themeColor = localStorage.getItem('themeColor') || '1';
    const primaryColor = localStorage.getItem('primaryColor') || 'primary';
    const topbarColor = localStorage.getItem('topbarColor') || 'white';
    const topbarColor2 = localStorage.getItem('topbarColor2') || '1';
    const sidebarImage = localStorage.getItem('sidebarImage') || '';
    const dynamicColorSidebar = localStorage.getItem('sidebarColor2') || '1';
    this.rgbaValues = dynamicColorSidebar
    this.settings.changeLayoutMode(layout);
    this.settings.changeLayoutWidth(layoutWidth);
    this.settings.changeSidebarColor(sidebarColor);
    this.settings.changeThemeColor(themeColor);
    this.settings.changePrimaryColor(primaryColor);
    this.settings.changeTopbarColor2(topbarColor2);
    this.settings.changeTopbarColor(topbarColor);
    this.settings.changeSidebarImage(sidebarImage);
    this.settings.changeSidebarColor2(dynamicColorSidebar);
}

  public changeLayoutMode(layout: string): void {
    this.settings.layoutMode.next(layout);
    this.settings.changeLayoutMode(layout);
    localStorage.setItem('layoutMode', layout);
  }
  public changeLayoutWidth(width: string): void {
    this.settings.layoutWidth.next(width);
    this.settings.changeLayoutWidth(width);
    localStorage.setItem('layoutWidth', width);
  }

  public changeTopbarColor(topbar: string): void {
    this.settings.topbarColor.next(topbar);
    localStorage.setItem('topbarColor', topbar);
  }


  public changeSidebarColor(sidebarColor: string): void {
    this.settings.sidebarColor.next(sidebarColor);
    localStorage.setItem('sidebarColor', sidebarColor);
  }
  public toggleSidebar(): void {
    this.sidebar.sideBarPosition.next('true');
    this.sidebar.expandSideBar.next(false);
    localStorage.setItem('sideBarPosition', 'true');

  }
  public toggleSidebar2(): void {
    this.sidebar.sideBarPosition.next('false');
    this.sidebar.expandSideBar.next(true);
    localStorage.removeItem('sideBarPosition');
  }

  resetAllMode() {
    this.settings.changeLayoutMode('default');
    this.settings.changeLayoutWidth('fluid');
    this.settings.changeSidebarColor('light');
    this.settings.changeThemeColor('light');
    this.settings.changeTopbarColor('white');
    this.settings.changeTopbarColor2('1');
    this.settings.changePrimaryColor('primary');
    this.settings.changeSidebarImage('');
    this.rgbaValues = '84, 109, 254, 1'
  }
  
}
