import { Component } from '@angular/core';
import {
  MapComponent as MglMap,
  provideMapboxGL,
} from 'ngx-mapbox-gl';
import { HouseService } from '../../core/services/house.service';
import { House, HouseAvailability, Task, TaskTypeName } from '../../core/models/data.models';
import { DataService } from '../../core/services/data.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';
import type { Feature, FeatureCollection, Polygon, Point } from 'geojson';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { TaskService } from '../../core/services/task.service';
import { GeoJSONFeature, Popup } from 'mapbox-gl';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    MglMap,
    ButtonModule,
    CheckboxModule,
    FormsModule,
  ], 
  providers: [
    provideMapboxGL({
      accessToken: 'pk.eyJ1IjoibWFqa3BycGlrIiwiYSI6ImNsN3N0NzUxZTBlMWUzdnAxZW8xNmIyenQifQ.rtKZEmNA30wdEIRzWs7bIA',
    })
  ],
  template: `
    <div class="toggles">
      <div class="house-numbers-toggle">
        <p-checkbox
          inputId="showHouseNumbers"
          name="showHouseNumbers"
          [(ngModel)]="areHouseNumbersVisible"
          binary="true"
          (ngModelChange)="toggleHouseNumbers()"
        ></p-checkbox>
        <label for="showHouseNumbers">Show house numbers</label>
      </div>
      <div class="house-icons-toggle">
        <p-checkbox
          inputId="showHouseIcons"
          name="showHouseIcons"
          [(ngModel)]="areHouseIconsVisible"
          binary="true"
          (ngModelChange)="toggleHouseIcons()"
        ></p-checkbox>
        <label for="showHouseIcons">Show house icons</label>
      </div>
    </div>

    <mgl-map
      class="map-container"
      [style]="'mapbox://styles/majkprpik/cldvqs70j00dp01qqved11ubg'"
      [zoom]="[18.5]"
      [center]="[13.642502174002106, 45.09485140621687]"
      (mapLoad)="onMapLoad($event)"
    ></mgl-map>
  `,
  styles: `
    .toggles{
      position: absolute;
      bottom: 20px;
      left: 42%;
      z-index: 10;
      display: flex;
      gap: 10px;
      border-radius: 5px;
      padding: 5px 10px 5px 10px;
      background-color: var(--p-cyan-900);

      .house-numbers-toggle, .house-icons-toggle{
        display: flex;
        gap: 10px;
        box-sizing: border-box;
        color: white;
        user-select: none;
      }
    }

    .map-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
    }
  `
})
export class MapComponent {
  areHouseNumbersVisible: boolean = true;
  areHouseIconsVisible: boolean = true;

  houseAvailabilities: HouseAvailability[] = [];
  houses: House[] = [];
  house?: House;
  tasks: Task[] = [];

  isOccupied: boolean = false;
  isAvailable: boolean = false;
  isAvailableWithTasks: boolean = false;
  isAvailableWithArrival: boolean = false;

  private taskIconsGeoJson: any;
  private streetGeoJson?: GeoJSON.FeatureCollection
  private map?: mapboxgl.Map;


  constructor(
    private houseService: HouseService,
    private dataService: DataService,
    private taskService: TaskService,
  ) {
    combineLatest([
      this.dataService.houseAvailabilities$.pipe(nonNull()),
      this.dataService.houses$.pipe(nonNull()),
      this.dataService.tasks$.pipe(nonNull()),
    ]).subscribe(([ha, houses, tasks]) => {
      this.houseAvailabilities = ha;
      this.houses = houses;
      this.tasks = tasks;

      this.updateHouseColors();
    });
  }

  async onMapLoad(event: { target: mapboxgl.Map }) {
    this.map = event.target;

    this.initHouses();
    this.initTaskIcons();

    const layers = this.map.getStyle().layers!;
    const labelLayerId = layers.find(l => l.type === 'symbol' && l.layout && l.layout['text-field'])?.id;
    const buildingLayerId = layers.find(l => l.id === '3d-buildings')?.id;

    this.map.addLayer(
      {
        id: 'street-extrusion',
        type: 'fill-extrusion',
        source: 'street',
        paint: {
          'fill-extrusion-color': ['get', 'color'], 
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0.5,
          'fill-extrusion-opacity': 0.7,
        },
      },
      buildingLayerId ?? labelLayerId
    );

    if (!buildingLayerId) {
      this.map.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.7,
          },
        },
        labelLayerId
      );
    }

    this.map!.addSource('task-icons', { type: 'geojson', data: this.taskIconsGeoJson });

    this.map!.addLayer({
      id: 'task-icons-layer',
      type: 'symbol',
      source: 'task-icons',
      layout: {
        'icon-image': ['concat', ['get', 'icon']],
        'icon-size': 1.6,
        'icon-offset': [0, 0],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-rotate': ['get', 'rotation'],
        'icon-anchor': 'center',
      },
    });

    let rotation = 0;
    const spinSpeed = 4; // degrees per frame

    const animateSpinningIcons = () => {
      rotation = (rotation + spinSpeed) % 360;

      const updatedGeoJson = {
        ...this.taskIconsGeoJson,
        features: this.taskIconsGeoJson.features.map((f: any) => ({

          ...f,
          properties: {
            ...f.properties,
            rotation: this.taskService.isTaskInProgress(this.tasks.find(t => t.task_id == f.properties.task_id)) ? rotation : 0,
          },
        })),
      };

      const source = this.map!.getSource('task-icons') as mapboxgl.GeoJSONSource;
      if (source) source.setData(updatedGeoJson);

      requestAnimationFrame(animateSpinningIcons);
    };

    animateSpinningIcons();

    this.getStreetLabelFeatures();

    this.map.easeTo({
      pitch: 60, // tilt down 
      bearing: 40, // rotate left °
      duration: 1500, //animation in s
      easing: (t) => t, // linear easing (you can adjust)
    });

    this.map.on('click', 'task-icons-layer', (e) => {
      const feature = e.features?.[0] as GeoJSONFeature;
      if (!feature || !feature.properties) return;

      const task = this.tasks.find(t => t.task_id == feature.properties?.['task_id'])

      this.taskService.$taskModalData.next(task);
    });
  }


  getHouseCentroid(houseOrFeature: string | any): [number, number] | null {
    let feature: any;

    if (typeof houseOrFeature === 'string') {
      if (!this.streetGeoJson) return null;

      feature = this.streetGeoJson.features.find(
        (f: any) => f.properties?.house_name === houseOrFeature
      );

      if (!feature) return null;
    } else {
      feature = houseOrFeature;
    }
    
    if (!feature.geometry || feature.geometry.type !== 'Polygon') return null;

    const polygon = feature.geometry as Polygon;
    const coords = polygon.coordinates[0];
    if (!coords?.length) return null;

    let x = 0, y = 0;
    coords.forEach(([lon, lat]) => {
      x += lon;
      y += lat;
    });

    const len = coords.length;
    return [x / len, y / len];
  }

  getStreetLabelFeatures(){
    const streetLabelFeatures = this.streetGeoJson!.features
      .map((feature: any) => {
        const centroid = this.getHouseCentroid(feature);
        if (!centroid) return null;

        return {
          type: 'Feature' as const,
          properties: {
            name: feature.properties?.['house_name'] ?? '',
            icon: feature.properties?.['icon'] ?? 'home',
          },
          geometry: {
            type: 'Point' as const,
            coordinates: centroid,
          },
        } as Feature<Point, HouseLabelProps>;
      })
      .filter((f): f is Feature<Point, HouseLabelProps> => f !== null);

    const streetLabelGeoJson: FeatureCollection<Point> = {
      type: 'FeatureCollection',
      features: streetLabelFeatures,
    };

    this.map!.addSource('street-label', { type: 'geojson', data: streetLabelGeoJson });

    this.map!.addLayer({
      id: 'street-text-layer',
      type: 'symbol',
      source: 'street-label',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 14,
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Regular'],
        'text-anchor': 'center',
        'text-offset': [0, -1],
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': '#333333',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1,
        'text-halo-blur': 0.5,
      },
    });

    this.map!.setLayoutProperty(
      'street-text-layer',
      'visibility',
      this.areHouseNumbersVisible ? 'visible' : 'none'
    );
  }

  toggleHouseIcons() {
    if (this.map!.getLayer('task-icons-layer')) {
      this.map!.setLayoutProperty(
        'task-icons-layer',
        'visibility',
        this.areHouseIconsVisible ? 'visible' : 'none'
      );
    }
  }

  toggleHouseNumbers() {
    if (this.map!.getLayer('street-text-layer')) {
      this.map!.setLayoutProperty(
        'street-text-layer',
        'visibility',
        this.areHouseNumbersVisible ? 'visible' : 'none'
      );
    }
  }

  getHouseColor(house: House){
    this.isOccupied = this.houseService.isHouseOccupied(house.house_id);
    this.isAvailable = !this.houseService.isHouseOccupied(house.house_id) && !this.houseService.hasScheduledNotCompletedTasks(house.house_id);
    this.isAvailableWithTasks = !this.houseService.isHouseOccupied(house.house_id) && this.houseService.hasScheduledNotCompletedTasks(house.house_id);
    this.isAvailableWithArrival = !this.houseService.isHouseOccupied(house.house_id) && !!this.houseService.isHouseReservedToday(house.house_id);

    if(this.isOccupied) {
      return "#dc2626";
    } else if(this.isAvailableWithArrival){
      return "#f87171";
    } else if(this.isAvailableWithTasks) {
      return "#facc15";
    } else if(this.isAvailable) {
      return "#16a34a";
    }

    return '#aaa'
  }

  updateHouseColors() {
    if (!this.streetGeoJson) return
    this.streetGeoJson.features.forEach((f: any) => {
      const house = this.houses.find(h => h.house_name === f.properties.house_name);
      if (house) {
        f.properties.color = this.getHouseColor(house);
      }
    });

    const source = this.map?.getSource('street') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(this.streetGeoJson);
    }
  }

  updateTaskIcons() {
    this.initTaskIcons();
    const src = this.map!.getSource('task-icons') as mapboxgl.GeoJSONSource;
    if (src) src.setData(this.taskIconsGeoJson);
  }

  initTaskIcons() {
    const taskIconFeatures: any[] = [];

    this.houses.forEach((house) => {
      const tasks = this.houseService.getTasksForHouse(house.house_id);
      const centroid = this.getHouseCentroid(house.house_name);
      const visibleTasks = tasks.filter(task => !this.taskService.isTaskCompleted(task));

      if (!centroid) return;

      visibleTasks.forEach((task, index) => {
        const step = 0.00002;
        const offset = step * (index - (visibleTasks.length - 1) / 2);
        const taskIcon = this.getTaskMakiIcon(task.task_type_id);

        taskIconFeatures.push({
          type: 'Feature',
          properties: {
            icon: taskIcon,
            task_id: task.task_id,
            task_progress_type_id: task.task_progress_type_id,
            house_name: house.house_name,
          },
          geometry: {
            type: 'Point',
            coordinates: [centroid[0] + offset, centroid[1]],
          },
        });
      });
    });

    this.taskIconsGeoJson = {
      type: 'FeatureCollection',
      features: taskIconFeatures,
    };
  }

  getTaskMakiIcon(taskTypeId: number | undefined): string {
    switch (taskTypeId) {
      case this.taskService.getTaskTypeByName(TaskTypeName.HouseCleaning)?.task_type_id:
        return 'museum';
      case this.taskService.getTaskTypeByName(TaskTypeName.DeckCleaning)?.task_type_id:
        return 'beach';
      case this.taskService.getTaskTypeByName(TaskTypeName.SheetChange)?.task_type_id:
        return 'lodging';
      case this.taskService.getTaskTypeByName(TaskTypeName.TowelChange)?.task_type_id:
        return 'waterfall';
      case this.taskService.getTaskTypeByName(TaskTypeName.Repair)?.task_type_id:
        return 'hardware';
      default:
        return '';
    }
  }

  initHouses(){
    this.streetGeoJson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { height: 3, house_name: '157' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642816447403316,45.096970306169176],[13.642854888735885,45.09694317009087],[13.642934728411234,45.0969897884868],[13.642900229792234,45.09701762034753],[13.642816447403316,45.096970306169176]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '201' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642530053099865,45.09598624581454],[13.642530053099865,45.095955630221546],[13.642645377082534,45.09595702184055],[13.64264242004421,45.09598694162367],[13.642530053099865,45.09598624581454]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '201' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.64264043791243,45.095912269115246],[13.642606910299573,45.09584741907911],[13.642651921376936,45.09583494148491],[13.642686119551174,45.09590026489396],[13.64264043791243,45.095912269115246]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '202' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642546813639532,45.09609924181713],[13.64266693697497,45.096086333961566],[13.642674313049916,45.09611994224308],[13.642553613644246,45.09613366956352],[13.642546813639532,45.09609924181713]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '202' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642528858311497,45.096038773632955],[13.642528858311497,45.096008478798296],[13.64264419328891,45.09600942551923],[13.642642852189532,45.09603972034257],[13.642528858311497,45.096038773632955]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '203' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642671234003299,45.096299277434454],[13.642648563476715,45.096267270390854],[13.642745159633165,45.096235263329206],[13.642767830159775,45.09626796619642],[13.642671234003299,45.096299277434454]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '203' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.64259206223512,45.09618841265479],[13.642596245575183,45.09615622691676],[13.64271493332022,45.096162380535795],[13.642711420524337,45.09619503963168],[13.64259206223512,45.09618841265479]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '204' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642838359043955,45.09642977310546],[13.642814219162862,45.09639616501002],[13.642910778687387,45.09636492366076],[13.642935589125893,45.09639805841735],[13.642838359043955,45.09642977310546]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '204' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642776158953666,45.0963352006382],[13.642752019072573,45.09630159248711],[13.642849249154485,45.09627035108612],[13.642872718478218,45.09630348589757],[13.642776158953666,45.0963352006382]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '205' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642993914889805,45.09627615251317],[13.643091144955866,45.09624443773916],[13.6431206492644,45.09628656630594],[13.643023419181723,45.09631828105655],[13.642993914889805,45.09627615251317]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '206' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.64294171964316,45.09618070249339],[13.642912215334624,45.096139047198584],[13.643010786522279,45.096107805710446],[13.643040961374943,45.09614946102805],[13.64294171964316,45.09618070249339]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '301' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642525038555805,45.09498151453184],[13.642616179931565,45.094949264105495],[13.64263832344179,45.09497987417625],[13.642584668077042,45.09499982471596],[13.64255048108505,45.09501253637102],[13.642525038555805,45.09498151453184]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '401' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641378014273409,45.095776924450895],[13.641359238805151,45.09574331596038],[13.64146049220057,45.095716807850536],[13.641477926554055,45.09575041634581],[13.641378014273409,45.095776924450895]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '401' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641386231512678,45.09568776190181],[13.64138714150988,45.095608105376385],[13.641446291435177,45.095608105376385],[13.641446291435177,45.09568776190181],[13.641386231512678,45.09568776190181]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '402' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641465101287647,45.09601096144643],[13.641428631285896,45.09598452070865],[13.641504528281033,45.09593650987183],[13.64154001259263,45.09596364644093],[13.641465101287647,45.09601096144643]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '402' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641477674936048,45.095920815418594],[13.641442806214322,45.09585549202936],[13.641496877213168,45.095841445087544],[13.641530648556202,45.09590661468918],[13.641477674936048,45.095920815418594]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '403' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641539280508125,45.096239367531346],[13.641520505039917,45.096205759302165],[13.641621758435287,45.09617925141784],[13.641639192773429,45.09621285963012],[13.641539280508125,45.096239367531346]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '403' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641564520882383,45.09616283486704],[13.641529652160047,45.096097511759446],[13.641583723155406,45.096083464877225],[13.641617494500197,45.096148634197824],[13.641564520882383,45.09616283486704]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '404' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641639863357048,45.096386580706444],[13.641621087888842,45.0963529725639],[13.641722341284261,45.09632646474791],[13.641739775622403,45.09636007287353],[13.641639863357048,45.096386580706444]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '404' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641698631337777,45.096310048257855],[13.641663762615465,45.096244725318655],[13.641714724591855,45.09623052466982],[13.64175160495559,45.09629584762523],[13.641698631337777,45.096310048257855]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '405' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641574888783214,45.0955030081554],[13.64152250633711,45.09543103826716],[13.641574218226133,45.09541306948721],[13.641625850766653,45.09548549379298],[13.641574888783214,45.0955030081554]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '405' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641533918609886,45.09557371205856],[13.641543343464217,45.09553205978553],[13.641668699612845,45.09554720387001],[13.64165864131372,45.09558838623473],[13.641533918609886,45.09557371205856]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '406' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641633134705813,45.09582690437508],[13.641612745370907,45.09579093036895],[13.641713998751849,45.095764422280936],[13.641733673569219,45.095799767741674],[13.641633134705813,45.09582690437508]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '406' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641579622781995,45.095711684810475],[13.641580608452125,45.09566715281073],[13.641693961076395,45.0956685444293],[13.641691989736238,45.095712380619226],[13.641579622781995,45.095711684810475]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '407' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641692539140113,45.09603760156573],[13.64167214980284,45.096001627696445],[13.641773403183782,45.09597511970621],[13.641793077996876,45.096010465036095],[13.641692539140113,45.09603760156573]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '407' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641649169437255,45.09591931403399],[13.641650155112142,45.095874782193775],[13.641763507744782,45.09587617381423],[13.641761536394728,45.09592000984373],[13.641649169437255,45.09591931403399]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '408' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642044618974548,45.09607135391656],[13.642024229639615,45.09603538006444],[13.642125483020532,45.09600887208986],[13.6421451578379,45.09604421739931],[13.642044618974548,45.09607135391656]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '408' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642004147023966,45.09596738567869],[13.64200513269407,45.09592285387835],[13.642118485318365,45.09592424549069],[13.642116513978182,45.095968081484315],[13.642004147023966,45.09596738567869]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '409' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641892320741984,45.096258206035856],[13.641873545289071,45.096224597817745],[13.641974798669173,45.09619808994214],[13.641992233007315,45.096231698143335],[13.641892320741984,45.096258206035856]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '409' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641836700787616,45.09616195171649],[13.641841629163071,45.09612437813827],[13.641958924495796,45.09613133621016],[13.641954981795713,45.09616821397709],[13.641836700787616,45.09616195171649]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '410' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641920861628625,45.096315965471675],[13.642004680670585,45.09627383692598],[13.642034855522002,45.09630129148249],[13.64195237759479,45.096345313427854],[13.641920861628625,45.096315965471675]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '410' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642074616916975,45.09639130247431],[13.642039748188735,45.0963259796191],[13.642093819186435,45.09631193280085],[13.642127590536951,45.096377101857406],[13.642074616916975,45.09639130247431]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '411' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.64163071691313,45.09530559012205],[13.641611989086936,45.09527984487937],[13.641690843092206,45.09524992471807],[13.64170957091845,45.09527497415663],[13.64163071691313,45.09530559012205]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '411' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641663244190395,45.09524018326677],[13.64162381718762,45.0951886927112],[13.641662258515254,45.095174776336755],[13.641701685518054,45.095224875268585],[13.641663244190395,45.09524018326677]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '412' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.64166222672533,45.095441274160564],[13.641662566418416,45.09541174004619],[13.641775919074696,45.09541174004619],[13.641775550060329,45.095441274160564],[13.64166222672533,45.095441274160564]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '412' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641649501987477,45.095366888569544],[13.641650172550385,45.095337066741905],[13.641763495885437,45.095337066741905],[13.641763495885437,45.095366888569544],[13.641649501987477,45.095366888569544]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '413' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641808669482527,45.095661301333905],[13.641794282929586,45.095623495481455],[13.641907296240044,45.09559894809296],[13.641923007782678,45.09563764368597],[13.641808669482527,45.095661301333905]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '413' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641807683794791,45.09553118417654],[13.64184711080497,45.0954970892525],[13.641927936145308,45.09554022976118],[13.641889494817752,45.09557502047077],[13.641807683794791,45.09553118417654]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '414' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641886690099623,45.095856565676506],[13.641866300764717,45.095820591689126],[13.641967554145634,45.09579408361483],[13.641987228963004,45.0958294290572],[13.641886690099623,45.095856565676506]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '414' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641849115947833,45.09574236896386],[13.641850101617937,45.09569783698805],[13.641963454242232,45.095699228605866],[13.64196148290205,45.09574306477226],[13.641849115947833,45.09574236896386]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '415' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641753895587204,45.09519724039018],[13.641779131802188,45.095175020513786],[13.641848198674081,45.095210996141745],[13.641824058792963,45.09523419095076],[13.641753895587204,45.09519724039018]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '415' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641856763173791,45.09514735042279],[13.641895655219152,45.09513267613548],[13.641935217787498,45.09518379944632],[13.641895655209636,45.09519894707902],[13.641856763173791,45.09514735042279]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '416' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641901366796402,45.09537012620398],[13.64197982141003,45.0953403043806],[13.641998596878315,45.09536539258949],[13.641920812806653,45.0953956877545],[13.641901366796402,45.09537012620398]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '416' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641884602957633,45.09528160741972],[13.641908742838778,45.09525888599666],[13.641977809726015,45.09529486158261],[13.641954340402256,45.09531805635753],[13.641884602957633,45.09528160741972]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '417' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642015332551514,45.09555373444068],[13.64200051236676,45.09552455665351],[13.642101765753758,45.09549804844487],[13.642117256498596,45.09552675287914],[13.642015332551514,45.09555373444068]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '417' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641984333255872,45.09545570216],[13.641984333255872,45.09542635374661],[13.642097656591865,45.09542635374661],[13.642097656591865,45.09545570216],[13.641984333255872,45.09545570216]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '418' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642063985508385,45.09576714839532],[13.642055292178348,45.0957211221563],[13.642188589910369,45.09570578006834],[13.642197283240355,45.095751806319754],[13.642063985508385,45.09576714839532]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '514' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642329750623006,45.09483915904561],[13.642329750623006,45.09476720727183],[13.64237803037018,45.09476720727183],[13.64237803037018,45.09483915904561],[13.642329750623006,45.09483915904561]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '515' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.6421474037271,45.09492201653213],[13.6421474037271,45.09485006486274],[13.642195683474224,45.09485006486274],[13.642195683474224,45.09492201653213],[13.6421474037271,45.09492201653213]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '516' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.64187628340852,45.09502161596103],[13.64187628340852,45.094986318076934],[13.641990012834018,45.094986318076934],[13.641990012834018,45.09502161596103],[13.64187628340852,45.09502161596103]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '517' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642382660361235,45.09505694466877],[13.642358520480117,45.09502712268183],[13.642447110868206,45.09499451210319],[13.642470199998227,45.09502371698685],[13.642382660361235,45.09505694466877]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '518' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.64217449355378,45.09503439398706],[13.642264347563165,45.09500078506651],[13.642285805225042,45.09503060706057],[13.642198633429556,45.095064215963575],[13.64217449355378,45.09503439398706]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '519' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642093353621803,45.09515435877409],[13.642183878177683,45.09511980320347],[13.64220399475901,45.0951515185969],[13.642116152405933,45.095184180697956],[13.642093353621803,45.09515435877409]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '520' }, 
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642288511144939,45.095198172864556],[13.642339493302075,45.09518017792086],[13.642390475459237,45.095252849763426],[13.642340473735535,45.095270152574734],[13.642288511144939,45.095198172864556]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '521' }, 
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642332780145486,45.09538274216956],[13.642210739635399,45.0953694880306],[13.642220797919153,45.09532972559551],[13.642342938403361,45.09534323882737],[13.642332780145486,45.09538274216956]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '522' }, 
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642607461437514,45.09518300775712],[13.642643737197828,45.095263984943095],[13.64258098993677,45.09527644296151],[13.642545694602434,45.095195465793225],[13.642607461437514,45.09518300775712]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '523' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.64263198116892,45.09535775896923],[13.642722505707779,45.095325096996795],[13.642742622290784,45.095353972074676],[13.642655450492677,45.09538663406308],[13.64263198116892,45.09535775896923]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '523' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.64263198116892,45.09535775896923],[13.642722505707779,45.095325096996795],[13.642742622290784,45.095353972074676],[13.642655450492677,45.09538663406308],[13.64263198116892,45.09535775896923]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '630' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.643255142213299,45.0947060461155],[13.643248436705663,45.094668176688494],[13.643371818314266,45.09465539575444],[13.643377182720384,45.09469326518132],[13.643255142213299,45.0947060461155]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '631' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.643197417156323,45.09483207044426],[13.643251473151983,45.09482834361662],[13.643261399802501,45.09490516495349],[13.643205302556973,45.094908610920626],[13.643197417156323,45.09483207044426]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '632' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.643309225370361,45.095144105878326],[13.643358509123589,45.09511905638236],[13.643429477728231,45.09518098428276],[13.643382165325084,45.095207425388274],[13.643309225370361,45.095144105878326]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '638' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.643666064262785,45.09495852444834],[13.643658688191403,45.094923022016],[13.643780058157233,45.094910241137185],[13.64378609313089,45.09494479684292],[13.643666064262785,45.09495852444834]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '641' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.643431065137195,45.09487601186926],[13.643424359605184,45.094839089285976],[13.643547070675254,45.09482725512137],[13.643553776207266,45.094862757616404],[13.643431065137195,45.09487601186926]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '642' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.643429376453314,45.09503728532633],[13.643451061304757,45.09500110265003],[13.64356737096257,45.0950324145829],[13.643545686111153,45.0950685972393],[13.643429376453314,45.09503728532633]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '643' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.643632792045722,45.094757317219596],[13.643625415975128,45.09471992119306],[13.643749380207227,45.094707486896795],[13.643756279922737,45.094744365586315],[13.643632792045722,45.094757317219596]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '644' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.64397519792814,45.09458564866113],[13.643902199023108,45.09463902841527],[13.64386464809672,45.09461299315775],[13.643939079396892,45.09456186934456],[13.64397519792814,45.09458564866113]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '645' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.644227566271082,45.09451715511468],[13.644236950233964,45.09443674891674],[13.644291935518849,45.09443864239636],[13.644282547787139,45.09451958858732],[13.644227566271082,45.09451715511468]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '646' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.644105166285774,45.0946073846533],[13.644097119658735,45.09456904179398],[13.644159614083074,45.09456286827684],[13.64422050126319,45.094556734207636],[13.64422720679085,45.09459413034169],[13.644105166285774,45.0946073846533]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '647' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.644063372519645,45.094697171811674],[13.644055487104056,45.09465890143926],[13.644178696502365,45.09464637658627],[13.644184610552733,45.09468395113698],[13.644063372519645,45.094697171811674]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '648' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.644060112780322,45.094781373583395],[13.644052736711481,45.09474445094291],[13.644174777210553,45.09473261676034],[13.64418148273521,45.09476811931242],[13.644060112780322,45.094781373583395]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '649' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.64406312257242,45.09486547799103],[13.644055075945381,45.0948299755048],[13.644176445908412,45.094818141334244],[13.644183709955062,45.094852066801614],[13.64406312257242,45.09486547799103]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3, house_name: '650' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.644067460022216,45.0949479833164],[13.644059869416363,45.0949130642549],[13.644180568821957,45.09490075674063],[13.644186603790983,45.094934365713954],[13.644086906055339,45.094945616493405],[13.644067460022216,45.0949479833164]]],
          },
        },
      ],
    };

    this.streetGeoJson!.features.forEach((f: any) => {
      const house = this.houses.find(house => house.house_name == f.properties.house_name);

      if(house) {
        f.properties.color = this.getHouseColor(house);
      }
    });

    this.map!.addSource('street', { type: 'geojson', data: this.streetGeoJson });
  }
}

export interface HouseLabelProps {
  name: string;
  icon: string;
}