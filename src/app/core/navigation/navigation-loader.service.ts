import { Injectable } from '@angular/core';
import { VexLayoutService } from '@vex/services/vex-layout.service';
import { NavigationItem } from './navigation-item.interface';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavigationLoaderService {
  private readonly _items: BehaviorSubject<NavigationItem[]> =
    new BehaviorSubject<NavigationItem[]>([]);

  get items$(): Observable<NavigationItem[]> {
    return this._items.asObservable();
  }

  constructor(private readonly layoutService: VexLayoutService) {
    this.loadNavigation();
  }

  loadNavigation(): void {
    this._items.next([
      {
        type: 'subheading',
        label: 'Dashboards',
        children: [
          {
            type: 'link',
            label: 'Analytics',
            route: '/',
            icon: 'mat:insights',
            routerLinkActiveOptions: { exact: true }
          }
        ]
      },
      {
        type: 'subheading',
        label: 'Apps',
        children: [
          {
            type: 'link',
            label: 'All-In-One Table',
            route: '/apps/aio-table',
            icon: 'mat:assignment'
          },
          {
            type: 'dropdown',
            label: 'Help Center',
            icon: 'mat:contact_support',
            children: [
              {
                type: 'link',
                label: 'Getting Started',
                route: '/apps/help-center/getting-started'
              },
              {
                type: 'link',
                label: 'Pricing & Plans',
                route: '/apps/help-center/pricing'
              },
              {
                type: 'link',
                label: 'FAQ',
                route: '/apps/help-center/faq'
              },
              {
                type: 'link',
                label: 'Guides',
                route: '/apps/help-center/guides'
              }
            ]
          },
          {
            type: 'link',
            label: 'Calendar',
            route: '/apps/calendar',
            icon: 'mat:date_range',
            badge: {
              value: '12',
              bgClass: 'bg-purple-600',
              textClass: 'text-white'
            }
          },
          {
            type: 'link',
            label: 'Chat',
            route: '/apps/chat',
            icon: 'mat:chat',
            badge: {
              value: '16',
              bgClass: 'bg-cyan-600',
              textClass: 'text-white'
            }
          },
          {
            type: 'link',
            label: 'Mailbox',
            route: '/apps/mail',
            icon: 'mat:mail'
          },
          {
            type: 'dropdown',
            label: 'Social',
            icon: 'mat:person_outline',
            children: [
              {
                type: 'link',
                label: 'Profile',
                route: '/apps/social',
                routerLinkActiveOptions: { exact: true }
              },
              {
                type: 'link',
                label: 'Timeline',
                route: '/apps/social/timeline'
              }
            ]
          },
          {
            type: 'link',
            label: 'WYSIWYG Editor',
            route: '/apps/editor',
            icon: 'mat:chrome_reader_mode'
          },
          {
            type: 'dropdown',
            label: 'Contacts',
            icon: 'mat:contacts',
            children: [
              {
                type: 'link',
                label: 'List - Grid',
                route: '/apps/contacts/grid'
              },
              {
                type: 'link',
                label: 'List - Table',
                route: '/apps/contacts/table'
              }
            ]
          },
          {
            type: 'link',
            label: 'Scrumboard',
            route: '/apps/scrumboard',
            icon: 'mat:assessment',
            badge: {
              value: 'NEW',
              bgClass: 'bg-primary-600',
              textClass: 'text-on-primary-600'
            }
          }
        ]
      },
      {
        type: 'subheading',
        label: 'Pages',
        children: [
          {
            type: 'dropdown',
            label: 'Authentication',
            icon: 'mat:lock',
            children: [
              {
                type: 'link',
                label: 'Login',
                route: '/login'
              },
              {
                type: 'link',
                label: 'Register',
                route: '/register'
              },
              {
                type: 'link',
                label: 'Forgot Password',
                route: '/forgot-password'
              }
            ]
          },
          {
            type: 'link',
            label: 'Coming Soon',
            icon: 'mat:watch_later',
            route: '/coming-soon'
          },
          {
            type: 'dropdown',
            label: 'Errors',
            icon: 'mat:error',
            badge: {
              value: '4',
              bgClass: 'bg-green-600',
              textClass: 'text-white'
            },
            children: [
              {
                type: 'link',
                label: '404',
                route: '/pages/error-404'
              },
              {
                type: 'link',
                label: '500',
                route: '/pages/error-500'
              }
            ]
          },
          {
            type: 'link',
            label: 'Pricing',
            icon: 'mat:attach_money',
            route: '/pages/pricing'
          },
          {
            type: 'link',
            label: 'Invoice',
            icon: 'mat:receipt',
            route: '/pages/invoice'
          },
          {
            type: 'link',
            label: 'FAQ',
            icon: 'mat:help',
            route: '/pages/faq'
          },
          {
            type: 'link',
            label: 'Guides',
            icon: 'mat:book',
            route: '/pages/guides',
            badge: {
              value: '18',
              bgClass: 'bg-teal-600',
              textClass: 'text-white'
            }
          }
        ]
      },
      {
        type: 'subheading',
        label: 'UI Elements',
        children: [
          {
            type: 'dropdown',
            label: 'Components',
            icon: 'mat:bubble_chart',
            children: [
              {
                type: 'link',
                label: 'Overview',
                route: '/ui/components/overview'
              },
              {
                type: 'link',
                label: 'Autocomplete',
                route: '/ui/components/autocomplete'
              },
              {
                type: 'link',
                label: 'Buttons',
                route: '/ui/components/buttons'
              },
              {
                type: 'link',
                label: 'Button Group',
                route: '/ui/components/button-group'
              },
              {
                type: 'link',
                label: 'Cards',
                route: '/ui/components/cards'
              },
              {
                type: 'link',
                label: 'Checkbox',
                route: '/ui/components/checkbox'
              },
              {
                type: 'link',
                label: 'Dialogs',
                route: '/ui/components/dialogs'
              },
              {
                type: 'link',
                label: 'Grid List',
                route: '/ui/components/grid-list'
              },
              {
                type: 'link',
                label: 'Input',
                route: '/ui/components/input'
              },
              {
                type: 'link',
                label: 'Lists',
                route: '/ui/components/lists'
              },
              {
                type: 'link',
                label: 'Menu',
                route: '/ui/components/menu'
              },
              {
                type: 'link',
                label: 'Progress',
                route: '/ui/components/progress'
              },
              {
                type: 'link',
                label: 'Progress Spinner',
                route: '/ui/components/progress-spinner'
              },
              {
                type: 'link',
                label: 'Radio',
                route: '/ui/components/radio'
              },
              {
                type: 'link',
                label: 'Slide Toggle',
                route: '/ui/components/slide-toggle'
              },
              {
                type: 'link',
                label: 'Slider',
                route: '/ui/components/slider'
              },
              {
                type: 'link',
                label: 'Snack Bar',
                route: '/ui/components/snack-bar'
              },
              {
                type: 'link',
                label: 'Tooltip',
                route: '/ui/components/tooltip'
              }
            ]
          },
          {
            type: 'dropdown',
            label: 'Forms',
            icon: 'mat:format_color_text',
            children: [
              {
                type: 'link',
                label: 'Form Elements',
                route: '/ui/forms/form-elements'
              },
              {
                type: 'link',
                label: 'Form Wizard',
                route: '/ui/forms/form-wizard'
              }
            ]
          },
          {
            type: 'dropdown',
            label: 'Icons',
            icon: 'mat:star',
            children: [
              {
                type: 'link',
                label: 'Material Icons',
                route: '/ui/icons/ic'
              },
              {
                type: 'link',
                label: 'FontAwesome Icons',
                route: '/ui/icons/fa'
              }
            ]
          },
          {
            type: 'dropdown',
            label: 'Page Layouts',
            icon: 'mat:view_compact',
            children: [
              {
                type: 'dropdown',
                label: 'Card',
                children: [
                  {
                    type: 'link',
                    label: 'Default',
                    route: '/ui/page-layouts/card',
                    routerLinkActiveOptions: { exact: true }
                  },
                  {
                    type: 'link',
                    label: 'Tabbed',
                    route: '/ui/page-layouts/card/tabbed'
                  },
                  {
                    type: 'link',
                    label: 'Large Header',
                    route: '/ui/page-layouts/card/large-header',
                    routerLinkActiveOptions: { exact: true }
                  },
                  {
                    type: 'link',
                    label: 'Tabbed & Large Header',
                    route: '/ui/page-layouts/card/large-header/tabbed'
                  }
                ]
              },
              {
                type: 'dropdown',
                label: 'Simple',
                children: [
                  {
                    type: 'link',
                    label: 'Default',
                    route: '/ui/page-layouts/simple',
                    routerLinkActiveOptions: { exact: true }
                  },
                  {
                    type: 'link',
                    label: 'Tabbed',
                    route: '/ui/page-layouts/simple/tabbed'
                  },
                  {
                    type: 'link',
                    label: 'Large Header',
                    route: '/ui/page-layouts/simple/large-header',
                    routerLinkActiveOptions: { exact: true }
                  },
                  {
                    type: 'link',
                    label: 'Tabbed & Large Header',
                    route: '/ui/page-layouts/simple/large-header/tabbed'
                  }
                ]
              },
              {
                type: 'link',
                label: 'Blank',
                icon: 'mat:picture_in_picture',
                route: '/ui/page-layouts/blank'
              }
            ]
          }
        ]
      },
      {
        type: 'subheading',
        label: 'Documentation',
        children: [
          {
            type: 'link',
            label: 'Changelog',
            route: '/documentation/changelog',
            icon: 'mat:update'
          },
          {
            type: 'dropdown',
            label: 'Getting Started',
            icon: 'mat:book',
            children: [
              {
                type: 'link',
                label: 'Introduction',
                route: '/documentation/introduction',
                fragment: 'introduction',
                routerLinkActiveOptions: { exact: true }
              },
              {
                type: 'link',
                label: 'Folder Structure',
                route: '/documentation/folder-structure',
                fragment: 'folder-structure',
                routerLinkActiveOptions: { exact: true }
              },
              {
                type: 'link',
                label: 'Installation',
                route: '/documentation/installation',
                fragment: 'installation',
                routerLinkActiveOptions: { exact: true }
              },
              {
                type: 'link',
                label: 'Development Server',
                route: '/documentation/start-development-server',
                fragment: 'start-development-server',
                routerLinkActiveOptions: { exact: true }
              },
              {
                type: 'link',
                label: 'Build for Production',
                route: '/documentation/build-for-production',
                fragment: 'build-for-production',
                routerLinkActiveOptions: { exact: true }
              }
            ]
          },
          {
            type: 'dropdown',
            label: 'Customization',
            icon: 'mat:book',
            children: [
              {
                type: 'link',
                label: 'Configuration',
                route: '/documentation/configuration',
                fragment: 'configuration',
                routerLinkActiveOptions: { exact: true }
              },
              {
                type: 'link',
                label: 'Changing Styling',
                route: '/documentation/changing-styling-and-css-variables',
                fragment: 'changing-styling-and-css-variables',
                routerLinkActiveOptions: { exact: true }
              },
              {
                type: 'link',
                label: 'Using Custom Colors',
                route:
                  '/documentation/using-custom-colors-for-the-primarysecondarywarn-palettes',
                fragment:
                  'using-custom-colors-for-the-primarysecondarywarn-palettes',
                routerLinkActiveOptions: { exact: true }
              },
              {
                type: 'link',
                label: 'Adding Menu Items',
                route: '/documentation/adding-menu-items',
                fragment: 'adding-menu-items',
                routerLinkActiveOptions: { exact: true }
              }
            ]
          },
          {
            type: 'link',
            label: 'Further Help',
            icon: 'mat:book',
            route: '/documentation/further-help',
            fragment: 'further-help',
            routerLinkActiveOptions: { exact: true }
          }
        ]
      },
      {
        type: 'subheading',
        label: 'Customize',
        children: []
      },
      {
        type: 'link',
        label: 'Configuration',
        route: () => this.layoutService.openConfigpanel(),
        icon: 'mat:settings'
      }
    ]);
  }
}
