// TODO
// - Skeppet ska inte kunna åka utanför skärmen
// ✓ Tilt på skeppet
// - Shield/glow på skepp

// ✓ Rotation på meteorer
// - Använda modeller för meteorer
// ✓ Endast ett collide-event per krock!
// ✓ Håll kvar meteorer på z-axeln

// ✓ Explodera meteorer
// - Explodera skepp
// ✓ Remove & dispose explosion pieces
// - Skjuta sönder meteorer

// - Intro
// - Outro
// - Pause?
// - Övre limit på svårighetsgrad (= hastighet)

// - Code cleaning!

import * as THREE from "three";
import * as CANNON from "cannon";
import * as Howler from "howler";
require("./cannondebugrenderer.js")(THREE, CANNON);
require("./OBJLoader.js")(THREE);
const mesh2shape = require("three-to-cannon");
import THREEx from "./threex.keyboardstate";

import bulle from "./test";
console.log(bulle);

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

let world;
let camera;
let scene;
let renderer;
let updateFns = [];

let cannonStorm = [];
let threeStorm = [];

let cannonMeteor;
let cannonGem;
let cannonExtraLife;

let cannonMeteors = [];
let cannonGems = [];
let cannonExtraLives = [];

let meteorCount = 0;

let threeMeteors = [];
let threeGems = [];
let threeExtraLives = [];

let initParticlePos = [];
var timeStep = 1 / 60;

let score = 0;
let bonus = 0;
let lives = 10;

let shotBody;
let threeShotMesh;

let regDetection = false;
let displayShots = [];
let threeShots = [];
let cannonShots = [];
let shootCount = 0;

let introDone = false;

// FILTER GROUPS
const SHIP = 1;
const METEORS = 2;
const SHOTS = 3;
const GEMS = 4;
const LIVES = 5;

// ADD SOUND EFFECTS
const bonusSound = new Howl({ src: "bonus.wav" });
const lifeSound = new Howl({ src: "life.wav" });
const crashSound = new Howl({ src: "crash.wav" });
const dieSound = new Howl({ src: "die.wav" });
const laserSound = new Howl({ src: "laser.mp3", volume: 0.5 });
const meteorExplosionSound = new Howl({
  src: "meteor_explosion.mp3",
  volume: 0.1
});
const music = new Howl({ src: "meteor_storm_theme.mp3", volume: 3 });

music.play();

// ADD WELCOME SCREEN
const welcomeContainer = document.createElement("div");
welcomeContainer.classList.add("welcome");
document.body.appendChild(welcomeContainer);

// ADD LOGO
const logoContainer = document.createElement("div");
const logo = document.createTextNode("METEOR STORM");
logoContainer.appendChild(logo);
welcomeContainer.appendChild(logoContainer);

// ADD PLAY BUTTON
const playContainer = document.createElement("div");
playContainer.classList.add("play");
const playParagraph = document.createElement("p");
const play = document.createTextNode("PLAY");

playParagraph.appendChild(play);
playContainer.appendChild(playParagraph);
welcomeContainer.appendChild(playContainer);

// ADD LIVES COUNTER
const livesContainer = document.createElement("div");
livesContainer.classList.add("lives");
let livesContent = document.createTextNode("Lives: " + lives);
livesContainer.appendChild(livesContent);
document.body.appendChild(livesContainer);

// ADD SCORE COUNTER
const scoreContainer = document.createElement("div");
scoreContainer.classList.add("score");
let scoreContent = document.createTextNode("Score: " + score);
scoreContainer.appendChild(scoreContent);
document.body.appendChild(scoreContainer);

// ADD GAME OVER TEXT
const gameOver = function(shipBody, threeShip) {
  // world.removeBody(shipBody);
  // scene.remove(threeShip);
  // dieSound.play();
  // music.fade(0.5, 0, 1000);
  const gameOverContainer = document.createElement("div");
  gameOverContainer.classList.add("game-over");
  gameOverContainer.innerHTML =
    '<p class="large">Game Over</p><p>Your Score: ' + (score + bonus) + "</p>";
  document.body.appendChild(gameOverContainer);

  const playAgainContainer = document.createElement("div");
  playAgainContainer.classList.add("play");
  const playAgainParagraph = document.createElement("p");
  const playAgain = document.createTextNode("PLAY AGAIN");
  playAgainParagraph.appendChild(playAgain);
  playAgainContainer.appendChild(playAgainParagraph);
  gameOverContainer.appendChild(playAgainContainer);
};

initCannon();

// CREATE THREE SCENE
scene = new THREE.Scene();

// ADD CAMERA TO THE SCENE
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

// INITIALIZE RENDERER
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);

// ADD AMMO COUNTER
displayShotsLeft();

setInterval(() => {
  displayShots.forEach(shot => {
    shot.visible = true;
  });
  shootCount = 0;
}, 1000 * 1);

function displayShotsLeft() {
  var displayShotGeometry = new THREE.BoxGeometry(5, 5, 5);
  var displayShotMaterial = new THREE.MeshLambertMaterial({ color: 0x4ef7da });

  var incrementPos = 0;
  for (var i = 0; i < 10; i++) {
    var cube = new THREE.Mesh(displayShotGeometry, displayShotMaterial);
    cube.position.set(10 + incrementPos, 5, 110);
    incrementPos += 7;
    displayShots.push(cube);
    scene.add(cube);
  }
}

// CREATE BACKGROUND GRID
let ackY = 0;
let ackX = -1000;
let gridX = [];

for (var i = 0; i < 40; i++) {
  var lineMaterial = new THREE.LineBasicMaterial({
    color: 0x4ef7da,
    blending: THREE.AdditiveBlending
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

// EXPLOSION
const explosionParticleGeometry = new THREE.TetrahedronGeometry(2);

// PLACE EXPLOSION IN FRONT OF SHIP
const explode = function(explosionPos) {
  let explosion = new THREE.Group();
  let explosionParticles = [];

  for (let i = 0; i < 100; i++) {
    const explosionParticleMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      opacity: 1,
      transparent: true
    });

    explosionParticles[i] = new THREE.Mesh(
      explosionParticleGeometry,
      explosionParticleMaterial,
      0
    );

    explosionParticles[i].position.set(explosionPos.x, explosionPos.y + 30, 0);
    explosionParticles[i].rotationValueX = rand(-0.2, 0.2);
    explosionParticles[i].rotationValueY = rand(-0.2, 0.2);
    explosionParticles[i].velocity = new THREE.Vector3(
      rand(-2, 2),
      rand(-2, 1),
      rand(-2, 2)
    );
    explosion.add(explosionParticles[i]);
  }

  scene.add(explosion);

  // ANIMATE EXPLOSION PARTICLES
  updateFns.push(() => {
    explosion.children.forEach(particle => {
      particle.rotation.x += particle.rotationValueX;
      particle.rotation.y += particle.rotationValueY;
      particle.position.y -= particle.velocity.y;
      particle.position.x -= particle.velocity.x;
      particle.position.z -= particle.velocity.z;
      particle.material.opacity -= 0.003;
    });
  });

  // REMOVE AND DISPOSE EXPLOSION PARTICLES AFTER 5 SECONDS
  setTimeout(function() {
    explosion.children.forEach(particle => {
      scene.remove(particle);
      // particle.dispose()
      particle.geometry.dispose();
      particle.material.dispose();
      // particle.texture.dispose()
    });
    scene.remove(explosion);
  }, 6000);
};

function makeStormParticles(
  shape,
  name,
  number = 100,
  mass = 5,
  collisionFilterGroup = METEORS,
  collisionFilterMask = SHIP | SHOTS,
  speed = [-3, -1],
  positionX = [-1000, 1000],
  positionY = [500, 2000],
  velocityX = [-0.3, 0.3],
  velocityY = [-300, 100],
  impulseForce = [-50, 50],
  impulsePoint = [-30, 30]
) {
  switch (shape) {
    case "meteor":
      shape = new CANNON.Box(new CANNON.Vec3(10, 10, 10));
      break;
    case "gem":
      shape = new CANNON.Sphere(10);
      break;
    case "extraLife":
      shape = new CANNON.Sphere(10);
      break;
  }
  console.log(shape);
  let cannonStormParticle;

  for (var i = 0; i < number; i++) {
    cannonStormParticle = new CANNON.Body({
      mass: mass,
      collisionFilterGroup: collisionFilterGroup,
      collisionFilterMask: collisionFilterMask
    });
    cannonStormParticle.addShape(shape);

    // GIVE STORM PARTICLE A NAME
    cannonStormParticle.name = name;

    // PLACE STORM PARTICLES RANDOMLY ON CANVAS AND GIVE THEM RANDOM VELOCITY
    initParticlePos.push(rand(speed[0], speed[1]));
    cannonStormParticle.position.set(
      rand(positionX[0], positionX[1]),
      rand(positionY[0], positionY[1]),
      0
    );
    cannonStormParticle.velocity.set(
      rand(velocityX[0], velocityX[1]),
      rand(velocityY[0], velocityX[1]),
      0
    );

    // APPLY RANDOM FORCE TO ROTATE BODY
    cannonStormParticle.applyLocalImpulse(
      new CANNON.Vec3(
        rand(impulseForce[0], impulseForce[1]),
        rand(impulseForce[0], impulseForce[1]),
        rand(impulseForce[0], impulseForce[1])
      ),
      new CANNON.Vec3(
        rand(impulsePoint[0], impulsePoint[1]),
        rand(impulsePoint[0], impulsePoint[1]),
        rand(impulsePoint[0], impulsePoint[1])
      )
    );

    world.addBody(cannonStormParticle);
    cannonStorm.push(cannonStormParticle);
  }
}

// CREATE CANNON.JS WORLD
// CREATE CANNON.JS WORLD
function initCannon() {
  world = new CANNON.World();
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;

  // CREATE 10 CANNON.JS GEMS
  makeStormParticles(
    "gem",
    10, // Number
    2, // Mass
    GEMS, // Collision filter group
    SHIP, // Collision filter mask
    "Gem", // Name
    [-3, -1], // Speed
    [-700, 700], // X position
    [500, 2000], // Y position
    [-0.3, 0.3], // X velocity
    [-300, 100], // Y velocity
    [-20, 20], // Impulse force
    [-30, 30] // Impulse point
  );

  // CREATE 2 CANNON.JS EXTRA LIVES
  makeStormParticles(
    "extraLife",
    2, // Number
    2, // Mass
    LIVES, // Collision filter group
    SHIP, // Collision filter mask
    "ExtraLife", // Name
    [-3, -1], // Speed
    [-700, 700], // X position
    [500, 2000], // Y position
    [-0.3, 0.3], // X velocity
    [-300, 100], // Y velocity
    [-20, 20], // Impulse force
    [-30, 30] // Impulse point
  );
} // Close initCannon()

// CREATE THREE.JS METEORS
const meteorGeometry = new THREE.BoxGeometry(20, 20, 20);
const meteorMaterial = new THREE.MeshLambertMaterial({ color: 0x4ef7da });

cannonMeteors.forEach(meteor => {
  const cube = new THREE.Mesh(meteorGeometry, meteorMaterial);
  scene.add(cube);
  threeMeteors.push(cube);
});

// CREATE THREE.JS GEMS
const gemGeometry = new THREE.IcosahedronGeometry(10);
const gemMaterial = new THREE.MeshLambertMaterial({ color: 0xffea49 });

cannonGems.forEach(gem => {
  const cube = new THREE.Mesh(gemGeometry, gemMaterial);
  scene.add(cube);
  threeGems.push(cube);
});

// CREATE THREE.JS EXTA LIVES
const extraLifeGeometry = new THREE.IcosahedronGeometry(10);
const extraLifeMaterial = new THREE.MeshLambertMaterial({ color: 0xf189f7 });

cannonExtraLives.forEach(extraLife => {
  const cube = new THREE.Mesh(extraLifeGeometry, extraLifeMaterial);
  scene.add(cube);
  threeExtraLives.push(cube);
});

// CREATE SHIP
// INSTANTIATE A LOADER
var loader = new THREE.OBJLoader();

// LOAD A RESOURCE
loader.load(
  // RESOURCE URL
  "spaceship.obj",
  // CALLED WHEN RESOURCE IS LOADED
  function(threeShip) {
    threeShip.scale.set(0.05, 0.05, 0.05);
    threeShip.rotation.x = 6.3;
    threeShip.rotation.z = 3.13;
    threeShip.position.y = -100;

    const shipNewMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });

    const cannonShip = mesh2shape(threeShip, { type: mesh2shape.Type.SPHERE });
    cannonShip.radius = 10;
    const shipBody = new CANNON.Body({
      collisionFilterGroup: SHIP,
      collisionFilterMask: GEMS | LIVES | METEORS
    });
    shipBody.addShape(cannonShip);
    shipBody.position.y = -100;

    world.addBody(shipBody);

    // MOVE SHIP FORWARD ON GAME START
    const playButton = document.querySelector(".play p");
    playButton.addEventListener("click", e => {
      welcomeContainer.classList.add("hide");
      renderer.domElement.focus();

      makeStormParticles("meteor", "Meteor");

      console.log(shipBody);
      updateFns.push(() => {
        if (!introDone) {
          setTimeout(() => {
            if (shipBody.position.y < 11) {
              shipBody.position.y += 1;
              threeShip.position.y += 1;
              if (shipBody.position.y === 10) {
                introDone = true;
              }
            }
          }, 200);
        }
      });
      // move ship to game position
      // run meteor function
      // run gem function
      // run extra lives function
    });
    // ADD COLLIDE EVENT LISTENER
    shipBody.addEventListener("collide", e => {
      // console.log('Skeppet krockade med ' + e.body.name)

      if (e.body.name === "Meteor") {
        if (lives > 0) {
          lives--;
          explode(e.target.position);
          crashSound.play();
          // e.body.velocity.set(-500, 500, 500)
          e.body.position.set(rand(-1000, 1000), rand(2000, 2500), 0);
        }

        if (lives === 0) {
          // lives = 0
          gameOver(shipBody, threeShip);
        }
      }

      if (e.body.name === "Gem") {
        bonus += 5000;
        bonusSound.play();
        e.body.position.set(rand(-1000, 1000), rand(2000, 2500), 0);
      }

      if (e.body.name === "ExtraLife") {
        lives++;
        lifeSound.play();
        e.body.position.set(rand(-1000, 1000), rand(2000, 2500), 0);
      }
    });

    // SHOOTING
    var fired = false;
    window.addEventListener("keydown", e => {
      if (!fired && e.keyCode === 32 && shootCount < 10) {
        fired = true;

        laserSound.play();

        // CREATE CANNON SHOT

        var gunShot = new CANNON.Cylinder(1, 1, 25, 32);
        var threeShotGroup = new THREE.Group();
        var cannonShotGroup = {};
        cannonShotGroup.children = [];

        for (var i = 0; i < 2; i++) {
          shotBody = new CANNON.Body({
            mass: 5,
            linearFactor: new CANNON.Vec3(1, 1, 1),
            collisionFilterGroup: SHOTS,
            collisionFilterMask: METEORS
          });

          shotBody.name = "Shot";

          if (i === 0) {
            shotBody.position.x = shipBody.position.x - 2.5;
          } else {
            shotBody.position.x = shipBody.position.x + 2.5;
          }

          shotBody.position.y = shipBody.position.y + 25;
          shotBody.position.z = shipBody.position.z;
          shotBody.velocity.set(0, 500, 0);
          shotBody.addShape(gunShot);
          cannonShotGroup.children.push(shotBody);
          world.addBody(shotBody);

          shotBody.addEventListener("collide", e => {
            var currentCube = e.body;
            meteorExplosionSound.play();
            currentCube.position.set(rand(-1000, 1000), rand(500, 2000), 0);

            threeShots.forEach((shot, index) => {
              scene.remove(shot);
              world.removeBody(cannonShots[index].children[0]);
              world.removeBody(cannonShots[index].children[1]);
              threeShots.splice(index, 1);

              cannonShots.splice(index, 1);
            });
          });

          // CREATE THREE SHOT

          // var threeShotGeometry = new THREE.CylinderGeometry(1, 1, 25, 32);
          //
          // threeShotMesh = new THREE.Mesh(
          //   threeShotGeometry,
          //   new THREE.MeshLambertMaterial({ color: 0xf6ef71 })
          // );
          // threeShotMesh.position.copy(shotBody.position);
          // threeShotGroup.add(threeShotMesh);

          // LASER BEAM
          var laserBeam = new THREEx.LaserBeam();
          laserBeam.object3d.scale.set(40, 40, 40);
          // laserBeam.object3d.position.set(0, 50, 0);
          laserBeam.object3d.rotation.set(0, 1.57, 1.58);
          laserBeam.object3d.position.y = shotBody.position.y;
          laserBeam.object3d.position.x = shotBody.position.x;
          threeShotGroup.add(laserBeam.object3d);
        }

        scene.add(threeShotGroup);
        threeShots.push(threeShotGroup);
        cannonShots.push(cannonShotGroup);

        //UPDATE SHOTS LEFT DISPLAY
        displayShots[displayShots.length - 1 - shootCount].visible = false;

        if (shootCount < 10) {
          shootCount++;
        }
      }

      // PREVENT MULTIPLE SHOTS ON KEYDOWN
      window.addEventListener("keyup", e => {
        fired = false;
      });
    });

    // MOVE SHIP FUNCTION
    function moveShip() {
      console.log("moveShip");
      //MOVE TO THE LEFT
      if (keyboard.pressed("left") && shipBody.position.x > -150) {
        shipBody.position.x -= 4;

        // // TILT LEFT
        if (threeShip.rotation.y > -1) {
          threeShip.rotation.y -= 0.1;
          // * delta;
        }
        // MOVE TO THE RIGHT
      } else if (keyboard.pressed("right") && shipBody.position.x < 150) {
        shipBody.position.x += 4;

        // TILT RIGHT
        if (threeShip.rotation.y < 1) {
          threeShip.rotation.y += 0.1;
          // * delta;
        }
      } else if (keyboard.pressed("up") && shipBody.position.y < 100) {
        shipBody.position.y += 4;
      } else if (keyboard.pressed("down") && shipBody.position.y > 10) {
        shipBody.position.y -= 4;
      } else if (threeShip.rotation.y > 0.5) {
        // RESET LEFT TILT ON KEY UP
        threeShip.rotation.y -= 0.1;
        // * delta
        // RESET RIGHT TILT ON KEY UP
      } else if (threeShip.rotation.y < 0) {
        threeShip.rotation.y += 0.1;
        // * delta
      } else {
        threeShip.rotation.y = 0;
      }

      // MAKE THREE SHIP FOLLOW PHYSICS BODY
      threeShip.position.copy(shipBody.position);
    }

    // REMOVE SHOT FUNCTION
    function removeShot() {
      if (shotBody) {
        threeShots.forEach((shot, index) => {
          var shotNum = index;
          shot.position.y = cannonShots[index].children[0].position.y - 70;
          if (shot.position.y > 300) {
            // shot.children[0].material.transparent = true;
            // shot.children[1].material.transparent = true;
            // shot.children[0].material.opacity -= 0.05;
            // shot.children[1].material.opacity -= 0.05;

            scene.remove(shot);

            world.removeBody(cannonShots[index].children[0]);
            world.removeBody(cannonShots[index].children[1]);

            threeShots.splice(index, 1);
            cannonShots.splice(index, 1);

            // if (shot.children[1].material.opacity < 0.1) {
            //   scene.remove(shot);
            //
            //   console.log(cannonShots);
            //   world.removeBody(cannonShots[index].children[0]);
            //   world.removeBody(cannonShots[index].children[1]);
            //
            //   threeShots.splice(index, 1);
            //   cannonShots.splice(index, 1);
            // }
          }
        });
      }
    } // END SHOOTING FUNCTION
    console.log();
    updateFns.push(() => {
      if (introDone) {
        meteorCount = 100;
        console.log("introDone");
        moveShip();
        removeShot();
      }
    });
    scene.add(threeShip);
  },
  // CALLED WHEN LOADING IS IN PROGRESSES
  function(xhr) {
    console.log(xhr.loaded / xhr.total * 100 + "% loaded");
  },
  // CALLED WHEN LOADING HAS ERRORS
  function(error) {
    console.log("An error happened");
  }
);

function animate() {
  requestAnimationFrame(animate);
  cannonDebugRenderer.update();

  updatePhysics();
  updateGrid();
  updateScore();
  updateLives();

  render();

  updateFns.forEach(fn => {
    fn();
  });
}
animate();

function updatePhysics() {
  // STEP THE PHYSICS WORLD
  world.step(timeStep);

  // COPY COORDINATES FROM CANNON.JS TO THREE.JS
  cannonMeteors.forEach((meteor, index) => {
    threeMeteors[index].position.copy(meteor.position);
    meteor.position.y += initMeteorPos[index] - score / 500;
    meteor.position.z = 0;

    threeMeteors[index].quaternion.copy(meteor.quaternion);

    // PUT OBJECT BACK IN STORM
    if (
      meteor.position.y < -10 ||
      meteor.position.x > 1000 ||
      meteor.position.x < -1000
    ) {
      meteor.position.set(rand(-1000, 1000), rand(1000, 2000), 0);
      meteor.velocity.set(rand(-0.3, 0.3), rand(-300, 100), 0);
    }
  });

  cannonGems.forEach((gem, index) => {
    threeGems[index].position.copy(gem.position);
    threeGems[index].quaternion.copy(gem.quaternion);
    gem.position.y += initMeteorPos[index] - score / 500;
    gem.position.z = 0;

    // PUT OBJECT BACK IN STORM
    if (
      gem.position.y < -10 ||
      gem.position.x > 1000 ||
      gem.position.x < -1000
    ) {
      gem.position.set(rand(-700, 700), rand(1000, 2000), 0);
      gem.velocity.set(rand(-0.3, 0.3), rand(-300, 100), 0);
    }
  });

  cannonExtraLives.forEach((extraLife, index) => {
    threeExtraLives[index].position.copy(extraLife.position);
    threeExtraLives[index].quaternion.copy(extraLife.quaternion);
    extraLife.position.y += initMeteorPos[index] - score / 500;
    extraLife.position.z = 0;

    // PUT OBJECT BACK IN STORM
    if (
      extraLife.position.y < -10 ||
      extraLife.position.x > 1000 ||
      extraLife.position.x < -1000
    ) {
      extraLife.position.set(rand(-700, 700), rand(1000, 2000), 0);
      extraLife.velocity.set(rand(-0.3, 0.3), rand(-300, 100), 0);
    }
  });
}

// MOVE BACKGROUND GRID
function updateGrid() {
  gridX.forEach(line => {
    if (line.position.y < 0) {
      line.position.y = 2000;
    }
    line.position.y -= 2;
  });
}

// UPDATE SCORE COUNTER
function updateScore() {
  if (lives > 0) {
    score++;
    scoreContent.textContent = `Score: ${score + bonus}`;
  }
}

// UPDATE LIVES COUNTER
function updateLives() {
  livesContent.textContent = `Lives: ${lives}`;
}

function render() {
  renderer.render(scene, camera);
}
