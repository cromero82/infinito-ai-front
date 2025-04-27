import { Component, OnInit  } from '@angular/core';
import { Chart,registerables } from 'node_modules/chart.js';
import { routes } from 'src/app/core/core.index';
Chart.register(...registerables)

@Component({
    selector: 'app-prime-ng',
    templateUrl: './prime-ng.component.html',
    styleUrls: ['./prime-ng.component.scss'],
    standalone: false
})
export class PrimeNgComponent implements OnInit{
  public routes = routes;

  ngOnInit(): void {
    this.RenderChart();
    this.transchart();
    this.gradchart();
    this.horizonchart();
    this.stackchart();
    this.doughcharts();
    this.verstack();
    this.piecharts();
    this.areacharts();
  }

  RenderChart() {
    new Chart("pieschart", {
      type: 'bar',
      data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
              label: 'Sales',
              data: [19, 3, 7, 5, 2, 3],
              backgroundColor: [
                ' #0dcaf0'
              ],
              borderWidth: 1
          }]
      },
      options: {
          scales: {
              y: {
                  beginAtZero: true
              }
          }
      }
  });
  }
  transchart() {
    new Chart("piechart", {
      type: 'bar',
      data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
              label: 'Sales',
              data: [12, 9, 3, 5, 2, 3],
              backgroundColor: [
                '#6610f2'
              ],
              borderWidth: 1
          }]
      },
      options: {
          scales: {
              y: {
                  beginAtZero: true
              }
          }
      }
  });
  }
  gradchart() {
    new Chart("piecharts", {
      type: 'bar',
      data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
              label: 'Sales',
              data: [12, 9, 3, 5, 2, 3],
              backgroundColor: [
                '#44c4fa'
              ],
          }]
      },
      options: {
          scales: {
              y: {
                  beginAtZero: true
              }
          }
      }
  });
  }
  
  horizonchart() {
    new Chart("horcharts", {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Sales',
            data: [12, 9, 3, 5, 2, 3],
            backgroundColor: [
              '#664dc9', '#44c4fa', '#38cb89', '#3e80eb', '#ffab00', '#ef4b4b'
            ],
            borderWidth: 1
        }]
    },
      options: {
        indexAxis: 'y',
        // Elements options apply to all of the options unless overridden in a dataset
        // In this case, we are setting the border of each horizontal bar to be 2px wide
        
      },
    });
  }
  stackchart() {
    new Chart("stackcharts", {
    type: 'bar',
    data: {
      labels: ['2022-05-10', '2022-05-11', '2022-05-12','2022-05-13',
               '2022-05-14', '2022-05-15', '2022-05-16','2022-05-17', ], 
       datasets: [
        {
          label: "Sales",
          data: ['467','576', '572', '79', '92',
               '574', '573', '576'],
          backgroundColor: '#664dc9'
        },
        {
          label: "Profit",
          data: ['542', '542', '536', '327', '17',
                 '0.00', '538', '541'],
          backgroundColor: '#3e80eb'
        }  
      ]
    },
    options: {
      indexAxis: 'y',
      elements: {
        bar: {
          borderWidth: 2,
        }
      },
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
        },
        title: {
          display: true,
          text: 'Chart.js Horizontal Bar Chart'
        }
      }
    },
  });
  }
  
  verstack() {
    new Chart("verstackcharts", {
      type: 'bar', //this denotes tha type of chart

      data: {// values on X-Axis
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun','Jul','Aug' ], 
         datasets: [
          {
            label: "Sales",
            data: ['467','576', '572', '79', '92',
                 '574', '573', '576'],
            backgroundColor: '#664dc9'
          },
          {
            label: "Profit",
            data: ['542', '542', '536', '327', '17',
                   '0.00', '538', '541'],
            backgroundColor: '#3e80eb'
          }  
        ]
      },
      options: {
        aspectRatio:2.5
      }
      
    });
  }

doughcharts() {
  new Chart("doughcharts", {
    type: 'doughnut',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
          data: [12, 9, 3, 5, 2, 3],
          backgroundColor: [
            '#664dc9', '#44c4fa', '#38cb89', '#3e80eb', '#ffab00', '#ef4b4b'
          ],
          borderWidth: 1
      }]
  },
  }); 
}
piecharts() {
  new Chart("peichrt", {
    type: 'pie',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
          data: [12, 9, 3, 5, 2, 3],
          backgroundColor: [
            '#664dc9', '#44c4fa', '#38cb89', '#3e80eb', '#ffab00', '#ef4b4b'
          ],
          borderWidth: 1
      }]
  },
  });
}
areacharts() {
  new Chart("MyChart", {
    type: 'line', //this denotes tha type of chart

    data: {// values on X-Axis
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun','Jul','Aug' ], 
       datasets: [
        {
          label: "Sales",
          data: ['467','576', '572', '79', '92',
               '574', '573', '576'],
          backgroundColor: 'blue'
        },
        {
          label: "Profit",
          data: ['542', '542', '536', '327', '17',
                 '0.00', '538', '541'],
          backgroundColor: 'limegreen'
        }  
      ]
    },
    options: {
      aspectRatio:2.5
    }
    
  });
}

}
