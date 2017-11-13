export default function bulle() {
  ////////////////////////////////////////
  // MOVE SPACESHIP                    //
  ///////////////////////////////////////
  //MOVE TO THE LEFT
  if (keyboard.pressed("left") && shipBody) {
    console.log(shipBody.position.x);
  }
}
