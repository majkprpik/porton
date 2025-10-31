import { Component } from '@angular/core';
import {
  MapComponent as MglMap,
  provideMapboxGL,
} from 'ngx-mapbox-gl';
import { HouseService } from '../../core/services/house.service';
import { House, HouseAvailability } from '../../core/models/data.models';
import { DataService } from '../../core/services/data.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    MglMap,
  ], 
  providers: [
    provideMapboxGL({
      accessToken: 'pk.eyJ1IjoibWFqa3BycGlrIiwiYSI6ImNsN3N0NzUxZTBlMWUzdnAxZW8xNmIyenQifQ.rtKZEmNA30wdEIRzWs7bIA',
    })
  ],
  template: `
    <mgl-map
      class="map-container"
      [style]="'mapbox://styles/majkprpik/cldvqs70j00dp01qqved11ubg'"
      [zoom]="[19]"
      [center]="[13.642502174002106, 45.09485140621687]"
      (mapLoad)="onMapLoad($event)"
    ></mgl-map>
  `,
  styles: `
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
  houseAvailabilities: HouseAvailability[] = [];
  house?: House;

  houseColor: any;

  isOccupied: boolean = false;
  isAvailable: boolean = false;
  isAvailableWithTasks: boolean = false;
  isAvailableWithArrival: boolean = false;

  private map?: mapboxgl.Map;


  constructor(
    private houseService: HouseService,
    private dataService: DataService,
  ) {
    this.dataService.houseAvailabilities$
      .pipe(nonNull())
      .subscribe(ha => {
        this.houseAvailabilities = ha;
        
        if(this.house){
          // this.getHouseColor(this.house);
        }
      });

    this.dataService.houses$
      .pipe(nonNull())
      .subscribe(houses => {
        this.house = houses.find(h => h.house_name == "301");

        if(this.house) { 
          // this.getHouseColor(this.house);
        }
      });
  }

  onMapLoad(event: { target: mapboxgl.Map }) {
    this.map = event.target;
    const map = this.map;
    const streetGeoJson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      
      features: [
        {
          type: 'Feature', //301
          properties: { height: 3 },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642525038555805,45.09498151453184],[13.642616179931565,45.094949264105495],[13.64263832344179,45.09497987417625],[13.642584668077042,45.09499982471596],[13.64255048108505,45.09501253637102],[13.642525038555805,45.09498151453184]]],
          },
        },
        {
          type: 'Feature', //405
          properties: { height: 3 },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641574888783214,45.0955030081554],[13.64152250633711,45.09543103826716],[13.641574218226133,45.09541306948721],[13.641625850766653,45.09548549379298],[13.641574888783214,45.0955030081554]]],
          },
        },
        {
          type: 'Feature', //405
          properties: { height: 3 },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.641533918609886,45.09557371205856],[13.641543343464217,45.09553205978553],[13.641668699612845,45.09554720387001],[13.64165864131372,45.09558838623473],[13.641533918609886,45.09557371205856]]],
          },
        },
        {
          type: 'Feature', //514
          properties: { height: 3 },
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642329750623006,45.09483915904561],[13.642329750623006,45.09476720727183],[13.64237803037018,45.09476720727183],[13.64237803037018,45.09483915904561],[13.642329750623006,45.09483915904561]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3 }, //515
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.6421474037271,45.09492201653213],[13.6421474037271,45.09485006486274],[13.642195683474224,45.09485006486274],[13.642195683474224,45.09492201653213],[13.6421474037271,45.09492201653213]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3 }, //516
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.64187628340852,45.09502161596103],[13.64187628340852,45.094986318076934],[13.641990012834018,45.094986318076934],[13.641990012834018,45.09502161596103],[13.64187628340852,45.09502161596103]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3 }, //517
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642382660361235,45.09505694466877],[13.642358520480117,45.09502712268183],[13.642447110868206,45.09499451210319],[13.642470199998227,45.09502371698685],[13.642382660361235,45.09505694466877]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3 }, //518
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.64217449355378,45.09503439398706],[13.642264347563165,45.09500078506651],[13.642285805225042,45.09503060706057],[13.642198633429556,45.095064215963575],[13.64217449355378,45.09503439398706]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3 }, //519
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642093353621803,45.09515435877409],[13.642183878177683,45.09511980320347],[13.64220399475901,45.0951515185969],[13.642116152405933,45.095184180697956],[13.642093353621803,45.09515435877409]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3 }, //520
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642288511144939,45.095198172864556],[13.642339493302075,45.09518017792086],[13.642390475459237,45.095252849763426],[13.642340473735535,45.095270152574734],[13.642288511144939,45.095198172864556]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3 }, //521
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642332780145486,45.09538274216956],[13.642210739635399,45.0953694880306],[13.642220797919153,45.09532972559551],[13.642342938403361,45.09534323882737],[13.642332780145486,45.09538274216956]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3 }, //522
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.642607461437514,45.09518300775712],[13.642643737197828,45.095263984943095],[13.64258098993677,45.09527644296151],[13.642545694602434,45.095195465793225],[13.642607461437514,45.09518300775712]]],
          },
        },
        {
          type: 'Feature',
          properties: { height: 3 }, //523
          geometry: {
            type: 'Polygon',
            coordinates: [[[13.64263198116892,45.09535775896923],[13.642722505707779,45.095325096996795],[13.642742622290784,45.095353972074676],[13.642655450492677,45.09538663406308],[13.64263198116892,45.09535775896923]]],
          },
        },
      ],
    };

    map.addSource('street', { type: 'geojson', data: streetGeoJson });

    const layers = map.getStyle().layers!;
    const labelLayerId = layers.find(l => l.type === 'symbol' && l.layout && l.layout['text-field'])?.id;
    const buildingLayerId = layers.find(l => l.id === '3d-buildings')?.id;

    map.addLayer(
      {
        id: 'street-extrusion',
        type: 'fill-extrusion',
        source: 'street',
        paint: {
          'fill-extrusion-color': 'red', 
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 1,
          'fill-extrusion-opacity': 0.7,
        },
      },
      buildingLayerId ?? labelLayerId
    );

    const streetLabelGeoJson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        // {
        //   type: 'Feature',
        //   properties: { name: '514' },
        //   geometry: {
        //     type: 'Point',
        //     coordinates: [13.64225, 45.09475],
        //   },
        // },
        // {
        //   type: 'Feature',
        //   properties: { name: '515' },
        //   geometry: {
        //     type: 'Point',
        //     coordinates: [13.64205, 45.09495],
        //   },
        // },
        // {
        //   type: 'Feature',
        //   properties: { name: '516' },
        //   geometry: {
        //     type: 'Point',
        //     coordinates: [13.64198, 45.09511],
        //   },
        // },
      ],
    };

    map.addSource('street-label', { type: 'geojson', data: streetLabelGeoJson });

    map.addLayer({
      id: 'street-label-layer',
      type: 'symbol',
      source: 'street-label',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 20,
        'text-offset': [0, 0], 
        'text-anchor': 'bottom',
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1.2,
      },
    });

    if (!buildingLayerId) {
      map.addLayer(
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
            'fill-extrusion-opacity': 0.6,
          },
        },
        labelLayerId
      );
    }

    map.easeTo({
      pitch: 60,          // tilt down 60°
      bearing: 30,       // rotate left 30°
      duration: 1500,     // 2.5 second animation
      easing: (t) => t,   // linear easing (you can adjust)
    });
  }

  getHouseColor(house: House){
    this.isOccupied = this.houseService.isHouseOccupied(house.house_id);
    this.isAvailable = !this.houseService.isHouseOccupied(house.house_id) && !this.houseService.hasScheduledNotCompletedTasks(house.house_id);
    this.isAvailableWithTasks = !this.houseService.isHouseOccupied(house.house_id) && this.houseService.hasScheduledNotCompletedTasks(house.house_id);
    this.isAvailableWithArrival = !this.houseService.isHouseOccupied(house.house_id) && !!this.houseService.isHouseReservedToday(house.house_id);

    if(this.isOccupied) {
      this.houseColor = "#dc2626";
    } else if(this.isAvailableWithArrival){
      this.houseColor = "#f87171";
    } else if(this.isAvailableWithTasks) {
      this.houseColor = "#facc15";
    } else if(this.isAvailable) {
      this.houseColor = "#16a34a";
    }

    if (this.map && this.map.getLayer('street-extrusion')) {
      this.map.setPaintProperty('street-extrusion', 'fill-extrusion-color', this.houseColor);
    }

  }
}