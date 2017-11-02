"use strict";

import * as THREE from "three";
require("./threejs/loaders/obj-loader")(THREE);
import THREEx from "./threex.keyboardstate";

// INITIALIZE RENDERER
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// INITIALIZE KEYBOARD CONTROLS
var keyboard = new THREEx.KeyboardState(renderer.domElement);
renderer.domElement.setAttribute("tabIndex", "0");
renderer.domElement.focus();
let updateFcts = [];

const randomNumber = function(min, max) {
  return Math.random() * (max - min) + min;
};

const scene = new THREE.Scene();

// Add camera and set position
const camera = new THREE.PerspectiveCamera(
  75, // Fov
  window.innerWidth / window.innerHeight,
  0.1, // Near
  1000 // Far
);

camera.position.set(0, -70, 100);
camera.rotation.set(20, 0, 0);

// const helper = new THREE.CameraHelper(camera)
// scene.add(helper)

// const axis = new THREE.AxisHelper(10)
// scene.add(axis)

// Set lighting for the scene
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(10, 50, 130);
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0xf0f0f0, 0.3);
scene.add(ambientLight);

let meteors = [];
const meteorMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
const meteorGeometry = new THREE.BoxGeometry(20, 20, 20);

let gems = [];
const gemMaterial = new THREE.MeshLambertMaterial({ color: 0xf2f24e });
const gemGeometry = new THREE.IcosahedronGeometry(10);

let meteorStorm = new THREE.Group();

// Create 100 meteors and 10 gems and randomly place them in the canvas
for (var i = 0; i < 100; i++) {
  meteors[i] = new THREE.Mesh(meteorGeometry, meteorMaterial);
  meteors[i].position.y = randomNumber(200, 1200);
  meteors[i].position.x = randomNumber(-1000, 1000);

  meteorStorm.add(meteors[i]);
}

for (var i = 0; i < 10; i++) {
  gems[i] = new THREE.Mesh(gemGeometry, gemMaterial);
  gems[i].position.y = randomNumber(200, 1200);
  gems[i].position.x = randomNumber(-800, 800);

  meteorStorm.add(gems[i]);
}

// Give each child of the meteor group random rotation values
meteorStorm.children.forEach(child => {
  child.rotationValueX = randomNumber(-0.02, 0.02);
  child.rotationValueY = randomNumber(-0.02, 0.02);
  child.speed = randomNumber(1, 3);
  child.direction = randomNumber(-0.3, 0.3);
});

scene.add(meteorStorm);

//////////////////////////////////////////////////////////////////////////////////
//		add spaceship				//
//////////////////////////////////////////////////////////////////////////////////
// instantiate a loader
var loader = new THREE.OBJLoader();

// load a resource

loader.load(
  // resource URL
  "B2_full.obj",
  // Function when resource is loaded
  (ship, delta) => {
    ship.traverse(function(node) {
      const basicMaterial = new THREE.MeshNormalMaterial({
        // color: 0xff00ff,
        opacity: 1
      });
      if (node.geometry) {
        node.material.side = THREE.FrontSide;

        node.material = basicMaterial;
      }

      // DON'T USE DAT GUI
      ship.rotation.x = 6;
      ship.rotation.y = 0;
      ship.rotation.z = 3.13;
      ship.scale.x = 0.2;
      ship.scale.y = 0.2;
      ship.scale.z = 0.2;
      ship.position.x = 0;
      scene.add(ship);
    });

    updateFcts.push(function(delta, now) {
      //////////////////////////////////////////////////////////////////////////////////
      //		MOVE SPACESHIP								//
      //////////////////////////////////////////////////////////////////////////////////
      //  MOVE TO THE LEFT
      if (keyboard.pressed("left")) {
        ship.position.x -= 150 * delta;

        // TILT LEFT
        if (ship.rotation.y > -1) {
          ship.rotation.y -= 2 * delta;
        }
        // MOVE TO THE RIGHT
      } else if (keyboard.pressed("right")) {
        ship.position.x += 150 * delta;

        // TILT RIGHT
        if (ship.rotation.y < 1) {
          ship.rotation.y += 2 * delta;
        }
        // RESET LEFT TILT ON KEY UP
      } else if (ship.rotation.y > 0.05) {
        ship.rotation.y -= 2 * delta;
        // RESET RIGHT TILT ON KEY UP
      } else if (ship.rotation.y < 0) {
        ship.rotation.y += 2 * delta;
      } else {
        ship.rotation.y = 0;
      }
    });
  }
);

//////////////////////////////////////////////////////////////////////////////////
//		render the scene						//
//////////////////////////////////////////////////////////////////////////////////
updateFcts.push(function() {
  renderer.render(scene, camera);
});

//////////////////////////////////////////////////////////////////////////////////
//		loop runner							//
//////////////////////////////////////////////////////////////////////////////////
var lastTimeMsec = null;
requestAnimationFrame(function animate(nowMsec) {
  // keep looping
  requestAnimationFrame(animate);
  // ADD METEORS
  meteorStorm.children.forEach(child => {
    child.rotation.x += child.rotationValueX;
    child.rotation.y += child.rotationValueY;
    child.position.y -= child.speed;
    child.position.x -= child.direction;
  });

  // measure time
  lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
  var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
  lastTimeMsec = nowMsec;
  // call each update function
  updateFcts.forEach(function(updateFn) {
    updateFn(deltaMsec / 1000, nowMsec / 1000);
  });
});

window.scene = scene;
window.camera = camera;
