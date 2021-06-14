import SC from 'https://sortacanvas.sortagames.repl.co/lib2.js';
import { Vector2 } from 'https://threejs.org/build/three.module.js'
let SortaCanvas = new SC();

let canv = document.querySelector('#canvas');

SortaCanvas.init(canv, false);

let sats = [];
let satLabels = [];
let satNets = [];
let satCount = 0;
let earth, moon;
let infoBox, infoText;
window.hideWeak = false;

// DRAG CODE
let lastPos = undefined;
let dragging = false;
let draggingObj = undefined;



SortaCanvas.addEventListener('mousedownhit', (d) => {
  if (dragging === false) {
    if (d.object.name === 'SATELLITE') {
      if (d.object.orbitEarth === true) {
        exitEarth(d.object);
      }
      if (d.object.orbitMoon === true) {
        exitMoon(d.object)
      }
      dragging = true;
      draggingObj = d.object;
    }
  }
});

const dragMouseUp = (d) => {
  if (dragging == true) {
    if (SortaCanvas.collision(draggingObj, earth)) {
      orbitEarth(draggingObj);
    }
    if (SortaCanvas.collision(draggingObj, moon)) {
      orbitMoon(draggingObj)
    }
    dragging = false;
    draggingObj = undefined;
    lastPos = undefined;
  }
};

const orbitEarth = (obj) => {
  obj.orbitEarth = true;
  obj.orbitMoon = false;
  obj.orbitTime = 0;
}
const exitEarth = (obj) => {
  obj.orbitEarth = false;
}
const orbitMoon = (obj) => {
  obj.orbitEarth = false;
  obj.orbitMoon = true;
  obj.orbitTime = 0;
}
const exitMoon = (obj) => {
  obj.orbitMoon = false;
}

SortaCanvas.addEventListener('mouseup', dragMouseUp);
SortaCanvas.addEventListener('mouseuphit', dragMouseUp);

SortaCanvas.addEventListener('contextmenuhit', (d) => { // right click delete satellite
  if (d.object.name === 'SATELLITE') { // is a satellite
    // stop event
    d.event.stopPropagation();
    d.event.preventDefault();
    removeSatelliteNet(d.object); // remove connection
    SortaCanvas.remove(d.object); // remove from display
    let idx = sats.indexOf(d.object); // index
    SortaCanvas.remove(satLabels[idx]); // remove display
    sats.splice(idx, 1); // delete sat reference
    satLabels.splice(idx, 1); // delete label
  }

})
const dragMouseMove = (d) => {
  if (dragging == true) {
    if (lastPos == undefined) lastPos = d.pos;
    let diffX = d.pos.x - lastPos.x;
    let diffY = d.pos.y - lastPos.y;
    draggingObj.x += diffX;
    draggingObj.y += diffY;
    lastPos = d.pos;
  } else {

  }
  if (d.object && d.object.name == 'SATELLITE') {
    moveInfo(d.pos.x, d.pos.y);
    infoText.text = `
    Sat #${d.object.satNo} | Power: ${d.object.dist}`;
  } else {
    moveInfo(-1000, -1000); // out of canvas
  }
};

SortaCanvas.addEventListener('mousemove', dragMouseMove);
SortaCanvas.addEventListener('mousemovehit', dragMouseMove);

// DRAG CODE END

// Make globe
earth = new SortaCanvas.Image(canv.width / 2 - 50, canv.height / 2 - 50, 100, 100, 'globe.png', 'EARTH');
earth.dist = 70;

SortaCanvas.add(earth);
satLabels.push('EARTH')
sats.push(earth);

// Make moon
moon = new SortaCanvas.Image(0, 0, 25, 25, 'moon.png', 'MOON');
SortaCanvas.add(moon);


// Infobox
infoBox = new SortaCanvas.Rectangle(-1000, -1000, 16, 150, 'gray', 'INFOBOX');
infoText = new SortaCanvas.Text(-1000, -1000, 'Sat #0', '12px Arial', 'white', false, 'INFOTEXT');
infoText.pick = false;
infoBox.pick = false; // disable picking
SortaCanvas.add(infoBox);
SortaCanvas.add(infoText);

const moveInfo = (x, y) => {
  infoBox.x = x;
  infoBox.y = y+12;
  infoText.x = infoBox.x + 2;
  infoText.y = infoBox.y + 12;
}

// Update orbits
const updateOrbits = () => {
  for (let sat of sats) {
    if (sat.orbitEarth == true) {
      sat.x = (75 * Math.cos(sat.orbitTime / 500)) + canv.width / 2 - sat.width / 2;
      sat.y = (75 * Math.sin(sat.orbitTime / 500)) + canv.height / 2 - sat.width / 2;
    }
    if (sat.orbitMoon == true) {
      sat.x = (25 * Math.cos(sat.orbitTime / 250)) + (moon.x + moon.width / 2) - sat.width / 2;
      sat.y = (25 * Math.sin(sat.orbitTime / 250)) + (moon.y + moon.height / 2) - sat.height / 2;
    }
    if (sat.orbitEarth === true || sat.orbitMoon === true) {
      sat.orbitTime++;
    }
  }
}


// Orbit moon around earth

const updateMoonOrbit = () => {
  moon.x = (100 * Math.cos(performance.now() / 20000)) + canv.width / 2 - moon.width / 2;
  moon.y = (100 * Math.sin(performance.now() / 20000)) + canv.height / 2 - moon.width / 2;
}

// Make satellite

window.makeSatellite = () => {
  let sat = new SortaCanvas.Image(0, 0, 25, 25, 'sat.png', 'SATELLITE');
  sat.dist = 50;
  sat.satNo = satCount;

  let satText = new SortaCanvas.Text(0, 0, String(satCount), '12px monospace', 'white', 'SATELLITE_TEXT');

  satLabels.push(satText);
  sats.push(sat);

  // network
  networkSatellites(sat);

  SortaCanvas.add(sat);
  SortaCanvas.add(satText);
  satCount++;
}

const removeSatelliteNet = (sa) => {
  for (let i = 0; i < satNets.length; i++) {
    let net = satNets[i];
    if (net.sat1 == sa || net.sat2 == sa) {
      SortaCanvas.remove(net);
      satNets.splice(i, 1);
      i--;
    }
  }
}

const networkSatellites = (sa) => {
  for (let sat of sats) {
    if (sat != sa) {
      // connect
      let ln = new SortaCanvas.Line([{
        // points
        x: sa.x,
        y: sa.y,
        toX: sat.x,
        toY: sat.y,
      }], 1, 'white', 'SATELLITE_NET');

      ln.sat1 = sa;
      ln.sat2 = sat;
      ln.pick = false;
      satNets.push(ln);
      SortaCanvas.add(ln);
    }
  }
}

const updateSatNets = () => {
  for (let ln of satNets) {
    let fr = new Vector2(ln.sat1.x, ln.sat1.y);
    let to = new Vector2(ln.sat2.x, ln.sat2.y);
    let dist = fr.distanceTo(to) / 10;
    let satStrength = Math.max(ln.sat1.dist, ln.sat2.dist);
    ln.strokeStyle = (satStrength < dist ? 'rgba(0,0,0,0)' : (satStrength / 1.5 < dist ? (window.hideWeak === false ? 'red' : 'rgba(0,0,0,0)') : (satStrength / 2 < dist ? (window.hideWeak === false ? 'yellow' : 'rgba(0,0,0,0)') : 'green')));
    ln.points[0].x = ln.sat1.x + ln.sat1.width / 2;
    ln.points[0].y = ln.sat1.y + ln.sat1.height / 2;
    ln.points[0].toX = ln.sat2.x + ln.sat2.width / 2;
    ln.points[0].toY = ln.sat2.y + ln.sat2.height / 2;
  }
}

// Update sat labels
const updateSatLabels = () => {
  for (let i = 0; i < satLabels.length; i++) {
    let lbl = satLabels[i];
    if (lbl != 'EARTH') {
      let oth = sats[i];
      lbl.x = oth.x;
      lbl.y = oth.y;
    }
  }
}

// Render loop

const update = () => {
  requestAnimationFrame(update);
  updateSatLabels();
  updateSatNets();
  updateMoonOrbit();
  updateOrbits();
  SortaCanvas.render();
}

update();