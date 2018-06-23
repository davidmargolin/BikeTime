import React, { Component } from 'react';
import {StaticMap} from 'react-map-gl';
import DeckGL, {MapView, MapController} from 'deck.gl';
import TripsLayer from './trips-layer';
import SliderLib from 'rc-slider';
import 'rc-slider/assets/index.css';
import along from '@turf/along';
import length from '@turf/length';
import moment from 'moment'
const Slider = SliderLib.createSliderWithTooltip(SliderLib);
const MAPBOX_TOKEN = 'pk.eyJ1IjoidHJpY2tlZG91dGRhdmlkIiwiYSI6ImNqZ3F0ZXI2dDAwcG0yd3F0bGRqMHExZ2QifQ.YyJvoum5vu7FGydTYqlfUg'
function viewstate(bearing){
  return({
    longitude: -74,
    latitude: 40.72,
    zoom: 12,
    pitch: 45,
    bearing: bearing
  })
}
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewState: viewstate,
      time: 0,
      routes: [],
      nextroutes: [],
    };
    this.hour = 0
    this.updated=true
  }

  componentDidMount() {
    this.updatePoints(moment().format("HH"))
    this._animate();
  }

  componentWillUnmount() {
    if (this._animationFrame) {
      window.cancelAnimationFrame(this._animationFrame);
    }
  }

  _animate() {
    const timestamp = Date.now();
    const loopLength = 1800;
    const loopTime = 60000;
    const maxbearing = 90
    let time = ((timestamp % loopTime) / loopTime) * loopLength
    let bearing = ((timestamp % loopTime) / loopTime) * maxbearing
    if (bearing > 45){
      bearing = 45 - (bearing - 45)
    }
    if (time>1750 && !this.updated){
      this.updated = true
      this.updatePoints(moment({hour:this.hour}).format("HH"))
    }
    this.setState({
      time: time,
      viewState: viewstate(bearing)
    });

    this._animationFrame = window.requestAnimationFrame(this._animate.bind(this));
  }

  updatePoints=(hour)=>{
    this.hour = hour
    fetch('https://still-citadel-85681.herokuapp.com/time/2018-05-06 '+hour).then(result=> {return result.json()}).then(result=>{
      let trips = result.result.filter(item=> item['start station name']!==item['end station name'])
      for (let trip of trips){
          let geojson = {
            "type": "Feature",
            "geometry": trip.geometry
          }

          let lineDistance = length(geojson);
          let arc = []
          // going in 20 second intervals
          let time = (parseInt(moment(trip['starttime']).format("m"))*60)+parseInt(moment(trip['starttime']).format("s"))
          for (var i = 0; i < lineDistance; i += lineDistance / (trip['tripduration']/20)) {
            let segment = along(geojson, i);
            segment.geometry.coordinates.push(time)
            time = time+18
            arc.push(segment.geometry.coordinates);
          }
          trip['arc'] = arc
      }

      this.setState({routes: trips, time:0}, ()=>this.updated=false)
    })
  }

  render() {
     const {
       viewState = this.state.viewState,
     } = this.props;
     const layers = [
       new TripsLayer({
         id: 'trips',
         data: this.state.routes,
         getPath: d => d.arc,
         getColor: d => [0, 253, 93],
         opacity: 1,
         trailLength: 180,
         currentTime: this.state.time
       }),
     ];

     return (
       <div style={{display: 'flex', width: '100%'}}>
         <DeckGL
           layers={layers}
           views={new MapView({id: 'map'})}
           viewState={viewState}
           controller={MapController}
         >
           <StaticMap
             viewId="map"
             {...viewState}
             reuseMaps
             mapStyle={'mapbox://styles/mapbox/dark-v9'}
             preventStyleDiffing
             mapboxApiAccessToken={MAPBOX_TOKEN}
           />
         </DeckGL>
         <div style={{position: 'absolute', bottom: 0, right: 0, width: '100%', display: 'flex', justifyContent: 'flex-end', margin: 16}}>
           <div style={{backgroundColor: 'white', width: 400, padding: 20}}>
             Rides Starting At:

             <Slider
               style={{margin: 10}}
               max={23}
               onAfterChange={value=>this.updatePoints(moment({hour:value}).format("HH"))}
             />


           </div>
         </div>

       </div>
         );
 }
}


export default App;
