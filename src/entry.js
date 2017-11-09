import * as THREE from "three";
import * as CANNON from "cannon";
require("./OBJLoader.js")(THREE);
require("./cannondebugrenderer.js")(THREE, CANNON);

const mesh2shape = require("three-to-cannon");
import THREEx from "./threex.keyboardstate";

var world,
  mass,
  body,
  shape,
  camera,
  scene,
  renderer,
  geometry,
  material,
  material2,
  mesh,
  mesh2,
  b1,
  shotBody;

let updateFns = [];
let cannonParticles = [];
let threeParticles = [];
let smokeParticles = [];
let initMeteorPos = [];
let score = 0;
var timeStep = 1 / 60;
var regDetection = false;
var shots = [];

initThree();
initCannon();
smoke();
displayShotsLeft();
setInterval(displayShotsLeft, 1000 * 10);
function initThree() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, -70, 100);
  camera.rotation.set(20, 0, 0);

  scene.add(camera);
  // SET LIGHTING FOR THE SCENE
  const pointLight = new THREE.PointLight(0xffffff);
  pointLight.position.set(10, 50, 130);
  scene.add(pointLight);

  const ambientLight = new THREE.AmbientLight(0xf0f0f0, 0.3);
  scene.add(ambientLight);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000);
  document.body.appendChild(renderer.domElement);
} //end of init three function

// GRID
let ackY = 0;
let ackX = -1000;
let gridX = [];
for (var i = 0; i < 40; i++) {
  var lineMaterial = new THREE.LineBasicMaterial({
    color: 0x4ef7da
  });

  var lineXGeometry = new THREE.Geometry();
  lineXGeometry.vertices.push(new THREE.Vector3(-1000, 0, -30));
  lineXGeometry.vertices.push(new THREE.Vector3(1000, 0, -30));

  var lineX = new THREE.Line(lineXGeometry, lineMaterial);

  lineX.position.y = ackY;
  ackY += 100;
  gridX.push(lineX);
  scene.add(lineX);

  var lineYGeometry = new THREE.Geometry();
  lineYGeometry.vertices.push(new THREE.Vector3(0, -100, -30));
  lineYGeometry.vertices.push(new THREE.Vector3(0, 2000, -30));

  var lineY = new THREE.Line(lineYGeometry, lineMaterial);

  lineY.position.x = ackX;
  ackX += 50;

  scene.add(lineY);
}

// INITIALIZE CANNON DEBUG RENDERER
var cannonDebugRenderer = new THREE.CannonDebugRenderer(scene, world);
// INITIALIZE KEYBOARD CONTROLS
var keyboard = new THREEx.KeyboardState(renderer.domElement);
renderer.domElement.setAttribute("tabIndex", "0");
renderer.domElement.focus();

//////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function initCannon() {
  world = new CANNON.World();
  world.gravity.set(0, 0, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;

  // CREATE METEOR BODIES
  var boxShape = new CANNON.Box(new CANNON.Vec3(10, 10, 10));

  for (var i = 0; i < 100; i++) {
    b1 = new CANNON.Body({ mass: 5, linearFactor: new CANNON.Vec3(1, 1, 1) });
    b1.addShape(boxShape);

    initMeteorPos.push(rand(-3, -1));
    b1.position.set(rand(-1000, 1000), rand(500, 2000), 0);
    b1.velocity.set(rand(-0.3, 0.3), rand(-300, 100), 0);
    b1.linearDamping = 0;
    var q1 = new CANNON.Quaternion();
    q1.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI * 0.25);
    var q2 = new CANNON.Quaternion();
    q2.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI * 0.25);
    var q = q1.mult(q2);
    b1.quaternion.set(q.x, q.y, q.z, q.w);
    // b1.quaternion.set(q.x, q.y, q.z, q.w);

    world.addBody(b1);
    cannonParticles.push(b1);
    // demo.addVisual(b1);
  }
}

// instantiate a loader
var loader = new THREE.OBJLoader();

// load a resource
loader.load(
  // resource URL
  "spaceship.obj",
  // called when resource is loaded
  function(object) {
    object.scale.set(0.05, 0.05, 0.05);
    object.rotation.x = 6;
    object.rotation.z = 3.13;
    object.position.x = 0;
    object.position.y = 10;

    const shipNewMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const shipBoundingBoxMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff
    });

    object.children[0].material = shipNewMaterial;

    const cannonShip = mesh2shape(object, { type: mesh2shape.Type.SPHERE });
    cannonShip.radius = 15;
    console.log(cannonShip);
    const shipBody = new CANNON.Body({
      mass: 0
    });
    shipBody.addShape(cannonShip);
    world.addBody(shipBody);

    shipBody.addEventListener("collide", e => {
      regDetection = true;
      if (regDetection) {
        console.log("skeppet krockade");
        object.children[0].material.color.set(0x00ff00);
        score += 1;
        console.log(score);
      }
      console.log(regDetection);
    });

    // SHOOTING

    window.addEventListener("keydown", e => {
      if (e.keyCode === 32 && shots.length > 0) {
        console.log("hej");
        var gunShot = new CANNON.Box(new CANNON.Vec3(10, 10, 10));

        shotBody = new CANNON.Body({
          mass: 20,
          linearFactor: new CANNON.Vec3(1, 1, 1)
        });
        shotBody.addShape(gunShot);

        world.addBody(shotBody);
        shotBody.position.copy(shipBody.position);
        shots.pop().visible = false;
      }
    });

    // END SHOOTING

    updateFns.push(() => {
      if (shotBody !== undefined) {
        shotBody.position.y += 3;
      }

      //////////////////////////////////////////////////////////////////////////////////
      //		MOVE SPACESHIP								//
      //////////////////////////////////////////////////////////////////////////////////
      //MOVE TO THE LEFT
      if (keyboard.pressed("left")) {
        shipBody.position.x -= 3;

        // // TILT LEFT
        // if (shipBody.rotation.y > -1) {
        //   shipBody.rotation.y -= 2 * delta;
        // }
        // MOVE TO THE RIGHT
      } else if (keyboard.pressed("right")) {
        shipBody.position.x += 3;

        // TILT RIGHT
        // if (shipBody.rotation.y < 1) {
        //   shipBody.rotation.y += 2 * delta;
      } else if (keyboard.pressed("up")) {
        shipBody.position.y += 1;
      } else if (keyboard.pressed("down")) {
        shipBody.position.y -= 1;
      }
      // RESET LEFT TILT ON KEY UP
      // } else if (shipBody.rotation.y > 0.05) {
      //   shipBody.rotation.y -= 2 * delta;
      //   // RESET RIGHT TILT ON KEY UP
      // } else if (shipBody.rotation.y < 0) {
      //   shipBody.rotation.y += 2 * delta;
      // } else {
      //   shipBody.rotation.y = 0;
      // }

      object.position.copy(shipBody.position);

      // object.rotation.copy(shipBody.rotation);
    });

    scene.add(object);
  },
  // called when loading is in progresses
  function(xhr) {
    console.log(xhr.loaded / xhr.total * 100 + "% loaded");
  },
  // called when loading has errors
  function(error) {
    console.log("An error happened");
  }
);

function displayShotsLeft() {
  //CREATE SHOTS

  var displayShotGeometry = new THREE.BoxGeometry(5, 5, 5);
  var displayShotMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });

  var incrementPos = 0;
  for (var i = 0; i < 10; i++) {
    var cube = new THREE.Mesh(displayShotGeometry, displayShotMaterial);
    cube.position.set(10 + incrementPos, 5, 110);
    incrementPos += 7;
    shots.push(cube);
    scene.add(cube);
  }
}

// CREATE THREE PARTICLES
geometry = new THREE.BoxGeometry(20, 20, 20);
material = new THREE.MeshLambertMaterial({ color: 0xff00ff });

cannonParticles.forEach(particle => {
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  threeParticles.push(cube);
});

function animate() {
  requestAnimationFrame(animate);
  updatePhysics();
  cannonDebugRenderer.update();
  updateGrid();
  evolveSmoke();
  render();

  updateFns.forEach(fn => {
    fn();
  });
}
animate();

function updatePhysics() {
  // Step the physics world
  world.step(timeStep);

  // Copy coordinates from Cannon.js to Three.js

  cannonParticles.forEach((particle, index) => {
    threeParticles[index].position.copy(particle.position);
    threeParticles[index].quaternion.copy(particle.quaternion);
    // particle.position.x -= 0.3;
    particle.position.y += initMeteorPos[index];
    particle.position.z = 0;
    if (
      particle.position.y < -50 ||
      particle.position.x < -1000 ||
      particle.position.x > 1000
    ) {
      particle.position.set(rand(-1000, 1000), rand(500, 2000), 0);
      particle.velocity.set(rand(-0.3, 0.3), rand(-300, 100), 0);
    }
  });
}

function updateGrid() {
  gridX.forEach(line => {
    if (line.position.y < 0) {
      line.position.y = 2000;
    }
    line.position.y -= 2;
  });
}

function render() {
  renderer.render(scene, camera);
}

// SMOKE
function smoke() {
  const geometry = new THREE.CubeGeometry(200, 200, 200);
  const material = new THREE.MeshLambertMaterial({
    color: 0xaa6666,
    wireframe: false
  });
  const mesh = new THREE.Mesh(geometry, material);
  //scene.add( mesh );
  let cubeSineDriver = 0;

  // let textGeo = new THREE.PlaneGeometry(300, 300);
  THREE.ImageUtils.crossOrigin = ""; //Need this to pull in crossdomain images from AWS
  // let textTexture = THREE.ImageUtils.loadTexture(
  //   "https://s3-us-west-2.amazonaws.com/s.cdpn.io/95637/quickText.png"
  // );
  // let textMaterial = new THREE.MeshLambertMaterial({
  //   color: 0x00ffff,
  //   opacity: 1,
  //   map: textTexture,
  //   transparent: true,
  //   blending: THREE.AdditiveBlending
  // });
  // let text = new THREE.Mesh(textGeo, textMaterial);
  // text.position.z = 800;
  // scene.add(text);

  let light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(-1, 0, 1);
  scene.add(light);

  let smokeTexture = THREE.ImageUtils.loadTexture(
    "https://s3-us-west-2.amazonaws.com/s.cdpn.io/95637/Smoke-Element.png"
  );
  let smokeMaterial = new THREE.MeshLambertMaterial({
    color: 0x00dddd,
    map: smokeTexture,
    transparent: true
  });
  let smokeGeo = new THREE.PlaneGeometry(700, 700);
  console.log(smokeGeo);

  for (var p = 0; p < 5; p++) {
    var particle = new THREE.Mesh(smokeGeo, smokeMaterial);
    particle.position.set(
      Math.random() * 500 - 250,
      Math.random() * 500 - 250,
      rand(-1000, 0)
    );
    particle.rotation.z = Math.random() * 360;
    scene.add(particle);
    smokeParticles.push(particle);
  }
}

function evolveSmoke() {
  var sp = smokeParticles.length;
  while (sp--) {
    // smokeParticles[sp].rotation.z += 0.002;
  }
}
